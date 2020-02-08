---
layout: post
keywords: android, java, okio, 设计
description: understanding the Clever design of okio/ 理解okio的巧妙设计 
title: 浅谈OKio
categories: [Android]
tags: [Optimization]
group: archive
icon: globe
---

> OKio 是square公司开源的一款便于IO操作的工具库。因为该库仅有十几个类，花不多的时间就可以通读。所以本文并不会设计过多源码的分析，仅简单阐述在读过OKio源码后，对其设计方面的粗浅理解。

### Example

假设我们想实现这样一个功能，将文件a进行备份。使用OKio可以一行代码来完成：

```
Okio.buffer(Okio.source(new File(FILE_PATH))).readAll(OKio.buffer(Okio.sink(new File(FILE_NEW_PATH)));
```

### 设计

  没有使用过OKio的朋友看到上面的代码可能一脸疑惑，感觉调用了好多东西的样子，远没有我们项目中的`FileUtil.copy(sourceFileA, toFileB)`来的简单易用。没错，虽然都是一行代码来完成，但OKio中的营养可远比我们随手写的***Util多的多。我们细细说来。

OKio的定位本身就不局限于对文件进行操作，操作的对象可能是socket、也有可能是内存中的byte数组，所以不可能为每种对象都编写一个util方法，更合理的做法是对数据进行抽象。在OKio中，将所有的输入称为`Source`，将所有的输出称为`Sink`, `Source`与`Sink`定义了对外提供的接口。 OKio所做的，就是实现原始数据与`Source`与`Sink`间的互动。更简而言之，其实是为使用者屏蔽了数据处理的细节。

### 实现

#### 缓冲

上面的描述仅仅是个非常笼统的概括，将输入与输出抽象出来仅仅是设计上的功劳，但具体的细节代码该怎么写才能将IO操作达到内存、速度间的平衡就需要数据结构等多方面的能力了。OKio在这方面做的相当的优秀。
首先，OKio实际对外工作的并不是`Source`与`Sink`，因为`Source`与`Sink`只提供了最基础的`read`和`write`方法，抽象程度过低。真正对外的是它们的实现类`RealBufferedSource`与`RealBufferedSink`。这两个类实现了对IO的缓冲，将原来面向流的数据模型转化为面向缓冲的模型，两个模型间的区别主要在于面向流的结构每次只能读一个或多个字节，直到读取完所有字节，数据不能前后移动。面向缓冲的结构会将数据读取到一个缓冲区，使用者可以按需在缓冲区中进行移动或者快速拷贝，这提高了对数据处理的灵活性。但相对而言面向缓冲的一个特点是每次操作数据时都要保证数据已被导入到缓冲中。`RealBufferedSource`与`RealBufferedSink` 中的很多代码都在做这个事情。

另外，面向缓冲的模型也实现了对数据进行分块处理，这可以提高IO的吞吐率。类似于我们在传统IO操作中，会使用一个byte数组+while循环的形式进行IO处理。OKio在这里做的更优秀的地方有几点：

* 增加了超时机制，调用者可按需选择同步超时与异步超时两种形式。
* OKio中的缓冲最终通过名为Segment的循环双链表来实现，每个Segment中维护了一个byte数组用于数据的缓冲。对缓存数据通过pos、limit两个标记来进行操作，实现了数据的快速管理。
* Segment归属SegmentPool管理，SegmentPool是一个典型的对象池，无用的Segment需要通过SegmentPool进行回收，新增Segment需要通过SegmentPool进行获取。这样做一定程度避免重复创建对象。降低了GC的频率。



#### 超时

前文也提到过，OKio中自带超时机制，并且分为同步超时检测和异步超时检测。我们分别来看一下它如何来实现超时的。

##### 同步超时

同步的检测时机发生在Sink/Source的write/read方法中，每次执行数据操作时，会首先调用`timeout.throwIfReached()`函数：

```
 public void throwIfReached() throws IOException {
    if (Thread.interrupted()) {
      throw new InterruptedIOException("thread interrupted");
    }

    if (hasDeadline && deadlineNanoTime - System.nanoTime() <= 0) {
      throw new InterruptedIOException("deadline reached");
    }
  }
```

这个函数只是简单的判断下是否已经超时，超时后抛出异常给调用者。但因为此种超时检测受限于write/read方法调用的次数、参数等因素，并不能保证非常准确的超时检测。比较适用于内存、文件类IO阻塞不明显的情况使用。

##### 异步超时

异步超时主要服务于读写操作产生阻塞相对明显的IO对象，如Socket。异步超时的相关代码在`AsyncTimeout`类中，此种方法的主要逻辑在于开启新的线程watchDog，来看守所有需要异步超时检测的对象。以write函数为例：

```
enter();
try {
     sink.write(source, toWrite);
     byteCount -= toWrite;
     throwOnTimeout = true;
} catch (IOException e) {
     throw exit(e);
} finally {
     exit(throwOnTimeout);
}
```

在执行`sink.write`方法之前会先调用`enter`函数，这个函数的作用就是将当前对象放置到watchDog的检测队列中。在finally的时候，`exit`函数会负责检测整个write操作是否产生了超时。如超时，抛出异常。这就是OKio异步超时检测的原理。当然，具体的代码中还包括了watchDog的死亡与重启动、超时回掉的实现等等都比较值得学习，这里不一一展开。

对比两种方式，同步的机制无法检测到单一一次的write/read是否发生超时，更准确的说上一次的超时需要通过下一次的write/read来触发。但异步可以保证当次write/read超时后及时抛出超时异常。

---

相对于传统的BIO,OKio与其本质并没有发生变化。实现来讲，OKio只不过是对BIO的封装。设计来讲，整体都是通过对输入与输出进行抽象，对外提供接口的方式来工作。包括扩展的方式，也都是通过装饰模式来进行。但就像OKio对自己的描述`A modern I/O API for Java `, OKio的确比传统BIO提供了更多符合现在软件开发的常用接口。另外一方面，传统的BIO的输入与输出在本质上是没有连接的，比如我们希望将一个输入转到另外的输出，必须通过中间人来实现数据的中转, 下面的buf就是中间人。

```
byte[] buf = new byte[8192];
int read;
while((read = is.read(buf)) != -1) {
    os.write(buf, 0, read);
}
```

但在OKio 中，输入与输出是可以产生连接的，它们在OKio的眼中都是Buffer, 就像我们最开始提出的将文件进行备份，一行代码就可以了，就像一条流一样，没有间断。如果我们现在对上面的代码进行拆解的话，就会很容易理解了：


>1.输入：`OKio.source(new File(FILE_PATH)）`
>
 2.输入缓冲：`Okio.buffer(Okio.source(new File(FILE_PATH)))`
 
>3.输出：`Okio.sink(new File(FILE_NEW_PATH)`
 
> 4.输出缓冲：`OKio.buffer(Okio.sink(new File(FILE_NEW_PATH))`
> 
 5.输入读取到输出：`Okio.buffer(Okio.source(new File(FILE_PATH))).readAll(OKio.buffer(Okio.sink(new File(FILE_NEW_PATH)))`


可以看到，无论我们想更改输入或者输出，代码更改量都是很少的。好的设计就是既有灵活性，又可以避免使用者看到过多的内部细节。

另外，最近看了一篇名为[通用IO的设计](http://www.jroller.com/rickard/entry/a_generic_input_output_api)的文章。在异常处理方面，大多数IO框架为了接口的统一性，都直接在方法上声明IOException表示可能产生IO异常。该篇文章中使用范型的方式处理IO异常也很值得学习。

