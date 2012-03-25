function UploadAssistant(arg) {
    /* this is the creator function for your scene assistant object. It will be passed all the 
       additional parameters (after the scene name) that were passed to pushScene. The reference
       to the scene controller (this.controller) has not be established yet, so any initialization
       that needs the scene controller should be done in the setup function below. */
       this.launchParams = arg;
       Mojo.Log.info("arg: "+JSON.stringify(arg));
      
}
var consumer_token = "60648e4719285ec6fb437785e655bda5";
var consumer_secret = "aed509928807eab4f1a615e4d422c724";
var access_token = "";              
var access_secret = "";


// 选择图片
UploadAssistant.prototype.eBTNSelect = function(){
    var self = this; //Retain the reference for the callback
    var params = { defaultKind: 'image',
      onSelect: function(file){
          //self.controller.get('selection').innerHTML = Object.toJSON(file);
          this.img_to_send_path = file.fullPath;
      }.bind(this)
    }
    Mojo.FilePicker.pickFile(params, self.controller.stageController);
};

// 在这个函数中弹出提示，告诉用户当前没有任何信息需要提交
UploadAssistant.prototype.nullInputUpdate = function(){
    Mojo.Log.error("NULL input.");
    this.upload_processing = 0;
    // this.controller.get('id_send_status').mojo.deactivate();
    this.controller.showAlertDialog({
        //onChoose: function(value) {this.controller.get("area-to-update").innerText = "Alert result = " + value;},
        title: $L("出错！"),
        message: $L("请先添加照片或状态！"),
        choices:[
             // {label:$L('Rare'), value:"refresh", type:'affirmative'},  
             // {label:$L("Medium"), value:"don't refresh"},
             // {label:$L("Overcooked"), value:"don't refresh", type:'negative'},    
             {label:$L("返回"), value:"maybe refresh", type:'dismiss'}    
        ]
        });
    this.enableTextField();
    this.enableCommandMenu();
    return false;
}

UploadAssistant.prototype.enableCommandMenu = function(){
    this.commandMenuModel.items[0].disabled = false;
    this.commandMenuModel.items[1].disabled = false;
    this.controller.modelChanged(this.commandMenuModel);    
}

UploadAssistant.prototype.disableCommandMenu = function(){
    this.commandMenuModel.items[0].disabled = true;
    this.commandMenuModel.items[1].disabled = true;
    this.controller.modelChanged(this.commandMenuModel);    
}

UploadAssistant.prototype.disableTextField = function(){
    this.textModel["disabled"] = true;
    this.controller.modelChanged(this.textModel);
}
UploadAssistant.prototype.enableTextField = function(){
    this.textModel["disabled"] = false;
    this.controller.modelChanged(this.textModel);
}

// 发送(图片)状态更新到饭否
UploadAssistant.prototype.eBTNSend = function(){
    this.disableCommandMenu();
    this.disableTextField();
    if(this.img_to_send_path == "" && this.controller.get('textField').mojo.getValue() == "")
    {
        return this.nullInputUpdate();
    }
	return this.checkInternetConnectionAndUpdate();    
}

/*
 * 发送消息到饭否
 * */

UploadAssistant.prototype.updateStatusToFanfou = function(status){
    if(status == "")
    {
        Mojo.Log.error("Can't update status without input.");
        this.upload_processing = 0;
        // this.controller.get('id_send_status').mojo.deactivate();
        this.enableCommandMenu();
        return false;
    }
    try {
    var libraries = MojoLoader.require({ name: "foundations" , version: "1.0"     });
    //var Future = libraries["foundations"].Control.Future; // Futures library
    var DB = libraries["foundations"].Data.DB;  // db8 wrapper library
    } catch (Error) {
                        Mojo.Log.error(Error);
                        this.upload_processing = 0;
                        // this.controller.get('id_send_status').mojo.deactivate();
                        this.enableCommandMenu();
                        return false;
                    }
    if(DB)
    {
        var fquery = {"from":"com.riderwoo.helloworld:1"};
        // 获取access_token,access_screte
        DB.find(fquery, false, false).then(function(future) {
          var result = future.result;
          if (result.returnValue === true)   
         {
             if(result.results[0].fanfou_access_token != undefined && result.results[0].fanfou_access_secret != undefined )
             {
                 access_token = result.results[0].fanfou_access_token;
                 access_secret = result.results[0].fanfou_access_secret;
                 var accessor = { consumerSecret: consumer_secret
                           , tokenSecret   : access_secret};
                 var message = { method: "POST"
                           , action: "http://api.fanfou.com/statuses/update.json"
                           , parameters: []
                           };
                 message.parameters.push(["status", status]);
                 message.parameters.push(["oauth_consumer_key", consumer_token]);
                 message.parameters.push(["oauth_nonce", OAuth.nonce(11)]);
                 message.parameters.push(["oauth_timestamp", OAuth.timestamp()]);
                 message.parameters.push(["oauth_token", access_token]);
                 OAuth.SignatureMethod.sign(message, accessor);
                 //showText("normalizedParameters", OAuth.SignatureMethod.normalizeParameters(message.parameters));
                 //showText("signatureBaseString" , OAuth.SignatureMethod.getBaseString(message));
                 //showText("signature"           , OAuth.getParameter(message.parameters, "oauth_signature"));
                 //showText("authorizationHeader" , OAuth.getAuthorizationHeader("", message.parameters));
             
                 var headers = {"Authorization":OAuth.getAuthorizationHeader("", message.parameters)};
             
                 var url = message.action;
                 Mojo.Log.info('url: ' + url);
                
                 $.ajax({
                           type: "POST",
                           url: url,
                           headers: headers,
                           data: "status="+status,
                           success: this.cbUpdateStatusSuccess.bind(this),
                           error: this.cbUpdateStatusError.bind(this)
                         });
                 return true;
             }
             else
             {
                 // TODO 重新获取access_token,access_secret
                 Mojo.Log.error("Bug! Failed to get access_token and access_secret.");
                 this.upload_processing = 0;
                 // this.controller.get('id_send_status').mojo.deactivate();
                 this.enableCommandMenu();
                 return false;
             }
          }
          else
          {  
             result = future.exception;
             Mojo.Log.error("find failure: Err code=" + result.errorCode + "Err message=" + result.message);
             this.upload_processing = 0;
             // this.controller.get('id_send_status').mojo.deactivate(); 
             this.enableCommandMenu();
             return false;
          }
        }.bind(this));
    }
    else
    {
        Mojo.Log.error("Failed to get DB8 instance.");
        this.upload_processing = 0;
        // this.controller.get('id_send_status').mojo.deactivate();
        this.enableCommandMenu();
        return false;
    }
}
/*
 * 发送消息成功
 */
UploadAssistant.prototype.cbUpdateStatusSuccess = function(msg, status, jqXHR) {
    this.upload_processing = 0;
    // this.controller.get('id_send_status').mojo.deactivate();
    Mojo.Log.info( "Update status successfully.\nReturn is: "+JSON.stringify(msg)+" textstatus: "+ JSON.stringify(status)+" jqXHR: "+JSON.stringify(jqXHR));
    // 显示“发送成功”提示信息
    Mojo.Controller.getAppController().showBanner("发送成功！",{source: 'notification'});
    // 重新使能输入框
    this.enableTextField();
    // TODO 发送成功，返回List
    // 清空输入框textField
    this.controller.get('textField').mojo.setValue("");
    // 重新使能底栏按钮
    this.enableCommandMenu();
}


/*
 * 发送消息失败
 */
UploadAssistant.prototype.cbUpdateStatusError = function(msg, Status, errorThrown) {
    this.upload_processing = 0;
    // this.controller.get('id_send_status').mojo.deactivate();
    Mojo.Log.error( "Failed to update status.\nReturn is: "+JSON.stringify(msg) +" textstatus: "+ JSON.stringify(status)+" errorThrown: "+ JSON.stringify(errorThrown));
    // this.controller.showAlertDialog({
        // //onChoose: function(value) {this.controller.get("area-to-update").innerText = "Alert result = " + value;},
        // title: $L("发送失败！"),
        // //message: msg.responseText.error,
        // choices:[
             // // {label:$L('Rare'), value:"refresh", type:'affirmative'},  
             // // {label:$L("Medium"), value:"don't refresh"},
             // // {label:$L("Overcooked"), value:"don't refresh", type:'negative'},    
             // {label:$L("返回"), value:"maybe refresh", type:'dismiss'}    
        // ]
        // });
    //this.controller.get('selection').innerHTML = "Failed to update status.\nReturn is: "+JSON.stringify(msg);
    // 显示“发送失败”提示信息    
    Mojo.Controller.getAppController().showBanner("发送失败！",{source: 'notification'});
    // 重新使能输入框
    this.enableTextField();
    // 重新使能底栏按钮
    this.enableCommandMenu();
}
/*
 * 上传图片失败
 */
UploadAssistant.prototype.cbUploadPICError = function(e) {
    Mojo.Log.error("Upload failure, results="+JSON.stringify(e));
    //this.controller.get('selection').innerHTML = "Upload failure, results="+JSON.stringify(e);
    this.upload_processing = 0;
    // this.controller.get('id_send_status').mojo.deactivate();
    //Mojo.Log.error( "Failed to update status.\nReturn is: "+JSON.stringify(msg) );
    // this.controller.showAlertDialog({
       // //onChoose: function(value) {this.controller.get("area-to-update").innerText = "Alert result = " + value;},
    // title: $L("发送失败！"),
    // //message: $L("发送成功！"),
    // choices:[
        // // {label:$L('Rare'), value:"refresh", type:'affirmative'},  
        // // {label:$L("Medium"), value:"don't refresh"},
        // // {label:$L("Overcooked"), value:"don't refresh", type:'negative'},    
        // {label:$L("返回"), value:"maybe refresh", type:'dismiss'}    
    // ]
    // });
    // 重新使能输入框
    this.enableTextField();
    // 显示“发送失败”提示信息    
    Mojo.Controller.getAppController().showBanner("发送失败！",{source: 'notification'});
    // 重新使能底栏按钮
    this.enableCommandMenu();
}
/*
 * 上传图片成功
 */
UploadAssistant.prototype.cbUploadPICSuccess = function(e) {
    Mojo.Log.error("Upload processing, results="+JSON.stringify(e)); 
    //this.controller.get('selection').innerHTML = "Upload success, results="+JSON.stringify(e);
    // 检查HTTP状态码，只有200上传成功时才发送提示消息
    if(e.httpCode == 200)
    {
        this.upload_processing = 0;
        // this.controller.get('id_send_status').mojo.deactivate(); 
        //Mojo.Log.info( "Upload pic successfully.\nReturn is: "+JSON.stringify(e) );
        
        // 显示“发送失败”提示信息
        Mojo.Controller.getAppController().showBanner("发送成功！",{source: 'notification'});
        // TODO 发送成功，返回List   
        // 清空输入框
        this.controller.get('textField').mojo.setValue("");
        // 重新使能输入框
        this.enableTextField();
        // 清除图片信息
        this.img_to_send_path = ""; 
        // 重新使能底栏按钮
        this.enableCommandMenu();
    }
}
/*
 * 上传图片到饭否
 * */
UploadAssistant.prototype.uploadPicToFanfou = function(file_path, status)
{
    if(file_path == "")
    {
        Mojo.Log.error("Can't upload without file path.");
        this.upload_processing = 0;
        // this.controller.get('id_send_status').mojo.deactivate();
        this.enableCommandMenu();
        return false;
    }
    try {
    var libraries = MojoLoader.require({ name: "foundations" , version: "1.0"     });
    //var Future = libraries["foundations"].Control.Future; // Futures library
    var DB = libraries["foundations"].Data.DB;  // db8 wrapper library
    } catch (Error) {
                        Mojo.Log.error(Error);
                        this.upload_processing = 0;
                        // this.controller.get('id_send_status').mojo.deactivate();
                        this.enableCommandMenu();
                        return false;
                    }
    if(DB)
    {
        var fquery = {"from":"com.riderwoo.helloworld:1"};
        // 获取access_token,access_screte
        DB.find(fquery, false, false).then(function(future) {
          var result = future.result;
          if (result.returnValue === true)   
         {
             if(result.results[0].fanfou_access_token != undefined && result.results[0].fanfou_access_secret != undefined )
             {
                 access_token = result.results[0].fanfou_access_token;
                 Mojo.Log.error("access_token: "+access_token);
                 access_secret = result.results[0].fanfou_access_secret;
                 Mojo.Log.error("access_secret: "+access_secret);
                 var accessor = { consumerSecret: consumer_secret
                        , tokenSecret   : access_secret};
                var message = { method: "POST"
                          , action: "http://api.fanfou.com/photos/upload.json"
                          , parameters: []
                          };
            
                message.parameters.push(["oauth_consumer_key", consumer_token]);
                message.parameters.push(["oauth_nonce", OAuth.nonce(11)]);
                message.parameters.push(["oauth_timestamp", OAuth.timestamp()]);
                Mojo.Log.error("before push into parameters access_token: "+access_token);
                message.parameters.push(["oauth_token", access_token]);
                OAuth.SignatureMethod.sign(message, accessor);
                Mojo.Log.error("Our base string is: "+OAuth.SignatureMethod.getBaseString(message));
                //showText("normalizedParameters", OAuth.SignatureMethod.normalizeParameters(message.parameters));
                //showText("signatureBaseString" , OAuth.SignatureMethod.getBaseString(message));
                //showText("signature"           , OAuth.getParameter(message.parameters, "oauth_signature"));
                //showText("authorizationHeader" , OAuth.getAuthorizationHeader("", message.parameters));
            
                var headers = {"Authorization":OAuth.getAuthorizationHeader("", message.parameters)};
                Mojo.Log.error('Authorization: ' + headers.Authorization);
            
                var url = message.action;
                Mojo.Log.info('url: ' + url);
                
                // 调用WebOS的DownloadManager上传文件
                var download_manager_obj = new Mojo.Service.Request('palm://com.palm.downloadmanager/', {
                    method: "upload",
                    parameters: {
                        "fileName": file_path,
                        "fileLabel":"photo",
                        "url": url,
                        //"contentType": "image/jpg",
                        "postParameters": [
                            {"key" : "status", "data" : status, "contentType" : "text/plain"},
                            ],
                         "subscribe": true ,
                         "customHttpHeaders": ["Authorization: "+headers.Authorization],
                      },
                      onSuccess : this.cbUploadPICSuccess.bind(this),
                      onFailure : this.cbUploadPICError.bind(this)
                });
             }
             else
             {
                 // TODO 重新获取access_token,access_secret
                 Mojo.Log.error("Bug! Failed to get access_token and access_secret.");
                 this.upload_processing = 0;
                 // this.controller.get('id_send_status').mojo.deactivate();
                 this.enableCommandMenu();
                 return false;
             }
         }
          else
          {  
             result = future.exception;
             Mojo.Log.error("find failure: Err code=" + result.errorCode + "Err message=" + result.message); 
             this.upload_processing = 0;
             // this.controller.get('id_send_status').mojo.deactivate();
             this.enableCommandMenu();
             return false;
          }
        }.bind(this));
    }
    else
    {
        Mojo.Log.error("Failed to get DB8 instance.");
        this.upload_processing = 0;
        // this.controller.get('id_send_status').mojo.deactivate();
        this.enableCommandMenu();
        return false;
    }
}
UploadAssistant.prototype.setup = function() {
    // Set up a few models so we can test setting the widget model:
    //Mojo.Log.error("Enter upload scene");
    this.upload_processing = 0;
    this.img_to_send_path = "";
    /* 初始化用户名输入框 */
    var attributes = {
                hintText: '',
                textFieldName:  'name', 
                modelProperty:      'original', 
                multiline:      true,
                disabledProperty: 'disabled',
                autoFocus:          true, 
                modifierState:  Mojo.Widget.capsLock,
                //autoResize:   automatically grow or shrink the textbox horizontally,
                //autoResizeMax:    how large horizontally it can get
                //enterSubmits: when used in conjunction with multline, if this is set, then enter will submit rather than newline
                limitResize:    false, 
                holdToEnable:  false, 
                focusMode:      Mojo.Widget.focusInsertMode,
                changeOnKeyPress: true,
                textReplacement: false,
                requiresEnterKey: false
    };
    if(this.launchParams.status != undefined)
    {
        this.textModel = {
            'original' : this.launchParams.status,
            disabled: false
        };
    }
    else
    {
        this.textModel = {
            'original' : "",
            disabled: false
        };
    }
    this.controller.setupWidget('textField', attributes, this.textModel);
    
    // 设置提示标题
    this.controller.get("id_title").innerText = "你在做什么？";
    // 设置标题栏
    this.controller.get("id_main_hdr").innerText = "更新状态";
    // 初始化发送按钮和添加图片按钮
    this.commandMenuModel = {
        items:  [
            { label: 'button_attach', command: 'cmd_attach', icon: 'attach' },
            { label: 'button_send', command: 'cmd_send',icon: 'send' }
        ]
    };
	this.controller.setupWidget(Mojo.Menu.commandMenu, undefined, this.commandMenuModel);
	// this.controller.setupWidget('large-activity-spinner', 
	   // {
            // fps: 14,
            // frameHeight: 26,
            // startFrameCount: 7,
            // mainFrameCount: 10
        // }, 
        // { spinning: true }
    // );
    // TODO 进入更新状态页面时需要检查当前的Internet连接状态
    // this.checkInternetConnection();
}

UploadAssistant.prototype.checkInternetConnectionAndUpdate= function() {
		this.controller.serviceRequest('palm://com.palm.connectionmanager', {
		     method: 'getstatus',
		     parameters: {},
		     onSuccess : function (e){ 
			     	Mojo.Log.error("getStatus success, results="+JSON.stringify(e)); 
			     	if(e.wifi.state == "connected" || e.wan.state == "connected")
			     	{
			     		this.upload_processing = 1;
					    if(this.img_to_send_path == "")
					    {
					        // TODO 告诉用户先选择照片
					        return this.updateStatusToFanfou(this.controller.get('textField').mojo.getValue());
					    }
					    // 调用uploadPicToFanfou上传照片
					    return this.uploadPicToFanfou(this.img_to_send_path, this.controller.get('textField').mojo.getValue());
			     	}
			     	else
			     	{
			     		this.controller.showAlertDialog({
					        // onChoose: function(value) {
					        	// // 停在当前页面
					        	// this.controller.stageController.getAppController().closeAllStages();
					        	// }.bind(this),
					        title: $L("没有网络连接！"),
					        //message: msg.responseText.error,
					        choices:[
					             // {label:$L('Rare'), value:"refresh", type:'affirmative'},  
					             // {label:$L("Medium"), value:"don't refresh"},
					             // {label:$L("Overcooked"), value:"don't refresh", type:'negative'},    
					             {label:$L("返回"), value:"maybe refresh", type:'dismiss'}    
					        ]
		    			});
			     	}
		     	}.bind(this),
		     onFailure : function (e){
		     	Mojo.Log.error("getStatus failed, results="+JSON.stringify(e)); 
		     	this.controller.showAlertDialog({
					        onChoose: function(value) {
					        	this.controller.stageController.getAppController().closeAllStages();
					        	}.bind(this),
				        title: $L("系统异常！"),
				        //message: msg.responseText.error,
				        choices:[
				             // {label:$L('Rare'), value:"refresh", type:'affirmative'},  
				             // {label:$L("Medium"), value:"don't refresh"},
				             // {label:$L("Overcooked"), value:"don't refresh", type:'negative'},    
				             {label:$L("返回"), value:"maybe refresh", type:'dismiss'}    
				        ]
	    			});
				}.bind(this)
		});
}

UploadAssistant.prototype.checkInternetConnection= function() {
		this.controller.serviceRequest('palm://com.palm.connectionmanager', {
		     method: 'getstatus',
		     parameters: {},
		     onSuccess : function (e){ 
			     	Mojo.Log.error("getStatus success, results="+JSON.stringify(e)); 
			     	if(e.wifi.state == "connected" || e.wan.state == "connected")
			     	{
			     		// Nothing important here.
			     		Mojo.Log.info("We have a connection");
			     	}
			     	else
			     	{
			     		this.controller.showAlertDialog({
					        // onChoose: function(value) {
					        	// TODO 返回List列表页面
					        	// this.controller.stageController.getAppController().closeAllStages();
					        	// }.bind(this),
					        title: $L("没有网络连接！"),
					        //message: msg.responseText.error,
					        choices:[
					             // {label:$L('Rare'), value:"refresh", type:'affirmative'},  
					             // {label:$L("Medium"), value:"don't refresh"},
					             // {label:$L("Overcooked"), value:"don't refresh", type:'negative'},    
					             {label:$L("返回"), value:"maybe refresh", type:'dismiss'}    
					        ]
		    			});
			     	}
		     	}.bind(this),
		     onFailure : function (e){
		     	Mojo.Log.error("getStatus failed, results="+JSON.stringify(e)); 
		     	this.controller.showAlertDialog({
					        onChoose: function(value) {
					        	this.controller.stageController.getAppController().closeAllStages();
					        	}.bind(this),
				        title: $L("系统异常！"),
				        //message: msg.responseText.error,
				        choices:[
				             // {label:$L('Rare'), value:"refresh", type:'affirmative'},  
				             // {label:$L("Medium"), value:"don't refresh"},
				             // {label:$L("Overcooked"), value:"don't refresh", type:'negative'},    
				             {label:$L("返回"), value:"maybe refresh", type:'dismiss'}    
				        ]
	    			});
				}.bind(this)
		});
}

UploadAssistant.prototype.handleCommand = function(event) {
	if(event.type == Mojo.Event.command) {
		switch(event.command)
		{
			case 'cmd_attach':
				//this.controller.get('message').innerText = ('menu button 1 pressed')
				Mojo.Log.info("cmd_attach");
				this.eBTNSelect();
			break;
			case 'cmd_send':
				//this.controller.get('message').innerText = ('menu button 2 pressed')Mojo.Log.error("cmd-1");
				Mojo.Log.info("cmd_send");
				this.eBTNSend();
			break;
			default:
				//Mojo.Controller.errorDialog("Got command " + event.command);
				Mojo.Log.error("default");
			break;
		}
	}
}
UploadAssistant.prototype.activate = function(event) {
    /* put in event handlers here that should only be in effect when this scene is active. For
       example, key handlers that are observing the document */
};

UploadAssistant.prototype.deactivate = function(event) {
    /* remove any event handlers you added in activate and do any other cleanup that should happen before
       this scene is popped or another scene is pushed on top */
};

UploadAssistant.prototype.cleanup = function(event) {
    /* this function should do any cleanup needed before the scene is destroyed as 
       a result of being popped off the scene stack */
      // Mojo.Event.stopListening(this.controller.get('id_select_img'),Mojo.Event.tap, this.eBTNSelect.bind(this));
      // Mojo.Event.stopListening(this.controller.get('id_select_img'),Mojo.Event.tap, this.eBTNSend.bind(this));
};