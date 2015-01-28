'use strict';

var Pool = require('./pool');
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
  this.heap = Pool.byType[this.targets];
};

Wander.prototype.fixedUpdate = function(dt) {
  Vec2.set(impulse);

  var heap = this.heap;
  for (var i = 0, l = heap.length; i < l; i++) {
    var target = heap[i];
    if (!target.enabled) {
      continue;
    }

    // TODO: Code!
    // http://gamedev.tutsplus.com/tutorials/implementation/
    // understanding-steering-behaviors-wander/
    // http://wiki.unity3d.com/index.php/Wander#JavaScript_Version_Wander.js
    // http://rocketmandevelopment.com/2010/06/16/steering-behaviors-wander/
  }

  this.kinetic.applyForce(impulse);
};

var impulse = Vec2();

new Component('wander', Wander);

module.exports = Wander;
