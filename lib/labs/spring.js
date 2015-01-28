'use strict';

var Component = require('./component');
var Vec2 = require('../math/vec2');

// http://www.openprocessing.org/sketch/7522
// https://gist.github.com/mikolalysenko/5580867

function Spring() {}

Spring.prototype = {

  // attributes: {
  // },

  create: function(attributes) {
  },

  fixedUpdate: function(dt) {
    // http://www.openprocessing.org/sketch/7505
    /*
    float d = PVector.dist(position,p.position);
    // natural separation: 100 units
    // force on a spring: F=kx
    // x = displacement from equilibrium position
    float x = d - 100.0;
    // apply force *along* the spring:
    PVector dir = PVector.sub(p.position,position);
    dir.normalize();
    // F=ma should apply:
    // here we adjust the velocity according to the current force
    dir.mult(x/1000.0);
    velocity.add(dir);
    // bounce of the sides:
    bounce();
    // friction: dampen any movement:
    velocity.mult(0.999);
     */
  }

};

new Component('spring', Spring);

module.exports = Spring;
