var Cloud = require('mocha-cloud');
var fs = require('fs');
var auth = fs.readFileSync('.auth', 'ascii').trim().split(':');

var cloud = new Cloud('mgame-js', auth[0], auth[1]);
cloud.browser('chrome');
cloud.browser('ipad', '6.0', 'Mac 10.8');
cloud.url('http://testno.de/mgame-js/test/index.html');

cloud.on('init', function(browser){
  console.log(' init : %s %s', browser.browserName, browser.version);
});

cloud.on('start', function(browser){
  console.log(' start : %s %s', browser.browserName, browser.version);
});

cloud.on('end', function(browser, res){
  console.log(' end : %s %s : %d failures', browser.browserName, browser.version, res.failures);
});

cloud.start();