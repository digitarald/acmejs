'use strict';

var Component = require('./component');
var Vec2 = require('../math/vec2');

// http://www.openprocessing.org/sketch/7522
// https://gist.github.com/mikolalysenko/5580867

function Attraction() {
  this.delta = Vec2();
}

Attraction.prototype = {

  attributes: {
    radius: 100,
    force: 100,
    target: null,
    targets: null
  },

  create: function(attributes) {
    this.radius = attributes.radius;
    this.force = attributes.force;
    this.target = attributes.target;
    this.targets = attributes.targets;
    Vec2.set(this.delta);
  },

  fixedUpdate: function(dt) {
    Vec2.sub(this.target.transform.position, this.transform.position);
    var distSq = Vec2.lenSq(this.delta);
    if (distSq < this.radius * this.radius && distSq > Math.EPSILON) {
      // this.delta.norm().scale(1.0 - distSq / this.radiusSq);
      // return p.acc.add(this.delta.scale(this.force));
    }
  }

};

new Component('attraction', Attraction);

module.exports = Attraction;
