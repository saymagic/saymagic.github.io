---
layout: post
keywords: Linux,apache,lamp,安装
description: LAMP的安装与多域名的映射
title: LAMP相关笔记
categories: [Exp]
tags: [Linux]
group: archive
icon: globe
---

此文是我在VPS上进行Linux上LAMP相关操作笔记，包括安装、多域名映射与数据库迁移。

## 1.apache2

	sudo apt-get install apache2

##  2.php

	sudo apt-get install php5

##  3.mysql

	sudo apt-get install mysql-server

##  4.php对mysql的扩展

	sudo apt-get install php5-mysql

##  5.php其它常用扩展包

	sudo apt-get install php5-gd curl libcur13 libcur13-dev php5-curl

##  6、安装phpMyAdmin

通过phpMyAdmin可以很方便的管理我们的MySQL数据库

	sudo apt-get install phpmyadmin

上面的环境安装好之后，我们可以尝试一下访问了。首先将服务都重启一下：

	重启mysql:sudo service mysql restart
	重启apache2：sudo service apache restart

接下来在浏览器输入我们的ip地址，没有意外的话就可以直接访问了。

##  7.域名与IP的配置

因为IP地址过于难记，我们此时需要域名，我们从域名商那里购买域名，域名供应商会负责接卸域名的DNS，比如我的[saymagic.tech](https://blog.saymagic.tech)域名。如果我想将这个域名映射到我的VPS上，需要前往域名供应商那里将域名的A记录指向自己的IP。类似于这个样子：

![](/pic/Linux-install-lamp/140923171907.png)

这样，当我访问saymagic.cn的时候，域名供应商就会将我们的域名转接到我们的IP地址上。这样我们VPS上的php页面就可以通过域名来访问了。但这样子会有一个缺点，你会发现如果别人拥有域名，也将A记录指向我们的IP，那就危险了，一是会浪费我们的流量，而是也会对我们域名的PR值有影响，因为有两个域名同时指向相同的网站有可能会被视为作弊。所以，我们要配置Apache，让它只能允许我们自己的域名来访问。

前往/etc/apache2/sites-available文件夹下，打开default文件，这个文件就是Apache服务器的默认配置，你可以在这个修改默认的访问路径，将/var/www改为你喜欢的，那么在那里添加域名呢？我们在ServerAdmin上面添加一条配置ServerName www.saymagic.cn。类似这个样子：

![](/pic/Linux-install-lamp/140921200947.png)

完成以后，保存退出，这样以后即使别人指向我们的IP也不会访问到我们的网站了。

##  8.在服务器上搭建多个站点

完成上面的所有步骤我们已经可以实现自己的一个小站点了，但是我们也会发现我们只能部署一个，如果我们有多个站点想部署上面怎么办呢？方法大同小异，我们只需要copy一份上面提到的default文件，重命名为blog。修改一下blog的内容，如我们要让blog.saymagic.cn域名访问我们的/var/www/blog目录，则只需要将ServerName 后面改为blog.saymagic.cn,对应的目录也做相应修改。下面这样:

![](/pic/Linux-install-lamp/140921201041.png)

保存后，我们只完成了一半，因为我们还需要让apache来加载这个文件，前往/etc/apache2/sites-enabled目录，通过软连接的方式将blog文件引入进来，执行命令

	ln -s /etc/apache2/sites-available/blog blog

这样，就会在sites-enabled目录下新建一个指向 **/etc/apache2/sites-available/blog**的名称为blog的软连接。(blog这个名字可以随意起，因为apache会自动加载sotes-enabled目录下的所有文件)
Ok，Everything has Done！去域名商那里把blog.saymagic.cn指向这个VPS的IP，就会让saymagic.cn 与blog.saymagic.cn访问同一个主机，却没有访问同一个目录，达到一个IP上通过apache产生多网站的效果。

## 9. MYSQL数据库迁移

我们都知道，当数据库逐渐增大，就需要迁移数据库到空间更大的硬盘上，mysql数据库的默认存储目录为**/var/lib/mysql**下面，每当新建一个数据库后就会再这个目录下新增文件。我以将默认存储路径迁移到/magic/mysql目录下为例:


#### 数据迁移前停止mysql服务

	$ sudo service mysql stop#

#### 将目标目录的所属用户组和用户和文件夹权限修改为**mysql:mysql  0700**

	$ sudo chown –vR mysql:mysql /magic/mysql
	$ sudo chmod –vR 700 /magic/mysql

#### 为了防止意外，把现有数据复制(cp)到新目录，而不是移动(mv)，为保证文件的权限和属性一致，复制过程一定要添加 -a 参数，由于数据量比较大添加 –v 参数可查看复制的过程

	$ cp –av /var/lib/mysql* /magic/mysql

#### 编辑MySQL的配置文件my.cnf

	$ sudo vim /etc/mysql/my.cof

#### 修改my.cnf文件中的datadir参数值

	datadir= /var/lib/mysql修改为datadir=/magic/mysql

#### 编辑apparmor关于mysql的权限配置文件

	$ sudo vim /etc/apparmor.d/usr.bin.mysql

#### 修改usr.sbin.mysqld文件中的数据存储目录的相关权限

	/data/mysql/ r修改为/magic/mysql r
	/data/mysql/** rwk修改为/magic/mysql** rwk

#### 保存退出后重启apparmor服务

	$ sudo service apparmor reload

#### 重启apparmor权限服务进程和mysql进程

	$ sudo service mysql restart
