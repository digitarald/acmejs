// Generated by CoffeeScript 1.6.1
var core, key;

core = require('../lib/core');

core.cloud = require('./client');

for (key in core) {
  if (!window[key]) {
    window[key] = core[key];
  }
  window['m' + key] = core[key];
}