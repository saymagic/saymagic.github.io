---
layout: post
keywords: Android Studio,Jcenter，上传
description: 发布开源库上传到Jcenter
title: 发布开源库上传到Jcenter
categories: [Android]
tags: [Android]
group: archive
icon: globe
---

新版的Android Studio会将远程仓库指定为Jcenter，那Jcenter在哪里？它是干嘛的呢？

要回答这个问题，我们要了解一个公司，叫做jfog，它有个网站是Bintray，这个网站类似于github，但关注的领域不一样，github管理的是文本文件，而Bintray专注于管理二进制文件，个人感觉有些类似yy和qq的关系。扯回来，我们今天的主人公Jcenter就存放在Bintray网站里，Bintray下有名的库可不止Jcenter只一个，`rpm-center`,`rubyinstaller`都是它里面的仓库。所以，如果我们想把自己的开源库存放在Jcenter上供其它人使用，主要步骤如下：

我们需要注册Bintray账号，然后上传我们的项目到Bintray，最后在Bintray里提交我们的项目，管理员会对项目审核，通过后我们就可以在Gradle里通过制定远程位置来使用自己的库了。好，Let Go！

### 注册Bintray账号

Bintray官网传送门：[https://bintray.com/](https://bintray.com/){:rel="nofollow"}

但很遗憾的是这个网站国内访问有点尴尬，你需要翻墙才可以。


Bintray是支持Github登陆的，也比较推荐在这种方式，（这里我真的想吐槽下某些sb网站做的连排泄物都不如，通过第三方登陆像还得重新注册！还得手机验证，这种网站必须拉黑）


登陆之后我们需要两个参数，一个是我们的用户名，另外一个就是api key，api key的获取可以参照我下面的gif图片：


![bintary api key](/pic/release-library-to-jcenter/o_19e91jjrp3iu5mo1p631qjvff9.gif)

先记得这两个数据的获取方式，一会我们会用到。

### 上传自己的Library到Bintray

关于怎样使用Android Studio创建Library这里就不多讲，这里假设我们有一个自己将要上传到Binray，我这里的Library很简单，简单到不需要res文件，是我编写和整理的和Android相关的工具类，我把这个Librasy命名为utils，整个Library目录结构如下：

![utils 目录](/pic/release-library-to-jcenter/o_19e92f5bb1j6u1uk13bl1i3d4u0e.png)

接下里的步骤比较繁琐，Gradle已经支持通过命令来上传Library到Bintray，但项目的相关信息需要在gradle的配置文件中制定，首先我们需要打开utils这个module下的build.gradle文件，将其替换如下：


	apply plugin: 'com.android.library'
	apply plugin: 'com.github.dcendents.android-maven'
	apply plugin: 'com.jfrog.bintray'
    def siteUrl = 'https://github.com/saymagic/***'
    def gitUrl = 'https://github.com/saymagic/***.git'
    group = "cn.saymagic" // Maven Group ID for the artifact
    version = "1.0.0"

    android {
        compileSdkVersion 21
        buildToolsVersion "21.1.1"
        resourcePrefix "随便填"
        defaultConfig {
            minSdkVersion 9
            targetSdkVersion 21
            versionCode 1
            versionName version
        }
        buildTypes {
            release {
                minifyEnabled false
                proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
            }
        }
    }
    dependencies {
        compile fileTree(dir: 'libs', include: ['*.jar'])
    }
    install {
        repositories.mavenInstaller {
            // This generates POM.xml with proper parameters
            pom {
                project {
                    packaging 'aar'
                    name '****'
                    url siteUrl
                    licenses {
                        license {
                            name 'The Apache Software License, Version 2.0'
                            url 'http://www.apache.org/licenses/LICENSE-2.0.txt'
                        }
                    }
                    developers {
                        developer {
                            id '***'
                            name '***'
                            email '***'
                        }
                    }
                    scm {
                        connection gitUrl
                        developerConnection gitUrl
                        url siteUrl
                    }
                }
            }
        }
    }
    task sourcesJar(type: Jar) {
        from android.sourceSets.main.java.srcDirs
        classifier = 'sources'
    }
    task javadoc(type: Javadoc) {
        source = android.sourceSets.main.java.srcDirs
        classpath += project.files(android.getBootClasspath().join(File.pathSeparator))
    }
    task javadocJar(type: Jar, dependsOn: javadoc) {
        classifier = 'javadoc'
        from javadoc.destinationDir
    }
    artifacts {
        archives javadocJar
        archives sourcesJar
    }
    Properties properties = new Properties()
    properties.load(project.rootProject.file('local.properties').newDataInputStream())
    bintray {
        user = properties.getProperty("bintray.user")
        key = properties.getProperty("bintray.apikey")
        configurations = ['archives']
        pkg {
            repo = "maven"
            name = "utils"
            websiteUrl = siteUrl
            vcsUrl = gitUrl
            licenses = ["Apache-2.0"]
            publish = true
        }
    }


注意里面的信息需要按照自己的个人资料进行修改。

因为上述的文件里需要依赖一些其它的库，所以接下来再到我们项目最外层build.gradle文件里，添加如下两个依赖

        classpath 'com.jfrog.bintray.gradle:gradle-bintray-plugin:1.6'
        classpath 'com.github.dcendents:android-maven-gradle-plugin:1.3'

修改后的文件如下：

	buildscript {
        repositories {
            jcenter()
        }
        dependencies {
            classpath 'com.android.tools.build:gradle:1.0.0'
            classpath 'com.jfrog.bintray.gradle:gradle-bintray-plugin:1.6'
            classpath 'com.github.dcendents:android-maven-gradle-plugin:1.3'
        }
    }

    allprojects {
        repositories {
            jcenter()
        }
    }


最后，我们在打开项目最外层的local.properties文件，添加如下两行：

	bintray.user=your_user_name
	bintray.apikey=your_apikey

your_user_name和your_apikey这两个数据就是我们在第一步注册Bintray时提到的两个参数，


解析来，在项目的根目录下执行

	gradle build

这样，我们就可以到到我们的module下会生成如下目录：/build/outputs/aar/

在arr目录下有如下两个文件：

![arr](/pic/release-library-to-jcenter/o_19e95d6s61nht1dnl7mo10p61hmf9.png)

以arr文件结尾的就是Gradle将我们的library打包成的二进制文件，别忘记了，Bintray就是用于存储二进制文件的仓库，所以执行下面的命令。就可以将我们的library上传到Bintary。

	 gradle bintrayUpload

上传成功之后，就会在bintray的maven仓库下看到我们上传的Library：

![bintray libray util](/pic/release-library-to-jcenter/o_19e97kfo5p0n1lf7bmb1m0i5o99.png)


### 提交项目到Jcenter

我们点开我们刚刚提交项目的主页，点击右下角的add to jcenter按钮

![](/pic/release-library-to-jcenter/o_19e97onj2m441ap11r7lh68vp1e.png)

接下来写一些评论：

![](/pic/release-library-to-jcenter/o_19e97rt1o13nhoii1kke1bjt1a0hj.png)

点击send后就可以等管理员的审核了。

大概一小时后，管理员就会审核通过：

![](/pic/release-library-to-jcenter/o_19eag1mqj2vm18321eb51efi12ra9.png)

这样，我们就可以在Dependence里这样来引用我们自己的项目了：

	dependencies {
    	compile 'cn.saymagic.utils:utils:1.0.0'
	}

### 参考

[https://www.virag.si/2015/01/publishing-gradle-android-library-to-jcenter/](https://www.virag.si/2015/01/publishing-gradle-android-library-to-jcenter/){:rel="nofollow"}

[http://stackoverflow.com/questions/24852219/android-buildscript-repositories-jcenter-vs-mavencentral](http://stackoverflow.com/questions/24852219/android-buildscript-repositories-jcenter-vs-mavencentral){:rel="nofollow"}
