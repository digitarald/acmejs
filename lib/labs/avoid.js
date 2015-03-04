'use strict';

var Registry = require('./registry');
var Component = require('./component');
var Vec2 = require('../math/vec2');

function Avoid() {}

Avoid.prototype.attributes = {
  targets: null,
  sight: 100
};

Avoid.prototype.create = function(attributes) {
  this.targets = attributes.targets;
  this.sight = attributes.sight;
  this.instances = Registry.types[this.targets];
};

var impulse = Vec2();

Avoid.prototype.fixedUpdate = function(dt) {
  Vec2.set(impulse);
  var targets = this.instances;
  for (var i = 0, l = targets.length; i < l; i++) {
    var target = targets[i];
    if (!target.enabled) {
      continue;
    }

    // TODO: Code!
    // http://rocketmandevelopment.com/2010/07/13/
    //   steering-behaviors-obstacle-avoidance/
    // http://my.safaribooksonline.com/book/programming/
    //   game-programming/0596005555/flocking/ch04_sect1_003
  }

  this.body.applyForce(impulse);
};

new Component('avoid', Avoid);

module.exports = Avoid;
