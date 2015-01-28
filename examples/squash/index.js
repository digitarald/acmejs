'use strict';

var acmejs = require('acmejs');

Math.random.seed = 15;

var Engine = acmejs.Engine;

Engine.init(document.getElementById('game-1'));

var Renderer = acmejs.Renderer;
var Vec2 = acmejs.Vec2;

Engine.renderer = new Renderer(Engine.element.getElementsByClassName('game-canvas')[0], Vec2(480, 320));

var Entity = acmejs.Entity;
var Component = acmejs.Component;
var Pool = acmejs.Pool;
var Color = acmejs.Color;
var Sprite = acmejs.Sprite;
var Transform = acmejs.Transform;
var Bounds = acmejs.Bounds;
var Border = acmejs.Border;
var Particle = acmejs.Particle;
var Collider = acmejs.Collider;
var Kinetic = acmejs.Kinetic;

var Heightmap = acmejs.Heightmap;


function GameController() {}

GameController.prototype = {

	create: function() {
		var terrain = this.entity.createChild('terrain', {
			terrain: {
			}
		});
	},

	setupBug: function() {

	}

};

new Component('gameController', GameController);



function Terrain() {
}

Terrain.prototype = {

	attributes: {
	},

	create: function(attributes) {
		var size = this.size = 128;
		this.heights = new Heightmap(size, 2);
		this.sprite = new Sprite.Asset(this, Vec2(size, size), 4);
	},

	onRepaint: function(ctx, sprite) {
		var colors = [
			Color(44, 131, 235),
			Color(54, 141, 255),
			Color(146, 180, 255),
			Color(255, 231, 54),
			Color(100, 200,  50),
			Color(118, 118,  118),
			Color(95, 95,  95),
			Color(220, 230, 245)
		];
		var heights = this.heights;
		heights.add(1, 0.85);
		heights.add(10, 0.10);
		heights.add(50, 0.05);
		for (var i = 0; i < 2; i++) {
			heights.erode(4);
		}
		heights.smoothen(4);

		var size = sprite.size;
		var maxSize = this.size;
		var color = Color();

		for (i = 0; i < maxSize; i++) {
			for (var j = 0; j < maxSize; j++) {
				var height = heights.get(i, j);

				// Color.lerp(Color.white, Color.black, height, false, color);
				Color.lerpList(color, colors, height); // Math.quadInOut

				ctx.fillStyle = Color.rgba(color);
				ctx.fillRect(i, j, 1, 1);
			}
		}
		// ctx.fillStyle = Color.rgba(Color.black);
		// ctx.fillRect(0, 0, size[0], size[1]);

		sprite.sample();
	},

	render: function(ctx) {
		// console.log(this.sprite.toString());
		// debugger;
		this.sprite.draw(ctx, null, Vec2.topLeft);
	}

};

new Component('terrain', Terrain);

new Entity.Prefab('terrain', {
	terrain: null
});


function Bug() {
}

Bug.prototype = {

	layer: 1,

	attributes: {
		player: 0,
		color: Color(),
		field: null
	},

	create: function(attributes) {
	},

	update: function(dt) {

	}

};

new Component('bug', Bug);

new Entity.Prefab('bug', {
	transform: null,
	bounds: {
		shape: 'circle',
		radius: 15
	},
	kinetic: {
		mass: 1,
		drag: 0.995,
		maxVelocity: 900
	},
	bug: null
});


Engine.gameScene = Entity.create(null, {
	gameController: null
});

Engine.play(Engine.gameScene);
