---
layout: post
keywords: pop3, imap, smtp, email
description: pop3、imap、smtp
title: POP3／IMAP/SMTP 常用命令总结
categories: [Exp]
tags: [Optimization]
group: archive
icon: globe
---

## POP3
 
### 连接服务器
```
c: telnet pop.sohu.com 110

s: +OK POP3 ready
```
### 输入用户名

```
c: USER ***

s: +OK
```

### 输入密码

```
c: PASS ***

s: +OK Authentication Succeeded
```

### 查看总状态

```
c : STAT

s: +OK 4 15068

注：4表示邮件总数，15068表示邮件总大小
```

### 列出每封邮件状态

```
c: LIST

s: 
+OK 
1 1562
2 1673
3 6443
4 5390
```
### 查看邮件ID

```
c: UIDL

s: 
1 170706.b69c11dd8708421b9dc05d47a5c589ef
2 161026.6464e0423ec84bc1aa8f8841e703835a
3 1438906152.V820I8ed722e9M636269.mx174.mail.sohu.com
4 welcome.0.eml
注： 前面数字表示邮件序号，后面的字符串表示邮件的id
```
### 根据序号查邮件id

```
c: UIDL 1
s: +OK 1 170706.b69c11dd8708421b9dc05d47a5c589ef

```
### 查看信头
 ```
c: TOP 1 0

s:
+OK 
Return-Path: <saymagic@sohu.com>
X-Original-To: saymagic@sohu.com
Delivered-To: saymagic@sohu.com
Received: from websmtp.sohu.com (unknown [10.16.57.141])
    by mx205.mail.sohu.com (Postfix) with ESMTP id 5CF4BDC022B
    for <saymagic@sohu.com>; Thu,  6 Jul 2017 17:45:31 +0800 (CST)
Received: from mx205.mail.sohu.com (unknown [10.16.22.120])
    by websmtp.sohu.com (Postfix) with ESMTP id 4659544A21
    for <saymagic@sohu.com>; Thu,  6 Jul 2017 17:45:31 +0800 (CST)
Received: from 41899455a386 (unknown [10.16.29.37])
    by mx205.mail.sohu.com (Postfix) with ESMTP id 384DEDC022B
    for <saymagic@sohu.com>; Thu,  6 Jul 2017 17:45:31 +0800 (CST)
Date: Thu, 6 Jul 2017 17:45:31 +0800 (CST)
From: saymagic <saymagic@sohu.com>
To: saymagic <saymagic@sohu.com>
Message-ID: <1499334331.74d440d1c57847e6b09eb263e515e774.saymagic@sohu.com>
Subject: sdsd
MIME-Version: 1.0
Content-Type: multipart/mixed; 
    boundary="----=_Part_485_1065173654.1499334331190"
X-Sohu-DeliverStatus: <1499334331.74d440d1c57847e6b09eb263e515e774.saymagic@sohu.com>
X-SHIP: 123.58.160.131
X-Sohu-Gateway: 1
X-Sohu-Antispam-Language: 0
X-Sohu-Antispam-Score: 10.0249998271


.

注： 1表示邮件序列号，0表示需要返回正文的行数（适合做摘要）
```
### 查看完整mime

```
c : RETR 1

S:
+OK 
Return-Path: <saymagic@sohu.com>
X-Original-To: saymagic@sohu.com
Delivered-To: saymagic@sohu.com
Received: from websmtp.sohu.com (unknown [10.16.57.141])
    by mx205.mail.sohu.com (Postfix) with ESMTP id 5CF4BDC022B
    for <saymagic@sohu.com>; Thu,  6 Jul 2017 17:45:31 +0800 (CST)
Received: from mx205.mail.sohu.com (unknown [10.16.22.120])
    by websmtp.sohu.com (Postfix) with ESMTP id 4659544A21
    for <saymagic@sohu.com>; Thu,  6 Jul 2017 17:45:31 +0800 (CST)
Received: from 41899455a386 (unknown [10.16.29.37])
    by mx205.mail.sohu.com (Postfix) with ESMTP id 384DEDC022B
    for <saymagic@sohu.com>; Thu,  6 Jul 2017 17:45:31 +0800 (CST)
Date: Thu, 6 Jul 2017 17:45:31 +0800 (CST)
From: saymagic <saymagic@sohu.com>
To: saymagic <saymagic@sohu.com>
Message-ID: <1499334331.74d440d1c57847e6b09eb263e515e774.saymagic@sohu.com>
Subject: sdsd
MIME-Version: 1.0
Content-Type: multipart/mixed; 
    boundary="----=_Part_485_1065173654.1499334331190"
X-Sohu-DeliverStatus: <1499334331.74d440d1c57847e6b09eb263e515e774.saymagic@sohu.com>
X-SHIP: 123.58.160.131
X-Sohu-Gateway: 1
X-Sohu-Antispam-Language: 0
X-Sohu-Antispam-Score: 10.0249998271

------=_Part_485_1065173654.1499334331190
Content-Type: text/html;charset=utf-8
Content-Transfer-Encoding: base64

PHA+c2RzZGFzZGFzZHNkc2Q8L3A+PGJyLz48YnIvPjxici8+PGRpdj48YSBocmVmPSIvL3Njb3Jl
Lm1haWwuc29odS5jb20vP3JlZj1tYWlsX3RhaWxhZCI+PGltZyAgYm9yZGVyPSIwIiBzcmM9Ii8v
YWQubWFpbC5zb2h1LmNvbS9tYWlsL2ltYWdlcy9zY29yZV9hZF9mb290MV83NTB4NzkucG5nIi8+
IDwvYT48L2Rpdj4NCjxici8+PGJyLz48YnIvPgo=
------=_Part_485_1065173654.1499334331190--

.
```

### 保持连接
```
c: NOOP

s: +OK NOOP
```

### 退出
```
c : QUIT

s : +OK byebye!
```
RFC文档：[https://tools.ietf.org/html/rfc1939](https://tools.ietf.org/html/rfc1939)

## SMTP

### 构建连接
```
c: telnet smtp.sohu.com 25

```
### ECLO

```
c: EHLO smtp.sohu.com

s: 
250-zw_71_47
250-AUTH PLAIN LOGIN
250 STARTTLS

```
### 开始登录
```
c: AUTH LOGIN

s:
334 VXNlcm5hbWU6
```
### 输入用户名
```
c:  ***

s:
334 UGFzc3dvcmQ6

注：用户名需base64编码
```
### 输入密码
```
c：***

s: 
235 2.0.0 OK

注：密码需base64编码
```
### 邮件发送方：

```
c: MAIL FROM:<saymagic@sohu.com>

s: 250 2.1.0 Ok
```

### 邮件接收方

```
c: RCPT TO:<saymagic@sohu.com>

s: 250 2.1.5 Ok
```
### 开始发送正文

```
c: DATA

s: 
354 End data with <CR><LF>.<CR><LF>
```
### 发送正文

```
c:
TO: saymagic@sohu.com
FROM: saymagic@sohu.com
SUBJECT: test by telnet/smtp

test, just a test.

.

s:
250 2.0.0 Ok: queued as 3x3fd25ZGgzHr0hc
```
RFC地址：[https://tools.ietf.org/html/rfc821](https://tools.ietf.org/html/rfc821)

## IMAP4

### 构建连接
```
c: telnet smtp.sohu.com 143

s:
Trying 220.181.90.34...
Connected to smtp.sohu.com.o.sohu.com.
Escape character is '^]'.
* OK IMAP4 ready
```
### 查看服务器支持的指令
```
c: a CAPABILITY

s:
* CAPABILITY IMAP4 IMAP4rev1 UIDPLUS IDLE AUTH=PLAIN STARTTLS
a OK completed
```

### 登录
```
c : a LOGIN username pass

s: a OK LOGIN completed
```

### 查看所有文件夹
```
c: a LIST "" "*"

s:
* LIST (\HasNoChildren \Trash) "/" "&XfJSIJZkkK5O9g-"
* LIST (\HasNoChildren \Junk) "/" "&V4NXPpCuTvY-"
* LIST (\HasNoChildren) "/" "INBOX"
* LIST (\HasNoChildren \Drafts) "/" "&g0l6P3ux-"
* LIST (\HasNoChildren \Sent) "/" "&XfJT0ZABkK5O9g-"
a OK LIST completed

```
### 查看信箱状态
```
c: a STATUS INBOX (MESSAGES UNSEEN RECENT)

s:
* STATUS "INBOX" (MESSAGES 1584 RECENT 3 UNSEEN 3)
a OK STATUS completed
```
### 选中信箱
```
c: a SELECT INBOX

s: 
* 3 RECENT
* OK [UIDVALIDITY 1] UIDs valid
* FLAGS (\Answered \Seen \Deleted \Draft \Flagged)
* OK [PERMANENTFLAGS (\Answered \Seen \Deleted \Draft \Flagged)] Limited
a OK [READ-WRITE] SELECT completed
```
### 查看信箱内邮件数量

```
c: a SEARCH *

s: 
* SEARCH 1584
a OK SEARCH completed
```

### 查看总邮件数量

```
c: a UID SEARCH *

s:
* SEARCH 1410797707
a OK SEARCH completed

注： IMAP 中包含Message Sequence Number与UID两种id概念，Message Sequence Number表示的是邮件在信箱中的id，可能发生变化（删除）。UID是邮件在该帐号下的全局ID，即使删除，服务器也应保证该id不发生变化。因此，对于SEARCH、FETCH 、STORE等命令都对应额外的UID SEARCH、UID FETCH、UID STORE 命令用来根据全局id操作邮件。后续命令都直接使用SEARCH等命令来做演示。
```
### 查看信头

```
c: a FETCH 1 BODY[HEADER]

s:
* 1 FETCH (BODY[HEADER] {360}
From: webmaster@sohu.com
Content-Disposition: inline
Content-Transfer-Encoding: base64
Mime-Version: 1.0
To: saymagic@sohu.com
Date: Fri, 07 Aug 2015 00:07:30 -0000
Message-Id: <20150807000730.29200.45787@mx174.mail.sohu.com>
Content-Type: text/html; charset="utf-8"
Subject: =?utf-8?b?5qyi6L+O5oKo6L+b5YWl5paw54mI5pCc54uQ6Zeq55S16YKu566x77yBDQo=?=

)
A OK FETCH completed

```
### 查看正文
```
c : a FETCH 1 BODY[TEXT]

s:
* 1 FETCH (BODY[TEXT] {5120}
PCFET0NUWVBFIGh0bWwgUFVCTElDICItLy9XM0MvL0RURCBYSFRNTCAxLjAgVHJhbnNpdGlvbmFs
Ly9FTiIgImh0dHA6Ly93d3cudzMub3JnL1RSL3hodG1sMS9EVEQveGh0bWwxLXRyYW5zaXRpb25h
bC5kdGQiPgo8aHRtbCB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCI+CjxoZWFk
Pgo8bWV0YSBodHRwLWVxdWl2PSJDb250ZW50LVR5cGUiIGNvbnRlbnQ9InRleHQvaHRtbDsgY2hh
cnNldD1nYjIzMTIiIC8+Cjx0aXRsZT7mkJzni5Dpl6rnlLXpgq7nrrHmrKLov47mgqg8L3RpdGxl
Pgo8L2hlYWQ+Cgo8Ym9keSBzdHlsZT0ibWFyZ2luOjAiPgo8aW1nIHNyYz0iIGh0dHA6Ly9nb3Rv
Lm1haWwuc29odS5jb20vZ290by5waHA/Y29kZT1uZXd3ZWxjb21lIiB3aWR0aD0xIGhlaWdodD0x
Pgo8dGFibGUgd2lkdGg9IjYxNiIgYm9yZGVyPSIwIiBhbGlnbj0iY2VudGVyIiBjZWxscGFkZGlu
Zz0iMCIgY2VsbHNwYWNpbmc9IjMiIGJnY29sb3I9IiNlNGYyZmEiPgogIDx0cj4KICAgIDx0ZCA+
PHRhYmxlIHdpZHRoPSI2MTAiIGJvcmRlcj0iMCIgYWxpZ249ImNlbnRlciIgY2VsbHBhZGRpbmc9
IjAiIGNlbGxzcGFjaW5nPSIwIiBiZ2NvbG9yPSIjRkZGRkZGIiBzdHlsZT0iYm9yZGVyOjFweCBz
b2xpZCAjOTViZWQ3O2ZvbnQtZmFtaWx5OuWui+S9kztjb2xvcjojNGM0YzRjOyI+CiAgICAgIDx0
cj4KICAgICAgICA8dGQgaGVpZ2h0PSI4OCIgdmFsaWduPSJ0b3AiIGJnY29sb3I9ImVhZWZmNCI+
PGltZyBzcmM9Imh0dHA6Ly9qcy5zb2h1LmNvbS9tYWlsL3dlbGNvbWUvaW1hZ2VzL3RvcDEuanBn
IiAvPjwvdGQ+CiAgICAgIDwvdHI+CiAgICAgIDx0cj4KICAgICAgICA8dGQgdmFsaWduPSJ0b3Ai
IHN0eWxlPSJmb250LXNpemU6MTRweDtsaW5lLWhlaWdodDoyM3B4O3BhZGRpbmc6MzBweCA1MHB4
OyI+PHRhYmxlIHdpZHRoPSIxMDAlIiBib3JkZXI9IjAiIGNlbGxzcGFjaW5nPSIwIiBjZWxscGFk
ZGluZz0iMCI+CiAgICAgICAgICA8dHI+CiAgICAgICAgICAgIDx0ZD7kurLniLHnmoTnlKjmiLfv
vJpzYXltYWdpY0Bzb2h1LmNvbTwvdGQ+CiAgICAgICAgICA8L3RyPgogICAgICAgICAgPHRyPgog
ICAgICAgICAgICA8dGQ+44CA44CA5qyi6L+O5oKo6L+b5YWl5pCc54uQ6Zeq55S16YKu566x77yB
IOaQnOeLkOmXqueUtemCrueuseS7peeUqOaIt+S4uuS4reW/g++8jOiHtOWKm+S6juS4uuaCqOaP
kOS+m+abtOW/q+OAgeabtOWuieWFqOOAgeabtOaZuuiDveeahOacjeWKoeOAgjwvdGQ+CiAgICAg
ICAgICA8L3RyPgogICAgICAgICAgPHRyPgogICAgICAgICAgICA8dGQ+Jm5ic3A7PC90ZD4KICAg
ICAgICAgIDwvdHI+CiAgICAgICAgICA8dHI+CiAgICAgICAgICAgIDx0ZD48c3Ryb25nPuabtOW/
qzwvc3Ryb25nPuOAgCDjgIDpobXpnaLlk43lupTlv6vvvIzmgqjlnKjmtY/op4jjgIHpmIXor7vp
gq7ku7bml7blh6DkuY7ml6DpnIDnrYnlvoUgPGJyIC8+CiAgICAgICAgICAgIDxzdHJvbmc+5pu0
5a6J5YWoPC9zdHJvbmc+44CAIOiHtOWKm+S6juWPjeWeg+WcvumCruS7tuWSjOmYsueXheavku+8
jOiuqeaCqOaLpeacieecn+ato+eahOe7v+iJsuWutuWbrSA8YnIgLz4KICAgICAgICAgICAgPHN0
cm9uZz7mm7Tmmbrog708L3N0cm9uZz7jgIAg5Yqf6IO95LiN5pat5o6o6ZmI5Ye65paw77yM6K6p
5oKo55qE6YKu5Lu2566h55CG5pu05pm66IO9IDwvdGQ+CiAgICAgICAgICA8L3RyPgogICAgICAg
ICAgPHRyPgogICAgICAgICAgICA8dGQ+Jm5ic3A7PC90ZD4KICAgICAgICAgIDwvdHI+CiAgICAg
ICAgICA8dHI+CiAgICAgICAgICAgIDx0ZD48dGFibGUgd2lkdGg9IjEwMCUiIGJvcmRlcj0iMCIg
Y2VsbHNwYWNpbmc9IjUiIGNlbGxwYWRkaW5nPSIwIj4KICAgICAgICAgICAgICA8dHI+CiAgICAg
ICAgICAgICAgICA8dGQgd2lkdGg9IjI1JSI+PGltZyBzcmM9Imh0dHA6Ly9qcy5zb2h1LmNvbS9t
YWlsL3dlbGNvbWUvaW1hZ2VzL2h1aWh1YS5qcGciIHdpZHRoPSI3NyIgaGVpZ2h0PSI4MiIgLz48
L3RkPgogICAgICAgICAgICAgICAgPHRkIHdpZHRoPSI3NSUiPjxzdHJvbmc+6YKu5Lu25Lya6K+d
PC9zdHJvbmc+5qih5byP77yM5bCG5oKo5LiO5LuW5Lq65b6A5p2l55qE6YKu5Lu25oyJ54Wn5qCH
6aKY5ZKM6IGU57O75Lq65pm66IO955qE57uE5ZCI5Yiw5LiA6LW35b2i5oiQ5Lya6K+d77yM6K6p
5oKo55qE5bel5L2c5pu055yB5b+D44CCPC90ZD4KICAgICAgICAgICAgICA8L3RyPgogICAgICAg
ICAgICAgIDx0cj4KICAgICAgICAgICAgICAgIDx0ZD48aW1nIHNyYz0iaHR0cDovL2pzLnNvaHUu
Y29tL21haWwvd2VsY29tZS9pbWFnZXMvc291c3VvLmpwZyIgd2lkdGg9Ijc4IiBoZWlnaHQ9Ijg5
IiAvPjwvdGQ+CiAgICAgICAgICAgICAgICA8dGQ+5by65aSn55qEPHN0cm9uZz7pgq7ku7blhajm
lofmkJzntKI8L3N0cm9uZz7lip/og73vvIzmgqjlj6/ku6Xlr7nlj5Hku7bkurrjgIHpgq7ku7bm
oIfpopjjgIHpgq7ku7bmraPmlofvvIznlJroh7PmmK/pmYTku7blkI3np7Dov5vooYzmkJzntKLv
vIzmkJzntKLnu5Pmnpzlrp7ml7blh4bnoa7jgII8L3RkPgogICAgICAgICAgICAgIDwvdHI+CiAg
ICAgICAgICAgICAgPHRyPgogICAgICAgICAgICAgICAgPHRkPjxpbWcgc3JjPSJodHRwOi8vanMu
c29odS5jb20vbWFpbC93ZWxjb21lL2ltYWdlcy9kYWlzaG91LmpwZyIgd2lkdGg9IjgyIiBoZWln
aHQ9Ijg3IiAvPjwvdGQ+CiAgICAgICAgICAgICAgICA8dGQ+5L6/5o2355qE5LiA566x5aSa6YKu
5Yqf6IO977yM5oKo5Y+v5Lul5bCG5YW25LuW6YKu566x55qE6YKu5Lu25Luj5pS25Yiw5pCc54uQ
6Zeq55S16YKu566x77yM57uf5LiA566h55CG44CCPC90ZD4KICAgICAgICAgICAgICA8L3RyPgog
ICAgICAgICAgICA8L3RhYmxlPjwvdGQ+CiAgICAgICAgICA8L3RyPgogICAgICAgICAgPHRyPgog
ICAgICAgICAgICA8dGQ+Jm5ic3A7PC90ZD4KICAgICAgICAgIDwvdHI+CiAgICAgICAgICA8dHI+
CiAgICAgICAgICAgIDx0ZD7or7fmgqjlnKjmjqXkuIvmnaXnmoTml6XlrZDph4zvvIzoh7PlsJE5
MOWkqeeZu+W9leS4gOasoemXqueUtemCrueuse+8jOS7peehruS/neaCqOeahOmCrueuseato+W4
uOS9v+eUqOOAgiA8L3RkPgogICAgICAgICAgPC90cj4KICAgICAgICAgPHRyPgogICAgICAgICAg
ICA8dGQ+Jm5ic3A7PC90ZD4KICAgICAgICAgIDwvdHI+CiAgICAgICAgIDx0cj4KICAgICAgICAg
ICAgPHRkPuS6huino+abtOWkmuaIkeS7rOeahOWKqOaAge+8jOivt+iuv+mXruaQnOeLkOmXqueU
temCrueusTxhIGhyZWY9aHR0cDovL2dvdG8ubWFpbC5zb2h1LmNvbS9nb3RvLnBocD9jb2RlPXdl
bGNvbWVkbSB0YXJnZXQ9X2JsYW5rPuWKn+iDveabtOaWsOaXpeW/lzwvYT48L3RkPgogICAgICAg
ICAgPC90cj4KICAgICAgICA8L3RhYmxlPiAgICAgICAgCiAgICAgICAgIAogICAgICAgICAgPC90
ZD4KICAgICAgPC90cj4KICAgICAgPHRyIGFsaWduPSJyaWdodCI+CiAgICAgICAgPHRkIGhlaWdo
dD0iMzAiIHZhbGlnbj0idG9wIiBzdHlsZT0iZm9udC1zaXplOjE0cHg7cGFkZGluZy1yaWdodDo1
NXB4OyIgPuaQnOeLkOmCruS7tuS4reW/g+aVrOS4iiA8L3RkPgogICAgICA8L3RyPgogICAgICA8
dHI+CiAgICAgICAgPHRkPjxpbWcgc3JjPSJodHRwOi8vanMuc29odS5jb20vbWFpbC93ZWxjb21l
L2ltYWdlcy9ib3R0b20yLmpwZyIgLz48L3RkPgogICAgICA8L3RyPgogICAgPC90YWJsZT48L3Rk
PgogIDwvdHI+CjwvdGFibGU+CjwvYm9keT4KPC9odG1sPgo=
)
A OK FETCH completed

```

### 查看完整mime
```
c: a  FETCH 1 BODY[]

s:
* 1 FETCH (BODY[] {5466}
Content-Type: text/html; charset="utf-8"
MIME-Version: 1.0
Content-Transfer-Encoding: base64
From: webmaster@sohu.com
To: saymagic@sohu.com
Date: Fri, 07 Aug 2015 00:07:30 -0000
Subject: =?utf-8?b?5qyi6L+O5oKo6L+b5YWl5paw54mI5pCc54uQ?=
    =?utf-8?b?6Zeq55S16YKu566x77yBDQo=?=
Message-ID: <20150807000730.29200.45787@mx174.mail.sohu.com>

PCFET0NUWVBFIGh0bWwgUFVCTElDICItLy9XM0MvL0RURCBYSFRNTCAxLjAgVHJhbnNpdGlvbmFs
Ly9FTiIgImh0dHA6Ly93d3cudzMub3JnL1RSL3hodG1sMS9EVEQveGh0bWwxLXRyYW5zaXRpb25h
bC5kdGQiPgo8aHRtbCB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCI+CjxoZWFk
Pgo8bWV0YSBodHRwLWVxdWl2PSJDb250ZW50LVR5cGUiIGNvbnRlbnQ9InRleHQvaHRtbDsgY2hh
cnNldD1nYjIzMTIiIC8+Cjx0aXRsZT7mkJzni5Dpl6rnlLXpgq7nrrHmrKLov47mgqg8L3RpdGxl
Pgo8L2hlYWQ+Cgo8Ym9keSBzdHlsZT0ibWFyZ2luOjAiPgo8aW1nIHNyYz0iIGh0dHA6Ly9nb3Rv
Lm1haWwuc29odS5jb20vZ290by5waHA/Y29kZT1uZXd3ZWxjb21lIiB3aWR0aD0xIGhlaWdodD0x
Pgo8dGFibGUgd2lkdGg9IjYxNiIgYm9yZGVyPSIwIiBhbGlnbj0iY2VudGVyIiBjZWxscGFkZGlu
Zz0iMCIgY2VsbHNwYWNpbmc9IjMiIGJnY29sb3I9IiNlNGYyZmEiPgogIDx0cj4KICAgIDx0ZCA+
PHRhYmxlIHdpZHRoPSI2MTAiIGJvcmRlcj0iMCIgYWxpZ249ImNlbnRlciIgY2VsbHBhZGRpbmc9
IjAiIGNlbGxzcGFjaW5nPSIwIiBiZ2NvbG9yPSIjRkZGRkZGIiBzdHlsZT0iYm9yZGVyOjFweCBz
b2xpZCAjOTViZWQ3O2ZvbnQtZmFtaWx5OuWui+S9kztjb2xvcjojNGM0YzRjOyI+CiAgICAgIDx0
cj4KICAgICAgICA8dGQgaGVpZ2h0PSI4OCIgdmFsaWduPSJ0b3AiIGJnY29sb3I9ImVhZWZmNCI+
PGltZyBzcmM9Imh0dHA6Ly9qcy5zb2h1LmNvbS9tYWlsL3dlbGNvbWUvaW1hZ2VzL3RvcDEuanBn
IiAvPjwvdGQ+CiAgICAgIDwvdHI+CiAgICAgIDx0cj4KICAgICAgICA8dGQgdmFsaWduPSJ0b3Ai
IHN0eWxlPSJmb250LXNpemU6MTRweDtsaW5lLWhlaWdodDoyM3B4O3BhZGRpbmc6MzBweCA1MHB4
OyI+PHRhYmxlIHdpZHRoPSIxMDAlIiBib3JkZXI9IjAiIGNlbGxzcGFjaW5nPSIwIiBjZWxscGFk
ZGluZz0iMCI+CiAgICAgICAgICA8dHI+CiAgICAgICAgICAgIDx0ZD7kurLniLHnmoTnlKjmiLfv
vJpzYXltYWdpY0Bzb2h1LmNvbTwvdGQ+CiAgICAgICAgICA8L3RyPgogICAgICAgICAgPHRyPgog
ICAgICAgICAgICA8dGQ+44CA44CA5qyi6L+O5oKo6L+b5YWl5pCc54uQ6Zeq55S16YKu566x77yB
IOaQnOeLkOmXqueUtemCrueuseS7peeUqOaIt+S4uuS4reW/g++8jOiHtOWKm+S6juS4uuaCqOaP
kOS+m+abtOW/q+OAgeabtOWuieWFqOOAgeabtOaZuuiDveeahOacjeWKoeOAgjwvdGQ+CiAgICAg
ICAgICA8L3RyPgogICAgICAgICAgPHRyPgogICAgICAgICAgICA8dGQ+Jm5ic3A7PC90ZD4KICAg
ICAgICAgIDwvdHI+CiAgICAgICAgICA8dHI+CiAgICAgICAgICAgIDx0ZD48c3Ryb25nPuabtOW/
qzwvc3Ryb25nPuOAgCDjgIDpobXpnaLlk43lupTlv6vvvIzmgqjlnKjmtY/op4jjgIHpmIXor7vp
gq7ku7bml7blh6DkuY7ml6DpnIDnrYnlvoUgPGJyIC8+CiAgICAgICAgICAgIDxzdHJvbmc+5pu0
5a6J5YWoPC9zdHJvbmc+44CAIOiHtOWKm+S6juWPjeWeg+WcvumCruS7tuWSjOmYsueXheavku+8
jOiuqeaCqOaLpeacieecn+ato+eahOe7v+iJsuWutuWbrSA8YnIgLz4KICAgICAgICAgICAgPHN0
cm9uZz7mm7Tmmbrog708L3N0cm9uZz7jgIAg5Yqf6IO95LiN5pat5o6o6ZmI5Ye65paw77yM6K6p
5oKo55qE6YKu5Lu2566h55CG5pu05pm66IO9IDwvdGQ+CiAgICAgICAgICA8L3RyPgogICAgICAg
ICAgPHRyPgogICAgICAgICAgICA8dGQ+Jm5ic3A7PC90ZD4KICAgICAgICAgIDwvdHI+CiAgICAg
ICAgICA8dHI+CiAgICAgICAgICAgIDx0ZD48dGFibGUgd2lkdGg9IjEwMCUiIGJvcmRlcj0iMCIg
Y2VsbHNwYWNpbmc9IjUiIGNlbGxwYWRkaW5nPSIwIj4KICAgICAgICAgICAgICA8dHI+CiAgICAg
ICAgICAgICAgICA8dGQgd2lkdGg9IjI1JSI+PGltZyBzcmM9Imh0dHA6Ly9qcy5zb2h1LmNvbS9t
YWlsL3dlbGNvbWUvaW1hZ2VzL2h1aWh1YS5qcGciIHdpZHRoPSI3NyIgaGVpZ2h0PSI4MiIgLz48
L3RkPgogICAgICAgICAgICAgICAgPHRkIHdpZHRoPSI3NSUiPjxzdHJvbmc+6YKu5Lu25Lya6K+d
PC9zdHJvbmc+5qih5byP77yM5bCG5oKo5LiO5LuW5Lq65b6A5p2l55qE6YKu5Lu25oyJ54Wn5qCH
6aKY5ZKM6IGU57O75Lq65pm66IO955qE57uE5ZCI5Yiw5LiA6LW35b2i5oiQ5Lya6K+d77yM6K6p
5oKo55qE5bel5L2c5pu055yB5b+D44CCPC90ZD4KICAgICAgICAgICAgICA8L3RyPgogICAgICAg
ICAgICAgIDx0cj4KICAgICAgICAgICAgICAgIDx0ZD48aW1nIHNyYz0iaHR0cDovL2pzLnNvaHUu
Y29tL21haWwvd2VsY29tZS9pbWFnZXMvc291c3VvLmpwZyIgd2lkdGg9Ijc4IiBoZWlnaHQ9Ijg5
IiAvPjwvdGQ+CiAgICAgICAgICAgICAgICA8dGQ+5by65aSn55qEPHN0cm9uZz7pgq7ku7blhajm
lofmkJzntKI8L3N0cm9uZz7lip/og73vvIzmgqjlj6/ku6Xlr7nlj5Hku7bkurrjgIHpgq7ku7bm
oIfpopjjgIHpgq7ku7bmraPmlofvvIznlJroh7PmmK/pmYTku7blkI3np7Dov5vooYzmkJzntKLv
vIzmkJzntKLnu5Pmnpzlrp7ml7blh4bnoa7jgII8L3RkPgogICAgICAgICAgICAgIDwvdHI+CiAg
ICAgICAgICAgICAgPHRyPgogICAgICAgICAgICAgICAgPHRkPjxpbWcgc3JjPSJodHRwOi8vanMu
c29odS5jb20vbWFpbC93ZWxjb21lL2ltYWdlcy9kYWlzaG91LmpwZyIgd2lkdGg9IjgyIiBoZWln
aHQ9Ijg3IiAvPjwvdGQ+CiAgICAgICAgICAgICAgICA8dGQ+5L6/5o2355qE5LiA566x5aSa6YKu
5Yqf6IO977yM5oKo5Y+v5Lul5bCG5YW25LuW6YKu566x55qE6YKu5Lu25Luj5pS25Yiw5pCc54uQ
6Zeq55S16YKu566x77yM57uf5LiA566h55CG44CCPC90ZD4KICAgICAgICAgICAgICA8L3RyPgog
ICAgICAgICAgICA8L3RhYmxlPjwvdGQ+CiAgICAgICAgICA8L3RyPgogICAgICAgICAgPHRyPgog
ICAgICAgICAgICA8dGQ+Jm5ic3A7PC90ZD4KICAgICAgICAgIDwvdHI+CiAgICAgICAgICA8dHI+
CiAgICAgICAgICAgIDx0ZD7or7fmgqjlnKjmjqXkuIvmnaXnmoTml6XlrZDph4zvvIzoh7PlsJE5
MOWkqeeZu+W9leS4gOasoemXqueUtemCrueuse+8jOS7peehruS/neaCqOeahOmCrueuseato+W4
uOS9v+eUqOOAgiA8L3RkPgogICAgICAgICAgPC90cj4KICAgICAgICAgPHRyPgogICAgICAgICAg
ICA8dGQ+Jm5ic3A7PC90ZD4KICAgICAgICAgIDwvdHI+CiAgICAgICAgIDx0cj4KICAgICAgICAg
ICAgPHRkPuS6huino+abtOWkmuaIkeS7rOeahOWKqOaAge+8jOivt+iuv+mXruaQnOeLkOmXqueU
temCrueusTxhIGhyZWY9aHR0cDovL2dvdG8ubWFpbC5zb2h1LmNvbS9nb3RvLnBocD9jb2RlPXdl
bGNvbWVkbSB0YXJnZXQ9X2JsYW5rPuWKn+iDveabtOaWsOaXpeW/lzwvYT48L3RkPgogICAgICAg
ICAgPC90cj4KICAgICAgICA8L3RhYmxlPiAgICAgICAgCiAgICAgICAgIAogICAgICAgICAgPC90
ZD4KICAgICAgPC90cj4KICAgICAgPHRyIGFsaWduPSJyaWdodCI+CiAgICAgICAgPHRkIGhlaWdo
dD0iMzAiIHZhbGlnbj0idG9wIiBzdHlsZT0iZm9udC1zaXplOjE0cHg7cGFkZGluZy1yaWdodDo1
NXB4OyIgPuaQnOeLkOmCruS7tuS4reW/g+aVrOS4iiA8L3RkPgogICAgICA8L3RyPgogICAgICA8
dHI+CiAgICAgICAgPHRkPjxpbWcgc3JjPSJodHRwOi8vanMuc29odS5jb20vbWFpbC93ZWxjb21l
L2ltYWdlcy9ib3R0b20yLmpwZyIgLz48L3RkPgogICAgICA8L3RyPgogICAgPC90YWJsZT48L3Rk
PgogIDwvdHI+CjwvdGFibGU+CjwvYm9keT4KPC9odG1sPgo=
)
A OK FETCH completed
```
### 标为为读

```
c: a STORE 1 -FLAGS \Seen

s:
* 1 FETCH (FLAGS (\Recent))
a OK STORE completed

注：标为未读、标为红旗、删除都属于邮件的flag，都使用STORE命令来触发，所有flag整理如下：
- \Seen            已读
- \Answered   是否被回复
- \Flagged       红旗
- \Deleted       删除，后续执行EXPUNGE命令可被彻底删除
- \Draft             草稿
- \Recent         自从上次信箱被选中后新到来的邮件
```

### Message Sequence Number转UID
```
c: a UID SEARCH 1000

s:
* SEARCH 1410797122
a OK SEARCH completed
```
### UID 转Message Sequence Number
```
c：a SEARCH UID 1410797122

s:
* SEARCH 1000
a OK SEARCH completed
```

### 创建文件夹

```
c:
a CREATE MAGIC

s:
a OK mailbox created
```

### 重命名文件夹

```
c:
a RENAME MAGIC MAGIC_ONCE 

s:
a OK mailbox renamed
```

### 删除文件夹
```
c:
a DELETE MAGIC_ONCE

s:
a OK mailbox deleted
```
rfc文档地址：[https://tools.ietf.org/html/rfc3501](https://tools.ietf.org/html/rfc3501)