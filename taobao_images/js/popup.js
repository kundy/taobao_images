

(function(){



init();


function init(){

 	$('.btn-download').click(function(){
 		msg_background("TASK_START",function(data){

		});
 	});
 	
 }


//与background通信
function msg_background(_cmd,_cb){

	chrome.runtime.sendMessage(_cmd, function(response){
	    _cb(response);
	});
}







})();












