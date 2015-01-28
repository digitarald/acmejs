'use strict';

var Entity = require('./entity');
var Pool = require('./pool');
require('./shims');

var perf = window.performance;
var raFrame = window.requestAnimationFrame;

/**
 * @class Engine
 * Managing renderer, scene and loop
 * @extends Entity
 */
function Engine() {
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

Engine.prototype = Object.create(Entity.prototype);

Engine.prototype.type = 'engine';

Engine.prototype.init = function(element) {
	this.element = element;

	// Late require. TODO: Justify!
	require('./console');
	this.createComponent('console');

	require('./input');
	this.createComponent('input');
};

/**
 * Set scene and start game loop
 * @param {Entity} scene
 * @param {Boolean} soft
 */
Engine.prototype.play = function(scene, soft) {
	if (this.scene) {
		this.emitAll('onSceneEnd', this.scene);
		if (soft) {
			this.scene.enable(false, true);
		} else {
			this.scene.destroy();
		}
	}
	this.scene = scene;
	this.emitAll('onSceneStart', scene);
	this.start();
};

/**
 * Start loop
 */
Engine.prototype.start = function() {
	if (this.running) {
		return;
	}
	this.running = true;
	this.emitAll('onEngineStart');
	raFrame(this.tickBound);
};

Engine.prototype.pause = function() {
	if (!this.running) {
		return;
	}
	this.emitAll('onEnginePause');
	this.running = false;
};

/**
 * Game loop tick, called by requestAnimationFrame
 *
 * @param {Number} time Delta time
 */
Engine.prototype.tick = function(time) {
	// Time value in seconds
	time = (time != null && time < 1e12 ? time : perf.now()) / 1000;
	this.time = time;
	// rfa here to be less error prone

	var i = 0;
	var l = 0;
	var calls = [];
	var debug = this.debug;
	var samples = this.hasEvent('onTimeEnd') ? this.samples : null;
	var pong = 0.0;

	if (this.lastTime) {
		var dt = time - this.lastTime;
		if (dt > this.maxDt || dt <= 0) {
			dt = this.dt;
		} else if (dt > 0.01 && samples != null) {
			samples.dt = dt;
			var lag = time - samples.next;
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

		var ping = (samples != null) ? perf.now() : 0.0;
		var pingTick = ping;

		// Invoke fixed updates
		var fdt = (this.fdtEnabled) ? this.fdt : dt;
		var tail = Math.min(this.tail + dt, this.maxFdt * this.scale);
		while (tail >= fdt) {
			tail -= fdt;
			var fixedUpdates = Pool.calls.fixedUpdate;
			for (i = 0, l = fixedUpdates.length; i < l; i++) {
				if (fixedUpdates[i].enabled) {
					fixedUpdates[i].fixedUpdate(fdt);
				}
			}
			var simulates = Pool.calls.simulate;
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
		var updates = Pool.calls.update;
		for (i = 0, l = updates.length; i < l; i++) {
			if (updates[i].enabled) {
				updates[i].update(dt);
			}
		}

		Pool.free();

		// Invoke postUpdate
		var postUpdates = Pool.calls.postUpdate;
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
		var preRenders = Pool.calls.preRender;
		for (i = 0, l = preRenders.length; i < l; i++) {
			if (preRenders[i].enabled) {
				preRenders[i].preRender(dt);
			}
		}

		var ctx = this.renderer.save();
		// Invoke render
		var renders = Pool.calls.render;
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
		this.emit('onTimeEnd', samples);
	}

	if (this.running) {
		if (this.rfa) {
			raFrame(this.tickBound);
		} else {
			perf.nextTick(this.tickBound);
		}
	}
};

// Singleton
var engine = new Engine();

// Debugging hooks
if ('console' in window) {
	console.m = {
		pool: function(flush) {
			Pool.dump(flush);
			return null;
		},
		profile: function(frames) {
			if (frames == null) {
				frames = 60;
			}
			engine.debug.profile = frames;
			return null;
		},
		step: function() {
			engine.debug.step = !engine.debug.step;
			return null;
		}
	};
}

module.exports = engine;