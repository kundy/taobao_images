

(function(){


console.log("[CONTENT-SCRIPT] START url:"+location.href);

var img_list = [];

var content_img = document.querySelectorAll(".J_DetailSection .content img")
for(var i =0;i<content_img.length;i++){
	var img_src = content_img[i].src;
	if(img_src.indexOf("http")!=0){
		img_src = "https://"+img_src;
	}
	img_list.push([img_src,0,0,"",1])
}

var thumb_img = document.querySelectorAll("#J_UlThumb li a img");
for(var i =0;i<thumb_img.length;i++){
	var img_src = string_replace(thumb_img[i].src);
	if(img_src.indexOf("http")!=0){
		img_src = "https://"+img_src;
	}
	img_list.push([img_src,0,0,"",2])
}


//"url("//img.alicdn.com/bao/uploaded/i1/2456453005/TB26nYfpXXXXXXgXFXXXXXXXXXX_!!2456453005.jpg_40x40q90.jpg") 50% 50% no-repeat"
var prop_img = document.querySelectorAll(".J_TSaleProp li a")
for(var i =0;i<prop_img.length;i++){
	var background_string = prop_img[i].style.background;
	if(background_string!=""){
		var background_data = background_string.match(/url\(\"(.*?)\"/);
		if(background_data.length>0){
			var img_src = string_replace(background_data[1]);
			if(img_src.indexOf("http")!=0){
				img_src = "https://"+img_src;
			}
			img_list.push([img_src,0,0,"",3])
		}
	}
}

post_msg(img_list);


function string_replace(str){
	str = str.replace("_.webp","")
	str = str.replace("q90.jpg",".jpg")
	str = str.replace("_30x30.jpg","")
	str = str.replace("_40x40.jpg","")
	str = str.replace("_50x50.jpg","")
	str = str.replace("_60x60.jpg","")
	str = str.replace("_70x70.jpg","")
	str = str.replace("_80x80.jpg","")
	str = str.replace("_90x90.jpg","")
	str = str.replace("_100x100.jpg","")
	str = str.replace("_430x430.jpg","")

	return str
}




function post_msg(msg){
	chrome.extension.sendRequest({IMG_LIST: msg}, function(response) {
	  	//console.log(response.farewell);
	});

}








})()






