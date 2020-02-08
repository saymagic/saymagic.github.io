---
layout: post
keywords: android, Webview
description: Webview上传文件的那些坑
title: Webview上传文件的那些坑
categories: [Android]
tags: [Android]
group: archive
icon: globe
---


> 要说Android中最厉害的组件莫过于Webview 了，夸张点说把这个组件放在屏幕上就可以算作一个简单地浏览器应用了。但你若认为这就万事大吉了，可太小看Webview这个磨人的妖精了，下面单就上传文件的这个坑来做展开。

## 从零开始

我们在xml中写入一个简单的Webview组件：

    <RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
            xmlns:tools="http://schemas.android.com/tools"                             android:layout_width="match_parent"
            android:layout_height="match_parent"
            tools:context=".MainActivity">

         <WebView
              android:id="@+id/webview"
              android:layout_width="fill_parent"
              android:layout_height="fill_parent"
              android:layout_margin="5dp"></WebView>

     </RelativeLayout>

然后在Java代码中使用其加载一个能够提供上传服务的URL：

    WebView webview = (WebView) findViewById(R.id.webview);
    webview.loadUrl(A_UPLOAD_URL);

之后，要加网络权限：

    <uses-permission android:name="android.permission.INTERNET"></uses-permission>

如果想让Webview能够访问本地资源，SD卡的读写权限也是避免不了的：

    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/><uses-permission android:name="android.permission.MOUNT_UNMOUNT_FILESYSTEMS"/>

最后，我们运行，会发现根本不能访问本地资源。Why？

让我们来填补第一个坑：

![](/pic/webview-upload/o_1a3j05n8q15ih1v8k19j0n01ag59.jpg)


## 支持上传文件

Webview执行上传操作的逻辑是这样的：首先准备上传时会回调`WebChromeClient`类下的`openFileChooser`方法，在这个方法中给我们机会发起Intent来打开支持提供文件的第三方应用，最后在`onActivityResult`回调中将第三方应用提供的内容通过一个叫做`ValueCallback`的参数返回给Webview（详细点来说：ValueCallback是在`openFileChooser `方法里由webview提供给我们的，里面包裹一个Uri，我们在`onActivityResult `里将选中的Uri反馈给`ValueCallback`，这时候相当于Webview就知道我们选择了什么文件），因此，我们需要为Webview设置一个提供`openFileChooser`方法的`WebChromeClient`，这个方法在不同版本的Android中参数是不同的，为此我们一般需要写三个重载函数，大致像这个样子：


    private ValueCallback<Uri> mUploadMessage;
		//设置`WebChromeClient`:
	webview.setWebChromeClient(new WebChromeClient(){
         public void openFileChooser(ValueCallback<Uri> uploadMsg) {
                Log.d(TAG, "openFileChoose(ValueCallback<Uri> uploadMsg)");
                mUploadMessage = uploadMsg;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                MainActivity.this.startActivityForResult(Intent.createChooser(i, "File Chooser"), FILECHOOSER_RESULTCODE);
          }

          public void openFileChooser( ValueCallback uploadMsg, String acceptType ) {
                Log.d(TAG, "openFileChoose( ValueCallback uploadMsg, String acceptType )");
                mUploadMessage = uploadMsg;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                MainActivity.this.startActivityForResult(
                        Intent.createChooser(i, "File Browser"),
                        FILECHOOSER_RESULTCODE);
          }
          public void openFileChooser(ValueCallback<Uri> uploadMsg, String acceptType, String capture){
                Log.d(TAG, "openFileChoose(ValueCallback<Uri> uploadMsg, String acceptType, String capture)");
                mUploadMessage = uploadMsg;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                MainActivity.this.startActivityForResult( Intent.createChooser( i, "File Browser" ), MainActivity.FILECHOOSER_RESULTCODE );
            }
    });

	//onActivityResult回调
	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		    super.onActivityResult(requestCode, resultCode, data);
		    if(requestCode==FILECHOOSER_RESULTCODE)
		     {
		            if (null == mUploadMessage && null == mUploadCallbackAboveL) return;
		             Uri result = data == null || resultCode != RESULT_OK ? null : data.getData();
					 if (mUploadMessage != null) {
		                mUploadMessage.onReceiveValue(result);
		                mUploadMessage = null;
		           }
		      }
   	}

 还有重要的一点：如果这个上传操作涉及到JS操作，别忘记对Webview开启对JS的支持：

```
WebSettings settings = webview.getSettings();
settings.setJavaScriptEnabled(true);
```

 这样，打个debug包测试看以下，不出意外我们的Webview应该可以支持上传操作了。

 别高兴得太早，如果这个时候产品要将release包推向市场，当你把release包交给产品时，你会发现你的Webview又不能上传了，什么情况？

 请听Webview上传操作的第二个坑。

  ![](/pic/webview-upload/o_1a3j0ftc2frt1m8sifd1jch3l4e.jpg)


## 支持release版

debug版是好的，为什么release就不行了呢？准确的说，开启了混淆的release包是不可以的，究其原因在于,`openFileChooser `方法并不是`WebChromeClient `的对外开放的方法，因此这个方法会被混淆，解决办法也比较简单，只需要在混淆文件里控制一下即可：

	-keepclassmembers class * extends android.webkit.WebChromeClient{
   		public void openFileChooser(...);
	}

好了，我们的Webview可以作为应用内的一个部分对外发布了，等等，有5.0以上用户反映用不了？纳尼？？？？


别回心，来看看这第三个坑。

![](/pic/webview-upload/o_1a3j0h7468jv1g9onsc1kdtbfde.jpg)

## 支持5.0

在5.0发布后，Android人家说了，这次我们回调的不是`openFileChooser`方法，而是`onShowFileChooser`方法，并且上文提到的`ValueCallback`参数里包裹着不再是Uri,而是Uri数组，因此我们必须为5.0+的机器做适配，大致思路如下：

	webview.setWebChromeClient(new WebChromeClient(){
    public void openFileChooser(ValueCallback<Uri> uploadMsg) {
         ...
    }

    public void openFileChooser( ValueCallback uploadMsg, String acceptType ) {
		   ...
    }

    public void openFileChooser(ValueCallback<Uri> uploadMsg, String acceptType, String capture){
					...
    }

    // For Android 5.0+
    public boolean onShowFileChooser (WebView webView, ValueCallback<Uri[]> filePathCallback, WebChromeClient.FileChooserParams fileChooserParams) {
             mUploadCallbackAboveL = filePathCallback;
             Intent i = new Intent(Intent.ACTION_GET_CONTENT);
             i.addCategory(Intent.CATEGORY_OPENABLE);
             i.setType("*/*");
             MainActivity.this.startActivityForResult(
                        Intent.createChooser(i, "File Browser"),
                        FILECHOOSER_RESULTCODE);
             return true;
            }
    });

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if(requestCode==FILECHOOSER_RESULTCODE)
        {
            if (null == mUploadMessage && null == mUploadCallbackAboveL) return;
            Uri result = data == null || resultCode != RESULT_OK ? null : data.getData();
            if (mUploadCallbackAboveL != null) {
                onActivityResultAboveL(requestCode, resultCode, data);
            }
            else  if (mUploadMessage != null) {
                mUploadMessage.onReceiveValue(result);
                mUploadMessage = null;
            }
        }
    }

    @TargetApi(Build.VERSION_CODES.LOLLIPOP)
    private void onActivityResultAboveL(int requestCode, int resultCode, Intent data) {
        if (requestCode != FILECHOOSER_RESULTCODE
                || mUploadCallbackAboveL == null) {
            return;
        }

        Uri[] results = null;
        if (resultCode == Activity.RESULT_OK) {
            if (data == null) {

            } else {
                String dataString = data.getDataString();
                ClipData clipData = data.getClipData();

                if (clipData != null) {
                    results = new Uri[clipData.getItemCount()];
                    for (int i = 0; i < clipData.getItemCount(); i++) {
                        ClipData.Item item = clipData.getItemAt(i);
                        results[i] = item.getUri();
                    }
                }

                if (dataString != null)
                    results = new Uri[]{Uri.parse(dataString)};
            }
        }
        mUploadCallbackAboveL.onReceiveValue(results);
        mUploadCallbackAboveL = null;
        return;
    }

如上，我们的Webview应该就可以适应5.0+的机器了。


## 总结

根据我自己的测试，上面的参考代码成功跑通了如下几个机型：魅族5.0.1、YunOS5.0、小米4.4.4、小米4.3、摩托4.4.4。不过对于Android这种从2.0、3.0、4.0、5.0都对Webview做手脚并且不保持向下兼容的作法，我只想说在逗宝宝们玩？

综上，也许你会放松些，不管怎样我们总算有了比较完美的解决办法，但别急，如上代码在4.4.0机子上依旧会失效的，为什么呢？当时Android说在Webview中上传文件不安全，我们先取消，换句话说，如果不是一些第三方良(恶)心厂商对Webview从底层做修改，单从应用层即使你改出花来也不会支持上传操的！

![](/pic/webview-upload/o_1a3j0gn1q1qhh10gcqcm11hq1r359.jpg)

## 参考

[http://stackoverflow.com/questions/29666844/onshowfilechooser-from-android-webview-works-only-once](http://stackoverflow.com/questions/29666844/onshowfilechooser-from-android-webview-works-only-once)

[http://www.zhihu.com/question/31316646](http://www.zhihu.com/question/31316646)
