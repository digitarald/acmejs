'use strict';

var acmejs = require('acmejs');

var Engine = acmejs.Engine;

Engine.init(document.getElementById('game-1'));

var Vec2 = acmejs.Math.Vec2;
var Renderer = acmejs.Renderer;
var Color = acmejs.Color;

Engine.renderer = new Renderer(
	Engine.element.getElementsByClassName('game-canvas')[0],
	Vec2(480, 320)
);
Engine.renderer.color = Color.black;

var Entity = acmejs.Entity;
var Component = acmejs.Component;
var Pool = acmejs.Pool;
var Sprite = acmejs.Sprite;
var Border = acmejs.Border;
var Collider = acmejs.Collider;
var Kinetic = acmejs.Kinetic;
var Particle = acmejs.Particle;


function GameController() {}

GameController.prototype = {

	create: function() {
		this.root.createChild('hero', {
			transform: {
				position: Vec2(20, 160)
			}
		});
		this.cooldown = 0;
	},

	postUpdate: function(dt) {
		if ((this.cooldown -= dt) > 0) {
			return;
		}
		this.cooldown = Math.rand(2.5, 4.5);
		var enemy = this.root.createChild('enemy', {
			transform: {
				position: Vec2(475, Math.rand(50, 270))
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
		pos = this.transform.position;
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
		Vec2.sub(input.position, this.transform.position, this.aimNormal);
		var axis = input.axis;

		// Walk animation
		var spriteTween = this.spriteTween;
		if (Vec2.len(axis) > 0) {
			spriteTween.goto('walkE').play();
		} else if (!spriteTween.paused) {
			spriteTween.pause().goto('walkE');
		}

		// Fire a bullet
		this.cooldown -= dt;
		if (input.touchState) {
			this.fire();
		}
	},

	fire: function() {
		if (this.cooldown > 0) {
			return false;
		}
		var angle = Vec2.rad(this.aimNormal);
		var vel = Vec2.rotate(Vec2(400, 0), angle);
		Vec2.variantLen(vel, 10);
		Vec2.variantRad(vel, Math.PI / 64);

		var projectile = Entity.Prefab.create('projectile', this.root);
		Vec2.copy(projectile.transform.position, this.transform.position);
		Vec2.copy(projectile.kinetic.velocity, vel);

		this.cooldown = 0.05;

		// var projectile = Entity.Prefab.create('projectile', this.root, {
		// 	transform: {
		// 		position: this.transform.position
		// 	},
		// 	kinetic: {
		// 		velocity: vel
		// 	}
		// });
		return true;
	}

	/*
	render: function(ctx) {
		var pos = this.transform.position;
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
	*/
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
		this.entity.trigger('onDamage', amount);
		if ((this.current -= amount) < 0) {
			this.entity.trigger('onDead');
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
		if (this.transform.position[0] < 25) {
			this.transform.position[0] = 550;
		}
	},

	onDamage: function() {
		this.kinetic.applyForce(Vec2(-500, 0));
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
		Vec2.copy(this.lastPos, this.transform.position);
	},

	render: function(ctx) {
		var pos = this.transform.position;
		if (Vec2.eq(this.lastPos, Vec2.zero)) {
			Vec2.copy(this.lastPos, this.transform.position);
			return;
		}
		ctx.save();
		ctx.strokeStyle = Color.rgba(Color.white);
		ctx.lineWidth = 2;
		ctx.lineCap = 'butt';
		ctx.beginPath();
		ctx.moveTo(this.lastPos[0] | 0, this.lastPos[1] | 0);
		ctx.lineTo(pos[0] | 0, pos[1] | 0);
		ctx.stroke();
		ctx.restore();
		Vec2.copy(this.lastPos, pos);
	},

	onTrigger: function(data) {
		data.entity.health.hit(this.entity, Math.rand(10, 15));
		this.entity.destroy();

		var speed = Vec2.len(this.kinetic.velocity);

		var i = Math.rand(15, 25) | 0;
		while (i--) {
			var pos = this.transform.position;
			var direction = Math.chance(0.2) ? -0.2 : 1;
			var impulse = Vec2.scale(this.kinetic.velocity, direction * 15,particleVelocity);
			Vec2.variant(impulse, speed * 2);

			this.root.createChild('particle', {
				particle: {
					lifetime: Math.rand(0.5, 2),
					alpha: Math.rand(0.7, 1),
					radius: Math.rand(1, 4),
					shrink: Math.quadIn,
  				fade: null,
					sprite: Projectile.particleHit
				},
				kinetic: {
					force: impulse
				},
				transform: {
					position: pos
				}
			});
		}
	}

};

var particleVelocity = Vec2();
Projectile.particleHit = Particle.generateSprite({
	color: Color(220, 20, 60),
	shape: 'rect',
	center: 1
});

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
		maxForce: 0,
		fast: true
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

Engine.gameScene = Entity.create(null, {
	gameController: null
});

Engine.play(Engine.gameScene);
