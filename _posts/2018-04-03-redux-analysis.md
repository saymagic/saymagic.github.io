---
layout: post
keywords: Redux,applyMiddleware、createStore
description: 本文介绍了 Redux 的基本概念、准则。和applyMiddleware、createStore 等函数的源码解析
title: Redux简介与源码分析
categories: [JavaScript]
tags: [JavaScript]
group: archive
icon: globe
---

>随着业务需求越来越复杂，应用中需要开发者管理越来越多的状态。这些复杂的状态也直接对应UI上的表现。如果不能很好的管理这些状态，我们就无法对应用的一些异常表现做出合理的解释。

### Redux介绍

![https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fpzjp9tv8pj22sa15ego0.jpg](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fpzjp9tv8pj22sa15ego0.jpg)


redux 的主要作用是管理业务上越来越多的状态。要理解 redux，就需要先了解它的几个主要概念：

* State

`State`表示应用的状态。对应到JS中就是一个普通的 object。里面可以放置任何类型数据。

* Action

`Action`表示一个动作。可以是用户点击了某个按钮、服务器返回了结果等等。对应到JS中就是一个普通的 object。原生的 redux 要求这个 object 必须含有`type`属性。用于表示这个 action 的作用。

下面就是一个简单的 action：

```
const ADD_TODO = 'ADD_TODO'


{
  type: ADD_TODO,
  text: 'Build my first Redux app'
}
```

* Reducer

`Reducer`用于描述一个`Action`发生后，`State`该如何变化。对应到 JS 代码中reducer 是一个 function。函数的基本结构为:

```
function reducer(originState, action){
    return newState
}
```


* Store

`Action`、`Reducer`之间并不会直接作用。`Store`的作用是将它们两个进行串联。`Store` 含有subscribe和 dispatch两个方法。dispatch方法接收`Action`作为参数，subscribe方法接收一个函数作为参数。


`Store`在创建的时候需要传入`Reducer`。当调用 dispatch 方法是，`Store`内部会通过`Reducer`会处理`Action`转化为新的`State`，subscribe函数就会接收到最新的`State`。

一个简单的示例如下：

```
const unsubscribe = store.subscribe(() =>
  console.log(store.getState())
)

store.dispatch({type:'ADD_TODO', payload: 'Learn about actions'))

```

我们在了解了上面几个概念后再来看 redux，其实可以理解成观察者模式的特殊实现。在使用 redux 时有三条原则，也可以作为最佳实践：

* 应用全局共享一个`Store`
* `State`应该是只读的。我们在任何时候都不能直接更改`State`，`Reducer` 中也需要返回一个新的`State`，而不是直接在原 State 的基础上进行修改。
* `Reducer`是纯函数。简单理解就是，对于同样的 state、action，`Reducer`必须返回相同的 state。

### Redux 源码分析

整个 redux 的源码包含注释仅有五百多行。

![image](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fpyguim8yjj21z403ajsb.jpg)

但整个代码写的相当漂亮。redux对外提供的方法和变量

```
export {
  createStore,
  combineReducers,
  bindActionCreators,
  applyMiddleware,
  compose,
  __DO_NOT_USE__ActionTypes
}
```

下文，我们将分析几个主要的方法和变量的实现

#### createStore

`createStore`的函数原型为：

```
function createStore(reducer, preloadedState, enhancer)
```

函数的返回结果为：

```
return {
    dispatch,
    subscribe,
    getState,
    replaceReducer,
    [$$observable]: observable
  }
```

首先解释三个参数：

* reducer 就是我们前文提到的用于根据 action 更新 state 的函数
* preloadedState表示初始state
* enhancer是用于增强当前 store 的函数。enhancer由`applyMiddleware`函数生成。直接看和enhancer相关的代码：

```
 if (typeof enhancer !== 'undefined') {
    if (typeof enhancer !== 'function') {
      throw new Error('Expected the enhancer to be a function.')
    }

    return enhancer(createStore)(reducer, preloadedState)
  }
```

如果我们传入了enhancer，直接返回调用enhancer的结果。关于enhancer，我们在后面的章节会详细分析`applyMiddleware`的实现。

再来一个一个看createStore函数返回的结果。dispatch、subscribe、getState、replaceReducer都是在createStore内部定义的函数。

* subscribe

```
function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected the listener to be a function.')
    }

    if (isDispatching) {
      throw new Error('')
    }

    let isSubscribed = true

    ensureCanMutateNextListeners()
    nextListeners.push(listener)

    return function unsubscribe() {
        ...
    }
  }

 ```

 subscribe接收一个函数参数，相当于观察者。isDispatching表示当前是否有 reducer 正在执行。该变量默认为 false。会在 dispatch 函数中置位 true。
 主要看`ensureCanMutateNextListeners`函数，代码如下：

 ```
 let currentListeners = []
 let nextListeners = currentListeners

 function ensureCanMutateNextListeners() {
   if (nextListeners === currentListeners) {
     nextListeners = currentListeners.slice()
   }
 }
 ```

 该函数的主要作用是重新生成一个nextListeners，该函数返回后，我们的 listener 会被直接 push 到nextListeners数组中。

 ```
  nextListeners.push(listener)
 ```

 换句话说，nextListeners中保存着我们所有 subscribe传递进来的 listener。这里先留下一个疑问，为什么ensureCanMutateNextListeners会同时有currentListeners和nextListeners两个变量呢？只使用 nextListener 不可以吗？

最后，subscribe函数返回了一个unsubscribe函数，该函数用于取消订阅该 listener。这里不做展开。

* dispatch

dispatch 用于派发一个 action，源码如下：

```
function dispatch(action) {
    if (!isPlainObject(action)) {
      throw new Error(
        'Actions must be plain objects. ' +
          'Use custom middleware for async actions.'
      )
    }

    if (typeof action.type === 'undefined') {
      throw new Error(
        'Actions may not have an undefined "type" property. ' +
          'Have you misspelled a constant?'
      )
    }

    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.')
    }

    try {
      isDispatching = true
      currentState = currentReducer(currentState, action)
    } finally {
      isDispatching = false
    }

    const listeners = (currentListeners = nextListeners)
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i]
      listener()
    }

    return action
  }

```

第一步，做了参数 action 的校验。

第二步，和 subscribe 函数类似，也判断了isDispatching变量是否为 true。

第三步，调用 reducer 转换为最新的状态:

```
try {
   isDispatching = true
   currentState = currentReducer(currentState, action)
} finally {
   isDispatching = false
}
```

一般来说，currentReducer就是 createStore 传入的reducer。同时可以注意到，isDispatching是在reducer 函数调用之前被置为 true 的，调用结束被置为 false。联想到刚刚和isDispatching有关的两处代码。在 reducer 函数调用的过程中，是不允许调用 subscribe和 dispatch 函数的。这样也是为了保证reducer的`纯`。防止 reducer 改变了外部状态，导致了程序的不确定性。


第四步，调用所有的 listener：

```
const listeners = (currentListeners = nextListeners)
for (let i = 0; i < listeners.length; i++) {
   const listener = listeners[i]
   listener()
}

```

这里仅仅是对数组中所有函数进行逐一调用。需要注意的是，迭代的数组是当前时刻的nextListeners，同时currentListeners也指向了nextListeners。回到刚才我们提到的问题，currentListeners究竟是做什么的呢？

currentListeners的主要目的是解决 listener 函数中调用 subscribe 函数导致程序的不确定性。举例来讲，如果只有nextListeners，当迭代nextListeners时，如果listener中又触发了 subscribe 函数，此时，nextListeners的内容就会发生变化，整个 for 循环就不可控。

#### getState

```
  function getState() {
    if (isDispatching) {
      throw new Error(
        'You may not call store.getState() while the reducer is executing. ' +
          'The reducer has already received the state as an argument. ' +
          'Pass it down from the top reducer instead of reading it from the store.'
      )
    }

    return currentState
  }

```

第一步，判断isDispatching变量
第二步，直接返回currentState

#### replaceReducer

replaceReducer用于更换当前的 reducer

```
function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error('Expected the nextReducer to be a function.')
    }

    currentReducer = nextReducer
    dispatch({ type: ActionTypes.REPLACE })
}
```

第一步，判断nextReducer参数类型
第二步，将currentReducer重置为nextReducer
第三部，派发ActionTypes.REPLACE事件

综上，我们就将整个 store 的入参和返回值都进行了分析。下面来看 Redux 中非常重要的一个部分 - 中间件。

### applyMiddleware

`applyMiddleware`函数的代码比较少，但理解起来并不容易。

```
export default function applyMiddleware(...middlewares) {
  return createStore => (...args) => {
    const store = createStore(...args)
    let dispatch = () => {
      throw new Error(
        `Dispatching while constructing your middleware is not allowed. ` +
          `Other middleware would not be applied to this dispatch.`
      )
    }
    let chain = []

    const middlewareAPI = {
      getState: store.getState,
      dispatch: (...args) => dispatch(...args)
    }
    chain = middlewares.map(middleware => middleware(middlewareAPI))
    dispatch = compose(...chain)(store.dispatch)

    return {
      ...store,
      dispatch
    }
  }
}
```

首先，`applyMiddleware`函数是一个高阶函数，
前文我们说过，createStore 函数中的一个入参 enhance是由`applyMiddleware`函数生成的。createStore中对 enhancer调用如下：

```
return enhancer(createStore)(reducer, preloadedState)
```
enhancer的调用完全符合applyMiddleware返回的函数原型。所以，我们可以想象，applyMiddleware函数调用完全结束后，返回的就是 store。


`applyMiddleware`函数前两阶的参数都是在createStore函数中传入的。最后一阶接收的参数是中间件数组。中间件也是函数，其原型为：

```
store => next => action => {

}
```

我们看最后一阶函数的实现,首先：

```
const store = createStore(...args)
```
这里的 store 实际上就是创造出原有的 store。紧接着，声明必要的变量：

```
let dispatch = () => {
  throw new Error(
        `Dispatching while constructing your middleware is not allowed. ` +
          `Other middleware would not be applied to this dispatch.`
      )
}

let chain = []

const middlewareAPI = {
   getState: store.getState,
   dispatch: (...args) => dispatch(...args)
}
```  
 
 接下来的部分越来越烧脑：
 
```
chain = middlewares.map(middleware => middleware(middlewareAPI))
```

首先，middleware本身是一个三阶函数，调用`middleware(middlewareAPI)`之后是一个二阶函数。因此 chain 中是一个二阶函数的数组：

```
chain = [
	next1 => action1 => { middleware1 process },
	next2 => action2 => { middleware2 process },
	next3 => action3 => { middleware3 process },
]
```

紧接着：

```
dispatch = compose(...chain)(store.dispatch)
```

先看`compose(...chain)`， 它的实现在[`compose.js`](https://github.com/reactjs/redux/blob/master/src/compose.js)文件中：

```
export default function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg
  }

  if (funcs.length === 1) {
    return funcs[0]
  }

  return funcs.reduce((a, b) => (...args) => a(b(...args)))
}
```
compose 意为组合，该compose的实现是使用 reduce，相当于从右到左来组合多个函数。 compose 实现的效果是：

```
compose(f1, f2, f3)(arg) = f1(f2(f3(arg)))
```

compose(...chain)(dispatch)生成的 dispatch 就是：
 
```
dispatch = action1 => { middleware1 process } （
	action2 => { middleware2 process } （
		action3 => { middleware3 process } （dispatch）
	）
） 
```

所以，当调用dispatch(action)时，middleware1 最先收到action，它可以对 action 进行处理，或者选择调用下一级(next2)：

```
// next 2

(
	action2 => { middleware2 process } （
		action3 => { middleware3 process } （dispatch）
	）
） 
```

综上，当`compose(...chain)(dispatch)`完成后，我们就得到了一个增强的 dispatch。最后，`applyMiddleware` 函数返回的 store 也仅仅更改了原有 store 的 dispatch：

```
return {
  ...store,
  dispatch
}
```    
   
### 参考

[https://redux.js.org/](https://redux.js.org/){:rel="nofollow"}

[https://github.com/reactjs/redux](https://github.com/reactjs/redux){:rel="nofollow"}

    





