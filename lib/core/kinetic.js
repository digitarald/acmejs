'use strict';

var Component = require('./component');
var Pool = require('./pool');
var Vec2 = require('./math').Vec2;

var cache = Vec2();
var copyVel = Vec2();

function Kinetic() {
  this.velocity = Vec2();
  this.force = Vec2();
  this.continuous = Vec2();
}

Kinetic.gravity = null;

Kinetic.prototype = {

  attributes: {
    mass: 1,
    drag: 0.999,
    friction: 15,
    fixed: false,
    maxVelocity: 75,
    maxForce: 2000,
    force: Vec2(),
    continuous: Vec2(),
    velocity: Vec2(),
    sleepVelocity: 1,
    fast: false
  },

  create: function(attributes) {
    this.mass = attributes.mass;
    this.drag = attributes.drag;
    this.friction = attributes.friction;
    this.fixed = attributes.fixed;
    this.maxVelocity = attributes.maxVelocity;
    this.maxForce = attributes.maxForce;
    this.fast = attributes.fast;
    this.sleepVelocity = attributes.sleepVelocity;
    Vec2.copy(this.velocity, attributes.velocity);
    Vec2.copy(this.force, attributes.force);
    Vec2.copy(this.continuous, attributes.continuous);
    this.sleeping = false;
  },

  applyImpulse: function(impulse) {
    Vec2.add(
      this.force,
      (this.mass !== 1) ?
        Vec2.scal(impulse, 1 / (this.mass || 1), cache) :
        impulse
    );
  },

  applyForce: function(force) {
    Vec2.add(this.continuous, force);
  }

};

Kinetic.simulate = function(dt) {
  var epsilon = Math.epsilon;
  var register = this.register;
  for (var i = 0, l = register.length; i < l; i++) {
    var kinetic = register[i];
    if (!kinetic.enabled || kinetic.fixed) {
      continue;
    }
    var velocity = kinetic.velocity;
    var force = Vec2.add(kinetic.force, kinetic.continuous);

    // Particle
    if (kinetic.fast) {
      if (kinetic.maxForce) {
        Vec2.limit(force, kinetic.maxForce);
      }
      Vec2.add(velocity, Vec2.scal(force, dt));
      Vec2.set(force);
      if (kinetic.maxVelocity) {
        Vec2.limit(velocity, kinetic.maxVelocity);
      }
      Vec2.add(kinetic.transform.pos, Vec2.scal(velocity, dt, cache));
      continue;
    }

    // Apply scene gravity
    var gravity = kinetic.root.gravity;
    if (gravity && kinetic.mass > epsilon) {
      debugger;
      Vec2.add(
        force,
        (kinetic.mass !== 1) ?
          Vec2.scal(gravity, 1 / kinetic.mass, cache) :
          gravity
      );
    }

    // Apply friction
    if (kinetic.friction) {
      Vec2.add(
        force,
        Vec2.scal(
          Vec2.norm(velocity, cache),
          -kinetic.friction
        )
      );
    }

    // http://www.richardlord.net/presentations/physics-for-flash-games
    // https://github.com/soulwire/Coffee-Physics/tree/master/source/engine/integrator

    if (kinetic.maxForce) {
      Vec2.limit(force, kinetic.maxForce);
    }

    Vec2.copy(copyVel, velocity);
    Vec2.add(velocity, Vec2.scal(force, dt));
    if (kinetic.maxVelocity) {
      Vec2.limit(velocity, kinetic.maxVelocity);
    }
    Vec2.scal(Vec2.add(copyVel, velocity), dt / 2);
    Vec2.add(kinetic.transform.pos, copyVel);

    Vec2.add(velocity, force);

    // Apply drag
    if (kinetic.drag < 1) {
      Vec2.scal(velocity, kinetic.drag);
    }

    var sleepVelocity = kinetic.sleepVelocity;
    if (sleepVelocity) {
      if (Vec2.lenSq(velocity) <= sleepVelocity * sleepVelocity) {
        if (!kinetic.sleeping) {
          Vec2.set(velocity);
          kinetic.sleeping = true;
          kinetic.entity.pubUp('onKineticSleep', kinetic);
        }
      } else {
        if (kinetic.sleeping) {
          kinetic.sleeping = false;
          kinetic.entity.pubUp('onKineticWake', kinetic);
        }
      }
    }

    // Reset force
    Vec2.set(force);
  }
};

new Component('kinetic', Kinetic);

module.exports = Kinetic;
