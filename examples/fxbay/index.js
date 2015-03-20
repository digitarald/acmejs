'use strict';

var Vec2 = acmejs.Vec2;
var random = acmejs.random;
var Color = acmejs.Color;
var Context = acmejs.Context;
var Entity = acmejs.Entity;
var Component = acmejs.Component;
var Particle = acmejs.Particle;
var Renderer = acmejs.Renderer;
var SpriteAsset = acmejs.SpriteAsset;
var SpriteSheet = acmejs.SpriteSheet;

Context.init(document.getElementById('game-1'));

Context.renderer = new Renderer(Context.element.getElementsByClassName('game-canvas')[0], Vec2(800, 600));
Context.renderer.color = Color.black;
Context.renderer.noContext = true;
Context.createComponent('pixiSpriteSystem');
Context.createComponent('physics');

function GameController() {
	Component.call(this);
	this.cooldown = 0.0;
}

GameController.prototype = {
	create: function() {
		this.cooldown = 0;
	},

	postUpdate: function(dt) {
		this.cooldown -= dt;
		if (this.cooldown > 0 || Entity.registry.allocated > 10) {
			return;
		}
		this.cooldown = random(0.15, 1.2) / 4;
		var enemy = this.root.createChild('ship', {
			transform: {
				position: Vec2.variantCirc(Vec2(400, 300), 300)
			}
		});
		enemy.components.body.applyForce(Vec2.variantCirc(Vec2(0, 0), 1000));
	}
};

Component.create(GameController, 'gameController');

var shipAsset = new SpriteAsset('./assets/ship.png');

Entity.createPrefab('ship', {
	transform: null,
	body: {
		mass: 0.1,
		maxVelocity: 0,
		maxForce: 0
	},
	bounds: {
		shape: 'circle',
		radius: 20
	},
	spriteTween: {
		asset: shipAsset
	},
	boid: null,
	border: {
		mode: 'mirror'
	}
});

Context.gameScene = Entity.create(null, {
	gameController: null
});

Context.play(Context.gameScene);
