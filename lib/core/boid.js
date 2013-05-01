'use strict';

// http://www.openprocessing.org/sketch/7493
// http://www.openprocessing.org/sketch/11045

var Component = require('./component');
var Pool = require('./pool');
var Vec2 = require('./math').Vec2;
var Kinetic = require('./kinetic');


function Boid() {
	this.mod = 2;
	this.cohesionMod = 1;
	this.avoidanceMod = 2;
	this.imitationMod = 1;
}
Boid.prototype = Object.create(Component.prototype);

Boid.prototype.tag = 'boid';

Boid.prototype.attributes = {
	perception: 100,
	aura: 25
};

Boid.prototype.create = function(attributes) {
	this.perception = attributes.perception;
	this.aura = attributes.aura;
	if (!this.aura && this.bounds) {
		this.aura = this.bounds.radius * 1.5;
	}
	this.perceptionSq = this.perception * this.perception;
	this.auraSq = this.aura * this.aura;
	return this;
};


var cohesion = Vec2();
var avoidance = Vec2();
var imitation = Vec2();
var stretch = Vec2();
var impulse = Vec2();

Boid.fixedUpdate = function(dt) {
	var boids = this.register;
	var len = boids.length;
	var i = len;
	while (i--) {
		var boid1 = boids[i];
		if (!boid1.enabled) {
			continue;
		}
		var avoidanceCount = 0;
		var imitationCount = 0;
		var cohesionCount = 0;
		var entity1 = boid1.entity;
		var pos1 = entity1.transform.pos;
		var vel = entity1.kinetic.velocity;
		Vec2.set(impulse);

		var j = len;
		while (j--) {
			var boid2 = boids[j];
			if (!boid2.enabled || boid1 === boid2) {
				continue;
			}

			var entity2 = boid2.entity;
			var pos2 = entity2.transform.pos;

			var diffSq = Vec2.distSq(pos1, pos2);

			if (diffSq < boid1.perceptionSq && diffSq) {
				Vec2.sub(pos2, pos1, stretch);
				Vec2.scal(stretch, Math.sqrt(entity1.kinetic.mass / entity2.kinetic.mass));

				// diff = Math.sqrt(diffSq)
				// Vec2.scal(stretch, Math.quadInOut(diff / boid1.perception), cache)

				// Cohesion : try to approach other boids
				if (!(cohesionCount++)) {
					Vec2.copy(cohesion, stretch);
				} else {
					Vec2.add(cohesion, stretch);
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
						Vec2.copy(avoidance, stretch);
					} else {
						Vec2.add(avoidance, stretch);
					}
				}
			}
		}

		var mod = boid1.mod;
		if (cohesionCount && boid1.cohesionMod) {
			if (cohesionCount > 1) {
				Vec2.scal(cohesion, 1 / cohesionCount);
			}
			Vec2.add(entity1.kinetic.force, Vec2.scal(cohesion, boid1.cohesionMod * mod));
		}

		if (imitationCount && boid1.imitationMod) {
			if (imitationCount > 1) {
				Vec2.scal(imitation, 1 / imitationCount);
			}
			Vec2.add(impulse, Vec2.scal(imitation, boid1.imitationMod * mod));
			Vec2.add(entity1.kinetic.force, Vec2.sub(impulse, vel));
		}

		if (avoidanceCount && boid1.avoidanceMod) {
			if (avoidanceCount > 1) {
				Vec2.scal(avoidance, 1 / avoidanceCount);
			}
			Vec2.sub(entity1.kinetic.force, Vec2.scal(avoidance, boid1.avoidanceMod * mod));
		}
	}
};

new Pool(Boid);

module.exports = Boid;
