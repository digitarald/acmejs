'use strict';

var Vec2 = acmejs.Vec2;
var Random = acmejs.Random;
var Mathf = acmejs.Mathf;
var Tweens = acmejs.Tweens;
var Color = acmejs.Color;
var Engine = acmejs.Engine;
var Entity = acmejs.Entity;
var Prefab = acmejs.Prefab;
var Component = acmejs.Component;
var Pool = acmejs.Pool;
var Sprite = acmejs.Sprite;
var Particle = acmejs.Particle;

Engine.init(document.getElementById('game-1'));

var Renderer = acmejs.Renderer;
Engine.renderer = new Renderer(Engine.element.getElementsByClassName('game-canvas')[0], Vec2(480, 320));
Engine.renderer.color = Color.black;
Engine.createComponent('spriteCanvasRenderer');

/**
 * WhiteScene
 * @extends Component
 */
function WhiteScene() {
	Component.call(this);
	this.started = 0;
	this.velocity = 0;
	this.position = 0;
	this.grow = true;
}

var force = Vec2();

WhiteScene.prototype = {
	create: function() {
		this.velocity = 25;
		this.position = 10;
		this.grow = true;
		var gui = Engine.components.sceneController.gui.addFolder('whiteScene');
		gui.add(this, 'velocity', 0, 100);
		gui.add(this, 'position', 0, 100);
		gui.add(this, 'grow');
		this.gui = gui;
	},

	dealloc: function() {
		Engine.sceneController.gui.remove(this.gui);
		this.gui = null;
	},

	update: function(dt) {
		var input = Engine.components.input;
		if (input.touchState == 'began') {
			var emitter = this.entity.createChild('particleEmitter', {
				transform: {
					position: input.position
				},
				particleEmitter: {
					prefab: 'spark'
				}
			});
		}
		// if (input.touchState || input.keys.space) {
		// 	var factor = (this.grow) ? ((this.started += dt) + 1) : 1;
		// 	var i = 100 * dt * factor | 0;
		// 	var speed = 10;
		// 	while (i--) {
		// 		var spark = Prefab.create(this.entity, 'spark');
		// 		Vec2.variantCirc(Vec2.zero, speed * factor * this.velocity, impulse);
		// 		spark.components.kinetic.applyForce(impulse);
		// 		Vec2.variantCirc(input.position, this.position,
		// 			spark.components.transform.position);
		// 		spark.components.particle.radius = Random.rand(2, 15);
		// 	}
		// } else if (this.started) {
		// 	this.started = 0;
		// }
	}
};

Component.create(WhiteScene, 'whiteScene');

new Prefab('spark', {
	transform: null,
	kinetic: {
		mass: 0.1,
		fast: true,
		maxVelocity: 200,
		maxForce: 0
	},
	particle: {
		lifetime: 4,
		lifetimeVariance: 2,
		fade: null,
		shrink: null
	},
	spriteTween: {
		asset: Particle.generateSpriteSheet({
			color: Color(164, 164, 164),
			shape: 'rect'
		})
	},
	jitter: null
});

function ParticleEmitter() {
	Component.call(this);
	this.amount = 0;
	this.lifetime = 0.0;
	this.prefab = '';
	this.positionVariance = 0.0;
	this.force = 0.0;
	this.forceVariance = 0.0;
	this.radius = 0.0;
	this.radiusVariance = 0.0;
	this.age = 0.0;
}

ParticleEmitter.prototype = {
	attributes: {
		amount: 100,
		lifetime: 5,
		prefab: 'particle',
		positionVariance: 10,
		force: 10,
		forceVariance: 5,
		radius: 8,
		radiusVariance: 5
	},

	create: function() {
		this.age = 0.0;
	},

	update: function(dt) {
		this.age += dt;
		// if (this.age > dt) {
		if (this.age > this.lifetime) {
			if (this.entity.firstChild == null) {
				this.entity.destroy();
			}
			return;
		}
		// var l = dt * this.amount | 0;
		var l = 1;
		for (var i = 0; i < l; i++) {
			var particle = this.entity.createChild(this.prefab);
			Vec2.variantCirc(Vec2.zero, this.force, force);
			particle.components.kinetic.applyForce(force);
			Vec2.variantCirc(Vec2.zero, this.positionVariance,
				particle.components.transform.position);
			particle.components.particle.radius = this.radius +
				Random.rand(-this.radiusVariance, this.radiusVariance);
		}
	}
};

Component.create(ParticleEmitter, 'particleEmitter');

new Prefab('particleEmitter', {
	transform: null,
	particleEmitter: null
});

/**
 * FireScene
 */
function FireScene() {
	Component.call(this);
}

FireScene.prototype = {
	create: function() {
		this.velocity = 25;
		var gui = Engine.components.sceneController.gui.addFolder('fireScene');
		gui.add(this, 'velocity', 0, 100);
		this.gui = gui;
	},

	dealloc: function() {
		Engine.sceneController.gui.remove(this.gui);
		this.gui = null;
	}
};

Component.create(FireScene, 'fireScene');

/**
 * SceneController
 */
function SceneController() {
	Component.call(this);
}

SceneController.prototype = {
	create: function() {
		this.sceneId = 'white';
		this.running = true;

		var controller = this;

		var gui = new dat.GUI();
		gui.add(this, 'sceneId', ['white', 'fire', 'explosion']).onFinishChange(function() {
			controller.changeScene();
		});
		gui.add(this, 'running').onFinishChange(function(running) {
			if (running) {
				Engine.start();
			} else {
				Engine.pause();
			}
		});
		gui.close();
		this.gui = gui;

		this.changeScene();
	},

	changeScene: function() {
		var component = this.sceneId + 'Scene';
		var attributes = {};
		attributes[component] = null;

		var entity = Entity.create(this.root, attributes);
		console.log(entity);
		Engine.play(entity);
	}
};

Component.create(SceneController, 'sceneController');

// Attaching the controller starts the first scene
Engine.createComponent('sceneController');
