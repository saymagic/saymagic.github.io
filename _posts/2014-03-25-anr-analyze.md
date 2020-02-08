---
layout: post
keywords: ANR,android,ANR处理,traces.txt
description: 本文介绍android应用程序出现ANR时所采取的一般措施。
title: ANR解析
categories: [Android]
tags: [ANDROID]
group: archive
icon: globe
---

###  1.什么是ANR

   在Android上，如果你的应用程序有一段时间响应不够灵敏，系统会向用户显示一个对话框，这个对话框称作应用程序无响应**（ANR：Application Not Responding）**对话框。用户可以选择让程序继续运行，但是，他们在使用你的应用程序时，并不希望每次都要处理这个对话框。因此，在程序里对响应性能的设计很重要，这样，系统不会显示ANR给用户。


###  2.ANR产生的原因

ANR产生的根本原因是APP阻塞了UI线程。在android系统中每个App只有一个UI线程，是在App创建时默认生成的，UI线程默认初始化了一个消息循环来处理UI消息，ANR往往就是处理UI消息超时了。那么UI消息来源有哪些呢？主要有两种来源：


####  2.1 来自于AMS的回调消息

在Android系统中，应用程序是有Android的四大组件组成，AMS负责对应用程序四大组件生命周期的管理，当AMS对应用程序组件的生命周期进行回调超过AMS定义的响应时间时，AMS就会报ANR。出现这种情况，一般是因为在这些组件的回调函数里面进行了耗时操作（如网络操作、SD卡文件操作、数据库操作、大量计算等），AMS对组件常见的回调函数及超时时间如下：

	Activity: onCreate(), onResume(), onDestroy(),
	onKeyDown(), onClick()等，超时时间5s

	Application: onCreate(), onTerminate()等，超时时间5s

	Service: onCreate(), onStart(), onDestroy()等，超时时间20s

	BroadcastReceiver：onReceiver()，前台APP广播超时时间是10s，后台App是60s

####  2.2 App自己的发出的消息

除了AMS对四大组件的回调消息运行在UI线程外，有些操作也是运行在UI线程的：

	AsyncTask: onPreExecute(), onProgressUpdate(), onPostExecute(), onCancel()等，超时5s

	Mainthread handler: handleMessage(), post*(runnable r)等，超时5s

#### 2.3 死锁

这是最常见的ANR,包括数据库思索或者wait，notify等方法使用不当导致的应用思索。 并且写完之后不容易发现，更不容易复现。



###  3.怎样避免ANR

当我们知道ANR的产生原因之后，就可以较为轻松的避免ANR了。并且Android为我们提供了很多解决方法。主要归为一下几类。
> 1：UI线程尽量只做跟UI相关的工作，但一些复杂的UI操作，还是需要一些技巧来处理，不如你让一个Button去setText一个10M的文本，UI肯定崩掉了。

> 2：让耗时的工作（比如数据库操作，I/O，连接网络或者别的有可能阻碍UI线程的操作）把它放入单独的线程处理。

> 3：尽量用Handler来处理UIthread和别的thread之间的交互。

> 4:能分锁可以尝试进行分锁

> 5:数据库事务的关闭记得在finally中

###  4.发布的程序怎样收集ANR异常

  对于发布的程序，ANR异常是很那捕获不到的（我查找过很多资料，如果您有很好的捕获办法，欢迎再下方留言），所以我们需要采用其它的方法来分析ANR。app在产生ANR异常后，会将异常信息写入"**/data/anr/traces.txt**"文件我们可以通过收集用户的这个文件，就可以来获取用户产生ANR的地方了。

我在一个按钮的onClick事件里写了如下代码

	while(true){}

来故意产生一个ANR异常，然后打开/data/anr/traces.tx文件，主要有用的地方如下图:

![](/pic/anr-analyze/140925114713.png)


我们可以看到，在trace.txt文件里已经定位到异常产生的地方。

### 技巧分享

对于没有root的手机，/data/anr/traces.txt通过普通的文件访问应该是没有权限的，不过一般通过adb还是可以获取的。笔者使用的是mac系统，我习惯于将此类固定的命令封装为函数放在.bashrc文件中，如下面这样：

```
function openanr {
    adb shell cat /data/anr/traces.txt > traces.txt & open traces.txt
}
```
这样，电脑连上手机后只需要执行openanr即可直接打开traces.txt文件。

ANR属于温柔的小妖精，Android应用里的还存可怕的大魔王，比如执行了3/0了，或者对null进行操作导致了空指针异常了等等，这些情况应用程序会直接崩掉，用户体验超级差，关于崩溃的相关内容可以查看我的另一篇博文[https://blog.saymagic.cn/2014/03/25/android-crash-analyze.html](https://blog.saymagic.cn/2014/03/25/android-crash-analyze.html)。
