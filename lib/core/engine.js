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
	this.fdt = 1 / 30;
	this.minDt = 1 / 60;
	this.maxDt = 0.5;
	this.maxFdt = this.fdt * 5;
	this.scale = 1;

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

	var engine = this;
	this.tickBound = function Engine_tick(now) {
		return engine.tick(now);
	};

	this.element = null;
	this.scene = null;
}

Engine.prototype = Object.create(Entity.prototype);

Engine.prototype.type = 'engine';

Engine.prototype.init = function(element) {
	this.element = element;

	// Late require. TODO: Justify!
	require('./console');
	// this.createComponent('console');

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
		this.triggerAll('onSceneEnd', this.scene);
		if (soft) {
			this.scene.enable(false, true);
		} else {
			this.scene.destroy();
		}
	}
	this.scene = scene;
	this.triggerAll('onSceneStart', scene);
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
	this.triggerAll('onEngineStart');
	raFrame(this.tickBound);
};

Engine.prototype.pause = function() {
	if (!this.running) {
		return;
	}
	this.triggerAll('onEnginePause');
	this.running = false;
};

/**
 * Game loop tick, called by requestAnimationFrame
 *
 * @param {Number} time Delta time
 */
Engine.prototype.tick = function(time) {
	// Time value in seconds
	time = (time && time < 1e12 ? time : perf.now()) / 1000;
	this.time = time;

	if (this.running) {
		raFrame(this.tickBound);
	}

	var debug = this.debug;
	var samples = this.samples;
	var fdt = this.fdt;

	if (this.lastTime) {
		var dt = time - this.lastTime;
		if (dt > this.maxDt) {
			dt = this.minDt;
		} else if (dt > 0.01) {
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

		var ping = perf.now();
		var pingTick = ping;

		// Invoke fixed updates
		var tail = Math.min(this.tail + dt, this.maxFdt * this.scale);
		while (tail >= fdt) {
			tail -= fdt;
			Pool.call('fixedUpdate', fdt);
			Pool.call('simulate', fdt);
		}
		this.tail = tail;

		var pong = perf.now();
		samples.fixedUpdate = pong - ping;
		ping = pong;

		// Invoke update
		Pool.call('update', dt);

		Pool.dealloc();

		Pool.call('postUpdate', dt);

		pong = perf.now();
		samples.update = pong - ping;
		ping = pong;

		// Invoke render
		Pool.call('preRender', dt);

		var ctx = this.renderer.save();
		Pool.call('render', ctx);
		this.renderer.restore();

		pong = perf.now();
		samples.render = pong - ping;
		samples.tick = pong - pingTick;

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
	samples.next = Math.max(time + 1 / 60, perf.now() / 1000);

	this.trigger('onTimeEnd', samples);
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