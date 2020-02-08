---
layout: post
keywords: android, java, Picasso, 流程分析
description: understanding the Clever design of Picasso/ 理解Picasso的巧妙设计 
title: Picasso 图片加载流程分析
categories: [Android]
tags: [Optimization]
group: archive
icon: globe
---

> Picasso 是目前目前比较流行的轻量级的图片加载框架。可以让调用者无感知的情况下完成了图片的加载、显示、缓存，并提供了灵活的扩展接口。`Picasso`可以从多个网络、文件、资源等等多个途径进行加载图片，同时可以将图片渲染ImageView、RemoteView、自定义 Target 等多个渠道上。由于加载的思路基本一致，所以本文主要基于从网络加载图片显示到 ImageView 这个情景，基于写作时的2.5.2版本。来分析其中比较主要的类，并在最后看看这个类之间如何有序的连接在一起进行工作的。

## 一般的调用方式

下面是一个简单的示例用来将一张网络图片显示在 ImageView 上：

```
Picasso.get().load("http://via.placeholder.com/350x150").into(imageView);
```

一个漂亮的链式调用完成了一张网络图片的加载。我们将其拆分开，看看每一步发生了什么。

```
Picasso.get()
```
链式调用的入口发生在 `Picasso`对象的`get`方法上。这个方法比较简单，用于返回单例的`Picasso`
对象：

```
  public static Picasso get() {
    if (singleton == null) {
      synchronized (Picasso.class) {
        if (singleton == null) {
          if (PicassoProvider.context == null) {
            throw new IllegalStateException("context == null");
          }
          singleton = new Builder(PicassoProvider.context).build();
        }
      }
    }
    return singleton;
  }
```

 我们直接来看看这个`Picasso`对象是如何构建的。

```
    /** Create the {@link Picasso} instance. */
    public Picasso build() {
      Context context = this.context;

      if (downloader == null) {
        downloader = new OkHttp3Downloader(context);
      }
      if (cache == null) {
        cache = new LruCache(context);
      }
      if (service == null) {
        service = new PicassoExecutorService();
      }
      if (transformer == null) {
        transformer = RequestTransformer.IDENTITY;
      }

      Stats stats = new Stats(cache);

      Dispatcher dispatcher = new Dispatcher(context, service, HANDLER, downloader, cache, stats);

      return new Picasso(context, dispatcher, cache, listener, transformer, requestHandlers, stats,
          defaultBitmapConfig, indicatorsEnabled, loggingEnabled);
    }
  }
```
 `Picasso`对象是由executorService、cache、downloader、transformer等多个组件构成，我们可以自定义这些组件的实现。如果我们没有提供的话， `Picasso`会有自己的默认实现。我们可以来看看这些默认实现是如何工作的。

## Cache
Cache用于缓存一些常用的图片。和目前大多数的图片加载实现类似，`Picasso` 默认使用`LruCache`来进行缓存。`LruCache`底层基于 LinkedHashMap实现。会尽可能的保留使用次数比较多的数据。`Picasso` 将默认缓存的带下设置为 app 堆大小的1/7。

## Downloader

Downloader 是一个用于描述下载外部资源（硬盘、网络）的接口。其主要的方法是：

```
  @NonNull Response load(@NonNull Request request) throws IOException;

```
这里的`Request`和`Response`就是 okhttp 中的`Request`和`Response`。所以`Picasso`  的 Downloader 的默认实现也是基于 okhttp 的。因为 okhttp 是自带硬盘缓存功能的。所以`Picasso` 是没有提供硬盘缓存接口的。如果我们需要自己来实现`Downloader`接口，就需要考虑自己来实现硬盘缓存了。或者将缓存逻辑放在` Cache`接口里。

## ExecutorService

`ExecutorService`就是 Java 中的线程池，用来执行耗时的操作。`Picasso` 默认的线程池有如下的特性：

* 根据网络的状况自动调节线程池的大小
* 每个加载的请求可以设置优先级，线程池会根据请求的优先级来进行加载。如果请求的优先级相等。则根据 FIFO 的规则进行加载。

## RequestTransformer

`RequestTransformer`是一个用于在图片加载请求被正式提交执行之前，给调用者提供了预处理的接口。这个接口需要实现的函数是：

```
    com.squareup.picasso.Request transformRequest(com.squareup.picasso.Request request);
```

上面的 `Request`是 picasso对图片请求的封装，并非okhttp 中的 `Request`，这个函数的调用发生在网络加载之前。我们可以实现这个接口来对请求进行统一的修改。比如，我们想用 CDN 加速，可以统一更换图片的 HOST到 CDN 对应的域名下。

## RequestCreator

上面主要是对`Picasso`的几个组件默认实现进行了简单分析。接下来我们回到`Picasso.get().load("http://via.placeholder.com/350x150")`这句代码，它返回的是`RequestCreator`。`Picasso`中的组件主要用于全局的控制。而`RequestCreator`用于描述一个图片请求自身的一些属性。举几个常用的属性：

* memoryPolicy - 是一个枚举类型，用于控制图片是否可以从缓存中加载，或者从外部获取的图片是否可以放入缓存。

* networkPolicy -  用于指定加载图片时是否可以从磁盘上加载，或者将下载成功的图片放入磁盘，亦可以指定只允许从磁盘上加载而不通过网络。

* errorDrawable - 图片加载失败时会显示在 ImageView 上的图片

* placeHolderDrawable - 图片加载过程中会显示在 ImageView 上的图片


## Action

当我们调用`RequestCreator`对象的 `into`方法时，`Picasso`就会上演一出漂亮的图片加载大戏。在文章的最开始我们提到过`Picasso`可以将记载的图片作用于 ImageView、RemoteView 等多个渠道。背后的实现就是对每种渠道做了抽象。`Action`就是用来描述这个场景的类。如 `into`的参数如果是 ImageView，就会生成一个`ImageViewAction`，并将这个`ImageViewAction`提交到`picasso.enqueueAndSubmit(action)` 方法进行执行。

## Dispatcher

Dispatcher就是一个调度器，上面说到的`picasso.enqueueAndSubmit(action) `方法也只是将 action 交由Dispatcher 来处理：

```
  void enqueueAndSubmit(Action action) {
    Object target = action.getTarget();
    if (target != null && targetToAction.get(target) != action) {
      // This will also check we are on the main thread.
      cancelExistingRequest(target);
      targetToAction.put(target, action);
    }
    submit(action);
  }

  void submit(Action action) {
    dispatcher.dispatchSubmit(action);
  }
```

Dispatcher的原理就是通过`HandlerThread`来监听并转发一些事件。如前面生成的`ImageViewAction`会被封装成`BitmapHunter`，提交到前文的`ExecutorService `中处理。


## BitmapHunter

这个类实现了 `Runnable`接口，主要职责就是解析图片的请求，将其转换为Bitmap。更细分的话，其处理流程如下：

* 图片请求在缓存中存在，直接返回缓存中的数据
* 如果缓存中不存在，通过NetworkRequestHandler来将请求转换为图片流。
* 解析图片流，转换为 Bitmap，如果需要存入缓存，就将结果放入缓存。
* 将前面处理成功或者处理异常产生错误时间发送到 `Dispatcher` 上，
`Dispatcher` 会在合适的时机将事件发送到主线程，`ImageViewAction`就会接收到事件，一张图片就显示出来了。

## RequestHandler

前面提到了`NetworkRequestHandler`，这个类继承自`RequestHandler`，`RequestHandler`是对不同来源请求的描述。如网络图片的实现是`NetworkRequestHandler`，资源图片的请求实现是`ResourceRequestHandler`.`RequestHandler`主要有两个需要重写的方法：

```
public boolean canHandleRequest(Request data)

public Result load(Request request, int networkPolicy)
```
`canHandleRequest`用于描述该 handler 是否能够处理这个请求，`load`用于将请求转换为处理结果。

## CleanupThread

优秀的框架很大程度在于其对细节的处理。比如当我们的 ImageView 所在的页面已经销毁，ImageView不在被其它类所引用。此时和ImageView对应的 Request 的理论上就没有进行的必要了。所以`Picasso`会有一个`CleanupThread`后台线程用来处理这个事情的。其原理就是ImageView 会被放在WeakReference中，CleanupThread回去检测WeakReference对应的ReferenceQueue中是否有将要被 gc 的对象即可。

## RecyclerView/ListView 乱序？

Picasso 可以解决RecyclerView或者ListView在 item 重用时的乱序问题，它是如何做到的呢？

在调用`RequestCreator`的`into(ImageView imgview)`方法时，最后执行的语句是：

```
 Action action =
        new ImageViewAction(picasso, target, request, memoryPolicy, networkPolicy, errorResId,
            errorDrawable, requestKey, tag, callback, noFade);

picasso.enqueueAndSubmit(action);
```    

进入` enqueueAndSubmit(Action action)`方法看一下：

```
void enqueueAndSubmit(Action action) {
    Object target = action.getTarget();
    if (target != null && targetToAction.get(target) != action) {
      // This will also check we are on the main thread.
      cancelExistingRequest(target);
      targetToAction.put(target, action);
    }
    submit(action);
}
```  

if 语句在检查当前 ImageView 是否执行了一个加载请求，且和当前需要加载的请求不同，如果是的话就会执行`cancelExistingRequest(target)`方法取消之前的请求。这样就保证了不会出现前一次加载的请求覆盖了最新请求的问题。
## End

最后，附上一张流程图可以让大家更好的理解`Picasso`的流程：

![image](https://raw.githubusercontent.com/saymagic/pic/master/c0755e72gy1fnezqlh470j22jo1yudkn.jpg)