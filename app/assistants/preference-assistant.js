function PreferenceAssistant() {
    /* this is the creator function for your scene assistant object. It will be passed all the 
       additional parameters (after the scene name) that were passed to pushScene. The reference
       to the scene controller (this.controller) has not be established yet, so any initialization
       that needs the scene controller should be done in the setup function below. */
}

PreferenceAssistant.prototype.setup = function() {
    // 初始化列表控件
    this.controller.setupWidget('id_account_list', 
                                {
                                    listTemplate : 'preference/list-container',
                                    itemTemplate : 'preference/item-template'
                                }, 
                                this.listModel = {items:[
                                    {item_name: "注销"}
                                ]}); 
    this.controller.listen(this.controller.get("id_account_list"), Mojo.Event.listTap, this.handleListTap.bind(this));
}

PreferenceAssistant.prototype.activate = function(event) {
    /* put in event handlers here that should only be in effect when this scene is active. For
       example, key handlers that are observing the document */
};

PreferenceAssistant.prototype.handleListTap = function(event) {
    /* put in event handlers here that should only be in effect when this scene is active. For
       example, key handlers that are observing the document */
    Mojo.Log.info("List tap: "+JSON.stringify(event.item));
    switch(event.item.item_name)
    {
        case "注销":
            this.controller.showAlertDialog({
                        onChoose: function(value) {
                                if(value == "ok")
                                {
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
                                        Mojo.Log.info("Now try to delete all account informations.");
                                        var q = {"from":"com.riderwoo.helloworld:1"};
                                        DB.del(q).then(function(future){
                                            // 删除帐号成功后，进入auth scene
                                            this.controller.stageController.swapScene("auth");
                                        }.bind(this));
                                    }
                                }
                            }.bind(this),
                    title: $L("确定注销？"),
                    //message: msg.responseText.error,
                    choices:[
                         // {label:$L('Rare'), value:"refresh", type:'affirmative'},  
                         // {label:$L("Medium"), value:"don't refresh"},
                         {label:$L("确定"), value:"ok", type:''},    
                         {label:$L("返回"), value:"cacel", type:''}    
                    ]
                });
            // try {
                // var libraries = MojoLoader.require({ name: "foundations" , version: "1.0"     });
                // //var Future = libraries["foundations"].Control.Future; // Futures library
                // var DB = libraries["foundations"].Data.DB;  // db8 wrapper library
            // } catch (Error) {
                // Mojo.Log.error(Error);
                // return false;
            // }
            // if(DB)
            // {
                // Mojo.Log.info("Now try to delete all account informations.");
                // var q = {"from":"com.riderwoo.helloworld:1"};
                // DB.del(q).then(function(future){
                    // // 删除帐号成功后，进入auth scene
                    // this.controller.stageController.swapScene("auth");
                // }.bind(this));
            // }
        break;
        default:
        break;
    }
};


PreferenceAssistant.prototype.deactivate = function(event) {
    /* remove any event handlers you added in activate and do any other cleanup that should happen before
       this scene is popped or another scene is pushed on top */
};

PreferenceAssistant.prototype.cleanup = function(event) {
    /* this function should do any cleanup needed before the scene is destroyed as 
       a result of being popped off the scene stack */
    Mojo.Event.stopListening(this.controller.get('id_account_list'),Mojo.Event.tap, this.handleListTap.bind(this));
};