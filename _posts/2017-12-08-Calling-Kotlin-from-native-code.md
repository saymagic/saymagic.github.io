---
layout: post
keywords: ndk, jni, kotlin
description: Interaction of Kotlin and C/C++/Kotlin 中调用 c/c++代码
title: Android NDK简介(二)
categories: [Android]
tags: [NDK]
group: archive
icon: globe
---

在前面的文章中，我们了解了关于Android NDK的基本理论知识。 我们看到了如何让Kotlin调用C/C ++代码。 在本篇文章中，我们来看下如何在 C/C++中调用 Kotlin 代码。

![image](https://ws1.sinaimg.cn/large/8f2eb073gy1fony45eyr2g20rs0dwnpe.gif)

## 为什么需要在 Native代码中调用 Kotlin 代码

最显而易见的理由是用于回调。当我们在 Native 代码中处理一些操作，我们需要知道这个操作何时结束并且得到结果。例如，在上一篇的实例中，我们想知道什么当一个新的值被存储。这个时候，就需要在 Native 中回调 Kotlin 代码。

![image](https://wx3.sinaimg.cn/large/8f2eb073ly1foodkjt6wej20jk0fstao.jpg)

## 调用静态属性

JNIEnv包含许多处理静态字段的函数。 首先，你必须使用`jfieldID GetStaticFieldID（JNIEnv * env，jclass clazz，const char * name，const char * sig）`方法来获得静态字段的id。

在Kotlin中没有静态成员，但是每个Kotlin类都可以有companion对象，companion对象在加载相应的类时被初始化，我们可以使用它的字段和函数来匹配Java静态初始化的语义。 因此，我们可以使用它来加载Native库：

```
class Store {

    companion object {
        init {
            System.loadLibrary("Store")
        }
    }
}
```
我们可以在companion对象中添加属性：

```

companion object {

        val static: Int = 3

        init {
            System.loadLibrary("Store")
        }

}
```
JNIEnv包含了不同的方法来从 Native 代码中获取Kotlin 中的静态属性:

![image](https://ws1.sinaimg.cn/large/8f2eb073gy1fonyfhvmq4j20zg0wah70.jpg)

我们可以通过下面的方法来获取 Kotlin 中的静态int属性:

```
class clazz = env->FindClass("com/ihorkucherenko/storage/Store");
jfieldID fieldId = env->GetStaticFieldID(clazz, "static", "I");
if (fieldId == NULL) {
    __android_log_print(ANDROID_LOG_INFO,  __FUNCTION__, "fieldId == null");
} else {
    jint fieldValue = env->GetStaticIntField(clazz, fieldId);
    __android_log_print(ANDROID_LOG_INFO,  __FUNCTION__, "Field value: %d ", fieldValue); //Field value: 3
}
```

`GetStaticIntField`第三个参数是对应的 Kotlin 代码的类型代码，为了确定方法的签名，我们使用类型代码。下表总结了JNI中各种类型及其代码：

![image](https://wx3.sinaimg.cn/large/8f2eb073gy1fonyjjxn74j213e0ledwh.jpg)

如果我们在普通对象（非companion对象）中创建这个属性，再对其调用`GetStaticIntField`方法，就会触发`java.lang.NoSuchFieldError: no “I” field “static” in class “Lcom/ihorkucherenko/storage/Store;” or its superclasses`异常。如果使用了`Int?`类型，也会收到这个错误。

## 调用静态方法

要获得静态方法的id，需要使用`jmethodID GetStaticMethodID（JNIEnv * env，jclass clazz，
const char * name，const char * sig`方法。 JNIEnv包含了几组可以通过方法 id 来调用 Kotlin 中静态方法的方法：

* NativeType CallStatic<type>Method(JNIEnv *env, jclass clazz,
jmethodID methodID, ...);

* NativeType CallStatic<type>MethodA(JNIEnv *env, jclass clazz,
jmethodID methodID, jvalue *args);

* NativeType CallStatic<type>MethodV(JNIEnv *env, jclass clazz,
jmethodID methodID, va_list args);

每组方法在参数上有所不同。其中<type>用于描述返回类型，完整的静态调用函数如下：


![image](https://ws1.sinaimg.cn/large/8f2eb073gy1fonysce765j20nk11ykg0.jpg)

我们可以尝试一下：

```
class Store {

    .........

    companion object {
        
        @JvmStatic
        fun staticMethod(int: Int) = int

        init {
            System.loadLibrary("Store")
        }
    }
}
```

我们可以使用`@JvmStatic`注解为`Store`生成额外的静态方法。我们可以查看`Store`编译后的 class 字节码：

```
ublic final static staticMethod(I)I
  @Lkotlin/jvm/JvmStatic;()
   L0
    GETSTATIC com/ihorkucherenko/storage/Store.Companion : Lcom/ihorkucherenko/storage/Store$Companion;
    ILOAD 0
    INVOKEVIRTUAL com/ihorkucherenko/storage/Store$Companion.staticMethod (I)I
    IRETURN
   L1
    LOCALVARIABLE int I L0 L1 0
    MAXSTACK = 2
    MAXLOCALS = 1
```
 
 注意上面字节码的`(I)I`，它代表了`staticMethod(int: Int) = int`方法在 JNI 中的方法签名。
 
 ![image](https://wx4.sinaimg.cn/large/8f2eb073ly1foo2stohwjj20u0142gyo.jpg)
 
 
 ##调用实例的属性
 
 与前面的例子类似，我们将使用下面的函数来检索实例属性的 id：
 
 ```
 jfieldID GetFieldID（JNIEnv * env，jclass clazz，
const char * name，const char * sig）;.
```

获取jfieldID的值之后，调用下面的一组函数即可获取属性的值：

![image](https://ws3.sinaimg.cn/large/8f2eb073gy1foo7djy7mbj20yi0ys4g3.jpg)

例如在`Store`类中有如下字段：

```
private val property = 3
```

如果我们需要在 Native 中获取property的值，首先需要在 Native 中获取`Store`对应的 jobject 实例，然后通过`GetIntField`函数检索`property`属性对应的 id。最后，调用`GetIntField`方法来获取`property`属性的值。

```
jclass clazz = env->FindClass("com/ihorkucherenko/storage/Store");
jmethodID constructor = env->GetMethodID(clazz, "<init>", "()V");
jobject storeObject = env->NewObject(clazz, constructor);

jfieldID fieldId = env->GetFieldID(clazz, "property", "I");
jint value = env->GetIntField(storeObject, fieldId);
__android_log_print(ANDROID_LOG_INFO,  __FUNCTION__, "Property value: %d ", value); //Property value: 3 
```

## 调用实例的方法

调用实例的方法和调用静态方法没有太大的差别，直接看下面的代码即可理解：

```
jclass clazz = env->FindClass("com/ihorkucherenko/storage/Store");
jmethodID constructor = env->GetMethodID(clazz, "<init>", "()V");
jobject storeObject = env->NewObject(clazz, constructor);

jmethodID methodId = env->GetMethodID(clazz, "getSomething", "()I");
jint value = env->CallIntMethod(storeObject, methodId);
__android_log_print(ANDROID_LOG_INFO,  __FUNCTION__, "value: %d ", value); //value: 3
```

和获取属性类似，首先通过`GetMethodID `方法获取方法 id，然后通过`CallIntMethod`方法调用方法。

## 回调示例

我们在上一篇文章的[工程](https://github.com/KucherenkoIhor/KotlinWithAndroidNdk)里增加回调：

```
interface StoreListener {

    fun onIntegerSet(key: String, value: Int)

    fun onStringSet(key: String, value: String)

}
class Store : StoreListener {

    val listeners = mutableListOf<StoreListener>()

    override fun onIntegerSet(key: String, value: Int) {
        listeners.forEach { it.onIntegerSet(key, value) }
    }

    override fun onStringSet(key: String, value: String) {
        listeners.forEach { it.onStringSet(key, value) }
    }
  
  .....
}
```

之后，在 Native 函数的合适时机回调 Kotlin 的代码：

```
JNIEXPORT void JNICALL
Java_com_ihorkucherenko_storage_Store_setString(
        JNIEnv* pEnv,
        jobject pThis,
        jstring pKey,
        jstring pString) {
   
   	...
   	
       jclass clazz = pEnv->FindClass("com/ihorkucherenko/storage/Store");
       jmethodID methodId = pEnv->GetMethodID(clazz, "onStringSet", "(Ljava/lang/String;Ljava/lang/String;)V");
        pEnv->CallVoidMethod(pThis, methodId, pKey, pString);
    }
}
```

```
extern "C"
JNIEXPORT void JNICALL
Java_com_ihorkucherenko_storage_Store_setInteger(
        JNIEnv* pEnv,
        jobject pThis,
        jstring pKey,
        jint pInteger) {
   
   ...
   
           jclass clazz = pEnv->FindClass("com/ihorkucherenko/storage/Store");
        jmethodID methodId = pEnv->GetMethodID(clazz, "onIntegerSet", "(Ljava/lang/String;I)V");
        pEnv->CallVoidMethod(pThis, methodId, pKey, pInteger);
    }
}
```

## 结论

在本篇文章中，我们扩展了上篇文章的[Store](https://github.com/KucherenkoIhor/KotlinWithAndroidNdk)工程，也了解了如何在 Native 代码中调用 Kotlin 中实例函数和静态函数。

因此,我们可以得出结论, Kotlin是兼容Android NDK和JNI的。

本文主要翻译于[Android NDK. Calling Kotlin from native code](https://medium.com/yalantis-android/android-ndk-calling-kotlin-from-native-code-40a1cb0f6164)，并在此基础上做了部分改动。
