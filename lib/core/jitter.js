'use strict';

var Component = require('./component');
var Pool = require('./pool');
var Vec2 = require('./math').Vec2;
var Random = require('./math-random');

function Jitter() {}

Jitter.prototype = {

  attributes: {
    factor: 0.1,
    force: 250
  },

  create: function(attributes) {
    this.factor = attributes.factor;
    this.force = attributes.force;
  },

  fixedUpdate: function(dt) {
    if (Random.chance(this.factor)) {
      Vec2.variant(Vec2.zero, this.force, force);
      this.kinetic.applyForce(force);
    }
  }

};

var force = Vec2();

new Component('jitter', Jitter);

module.exports = Jitter;
