'use strict';

import Entity from './entity';
import Registry from './registry';
import Event from './event';
import {performance as perf, requestAnimationFrame as raFrame} from './shims';

/**
 * @class Context
 * Managing renderer, scene and loop
 * @extends Entity
 */
class Context extends Entity {
	constructor() {
		Entity.call(this);
		this.running = false;
		this.time = 0.0;
		this.lastTime = 0.0;
		this.frame = 0;
		this.tail = 0.0;
		this.fdtEnabled = false;
		this.fdt = 1 / 30;
		this.dt = 1 / 60;
		this.maxDt = 0.5;
		this.maxFdt = this.fdt * 5;
		this.scale = 1;
		this.rfa = true;
		this.enabled = true;

		this.debug = {
			profile: 0,
			step: false,
			time: true,
			profileFrom: 0
		};
		this.samples = {
			dt: 0,
			lag: 0,
			tick: 0,
			fixedUpdate: 0,
			update: 0,
			render: 0
		};

		this.tickBound = this.tick.bind(this);

		this.element = null;
		this.scene = null;
	}

	init(element) {
		this.element = element;
		this.createComponent('input');
		this.createComponent('console');
	}

	/**
	 * Set scene and start game loop
	 * @param {Entity} scene
	 * @param {Boolean} soft
	 */
	play(scene, soft) {
		if (this.scene) {
			this.emit('sceneEnd');
			if (soft) {
				this.scene.enable(false, true);
			} else {
				this.scene.destroy();
			}
		}
		this.scene = scene;
		this.emit('sceneStart');
		this.start();
	}

	/**
	 * Start loop
	 */
	start() {
		if (this.running) {
			return;
		}
		this.running = true;
		this.emit('contextStart');
		raFrame(this.tickBound);
	}

	pause() {
		if (!this.running) {
			return;
		}
		this.emit('contextPause');
		this.running = false;
	}

	/**
	 * Game loop tick, called by requestAnimationFrame
	 *
	 * @param {Number} time Delta time
	 */
	tick(time) {
		// Time value in seconds
		time = (time != null && time < 1e12 ? time : perf.now()) / 1000;
		this.time = time;
		// rfa here to be less error prone

		let i = 0;
		let l = 0;
		let methods = [];
		let debug = this.debug;
		let samples = this.hasEvent('onTimeEnd') ? this.samples : null;
		let pong = 0.0;

		if (this.lastTime) {
			let dt = time - this.lastTime;
			if (dt > this.maxDt || dt <= 0) {
				dt = this.dt;
			} else if (dt > 0.01 && samples != null) {
				samples.dt = dt;
				let lag = time - samples.next;
				if (lag > 0) {
					samples.lag = lag * 1000;
				}
			}
			this.dt = (dt *= this.scale);
			this.frame++;

			if (debug.profile && !debug.profileFrom) {
				debug.profileFrom = debug.profile;
				console.profile('Frame ' + debug.profileFrom);
			}

			let ping = (samples != null) ? perf.now() : 0.0;
			let pingTick = ping;

			// Invoke fixed updates
			let fdt = (this.fdtEnabled) ? this.fdt : dt;
			let tail = Math.min(this.tail + dt, this.maxFdt * this.scale);
			while (tail >= fdt) {
				tail -= fdt;
				let fixedUpdates = Registry.methods.fixedUpdate;
				for (i = 0, l = fixedUpdates.length; i < l; i++) {
					if (fixedUpdates[i].enabled) {
						fixedUpdates[i].fixedUpdate(fdt);
					}
				}
				let simulates = Registry.methods.simulate;
				for (i = 0, l = simulates.length; i < l; i++) {
					if (simulates[i].enabled) {
						simulates[i].simulate(fdt);
					}
				}
			}
			this.tail = tail;

			if (samples != null) {
				pong = perf.now();
				samples.fixedUpdate = pong - ping;
				ping = pong;
			}

			// Invoke update
			let updates = Registry.methods.update;
			for (i = 0, l = updates.length; i < l; i++) {
				if (updates[i].enabled) {
					updates[i].update(dt);
				}
			}

			Registry.free();

			// Invoke postUpdate
			let postUpdates = Registry.methods.postUpdate;
			for (i = 0, l = postUpdates.length; i < l; i++) {
				if (postUpdates[i].enabled) {
					postUpdates[i].postUpdate(dt);
				}
			}

			if (samples != null) {
				pong = perf.now();
				samples.update = pong - ping;
				ping = pong;
			}

			// Invoke preRender
			let preRenders = Registry.methods.preRender;
			for (i = 0, l = preRenders.length; i < l; i++) {
				if (preRenders[i].enabled) {
					preRenders[i].preRender(dt);
				}
			}

			let ctx = this.renderer.save();
			// Invoke render
			let renders = Registry.methods.render;
			for (i = 0, l = renders.length; i < l; i++) {
				if (renders[i].enabled) {
					renders[i].render(ctx);
				}
			}
			this.renderer.restore();

			if (samples != null) {
				pong = perf.now();
				samples.render = pong - ping;
				samples.tick = pong - pingTick;
			}

			if (debug.step) {
				// debugger; // jshint ignore:line
			}

			if (debug.profileFrom) {
				if (!--debug.profile) {
					console.profileEnd('Frame ' + debug.profileFrom);
					debug.profileFrom = 0;
				}
			}
		}

		this.lastTime = time;

		if (samples != null) {
			samples.next = Math.max(time + 1 / 60, perf.now() / 1000);
			var event = Event.create('timeEnd', samples);
			this.emit(event, samples);
		}

		if (this.running) {
			if (this.rfa) {
				raFrame(this.tickBound);
			} else {
				perf.nextTick(this.tickBound);
			}
		}
	}
};

Context.prototype.type = 'context';

// Singleton
let context = new Context();

export default context;

// Debugging hooks
if (typeof window != 'undefined' && window.console) {
	console.acme = console.acme || (console.acme = {});
	console.acme.context = context;
	console.acme.profile = function(frames) {
		if (frames == null) {
			frames = 60;
		}
		context.debug.profile = frames;
		return null;
	};
	console.acme.step = function() {
		context.debug.step = !context.debug.step;
		return null;
	};
}
