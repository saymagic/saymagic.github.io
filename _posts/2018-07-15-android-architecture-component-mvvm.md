---
layout: post
keywords: Android 架构组建, MVVM，LiveData, ViewModel
description: 本文介绍了通过Android架构组建来实现MVVM架构模式
title: 使用Android架构组件开发MVVM模式的应用
categories: [Android]
tags: [App]
group: archive
icon: globe
---

> 早在17年的Google IO大会上，Google就非常隆重的介绍了以`LiveData`、`ViewModel`为主的Android架构组件。本文主要通过介绍`LiveData`、`ViewModel`这些组件的概念，来实现一个MVVM模式的应用。

### MVVM 

MVVM和我们熟知的MVC、MVP类似，都属于一种架构模式，它的全称是`Model–View–ViewModel`。在MVP这类模式当中，一个事件流一般是从View开始，经过P，最后交给M进行处理，但当P处理结束后，可以再通过P或者发布事件的方式再更改V。图示如下：

![](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073ly1ftaqyt3sjwj20lo04v0sr.jpg)

简单来理解的话，MVVM可以看作MVP的升级版本，View的变动，自动反映在 ViewModel，反之亦然。这种行为俗称双向绑定，双向绑定的实现方式很多，本文不做列举。双向绑定带来的最大好处是，代码量变少，重用性更高。


![](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073ly1ftaqzcvscwj20lo04vt8o.jpg)

接下来，我们详细看一下MVVM拆解开来的三个部分：

* Model

>  Model代表了一个应用的数据和业务逻辑层。该层的推荐实现形式是通过对外提供可观察的数据对象，以便与ViewModel或任何其他观察者/消费者完全分离。在	Android 应用中，常见的可观察对象如Rxjava中的Ovserable,再比如我们今天要讲到的Android架构组建中的LiveData。

* ViewModel

> ViewModel负责与Model层交互，并且还需要将Model层的数据以可观察的对象形式提供给View。该层的一个重要实现准则是将它与View分离，即ViewModel不应该知道与之交互的View。

* View

> View层的逻辑很简单，就是观察ViewModel提供的属性，当其发生变化后，及时的更新UI。

最后，根据上面的描述，我们可以再来完善下上面MVVM的事件走向图：

![](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073ly1ftaroboob7j20lo04v74g.jpg)

其中，实线的部分是需要开发者手动编写的，虚线的部分应该是由通用的组件来实现，开发过程中无感知或很少感知。


### LiveData

LiveData是Android架构组建中非常重要的一个成员。它提供一个范型来包装数据，它允许应用中的组建来观察LiveData中对象的变化。更进一步来讲，LiveData将数据的生产者与数据的消费者进行了分离。用代码来实际看一下：

生产者：

```
private val stringData : MutableLiveData<String>
 = MutableLiveData()

stringData.postValue("awesome data")
```

消费者：

```
stringData.observe(lifecycleOwner, Observer<String> {
    Log.i("TAG", it)
})
```
LiveData是只能由消费者来订阅它，而MutableLiveData是LiveData的子类，提供了postValue和setValue方法，可以让开发者提交生成出来的数据。大家可能会有疑问，上面的代码和我们平常接触的观察者模式很相似，那LiveData的优势在哪里呢？

LiveData最大的特性是它尊重Android组件的生命周期，上面消费者的代码中我们可以看到LiveData的ovserve方法除了需要传入第二个参数Observer，第一个参数lifecycleOwner也很重要。LifecycleOwner是一个接口，我们常见的 v4包中的Fragment、FragmentActivity都是这个接口的实现类。所以，因为有了lifecycleOwner，LiveData保证我们的observer仅会在lifecycleOwner的有效生命周期内进行回掉。当lifecycleOwner生命周期结束后，LiveData会自动将Ovserver进行清除，减少内存泄漏的风险。

LiveData第二个特性是变换，举个例子，当Model层返回了一个String类型的数据，而UI需要一个Int型的数据。这个转换，LiveData可以很轻松的胜任。Transformations类提供了map和switchMap两个方法进行转换，对于上面的例子，我们可以这样做:

```
//原始数据
private val stringData : MutableLiveData<String> = MutableLiveData()

//转换后的数据
val intData : LiveData<Int> = Transformations.map(stringData, {
        it?.toInt()?:0
})
```

通过上面的变换，Model层可以继续生产String类型的数据，而UI层也可以使用intData来观察Int类型的数据。


### ViewModel

ViewModel是Android 架构组件中的另一员大将，它的生命周期依赖于对应的Activity或Fragment的生命周期。通常我们会在Activity/Fragment第一次onCreate()时创建ViewModel：

```
val myViewModel = ViewModelProviders.of(fragment).get(MytViewModel::class.java)
```

试想这样一个场景，当我们的手机屏幕发生旋转，或者系统语言发生变更后，我们的页面会被重新创建，同样的，我们的数据会因为UI的重建而再次被重新加载。但ViewModel可以保证，当屏幕旋转等配置变化后，UI组件重建后获取到的ViewModel仍是销毁之前的ViewModel，我们可以立即使用之前保留的数据。

ViewModel的生命周期一直持续到Activity最终销毁或Frament最终detached，期间由于屏幕旋转等配置变化引起的Activity销毁重建并不会导致ViewModel重建。下面是官方的ViewModel生命周期示意图：

![](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073ly1ftbgwsbmprj20m80iqaay.jpg)

我们可以总结一下ViewModel这样做带来的好处：

* 相比于`onSaveInstanceState`、序列化等保存UI状态的方法，ViewModel更加轻量级，也能高性能的存储复杂类型的数据。
* ViewModel可以很方便的在同一个Activity中多个Fragment中共享，只需要在ViewModelProviders.of(activity)时传入Fragment所在的Activity实例即可。
* UI因配置变化重建后，ViewModel可以减少数据的请求。节约资源。


### Paging library

分页加载的需求在应用开发的过程中很常见，Paging Library（分页组件）就是一个这样方便的组件，当列表上滑、下拉的时候可以帮助我们逐步从数据源加载信息。

分页组件中两个主要的概念是DataSource 与PageList。DataSource 表示数据来源，用于Model层。PageList表示数据列表，用于UI层。通过`LivePagedListBuilder`可以将二者进行连接。



### 实战应用

最后，我们可以整合上面的几个概念，开发一个MVVM架构的Android App, 我选取了Unsplash的api，制作一个可以让用户免费浏览、下载、搜索高清图片的应用。


#### App 效果图

![](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073ly1ftbizpyhxhg208p0flhdu.gif)


#### App的Github地址

[https://github.com/saymagic/Begonia](https://github.com/saymagic/Begonia)


### 实现过程

整个页面大概有七八个不同的页面，我们这里以UserListFragment页面来进行举例：

![](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073ly1ftbkkvyz4tj20b20kfwgk.jpg)

这个页面的主要逻辑是根据Unsplash的`search/users`接口来查询匹配某个关键字的所有用户。页面的时序图如下：

![](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1ftbki0p02ej20nk0cs0te.jpg)

其中UserListFragment充当M层，仅用于UI数据的展示，UserViewModel充当VM层，负责UI数据的监听和回掉。UserDataSource与Unsplash API共同充当M层，负责数据的处理和获取。
我们编写的代码主要集中在实线部分，虚线部分都是LiveData等基础组建帮我们进行实现的。

### 总结

MVVM相对于最大的好处就在于更灵活的解耦。在MVP上M层还需要关心怎么处理P,但在MVVM上，M层更注重怎么生产数据，其它的业务交还给VM、V层自己去处理。但总之，没有任何一种架构是能解决所有问题的，选取一个架构的时候要从产品需求、业务逻辑等多个角度衡量和改进。
