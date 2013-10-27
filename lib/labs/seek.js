'use strict';

var Component = require('./component');
var Vec2 = require('./math').Vec2;

function Seek() {}

Seek.prototype.attributes = {
  targets: null,
  sight: 100
};

Seek.prototype.create = function(attributes) {
  this.targets = attributes.targets;
  this.sight = attributes.sight;
  this.heap = Pool.byType[this.targets];
};

var impulse = Vec2();

Seek.prototype.fixedUpdate = function(dt) {
  Vec2.set(impulse);
  var heap = this.heap;
  for (var i = 0, l = heap.length; i < l; i++) {
    var target = heap[i];
    if (!target.enabled) {
      continue;
    }

    // TODO: Code!
    // http://rocketmandevelopment.com/2010/06/11/steering-behaviors-seeking/
  }

  this.kinetic.applyForce(impulse);
};

new Component('seek', Seek);

module.exports = Seek;
