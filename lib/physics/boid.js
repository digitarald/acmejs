import Component from '../core/component';
import Vec2 from '../math/vec2';

/**
 * @class Boid
 * Steering behaviour
 * - http://www.openprocessing.org/sketch/7493
 * - http://www.openprocessing.org/sketch/11045
 * - https://github.com/paperjs/paper.js/blob/master/examples/Paperjs.org/Tadpoles.html
 *
 * @extends Component
 *
 * @constructor
 */
class Boid extends Component {
	constructor() {
		Component.call(this);
		this.aura = 0.0;
		this.perception = 0.0;
		this.perceptionSq = 0.0;
		this.auraSq = 0.0;
		this.mod = 2;
		this.cohesionMod = 1;
		this.avoidanceMod = 2;
		this.imitationMod = 1;
	}

	get attributes() {
		return {
			perception: 0.0,
			aura: 0.0
		};
	}

	create() {
		if (this.components.bounds) {
			if (this.aura === 0) {
				this.aura = this.components.bounds.radius * 2;
			}
			if (this.perception === 0) {
				this.perception = this.aura * 4;
			}
		}
		this.perceptionSq = this.perception * this.perception;
		this.auraSq = this.aura * this.aura;
	}
}


let cohesion = Vec2();
let avoidance = Vec2();
let imitation = Vec2();
let distance = Vec2();
let impulse = Vec2();

Boid.fixedUpdate = function(dt) {
	let boids = this.registry.instances;
	let len = boids.length;
	let i = len;
	while (i--) {
		let boid1 = boids[i];
		if (!boid1.enabled) {
			continue;
		}

		let entity1 = boid1.entity;
		let pos1 = entity1.components.transform.position;
		let vel = entity1.components.body.velocity;

		let avoidanceCount = 0;
		let imitationCount = 0;
		let cohesionCount = 0;
		Vec2.set(impulse);

		let j = len;
		while (j--) {
			let boid2 = boids[j];
			if (!boid2.enabled || boid1 === boid2) {
				continue;
			}

			let entity2 = boid2.entity;
			let pos2 = entity2.components.transform.position;

			let diffSq = Vec2.distSq(pos1, pos2);
			if (diffSq < boid1.perceptionSq && diffSq) {
				Vec2.sub(pos2, pos1, distance);
				// Vec2.scale(distance, Math.sqrt(entity1.body.mass / entity2.body.mass));

				// diff = Math.sqrt(diffSq)
				// Vec2.scale(distance, Math.quadInOut(diff / boid1.perception), cache)

				// Cohesion : try to approach other boids
				cohesionCount++;
				if (cohesionCount == 1) {
					Vec2.copy(cohesion, distance);
				} else {
					Vec2.add(cohesion, distance);
				}

				// Imitation : try to move in the same way than other boids
				imitationCount++;
				if (imitationCount == 1) {
					Vec2.copy(imitation, entity2.components.body.velocity);
				} else {
					Vec2.add(imitation, entity2.components.body.velocity);
				}

				// Avoidance : try to keep a minimum distance between others.
				if (diffSq < boid1.auraSq) {
					avoidanceCount++;
					if (avoidanceCount == 1) {
						Vec2.copy(avoidance, distance);
					} else {
						Vec2.add(avoidance, distance);
					}
				}
			}
		}

		let mod = boid1.mod;
		if (cohesionCount && boid1.cohesionMod) {
			if (cohesionCount > 1) {
				Vec2.scale(cohesion, 1 / cohesionCount);
			}
			entity1.components.body.applyForce(
				Vec2.scale(cohesion, boid1.cohesionMod * mod),
				true
			);
		}

		if (imitationCount && boid1.imitationMod) {
			if (imitationCount > 1) {
				Vec2.scale(imitation, 1 / imitationCount);
			}
			Vec2.add(impulse, Vec2.scale(imitation, boid1.imitationMod * mod));
			entity1.components.body.applyForce(
				Vec2.sub(impulse, vel),
				true
			);
		}

		if (avoidanceCount && boid1.avoidanceMod) {
			if (avoidanceCount > 1) {
				Vec2.scale(avoidance, 1 / avoidanceCount);
			}
			entity1.components.body.applyForce(
				Vec2.scale(avoidance, boid1.avoidanceMod * mod),
				true
			);
		}
	}
};

Component.create(Boid, 'boid');
