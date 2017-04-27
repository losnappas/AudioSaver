var ui = require('./ui');
var sniff = require("./sniff");
var conf = require('./conf');
console.error('index.js');

require("sdk/simple-prefs").on("TargetDir", function() {
  ui.updateUI();
});

if (!conf.getPath()) {
  conf.set("Enabled", false);
}

if (conf.get("Enabled"))
  sniff.start();

ui.updateUI();

// var self = require("sdk/self");
// var prefService = require("sdk/preferences/service");
// prefService.set('extensions.' + self.id + '.sdk.console.logLevel', 'all');
