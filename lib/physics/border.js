
import Component from '../core/component';
import Registry from '../core/registry';
import Vec2 from '../math/vec2';
import Context from '../core/context';
import Event from '../core/event';

class BorderEvent extends Event {
	constructor() {
		Event.call(this);
		this.cancelable = true;
		this.diff = 0.0;
		this.contact = 0;
	}
}
Event.register(BorderEvent, 'border');

let position = Vec2();
let velocity = Vec2();

/**
 * @class Border
 * Border lets entities react on contact with the canvas borders.
 * @extends Component
 * @property {String} [mode="bounce"] Reaction to contact with border, "constrain", "bounce", "mirror", "kill"
 * @property {Number} [restitution=1] Restitution on bounce
 * @fires Border#onBorder
 */
class Border extends Component {
	constructor() {
		Component.call(this);
		this.mode = '';
		this.restitution = 0.0;
	}

	get attributes() {
		return {
			mode: 'bounce',
			restitution: 1
		};
	}

	simulate(dt) {
		let topLeft = Context.renderer.topLeft;
		let bottomRight = Context.renderer.bottomRight;
		let restitution = this.restitution;
		let mode = this.mode;
		let mirror = (mode == 'mirror');
		let bounce = (mode == 'bounce');
		let entity = this.entity;
		let body = entity.components.body;
		if (bounce && body != null) {
			if (!body.enabled || !body.awake) {
				return;
			}
			body.copyVelocity(velocity);
		}
		let transform = entity.components.transform;
		transform.copyPosition(position);
		let bounds = entity.components.bounds;
		let contact = -1;

		// Horizontal
		let diff = (bounce ? bounds.left : bounds.right) - topLeft[0];
		if (diff <= 0) {
			contact = 3;
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
				contact = 1;
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
					contact = 0;
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
						contact = 2;
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
		if (contact < 0) {
			return;
		}
		let event = Event.create('border');
		event.contact = contact;
		event.diff = diff;
		if (!this.emit(event)) {
			return;
		}
		if (this.mode == 'kill') {
			entity.destroy();
			return;
		}
		transform.translateTo(position);
		if (bounce && body != null) {
			body.velocity = velocity;
		}
	}
}

Component.create(Border, 'border');
