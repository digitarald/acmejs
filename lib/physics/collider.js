
import Component from '../core/component';
import Event from '../core/event';
import Vec2 from '../math/vec2';

class TriggerEvent extends Event {
	constructor() {
		Event.call(this);
		this.other = null;
		this.overlap = 0.0;
		this._normal = Vec2();
	}
}
Vec2.defineProperty(TriggerEvent, 'normal');
Event.register(TriggerEvent, 'trigger');

class CollideEvent extends Event {
	constructor() {
		Event.call(this);
		this.other = null;
		this._normal = Vec2();
	}
}
Vec2.defineProperty(CollideEvent, 'normal');
Event.register(CollideEvent, 'collide');

/**
 * Collider
 *
 * Circle only
 *
 * http://jsperf.com/circular-collision-detection/2
 * https://sites.google.com/site/t3hprogrammer/research/circle-circle-collision-tutorial#TOC-Dynamic-Circle-Circle-Collision
 * http://gamedev.tutsplus.com/tutorials/implementation/when-worlds-collide-simulating-circle-circle-collisions/
 *
 * @extends Component
 */
class Collider extends Component {
	constructor() {
		Component.call(this);
		this.trigger = false;
		this.include = '';
		this.exclude = '';
	}

	get attributes() {
		return {
			trigger: false,
			include: '',
			exclude: ''
		};
	}
};

let p = Vec2();
let n = Vec2();
let cache = Vec2();
let pCache = Vec2();
let nCache = Vec2();

Collider.simulate = function(dt) {
	let colliders = this.registry.instances;
	let i = colliders.length;
	while (i--) {
		let collider1 = colliders[i];
		if (!collider1.enabled) {
			continue;
		}
		let j = i;
		while (j-- && collider1.enabled) {
			let collider2 = colliders[j];
			if (!collider2.enabled) {
				continue;
			}
			let entity1 = collider1.entity;
			let entity2 = collider2.entity;
			let body1 = entity1.components.body;
			let body2 = entity2.components.body;
			if (!body1.awake && !body2.awake) {
				continue;
			}

			let include1 = collider1.include;
			let exclude1 = collider1.exclude;
			let include2 = collider2.include;
			let exclude2 = collider2.exclude;
			if ((include1 && !entity2.hasComponent(include1)) ||
				(include2 && !entity1.hasComponent(include2)) ||
				(exclude1 && entity2.hasComponent(exclude1)) ||
				(exclude2 && entity1.hasComponent(exclude2))) {
				continue;
			}

			let radius1 = entity1.components.bounds.radius;
			let radius2 = entity2.components.bounds.radius;
			let pos1 = entity1.components.transform.position;
			let pos2 = entity2.components.transform.position;
			let radiusSum = radius1 + radius2;

			let overlapSq = Vec2.distSq(pos1, pos2);
			if (overlapSq > radiusSum * radiusSum) {
				continue;
			}

			Vec2.norm(Vec2.sub(pos1, pos2, p));
			let overlap = Math.sqrt(overlapSq);

			if (collider1.trigger || collider2.trigger) {
				let triggerEvent = Event.create('trigger');
				triggerEvent.normal = p;
				triggerEvent.overlap = overlap;
				triggerEvent.entity = entity2;
				entity1.emit(triggerEvent);

				triggerEvent = Event.create('trigger');
				triggerEvent.normal = p;
				triggerEvent.overlap = overlap;
				triggerEvent.entity = entity1;
				entity2.emit(triggerEvent);
				continue;
			}

			overlap -= radiusSum;
			let vel1 = body1.velocity;
			let vel2 = body2.velocity;
			let mass1 = body1.mass || 1;
			let mass2 = body2.mass || 1;

			if (overlap < 0) {
				Vec2.add(
					pos1,
					Vec2.scale(p, -overlap * 2 * radius1 / radiusSum, cache)
				);
				Vec2.add(
					pos2,
					Vec2.scale(p, overlap * 2 * radius2 / radiusSum, cache)
				);
			}

			// normal vector to collision direction
			Vec2.perp(p, n);

			let vp1 = Vec2.dot(vel1, p); // velocity of P1 along collision direction
			let vn1 = Vec2.dot(vel1, n); // velocity of P1 normal to collision direction
			let vp2 = Vec2.dot(vel2, p); // velocity of P2 along collision direction
			let vn2 = Vec2.dot(vel2, n); // velocity of P2 normal to collision

			// fully elastic collision (energy & momentum preserved)
			let vp1After = (mass1 * vp1 + mass2 * (2 * vp2 - vp1)) / (mass1 + mass2);
			let vp2After = (mass1 * (2 * vp1 - vp2) + mass2 * vp2) / (mass1 + mass2);

			Vec2.add(
				Vec2.scale(p, vp1After, pCache),
				Vec2.scale(n, vn1, nCache),
				vel1
			);
			Vec2.add(
				Vec2.scale(p, vp2After, pCache),
				Vec2.scale(n, vn2, nCache),
				vel2
			);

			let collideEvent = Event.create('collide');
			collideEvent.normal = n;
			collideEvent.other = entity2;
			entity1.emit(collideEvent, this);

			collideEvent = Event.create('collide');
			collideEvent.normal = n;
			collideEvent.other = entity1;
			entity2.emit(collideEvent, this);
		}
	}
};

Component.create(Collider, 'collider');
