'use strict';

var Component = require('./component');
var Pool = require('./pool');
var Vec2 = require('./math').Vec2;

/**
 * @class Kinetic
 * Velocity integrator
 *
 * Related links:
 * http://hg.positiontspectacular.com/toxiclibs/src/689ddcd9bea3/src.physics/toxi/physics2d
 * @extends Component
 */
function Kinetic() {
	this.velocity = Vec2();
	this.force = Vec2();
	this.continuous = Vec2();
	this.angularVelocity = Vec2();
	this.torque = Vec2();
	this.continuousTorque = Vec2();
}

Kinetic.gravity = Vec2();

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

	get direction() {
		return Vec2.rad(this.velocity);
	},

	set direction(rad) {
		Vec2.rotateTo(this.velocity, rad);
	},

	get speed() {
		return Vec2.len(this.velocity);
	},

	set speed(length) {
		Vec2.norm(this.velocity, null, length);
	},

	applyForce: function(impulse, ignoreMass, continues) {
		Vec2.add(
			(continues) ? this.continuous : this.force,
			(!ignoreMass && this.mass !== 1) ?
				Vec2.scale(impulse, 1 / (this.mass || 1), cache) :
				impulse
		);
	},

	applyContinuesForce: function(force) {
		Vec2.add(this.continuous, force);
	}

};

Kinetic.simulate = function(dt) {
	var EPSILON = Math.EPSILON;
	var dtSq = dt * dt;

	var kinetics = this.heap;
	for (var i = 0, l = kinetics.length; i < l; i++) {
		var kinetic = kinetics[i];
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
			Vec2.add(velocity, Vec2.scale(force, dt));
			Vec2.set(force);
			if (kinetic.maxVelocity) {
				Vec2.limit(velocity, kinetic.maxVelocity);
			}
			Vec2.add(kinetic.transform.position, Vec2.scale(velocity, dt, cache));
			continue;
		}

		// Apply scene gravity
		var gravity = kinetic.root.gravity || Kinetic.gravity;
		if (Vec2.lenSq(gravity) && kinetic.mass > EPSILON) {
			Vec2.add(
				force,
				(kinetic.mass !== 1) ?
					Vec2.scale(gravity, 1 / kinetic.mass, cache) :
					gravity
			);
		}

		// Apply friction
		if (kinetic.friction > 0) {
			Vec2.add(
				force,
				Vec2.scale(
					Vec2.norm(velocity, cache),
					-kinetic.friction
				)
			);
		}

		if (kinetic.maxForce > 0) {
			Vec2.limit(force, kinetic.maxForce);
		}

		/*
		// http://www.compsoc.man.ac.uk/~lucky/Democritus/Theory/verlet.html#velver
		// http://en.wikipedia.org/wiki/Verlet_integration#Velocity_Verlet
		var lastForce = Vec2.scale(kinetic.lastForce, dt / 2);

		// calculates a half-step velocity
		Vec2.add(velocity, lastForce);
		Vec2.add(
			kinetic.transform.position,
			Vec2.scale(velocity, dt, cache)
		);

		// Save force for next iteration
		Vec2.copy(lastForce, force);

		// Save force for next iteration
		Vec2.add(
			velocity,
			Vec2.scale(force, dt / 2)
		);
		*/

		Vec2.add(
			Vec2.add(
				kinetic.transform.position,
				Vec2.scale(velocity, dt, velocityCache)
			),
			Vec2.scale(force, 0.5 * dtSq, forceCache)
		);

		Vec2.add(
			velocity,
			Vec2.scale(force, dt, forceCache)
		);

		// Apply drag
		if (kinetic.drag < 1) {
			Vec2.scale(velocity, kinetic.drag);
		}

		// Limit velocity
		if (kinetic.maxVelocity > 0) {
			Vec2.limit(velocity, kinetic.maxVelocity);
		}

		// Reset force
		Vec2.set(force);

		var sleepVelocity = kinetic.sleepVelocity;
		if (sleepVelocity) {
			if (Vec2.lenSq(velocity) <= sleepVelocity * sleepVelocity) {
				if (!kinetic.sleeping) {
					Vec2.set(velocity);
					kinetic.sleeping = true;
					kinetic.entity.triggerUp('onKineticSleep', kinetic);
				}
			} else {
				if (kinetic.sleeping) {
					kinetic.sleeping = false;
					kinetic.entity.triggerUp('onKineticWake', kinetic);
				}
			}
		}
	}
};

var cache = Vec2();
var velocityCache = Vec2();
var forceCache = Vec2();

new Component('kinetic', Kinetic);

module.exports = Kinetic;
