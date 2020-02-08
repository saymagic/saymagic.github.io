---
layout: post
keywords: awk, 批量删除,生成随机数, ColorBlind.txt
description: AWK常用技法,完整输出文件,输出行数,输出单词个数,去除重复行,生成随机数,批量备份
title: "AWK常用技法"
categories: [Exp]
tags: [LINUX]
group: archive
icon: globe
---

> AWK 作为linux下的一款优秀的工具，在文本处理方面拥有天然的优势。此文是我本周业余时间学习、整理而成。作为一名程序新手，对这款上古神器难免有理解不到的地方，不正确之处，劳烦斧正。

## 前情提要
本文将使用歌曲[Color Blind](http://music.163.com/#/song?id=29418632){:rel="nofollow"}的歌词作为AWK待处理的文本源，原因其一是我最近成功的被楼下理发店的这首歌洗脑；其二就是歌词比较有特点，适合用来说明AWK的用法。你可以在点击这里下载我整理过后的歌词：[ColorBlind.txt](http://cdn.saymagic.cn/o_1ah3n7gdp17lq121hefgea8io9.txt)

## 剧情铺垫

想要了解一个命令，首先需要知道它的一些约定俗成的规定。这就是linux中命令强大的部分原因，你可以一步一步的告诉我怎么做，也可以简明扼要，我会有默认的、最贴近大众化需求的处理方法。

以下是AWK的一些默认规则：

* AWK会默认通过循环处理输入文件的每一行

* AWK 会默认打印处理后的结果

* AWK 指令由模式、操作、或模式与操作的组合组成。简洁表示为`pattern { action }`，其中，操作需要用大括号括起来，模式默认暗含if关键字，如果模式后没有操作，则根据上条规则， AWK会将结果打印出来。常见用法是通过模式选择需要处理的行，在操作中进行处理。

* AWK包含BEGIN与END两种特殊模式，每个模式后紧跟由大括号括起来的操作块，BEGIN对应的操作快是对输入文件进行处理之前先执行，END则是最后。

* AWK包含了一些关键字，这些关键字中记录着常用信息，可以在操作中引用这些关键字。

        $0  存放着当前处理行的所有内容

        $1~$n   当前记录的第n个字段，字段间由FS分隔

        FS  输入字段分隔符 默认是空格或Tab

        NF  当前记录中的字段个数，就是有多少列

        NR  已经读出的行号，从1开始，如果有多个文件话，这个值也是不断累加中。

        FNR 当前行数，与NR不同的是，这个值会是各个文件自己的行号

        FILENAME    当前输入文件的名字

单纯的文字毕竟会枯燥，不过有了上面的这些基础，我们可以进入AWK这幕大剧了。

## 剧情深入

 * 完整输出文件

   AWK默认循环处理，$0代表当前行，默认打印，因此打印输出文件很简单：

        awk '$0' ColorBlind.txt

   上面使用了默认选中的结果会被默认打印的特性，当然我们可以使用操作将其打印出来：

        awk '{ print $0 }' ColorBlind.txt

*  输出行数

   对于单个文件，FNR记录着行数信息，所以我们在END模式中对其输出即可知道文件的行数：

        awk 'END{ print FNR }' ColorBlind.txt

* 输出单词个数

   AWK中变量无需声明即可直接使用，NF记录着当前行的列数，即单词数量，所以将其相加即可:

        awk  '{ x+=NF } END { print x}' ColorBlind.txt

* 去除重复行

   AWK 是有数组的概念的，因此这也不难

         awk '{ if ( !line[$0] ) print $0; line[$0]++ }' ColorBlind.txt

* 输出大于20个字符的行

   length关键字表示当前行的字符数，因此这个需求很简单

        awk 'length > 20 ' ColorBlind.txt

* 输出`black & white`歌词出现次数

    前面说过，AWK 模式默认隐含if关键字，同时，模式也可以是用两个`／`包裹的正则表达式，表示是否成功匹配当前行

        awk '/black & white/ {x++} END{print x}' ColorBlind.txt


## 高潮


AWK的技巧可不仅如此，我们玩一些更复杂的。

* 生成随机数

  AWK内置了一些函数，比如rand是用来生成随机数的，我想生成10个随机数可以这样：

        yes | head -10 | awk '{print rand()}'



* 批量备份

 假设ColorBlind这首歌的歌词创作者从初稿到终稿经过了n多个版本，命名大致如下：

        ColorBlind1.txt
        ColorBlind2.txt
        ColorBlind3.txt
        ColorBlind4.txt
        ColorBlind_don't_change.txt
        ....
        ColorBlind_nerver_change.txt
        ColorBlind_last_change.txt
        ColorBlind_fu*k.txt
        ColorBlind_dead.txt

 作者想将其备份到路径`/color/backup/`目录下，并且每个文件需要添加`.dat`后缀表示为备份文件，即ColorBlind1.txt->ColorBlind1.txt.dat

  通过AWK来实现的思路可以是根据文件名称组装mv命令，然后通过csh来执行

        ls ColorBlind* | awk '{print "mv "$0" /color/backup/"$0".dat"}' | csh

*  复杂命令

 其实AWK命令可以写的很复杂，通常一行命令可能不会满足需求，所以AWK同时也提供了从文件读取命令的方式，甚至可以自定义函数，这里不做过多介绍， 因为过于复杂的逻辑通过bash
、python之类也未尝不可。选择什么只是业务需要与便捷之间的权衡。

## 结局

文章到了最后，我们也仅仅是对AWK有了初步了解，更多细节还待认真学习，但所谓`万法皆空，因果不空`，执行下面的命令，结束我们AWK的学习吧：

    awk '{line[$0]++} END{for(i in line) delete line[i]}' ColorBlind.txt > ColorBlind.txt

## 参考
[http://intro-to-awk.blogspot.jp/](http://intro-to-awk.blogspot.jp/){:rel="nofollow"}

[http://coolshell.cn/articles/9070.html](http://coolshell.cn/articles/9070.html){:rel="nofollow"}

[http://www.infoworld.com/article/2985804/linux/remember-sed-awk-linux-admins-should.html](http://www.infoworld.com/article/2985804/linux/remember-sed-awk-linux-admins-should.html){:rel="nofollow"}
