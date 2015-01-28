'use strict';

var Component = require('./component');
var Pool = require('./pool');
var Vec2 = require('../math/vec2');
var Random = require('../math/random');

function Jitter() {
  Component.call(this);
  this.factor = 0.0;
  this.force = 0.0;
}

Jitter.prototype = Object.create(Component.prototype);

Jitter.prototype.type = 'jitter';

Jitter.prototype.attributes = {
  factor: 0.1,
  force: 250
};

var force = Vec2();

Jitter.prototype.fixedUpdate = function(dt) {
  if (Random.chance(this.factor)) {
    Vec2.variant(Vec2.zero, this.force, force);
    this.components.kinetic.applyForce(force);
  }
};

Jitter.prototype.pool = new Pool(Jitter);

module.exports = Jitter;
