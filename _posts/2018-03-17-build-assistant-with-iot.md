---
layout: post
keywords: Android Things, Google Assistant SDK, IOT, 智能音箱
description: 基于Android Things打造AI 助手，打造智能音箱
title: 基于Android Things打造AI 助手
categories: [Android]
tags: [Android]
group: archive
icon: globe
---

> 如何基于 Iot 打造一个简单的 AI 助手呢？

![https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fpeh5buzr3j20rs07itbj.jpg](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fpeh5buzr3j20rs07itbj.jpg)

### 软件

* Android Studio3.0
* Android Things
* Google Assistant SDK

### 硬件

Android Things 目前支持了如下的板子：

![image](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fpeheh6xiuj21gw094ad3.jpg)

本文中，我们将选取`NXP Pico i.MX7D `作为我们的开发板。

![image](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fpgvaazogsj21400u0tai.jpg)

### 准备

首先需要进行如下两个步骤：

* 连接`NXP Pico i.MX7D `的各个组件
* 在板子上安装 Android Things

#### 连接组件

大家可以按照 Google 官方提供的文档来安装：[https://developer.android.com/things/hardware/imx7d-kit.html](https://developer.android.com/things/hardware/imx7d-kit.html)。当我们完成安装时，帅气的板子如下：

![image](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fpgveqwdpzj21400u00ue.jpg)

#### 安装Android Things镜像

在安装完开发板之后，我们需要在开发板上安装Android Things镜像。

![image](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fpehqz5428j20rs069776.jpg)

官方的安装文档为：[https://developer.android.com/things/hardware/imx7d.html](https://developer.android.com/things/hardware/imx7d.html){:rel="nofollow"}

如果无法访问或者更喜欢中文的话可以查看 Google 推广工程师的视频：
[http://v.youku.com/v_show/id_XMzI0NDI3NjcxMg==.html](http://v.youku.com/v_show/id_XMzI0NDI3NjcxMg==.html){:rel="nofollow"}

### 构建应用

#### 创建新项目

创建Android Things 项目非常简单：

* 打开 Android Studio，选择Start a new Android Studio project
* 在 Target Android Devices 面板勾选 Android Things

![image](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fpehzsdc13j21ds10mwj5.jpg)

* 本例中，我们需要 UI，所以选择`Android Things Empty Activity`

![image](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fpeibdfgj8j21d20za76y.jpg)

* 一路选择 next，最后我们的项目就创建完成。

Android Things 项目与普通有的 Android 项目有几处不同：

* 在 build.gradle 中增加了 android things 的库：

```
compileOnly 'com.google.android.things:androidthings:+'
```

* manifest文件增加了两个点：

1. <uses-library android:name="com.google.android.things />
 
2. 增加`intent filter`来处理IOT_LAUNCHER
 
![image](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fpemmx3hqdj20wo0aedi8.jpg)


详细的官方文档在：[https://developer.android.com/things/training/first-device/create-studio-project.html](https://developer.android.com/things/training/first-device/create-studio-project.html)。
简单来说，`IOT_LAUNCHER`用于表明当在 IOT 设备上时，应该启动哪个 Activity，`uses-library`表明在运行时保证Android Things相关的库可用。

#### 构建Hello World

完成上面之后，为 Android Things构建一个 Hello World 的 UI 程序 就和构造普通的手机/平板程序没有什么差别了。本例当中，我们在 Activity 中 增加一个按钮，点击之后弹出`Hello World`提示。

当编写完毕之后，将开发板通过 USB连接到电脑，我们直接像运行Android 程序一样，就可以将我们的项目安装在开发板上。

![image](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fpgwb2xkzng20qo0f44qv.gif)

### Simple AI 项目

有了前面的基础，我们可以更进一步， 打造一个 AI 助手。这个项目需要下面的步骤：

* 前面的准备步骤
* 带有麦克风的标准耳机或者音箱。

#### 初始化工程

将下面的仓库clone 到电脑上：

[https://github.com/saymagic/sample-googleassistant](https://github.com/saymagic/sample-googleassistant){:rel="nofollow"}

#### 添加Google Assistant API 

在这里[https://myaccount.google.com/activitycontrols](https://myaccount.google.com/activitycontrols){:rel="nofollow"}开启Assistant需要用到的功能：

* 网络与应用活动记录（Web & App Activity）,
 需要将`包含 Chrome 浏览记录以及在使用 Google 服务的网站和应用中的活动数据(Include Chrome browsing history and activity from websites and apps that use Google services)` 勾选上
* 设备信息记录（Device Information）
* 语音和音频活动记录（Voice & Audio Activity）

接下来：

* 前往 Google 云平台控制台，在此页面[https://console.cloud.google.com/project?pli=1](https://console.cloud.google.com/project?pli=1)选择一个新的项目或者创建一个新的项目。

![image](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fpfm8qc80jj21ys0j840z.jpg)

* 为上面选择的项目开启[Google Assistant API](https://console.developers.google.com/apis/api/embeddedassistant.googleapis.com/overview)
* 点击启用

![image](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fpfmbkh4xzj21z20jk0v8.jpg)

* 创建OAuth Client ID [https://console.developers.google.com/apis/credentials/oauthclient](https://console.developers.google.com/apis/credentials/oauthclient)
* 点击其它（Other），为 client ID 起一个名字。
* 
![image](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fpfmeotthcj21ye0lkq5q.jpg)

* 在认证（OAuth）统一页面，为产品起一个名字。（不要包含 Google）

![image](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fpfmd2jj3uj21a011k79x.jpg)

* 点击生成（Create）。会出现client ID 和 secret的弹窗。（不需要记住，直接关闭弹窗即可）

![image](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fpfmfvw4sij21ys0r4jva.jpg)

* 点击 ⬇按钮去下载client ID和secret的 JSON 文件。(client_secret_NNNN.json or client_id.json)。

![image](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fpfmglr8c5j21ys0l2q63.jpg)

* 打开本地带有 python 环境的终端，安装`google-auth-oauthlib`, 命令为：

```
pip install google-auth-oauthlib[tool]
```
* 前往项目的根目录
* 将刚刚下载的client_secret_NNNN.json文件拷贝到项目的根目录下。执行下面的命令：

```
google-oauthlib-tool --client-secrets client_secret_NNNN.json \ --credentials app/src/main/res/raw/credentials.json \ --scope https://www.googleapis.com/auth/assistant-sdk-prototype \ --save
```
* 现在项目会正常的运行起来。点击屏幕上的按钮，设备会开始录音。

当录音结束后，声音会提交给Google Assistant API，然后我们会得到 Google 的回馈音频。因为我们已经将服务与我们的 Google 账户进行了关联，我们甚至可以让它向我们的日历中添加事件或者获取其它信息、讲笑话、查寻天气等等。这里有一个全面的清单：

[https://www.androidauthority.com/google-home-commands-727911/](https://www.androidauthority.com/google-home-commands-727911/){:rel="nofollow"}

![image](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fpgwcrax0cj21400u040k.jpg)


### 扩展材料

[Dave Smith](https://medium.com/@devunwired)有一个非常高质量的关于AndroidThings 的介绍。如果关于对 Android Things是什么、如何向别人介绍Android Things等感兴趣推荐看一下。


[![image](https://ws2.sinaimg.cn/large/8f2eb073gy1fpf3hs2prsj21360m2qm9.jpg)](https://youtu.be/HxRv_w5DcxM){:rel="nofollow"}

[Rebecca Franks](https://medium.com/@riggaroo){:rel="nofollow"} 和[Wayne Piekarski](https://medium.com/@waynepiekarski){:rel="nofollow"} 在GDD上对 Android Things有非常好的介绍。 

[![image](https://ws1.sinaimg.cn/large/8f2eb073gy1fpflsusxdej213a0lknk2.jpg)](https://youtu.be/zpR_jQXc1fs){:rel="nofollow"}

[![image](https://wx4.sinaimg.cn/large/8f2eb073gy1fpflu0ytfvj212k0lotxf.jpg)](https://youtu.be/LOV-aye66HQ){:rel="nofollow"}

值得一提的是，我在今年的 IO 大会的 Android Things 展厅上也见到了Wayne Piekarski本人，他非常 nice的介绍了几个 Google 的 Android Things 模型，包括可以玩石头剪刀布的机器手臂、集成了 Tensor Flow 的机器人等等。


