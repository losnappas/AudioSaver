let {
  Cc,
  Ci
} = require('chrome');
console.error('file.js');
var system = require("sdk/system");
var conf = require('./conf');


exports.BinaryFile = BinaryFile;


function BinaryFile(url, contentType) {
  console.log(url, ' ' , contentType);
  this.stream = null;
  this.url = url;
  var dir = conf.get("TargetDir");
  this.rndname = Math.random().toString(36).substring(2);

  this.tmpfilename = setSeparator(dir + "/" + this.rndname + ".tmp");

  this.contentType = contentType;
}



BinaryFile.prototype = {
  create: function() {
    try {
      var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
      file.initWithPath(this.tmpfilename);
      if (file.exists() == false){
        file.create(Ci.nsIFile.NORMAL_FILE_TYPE, 420);
      }
      var foStream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
      foStream.init(file, 0x02 | 0x08 | 0x20, 0o666, 0);
      this.stream = foStream;
      return true;
    } catch (err) {
      console.log("AUDIOSAVER Error create file:", err);
      return false;
    }
  },
  write: function(data, count) {
    console.error('write');
    try {
      if (this.stream) {
        this.stream.write(data, count);
      } else {
         console.log("AUDIOSAVER Error file not created");
      }
    } catch (err) {
       console.log("AUDIOSAVER Error write file:",err);
    }
  },

  close: function() {
    console.error('close');
    if (this.stream) {
      this.stream.close();
      this.stream = null;
      //Copy file
      if (getExt(this.url).length > 4) {
        //error extension and file name
        let date = new Date();
        let dateString = date.toLocaleDateString();

        function addZero(thing){
          return (thing < 10 ? '0'+thing : thing);
        }
        
        let hours = addZero(date.getHours());
        let mins = addZero(date.getMinutes());
        let secs = addZero(date.getSeconds());

        this.filename = /*md5(this.tmpfilename)*/ dateString + ' - ' + hours + 'h' + mins + 'm' + 
          secs + getExtCT(this.contentType);
      } else {
        this.filename = getBase(this.url);
      }

      var rootDir = conf.get("TargetDir");
      var subDir = getDir(this.url);
      var dir = setSeparator(rootDir + "/" + subDir);
      mkdir(dir);
      moveFile(this.tmpfilename, dir, this.filename);
      console.error('endClose');
    }
  }
}

function setSeparator(fileName) {
  if (system.platform.toLowerCase() == "winnt") {
    var tmp = fileName;

    tmp = tmp.split("/").join("\\");
    return tmp;
  }
  return fileName;
}

function getBase(url) {
  console.error('getBase');
  return url.split('\\').pop().split('/').pop();
}

function getExt(name) {
  var re = /(?:\.([^.]+))?$/;
  return re.exec(name)[1];
}

function getDir(uri) {
  var regxp = new RegExp("https?://(?:.+\\.)(.+\\..+?)/", "i");
  if (regxp.test(uri)) {
    return regxp.exec(uri)[1];
  }
  return "";
}

function getExtCT(cntType) {
  console.log(cntType);
  switch (cntType.toLowerCase()) {
    case "audio/basic":
      return ".wav";
    case "audio/mp4":
      return ".mp4";
    case "audio/mpeg":
      return ".mp3";
    case "audio/ogg":
      return ".ogg";
    case "audio/vorbis":
      return ".ogg";
    case "audio/x-ms-wma":
      return ".wma";
    case "audio/x-ms-wax":
      return ".wma";
    case "audio/vnd.rn-realaudio":
      return ".ra";
    case "audio/vnd.wave":
      return ".wav";
    case "audio/webm":
      return ".mkv";
    default:
      {
        var regxp = new RegExp("audio/(.+)", "ig");
        if (regxp.test(cntType))
          return regxp.exec(cntType)[1];
      }
      return "";
  }
}

function mkdir(dir) {
  var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
  filePath = dir;
  file.initWithPath(setSeparator(filePath));
  if (file.exists() == false)
    try {
      file.create(Ci.nsIFile.DIRECTORY_TYPE, 0o775);
    } catch (err) {
      console.log("AUDIOSAVER Error mkdir", err);
    }
  return file;
}

/*function md5(fname) {
  var path = fname;
  var f = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
  f.initWithPath(setSeparator(path));
  var istream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
  istream.init(f, 0x01, 0o444, 0);
  var ch = Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);
  ch.init(ch.MD5);
  const PR_UINT32_MAX = 0xffffffff;
  ch.updateFromStream(istream, PR_UINT32_MAX);
  var hash = ch.finish(false);
  istream.close();

  function toHexString(charCode) {
    return ("0" + charCode.toString(16)).slice(-2);
  }
  var s = Array.from(hash, (c, i) => toHexString(hash.charCodeAt(i))).join("");
  return "1337"+s;
}*/

function move(from, toDir, filename) {
  var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
  file.initWithPath(setSeparator(from));
  if (file.exists()) {
    try {
      file.moveTo(toDir, filename);
    } catch (err) {
      console.log("AUDIOSAVER ", err);
    }
  }
}

function moveFile(sourcefile, destdir, destfile) {
  // get a component for the file to copy
  var aFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
  if (!aFile) return false;
  // get a component for the directory to copy to
  var aDir = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
  if (!aDir) return false;
  // next, assign URLs to the file components
  aFile.initWithPath(sourcefile);
  aDir.initWithPath(destdir);
  // finally, copy the file, without renaming it
  aFile.moveTo(aDir, destfile);
}

