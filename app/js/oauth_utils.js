function getAccessParams(username, password)
{
	var accessor = { consumerSecret: "aed509928807eab4f1a615e4d422c724"
	           , tokenSecret   : ""};
	var message = { method: "GET"
	          , action: "http://fanfou.com/oauth/access_token"
	          , parameters: []
	          };
	message.parameters.push(["x_auth_username", username]);
	message.parameters.push(["x_auth_password", password]);
	message.parameters.push(["x_auth_mode", "client_auth"]);
	message.parameters.push(["oauth_consumer_key", "60648e4719285ec6fb437785e655bda5"]);
	message.parameters.push(["oauth_nonce", OAuth.nonce(11)]);
	message.parameters.push(["oauth_timestamp", OAuth.timestamp()]);
	OAuth.SignatureMethod.sign(message, accessor);
	//showText("normalizedParameters", OAuth.SignatureMethod.normalizeParameters(message.parameters));
	//showText("signatureBaseString" , OAuth.SignatureMethod.getBaseString(message));
	//showText("signature"           , OAuth.getParameter(message.parameters, "oauth_signature"));
	//showText("authorizationHeader" , OAuth.getAuthorizationHeader("", message.parameters));
	
	var libraries = MojoLoader.require({ name: "foundations", version: "1.0" });
	var Future = libraries["foundations"].Control.Future;
	var AjaxCall = libraries["foundations"].Comms.AjaxCall;
	var headers = {"Authorization":OAuth.getAuthorizationHeader("", message.parameters)};
	Mojo.Log.info('Authorization: ' + headers.Authorization);
	var options = {"headers":headers};
	//var future1 = AjaxCall.get("http://fanfou.com/oauth/access_token", options);
	/*future1.then(function(future)
	{
		if (future.result.status == 200)  // 200 = Success
		Mojo.Log.info('Ajax get success ' + JSON.stringify(future.result));
		else Mojo.Log.info('Ajax head fail');
	});*/
	
	$.ajax({
			  type: "GET",
			  url: "http://fanfou.com/oauth/access_token",
			  headers: headers
			}).done(function( msg ) {
			  Mojo.Log.info('Ajax get success ' + msg);
			});
	
	return false;
}