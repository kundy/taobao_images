


(function(){

$(document).ready(function(){
    console.log("[background.js init]");
    
    
});



function task_start(){
    chrome.tabs.executeScript(null,{file: "content_script.js"});
}



function download_image_list(list){
    ZipFile.create();
    Download.init(list,30);
}


/*消息处理
*****************************************************************/

//接收content-script消息 
chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
        if(request.IMG_LIST){
            download_image_list(request.IMG_LIST);
        }
    }
);


//与popup通信
function msg_popup(_cmd,_cb){
    chrome.runtime.sendMessage(_cmd, function(response){
        //_cb(response);
    });
}

//接收popup消息
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
    if(message == 'TASK_START'){
        task_start();
        sendResponse("");
    }
});













 // BEGIN: UTILITY FUNCTIONS
var Download =function(){ }
var IMAGE_LIST=[];//下载文件列表 //[ 0文件url，1是否已下载，2文件重名标记，3文件base64数据对象，4文件名，5文件类型，6文件大小]

Download.init=function(filelist,timeout)
{
    IMAGE_LIST = filelist;
    console.log(IMAGE_LIST)
    if(IMAGE_LIST.length==0){
        return;//IMAGE_LIST为空时直接退出
    }

    for(var i=0;i<IMAGE_LIST.length;i++){
        Download.start(i,timeout);
    }
}

Download.start=function(i,timeout)
{

    var blobURL = IMAGE_LIST[i][0];
    var xhr = new XMLHttpRequest();    
    xhr.open("get", blobURL, true);
    xhr.responseType = "blob";
    xhr.timeout = timeout*1000;
    // xhr.setRequestHeader("User-Agent","Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)");


    xhr.onload = function() {
        if (xhr.status == 200 ) {
            var blobFile = xhr.response;
            if(blobFile.size>0){
                // console.log("Download success i:"+ i +　" blobURL:" +blobURL);
                var reader = new FileReader();
                reader.onload = function(event){
                    IMAGE_LIST[i][3] = event.target.result;
                    IMAGE_LIST[i][1]=1;
                    IMAGE_LIST[i][2]=blobFile.size;
                    Download.checkFinish()
                }; 
                var source = reader.readAsDataURL(blobFile);
            }
            else{
                // console.warn("Download.size:0 i:"+ i +　" blobURL:" +blobURL);
                Download.fail(i);    
            }
        }
        else{
            // console.warn("Download.fail i:"+ i +　" blobURL:" +blobURL);
            Download.fail(i);
        }
    }
    xhr.ontimeout  = function(event){
        // console.warn("Download.timeout i:"+ i +　" blobURL:" +blobURL);
        Download.fail(i);
　　}
    xhr.onerror = function(e) {
        // console.warn("Download.error i:"+ i +　" blobURL:" +blobURL);
        Download.fail(i);
      };
    xhr.send();
}


 //文件下载失败
Download.fail=function(i){
    IMAGE_LIST[i][1]=2;
    Download.checkFinish();
}


//检查所有文件是否下载完成
Download.checkFinish=function(){
    var fileDownloadFinish = 0;
    var fileDownloadFail = 0;
    for(var i=0;i<IMAGE_LIST.length;i++){
        if(IMAGE_LIST[i][1]==1)fileDownloadFinish++;
        if(IMAGE_LIST[i][1]==2)fileDownloadFail++;
    }
    
    //下载完了所有文件，打印看一下
    if(fileDownloadFinish+fileDownloadFail == IMAGE_LIST.length){
        ZipFile.getType();
    }
}

//文件下载完成
Download.finish=function(){
    Download.checkFinish();
}




var ZipFile = {}
var global_zipWriter;
var zipName = "image.zip";//下载包名称


//获取文件的真实类型
ZipFile.getType = function(){
    for(var i=0;i<IMAGE_LIST.length;i++){
        var fileNameData =getFileName(IMAGE_LIST[i][0]);
        IMAGE_LIST[i][5]=decodeURIComponent(fileNameData.name);
        var fileContentType = getContentType(IMAGE_LIST[i][3]);
        if(fileContentType!="")
            IMAGE_LIST[i][6]=fileContentType;
        else
            IMAGE_LIST[i][6]=fileNameData.type;

    }
    ZipFile.add(0);
}
ZipFile.create = function(){
    if(!global_zipWriter){
        zip.createWriter(new zip.BlobWriter(), function(zipWriter) {
                global_zipWriter = zipWriter;
        }, onerror);
    }
}


ZipFile.add = function(i){
    if(i<IMAGE_LIST.length){
        if(IMAGE_LIST[i][1]==1){
            // var fileName = fileNameDuplicateRemove(IMAGE_LIST[i][0],IMAGE_LIST[i][4]+"."+IMAGE_LIST[i][5]);
            var fileName = i+"."+IMAGE_LIST[i][6];
            if(IMAGE_LIST[i][4]==1){
                fileName="content/"+fileName; 
            }
            else if(IMAGE_LIST[i][4]==2){
                fileName="thumb/"+fileName; 
            }
            else if(IMAGE_LIST[i][4]==3){
                fileName="prop/"+fileName; 
            }
            
            global_zipWriter.add(fileName, new zip.Data64URIReader(IMAGE_LIST[i][3]), function() {
                ZipFile.add(i+1);
            });
        }
        else{
            ZipFile.add(i+1);
        }
    }
    else{
        ZipFile.save();
    }
}


//保存zip并下载
ZipFile.save = function(){
    // alert("save")
    
    var downloadButton = document.getElementById("btnDownload");
    global_zipWriter.close(function(blob) {
        var blobURL = URL.createObjectURL(blob);

        var clickEvent = document.createEvent("MouseEvent");
        clickEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        downloadButton.href = blobURL;
        console.log(zipName);
        downloadButton.download = zipName;
        downloadButton.dispatchEvent(clickEvent);

        global_zipWriter = null;
    });
}









//根据base64数据得到文件类型，
function getContentType(baseData){
    //判断blobType
    for(var i=0;i<typeData.length;i++){
        for(var j=0;j<typeData[i].prefix.length;j++){
             if(baseData.indexOf("data:"+typeData[i].prefix[j])==0 ){
                return typeData[i].type;
            }
        }
    }

    return "";
}

//根据url获取文件名、类型
function getFileName(url){
    var fullname = url;
    fullname=urlFilterProtol(fullname);
    if(fullname.indexOf('?')>0)fullname=fullname.substring(0,fullname.indexOf('?'));//先去除?后面的参数
    

    fullname = fullname.substring(fullname.lastIndexOf('/')+1);//只取最后/后面的名称
    var fileName=fullname;
    var fileType = "";
    if( fullname.lastIndexOf('.') >0){
        fileName=fullname.substring(0,fullname.lastIndexOf('.'));
        fileType = fullname.substring(fullname.lastIndexOf('.')+1);
    }


    //对于可统译类型的文件，添加后缀html
    return {fullname:fullname,name:fileName,type:fileType};
}

//去除协议头，及最后的斜杠
function urlFilterProtol(url)
{
    if(url.indexOf('?')>0)url=url.substring(0,url.indexOf('?'));//先去除?后面的参数
    url = url.replace("http://","").replace("https://","").replace("file:///","").replace("file://","");
    if(url.lastIndexOf("/")==url.length-1)url=url.substring(0,url.length-1);
    return url;
}

function onerror(message) {
    console.error(message);
}




var typeData = [

    //图片类
    {type:"jpg",prefix:["image/jpg","image/jpeg",]},
    {type:"png",prefix:["image/png"]},
    {type:"gif",prefix:["image/gif"]},
    {type:"bmp",prefix:["image/bmp"]},
    {type:"tiff",prefix:["image/tiff"]},
    {type:"webp",prefix:["image/webp"]},

    //js
    {type:"js",prefix:["text/javascript","application/javascript","application/x-javascript"]},
    {type:"json",prefix:["application/json"]},
    
    //css
    {type:"css",prefix:["text/css"]},

    //audio video

    //font
    {type:"woff",prefix:["application/x-font-woff"]},
    {type:"ttf",prefix:["application/x-font-ttf"]},
    {type:"svg",prefix:["image/svg+xml"]},

    //页面
    {type:"html",prefix:["text/htm","text/html"]},
    {type:"xml",prefix:["text/xml"]},
    {type:"txt",prefix:["text/plain"]}
]


//根据base64数据得到文件类型，
function getContentType(baseData){
    //判断blobType
    for(var i=0;i<typeData.length;i++){
        for(var j=0;j<typeData[i].prefix.length;j++){
             if(baseData.indexOf("data:"+typeData[i].prefix[j])==0 ){
                return typeData[i].type;
            }
        }
    }

    return "";
}


})()



