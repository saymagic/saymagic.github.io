---
layout: post
keywords: sqlbrite, 源码, 解析
description: sqlbrite是square公司又一开源产品，其Github地址为[https://github.com/square/sqlbrite](https://github.com/square/sqlbrite),当前版本是0.6.3。正如其简介所说，sqlbrite是对Android中SQLiteOpenHelper的轻量级包装，可以响应式的对SQL语句进行操作。本文关注`响应式`这个词，来对sqlbrite的源码进行解析。
title: "sqlbrite源码解析"
categories: [Android]
tags: [Android]
group: archive
icon: globe
---


> sqlbrite是square公司又一开源产品，当前版本是0.6.3。正如其简介所说，sqlbrite是对Android中SQLiteOpenHelper的轻量级包装，可以响应式的对SQL语句进行操作。本文关注`响应式`这个词，来对sqlbrite的源码进行解析。


## 上帝BriteDatabase

`BriteDatabase `是`sqlbrite`中对外的主要接口。我们需要这样来创建它：

```
BriteDatabase db ＝SqlBrite.create().wrapDatabaseHelper(dbOpenHelper)
```

其中的dbOpenHelper 就是Android原生提供的SQLiteOpenHelper类。我们追下源码：

```
public static SqlBrite create() {
	 return create(new Logger() {
	     @Override
	     public void log(String message) {
	        Log.d("SqlBrite", message);
	     }
	  });
}
```

`SqlBrite.create()`只是一个简单的工厂，返回了`Sqlbrite`类的实例，值得注意的是这个实例中默认添加了logger，我们可以实现Sqlbrite.Logger来添加自己的log输出方式。继续追`wrapDatabaseHelper`方法：

```
@CheckResult @NonNull
public BriteDatabase wrapDatabaseHelper(@NonNull SQLiteOpenHelper helper) {
    return new BriteDatabase(helper, logger);
}
```

  可见它也只是返回了`BriteDatabase `对象实例，我们看下构造函数：

```
BriteDatabase(@NonNull SQLiteOpenHelper helper, @NonNull SqlBrite.Logger logger) {
	this.helper = helper;
	this.logger = logger;
}
```

也只是记录了`SQLiteOpenHelper`与`Logger `，这里并没有什么高级的代码。高级的是`BriteDatabase`中对事务的管理与数据查询的处理方式。

### 事务

事务是`BriteDatabase`中比较核心处理的概念，因为要保证前文说的响应式，必须对事务也是原子性的响应。我们来看`BriteDatabase`是如何做到的。

要想开启一个事务，只需调用newTransaction方法即可：

```
public Transaction newTransaction() {
	 SqliteTransaction transaction = new SqliteTransaction(transactions.get());
	    transactions.set(transaction);
	    if (logging) log("TXN BEGIN %s", transaction);
	     	 getWriteableDatabase().beginTransactionWithListener(transaction);
	return this.transaction;
}
```

这个函数短短四行，但理解起来不是特别容易，其中`SqliteTransaction`是`BriteDatabase `的内部类，它继承了LinkedHashSet,实现了SQLiteTransactionListener，构造函数如下：

```
SqliteTransaction(SqliteTransaction parent) {
    this.parent = parent;
}
```

 它内部维护了一个parent变量，这个变量再后文中会提到作用。SqliteTransaction中也维护了一个bool变量commit，这个值在SQLiteTransactionListener的onCommit方法回调中被置为true,用于表示这个transaction是否成功。

 transactions是BriteDatabase的成员变量，使用`ThreadLocal`维护了一个`SqliteTransaction`，保证线程间的隔离。所以前两句就是生成SqliteTransaction对象，并置于transactions中。


 第四行首先调用了`getWriteableDatabase `函数，这个函数如下：

```
SQLiteDatabase getWriteableDatabase() {
	  SQLiteDatabase db = writeableDatabase;
	  if (db == null) {
	      synchronized (databaseLock) {
	        db = writeableDatabase;
	        if (db == null) {
	          if (logging) log("Creating writeable database");
	          db = writeableDatabase = helper.getWritableDatabase();
	        }
	      }
	  }
	  return db;
}
```

 这个函数使用了双重校验锁机制来返回dbhelper中的SQLiteDatabase对象。

 第四行又继续调用了SQLiteDatabase 的beginTransactionWithListener函数，并传入了transaction对象，前面说过SqliteTransaction实现了SQLiteTransactionListener，这里将其作为事务的listener。

 最后是返回this.transaction,等等，是`this.transaction`,不是刚刚new出的transaction对象，那这个乱入的`this.transaction`是个什么鬼呢?


首先，transaction是Transaction的一个实现，Transaction是BriteDatabase中的一个接口，拥有`end()`、`markSuccessful()`、`yieldIfContendedSafely()`、`yieldIfContendedSafely()`、`close()`五个方法，实际上就是SQLiteDatabase原生事务的一个抽象。
 其中`markSuccessful()`、`yieldIfContendedSafely()`、`yieldIfContendedSafely()`三个方法都只是拿到SQLiteOpenHelper中的db进行对应的操作。这里有意思的是`end`函数：

```
 @Override
 public void end() {
      SqliteTransaction transaction = transactions.get();
      if (transaction == null) {
        throw new IllegalStateException("Not in transaction.");
      }
      SqliteTransaction newTransaction = transaction.parent;
      transactions.set(newTransaction);
      if (logging) log("TXN END %s", transaction);
      getWriteableDatabase().endTransaction();
      // Send the triggers after ending the transaction in the DB.
      if (transaction.commit) {
        sendTableTrigger(transaction);
      }
 }
```

 end函数是必须被调用的，相当于对db的endTransaction()函数做了一层代理。它首先拿出transaction对象，并将transactions对象设为transaction的parent，然后调用真实的endTransaction(),最后，当事务成功了，会调用sendTableTrigger(transaction),这个函数是什么呢？看名字应该可以知道它是一个触发器，没错，它就是sqlbrite实现响应式的重要一步！


### 触发器

sendTableTrigger函数的源码如下：

```
private void sendTableTrigger(Set<String> tables) {
    SqliteTransaction transaction = transactions.get();
    if (transaction != null) {
      transaction.addAll(tables);
    } else {
      if (logging) log("TRIGGER %s", tables);
      triggers.onNext(tables);
    }
}
```

它首先会先判断当前的transactions是否有值，有值说明当前还有事务正在执行，此时只将数据进行存储。等事务结束后一同出发。如果transactions没有值，就触发triggers的onNext函数，那这个triggers是什么呢？它就是Rxjava中大名鼎鼎的PublishSubject：

```
private final PublishSubject<Set<String>> triggers = PublishSubject.create();
```
 原来sqlbrite是用PublishSubject来实现数据的及时更新，PublishSubject是一种冷的Observable，每次调用它的onNext时就会主动触发观察者。

 其实不仅事务，BriteDatabase中对insert、delete、update等函数的调用也会触发sendTableTrigger函数。

 所以我们可以想象，当我们订阅了这个subject，每当有db有数据更新，我们就会收到新数据的推送。实现一次订阅，永久查收的效果。

### 查询

那如何实现订阅呢？对于数据库而言这就是查询操作。
sqlbrite中创建查询的方法是createQuery，源码如下：

```
private QueryObservable createQuery(final Func1<Set<String>, Boolean> tableFilter,
      final String sql, final String... args) {
    if (transactions.get() != null) {
      throw new IllegalStateException("Cannot create observable query in transaction. "
          + "Use query() for a query inside a transaction.");
    }

    final Query query = new Query() {
      @Override public Cursor run() {
        if (transactions.get() != null) {
          throw new IllegalStateException("Cannot execute observable query in a transaction.");
        }
        return getReadableDatabase().rawQuery(sql, args);
      }

      @Override public String toString() {
        return sql;
      }
    };

    Observable<Query> queryObservable = triggers //
        .filter(tableFilter) // Only trigger on tables we care about.
        .startWith(INITIAL_TRIGGER) // Immediately execute the query for initial value.
        .map(new Func1<Set<String>, Query>() {
          @Override public Query call(Set<String> trigger) {
            if (transactions.get() != null) {
              throw new IllegalStateException(
                  "Cannot subscribe to observable query in a transaction.");
            }
            if (logging) {
              log("QUERY\n  trigger: %s\n  tables: %s\n  sql: %s\n  args: %s", trigger, tableFilter,
                  sql, Arrays.toString(args));
            }
            return query;
          }
        }) //
        .onBackpressureLatest();
    return new QueryObservable(queryObservable);
}
```

代码稍多，但比较好理解，首先，构造了一个Query变量，这个Query变量就是sqlbrite对查询的一个抽象，接着我们看到了熟悉的triggers对象，通过一系列的变换，得到Observable<Query>对象queryObservable，最后，将queryObservable置于QueryObservable的构造函数中，并返回了一个QueryObservable对象。那这个QueryObservable是何方神圣呢？

其实它就是Observable的子类，但对Observable做了一些`本土化`的扩展，增加了如下几个方法：

```
1.public final <T> Observable<T> mapToOne(@NonNull Func1<Cursor, T> mapper)

2.public final <T> Observable<T> mapToOneOrDefault(@NonNull Func1<Cursor, T> mapper,
      T defaultValue)

3.public final <T> Observable<List<T>> mapToList(@NonNull Func1<Cursor, T> mapper)
```

 简单来说，这三个函数就是通过lift操作来将cursor变换成我们想要的数据，可以是业务实体亦或数据代理。

 综上，一个比较标准的查询方法如下：

    mDb.createQuery("TABLE_NAME", "SELECT * FROM TABLE_NAME")
            .mapToList((cursor, entity) -> cursor2entity(cursor))
            .distinct()
            .observeOn(AndroidSchedulers.mainThread())
            .subscribeOn(Schedulers.io())
            .subscribe(() -> {
            });

如此，就是sqlbrite实现`响应式`的主要思路了。

## 优缺点

* sqlbrite是用订阅模式来查询 ，而不是直接执行查询，这是它实现`响应式`的基础。

* sqlbrite`响应式`的颗粒是table，没有粗粒度到整个数据库，也没有细粒度到某一列或者某一个条件。

* sqlbrite没有封装sql语句，易错的同时也更易扩展。

* sqlbrite不是繁杂的orm框架，但轻量级是不是也是一种优点呢？
