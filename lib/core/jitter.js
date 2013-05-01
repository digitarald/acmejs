'use strict';

var Component = require('./component');
var Pool = require('./pool');
var Vec2 = require('./math').Vec2;

var cache = Vec2();

function Jitter() {}

Jitter.prototype = Object.create(Component.prototype);

Jitter.prototype.tag = 'jitter';

Jitter.prototype.attributes = {
  factor: 0.2,
  force: 300
};

Jitter.prototype.create = function(attributes) {
  this.factor = attributes.factor;
  this.force = attributes.force;
};

Jitter.prototype.fixedUpdate = function(dt) {
  if (Math.chance(this.factor)) {
    this.entity.kinetic.applyImpulse(Vec2.set(
      cache,
      Math.rand(-this.force, this.force), Math.rand(-this.force, this.force)
    ));
  }
};

new Pool(Jitter);

module.exports = Jitter;
