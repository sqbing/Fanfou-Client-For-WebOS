function FirstAssistant(arg) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	   this.launchParams = arg;
	   // Mojo.Log.error("arg: "+JSON.stringify(arg));
}




FirstAssistant.prototype.cbParsePutKind = function(future) {
    var result = future.result;
    if (result.returnValue === true)                   
        Mojo.Log.info("Authorization putKind success");
        /* 查询数据库，是否已经认证过用户名和密码 */
        var fquery = {"from":"com.riderwoo.helloworld:1"};
        var libraries = MojoLoader.require({ name: "foundations" , version: "1.0"     });
        var DB = libraries["foundations"].Data.DB;
        DB.find(fquery, false, false).then(function(future)
        {
             var result = future.result;
             if (result.returnValue === true)   
             {
                Mojo.Log.info("find success, results="+JSON.stringify(result.results));
                if(result.results == "" || 
                    result.results[0].fanfou_access_token == undefined || 
                    result.results[0].fanfou_access_secret == undefined)
                {
                    // 如果没在数据库中找到用户名密码，就进入first-scene,开始xauth认证
                    this.controller.stageController.swapScene("auth", this.launchParams);
                    return true;
                }
                else
                {
                    // TODO　已经获取了access_token,access_secret,进入main-scene
                    // FirstAssistant.prototype.uploadPicToFanfou("/media/internal/DCIM/100PALM/CIMG0001.jpg","");
                    // this.controller.stageController.swapScene("main");
                    this.controller.stageController.swapScene("upload", this.launchParams);
                    // this.controller.stageController.swapScene("auth");
                    return true;
                }
             }
             else
             {  
                 // TODO DB8打开失败，退出程序
                 result = future.exception;
                 Mojo.Log.error("find failure: Err code=" + result.errorCode + "Err message=" + result.message); 
                 return true;
             }
        }.bind(this));
    return true;
}

/* 检查用户是否已经通过认证 */
FirstAssistant.prototype.checkAccessExist = function() {
    /* 检查当前应用是否已经认证过用户 */
    /* Try to get DB library.*/
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
        Mojo.Log.info("Succeed to load DB8");
        // var q = {"from":"com.riderwoo.helloworld:1"};
        // DB.del(q);

        /* 向数据库中插入用户名密码类,并在创建成功后，检查用户名和密码 */
        var indexes = [{"name":"fanfou_username", 
                        "props":[
                                  //{"name":"fanfou_username"},
                                  //{"name":"fanfou_password"},
                                  {"name":"fanfou_access_token"},
                                  {"name":"fanfou_access_secret"}]
                      }];
        DB.putKind("com.riderwoo.helloworld:1", "com.riderwoo.helloworld", indexes).then(this.cbParsePutKind.bind(this));
    }
}


FirstAssistant.prototype.checkInternetConnection= function() {
		this.controller.serviceRequest('palm://com.palm.connectionmanager', {
		     method: 'getstatus',
		     parameters: {},
		     onSuccess : function (e){ 
			     	// Mojo.Log.error("getStatus success, results="+JSON.stringify(e)); 
			     	if(e.wifi.state == "connected" || e.wan.state == "connected")
			     	{
			     		this.checkAccessExist();
			     	}
			     	else
			     	{
			     		this.controller.showAlertDialog({
					        onChoose: function(value) {
					        	// this.controller.stageController.getAppController().closeAllStages();
					        	this.checkAccessExist();
					        	}.bind(this),
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

/* 初始化UI、检查用户是否认证 */
FirstAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed */
	
	//set up the spinner widget
	this.spinnerLAttrs = {
        spinnerSize: Mojo.Widget.spinnerLarge,
        modelProperty: 'spinning'
    }
    this.spinnerModel = {
        spinning: true
    }
    this.controller.setupWidget('large-activity-spinner', this.spinnerLAttrs, this.spinnerModel);
    
    //this.checkAccessExist();
};

FirstAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	  this.checkInternetConnection();
};

FirstAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

FirstAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};

