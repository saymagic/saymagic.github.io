---
layout: post
keywords: Flex 布局,Flexbox,盒布局模型
description: Flexbox 布局的常用属性，动画分析
title: Flexbox 简明教程
categories: [JavaScript]
tags: [JavaScript]
group: archive
icon: globe
---

> Flexbox布局的目的是将我们从编写复杂 css 样式的地狱中拯救出来。但掌握Flexbox并非易事。所以，本文主要通过动画的方式介绍 Flexbox 布局的用法，让我们能够使用 Flexbox 构建更好的布局。

![https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdcl4l7u3j20sg0e8dg1.jpg](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdcl4l7u3j20sg0e8dg1.jpg)

Flexbox 布局的中心思想是让布局更加灵活和直观。因此，Flexbox通过声明的方式让容器自己决定如何布局它的子控件 - 包括它们的自身大小和子控件间的间距。这种思想很不错，让我们来看一下在实践中是如何应用的。

在本文中，我们将会仔细介绍9个常用的 Flexbox 的属性。包括如何使用、使用后的效果等等。

##  #1: Display: Flex

这是我们在使用原有 css 布局的样式：

> display: block

![https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdcw7797vg213s0hox6r.gif](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdcw7797vg213s0hox6r.gif)

上图中有四个子的 div 被放置在一个灰色的 div 容器中。目前，每个 div 都含有默认的 display 属性 - `block`。每个子div也因此占据了整行。

为了开始使用 Flexbox，我们需要让父容器 div 变成一个 flex 容器，只需更改其 display 属性：

```
.container {
  display: flex;
}
```
![https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdd5vow69g213s0h6hdt.gif](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdd5vow69g213s0h6hdt.gif)

虽然仅仅改变了一个单词，使得container容器现在拥有了 flex 的环境，它里面的子 div 就都会并排排列。

本例CodePen 地址：[https://codepen.io/saymagic/pen/jzjxxV](https://codepen.io/saymagic/pen/jzjxxV){:rel="nofollow"}

## #2: Flex Direction

Flexbox 容器包含了两条轴。主轴(main axis)和交叉轴 (cross axis)，默认情况下两条轴的情况如下：

![https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqddfautd6j218g0p0t9q.jpg](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqddfautd6j218g0p0t9q.jpg)

默认情况下，Flexbox 的子元素会被按照从左到右的顺序排放在主轴。这就是上个例子中我们对 container 声明`display`为 flex 之后，四个子元素横向排列的原因。

通过`flex-direction`属性，我们可以调换主轴：

```
.container {
  display: flex;
  flex-direction: column;
}
```

![https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqddmeos9ag213s0h6kjl.gif](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqddmeos9ag213s0h6kjl.gif)

这里有个很重要的点需要指出：`flex-direction: column`并不意味着将子元素在交叉轴上排列。而是将主轴从横向变为纵向。

`flex-direction`有另外两个值可以设置：`row-reverse` 和`column-reverse`。通过名字你一定可以猜出它们的作用，效果如下：

![https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqddrcjg4zg213s0h6avv.gif](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqddrcjg4zg213s0h6avv.gif)

本例CodePen 地址: [https://codepen.io/saymagic/pen/WzqJqp](https://codepen.io/saymagic/pen/WzqJqp){:rel="nofollow"}

## #3: Justify Content

`justify-content` 用于控制子元素在主轴上如何对齐。其共有五个可供设置的值：

* flex-start
* flex-end
* center
* space-between
* space-around

`justify-content` 的默认值为flex-start，意味着子元素从开始位置向结束位置排列

```
.container {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
}
```


![flex-start](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqddxuo8hug213e08u7wi.gif)

需要特别注意的是：`justify-content`作用的是主轴，而`flex-direction`会切换主轴。

本例CodePen 地址： [https://codepen.io/saymagic/pen/geNKar](https://codepen.io/saymagic/pen/geNKar){:rel="nofollow"}
## #4: Align Items

如果刚刚理解了`justify-content`,` align-items`也会很容易理解。它用于描述元素在交叉轴上如何对齐。

![https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdeg5ck6ij218g0p0t9q.jpg](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdeg5ck6ij218g0p0t9q.jpg)

`align-items`也包含了五个值：

* flex-start
* flex-end
* center
* stretch
* baseline

前面三个和` justify-content`可选的值一样，这里没有什么特殊。最后两个有点特殊：

`stretch`会让元素占满整个交叉轴，`baseline`会使子元素的第一行文字的基线对齐。

![https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdem032eug211m0d6b29.gif](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdem032eug211m0d6b29.gif)

（需要注意的是当`align-items`设置为 stretch 之后，每个子元素的高度必须设置为`auto`，否则，`height`属性会覆盖`align-items`属性）

为了更好的理解主轴和交叉轴，我们将`justify-content` 和`align-items`结合起来看看会产生什么神奇效果：

![https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdhmih513g211c0ji1ky.gif](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdhmih513g211c0ji1ky.gif)

本例CodePen 地址： [https://codepen.io/saymagic/pen/XELYKx](https://codepen.io/saymagic/pen/XELYKx){:rel="nofollow"}

## #5: Align Self

`align-self`允许子元素指定自己在交叉轴上的表现形式。如果一个子元素不指定`align-self`，则会按照父布局中的`align-items`参数进行排版。反之，会覆盖父布局对自己的要求，按照自身指定的值进行排版。`align-self`作用在子元素上，示例代码如下：

```
.container {
  align-items: flex-start;
}
.one {
  align-self: center;
}
// Only this square will be centered.
```

下面的 GIF 描述的是，我们对父布局的`align-items`设置为`center`,`flex-direction`设置为`row`, 对前两个方块设置了相同的`align-self `：

![https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdhv0b5wcg211i0bs4oy.gif](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdhv0b5wcg211i0bs4oy.gif)

本例CodePen 地址：[https://codepen.io/saymagic/pen/NYZBwo](https://codepen.io/saymagic/pen/NYZBwo){:rel="nofollow"}

## #6: Flex-Basis

`flex-basis`控制着一个子元素的默认大小。从下面的 GIF 中我们可以看到，`flex-basis`是可以替换`width`属性的：

![https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdi3qm4dng213a08gb2a.gif](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdi3qm4dng213a08gb2a.gif) 

`flex-basis`和`width`貌似看起来一样，那它们的区别是什么呢？主要区别在于`flex-basis`作用的是我们主轴方向元素的大小。

![https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdi8wh8oaj218g0p0t9q.jpg](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdi8wh8oaj218g0p0t9q.jpg)

下面我们看下，当我们将`flex-basis`保持不变，但是切换主轴的方向会发生什么：

![https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdiaceg39g212y0ee7wi.gif](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdiaceg39g212y0ee7wi.gif)

可以看到，当`flex-direction`为`row`时，`flex-basis`相当于`width`属性。当`flex-direction`为`column`时，`flex-basis`相当于`height`属性，


本例CodePen 地址: [https://codepen.io/saymagic/pen/JLQBmJ](https://codepen.io/saymagic/pen/JLQBmJ){:rel="nofollow"}

## #7 Flex Grow


接下来我们看下稍微复杂一点的`flex-grow`属性。首先，首先我们将所有的子元素的宽度都设置为120px：

![https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdipn31kfj213b080mx4.jpg](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdipn31kfj213b080mx4.jpg)

`flex-grow`属性的默认值为0，这意味着子元素不允许占据容器中剩余的空间。如果我们将每个子元素的`flex-grow`属性都设置为1看看效果吧：

![https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdiv71tl9j213k088t8r.jpg](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdiv71tl9j213k088t8r.jpg)

六个子元素共同占据了容器的整个宽度，容器本来剩余的空间被均匀地分布在每个子元素上。并且可以看到， `flex-grow`会覆盖`width`属性。关键的问题在于，`flex-grow`的值`1`代表着什么呢？我们不防将每个子元素的`flex-grow`的值设置为999，效果如下：

![https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdj09crg9j212x07t3yh.jpg](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdj09crg9j212x07t3yh.jpg)

可以看到，为每个子元素设置了1或者999都是一样的。实际上，我们可以将`flex-grow`理解为子元素的放大比例，默认为0，即如果存在剩余空间，也不放大。如果所有项目的flex-grow属性都为1，则它们将等分剩余空间（如果有的话）。如果一个项目的flex-grow属性为2，其他项目都为1，则前者占据的剩余空间将比其他项多一倍。

下面我们将所有子元素的`flex-grow`都设置为1，变动第三个子元素的`flex-grow`值：
![https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdj9e5cleg213c096npe.gif](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdj9e5cleg213c096npe.gif)

本例CodePen 地址: [https://codepen.io/saymagic/pen/pLXZYJ](https://codepen.io/saymagic/pen/pLXZYJ){:rel="nofollow"}

## #8: Flex Shrink

`flex-shrink`和 `flex-grow`相反,用于定义当父容器空间不够时，子元素如何压缩自己。

在下面的 GIF 中，每个子元素的`flex-grow`值都设置为1，所以当父容器缩小时，每个子元素都均匀的缩小：

![https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdjfgna0yg213m08w1l0.gif](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdjfgna0yg213m08w1l0.gif)

现在，我们单独将第三个子元素的`flex-shrink`属性设置为0，这意味着第三个子元素不允许被压缩：

![https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdjh0l01pg213m08w1l0.gif](https://raw.githubusercontent.com/saymagic/pic/master/8f2eb073gy1fqdjh0l01pg213m08w1l0.gif)

如我们期望的一样，当父容器逐渐变小时，第三个元素的大小并未随之改变。

本例CodePen 地址: [https://codepen.io/saymagic/pen/vRqzNV](https://codepen.io/saymagic/pen/vRqzNV){:rel="nofollow"}

## #9: Flex

`flex` 属性仅仅是对grow, shrink, 和 basis 三个属性的简写，默认值为0 (grow)、 1 (shrink)、 auto (basis)。比较简单，这里不做展开。


---

到这里，Flexbox 的常用属性就介绍的差不多了。本文主要翻译自[https://medium.freecodecamp.org/an-animated-guide-to-flexbox-d280cf6afc35](https://medium.freecodecamp.org/an-animated-guide-to-flexbox-d280cf6afc35){:rel="nofollow"}、[https://medium.freecodecamp.org/even-more-about-how-flexbox-works-explained-in-big-colorful-animated-gifs-a5a74812b053](https://medium.freecodecamp.org/even-more-about-how-flexbox-works-explained-in-big-colorful-animated-gifs-a5a74812b053){:rel="nofollow"}两篇文章并做了部分的修改。