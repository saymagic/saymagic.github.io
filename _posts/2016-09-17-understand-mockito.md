---
layout: post
keywords: Mockito，Android，测试, 源码，解析
description: Mockito源码解析
title: "Mockito源码解析"
categories: [Android]
tags: [ANDROID]
group: archive
icon: globe
---

> Mockito 是Java平台上超火的Mock框架，因为其便捷的API，深受广大开发者喜爱。本文将从源码的角度，来分析Mockito的运行流程。


## 小试牛刀

Mockito类相当于整个框架的门面，负责对外提供调用接口。常用的有如下几个：

* mock

		List list = Mockito.mock(List.class);
	此时， list就是被Mockito所mock后生成的实例，Mockito会记住它所mock对象的所有调用，为后面的验证做准备。

* when

		Mockito.when(list.size()).thenReturn(1);

	上述代码表示，当对list对象调用size()方法时，会返回1.这样我们就可以自定义mock对象的行为了。

* verify

	    Mockito.verify(list).add(Matchers.anyObject());

	verify是负责验证的函数，接受的参数是一个被mock的对象，表示验证其是否执行了后面的方法。

如上只是Mockito框架中最基本也是最常用的几个函数，这里并没有对用法进行详细展开，原因在于Mockito的学习成本相当低，API设计的基本和人类的语言思维一致。但恰恰如此，要实现这种API往往并不简单，甚至初一看有些不可能，举几个例子：

1. mock 方法只接收一个class对象，如果该class有多个构造函数，如何保证一定可以正确生成mock对象。
2. when方法，这个就简直逆天了，它的参数并不是Method之类描述一个函数调用的类，而是传入mock对象方法的返回值。按照正常逻辑来考虑这会有很多问题的。
3. verify函数怎么会知道哪些方法被调用了呢？是动态代理吗？

带着种种疑问，开启我们Mockito的源码探索之旅吧。

## 类图

为了更好的对Mockito有个全面了解，我画了一个类图：

![](/pic/understand-mockito/mockito_uml.png)

初看上去会比较多，没关系，几个主要的Boss我已用红颜色标出，它们将会是Mockito的核心，也是下文主要介绍的对象。接下来，就深入Mockito的源码来一探究竟。


## Mock

Mockito类中有几个mock函数的重载，最终都会调到`mock(Class<T> classToMock, MockSettings mockSettings)`，接受一个class类型与一个mockSettings，class就是我们需要mock对象的类型，而mockSettings则记录着此次mock的一些信息。mock的行为实则转交个MockitoCore：

```
MOCKITO_CORE.mock(classToMock, mockSettings)
```

在MockitoCore中一是做了一下初始化工作，二是继续转交给MockUtil处理:

```
 MockSettingsImpl impl = MockSettingsImpl.class.cast(settings);
 MockCreationSettings<T> creationSettings = impl.confirm(typeToMock);
 T mock = mockUtil.createMock(creationSettings);
 mockingProgress.mockingStarted(mock, typeToMock);
```

 在MockUtil中则作了两件非常关键的事情:

```
MockHandler mockHandler =  createMockHandler(settings);

T mock = mockMaker.createMock(settings, mockHandler);

```

一是创建了MockHandler对象，MockHandler是一个接口，通过追查createMockHandler函数我们可以清楚，MockHandler对象的实例是InvocationNotifierHandler类型，但它只是负责对外的包装，内部实际起作用的是`MockHandlerImpl`这个家伙，也是上文类图右下角的那位，这个类可谓承载了Mockito的主要逻辑，我们后面会详细的来说明。这里要先有个印象。

接着往下看，会调用mockMaker来创建最终的实例，这个MockHandler也是一个接口，其实现为ByteBuddyMockMaker，我们追进去看一下createMock函数（省略异常处理代码）：

```
public <T> T createMock(MockCreationSettings<T> settings, MockHandler handler){
    Class<T> mockedProxyType = createProxyClass(mockWithFeaturesFrom(settings));
    Instantiator instantiator = Plugins.getInstantiatorProvider().getInstantiator(settings);
    T mockInstance = null;
    mockInstance = instantiator.newInstance(mockedProxyType);
    MockAccess mockAccess = (MockAccess) mockInstance;
    mockAccess.setMockitoInterceptor(new MockMethodInterceptor(asInternalMockHandler(handler), settings));
    return ensureMockIsAssignableToMockedType(settings, mockInstance);
}
```
首先函数内的第一行代码就比较引人注目：`createProxyClass`，居然要创建一个代理类，必须追进去仔细瞧瞧，但这里追的路径比较多，会处理一些缓存之类的，所以我们直接跳到最终处理的地方:MockBytecodeGenerator类的 generateMockClass方法:

```
public <T> Class<? extends T> generateMockClass(MockFeatures<T> features) {
    DynamicType.Builder<T> builder =
            byteBuddy.subclass(features.mockedType)
                     .name(nameFor(features.mockedType))
                     .ignoreAlso(isGroovyMethod())
                     .annotateType(features.mockedType.getAnnotations())
                     .implement(new ArrayList<Type>(features.interfaces))
                     .method(any())
                           .intercept(MethodDelegationDispatcherDefaultingToRealMethod.class))
                           .transform(MethodTransformer.Simple.withModifiSynchronizationState.PLAIN))
                           .attribute(MethodAttributeAppender.ForInstrumentthod.INCLUDING_RECEIVER)
                     .serialVersionUid(42L)
                         .defineField("mockitoInterceptoMockMethodInterceptor.class, PRIVATE)
                     .implement(MockAccess.class)
                       .intercept(FieldAccessor.ofBeanProperty())
                     .method(isHashCode())
                           .interceptMockMethodInterceptor.ForHashCode.class))
                     .method(isEquals())
                           .interceptMockMethodInterceptor.ForEquals.class));
    if (features.crossClassLoaderSerializable) {
        builder = builder.implement(CrossClassLoaderSerializableMock.class)
                             .interceptMockMethodInterceptor.ForWriteReplace.class));
    }
    return builder.make()
                  .load(new MultipleParentClassLoader.Builder()
                          .append(features.mockedType)
                          .append(features.interfaces)
                              .appMultipleParentClassLoader.class.getClassLoader())
                              .appThread.currentThread().getContextClassLoader())
                          .filter(isBootstrapClassLoader())
                          .build(), ClassLoadingStrategy.Default.INJECTION)
                  .getLoaded();
}
```

注意MockBytecodeGenerator也是UML中标红的一个类，这里的代码比较多，但做的事情比较单一，就是要动态生成一个代理类，这个代理类继承了目标类，然后实现了MockAccess接口。

这里你可能会有疑问，Java可以动态的生成class？没错，当然可以，并且不只一种方式。很早的时候Java编译器已经用Java语言重写，能够自己编译自己，而从Java 1.6开始，编译器接口正式放到JDK的公开API，大家感兴趣可以查看JavaCompiler这个类。

而Mockito则使用的是ByteBuddy这个框架，它并不需要编译器的帮助，而是直接生成class，然后使用ClassLoader来进行加载，感兴趣的可以深入研究，其地址为:[https://github.com/raphw/byte-buddy](https://github.com/raphw/byte-buddy){:rel="nofollow"},

这里还需注意的一个地方时这里:

```
.method(any())
.intercept(MethodDelegationDispatcherDefaultingToRealMethod.class))
```

这段代码的意思是所有的方法就会被MethodDelegationDispatcherDefaultingToRealMethod类里的一个静态方法所代理，这个静态方法就是:

```
public static Object interceptSuperCallable(@This Object mock,
                                                    @FieldValue("mockitoInterceptor") MockMethodInterceptor interceptor,
                                                    @Origin Method invokedMethod,
                                                    @AllArguments Object[] arguments,
                                                    @SuperCall(serializableProxy = true) Callable<?> superCall)
```

这个函数内部将处理权转交给interceptor，而interceptor 内部又会转交给handler处理:

```
private Object doIntercept(Object mock,
                           ethod invokedMethod,
                           bject[] arguments,
                              InterceptedInvion.SuperMethod superMethod) throws Throwable
    return handler.handle(new InterceptedInvocation(
            ock,
            reateMockitoMethod(invokedMethod),
            rguments,
            uperMethod,
           SequenceNumber.next()
    ))
}
```
这里出来了两个新事物，interceptor与handler都是什么鬼？通过interceptor 参数的注解关键字mockitoInterceptor，我们可以知道，这个也许就是前文所说实现MockAccess接口所传进来的，而这个handler，则是我们前文所说的重点: MockHandlerImpl!(准确的说是InvocationNotifierHandler，只不过其内部将主要逻辑都转交给了MockHandlerImpl， 所以下文都已MockHandlerImpl为主)

好，扯回来，单单createProxyClass一句代码就延伸出这么多，但现在我们也只是动态的创建了一个class，但没有创建出目标类的实例。所以往下看，这个重担就交在了这三行代码上:

```
Instantiator instantiator = Plugins.getInstantiatorProvider().getInstantiator(settings);
T mockInstance = null;
mockInstance = instantiator.newInstance(mockedProxyType);
```

这个Instantiator也是一个接口，它有两个实现，一是`ObjenesisInstantiator`,另外一个是`ConstructorInstantiator`，默认情况下，都是在使用  ObjenesisInstantiator， 所以我们这里只查看ObjenesisInstantiator，并且ObjenesisInstantiator也是上述UML图中的一个标红的类，因为它承载生成对象的工作。我么看其newInstance方法:

```
public <T> T newInstance(Class<T> cls) {
    return objenesis.newInstance(cls);
}
```

这里调用了objenesis.newInstance，那这个objenesis是何许人也呢？这又是一个相当牛逼的框架，可以根据不同的平台选择不同的方法来new对象。总之一句话，你只要输入一个class进去，它就会输出其一个实例对象。感兴趣的可以查看其Github:[https://github.com/easymock/objenesis](https://github.com/easymock/objenesis){:rel="nofollow"}。

如此，走到这里，我们的mock对象就已经被生成出来，而后面的这两句话也验证了我们前面关于
interceptor参数的说法：
```
MockAccess mockAccess = (MockAccess) mockInstance;
    mockAccess.setMockitoInterceptor(new MockMethodInterceptor(asInternalMockHandler(handler), settings));
```

这个interceptor里的handler就是我们之前所说的InvocationNotifierHandler。

如上，就是Mockito创建mock对象的主要逻辑。


## When

接下来我们看一下Mockito里的when方法:

```
public static <T> OngoingStubbing<T> when(T methodCall) {
     return MOCKITO_CORE.when(methodCall);
}
```

同样是转交到了MOCKITO_CORE这里:

```
public <T> OngoingStubbing<T> when(T methodCall) {
    mockingProgress.stubbingStarted();
    OngoingStubbing<T> stubbing = mockingProgress.pullOngoingStubbing();
    if (stubbing == null) {
        mockingProgress.reset();
        throw missingMethodInvocation();
    }
    return stubbing;
}
```

这里代码虽少，但很困惑，这个mockingProgress是个什么东西？OngoingStubbing又是什么呢？想要弄清楚来龙去脉，还记得刚才一直强调的MockHandlerImpl吗？上文说过，mock对象所有的方法最终都会交由MockHandlerImpl的handle方法处理，所以这注定是一个不一样的女子，不，方法：

```
public Object handle(Invocation invocation) throws Throwable {
     if (invocationContainerImpl.hasAnswersForStubbing()) {
         // stubbing voids with stubVoid() or doAnswer() style
         InvocationMatcher invocationMatcher = matchersBinder.bindMatchers(
                 mockingProgress.getArgumentMatcherStorage(),
                 invocation
         );
         invocationContainerImpl.setMethodForStubbing(invocationMatcher);
         return null;
     }
        VerificationMode verificationModemockingProgress.pullVerificationMode(
     InvocationMatcher invocationMatcher = matchersBinder.bindMatchers(
             mockingProgress.getArgumentMatcherStorage(),
             invocation

     mockingProgress.validateState(
     // if verificationMode is not null then someone is doing verify()
     if (verificationMode != null) {
         // We need to check if verification was started on the correct mock
         // - see VerifyingWithAnExtraCallToADifferentMockTest (bug 138)
            if (((MockAwareVerificationMode) verificationMode).getMock() invocation.getMock()) {
                VerificationDataImpl data = createVerificationDainvocationContainerImpl, invocationMatcher);
             verificationMode.verify(data);
             return null;
         } else {
                // this means there is an invocation on a different mocRe-adding verification mode
             // - see VerifyingWithAnExtraCallToADifferentMockTest (bug 138)
             mockingProgress.verificationStarted(verificationMode);
         }

     // prepare invocation for stubbing
        invocationContainerImpl.setInvocationForPotentialStubbiinvocationMatcher);
        OngoingStubbingImpl<T> ongoingStubbing = new OngoingStubbingImpl<invocationContainerImpl);
     mockingProgress.reportOngoingStubbing(ongoingStubbing
     // look for existing answer for this invocation
        StubbedInvocationMatcher stubbedInvocationinvocationContainerImpl.findAnswerFor(invocation
     if (stubbedInvocation != null) {
         stubbedInvocation.captureArgumentsFrom(invocation);
         return stubbedInvocation.answer(invocation);
     } else {
         Object ret = mockSettings.getDefaultAnswer().answer(invocation);
            new AnswersValidator().validateDefaultAnswerReturnedValinvocation, ret
            // redo setting invocation for potential stubbing in case partial
         // mocks / spies.
         // Without it, the real method inside 'when' might have delegated
         // to other self method and overwrite the intended stubbed method
            // with a different one. The reset is required to avoid runtiexception that validates return type with stubbed method signature.
            invocationContainerImpl.resetInvocationForPotentialStubbiinvocationMatcher);
         return ret;
     }
 }
```

代码很多，在handle中和when有关的几句代码是:


```
OngoingStubbingImpl<T> ongoingStubbing = new OngoingStubbingImpl<T>(invocationContainerImpl);
mockingProgress.reportOngoingStubbing(ongoingStubbing);
```

 when调用的基本形式是when(mock.doSome()), 此时，当mock.doSome()时即会触发上面的语句，
 OngoingStubbingImpl表示正在对一个方法打桩的包装，invocationContainerImpl 相当于一个mock对象的管家，记录着mock对象方法的调用。后面我们还会再见到它。mockingProgress则可以理解为一个和线程相关的记录器，用于存放每个线程正要准备做的一些事情，它的内部包含了几个report*** 和 pull*** 这样的函数，如上所看到，mockingProgress记录着ongoingStubbing对象。

 再回过头来看MOCKITO_CORE 里的when方法就会清晰许多，它会取出刚刚存放在mockingProgress中的ongoingStubbing对象。
 ```
  OngoingStubbing<T> stubbing = mockingProgress.pullOngoingStubbing();
 ```

 而我们熟知的thenReturn、thenThrow则是OngoingStubbing里的方法，这些方法最终都会调到如下方法:

```
public OngoingStubbing<T> thenAnswer(Answer<?> answer) {
      if(!invocationContainerImpl.hasInvocationForPotentialStubbing()) {
          throw incorrectUseOfApi();
      }

      invocationContainerImpl.addAnswer(answer);
      return new ConsecutiveStubbing<T>(invocationContainerImpl);
}
```

 answer即是对thenReturn、thenThrow之类的包装，当然我们也可以自己定义answer。我们有看到了刚刚说过的老朋友invocationContainerImpl，它会帮我们保管这个answer，待以后调用该方法时返回正确的值，与之对应的代码是handle方法中如下这句代码：

```
 StubbedInvocationMatcher stubbedInvocation = invocationContainerImpl.findAnswerFor(invocation);

```

 当stubbedInvocation不为空时，就会调用anwser方法来回去之前设定的值：

```
 stubbedInvocation.answer(invocation)
```

 如此，对于`when(mock.doSome()).thenReturn(obj)`这样的用法的主要逻辑了。

## Verify


有了上面的基础，理解verify就会很容易，verify的基本使用形式是`verify(mock).doSome()`，verify有几个重载函数，但最终都会掉到如下函数:

```
public <T> T verify(T mock, VerificationMode mode) {
        if (mock == null) {
            throw nullPassedToVerify();
        }
        if (!mockUtil.isMock(mock)) {
            throw notAMockPassedToVerify(mock.getClass());
        }
        mockingProgress.verificationStarted(new MockAwareVerificationMode(mock, mode));
        return mock;
    }
```

可见verify函数只是做了一些准备工作， 首先，VerificationMode是对验证信息的封装，它是一个接口，含有verify函数， 例如我们常用的never(). times(1)返回的都是Times类型，而Times类型就是VerificationMode的一种实现。然后，调用mockingProgress 来缓存mode信息。

函数的最后直接将mock对象返回，VerificationMode并没有被执行，因为在verify函数后紧跟着就是调用mock对象的doSome()方法。所以，我们的关注点还是在前文一直提到的MockHandlerImpl的handle方法。注意如下几句（伪代码，有删减）：

```
VerificationMode verificationMode = mockingProgress.pullVerificationMode();
if (verificationMode != null) {
    if (((MockAwareVerificationMode) verificationMode).getMock() == invocation.getMock()) {
                VerificationDataImpl data = createVerificationData(invocationContainerImpl, invocationMatcher);
                verificationMode.verify(data);
                return null;
    } else {
        ...
    }
}
```
首先获取mockingProgress中缓存的verificationMode信息，然后当验证信息不为空时，验证mode的状态是否正确，当一切无误是调用verificationMode的verify方法，完成验证。由于验证时无需返回结果，所以可以返回null，没有问题。


综上，我们就从源码的角度理解了verify的工作原理。善！


## 总结

总的来看Mockito的源码设计的还是很巧妙的，并且也不乏黑科技ByteBuddy与Objenesis的强势加盟。另一方面，文中一再强调的就是MockHandlerImpl的gandle方法，这真的算是Mockito中的精华所在里。但这个函数并不是很好理解。因为，这个函数负责的逻辑比较多，虽然函数内的代码同出在一个函数内，但它们之间并不都在一个时空工作。比如，handle中有些代码视为when服务的，有些视为verify服务的，还有为doReturn服务的。读这段代码的感觉就像之前看的一部电影--《恐怖游轮》。You know what I'm saying。


本文所分析的源码版本为2.0.57-beta，根据官方文档的介绍，目前Mockito3也正在酝酿中，Mockito3的一大亮点就是支持Java8，是不是有些小激动呢？

![Same Here](/pic/understand-mockito/8aMiaV16NGxL2iaXGOzhkMh20c5lRMbLk7t1ictiapspjSokWUPRxzpAF38gylmjkI72NBaVnmvSThL6aibZrY8mVIg.gif)
