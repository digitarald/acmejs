'use strict';

var Registry = require('./registry');
var Component = require('./component');
var Vec2 = require('../math/vec2');

function Wander() {}

Wander.prototype.attributes = {
  targets: null,
  sight: 100
};

Wander.prototype.create = function(attributes) {
  this.targets = attributes.targets;
  this.sight = attributes.sight;
  this.instances = Registry.types[this.targets];
};

Wander.prototype.fixedUpdate = function(dt) {
  Vec2.set(impulse);

  var instances = this.instances;
  for (var i = 0, l = instances.length; i < l; i++) {
    var target = instances[i];
    if (!target.enabled) {
      continue;
    }

    // TODO: Code!
    // http://gamedev.tutsplus.com/tutorials/implementation/
    // understanding-steering-behaviors-wander/
    // http://wiki.unity3d.com/index.php/Wander#JavaScript_Version_Wander.js
    // http://rocketmandevelopment.com/2010/06/16/steering-behaviors-wander/
  }

  this.body.applyForce(impulse);
};

var impulse = Vec2();

new Component('wander', Wander);

module.exports = Wander;
