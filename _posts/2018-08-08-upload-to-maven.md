---
layout: post
keywords: 发布library, maven, nexus
description: 本文介绍如何将android的library发布到本地仓库、nexus仓库和jcenter仓库
title: 快速发布Android Library的几种方式
categories: [Android]
tags: [Android]
group: archive
icon: globe
---

> 在日常开发中，我们经常需要将一个library发布到maven服务器上，供其它人来使用。这其中一般包括发到本地供自己调试使用、发到私服供项目使用、发到外服对外公开使用三种情况。本文针对这三种情况，一一介绍如果快速的完成library的发布。

## 发布到本地

我们可以使用`maven-publish`这个plugin来将一个编译后library发布到本地仓库。

只需要在需要发布的library的build.gradle文件中加入下面的代码：

```
apply plugin: 'maven-publish'

task generateSourcesJar(type: Jar) {
    from android.sourceSets.main.java.srcDirs
    classifier 'sources'
}

publishing {
    publications {
        maven(MavenPublication) {
            groupId 'YOUR_GROUP_ID'
            artifactId project.name
            version 'YOU_VERSION'
            artifact("$buildDir/outputs/aar/${project.getName()}-release.aar")
            artifact generateSourcesJar
        }
    }
}

tasks.whenTaskAdded {
    task ->
        if ("assembleRelease".equals(task.name)) {
            publishToMavenLocal.dependsOn assembleRelease
        }
}

```

我们只需要将上面代码中的`YOUR_GROUP_ID`和`YOU_VERSION`按需修改即可。改好之后运行

```
./gradlew publishToMavenLocal
```

即可将library发布到本地。本地maven的位置在用户家目录的`.m2/repository`中，我们可以按照library的group id来索引位置：

![](https://raw.githubusercontent.com/saymagic/pic/master/c0755e72ly1fu2cch3ldoj20ne023dfz.jpg)
 
 发布后的内容如下：
 
![](https://raw.githubusercontent.com/saymagic/pic/master/c0755e72gy1fu2ca9e6quj20ke08it9f.jpg)

### 引用本地仓库

如果我们想引用本地仓库，只需要在项目根目录的`build.gradle`文件的 `allprojects\repositories`中添加`mavenLocal()`即可，示例如下：

```
allprojects {
    repositories {
        mavenLocal()
        google()
        jcenter()
    }
}
```

## 发布到私有服务器

如果我们的library不仅自己在用，还需要对项目组的其它人使用，我们就需要将我们的library发布到我们项目组的私有maven服务器上。

### 搭建私有maven仓库

目前比较通用的搭建私有maven仓库的方法是使用nexus，本文也是基于此款软件来搭建的。搭建nexus的方式比较多，个人推荐使用`docker-compose`来安装，一来比较简单，二来备份也很方便。

nexus的官方docker仓库是[https://hub.docker.com/r/sonatype/nexus/](https://hub.docker.com/r/sonatype/nexus/), 我们可以以此来编写一个`docker-compose`版本的脚本：



```
version: '2'

services:
  nexus:
    restart: always
    image: sonatype/nexus
    ports:
    - 8081:8081
    volumes:
    - YOUR_LOCAL_PATH:/sonatype-work
    environment:
    - MAX_HEAP=1024m
    - MIN_HEAP=1024m
```

我们只需要将上面脚本的`YOUR_LOCAL_PATH`换成我们服务器上的一个目录即可，在此脚本的目录下运行`docker-compose up -d`,即可在当前的`8081`端口下开启一个nexus服务。

![](https://raw.githubusercontent.com/saymagic/pic/master/c0755e72ly1fu2bm0xt6bj21680n8aeh.jpg)

nexus的默认账户为`admin`,密码为`admin123`


### 发布到私有maven仓库

搭建好了nexus之后，我们就可以向nexus中发布自己的library了。我们依然可以使用`maven-publish`这个插件来发布。只需要在刚才发布到本地的代码基础上增加一些内容即可，更新后版本如下：

```
apply plugin: 'maven-publish'

task generateSourcesJar(type: Jar) {
    from android.sourceSets.main.java.srcDirs
    classifier 'sources'
}

publishing {
    publications {
        maven(MavenPublication) {
            groupId 'YOUR_GROUP_ID'
            artifactId project.name
            version 'YOUR_VERSION'
            artifact("$buildDir/outputs/aar/${project.getName()}-release.aar")
            artifact generateSourcesJar
        }
    }
    repositories {
        maven {
            url "http://YOUR_NEXUS_SERVER_IP:YOUR_NEXUS_SERVER_PORT/nexus/content/repositories/releases"
            credentials {
                username = "YOUR_NEXUS_SERVER_USER_NAME"
                password = "YOUR_NEXUS_SERVER_USER_PASSWORD"
            }
        }
    }
}

tasks.whenTaskAdded {
    task ->
        if ("assembleRelease".equals(task.name)) {
            publishToMavenLocal.dependsOn assembleRelease
            publish.dependsOn assembleRelease
        }
}
```

主要是在`publishing`中增加`repositories`代码块，将自己的nexus相关信息配置上去即可。

运行 `./gradlew publishToMavenLocal` 发布library到本地仓库

运行 `./gradlew publish` 发布library到nexus仓库

### 引用nexus仓库

引用nexus仓库和引用本地仓库基本相同，示例如下：

```
buildscript {
    repositories {
        mavenLocal()
        maven {
            url 'http://10.240.133.99:8079/nexus/content/groups/public/'
        }
        google()
        jcenter()
    }
    ...
}
```

## 发布到jcenter

发布到私有maven库已经可以满足我们日常的工作需求，但如果我们是热爱分享的人，我们肯定希望我们编写的library能攻提供给更多的人来使用。在android项目中，会在repositories中默认添加了jcenter仓库：

![](https://raw.githubusercontent.com/saymagic/pic/master/c0755e72gy1fu2esx646cj20h906k74k.jpg)

所以我们只需要将自己的library发布到jcenter上，别人就可以很方便的下载我们的library了。

### 注册jcenter

前往[bintray.com/signup/oss](bintray.com/signup/oss) 进行注册，然后登陆。

登陆之后我们需要两个参数，一个是我们的用户名，另外一个就是api key，api key的获取可以参照我下面的gif图片：


![bintary api key](https://raw.githubusercontent.com/saymagic/pic/master/o_19e91jjrp3iu5mo1p631qjvff9.gif)

请牢记这两个值，一会上传需要用到。

### 发布library

发布到jcenter最方便的方法是使用`com.novoda.bintray-release`，方法如下：

* 在jcenter的maven仓库页面（地址为https://bintray.com/YOUR_JCENTER_USER_NAME/maven），点击“Add New Package”，创建一个新的package：

![](https://raw.githubusercontent.com/saymagic/pic/master/c0755e72ly1fu2fmwfoxsj20jx0qu762.jpg)

牢记上面package自己填写的name字段。

* 在根目录的`build.gradle`的`dependencies`中增加classpath(`com.novoda:bintray-release:+`)：

![](https://raw.githubusercontent.com/saymagic/pic/master/c0755e72ly1fu2fqn2v5dj20jv0alwfj.jpg)

* 在待发布的library中增加如下代码：

```
apply plugin: 'com.novoda.bintray-release'

tasks.withType(Javadoc) {
    options{ encoding "UTF-8"
        charSet 'UTF-8'
        links "http://docs.oracle.com/javase/7/docs/api"
    }
}

publish {
    userOrg = 'YOUR_JCENTER_USER_NAME'
    groupId = 'YOUR_GROUP_ID'
    artifactId = 'YOUR_PACKAGE_NAME'
    publishVersion = 'YOUR_VERSION'
    desc = 'YOUR_CUSTOM_DESC'
    website = 'YOUR_CUSTOM_WEBSITE'
}

```

更换`publish`中的相应字段。

最后执行

```
/gradlew clean build bintrayUpload -PbintrayUser=YOUR_JCENTER_USER_NAME -PbintrayKey=YOUR_API_KEY -PdryRun=false
```

即可发布成功：

![](https://raw.githubusercontent.com/saymagic/pic/master/c0755e72ly1fu2fnnaf1mj20ha07faam.jpg)

此时发布的library并不能被别人通过`jcenter`直接引用。你需要点进library详情页面，点击`Add to JCenter`按钮，将其提交给工作人员审核，审核通过后，别人就可以使用了。

![](https://raw.githubusercontent.com/saymagic/pic/master/c0755e72gy1fu2ibwveczj218i0s7dkk.jpg)


