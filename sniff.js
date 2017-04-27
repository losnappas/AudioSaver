console.error('sniff.js');
var events = require("sdk/system/events");
var {
    Ci,
    Cc
} = require("chrome");
var file = require("./file");

var allChunks = [];
var type = null;
var name = null;

//exports functions
exports.start = start;
exports.stop = stop;

function start() {
    events.on("http-on-examine-response", listener);
    tabs.on('ready', function(tab){
      console.log(tab.url + ' is ready!');
    });
}

function stop() {
    events.off("http-on-examine-response", listener);
    console.error("TYPE: ",type);
    console.error("LENGTH: ",allChunks.length);
    
    wrapFile();
}

function wrapFile() {
    if (allChunks.length > 0) {
        let file1 = new file.BinaryFile(name, type);


        file1.create();
        for (index = 0; index < allChunks.length; ++index) {
            file1.write(allChunks[index], allChunks[index].length);
        }
        //TODO optimize
        file1.close();

        //only works like dis
        allChunks = 0;
        allChunks = [];
        // console.error("DELETED!2: ", allChunks);
        /*console.log("tabs tab ready off on");
        tabs.off('ready', function(tab) {
            console.log(tab.url + ' is done!');
            console.log(tab.url.getElementsByTagName("audio")[0].buffered.end(0));
        });*/
    }
}


function listener(event) {
    console.log("event");
    var httpChannel = event.subject.QueryInterface(Ci.nsIHttpChannel);
    try {
        if (httpChannel && (httpChannel.responseStatus !== 200 && httpChannel.responseStatus !== 206 && httpChannel.responseStatus !== 304)) {
            return;
        }
        var channel = event.subject.QueryInterface(Ci.nsITraceableChannel);
        var newListener = new TracingListener();
        newListener.originalListener = channel.setNewListener(newListener);
    } catch (err) {
        console.log("AUDIOSAVER Error set listner:", err)
    }
}


function TracingListener() {
    this.originalListener = null;
    //this.receivedChunks = [];
}

TracingListener.prototype = {
    onDataAvailable: function(aRequest, aContext, aInputStream, aOffset, aCount) {
        console.error("onDataAvailable");
        try {
            if (aRequest.contentType && aRequest.contentType.indexOf("audio") !== -1 
                && /* this is because of "audio/mpegurl" which is playlist type */ aRequest.contentType.indexOf("url") == -1 ) {
                var iStream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
                var sStream = Cc["@mozilla.org/storagestream;1"].createInstance(Ci.nsIStorageStream);
                var oStream = Cc["@mozilla.org/binaryoutputstream;1"].createInstance(Ci.nsIBinaryOutputStream);
                iStream.setInputStream(aInputStream);
                sStream.init(8192, aCount, null);
                oStream.setOutputStream(sStream.getOutputStream(0));

                var data = iStream.readBytes(aCount);
                // this.receivedChunks.push(data);
                console.log("key123 Data type: ", aRequest.contentType);
                console.log("key123 Data length: ", data.length);
                console.log("key123 allChunks length: ", allChunks.length);
                allChunks.push(data);
                console.log("allChunks length2: ", allChunks.length);
                oStream.writeBytes(data, aCount);
                this.originalListener.onDataAvailable(aRequest, aContext, sStream.newInputStream(0), aOffset, aCount);
                return;
            }
        } catch (err) {
            console.error("TracingListener.onDataAvailable error: ", err);
        }
        this.originalListener.onDataAvailable(aRequest, aContext, aInputStream, aOffset, aCount);
    },
    onStartRequest: function(aRequest, context) {
        console.log("onStartRequest");
            
        this.originalListener.onStartRequest(aRequest, context);
        if (aRequest.contentType.indexOf("audio") !== -1 && aRequest.contentType.indexOf("url") == -1){
            type = aRequest.contentType;
            name = aRequest.name;
            console.log("start:", aRequest.name)
        }

    },
    onStopRequest: function(aRequest, context, statusCode) {
        this.originalListener.onStopRequest(aRequest, context, statusCode);
        // if (aRequest.contentType.indexOf("audio") !== -1)
            console.log("stop:", aRequest.name);
            //console.log("length: ",this.receivedChunks.length);
            console.log("type: ",aRequest.contentType);
            console.log("indexOf: ",aRequest.contentType.indexOf("audio"));

        //if you forget the addon on? let's make lots of smaller files instead of one megahuge one
/*        if (allChunks.length > 50) {
            wrapFile();
        }*/

        /*if (this.receivedChunks.length > 0 && aRequest.contentType && aRequest.contentType.indexOf("audio") != -1 && aRequest.contentType.indexOf("url") == -1) {
              console.log("fe ", this.file);

            if (this.file == null){
                            this.file = new file.BinaryFile(aRequest.name, aRequest.contentType);
                    }
            console.log("fe2 ", this.file);
            this.file.create();
            for (index = 0; index < this.receivedChunks.length; ++index) {
                this.file.write(this.receivedChunks[index], this.receivedChunks[index].length);
            }

            //TODO optimize
            this.file.close(); //-------------------------------------------

                      delete this.receivedChunks;

        }*/
    }
}
