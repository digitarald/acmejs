'use strict';

var core = require('../lib/core');

core.cloud = require('./client');

for (var key in core) {
  if (!window[key]) {
    window[key] = core[key];
  }
  window['m' + key] = core[key];
}
