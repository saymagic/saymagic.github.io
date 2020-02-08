---
layout: post
keywords: android，rxjava，线程
description: 理解RxJava线程模型
title: "理解RxJava线程模型"
categories: [Android]
tags: [ANDROID]
group: archive
icon: globe
---


> RxJava作为目前一款超火的框架，它便捷的线程切换一直被人们津津乐道，本文从源码的角度，来对RxJava的线程模型做一次深入理解。（注：本文的多处代码都并非原本的RxJava的源码，而是用来说明逻辑的伪代码）

## 入手体验

RxJava 中切换线程非常简单，例如最常见的异步线程处理，主线程回调的模型，可以很优雅的用如下代码来做处理：

```
Observable.just("magic")
        .map(str -> doExpensiveWork(str))
        .subscribeOn(Schedulers.io())
        .observeOn(AndroidSchedulers.mainThread())
        .subscribe(obj -> System.out.print(String.valueOf(obj)));
```

如上,`subscribeOn(Schedulers.io())`保证了`doExpensiveWork `函数发生在io线程，`observeOn(AndroidSchedulers.mainThread())`保证了`subscribe `回调发生在Android 的主线程。所以，这自然而然的引出了本文的关键点，`subscribeOn`与`observeOn`到底区别在哪里？

## 流程浅析

要想回答上面的问题，我们首先需要对RxJava的流程有大体了解，一个Observable从产生，到最终执行subscribe,中间可以经历n个变换，每次变换会产生一个新的Observable,就像奥运开幕的传递火炬一样，每次火炬都会传递到下一个人，最终点燃圣火的是最后一个火炬手，即最终执行subscribe操作的是最后一个Observable,所以，每个Observable之间必须有联系，这种关系在代码中的体现就是，每个变换后的Observable都会持有上一个Observable 中OnSubscribe对象的引用（Observable.create 函数所需的参数），最终 Observable的subscribe函数中的关键代码是这一句：

```
observable.onSubscribe.call(subscriber)

```
这个observable就是最后一个变换后的observable，那这个onSubscribe对象是谁呢？如何一个observable没有经过任何变换，直接执行了subscribe，当然就是我们在create中传入的onSubscribe， 但如果中间经过map、reduce等变换，这个onSubscribe显然就应该是创建变换后的observable传入的参数，大部分变换最终都交由lift函数：

```
public final <R> Observable<R> lift(final Operator<? extends R, ? super T> operator) {
    return new Observable<R>(new OnSubscribeLift<T, R>(onSubscribe, operator));
}
```

所以，上文所提到的onSubscribe对象应该是OnSubscribeLift的实例，而这个OnSubscribeLift所接收的两个参数，一个是前文提到的，上一个Observable中的OnSubscribe对象，而operator则是每种变换的一个抽象接口。再来看这个OnSubscribeLift对象的call方法：

```
public void call(Subscriber<? super R> o) {
	Subscriber<? super T> st = operator.call(o);
	parent.call(st);
｝
```

operator与parent就是前文提到的两个参数，可见，operator接口会拥有call方法，接收一个Subscriber， 并返回一个新的Subscriber对象，而接下来的`parent.call(st)`是回调上一层observable的onSubscribe的call方法,这样如此继续，一直到一个onSubscribe截止。这样我们首先理清了一条线路，就是从最后一个observable的subscribe后，OnSubscribe调用的顺序是从后向前的。

这就带来了另外一个疑问，从上面的代码可以看到，在执行`parent.call(st)`之前已经执行了`operator.call(o)`方法，如果call方法里就把变换的操作执行了的话，那似乎变换也会是从后向前传递的呀？所以这个`operator.call`方法绝对不是我们想象的那么简单。这里以map操作符为例，看源码：

```
public Subscriber<? super T> call(final Subscriber<? super R> s) {
    MapSubscriber<T, R> parent = new MapSubscriber<T, R>(o, transformer);
    o.add(parent);
    return parent;
}
```
这里果然没有执行变换操作，而是生成一个MapSubscriber对象，这里需要注意MapSubscriber构造函数的两个参数，transformer是真正要执行变换的Func1对象，这很好理解，那对于o这个Subscriber是哪一个呢？什么意思？举个🌰：

o1 -> o2  -> subscribe(Subscriber s0);

o1 经过map操作变为o2， o2执行subscribe操作，如果你理解上文可以知道，这段流程的执行顺序为s0会首先传递给o2， o2的lift操作会将s0转换为s1传递给o1, 那么在生成o2
这个map操作的` call(final Subscriber<? super R> s)`方法中，s值得是谁呢？是s0还是s1呢？答案应该是s0，也就是它的下一级Subscriber，原因很简单，call方法中返回的MapSubscriber对象parent才是s1.

所以，我们来看一下MapSubscriber的onNext方法做了什么呢？

```
public void onNext(T t) {
    R result;
    result = transformer.call(t);
    s.onNext(result);
}
```

很明了，首先执行变换，然后回调下一级的onNext函数。

至此，一个observable从初始，到变换，再到subscribe，我们已经对整个流程有了大体了解。简单来讲一个o1经过map变为o2,可以理解为o2对o1做了一层hook，会经历两次流程，首先是onSubscribe对象的call流程会从o2流向o1,我们简称流程a，到达o1后,o1又会出发Subscriber的onNext系列流程，简称流程b,流程b才是真正执行变换的流程，其走向是从o1流向o2.理解了这个，我们就可以更近一步的理解RxJava中线程的模型了。

tip： 一定要深刻理解流程a与流程b的区别。这对下文理解线程切换至关重要。

## 切换方式


RxJava对线程模型的抽象是`Scheduler`，这是一个抽象类，包含一个抽象方法：

```
 public abstract Worker createWorker();
```

这个`Worker`是何方神圣呢？它其实是Scheduler的抽象内部类，主要
包含两个抽象方法：

```
 1) public abstract Subscription schedule(Action0 action);

 2) public abstract Subscription schedule(final Action0 action, final long delayTime, final TimeUnit unit);
```

可见，Worker才是线程执行的主力，两个方法一个用与立即执行任务，另一个用与执行延时任务。而Scheduler是Worker的工厂，用于对外提供Worker。


RxJava中共有两种常见的方式来切换线程，分别是subscribeOn变换与observeOn变换，这两者接收的参数都是Scheduler。接下来从源码层面来对比这两者的差别。

### subscribeOn

首先看subscribeOn的部分

```
public final Observable<T> subscribeOn(Scheduler scheduler) {
    return create(new OperatorSubscribeOn<T>(this, scheduler));
}
```
create一个新的Observable，传入的参数是OperatorSubscribeOn，很明显这应该是OnSubscribe的一个实现，关注这个OperatorSubscribeOn的call实现方法：

```
public void call(final Subscriber<? super T> subscriber) {
     final Worker inner = scheduler.createWorker();
     inner.schedule(new Action0() {
           	@Override
            public void call() {
                final Thread t = Thread.currentThread();

                Subscriber<T> s = new Subscriber<T>(subscriber) {
                    @Override
                    public void onNext(T t) {
                        subscriber.onNext(t);
                    }

                    ...

                };

                source.unsafeSubscribe(s);
            }
    });
}
```

这里比较关键了，上文提到了流程a与流程b，首先明确一点，这个call方法的执行时机是流程a，也就是说这个call发生在流程b之前，call方法里首先通过外部传入的scheduler创建Worker - inner对象，接着在inner中执行了一段代码，神奇了，Action0中call方法这段代码就在worker线程中执行了，也就是此刻程进行了切换。注意最后一句代码`source.unsafeSubscribe(s)`，source 代表创建OperatorSubscribeOn对象是传进来的上一个Observable, 这句的源码如下：

```
public final Subscription unsafeSubscribe(Subscriber<? super T> subscriber) {
            return onSubscribe.call(subscriber);
}
```

和上文提到的lift方法中OnSubscribeLift对象的call方法中`parent.call(st)`作用类似，就是将当前的Observable与上一个Observable通过onSubscribe关联起来。

至此，我们可以大致了解了subscribeOn的原理，它会在流程a就进行了线程切换，但由于流程a上实际上都是Observable之间串联关系的代码，并且是从后面的Observable流向前面的Observable，这带来的一个隐含意思就是，对于流程b而言，最早的subscribeOn会屏蔽其后面的subscribeOn！ 比如：

```
Observable.just("magic")
          .map(file -> doExpensiveWork(file))
          .subscribeOn(Schedulers.io())
          .subscribeOn(AndroidSchedulers.mainThread())
          .subscribe(obj -> doAction(obj)));

```

这段代码中无论是doExpensiveWork函数还是doAction函数，都会在io线程出触发。


### observeOn

理解了subscribeOn，那理解observeOn就会更容易一下，observeOn函数最终会转换到这个函数：

```
public final Observable<T> observeOn(Scheduler scheduler, boolean delayError, int bufferSize) {
        return lift(new OperatorObserveOn<T>(scheduler, delayError, bufferSize));
}
```

很明显，这是做了一次lift操作，我们需要关注OperatorObserveOn这个Operator，查看其call方法：

```
public Subscriber<? super T> call(Subscriber<? super T> child) {
    ObserveOnSubscriber<T> parent = new ObserveOnSubscriber<T>(scheduler, child, delayError, bufferSize);
    parent.init();
    return parent;
}
```

这里返回的是一个ObserveOnSubscriber对象，我们关注这个Subscriber的`onNext`函数，

```
public void onNext(final T t) {
    schedule();
}
```
它只是简单的执行了schedule函数，来看下这个schedule：

```
protected void schedule() {
        recursiveScheduler.schedule(this);
}
```
这里乱入的recursiveScheduler.schedule是什么鬼？它并不神奇，它就是ObserveOnSubscriber构造函数传进来的scheduler创建的worker：

```
this.recursiveScheduler = scheduler.createWorker();
```

所以，magic再次产生，observeOn在其onNext中进行了线程的切换，那这个onNext是在什么时候执行的呢？通过上文可知，是在流程b中。所以observeOn会影响其后面的流程，直到出现下一次observeOn或者结束。

## 周边技巧

###  线程模型的选择

RxJava为我们内置了几种线程模型，主要区别如下：

* computation

	内部是一个线程，线程池的大小cpu核数：`Runtime.getRuntime().availableProcessors()`,这种线程比较适合做纯cpu运算，如求100亿以内的斐波那契数列的和之类。

* newThread

	每次createWorker都会生成一个新的线程。

* io

	与newThread类似，但内部是一个没有上线的线程池，一般来讲，使用io会比newThread好一些，因为其内部的线程池可以重用线程。

* immediate

	在当前线程立即执行

* trampoline

    在当前线程执行，与immediate不同的是，它并不会立即执行，而是将其存入队列，等待当前Scheduler中其它任务执行完毕后执行，这个在我们时常使用的并不多，它主要服务于repeat ，retry这类特殊的变换操作。

* from

	接收一个Executor，允许我们自定义Scheduler。




### Scheduler.Worker强势抢镜

其实RxJava中的Worker完全可以抽出来为我所用，如下面这种写法，就是新开线程执行了一个action。

```
 Scheduler.Worker worker = Schedulers. newThread().createWorker();
 worker.schedule(new Action0() {
            @Override
            public void call() {
                throw new RuntimeException("surprise");
            }
        });
```

当然，你要选择合适的时机去关闭（`unsubscribe`）worker来释放资源。

### 自带光环的操作符

某些操作符是有默认的线程模型的，比如前文提到的repeat 与retry会默认在trampoline线程模型下执行， buffer ，debounce之类会默认切换到computation。这里不做深入探讨，只是当你遇到某些问题时记得，有些人物是自带装备与光环的。

![I don't think you're right](/pic/understand-rxjava-threading-model/8aMiaV16NGxJX45F9Nx3boROfXXEnZjFrakfDniblWtqBY8Oj7pIHUgy2OP0JQaCEmQdHPkKsfRLarwjxW6tVP3g.gif)

## 总结

理解RxJava的线程模型最重要的是要与我们平常对异步的理解来区分开：

```

doAsync("magic", new Callback() {
    @Override
    public void handle(Object msg) {
        a) ....
    }
});

b)....

```

这是之前我们常写的代码，通常只会区分UI线程和非UI 线程，doAsync函数开始后，程序进行了分流，一个线程在执行一个doAsync， 另一个线程在执行b段代码。RxJava另辟蹊径，对整个线程做了抽象，RxJava的处理顺序像一条流水，这不仅仅表现在代码写起来像一条锁链上，逻辑上也是如此，对Observable自身而言，更改线程只是变换了流水前进的轨道，并不是进行分流，Android中常见
非UI线程处理数据，UI 线程展示数据也只是这条流水变换的一种方式。

就我个人的理解，对于RxJava的线程切换，把它理解为异步，非异步，阻塞，非阻塞都有些不恰当，grc比较合理的理解是：`执行的操作是异步的，但是保证程序的执行顺序是同步的`, 这一点和JS中的Promise就有神似的地方了。
