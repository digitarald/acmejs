/** @flow weak */
/**
 * @module core/body
 */

import Component from '../core/component';
import {TAU} from '../math/mathf';
import Vec2 from '../math/vec2';

/**
 * @class Body
 * Velocity integrator
 *
 * Related links:
 * http://hg.positiontspectacular.com/toxiclibs/src/689ddcd9bea3/src.physics/toxi/physics2d
 * @extends Component
 */
export default class Body extends Component {
	constructor() {
		Component.call(this);
		this.mass = 0.0;
		this.drag = 0.0;
		this.friction = 0.0;
		this.density = 0.0;
		this.restitution = 1.0;
		this.fixed = false;
		this.maxVelocity = 0.0;
		this.maxForce = 0.0;
		this.minVelocity = 0.0;
		this.angularVelocity = 0.0;
		this.torque = 0.0;
		this.continuousTorque = 0.0;
		this.angularDrag = 0.0;
		this.angularFriction = 0.0;
		this.fixedRotation = false;
		this.maxAngularVelocity = 0.0;
		this.maxAngularForce = 0.0;
		this.minAngularVelocity = 0.0;
		this.fast = false;
		this.awake = false;
		this.allowSleep = false;
		this.bullet = false;

		this._velocity = Vec2();
		this._force = Vec2();
		this._continuousForce = Vec2();
	}

	get attributes() {
		return {
			mass: 1.0,
			velocity: Vec2(),
			force: Vec2(),
			continuousForce: Vec2(),
			drag: 0.999,
			friction: 15.0,
			density: 1.0,
			restitution: 0.2,
			fixed: false,
			fixedRotation: true,
			maxVelocity: 75.0,
			maxForce: 2000.0,
			minVelocity: 1.0,
			angularVelocity: 0.0,
			torque: 0.0,
			continuousTorque: 0.0,
			angularDrag: 0.999,
			angularFriction: 1.0,
			maxAngularVelocity: 0.0,
			maxAngularForce: 0.0,
			minAngularVelocity: TAU / 360,
			fast: false,
			bullet: false,
			awake: true,
			allowSleep: true
		};
	}

	get direction() {
		return Vec2.rad(this._velocity);
	}

	set direction(rad) {
		Vec2.rotateTo(this._velocity, rad);
	}

	get speed() {
		return Vec2.len(this._velocity);
	}

	set speed(length) {
		Vec2.norm(this._velocity, null, length);
	}

	applyForce(impulse, ignoreMass, continues) {
		Vec2.add(
			(continues) ? this._continuousForce : this._force, (!ignoreMass && this.mass !== 1) ?
			Vec2.scale(impulse, 1 / (this.mass || 1), cache) :
			impulse
		);
	}

	applyTorque(impulse, ignoreMass, continues) {
		Vec2.add(
			(continues) ? this._continuousForce : this._force, (!ignoreMass && this.mass !== 1) ?
			Vec2.scale(impulse, 1 / (this.mass || 1), cache) :
			impulse
		);
	}
};

let cache = Vec2();

Vec2.defineProperty(Body, 'velocity');
Vec2.defineProperty(Body, 'force');
Vec2.defineProperty(Body, 'continuousForce');

Component.create(Body, 'body');
