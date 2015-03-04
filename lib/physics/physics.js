
import Component from '../core/component';
import Registry from '../core/registry';
import {EPSILON} from '../math/mathf';
import Vec2 from '../math/vec2';

let velocity = Vec2();
let force = Vec2();
let combinedVelocity = Vec2();
let forceCache = Vec2();
let cache = Vec2();

class Physics extends Component {
	constructor() {
		this._gravity = Vec2();
	}

	get attributes() {
		return {
			gravity: Vec2()
		};
	}

	// onBodyCreate(event) {
	// 	console.log(event.)
	// }

	simulate(dt) {
		let dtSq = dt * dt;
		let bodies = Registry.types.body.instances;
		for (let i = 0, l = bodies.length; i < l; i++) {
			let body = bodies[i];
			if (!body.enabled || body.fixed) {
				continue;
			}
			let transform = body.components.transform;
			body.copyVelocity(velocity);
			Vec2.add(body._force, body._continuousForce, force);

			// Fast path (no mass)
			if (body.fast) {
				if (body.maxForce > 0) {
					Vec2.limit(force, body.maxForce);
				}
				Vec2.add(velocity, Vec2.scale(force, dt));
				if (body.maxVelocity > 0) {
					Vec2.limit(velocity, body.maxVelocity);
				}
				body.force = Vec2.zero;
				body.velocity = velocity;
				transform.translateBy(Vec2.scale(velocity, dt));
				continue;
			}

			// Apply scene gravity
			let gravity = this._gravity;
			if (Vec2.lenSq(gravity) > 0 && body.mass > EPSILON) {
				Vec2.add(
					force, (body.mass !== 1) ?
					Vec2.scale(gravity, 1 / body.mass, cache) :
					gravity
				);
			}

			// Apply friction
			if (body.friction > 0) {
				Vec2.add(
					force,
					Vec2.scale(
						Vec2.norm(velocity, cache), -body.friction
					)
				);
			}

			if (body.maxForce > 0) {
				Vec2.limit(force, body.maxForce);
			}

			/*
			// http://www.compsoc.man.ac.uk/~lucky/Democritus/Theory/verlet.html#velver
			// http://en.wikipedia.org/wiki/Verlet_integration#Velocity_Verlet
			let lastForce = Vec2.scale(body.lastForce, dt / 2);
			*/

			transform.translateBy(Vec2.add(
				Vec2.scale(velocity, dt, combinedVelocity),
				Vec2.scale(force, 0.5 * dtSq, forceCache)
			));

			Vec2.add(
				velocity,
				Vec2.scale(force, dt, forceCache)
			);

			// Apply drag
			if (body.drag < 1) {
				Vec2.scale(velocity, body.drag);
			}

			// Limit velocity
			if (body.maxVelocity > 0) {
				Vec2.limit(velocity, body.maxVelocity);
			}

			let minVelocity = body.minVelocity;
			if (minVelocity > 0) {
				if (Vec2.lenSq(velocity) <= minVelocity * minVelocity) {
					if (!body.sleeping) {
						Vec2.set(velocity);
						body.sleeping = true;
						body.emit('bodySleep');
					}
				} else {
					if (body.sleeping) {
						body.sleeping = false;
						body.emit('bodyWake');
					}
				}
			}

			// Reset force
			body.force = Vec2.zero;
			body.velocity = velocity;
		}
	}
}

Component.create(Physics, 'physics');
