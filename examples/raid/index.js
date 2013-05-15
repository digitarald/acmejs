'use strict';

var Engine = require('../../lib/core/engine');

Engine.init(document.getElementById('game-1'));

var Vec2 = require('../../lib/core/math').Vec2;
var Renderer = require('../../lib/core/renderer');

Engine.renderer = new Renderer(
	Engine.element.getElementsByClassName('game-canvas')[0],
	Vec2(480, 320)
);

var Entity = require('../../lib/core/entity');
var Component = require('../../lib/core/component');
var Pool = require('../../lib/core/pool');
var Color = require('../../lib/core/color');
var Sprite = require('../../lib/core/sprite');
var Transform = require('../../lib/core/transform');
var Border = require('../../lib/core/border');
var Collider = require('../../lib/core/collider');
var Kinetic = require('../../lib/core/kinetic');


function GameController() {}

GameController.prototype = {

	create: function() {
		this.root.addChild('hero', {
			transform: {
				pos: Vec2(20, 160)
			}
		});
		this.cooldown = 0;
	},

	postUpdate: function(dt) {
		if ((this.cooldown -= dt) > 0) {
			return;
		}
		this.cooldown = Math.rand(2.5, 4.5);
		var enemy = this.root.addChild('enemy', {
			transform: {
				pos: Vec2(475, Math.rand(50, 270))
			}
		});
	}

};

new Component('gameController', GameController);

/**
 * Component: Hero
 *
 * Playable character.
 */
function Hero() {
	this.aimNormal = Vec2();
}

Hero.prototype = {

	create: function() {
		this.cooldown = 0;
		this.laserLength = 200;
		this.laserColor = Color(255, 0, 0, 0.6);
	},

	fixedUpdate: function() {
		var axis, pos, speed;
		axis = Engine.input.axis;
		pos = this.transform.pos;
		speed = 1;
		if (axis[1] < 0) {
			pos[1] -= speed;
		} else if (axis[1] > 0) {
			pos[1] += speed;
		}
		if (axis[0] < 0) {
			pos[0] -= speed;
		} else if (axis[0] > 0) {
			pos[0] += speed;
		}
	},

	update: function(dt) {
		var input = Engine.input;
		Vec2.sub(input.pos, this.transform.pos, this.aimNormal);
		var axis = input.axis;

		// Walk animation
		var spriteTween = this.spriteTween;
		if (Vec2.len(axis) > 0) {
			spriteTween.goto('walkE').play();
		} else if (!spriteTween.paused) {
			spriteTween.pause().goto('walkE');
		}

		// Fire a bullet
		if ((this.cooldown -= dt) < 0 && input.touchState) {
			var angle = Vec2.rad(this.aimNormal);
			var vel = Vec2.rot(Vec2(400, 0), angle);

			var projectile = Entity.Prefab.alloc('projectile', this.root, {
				transform: {
					pos: this.transform.pos
				},
				kinetic: {
					velocity: vel
				}
			});
			this.cooldown = 0.1;
		}
	},

	render: function(ctx) {
		var pos = this.transform.pos;
		var target = Vec2();

		Vec2.norm(this.aimNormal, null, this.laserLength);
		Vec2.add(pos, this.aimNormal, target);
		Vec2.add(pos, this.aimNormal, target);

		ctx.save();
		ctx.strokeStyle = Color.rgba(this.laserColor);
		ctx.beginPath();
		ctx.moveTo(pos[0] | 0, pos[1] | 0);
		ctx.lineTo(target[0] | 0, target[1] | 0);
		ctx.stroke();
		ctx.restore();
	}

};


var defaultSequence = {
	walkS: {
		frames: [0, 1, 2, 1],
		next: 'walkS'
	},
	walkW: {
		frames: [3, 4, 5, 4],
		next: 'walkW'
	},
	walkN: {
		frames: [9, 10, 11, 10],
		next: 'walkN'
	},
	walkE: {
		frames: [6, 7, 8, 7],
		next: 'walkE'
	}
};

Hero.sheet = new Sprite.Sheet({
	sprites: new Sprite.Asset('./assets/hero.png'),
	size: Vec2(32, 32),
	speed: 0.15,
	sequences: defaultSequence
});

new Component('hero', Hero);

new Entity.Prefab('hero', {
	transform: null,
	spriteTween: {
		asset: Hero.sheet,
		sequence: 'walkS'
	},
	bounds: {
		radius: 16,
		shape: 'circle'
	},
	border: null,
	hero: null
});


/**
 * Component: Health
 */
function Health() {}

Health.prototype = {

	attributes: {
		health: 100,
		current: 100
	},

	create: function(attributes) {
		this.health = attributes.health;
		this.current = attributes.current;
	},

	hit: function(source, amount) {
		this.entity.pub('onDamage', amount);
		if ((this.current -= amount) < 0) {
			this.entity.pub('onDead');
			this.entity.destroy();
		}
	}

};

new Component('health', Health);

/**
 * Component: Enemy
 */
function Enemy() {}

Enemy.prototype = {

	update: function() {
		if (this.transform.pos[0] < 25) {
			this.transform.pos[0] = 550;
		}
	},

	onDamage: function() {
		this.kinetic.applyImpulse(Vec2(-500, 0));
	},

	onDead: function() {
		this.entity.destroy();
	}

};

Enemy.sheet = new Sprite.Sheet({
	sprites: new Sprite.Asset('./assets/skeleton.png'),
	size: Vec2(32, 32),
	speed: 0.15,
	sequences: defaultSequence
});

new Component('enemy', Enemy);

new Entity.Prefab('enemy', {
	transform: null,
	bounds: {
		radius: 14,
		shape: 'circle'
	},
	collider: {
		trigger: true
	},
	kinetic: {
		mass: 1,
		drag: 1,
		friction: 0,
		force: Vec2(-100, 0)
	},
	boundsDebug: null,
	health: null,
	spriteTween: {
		asset: Enemy.sheet,
		sequence: 'walkW'
	}
});

/**
 * Component: Projectile
 */
function Projectile() {
	this.lastPos = Vec2();
}

Projectile.prototype = {

	create: function() {
		Vec2.copy(this.lastPos, this.transform.pos);
	},

	render: function(ctx) {
		var pos = this.transform.pos;
		ctx.save();
		ctx.strokeStyle = Color.rgba(Color.white);
		ctx.beginPath();
		ctx.moveTo(this.lastPos[0] | 0, this.lastPos[1] | 0);
		ctx.lineTo(pos[0] | 0, pos[1] | 0);
		ctx.stroke();
		ctx.restore();
		Vec2.copy(this.lastPos, pos);
	},

	onTrigger: function(entity) {
		entity.health.hit(this.entity, Math.rand(10, 15));
		this.entity.destroy();
	}

};

new Component('projectile', Projectile);

new Entity.Prefab('projectile', {
	transform: null,
	bounds: {
		shape: 'circle',
		radius: 2
	},
	kinetic: {
		mass: 0.1,
		drag: 1,
		friction: 0,
		maxVelocity: 0,
		maxForce: 0
	},
	collider: {
		include: 'health',
		trigger: true
	},
	border: {
		mode: 'kill'
	},
	projectile: null
});

Engine.gameScene = Entity.alloc(null, {
	gameController: null
});

Engine.play(Engine.gameScene);
