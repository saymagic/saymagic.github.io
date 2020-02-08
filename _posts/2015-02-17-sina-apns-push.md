---
layout: post
keywords: Sina,ADPNS,云推送
description: Sina ADPNs初体验
title: Sina ADPNs初体验
categories: [Android]
tags: [Android]
group: archive
icon: globe
---

## 官方demo详解

 最近在体验Sina的PUSH服务，最直接的方法莫过于运行官方Demo，但我在跑Demo的时候遇到了一些问题，这里做一下整理和总结。我将从Android端和服务器端两部分进行。开始之前我准备先明确几个定义，因为大多数的困惑可能是由于文档多处命名不统一造成的。

 APPID = $appid ：从应用推送页面获取，每个推送应用对应唯一的APPID。

 token = 设备id = 设备号 = aid = sinapush_appid: 每个手机对应唯一的值，从Android端获取，用于服务器区别每个需要推送的设备。

### Android端

首先我们需要下载SDK与官方Demo，前往任意应用下点击`云推送`连接：

![云推送](/pic/sina-apns-push/o_19eo7fs6m13uc1cts464h0o7aqe.png)

再出现的面板中点击`推送设置`:

![](/pic/sina-apns-push/o_19eo7m467l5qt5l1eolg90dd6j.png)


选择Android就可以看到`下载SDK`的按钮了。

![](/pic/sina-apns-push/o_19eo7f8aik6edqbmjk1qrrc1a9.png)

在这个页面我们还可以看到`获取APPID`按钮，我们点击来获取我们的APPID，这个稍后会用到：


再来看下载后的rar文件，解压有两个文件：

![](/pic/sina-apns-push/o_19eo7rsk128no381npf89516aco.png)

`SinaPush_2.4.0_SAE_release.jar`是云推送所需要的jar包，`SinaPushSDKDemo-SAE.rar`是官方的Demo。我们将Demo解压，然后倒入eclipse,并将推送的jar包放入项目的libs目录。完成后，项目结构如下：

![](/pic/sina-apns-push/o_19eo7vnlcgcdd1d4ed1gjhtrit.png)


在运行之前我们需要修改几个数据：

在MainActivity里：

			manager.openChannel("20001","100","100");

将里面的20001替换为我们在推送页面获取的APPID。

打开AndroidManiest.xml文件，将里面的20001全部替换为我们的APPID，还需要更改service的name值，将`MsgReceiveSeMfrvice`更改为`MsgReceiveService`,其它的东西暂时不需要修改，我们就可以运行项目了：

点击启动Push服务：就会看到有aid在界面上显示：

![aid](/pic/sina-apns-push/o_19eobbv54aptqfp1an2175g1q8g9.png)

一定要牢记这个值，比如我获得的值为`BYhZdN7UKhdi`,如果是正式的项目一定要保存起来，因为第二次启动的时候就不会出现这个值了。

这样，我们的Android就算完成，接下来去服务端看一下。




### 服务端


#### 通过控制台推送

如果我们想给钢材aid为`BYhZdN7UKhdi`的设备推送消息，Sina为我们提供了友好的推送页面，则可以打开推送消息页面，填写必要的信息（这里我让其直接打开我的博客）：

![](/pic/sina-apns-push/o_19eobnpil4msu1b1c0omqvra4e.png)

点击发送按钮，我们就可以在刚刚的模拟器接收到消息了：

![](/pic/sina-apns-push/o_19eobugnnvjt1j194ja7dn1ktij.png)

点击之后就会用浏览器打开我的博客：

![](/pic/sina-apns-push/o_19eoc1jca1sqefffed2856upfo.png)

#### 通过代码推送

Sina为我们提供的推送控制台功能过于单一，用于测试还可以，不适用于运行在项目中。所以我们可以通过代码来实现推送，根据官方给出的代码，我们编写如下代码来实现刚才通过控制台实现的功能，代码如下：

	<?php
	//此处填写服务端获取的APPID
    $appid=****;
    //此处填写需要推送设备的aid
    $token='BYhZdN7UKhdi';
    $title='Test';
    $msg='';
    $acts="[\"4,http://blog.saymagic.cn\"]";
    $extra=array(
        'handle_by_app'=>'0'
     );
    $adpns = new SaeADPNS();

    /**
     * 推送消息
     *
     * @param int $appid  SAE分配的应用序号
     * @param string $token 设备令牌
     * @param string $title 消息标题
     * @param string $msg 消息体
     * @param string $acts 跳转行为参数
     *  - ["2,app包名,Activity类名"]：跳转到APP的Activity。例如：		["2,com.sina.news,com.sina.news.ui.NewContentActivity"]
     *  - ["4,URL地址"]：跳转到浏览器。例如：["4,http://www.sina.com"]
     *  - ["5,Scheme"]：通过Scheme跳转。例如：["5,sinaweibo://sendweibo"]
     * @param array  $extra 额外的传递信息
     *  - $extra = array(
     *      'handle_by_app'=>'1'  // "1"，表示消息交由App处理。
     *    )
     * @return bool 成功返回true，失败返回false
     */
    $result = $adpns->push($appid, $token, $title, $msg, $acts, $extra);

    if( $result && is_array($result) ){
        echo '发送成功！';
        var_dump( $result );
    }
    else {
        echo '发送失败。';
        var_dump($apns->errno(), $apns->errmsg());
    }
    ?>

运行上面的代码，模拟器依旧会收到推送消息，点击打开依然会连接到我的博客。

通过代码推送需要注意的是handle_by_app参数，如果这个参数为0，则$acts参数就会失效，因为这样会将消息交由应用自己处理，处理的函数就是DEMO的MsgReceiveService.java里的onPush方法，我们只需在此方法里填写我们处理代码即可。

## 问题

 当然，我们在使用的时候可能不会一帆风顺，会遇到各种问题，这里记录几个我遇到的问题：

### 修改manager.openChannel()方法;

根据官方的说明:

![](/pic/sina-apns-push/o_19eodp6mr1aqn18k1i4h83la0t.png)


可以看出，该方法已经改名，所以我在尝试填写channnelID的话会获取不到aid。很可能最新的openChannel方法不再处理这个参数造成push服务无法打开，但很遗憾在Sina的文档里我找不到相关的内容，源码也不是开源的，这里暂时无解了。

### aid无法获取

如果获取不到aid，一般就是demo中的调用方法不对。解决方法是运行项目之前都先将上一次运行的项目卸载，然后在对照下面的几个地方是否进行了修改：

1. MainActivity.java文件中startSinaPushService函数中openChannel的第一个参数;
2. AndroidManifest.xml文件中有4处appid的配置内容需要修改;
3. AndroidManiest.xml文件里的service的name标签是否和源代码对应。





## 不足

虽然Sina的Push服务在一定程度上为开发者带来了便利，但却不得不承认其在某些方面做的还不够完美：

1. 缺少为全部用户推送功能，更缺少按标签推送功能，这在很大程度上加大了开发者的使用难度。

2. 缺少推送成功的回调，即一个推送下去无法知道这个消息是否推送成功。

3. 推送服务在手机端不会自启动与重启，换句话说，用户退出应用后就无法接收推送消息。也无法在应用打开时接收错过的推送消息。

4. 设备的aid是由Sina服务器分配的（在客户端获得），并且会由于设备长时间未连接到服务器而被重新修改，在实际应用场景中我们就必须为每一个用户保存一个变化的aid数据，并且这个aid无法和用户本身的其它任何信息产生关联，因此使用起来不是很便利。

但话说回来，其实上面所有的问题我们都可以通过封装应用代码来完成，但我觉得作为云服务，这部分功能还是有Sina做封装更好。



## 参考

[http://apidoc.sinaapp.com/source-class-SaeADPNS.html#$_accesskey](http://apidoc.sinaapp.com/source-class-SaeADPNS.html#$_accesskey){:rel="nofollow"}

[http://cloudbbs.org/forum.php?mod=viewthread&tid=24167&highlight=%E4%BA%91%E6%8E%A8%E9%80%81](http://cloudbbs.org/forum.php?mod=viewthread&tid=24167&highlight=%E4%BA%91%E6%8E%A8%E9%80%81){:rel="nofollow"}

[http://sae.sina.com.cn/doc/php/push.html#ios-api](http://sae.sina.com.cn/doc/php/push.html#ios-api){:rel="nofollow"}
