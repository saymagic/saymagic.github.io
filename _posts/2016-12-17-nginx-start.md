---
layout: post
keywords: Nginx , 配置, 重定向
description: Nginx常用配置
title: "Nginx常用配置"
categories: [Tool]
tags: [Tool]
group: archive
icon: globe
---

> 身为移动开发者，平时使用Nginx并不多，但是和后端联调时，对重定向、转发这些常见的需求，借助Nginx调试起来往往会事半功倍。

## 准备

此文我们以Mac为参考主机，在Linux上除一些目录不同外，其余操作基本相同。

### 安装

```
brew install nginx
```

安装完成后访问本机8080端口，看到如下界面，则表示安装成功：

![](/pic/nginx-start/522a479f9f7726cf76b1a44438d0b39c.png)

### 常用参数

```
nginx 启动
nginx -s stop 停止
nginx -s reload 重新启动
nginx -t 检查配置文件语法是否有错误
```

### 主要的文件与目录

#### 配置文件

通过brew安装后，nginx的配置文件所在目录为：`/usr/local/etc/nginx`，`nginx.conf`文件相当于Nginx的入口配置，它会同时加载`servers`目录下的其它配置。所以当我们需要新增配置时，可以在`servers`目录下新建一个配置即可。

### 默认html所在路径
当我们访问本机8080端口时，返回的页面实际就在我们本地，这个是在`nginx.conf`里配置的：

```
location / {
     root   html;
     index  index.html index.htm;
}
```

这里的root所对应的值`html`是8080端口对应的文件路径。这个`html`是个相对路径，其完整路径为`/usr/local/Cellar/nginx/version/html`

---

## 常用配置

### 开启http server

一种常见的需求是将一个目录以http形式对外提供服务，例如上文所说，Nginx默认将`html`目录映射到8080端口。我们完全可以添加自定义的映射，比如我们将/Users/mine/www目录映射到当前主机的6789端口，在`servers`目录下新建一个`page.conf`,最简单的写法如下：

```
server {
    listen       6789;
    server_name  localhost;
    location / {
            root   /Users/mine/www;
            index  index.html index.htm;
    }
}
```

### 端口转发

通常一个主机上会同时开启多个服务，比如我们一个服务对应的是本机的3888端口，我们希望`up.saymagic.tech`域名来访问时，转发到3888端口的服务，写法如下：

```
server {
    listen 80;
    server_name up.saymagic.tech;
    location / {
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Server $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_pass http://localhost:38888/;
    }
}
```

### 重定向

重定向在做一些调试时特别方便，例如我们将域名`blog.saymagic.cn`重定向到`blog.saymagic.tech`，可以这样写配置文件：

```
server{
    listen 80;
    server_name blog.saymagic.cn;
    rewrite ^/(.*)$ http://blog.saymagic.tech permanent;
}
```




