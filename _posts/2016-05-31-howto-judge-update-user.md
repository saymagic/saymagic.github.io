---
layout: post
keywords: android，升级，新用户
description: Android中如何判断升级用户
title: "Android中如何判断升级用户"
categories: [Android]
tags: [ANDROID]
group: archive
icon: globe
---


> 最近一个需求是在请求参数中添加判断是否为升级用户的字段，简单来说，当前用户使用版本为1.1，如果是从0.9或者1.0升级过来则算老用户，如果是直接安装的1.1则为新用户，新用户升级到1.2后就会自动变为老用户。方法比较多，我这里列举三种：

## 借助数据库升级

这是我最先想到的方法， 我们都知道，在数据库的version发生变化时SQLiteOpenHelper的onUpgrade函数会被调用，因此这可以作为判断升级用户的隐性标志。但这种方法问题比较多：

* 有些版本升级并不一定会伴随着数据库的升级，造成数据的不准确。
* 在某些特定场景下可能需要在同一版本中做多次数据库升级操作，虽然这并不推荐，但业务至上的原因，什么样的代码都可能存在，还是可能造成数据不准确。

## 手动存储安装版本信息

手动存储版本信息是个性化比较强的一种做法，我们在应用启动时可以检测sp中是否纪录`install_version`这个值，如果未存在，则将当前版本号写入，当需要判断升级用户时只需要判断`install_version`的值与当前版本号是否相等即可。但这同样存在某些问题：

* 用户手动或者程序由于某些原因清除数据就会造成数据不准确。

* 对于已发布的版本似乎无法补救，例如1.1中加的需求，但之前已经发布多个版本。

## 借助PackageInfo

由于上面两种自定义的逻辑都不能很好的满足我的需求，所以我将希望寄托于系统，于是翻看了PackageManager相关的代码，果然在PackageInfo中找到了两个有用的值：`firstInstallTime`,`lastUpdateTime`,根据注释的描述，firstInstallTime表示应用第一次安装的时间，lastUpdateTime表示应用最后一次更新的时间，并且这两个值由系统维护，清除数据也不会影响结果，所以当firstInstallTime !＝ lastUpdateTime时表示当前为升级用户。核心代码如下：

        PackageManager pm = context.getPackageManager();
        PackageInfo pi = pm.getPackageInfo(context.getPackageName(), 0);
        return pi.firstInstallTime == pi.lastUpdateTime;

这种方法的确很不错，但如果需求严苛的话，还是会有一些问题，

* 平级、降级安装也会更改lastUpdateTime的值，同样可能造成结果不准确。

* 支持的最小版本是9，虽然目前9以下的版本已经很少了

## 总结

三种方法各有优缺点，希望可以给大家一些借鉴作用。如果有更好的方法，欢迎给我留言。

![Just Checking](/pic/howto-judge-update-user/8aMiaV16NGxL2iaXGOzhkMh20c5lRMbLk77SHzgTnFD75EFVibwHHz2qBMnlZypy10iaoIkFVvib6cl5lGw8DuiaGFeQ.gif)
