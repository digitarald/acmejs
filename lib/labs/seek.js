'use strict';

var Registry = require('./registry');
var Component = require('./component');
var Vec2 = require('../math/vec2');

function Seek() {}

Seek.prototype.attributes = {
  targets: null,
  sight: 100
};

Seek.prototype.create = function(attributes) {
  this.targets = attributes.targets;
  this.sight = attributes.sight;
  this.instances = Registry.types[this.targets];
};

var impulse = Vec2();

Seek.prototype.fixedUpdate = function(dt) {
  Vec2.set(impulse);
  var instances = this.instances;
  for (var i = 0, l = instances.length; i < l; i++) {
    var target = instances[i];
    if (!target.enabled) {
      continue;
    }

    // TODO: Code!
    // http://rocketmandevelopment.com/2010/06/11/steering-behaviors-seeking/
  }

  this.body.applyForce(impulse);
};

new Component('seek', Seek);

module.exports = Seek;
