/** @flow weak */
/**
 * @module core/kinetic
 */

var Component = require('./component');
var Pool = require('./pool');
var Mathf = require('../math/mathf');
var Vec2 = require('../math/vec2');

/**
 * @class Kinetic
 * Velocity integrator
 *
 * Related links:
 * http://hg.positiontspectacular.com/toxiclibs/src/689ddcd9bea3/src.physics/toxi/physics2d
 * @extends Component
 */
function Kinetic() {
	Component.call(this);
	this.mass = 0.0;
	this.drag = 0.0;
	this.friction = 0.0;
	this.fixed = false;
	this.maxVelocity = 0.0;
	this.maxForce = 0.0;
	this.minVelocity = 0.0;
	this.angularVelocity = 0.0;
	this.torque = 0.0;
	this.continuousTorque = 0.0;
	this.angularDrag = 0.0;
	this.angularFriction = 0.0;
	this.angularFixed = false;
	this.maxAngularVelocity = 0.0;
	this.maxAngularForce = 0.0;
	this.minAngularVelocity = 0.0;
	this.fast = false;

	this._velocity = Vec2();
	this._force = Vec2();
	this._continuousForce = Vec2();
	this.sleeping = false;
}

Kinetic.gravity = Vec2();

Kinetic.prototype = {
	attributes: {
		mass: 1.0,
		velocity: Vec2(),
		force: Vec2(),
		continuousForce: Vec2(),
		drag: 0.999,
		friction: 15.0,
		fixed: false,
		maxVelocity: 75.0,
		maxForce: 2000.0,
		minVelocity: 1.0,
		angularVelocity: 0.0,
		torque: 0.0,
		continuousTorque: 0.0,
		angularDrag: 0.999,
		angularFriction: 1.0,
		angularFixed: false,
		maxAngularVelocity: 0.0,
		maxAngularForce: 0.0,
		minAngularVelocity: Mathf.TAU / 360,
		fast: false
	},

	create: function() {
		this.sleeping = false;
	},

	get direction() {
		return Vec2.rad(this._velocity);
	},

	set direction(rad) {
		Vec2.rotateTo(this._velocity, rad);
	},

	get speed() {
		return Vec2.len(this._velocity);
	},

	set speed(length) {
		Vec2.norm(this._velocity, null, length);
	},

	applyForce: function(impulse, ignoreMass, continues) {
		Vec2.add(
			(continues) ? this._continuousForce : this._force, (!ignoreMass && this.mass !== 1) ?
			Vec2.scale(impulse, 1 / (this.mass || 1), cache) :
			impulse
		);
	},

	applyTorque: function(impulse, ignoreMass, continues) {
		Vec2.add(
			(continues) ? this._continuousForce : this._force, (!ignoreMass && this.mass !== 1) ?
			Vec2.scale(impulse, 1 / (this.mass || 1), cache) :
			impulse
		);
	}
};

Vec2.defineProperty(Kinetic, 'velocity');
Vec2.defineProperty(Kinetic, 'force');
Vec2.defineProperty(Kinetic, 'continuousForce');

var velocity = Vec2();
var force = Vec2();
var velocityCache = Vec2();
var forceCache = Vec2();
var cache = Vec2();

Kinetic.simulate = function(dt) {
	var dtSq = dt * dt;
	var kinetics = this.pool.heap;
	for (var i = 0, l = kinetics.length; i < l; i++) {
		var kinetic = kinetics[i];
		if (!kinetic.enabled || kinetic.fixed) {
			continue;
		}
		var transform = kinetic.components.transform;
		Vec2.copy(velocity, kinetic._velocity);
		Vec2.add(kinetic._force, kinetic._continuousForce, force);

		// Fast path (no mass)
		if (kinetic.fast) {
			if (kinetic.maxForce > 0) {
				Vec2.limit(force, kinetic.maxForce);
			}
			Vec2.add(velocity, Vec2.scale(force, dt));
			if (kinetic.maxVelocity > 0) {
				Vec2.limit(velocity, kinetic.maxVelocity);
			}
			kinetic.force = Vec2.zero;
			kinetic.velocity = velocity;
			transform.translateBy(Vec2.scale(velocity, dt));
			continue;
		}

		// Apply scene gravity
		var gravity = kinetic.root.gravity || Kinetic.gravity;
		if (Vec2.lenSq(gravity) > 0 && kinetic.mass > Mathf.EPSILON) {
			Vec2.add(
				force, (kinetic.mass !== 1) ?
				Vec2.scale(gravity, 1 / kinetic.mass, cache) :
				gravity
			);
		}

		// Apply friction
		if (kinetic.friction > 0) {
			Vec2.add(
				force,
				Vec2.scale(
					Vec2.norm(velocity, cache), -kinetic.friction
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
		*/

		Vec2.add(
			Vec2.add(
				transform.position,
				Vec2.scale(velocity, dt, velocityCache)
			),
			Vec2.scale(force, 0.5 * dtSq, forceCache)
		);
		// transform.markDirty();

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

		var minVelocity = kinetic.minVelocity;
		if (minVelocity > 0) {
			if (Vec2.lenSq(velocity) <= minVelocity * minVelocity) {
				if (!kinetic.sleeping) {
					Vec2.set(velocity);
					kinetic.sleeping = true;
					kinetic.entity.emitUp('onKineticSleep', kinetic);
				}
			} else {
				if (kinetic.sleeping) {
					kinetic.sleeping = false;
					kinetic.entity.emitUp('onKineticWake', kinetic);
				}
			}
		}

		// Reset force
		kinetic.force = Vec2.zero;
		kinetic.velocity = velocity;
	}
};

Component.create(Kinetic, 'kinetic');

module.exports = Kinetic;
