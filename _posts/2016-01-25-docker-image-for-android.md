---
layout: post
keywords: 构建可持续编译,Android,环境,Docker镜像
description: 构建可持续编译Android环境的Docker镜像
title: 构建编译Android项目的Docker镜像
categories: [Android]
tags: [Android]
group: archive
icon: globe
---

在接触Docker的这段时间里，Docker给我的Android开发带来了许多方便与惊喜。本文就是将Docker用于自动化编译Android项目的一次尝试。

## 1.构建Android编译环境的基础镜像

首先我们构建一个具有Android编译环境的基础镜像，该镜像主要是做Android SDK的下载与components的安装，我已将其push到了DockerHub:[androidbuilder](https://hub.docker.com/r/saymagic/androidbuilder/){:rel="nofollow"}。目前的最新版本是V1.0,已安装版本号为19、21、22、23相关的build-tool。

### 尝试编译Android项目

  有了基础镜像，我们来尝试使用其编译Android项目，在我们项目的根目录添加如下Dockerfile：

    ROM saymagic/androidbuilder:v1.0

    MAINTAINER saymagic <saymagic.dev@gmail.com>

    ENV PROJECT /project

    RUN mkdir $PROJECT
    WORKDIR $PROJECT

    ADD . $PROJECT

    RUN chmod +x ./gradlew
    RUN echo "sdk.dir=$ANDROID_HOME" > local.properties && \
    ./gradlew --stacktrace app:dependencies


我们首先将该Dockerfile构建成镜像：

    docker build -t saymagic/androiddockertest:v1.0 .

这样，saymagic/androiddockertest:v1.0镜像中就会包含了我们的项目，之后，我们只需要将该容器运行起来，在根目录下输入如下命令：

    docker run -it -v $(pwd)/app:/project/app saymagic/androiddockertest:v1.0 ./gradlew build --info

此时，我们就可以看到通过Docker构建出的apk文件：

![](/pic/docker-image-for-android/o_1a9sfasro1c7olkc1a6n1d4uh649.png)

以上只是一个简单的尝试，如果你对源码感兴趣或者想构建自己的编译环境，请参考这里：[https://gist.github.com/saymagic/dcbcf1629c53e5b721c3](https://gist.github.com/saymagic/dcbcf1629c53e5b721c3){:rel="nofollow"}

## 2.搭建持续编译环境

第一步中我们实现了可以编译Android项目的基础镜像，我们将其做一次大改进，继续在基础镜像中安装gradle与jenkins。搭建一个可以持续编译Android项目的Docker环境。

最终成型的镜像在此：[androidjenkins](https://hub.docker.com/r/saymagic/androidjenkins/){:rel="nofollow"}，最新版本v2.0.

使用方式非常简单，在含有Docker的主机上运行如下命令(注意指定的Volume与Port)：

    docker run -it -v $(pwd)/jenkins:/var/jenkins_home -p 80:8080 saymagic/androidjenkins:v2.0 ./start.sh

运行完成之后，打开我们的主机80端口，就会看到Jenkins的身影：

![](/pic/docker-image-for-android/o_1a9sge57g1uuufr71svq12ab1gqoo.png)

此时，推荐安装如下一些Jenkins插件：

* Gradle 插件：

![](/pic/docker-image-for-android/o_1a9sg57vg1brvqhp1c9kuch4oee.png)

* Git 插件：

![](/pic/docker-image-for-android/o_1a9sg5vd6n0t11hel8r6441e12j.png)

* Fir.im的Jenkins插件：

使用方法： [http://blog.fir.im/jenkins/](http://blog.fir.im/jenkins/){:rel="nofollow"}
该插件可以将构建后的apk文件直接上传至Fir.im，可以很方便的让测试人员下载到最新版本。


关于Jenkins的相关使用这里不做过多介绍。至此，一个可持续编译Android的环境就已完成，要知道，我们只运行了一行代码而已。


该镜像的相关源码在这里：[https://github.com/saymagic/AndroidJenkins](https://github.com/saymagic/AndroidJenkins){:rel="nofollow"}，欢迎star。


##  总结

综上，我们只需要本地进行push代码，就会更新[Fir.im](http://fir.im){:rel="nofollow"}中的项目。并且整个过程非常简单，无需再搭建复杂Android的环境。非常值得一试。

 但需要提醒大家的是整个镜像还是相当大的，并且对于内存的需求也是很高，比如不到1G内存的虚拟机就不要尝试了。推荐[digitalocean](https://m.do.co/c/97e74cd7d055)的新加坡机房，上2G内存，直接选择含有Docker的主机，速度相当不错，因为在国外，也无需为各种类库无法下载而苦恼。我相信一刻钟的时间你就会看到成型的效果。Enjoy it！

 ![What a coincidence](/pic/docker-image-for-android/8aMiaV16NGxJCKvqjAIyEe9HxECjK0aNZ1BIu5GEUWssNGOThvFLN6sMSAEpRS2mKx54knWdZCLApmpKLKdicBQg.gif)


## 参考

[http://ainoya.io/docker-android-walter](http://ainoya.io/docker-android-walter){:rel="nofollow"}
