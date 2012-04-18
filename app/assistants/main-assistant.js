function MainAssistant() {
    /* this is the creator function for your scene assistant object. It will be passed all the 
       additional parameters (after the scene name) that were passed to pushScene. The reference
       to the scene controller (this.controller) has not be established yet, so any initialization
       that needs the scene controller should be done in the setup function below. */
}

MainAssistant.prototype.setup = function() {
    // 初始化列表控件
    this.controller.setupWidget('id_main_list', 
                                {
                                    listTemplate : 'main/list-container',
                                    itemTemplate : 'main/item-template'
                                }, 
                                this.listModel); 
    // 初始化发送按钮和添加刷新按钮
    this.controller.setupWidget(Mojo.Menu.commandMenu, undefined, 
        this.commandMenuModel = {
        items:  [
            { label: 'button_upload', command: 'cmd_upload', icon: 'new' },
            { label: 'button_refresh', command: 'cmd_refresh',icon: 'refresh' }
        ]
    });
}

MainAssistant.prototype.activate = function(event) {
    /* put in event handlers here that should only be in effect when this scene is active. For
       example, key handlers that are observing the document */
    // 检查当前的网络连接状态，若能够联网，则尝试下载最新的timeline
    this.checkInternetConnection();
};

MainAssistant.prototype.deactivate = function(event) {
    /* remove any event handlers you added in activate and do any other cleanup that should happen before
       this scene is popped or another scene is pushed on top */
};

MainAssistant.prototype.cleanup = function(event) {
    /* this function should do any cleanup needed before the scene is destroyed as 
       a result of being popped off the scene stack */
};

/* 更新timeline */
MainAssistant.prototype.UpdateTimeline = function() {
    Mojo.Log.error("Trying to update timeline");
    try {
    var libraries = MojoLoader.require({ name: "foundations" , version: "1.0"     });
    //var Future = libraries["foundations"].Control.Future; // Futures library
    var DB = libraries["foundations"].Data.DB;  // db8 wrapper library
    } 
    catch(Error)
    {
        Mojo.Log.error(Error);
        return false;
    }
    if(DB)
    {
        var fquery = {"from":"com.riderwoo.helloworld:1"};
        // 获取access_token,access_screte
        DB.find(fquery, false, false).then(function(future) 
        {
            var result = future.result;
            if (result.returnValue === true)   
            {
                if(result.results[0].fanfou_access_token != undefined && result.results[0].fanfou_access_secret != undefined )
                {
                    // 保存用户名和密码，备用
                    access_token = result.results[0].fanfou_access_token;
                    access_secret = result.results[0].fanfou_access_secret;
                    var accessor = { consumerSecret: consumer_secret,
                                     tokenSecret   : access_secret};
                    var message = { method: "GET",
                                    action: "http://api.fanfou.com/statuses/home_timeline.json",
                                    parameters: []
                                  };
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
                           type: "GET",
                           url: url,
                           headers: headers,
                           success: this.cbUpdateTimelineSuccess.bind(this),
                           error: this.cbUpdateTimelineError.bind(this)
                          });
                    return true;
                }
                else
                {
                    // TODO 重新获取access_token,access_secret
                    Mojo.Log.error("Bug! Failed to get access_token and access_secret.");
                    return false;
                }
            }
            else
            {  
               result = future.exception;
               Mojo.Log.error("find failure: Err code=" + result.errorCode + "Err message=" + result.message);
               return false;
            }   
        }.bind(this));
    }
    else
    {
        Mojo.Log.error("Failed to get DB8 instance.");
        return false;
    }
};

/* 列表更新回调函数，成功 */
MainAssistant.prototype.cbUpdateTimelineSuccess = function(msg, status, jqXHR) {
    Mojo.Log.error("Success to get timeline. Content: "+JSON.stringify(msg));
    this.listModel.items = [];
    for(var i in msg)
    {
        if(msg[i].user != undefined)
        {
            if(msg[i].user.name != undefined && msg[i].text != undefined)
            {
                this.listModel.items.push({"name":msg[i].user.name, "text":msg[i].text});
                //Mojo.Log.error("name: "+msg[i].user.name+"text: "+msg[i].text);
            }
        }
    }
    this.controller.modelChanged(this.listModel);
    
};
/* 列表更新回调函数，失败 */
MainAssistant.prototype.cbUpdateTimelineError = function(msg, status, jqXHR) {
    Mojo.Log.error("Failed to get timeline. Content: "+JSON.stringify(msg));

};

/* 读取缓存的timeline内容，并填充列表 */
MainAssistant.prototype.UpdateTimelineWithCache = function() {
    Mojo.Log.error("Trying to update timeline by cache.");
};

/* 检查网络连接状态，若有网络连接，尝试更新列表;若无网络连接，从数据库中读取缓存的timeline内容。 */
MainAssistant.prototype.checkInternetConnection = function() {
        this.controller.serviceRequest('palm://com.palm.connectionmanager', {
             method: 'getstatus',
             parameters: {},
             onSuccess : function (e){ 
                    // Mojo.Log.error("getStatus success, results="+JSON.stringify(e)); 
                    if(e.wifi.state == "connected" || e.wan.state == "connected")
                    {
                        // 有网络连接，尝试更新列表
                        this.UpdateTimeline();
                    }
                    else
                    {
                        // 无网络连接，从数据库中读取缓存的timeline内容
                        this.UpdateTimelineWithCache();
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

MainAssistant.prototype.listModel = { items: []};


var consumer_token = "60648e4719285ec6fb437785e655bda5";
var consumer_secret = "aed509928807eab4f1a615e4d422c724";
var access_token = "";              
var access_secret = "";