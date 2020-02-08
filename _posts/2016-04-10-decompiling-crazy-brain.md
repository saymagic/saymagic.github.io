---
layout: post
keywords: 疯狂大脑，反编译，重打包
description: 反编译与重打包“疯狂大脑”应用
title: 反编译与重打包“疯狂大脑”应用
categories: [Android]
tags: [Android]
group: archive
icon: globe
---

> 作为一名`最强大脑`节目的粉丝，十分崇拜里面选手的精彩表现，所以在大学的时候就下载了一款名字叫做`疯狂大脑`的应用，该应用可以构建自己的记忆宫殿、训练记忆编码等等，对训练记忆十分方便。可是最近更换手机重新安装的时候发现，该应用的许多功能都被设为付费项目，需要支付一定金额才可以打开，这引起了我的极大兴趣，很想看看它是怎么做的。于是就有了下面的过程。

### 反编译

`疯狂大脑`的练习界面的几个模块都是需要付费的。如下：

![](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fpfn8vl9lcj20k00zkq5i.jpg)

要想找到破解的门路我们首先需要对它的代码有所了解，这里我们借助`dex2jar`

与`JD-GUI`这两个工具，下载地址分别是[https://sourceforge.net/projects/dex2jar/files/](https://sourceforge.net/projects/dex2jar/files/){:rel="nofollow"}与[http://jd.benow.ca/](http://jd.benow.ca/){:rel="nofollow"}。

`疯狂大脑`的应用没有提供直接的apk下载链接，需要通过豌豆荚下载后，然后将其导出，目前的版本是1.2，我们将其命名为`brain.apk`。

![](/pic/decompiling-crazy-brain/o_1afvhcd6q1cg6nj0cgf6jf1a4p9.png)

有了上面三个文件，我们就可以开始了：

*  将`brain.apk`重命名为`brain.zip`并解压
* 我们需要的其中的`classes.dex`文件
* 使用dex2jar将其转换为jar文件

		./d2j-dex2jar.sh ../brain/classes.dex

* 在dex2jar目录就会多出`classes-dex2jar.jar`文件
* 使用`JD-GUI`打开此jar文件
* 有没有天下尽在眼底的感觉：

![](/pic/decompiling-crazy-brain/o_1afvhqsi31rbq1bhp1v8ae5h10u0e.png)

可以看到`疯狂大脑`应用没有经过任何混淆，全部都是原原本本的代码，在经过一番查找后我们可以在`LianxiFragment`中定位到我们需要的代码：

      if (MySharePreference.getPayFlag(getActivity(), 31))
      {
        Intent localIntent7 = new Intent(getActivity(), CardsLevelSelectActivity.class);
        getActivity().startActivity(localIntent7);
        return;
      }
      gamePay(31);

很简单的逻辑，如果Preference中的31号flag是true的话，我们就可以打开需要的Activity, 否则就会执行`gamePay`这个付款函数。既然你如此，我们处理办法就很多了，这里只简单介绍两种。

### 修改数据

既然应用是将是否付款的标记记录在sp中，我们只要改掉sp中的值自然就算破解成功了，通过`RootExplorer`这个软件我们可以很轻松的修改sp文件，将如下几句copy到`/data/data/com.qinghe.crazybrain/shared_prefs/crazybrain.xml`中：

	​	<boolean name="Game_35" value="true" />
	​	<boolean name="Game_31" value="true" />
	​	<boolean name="Game_32" value="true" />
	​	<boolean name="Game_33" value="true" />
	​	<boolean name="Game_34" value="true" />

重启应用，搞定！

![](/pic/decompiling-crazy-brain/o_1afvih15bpoher2161b8013m89.png)


此法虽操作简单，但只适用于root过后的手机，不具有普遍性。

### 重打包

另外一重简单的处理方法就是让getPayFlag方法永远返回true，这就需要我们对应用进行反编译与重打包了。

我们使用`apktool`， 下载地址：[http://ibotpeaches.github.io/Apktool/install/](http://ibotpeaches.github.io/Apktool/install/){:rel="nofollow"},

* 对brain.apk执行如下命令：

		apktool d ./android_offensive_and_defensive/brain.apk

*  此时，会生成对应的brain文件夹，其中的smali文件夹就是反编译出来的源码了，只不过它是晦涩难懂的smali语言，不过这并不影响我们对其做简单的修改，我们打开`MySharePreference.smali`文件，通过搜索`getFlag`我们可以很快定位该函数，如下一堆乱七八糟的代码还真是日了🐶了：

        .method public static getPayFlag(Landroid/content/Context;I)Z
        .locals 4
        .param p0, "context"    # Landroid/content/Context;
        .param p1, "game"    # I

        .prologue
        const/4 v3, 0x0

        .line 25
        const-string v1, "crazybrain"

        invoke-virtual {p0, v1, v3}, Landroid/content/Context;->getSharedPreferences(Ljava/lang/String;I)Landroid/content/SharedPreferences;

        move-result-object v0

        .line 26
        .local v0, "spf":Landroid/content/SharedPreferences;
        new-instance v1, Ljava/lang/StringBuilder;

        const-string v2, "Game_"

        invoke-direct {v1, v2}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

        invoke-virtual {v1, p1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

        move-result-object v1

        invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

        move-result-object v1

        invoke-interface {v0, v1, v3}, Landroid/content/SharedPreferences;->getBoolean(Ljava/lang/String;Z)Z

        move-result v1

        return v1
   	    .end method

虽然看起来很复杂，不过仔细看还是很好理解的，无非就是在赋值，然后将得到的值带入函数，如此反复。不过这并不重要，我们的想法就是让它永远返回true即可，更改代码如下：

    .method public static getPayFlag(Landroid/content/Context;I)Z
    	.locals 1
    	.param p0, "context"    # Landroid/content/Context;
    	.param p1, "game"    # I

    	.prologue
    	const v0, 1
    	return v0
    .end method

* 此时，我们通过apktool 将修改过的代码重新编译成apk文件：

	    apktool b ./android_offensive_and_defensive/brain -o new_brain.apk

* 此时的new_brain.apk就是我们破解后的应用，不过此时它还需要签名后才能安装到手机上，我们可以随便找一个签名文件， 执行命令:

		jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore 签名文件 -storepass  签名密码 apk文件 签名文件的别名

* 签名后的apk就是我们需要的最终apk。
* 安装后，成功打开付费板块：

​	![](/pic/decompiling-crazy-brain/o_1afvju1f8fvd10oj8k51vbb10u7e.png)



### 总结

整个破解过程还是比较轻松的，可以看出apk的制作者没有对apk做任何保护措施。这也让我不禁在想，类似于是否付费这种标记怎么设计会更安全呢。欢迎有相关经验或者想法的在下方留言，多多交流。

![We have a lot in common.](/pic/decompiling-crazy-brain/8aMiaV16NGxLwTVkTOS210u6U0MFhMTCTu7dticOMvku0Uj09yzHFib3SxPJOqnIyibicCMpDST17fropbj67AWEvBg.gif)
