'use strict';

var acmejs = require('acmejs');

var Vec2 = acmejs.Math.Vec2;
var Color = acmejs.Color;
var Engine = acmejs.Engine;

Engine.init(document.getElementById('game-1'));

var Renderer = acmejs.Renderer;
Engine.renderer = new Renderer(Engine.element.getElementsByClassName('game-canvas')[0], Vec2(480, 320));
Engine.renderer.color = Color.black;

var Entity = acmejs.Entity;
var Component = acmejs.Component;
var Particle = acmejs.Particle;


function WhiteScene() {
	this.started = 0;
}

var vel = Vec2();

WhiteScene.prototype = {

	create: function() {
		this.velocity = 25;
		this.position = 10;
		this.grow = true;
		var gui = this.gui = Engine.sceneController.gui.addFolder('whiteScene');
		gui.add(this, 'velocity', 0, 100);
		gui.add(this, 'position', 0, 100);
		gui.add(this, 'grow');
	},

	dealloc: function() {
		Engine.sceneController.gui.remove(this.gui);
		this.gui = null;
		Component.prototype.dealloc.call(this);
	},

	update: function(dt) {
		var input = Engine.input;
		if (input.touchState || input.keys.space) {
			var factor = (this.grow) ? ((this.started += dt) + 1) : 1;
			var i = 100 * dt * factor | 0;
			var speed = 10;
			while (i--) {
				var spark = SparkPrefab.create(this.root);
				Vec2.set(vel, Math.rand(-speed, speed), Math.rand(-speed, speed));
				Vec2.scale(vel, factor * this.velocity);
				spark.kinetic.applyForce(vel);
				Vec2.variantCirc(input.position, this.position, null, spark.transform.position);
				spark.particle.radius = Math.rand(2, 15);
			}
		} else if (this.started) {
			this.started = 0;
		}
	}

};

new Component('whiteScene', WhiteScene);


var SparkPrefab = new Entity.Prefab({
	transform: null,
	kinetic: {
		mass: 0.1,
		fast: true,
		maxVelocity: 200,
		maxForce: 0
	},
	particle: {
		lifetime: 4,
		lifetimeVariant: 2,
		composite: 'lighter',
		fade: Math.quadIn,
		shrink: Math.quadIn,
		// color: Color(164, 164, 164)
		sprite: Particle.generateSprite(Color(164, 164, 164), 1)
	},
	jitter: {
		// factor: 0.5,
		// force: 2000
	}
});


function FireScene() {}

FireScene.prototype = {

	create: function() {
		this.velocity = 25;
		var gui = this.gui = Engine.sceneController.gui.addFolder('fireScene');
		gui.add(this, 'velocity', 0, 100);
	},

	dealloc: function() {
		this.gui.destroy();
		Component.prototype.dealloc.call(this);
	},

	update: function(dt) {
	}

};

new Component('fireScene', FireScene);


function SceneController() {}

SceneController.prototype = {

	create: function() {
		this.sceneId = 'white';
		this.running = true;

		var controller = this;

		var gui = this.gui = new dat.GUI();
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

		this.changeScene();
	},

	changeScene: function() {
		var component = this.sceneId + 'Scene';
		console.log('changeScene', component);
		var attributes = {};
		attributes[component] = null;

		var entity = Entity.create(this.root, attributes);
		Engine.play(entity);
	}

};

new Component('sceneController', SceneController);

// Attaching the controller starts the first scene
Engine.createComponent('sceneController');

