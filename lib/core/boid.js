'use strict';

var Component = require('./component');
var Vec2 = require('../math/vec2');
var Kinetic = require('./kinetic');

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
function Boid() {
	this.mod = 2;
	this.cohesionMod = 1;
	this.avoidanceMod = 2;
	this.imitationMod = 1;
}

Boid.prototype = {
	attributes: {
		perception: 100.0,
		aura: 25.0
	},

	create: function() {
		if (this.aura === 0 && this.bounds) {
			this.aura = this.bounds.radius * 2;
		}
		this.perceptionSq = this.perception * this.perception;
		this.auraSq = this.aura * this.aura;
	}
};

var cohesion = Vec2();
var avoidance = Vec2();
var imitation = Vec2();
var distance = Vec2();
var impulse = Vec2();

Boid.fixedUpdate = function(dt) {
	var boids = this.pool.heap;
	var len = boids.length;
	var i = len;

	while (i--) {
		var boid1 = boids[i];
		if (!boid1.enabled) {
			continue;
		}

		var entity1 = boid1.entity;
		var pos1 = entity1.transform.position;
		var vel = entity1.kinetic.velocity;

		var avoidanceCount = 0;
		var imitationCount = 0;
		var cohesionCount = 0;
		Vec2.set(impulse);

		var j = len;
		while (j--) {
			var boid2 = boids[j];
			if (!boid2.enabled || boid1 === boid2) {
				continue;
			}

			var entity2 = boid2.entity;
			var pos2 = entity2.transform.position;

			var diffSq = Vec2.distSq(pos1, pos2);
			if (diffSq < boid1.perceptionSq && diffSq) {
				Vec2.sub(pos2, pos1, distance);
				// Vec2.scale(distance, Math.sqrt(entity1.kinetic.mass / entity2.kinetic.mass));

				// diff = Math.sqrt(diffSq)
				// Vec2.scale(distance, Math.quadInOut(diff / boid1.perception), cache)

				// Cohesion : try to approach other boids
				if (!(cohesionCount++)) {
					Vec2.copy(cohesion, distance);
				} else {
					Vec2.add(cohesion, distance);
				}

				// Imitation : try to move in the same way than other boids
				if (!(imitationCount++)) {
					Vec2.copy(imitation, entity2.kinetic.velocity);
				} else {
					Vec2.add(imitation, entity2.kinetic.velocity);
				}

				// Avoidance : try to keep a minimum distance between others.
				if (diffSq < boid1.auraSq) {
					if (!(avoidanceCount++)) {
						Vec2.copy(avoidance, distance);
					} else {
						Vec2.add(avoidance, distance);
					}
				}
			}
		}

		var mod = boid1.mod;
		if (cohesionCount && boid1.cohesionMod) {
			if (cohesionCount > 1) {
				Vec2.scale(cohesion, 1 / cohesionCount);
			}
			entity1.kinetic.applyForce(Vec2.scale(cohesion, boid1.cohesionMod * mod));
		}

		if (imitationCount && boid1.imitationMod) {
			if (imitationCount > 1) {
				Vec2.scale(imitation, 1 / imitationCount);
			}
			Vec2.add(impulse, Vec2.scale(imitation, boid1.imitationMod * mod));
			entity1.kinetic.applyForce();
			Vec2.add(
				entity1.kinetic.force,
				Vec2.sub(impulse, vel)
			);
		}

		if (avoidanceCount && boid1.avoidanceMod) {
			if (avoidanceCount > 1) {
				Vec2.scale(avoidance, 1 / avoidanceCount);
			}
			Vec2.sub(
				entity1.kinetic.force,
				Vec2.scale(avoidance, boid1.avoidanceMod * mod)
			);
		}
	}
};

Component.create(Boid, 'boid');

module.exports = Boid;
