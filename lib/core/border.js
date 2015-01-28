'use strict';

var Component = require('./component');
var Pool = require('./pool');
var Vec2 = require('../math/vec2');
var Engine = require('./engine');

/**
 * @class Border
 * Border lets entities react on contact with the canvas borders.
 * @extends Component
 * @property {String} [mode="bounce"] Reaction to contact with border, "constrain", "bounce", "mirror", "kill"
 * @property {Number} [restitution=1] Restitution on bounce
 * @fires Border#onBorder
 */
function Border() {
	Component.call(this);
	this.mode = '';
	this.restitution = 0.0;
}

Border.prototype = {
	attributes: {
		mode: 'bounce',
		restitution: 1
	}
};

var position = Vec2();
var velocity = Vec2();
var topLeft = Vec2();
var bottomRight = Vec2();

Border.simulate = function(dt) {
	topLeft = Engine.renderer.position;
	Vec2.add(topLeft, Engine.renderer.content, bottomRight);

	var borders = this.pool.heap;
	for (var i = 0, l = borders.length; i < l; i++) {
		var border = borders[i];
		if (!border.enabled) {
			continue;
		}

		var restitution = border.restitution;
		var mode = border.mode;
		var mirror = mode == 'mirror';
		var bounce = mode == 'bounce';
		var entity = border.entity;
		var kinetic = entity.components.kinetic;
		if (bounce && kinetic != null) {
			if (!kinetic.enabled || kinetic.sleeping) {
				continue;
			}
			kinetic.copyVelocity(velocity);
		}
		var transform = entity.components.transform;
		transform.copyPosition(position);
		var bounds = entity.components.bounds;
		var contact = true;

		// Horizontal
		var diff = (bounce ? bounds.left : bounds.right) - topLeft[0];
		if (diff <= 0) {
			contact = true;
			if (mirror) {
				position[0] = bottomRight[0] + bounds.width;
			} else {
				position[0] -= diff;
				if (bounce) {
					velocity[0] *= -restitution;
				}
			}
		} else {
			diff = (bounce ? bounds.right : bounds.left) - bottomRight[0];
			if (diff >= 0) {
				contact = true;
				if (mirror) {
					position[0] = topLeft[0] - bounds.width;
				} else {
					position[0] -= diff;
					if (bounce) {
						velocity[0] *= -restitution;
					}
				}
			} else {
				// Vertical
				diff = (bounce ? bounds.top : bounds.bottom) - topLeft[1];
				if (diff <= 0) {
					contact = true;
					if (mirror) {
						position[1] = bottomRight[1] + bounds.height;
					} else {
						position[1] -= diff;
						if (bounce) {
							velocity[1] *= -restitution;
						}
					}
				} else {
					diff = (bounce ? bounds.bottom : bounds.top) - bottomRight[1];
					if (diff >= 0) {
						contact = true;
						if (mirror) {
							position[1] = topLeft[1] - bounds.height;
						} else {
							position[1] -= diff;
							if (bounce) {
								velocity[1] *= -restitution;
							}
						}
					}
				}
			}
		}

		// We contact
		if (contact) {
			transform.position = position;
			if (kinetic != null) {
				kinetic.velocity = velocity;
			}
			/**
			 * Fired on contact
			 * @event Border#onBorder
			 * @param {Number[]} contact Contact point
			 */
			entity.emit('onBorder');
			if (border.mode == 'kill') {
				entity.destroy();
			}
		}
	}
};

Component.create(Border, 'border');

module.exports = Border;
