---
layout: post
keywords: ndk, jni, kotlin
description: Interaction of Kotlin and C/C++/Kotlin 中调用 c/c++代码
title: Android NDK简介(一)
categories: [Android]
tags: [NDK]
group: archive
icon: globe
---

NDK(Native Development Kit)是一个帮助开发者在 Android 中使用 C 和 C++代码的工具集。并且提供了开发者可以用来管理底层任务和访问物理设备元素的平台类库。例如传感器和触摸输入。NDK 可能并不适合大多数 仅仅需要 Java 代码和Android API 来开发他们应用的Android 初学者。

![image](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fony45eyr2g20rs0dwnpe.gif)

## 什么是 JNI

JNI（Java Native Code）用来连接 Java 和 底层代码的桥梁。它是在 Java应用和其它语言编写的类库之前的桥梁。大多数和底层代码的交互是在 Java 层使用 C/C++编写的函数，反之亦然。这都是 JNI 的功劳。

## 为什么我们需要 Android NDK

NDK可能提高我们应用的性能。这对于大多数对处理器有高要求的应用都是适用的。许多多媒体应用和视频游戏使用底层代码来处理处理器密集型的任务。性能可以从如下三点来提高：

* 底层代码被编译成二进制码,可以直接在操作系统上运行。然而 Java 代码被翻译成 Java 字节码，是被虚拟机执行的。
* 底层代码允许开发者使用一些在 Android SDK 中没有提供的关于处理器等方面的特性。
* 可以在编译级别优化代码

例如 ffmpeg 等许多优秀的类库都是使用 C/C++来编写的，这多亏了NDK才使得我们可以再  Java 中方便的集成。
本文主要介绍如何使用 NDK 来开发应用。

## 开始

首先，我们创建一个名称为`KotlinWithAndroidNdk`的新工程。使用 Kotlin 作为应用层开发语言。目前的 AndroidStudio 的最新版本是3.0.0。步骤如下：

* 通过 SDK Manager下载 DNK、LLDB（调试器） 和 CMake。
* 在新工程中勾选`Include C++  support`和`Include Kotlin support`按钮。
![image](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073ly1fon4y112rfj219i0ms0uz.jpg)
* 如过需要使用一些如`lambda`、`委托构造函数`等特性，选择`C++11`:
![image](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073ly1fon54k4ghej21ck0n00us.jpg)
* 最后点击`Finish`即完成了项目的创建。

## 项目结构

创建好之后，项目结构如下：

![image](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073ly1fon5a7mog0j20v20vq0vy.jpg)

我们需要把`C/C++`代码放在 cpp 文件夹，CMake 会为我们自动生成`.externalNativeBuild`文件夹。

### CMake

CMake 是一个通过`CMakeList.txt`配置文件来控制管理编译`C/C++`代码的工具。Android Studio 为我们自动生成的`CMakeList.txt`文件主要内容如下：

CMake 的版本：

```
cmake_minimum_required(VERSION 3.4.1)
```

---

`add_library`函数用于创建并命名一个库，将其设置为STATIC或SHARED，并为其源代码提供相对路径。我们可以定义多个库，CMake负责构建它们。 Gradle会自动将共享库打包进APK。

```
add_library( # Sets the name of the library.
             native-lib

             # Sets the library as a shared library.
             SHARED

             # Provides a relative path to your source file(s).
             src/main/cpp/native-lib.cpp )
```  

---
       
`find_library`函数搜索指定的预构建库并将路径存储在一个变量中。这个变量的位置在前文提到的`.externalNativeBuild`文件夹下的`.CMakeCache.txt`文件中：

![image](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073ly1fon5a7mog0j20v20vq0vy.jpg)

![image](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073ly1fon6036pi3j21kq0i6aeh.jpg)

由于默认情况下CMake在搜索路径中包含系统库，因此只需指定要添加的公共NDK库的名称即可。 CMake在完成构建之前验证该库是否存在。 

```
find_library( # Sets the name of the path variable.
              log-lib

              # Specifies the name of the NDK library that
              # you want CMake to locate.
              log )
```
              
---

`target_link_libraries`函数用于设置要链接的库文件的名称,上面的`find_library`函数会查找log 库的位置放置到`log-lib`变量中，下面的配置用于将 log 库链接到我们的工程中：

```
target_link_libraries( # Specifies the target library.
                       native-lib

                       # Links the target library to the log library
                       # included in the NDK.
                       ${log-lib} )
```  
## Gradle 配置

在build.gradle文件中，我们可以为CMake指定CMakeLists.txt的额外标志和路径。 这些都是在创建项目后自动生成的，并不需要我们自己做。

```
android {

	...

    defaultConfig {
    
    	...
    	
       externalNativeBuild {
            cmake {
                cppFlags "-std=c++11"
            }
       }

    }
	
    externalNativeBuild {
        cmake {
           path "CMakeLists.txt"
        }
    }
}
```

## 头文件

`c/c++`中有头文件的概念。我们可以通过` #include <file>`引入系统的头文件，使用`#include“file”`来引入我们自己编写的头文件。我们暂且可以认为使用上面的语句会将引用头文件中内容全部拷贝到当前的文件中。

有时候，我们可能会在一个文件中重复添加同一个头文件，这会在编译期间报错。为了防止这种情况，可以在`#ifndef - #endif`块中包装头文件的内容。

我们可以在头文件定义新类型的数据。

```
#ifndef INMEMORYSTORAGE_STORE_H
#define INMEMORYSTORAGE_STORE_H

#include <cstdint>
#include "jni.h"

#define STORE_MAX_CAPACITY 16

typedef struct {
    StoreEntry mEntries[STORE_MAX_CAPACITY];
    int32_t mLength;
} Store;

#endif //INMEMORYSTORAGE_STORE_H
```
也可以在头文件中声明函数：

```
#ifndef INMEMORYSTORAGE_STOREUTIL_H
#define INMEMORYSTORAGE_STOREUTIL_H

#include <jni.h>
#include "Store.h"

bool isEntryValid(JNIEnv* pEnv, StoreEntry* pEntry, StoreType pType);

StoreEntry* allocateEntry(JNIEnv* pEnv, Store* pStore, jstring pKey);

StoreEntry* findEntry(JNIEnv* pEnv, Store* pStore, jstring pKey);

void releaseEntryValue(JNIEnv* pEnv, StoreEntry* pEntry);

void throwNoKeyException(JNIEnv* pEnv);

#endif //INMEMORYSTORAGE_STOREUTIL_H
```

## JNI 中的函数

要从Kotlin中调用Native函数，分为两个部分。我们以创建一个用于接收两个整形的参数，并返回其相加的结果的函数为例。

首先，在 Kotlin 使用`external `关键字来声明一个函数为Native 函数：

```
package your.package.name

class Math {

    external fun add(a: Int, b: Int): Int

}
```

其次，我们需要在`C/C++`中编写与 Kotlin 中对应的函数。我们需要在普通的 Native 函数上添加extern“C”关键字和JNIEXPORT宏（宏是被赋予名称的代码片段。 每当使用该名称时，它将被宏的内容替换）。JNIEXPORT宏来自`jni.h`头文件，其定义如下：

```
#define JNIIMPORT
#define JNIEXPORT  __attribute__ ((visibility ("default")))
#define JNICALL
```

所以，JNIEXPORT将被替换为__attribute__（（visibility（“default”）））。 然后我们需要指定返回类型和JNICALL宏。 最后是函数的名称和参数。其中，函数名称必须是`Java_packagename_className_functionName` 的形式。参数也至少有两个：`JNIEnv * pEnv`和`jobject pThis`。 `JNIEnv * pEnv`是指向指向函数表的指针， 它提供了jni.h文件中定义的大部分JNI函数的实现。 `jobject pThis `是一个在Java代码中包含此函数的类的实例。 在我们的例子中，它是Math类的一个实例。 最终，完整的 Native 代码如下：

```

extern "C"
JNIEXPORT jint JNICALL
Java_your_package_name_Math_add(
        JNIEnv* pEnv,
        jobject pThis,
        jint a,
        jint b) {
    return a + b;
}
```


## JNI中的原始类型

在 Java 中存在如`boolean`、`int`等8种基本类型，在 JNI 中也同样存在与之对应的类型：

![image](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073ly1fon9hcm5kvj21xy0ocnfp.jpg)


## JNI中的引用类型

除了上面说的原始类型，Java 中也存在如`String`、`Integer`等引用类型，JNI 中也存在与之对应的描述类型：

![image](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073ly1fona8xluwaj20v80zggr4.jpg)


Java字符串使用UTF-16的格式存储在内存中。 但字符串在 Native 代码中是以变种 UTF-8编码格式存储的。如果将Java字符串存储在 Native 中，示例代码如下：


```
extern "C"
JNIEXPORT void JNICALL
Java_com_ihorkucherenko_storage_Store_setString(
        JNIEnv* pEnv,
        jobject pThis,
        jstring pKey,
        jstring pString) {
    // Turns the Java string into a temporary C string.
    StoreEntry* entry = allocateEntry(pEnv, &gStore, pKey);
    if (entry != NULL) {
        entry->mType = StoreType_String;
        // Copy the temporary C string into its dynamically allocated
        // final location. Then releases the temporary string.
        jsize stringLength = pEnv->GetStringUTFLength(pString);
        entry->mValue.mString = new char[stringLength + 1];
        // Directly copies the Java String into our new C buffer.
        pEnv->GetStringUTFRegion(pString, 0, stringLength, entry->mValue.mString);
        // Append the null character for string termination.
        entry->mValue.mString[stringLength] = '\0';
    }
}
```

## 枚举、联合体 和 结构体

枚举是由整型常量组成的用户定义数据类型。 要定义一个枚举，使用`enum` 关键字：

```
typedef enum {
    StoreType_Float,
    StoreType_String,
    StoreType_Integer,
    StoreType_Object,
    StoreType_Boolean,
    StoreType_Short,
    StoreType_Long,
    StoreType_Double,
    StoreType_Byte,
} StoreType;
```

联合体是C中的特殊数据类型，其关键字是`union`。联合体允许在同一个内存位置存储不同的数据类型。 我们可以定义包含许多成员的联合，但每个联合体变量中只能设置其中一个成员的值。联合体为多个数据需要共享内存或者多个数据每次只取其一时的情形提供了高效的解决方式。
```
typedef union {
    float mFloat;
    int32_t mInteger;
    char* mString;
    jobject mObject;
    jboolean mBoolean;
    jshort mShort;
    jlong mLong;
    jdouble mDouble;
    jbyte mByte;
} StoreValue;
```
结构体允许将不同类型的数据组合在一起：

```
typedef struct {
    char* mKey;
    StoreType mType;
    StoreValue mValue;
} StoreEntry;
```
我们可以将这些数据类型在`*.h`或者`*.cpp`中定义。如果需要在多个文件中共享，则定义在`*.h`文件中，否则定义在`*.cpp`中即可。

## 指针

内存地址是一个固定大小的数据块，由处理器的硬件来处理，通常占用32或64位内存。计算机的RAM就像一连串的内存地址，C / C ++中的指针是一个变量，它代表内存中的唯一地址。

```
int var = 20; //actual variable decalration
int *ip; //pointer variable declaration
ip = &var; //store address of var in pointer
```
以上面代码为例，声明指针使用`*`符号，将变量的地址付给指针变量使用`&`符号。

## 引用类型

在 JNI 中，存在着局部、全局、弱全局三种引用方式。

* 局部引用

局部引用在Native方法调用期间有效。 在Native方法返回后它们会自动释放。 每个局部引用都会花费一定量的Java虚拟机资源。 程序员需要确保Native方法不会过度分配局部引用。 尽管在本地方法返回到Java之后局部引用会自动释放，但局部引用的过度分配可能会导致 JVM在Native方法期间耗尽内存。我们可以通过` NewLocalRef（JNIEnv *env）`等方法创建一个局部引用。但因为 JVM 中只规定JNI 中至少可以创建16个局部引用，所以如果我们创建过多的临时局部变量，可以通过`void DeleteLocalRef(JNIEnv *env, jobject localRef);`方法来主动释放不再使用的局部引用。

* 全局引用

全局引用可以跨方法、跨线程使用，直到它被手动释放才会失效。同局部引用一样，全局引用也会阻止它所引用的对象被 GC 回收。全局引用只能使用`NewGlobalRef`函数来创建，使用`void DeleteGlobalRef(JNIEnv *env, jobject globalRef)`来销毁全局引用。

* 弱全局引用

与全局引用类似，弱引用可以跨方法、线程使用。但与全局引用很不同的一点是，弱引用不会阻止GC回收它引用的对象。全局弱引用使用`NewWeakGlobalRef `创建，使用`void DeleteWeakGlobalRef(JNIEnv *env, jweak obj)`来释放。

弱全局引用是一种特殊的全局引用。 与普通全局引用不同，弱全局引用允许底层Java对象被垃圾回收。 在使用全局或本地引用的任何情况下，都可能使用弱全局引用。 当垃圾收集器运行时，如果该对象只被弱引用引用，它将释放基础对象。 指向释放对象的弱全局引用在功能上等同于NULL。 程序员可以通过使用IsSameObject将弱引用与NULL进行比较来检测弱全局引用是否指向已释放对象。

## 工程

现在我们有一些基本的理论知识，足以方便我们在项目中使用C/C ++。下面是一个用 Native编写的key-value存储[示例项目](https://github.com/KucherenkoIhor/KotlinWithAndroidNdk)。

![image](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073ly1fonxb8f5s7g20710cib2a.gif)

首先，在 Kotlin 中huan 构建一个`Store`类来封装所有的 Native 接口：

```
class Store {

    external fun getCount(): Int

    @Throws(IllegalArgumentException::class)
    external fun getString(pKey: String): String

    @Throws(IllegalArgumentException::class)
    external fun getInteger(pKey: String): Int

    @Throws(IllegalArgumentException::class)
    external fun getFloat(pKey: String): Float

    ....

    external fun setString(pKey: String, pString: String)

    external fun setInteger(pKey: String, pInt: Int)

    external fun setFloat(pKey: String, pFloat: Float)

    external fun setBoolean(pKey: String, pBoolean: Boolean)

    ....

    companion object {
        init {
            System.loadLibrary("Store")
        }
    }
}
```

所有这些方法在`Store.cpp`文件中都有对应的Native函数。

在CMake中，我展示了如何使用函数`add_library`创建共享库。我们可以使用标准System.loadLibrary调用从共享库加载Native代码。 这时JNI_onLoad方法会被调用。

```
extern "C" JNIEXPORT jint JNI_OnLoad(JavaVM* vm, void* reserved)
{
    __android_log_print(ANDROID_LOG_INFO,  __FUNCTION__, "onLoad");
    JNIEnv* env;
    if (vm->GetEnv(reinterpret_cast<void**>(&env), JNI_VERSION_1_6) != JNI_OK) {
        return -1;
    }

    gStore.mLength = 0;
    return JNI_VERSION_1_6;
}
```

我们可以在这个方法中初始化一些变量。

我们的CMakeLists.txt文件还包含调用target_link_libraries来添加日志库到项目中。 我们可以将日志库通过#include <android / log.h>包含到* .cpp文件中，并使用__android_log_print（ANDROID_LOG_INFO，__FUNCTION__，“onLoad”）方法来打印日志;.

在 Kotlin 中，我们需要使用`companion object`来代替  Java 中的static 代码块，使用`external `代替 Java 中的`native`关键字
。

另外需要了解的一点，Native方法可以抛出Java的异常。 如果在 Store 中试图获得一些不存在的值，Native 层会抛出一个适当的异常。 StoreUtil.cpp文件包含这个throwNoKeyException函数：

```
bool isEntryValid(JNIEnv* pEnv, StoreEntry* pEntry, StoreType pType)
{
    if(pEntry == NULL)
    {
        throwNoKeyException(pEnv);
    }

    return ((pEntry != NULL) && (pEntry->mType == pType));
}

void throwNoKeyException(JNIEnv* pEnv) {
    jclass clazz = pEnv->FindClass("java/lang/IllegalArgumentException");
    if (clazz != NULL) {
        pEnv->ThrowNew(clazz, "Key does not exist.");
    }
    pEnv->DeleteLocalRef(clazz);
}
```

## 结论

在本文中，我们看到了如何在Kotlin中调用C/C ++代码进行通信。本文也介绍了一些NDK的基础知识，并基于它们创建了示例项目。 示例项目中将Java Strings转换为Native代码，将Kotlin对象传递给Native函数，并可以抛出Java异常。 在第二篇文章中，我们了解如何从Native代码中调用Kotlin 代码。

本文主要翻译于[Android NDK: Interaction of Kotlin and C/C++](https://proandroiddev.com/android-ndk-interaction-of-kotlin-and-c-c-5e19e35bac74)，并在此基础上做了部分改动。
