function AuthAssistant(arg) {
    /* this is the creator function for your scene assistant object. It will be passed all the 
       additional parameters (after the scene name) that were passed to pushScene. The reference
       to the scene controller (this.controller) has not be established yet, so any initialization
       that needs the scene controller should be done in the setup function below. */
       this.launchParams = arg;
}
var consumer_token = "60648e4719285ec6fb437785e655bda5";
var consumer_secret = "aed509928807eab4f1a615e4d422c724";
AuthAssistant.prototype.getAccessParams = function(username, password)
{
    // 首先删除数据库中的用户名和密码，如果有的话.
    try {
        var libraries = MojoLoader.require({ name: "foundations" , version: "1.0"     });
        //var Future = libraries["foundations"].Control.Future; // Futures library
        var DB = libraries["foundations"].Data.DB;  // db8 wrapper library
    } catch (Error) {
        Mojo.Log.error(Error);
        upload_processing = 0;
        this.controller.get('id-auth-button').mojo.deactivate();
        return false;
    }
    if(DB)
    {
        Mojo.Log.info("Succeed to load DB8");
        // var q = {"from":"com.riderwoo.helloworld:1"};
        // DB.del(q);
        DB.delKind("com.riderwoo.helloworld:1").then(function(future){
            var accessor = { consumerSecret: consumer_secret
                       , tokenSecret   : ""};
            var message = { method: "GET"
                      , action: "http://fanfou.com/oauth/access_token"
                      , parameters: []
                      };
            message.parameters.push(["x_auth_username", username]);
            message.parameters.push(["x_auth_password", password]);
            message.parameters.push(["x_auth_mode", "client_auth"]);
            message.parameters.push(["oauth_consumer_key", consumer_token]);
            message.parameters.push(["oauth_nonce", OAuth.nonce(11)]);
            message.parameters.push(["oauth_timestamp", OAuth.timestamp()]);
            OAuth.SignatureMethod.sign(message, accessor);
            //showText("normalizedParameters", OAuth.SignatureMethod.normalizeParameters(message.parameters));
            //showText("signatureBaseString" , OAuth.SignatureMethod.getBaseString(message));
            //showText("signature"           , OAuth.getParameter(message.parameters, "oauth_signature"));
            //showText("authorizationHeader" , OAuth.getAuthorizationHeader("", message.parameters));
        
            var headers = {"Authorization":OAuth.getAuthorizationHeader("", message.parameters)};
            Mojo.Log.error('Authorization: ' + headers.Authorization);
        
            var url = message.action;
            Mojo.Log.info('url: ' + url);
            
            $.ajax({
                      type: "GET",
                      url: url,
                      headers: headers,
                      success: this.cbGetAccessParamsSuccess.bind(this),
                      error: this.cbGetAccessParamsError.bind(this)
                    });
            return true;
        }.bind(this));
    }
    else
    {  
        Mojo.Log.error("Failed to get DB.");
        upload_processing = 0;
        this.controller.get('id-auth-button').mojo.deactivate();
        return false; 
    }
}


AuthAssistant.prototype.cbGetAccessParamsSuccess = function(msg) {
    upload_processing = 0;
    this.controller.get('id-auth-button').mojo.deactivate();
    Mojo.Log.error( "Auth user successfully.\nReturn is: "+JSON.stringify(msg) );
    
    // 将获取的用户名和密码保存在数据库中
    try {
        var libraries = MojoLoader.require({ name: "foundations" , version: "1.0"     });
        //var Future = libraries["foundations"].Control.Future; // Futures library
        var DB = libraries["foundations"].Data.DB;  // db8 wrapper library
    } catch (Error) {
        Mojo.Log.error(Error);
        return false;
    }
    if(DB)
    {
        /* 向输入库中插入用户名密码类,并在创建成功后，检查用户名和密码 */
        var indexes = [{"name":"fanfou_username", 
                        "props":[
                                  //{"name":"fanfou_username"},
                                  //{"name":"fanfou_password"},
                                  {"name":"fanfou_access_token"},
                                  {"name":"fanfou_access_secret"}]
                      }];
        DB.putKind("com.riderwoo.helloworld:1", "com.riderwoo.helloworld", indexes).then(function(future){
            Mojo.Log.error("Succeeded to putkind");
            var result = future.result;
            if (result.returnValue === true)   
            {
                /* 向输入库中插入用户名密码对象,并在创建成功后 */
                // !!特别注意！！这里插入的是对象的数组！！
                var new_user = [{
                        _kind:"com.riderwoo.helloworld:1",
                        //fanfou_username: this.controller.get('textField').mojo.getValue(),
                        //fanfou_password: this.controller.get('passwordField').mojo.getValue(),
                        fanfou_access_token: msg.split("&")[0].split("=")[1],
                        fanfou_access_secret:msg.split("&")[1].split("=")[1]}];
                Mojo.Log.error( "fanfou_access_token: "+new_user.fanfou_access_token+" fanfou_access_secret: "+new_user.fanfou_access_secret );
                                
                DB.put(new_user).then(function(future) {
                    var result = future.result;
                    if (result.returnValue === true)   
                    {
                        // TODO 跳转到main
                        Mojo.Log.error("Succeeded to save user info.");
                        this.controller.stageController.swapScene("upload", this.launchParams);
                        return true;
                    }
                    else
                    {
                        // 保存失败，弹出提示！
                        Mojo.Log.error("Failed to save user info.");
                        this.controller.showAlertDialog({
                        //onChoose: function(value) {this.controller.get("area-to-update").innerText = "Alert result = " + value;},
                        //title: $L(""),
                        message: $L("程序内部错误！"),
                        choices:[
                             // {label:$L('Rare'), value:"refresh", type:'affirmative'},  
                             // {label:$L("Medium"), value:"don't refresh"},
                             // {label:$L("Overcooked"), value:"don't refresh", type:'negative'},    
                             {label:$L("返回"), value:"maybe refresh", type:'dismiss'}    
                            ]
                        });
                        return false;
                    }
                }.bind(this));
            }
            else
            {
                // 保存失败，弹出提示！
                Mojo.Log.error("Failed to putkind user class.");
                this.controller.showAlertDialog({
                //onChoose: function(value) {this.controller.get("area-to-update").innerText = "Alert result = " + value;},
                //title: $L(""),
                message: $L("程序内部错误！"),
                choices:[
                     // {label:$L('Rare'), value:"refresh", type:'affirmative'},  
                     // {label:$L("Medium"), value:"don't refresh"},
                     // {label:$L("Overcooked"), value:"don't refresh", type:'negative'},    
                     {label:$L("返回"), value:"maybe refresh", type:'dismiss'}    
                    ]
                });
                return false;
            }
        }.bind(this));
        
    }
    else
    {  
        Mojo.Log.error("Failed to get DB.");
        return false; 
    }
    
}


/*
 * Called by Prototype when the request fails.
 */
AuthAssistant.prototype.cbGetAccessParamsError = function(msg) {
    upload_processing = 0;
    this.controller.get('id-auth-button').mojo.deactivate();
    Mojo.Log.error( "Failed to auth user.");
    this.controller.showAlertDialog({
        //onChoose: function(value) {this.controller.get("area-to-update").innerText = "Alert result = " + value;},
        //title: $L(""),
        message: $L("用户名或密码无效！"),
        choices:[
             // {label:$L('Rare'), value:"refresh", type:'affirmative'},  
             // {label:$L("Medium"), value:"don't refresh"},
             // {label:$L("Overcooked"), value:"don't refresh", type:'negative'},    
             {label:$L("返回"), value:"maybe refresh", type:'dismiss'}    
        ]
        });
}


// 在这个函数中弹出提示，告诉用户当前没有填入用户名和密码
AuthAssistant.prototype.nullInputUpdate = function(){
    Mojo.Log.error("NULL input.");
    upload_processing = 0;
    this.controller.get('id-auth-button').mojo.deactivate();
    this.controller.showAlertDialog({
        //onChoose: function(value) {this.controller.get("area-to-update").innerText = "Alert result = " + value;},
        //title: $L("出错！"),
        message: $L("请先填入用户名和密码！"),
        choices:[
             // {label:$L('Rare'), value:"refresh", type:'affirmative'},  
             // {label:$L("Medium"), value:"don't refresh"},
             // {label:$L("Overcooked"), value:"don't refresh", type:'negative'},    
             {label:$L("返回"), value:"maybe refresh", type:'dismiss'}    
        ]
        });
    return false;
}

var auth_processing = 0;
AuthAssistant.prototype.authBTNTaped = function() {
    Mojo.Log.error("Auth button tapped.");
    auth_processing = 1;
    if(this.controller.get('textField').mojo.getValue() == "" || this.controller.get('passwordField').mojo.getValue() == "")
    {
        return this.nullInputUpdate();
    }
    return this.getAccessParams(this.controller.get('textField').mojo.getValue(), this.controller.get('passwordField').mojo.getValue());
    
}
AuthAssistant.prototype.setup = function() {
    /* setup widgets here */
    /* 初始化设置登录按钮 */
    auth_processing = 1;
    this.controller.setupWidget("id-auth-button",
        this.attributes = {
            type: Mojo.Widget.activityButton
        },
        this.model = {
            label : "登录",
            disabled: false
        }
    );
    Mojo.Event.listen(this.controller.get('id-auth-button'),Mojo.Event.tap, this.authBTNTaped.bind(this));
    
    /* 初始化用户名输入框 */
    var attributes = {
                hintText: '输入用户名',
                textFieldName:  'name', 
                modelProperty:      'original', 
                multiline:      false,
                disabledProperty: 'disabled',
                focus:          true, 
                modifierState:  Mojo.Widget.capsLock,
                //autoResize:   automatically grow or shrink the textbox horizontally,
                //autoResizeMax:    how large horizontally it can get
                //enterSubmits: when used in conjunction with multline, if this is set, then enter will submit rather than newline
                limitResize:    false, 
                holdToEnable:  false, 
                focusMode:      Mojo.Widget.focusSelectMode,
                changeOnKeyPress: true,
                textReplacement: false,
                maxLength: 30,
                requiresEnterKey: false
    };
    this.model = {
        'original' : '',
        disabled: false
    };

    this.controller.setupWidget('textField', attributes, this.model);
    /* 初始化密码输入框 */
    var attributes = {
        hintText: '输入密码',
        textFieldName:  'passwordField',
        modelProperty: 'original',
        label: 'password'
    };
    this.model = {
        'original' : ''
    };
    this.controller.setupWidget('passwordField', attributes, this.model);
};

AuthAssistant.prototype.activate = function(event) {
    /* put in event handlers here that should only be in effect when this scene is active. For
       example, key handlers that are observing the document */
};

AuthAssistant.prototype.deactivate = function(event) {
    /* remove any event handlers you added in activate and do any other cleanup that should happen before
       this scene is popped or another scene is pushed on top */
};

AuthAssistant.prototype.cleanup = function(event) {
    /* this function should do any cleanup needed before the scene is destroyed as 
       a result of being popped off the scene stack */
      Mojo.Event.stopListening(this.controller.get('id-auth-button'),Mojo.Event.tap, this.authBTNTaped.bind(this));
};