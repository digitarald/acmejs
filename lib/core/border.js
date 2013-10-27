'use strict';

var Component = require('./component');
var Pool = require('./pool');
var Vec2 = require('./math').Vec2;
var Engine = require('./engine');

/**
 * @class Border
 *
 * Border lets entities react on contact with the canvas borders.
 *
 * @extends Component
 * @property {String} [mode="bounce"] Reaction to contact with border, "bounce", "mirror", "kill"
 * @property {Number} [restitution=1] Restitution on bounce
 */
function Border() {}

Border.prototype = {

	attributes: {
		mode: 'bounce',
		restitution: 1
	},

	create: function(attributes) {
		this.mode = attributes.mode;
		this.restitution = attributes.restitution;
	}

};

var pos = Vec2();
// TODO: Make topLeft/bottomRight
var horizontal = Vec2();
var vertical = Vec2();

Border.simulate = function(dt) {
	var size = Engine.renderer.content;
	var viewport = Engine.renderer.position;
	Vec2.set(horizontal, viewport[0], viewport[0] + size[0]);
	Vec2.set(vertical, viewport[1], viewport[1] + size[1]);

	var borders = this.heap;
	for (var i = 0, l = borders.length; i < l; i++) {
		var border = borders[i];
		if (!border.enabled) {
			continue;
		}

		var entity = border.entity;
		var restitution = border.restitution;
		var mode = border.mode;
		var kinetic = border.kinetic;

		var vel = null;
		if (kinetic) {
			if (!kinetic.enabled || kinetic.sleeping) {
				continue;
			}
			vel = kinetic.velocity;
		}

		var mirror = (mode === 'mirror');
		var bounce = (mode === 'bounce' && vel);
		Vec2.copy(pos, entity.transform.position);

		var radius = entity.bounds.radius;
		if (mirror) {
			radius *= -1;
		}

		var contact = 0;

		// Horizontal
		var diff = pos[0] - radius - horizontal[0];
		if (diff < 0) {
			if (mirror) {
				pos[0] = horizontal[1] - radius;
			} else {
				pos[0] -= diff;
				if (bounce) {
					vel[0] *= -restitution;
				}
			}
			contact = -1;
		} else {
			diff = pos[0] + radius - horizontal[1];
			if (diff > 0) {
				if (mirror) {
					pos[0] = radius;
				} else {
					pos[0] -= diff;
					if (bounce) {
						vel[0] *= -restitution;
					}
				}
				contact = -1;
			} else {
				// Vertical
				diff = pos[1] - radius - vertical[0];

				if (diff < 0) {
					if (mirror) {
						pos[1] = vertical[1] - radius;
					} else {
						pos[1] -= diff;
						if (bounce) {
							vel[1] *= -restitution;
						}
					}
					contact = 1;
				} else {
					diff = pos[1] + radius - vertical[1];
					if (diff > 0) {
						if (mirror) {
							pos[1] = radius;
						} else {
							pos[1] -= diff;
							if (bounce) {
								vel[1] *= -restitution;
							}
						}
						contact = 1;
					}
				}
			}
		}

		// We contact
		if (contact) {
			entity.transform.compose(pos);
			/**
			 * @event onBorder Fired on contact
			 * @param {Number[]} contact Contact point
			 */
			entity.trigger('onBorder', contact);
			if (border.mode === 'kill') {
				entity.destroy();
			}
		}
	}
};

new Component('border', Border);

module.exports = Border;
