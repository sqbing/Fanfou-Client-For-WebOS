function AppAssistant(appController) {
    //AppAssistant.prototype.appController = appController;
    //this.AppDB = new AppDBAssistant(appController);
    //AppAssistant.prototype.AppDB = this.AppDB;
}
 
AppAssistant.prototype = {
  cleanup: function() {
    //blah blah
  },
  handleLaunch: function(launchParams){
    /*
     * Display the splash scene while we get the databases organized  
     * and figure out what launched us
     */
        var f = function(stageController) {
            stageController.pushScene('first',launchParams)
        };
        Mojo.Controller.appController.createStageWithCallback({name: 'mainStage', lightweight: true}, f);
        // Mojo.Log.error("before check internet connect");
        // this.checkInternetConnection();
        
   }//,
    // checkInternetConnection: function() {
		// this.controller.serviceRequest('palm://com.palm.connectionmanager', {
		     // method: 'getstatus',
		     // parameters: {},
		     // onSuccess : function (e){ 
		     	// Mojo.Log.error("getStatus success, results="+JSON.stringify(e)); 
		     	// if(e.wifi.state == "connected" || e.wan.state == "connected")
		     	// {
		     		// var f = function(stageController) {
		            	// stageController.pushScene('first',launchParams)
			        // };
			        // Mojo.Controller.appController.createStageWithCallback({name: 'mainStage', lightweight: true}, f);
		     	// }
		     	// else
		     	// {
		     		// this.controller.showAlertDialog({
				        // onChoose: function(value) {this.controller.closeAllStages()}.bind(this),
				        // title: $L("没有网络连接！"),
				        // //message: msg.responseText.error,
				        // choices:[
				             // // {label:$L('Rare'), value:"refresh", type:'affirmative'},  
				             // // {label:$L("Medium"), value:"don't refresh"},
				             // // {label:$L("Overcooked"), value:"don't refresh", type:'negative'},    
				             // {label:$L("返回"), value:"maybe refresh", type:'dismiss'}    
				        // ]
	    			// });
		     	// }
		     	// }.bind(this),
		     // onFailure : function (e){
		     	// Mojo.Log.error("getStatus failed, results="+JSON.stringify(e)); 
		     	// this.controller.showAlertDialog({
				        // //onChoose: function(value) {this.controller.getAppController().closeAllStages()}.bind(this),
				        // title: $L("系统异常！"),
				        // //message: msg.responseText.error,
				        // choices:[
				             // // {label:$L('Rare'), value:"refresh", type:'affirmative'},  
				             // // {label:$L("Medium"), value:"don't refresh"},
				             // // {label:$L("Overcooked"), value:"don't refresh", type:'negative'},    
				             // {label:$L("返回"), value:"maybe refresh", type:'dismiss'}    
				        // ]
	    			// });
				// }.bind(this)
			// });
	// }
  
}

