---
layout: post
keywords: Android Task, Android Back Statck
description: Android 中的任务和返回栈
title: Android 中的任务和返回栈
categories: [Android]
tags: [Optimization]
group: archive
icon: globe
---

## 任务 (Task) 

Android中的任务通常是指一系列有联系的 Activity 的集合。一般按照应用来区分：

![image](https://raw.githubusercontent.com/saymagic/pic/master/c0755e72gy1fninbg2osxj21m418c43v.jpg)

## 返回栈 (Back Stack)

当用户从一个 Activity 跳转到另外的 Activity，Android 系统会保存 Activity 之间的顺序栈。这个Activity栈使系统知道当用户按下返回键的时候，应该返回到哪个页面。这个栈就是返回栈。

> 在大多数情况下，我们不需要特别关心如何处理任务和返回栈。但对于一些特殊的情景，需要我们合理的运用任务和返回栈才能满足需求。


### 示例

我们考虑如下一个场景：

应用启动了两个 Activity，A 和 B。其Activity 栈为 A -> B(B在栈顶)。

现在，如果应用接收到了通知，点击通知需要跳转到 B页面。按照正常的需求逻辑，点击通知时我们应该保留在当前的 B 页面来处理消息。期待的返回栈是 A->-B。但是，默认情况下，系统会新启动一个 B 页面来处理消息。最终返回栈是 A->-B->B。

为了处理这类场景，我们需要更仔细的来了解任务和返回栈相关的信息。

### 任务亲和力(taskAffinity)

亲和力这个词看起来比较抽象，但仔细想一想还是很好理解的。它用一个 string 来描述一个 Activity 更喜欢在哪个任务下。默认情况下，同一个应用下的 Activity 拥有相同的亲和力（affinity），就是它们的包名。这也是为什么一般情况下一个应用下启动的所有 Activity 会被系统整理在一个任务下。

我们可以在`AndroidManifest.xml`中每个 activity 节点中定义它的亲和力：

```
<activity
android:taskAffinity=""
..
/>
```

`taskAffinity`字段是一个字符串，但必须包含一个`.`字符。

但一个应用中定义了不同`taskAffinity`的 Activity 并不一定运行在不同的任务中，还和启动模式有关。

### 启动模式(Launch mode)

启动模式用来告知 Android 系统如何来启动一个特定的 Activity。有两种方式来指定启动模式：

* 在`AndroidManifest.xml`文件中定义

* 在代码中使用`Intent Flags`

下面详解介绍这两种方式：

#### AndroidManifest

在`<activity .../> `标签下添加 `android:launchMode` 属性用来表示该 Activity 的默认启动模式。

```
<activity android:launchMode = [“standard” | “singleTop” | “singleTask” | “singleInstance”] ../>
```

在`Manifest`中一共可以定义四种启动模式：

##### standard

`standard`是系统的默认启动模式。如果我们不为一个 activity定义任何启动模式，新启动这个 Activity 时就会以`standard`模式启动。


##### singleTop

大多数情况下和`standard`模式比较相似。不同点是当启动`singleTop`的 Activity 时，系统会检查当前 Activity 栈顶的 Activity 是否和该需启动的Activity 相同。如果相同，则系统不会创建新的 Activity 实例，而是调用 已经存在实例`Activity`的`onNewIntent`方法。

当我们启动页面的顺序是A → B → B → B。下图是`standard`和`singleTop`的一个对比：

![image](https://raw.githubusercontent.com/saymagic/pic/master/c0755e72gy1fninicnvuxj20mr0deq35.jpg)

###### singleTask

`singleTask`这个启动模式用于表示一个 Activity将会被放到一个新的任务中启动（从最近任务中可以看到）
那是不是我们在`Manifest`为 `Activity`中定义`launchMode`为`singleTask`就会工作呢？

错！

还记得我们前文说的亲和力(taskAffinity)吗？默认情况下一个应用的 Activity 都有着相同的亲和力，所以即使声明为`singleTask` 模式的 Activity 在亲和力相同的情况下也会运行在相同的任务中。所以我们如果希望`singleTask`生效，就必须为这个`Activity`声明和应用默认不同的亲和力才可以。



##### singleInstance

最后一种启动模式是`singleInstance`,它和`singleTask`基本相同，不同点是，定义为`singleInstance`的 `Activity`在启动时会清掉其所在任务栈的所有 Activity。所以，定义为`singleInstance`的`Activity`所在的任务栈只会有它自己。


#### 通过`Intent Flags`定义启动模式


##### FLAG_ACTIVITY_NEW_TASK

`FLAG_ACTIVITY_NEW_TASK`的效果和`singleTask`类似，这个值是在我们创建`Intent`时通过代码来指定的。如果我们希望在`FirstActivity`中在新的任务中启动`SecondActivity`,示例如下：

```
Intent i = new Intent(FirstActivity.this, SecondActivity.class);
i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
startActivity(i);
```
有两个点需要注意：

* 如果上述的`SecondActivity`没有定义和应用不同的`taskAffinity`，上述的设置是不会起效果的。（和我们仅仅声明了`singleTask`一样）


* 切换后台并重新切回`SecondActivity`时，在`SecondActivity`上返回，是会返回到主屏幕的。如果我们希望返回到启动它的`FirstActivity`,需要在`Manifest`中进行定义，示例如下：

```
<activity android:name=".SecondActivity"
    android:taskAffinity="***.***"
    android:parentActivityName=".FirstActivity"/>
```

##### FLAG_ACTIVITY_SINGLE_TOP

这个Flag 和`singleTop`启动模式类似。我们在`FirstActivity`上启动`FirstActivity`, 示例代码：

```
Intent i = new Intent(FirstActivity.this, FirstActivity.class);
i.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
startActivity(i);
```

此时，如果`FirstActivity`已经在栈顶，Android 系统不会创建新的 Activity，而是调用 栈顶`FirstActivity`的`onNewIntent() `方法。示例代码：

```
@Override
protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    Toast.makeText(this, "Welcome again!", Toast.LENGTH_SHORT).show();
}
```

###### FLAG_ACTIVITY_CLEAR_TOP

有两种比较适合使用这个 Flag的情形：
* 所有的 Activity 都在一个任务栈中：

    通过这个 Flag启动的 Activity 会清空在这个 Activity 上面的所有的 Activity 并将此 Activity 切换到栈顶。
* Activity 并不在同一个任务栈中：
    
    如果这个 Flag 和`FLAG_ACTIVITY_NEW_TASK`一同使用，系统会将对应的任务栈切换到前台，并清空目标 Activity上面所有的 Activity。



