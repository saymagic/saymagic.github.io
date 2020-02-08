---
layout: post
keywords: java，线程安全，CopyOnWrite, ConcurrentHashMap，LinkedBlockingQueue
description: 浅析几种线程安全模型，对比CopyOnWrite, ConcurrentHashMap，LinkedBlockingQueue之前的不同点。
title: "浅析几种线程安全模型"
categories: [Android]
tags: [ANDROID]
group: archive
icon: globe
---

> 多线程编程一直是老生常谈的问题，在Java中，随着JDK的逐渐发展，JDK提供给我们的并发模型也越来越多，本文摘取三例使用不同原理的模型，分析其大致原理。

## COW之**CopyOnWriteArrayList**

cow是copy-on-write的简写，这种模型来源于linux系统fork命令，Java中一种使用cow模型来实现的并发类是CopyOnWriteArrayList。相比于Vector，它的读操作是无需加锁的：

```
public E get(int index) {
     return (E) elements[index];
}
```

之所以有如此神奇功效，其采取的是空间换取时间的方法，查看其add方法：

```
 public synchronized boolean add(E e) {
      Object[] newElements = new Object[elements.length + 1];
      System.arraycopy(elements, 0, newElements, 0, elements.length);
      newElements[elements.length] = e;
      elements = newElements;
      return true;
 }
```
我们注意到，CopyOnWriteArrayList的add方法是需要加锁的，但其内部并没有直接对elements数组做操作，而是先copy一份当前的数据到一个新的数组,然后对新的数组进行赋值操作。这样做就让get操作从同步中解脱出来。因为更改的数据并没有发生在get所需的数组中。而是放生在新生成的副本中，所以不需要同步。但应该注意的是，尽管如此，get操作还是可能会读取到脏数据的。

CopyOnWriteArrayList的另一特点是允许多线程遍历，且其它线程更改数据并不会导致遍历线程抛出`ConcurrentModificationException` 异常，来看下`iterator()`，

```
public Iterator<E> iterator() {
     Object[] snapshot = elements;
     return new CowIterator<E>(snapshot, 0, snapshot.length);
}
```

这个CowIterator 是 ListIterator的子类，这个Iterator的特点是它并不支持对数据的更改操作：

```
public void add(E object) {
     throw new UnsupportedOperationException();
}

public void remove() {
    throw new UnsupportedOperationException();
}

public void set(E object) {
    throw new UnsupportedOperationException();
}
```

这样做的原因也很容易理解，我们可以简单地的认为CowIterator中的snapshot是不可变数组，因为list中有数据更新都会生成新数组，而不会改变snapshot， 所以此时Iterator没办法再将更改的数据写回list了。同理，list数据有更新也不会反映在CowIterator中。CowIterator只是保证其迭代过程不会发生异常。

## CAS之**ConcurrentHashMap（JDK1.8）**
CAS是Compare and Swap的简写，即比较与替换，CAS造作将比较和替换封装为一组原子操作，不会被外部打断。这种原子操作的保证往往由处理器层面提供支持。

在Java中有一个非常神奇的Unsafe类来对CAS提供语言层面的接口。但类如其名，此等神器如果使用不当，会造成武功尽失的，所以Unsafe不对外开放，想使用的话需要通过反射等技巧。这里不对其做展开。介绍它的原因是因为它是JDK1.8中ConcurrentHashMap的实现基础。

`ConcurrentHashMap`与`HashMap`对数据的存储有着相似的地方，都采用数组+链表+红黑树的方式。基本逻辑是内部使用Node来保存map中的一项key， value结构，对于hash不冲突的key，使用数组来保存Node数据，而每一项Node都是一个链表，用来保存hash冲突的Node，当链表的大小达到一定程度会转为红黑树，这样会使在冲突数据较多时也会有比较好的查询效率。

了解了`ConcurrentHashMap`的存储结构后，我们来看下在这种结构下，`ConcurrentHashMap`是如何实现高效的并发操作，这得益于`ConcurrentHashMap`中的如下三个函数。

```
static final <K,V> Node<K,V> tabAt(Node<K,V>[] tab, int i) {
    return (Node<K,V>)U.getObjectVolatile(tab, ((long)i << ASHIFT) + ABASE);
}

static final <K,V> boolean casTabAt(Node<K,V>[] tab, int i,
                                    Node<K,V> c, Node<K,V> v) {
    return U.compareAndSwapObject(tab, ((long)i << ASHIFT) + ABASE, c, v);
}

static final <K,V> void setTabAt(Node<K,V>[] tab, int i, Node<K,V> v) {
    U.putOrderedObject(tab, ((long)i << ASHIFT) + ABASE, v);
}
```

其中的U就是我们前文提到的Unsafe的一个实例，这三个函数都通过Unsafe的几个方法保证了是原子性：

* tabAt作用是返回tab数组第i项
* casTabAt函数是对比tab第i项是否与c相等，相等的话将其设置为v。
* setTabAt将tab的第i项设置为v

有了这三个函数就可以保证`ConcurrentHashMap`的线程安全吗？并不是的，`ConcurrentHashMap`内部也使用比较多的synchronized，不过与HashTable这种对所有操作都使用synchronized不同，`ConcurrentHashMap`只在特定的情况下使用synchronized，来较少锁的定的区域。来看下putVal方法（精简版）:

```
final V putVal(K key, V value, boolean onlyIfAbsent) {
    if (key == null || value == null) throw new NullPointerException();
    int hash = spread(key.hashCode());
    int binCount = 0;
    for (Node<K,V>[] tab = table;;) {
        Node<K,V> f; int n, i, fh;
        if (tab == null || (n = tab.length) == 0)
            tab = initTable();
        else if ((f = tabAt(tab, i = (n - 1) & hash)) == null) {
            if (casTabAt(tab, i, null,
                         new Node<K,V>(hash, key, value, null)))
                    break;                   // no lock when adding to embin
        }
        else if ((fh = f.hash) == MOVED)
            tab = helpTransfer(tab, f);
        else {
            V oldVal = null;
            synchronized (f) {
                    ....
            }
        }
    }
    addCount(1L, binCount);
    return null;
}
```

整个put流程大致如下：

* 判断key与value是否为空，为空抛异常
* 计算kek的hash值，然后进入死循环，一般来讲，caw算法与死循环是搭档。
* 判断table是否初始化，未初始化进行初始化操作
* Node在table中的目标位置是否为空，为空的话使用caw操作进行赋值，当然，这种赋值是有可能失败的，所以前面的死循环发挥了重试的作用。
* 如果当前正在扩容，则尝试协助其扩容，死循环再次发挥了重试的作用，有趣的是`ConcurrentHashMap`是可以多线程同时扩容的。这里说协助的原因在于，对于数组扩容，一般分为两步：1.新建一个更大的数组；2.将原数组数据copy到新数组中。对于第一步，`ConcurrentHashMap`通过CAW来控制一个int变量保证新建数组这一步只会执行一次。对于第二步，`ConcurrentHashMap`采用CAW + synchronized + 移动后标记 的方式来达到多线程扩容的目的。感兴趣可以查看`transfer`函数。
* 最后的一个else分支，`黑科技`的流程已尝试无效，目标Node已经存在值，只能锁住当前Node来进行put操作，当然，这里省略了很多代码，包括链表转红黑树的操作等等。

相比于put，get的代码更好理解一下：

```
public V get(Object key) {
    Node<K,V>[] tab; Node<K,V> e, p; int n, eh; K ek;
    int h = spread(key.hashCode());
    if ((tab = table) != null && (n = tab.length) > 0 &&
        (e = tabAt(tab, (n - 1) & h)) != null) {
        if ((eh = e.hash) == h) {
            if ((ek = e.key) == key || (ek != null && key.equals(ek)))
                return e.val;
        }
        else if (eh < 0)
            return (p = e.find(h, key)) != null ? p.val : null;
        while ((e = e.next) != null) {
            if (e.hash == h &&
                ((ek = e.key) == key || (ek != null && key.equals(ek))))
                return e.val;
        }
    }
    return null;
}
```

* 检查表是否为空
* 获取key的hash h，获取key在table中对应的Node e
* 判断Node e的第一项是否与预期的Node相等，相等话， 则返回e.val
* 如果e.hash < 0, 说明e为红黑树，调用e的find接口来进行查找。
* 走到这一步，e为链表无疑，且第一项不是需要查询的数据，一直调用next来进行查找即可。



## 读写分离之**LinkedBlockingQueue**

还有一种实现线程安全的方式是通过将读写进行分离，这种方式的一种实现是`LinkedBlockingQueue`。`LinkedBlockingQueue`整体设计的也十分精巧，它的全局变量分为三类：

* final 型
* Atomic 型
* 普通变量

final型变量由于声明后就不会被修改，所以自然线程安全，Atomic型内部采用了cas模型来保证线程安全。对于普通型变量，`LinkedBlockingQueue`中只包含head与last两个表示队列的头与尾。并且私有，外部无法更改，所以，`LinkedBlockingQueue`只需要保证head与last的安全即可保证真个队列的线程安全。并且`LinkedBlockingQueue`属于FIFO型队列，一般情况下，读写会在不同元素上工作，所以，
`LinkedBlockingQueue`定义了两个可重入锁，巧妙的通过对head与last分别加锁，实现读写分离，来实现良好的安全并发特性：

```
/** Lock held by take, poll, etc */
private final ReentrantLock takeLock = new ReentrantLock();

/** Wait queue for waiting takes */
private final Condition notEmpty = takeLock.newCondition();

/** Lock held by put, offer, etc */
private final ReentrantLock putLock = new ReentrantLock();

/** Wait queue for waiting puts */
private final Condition notFull = putLock.newCondition();
```

首先看下它的offer 方法：

```
public boolean offer(E e) {
    if (e == null) throw new NullPointerException();
    final AtomicInteger count = this.count;
    if (count.get() == capacity)
        return false;
    int c = -1;
    Node<E> node = new Node<E>(e);
    final ReentrantLock putLock = this.putLock;
    putLock.lock();
    try {
        if (count.get() < capacity) {
            enqueue(node);
            c = count.getAndIncrement();
            if (c + 1 < capacity)
                notFull.signal();
        }
    } finally {
        putLock.unlock();
    }
    if (c == 0)
        signalNotEmpty();
    return c >= 0;
}
```

可见，在对队列进行添加元素时，只需要对putLock进行加锁即可，保证同一时刻只有一个线程可以对last进行插入。同样的，在从队列进行提取元素时，也只需要获取takeLock锁来对head操作即可：

```
public E poll() {
    final AtomicInteger count = this.count;
    if (count.get() == 0)
        return null;
    E x = null;
    int c = -1;
    final ReentrantLock takeLock = this.takeLock;
    takeLock.lock();
    try {
        if (count.get() > 0) {
            x = dequeue();
            c = count.getAndDecrement();
            if (c > 1)
                notEmpty.signal();
        }
    } finally {
        takeLock.unlock();
    }
    if (c == capacity)
        signalNotFull();
    return x;
}

```

`LinkedBlockingQueue`整体还是比较好理解的，但有几个点需要特殊注意：

* `LinkedBlockingQueue`是一个阻塞队列，当队列无元素为空时，所有取元素的线程会通过notEmpty 的await()方法进行等待，直到再次有数据enqueue时，notEmpty发出signal信号。对于队列达到上限时也是同理。

* 对于remove，contains，toArray， toString， clear之类方法，会调用fullyLock方法，来同时获取读写锁。但对于size方法，由于队列内部维护了AtomicInteger类型的count变量，是不需要加锁进行获取的。




