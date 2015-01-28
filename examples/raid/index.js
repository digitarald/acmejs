'use strict';

var Engine = acmejs.Engine;

Engine.init(document.getElementById('game-1'));

var Vec2 = acmejs.Vec2;
var Renderer = acmejs.Renderer;
var Color = acmejs.Color;
var Random = acmejs.Random;
var Tweens = acmejs.Tweens;
var Entity = acmejs.Entity;
var Prefab = acmejs.Prefab;
var Prefab = acmejs.Prefab;
var Component = acmejs.Component;
var Pool = acmejs.Pool;
var Sprite = acmejs.Sprite;
var Border = acmejs.Border;
var Collider = acmejs.Collider;
var Kinetic = acmejs.Kinetic;
var Particle = acmejs.Particle;

Engine.renderer = new Renderer(
	Engine.element.getElementsByClassName('game-canvas')[0],
	Vec2(480, 320)
);
Engine.renderer.color = Color.black;
Engine.createComponent('spriteCanvasRenderer');

function GameController() {
	Component.call(this);
	this.cooldown = 0.0;
}

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
		this.cooldown -= dt;
		if (this.cooldown > 0 || Enemy.prototype.pool.allocated > 40) {
			return;
		}
		this.cooldown = Random.rand(0.2, 1.5);
		var enemy = this.root.createChild('enemy', {
			transform: {
				position: Vec2(475, Random.rand(50, 270))
			}
		});
	}
};

Component.create(GameController, 'gameController');

/**
 * Component: Hero
 *
 * Playable character.
 */

function Hero() {
	Component.call(this);
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
		axis = Engine.components.input.axis;
		pos = this.components.transform.position;
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
		var input = Engine.components.input;
		Vec2.sub(input.position, this.components.transform.position, this.aimNormal);
		var axis = input.axis;

		// Walk animation
		var spriteTween = this.components.spriteTween;
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

		var projectile = Prefab.create('projectile', this.root);
		projectile.components.transform.compose(this.components.transform.position);
		projectile.components.kinetic.velocity = vel;
		debugger;

		this.cooldown = 0.05;

		/*
	var projectile = Prefab.create('projectile', this.root, {
		transform: {
			position: this.transform.position
		},
		kinetic: {
			velocity: vel
		}
	});
	*/
		return true;
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


Component.create(Hero, 'hero');

new Prefab('hero', {
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

function Health() {
	Component.call(this);
}

var damageEvent = {
	damage: 0.0
};
var particleVelocity = Vec2();

Health.prototype = {
	attributes: {
		health: 100,
		current: 100
	},

	hit: function(entity, amount) {
		var velocity = entity.components.kinetic.velocity;
		var speed = Vec2.len(velocity);

		var i = Random.rand(15, 25) | 0;
		while (i--) {
			var pos = entity.components.transform.position;
			var direction = Random.chance(0.2) ? -0.2 : 1;
			var impulse = Vec2.scale(velocity, direction * 15, particleVelocity);
			Vec2.variant(impulse, speed * 2);

			var particle = this.root.createChild('particle', {
				particle: {
					lifetime: Random.rand(0.5, 2),
					alpha: Random.rand(0.7, 1),
					radius: Random.rand(1, 4),
					shrink: Tweens.quadIn,
					fade: null
				},
				spriteTween: {
					asset: particleHit
				},
				kinetic: {
					force: impulse
				},
				transform: {
					position: pos
				}
			});
		}

		damageEvent.damage = amount;
		this.entity.emit('onHealthDamage', damageEvent);
		if ((this.current -= amount) < 0) {
			this.entity.emit('onDead');
		}
	}
};

Component.create(Health, 'health');

/**
 * Component: Enemy
 */

function Enemy() {
	Component.call(this);
}

Enemy.prototype = Object.create(Component.prototype);

Enemy.prototype.type = 'enemy';

Enemy.prototype.update = function() {
	var transform = this.components.transform;
	if (transform.position[0] < 25) {
		transform.position[0] = 550;
	}
};

Enemy.prototype.onHealthDamage = function() {
	this.components.kinetic.applyForce(Vec2(Random.rand(300, 700), 0));
};

Enemy.prototype.onDead = function() {
	this.entity.destroy();
};

Enemy.sheet = new Sprite.Sheet({
	sprites: new Sprite.Asset('./assets/skeleton.png'),
	size: Vec2(32, 32),
	speed: 0.15,
	sequences: defaultSequence
});

Enemy.prototype.pool = new Pool(Enemy);

new Prefab('enemy', {
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
		drag: 0.999,
		friction: 0,
		continuousForce: Vec2(-50, 0),
		maxVelocity: 60,
		maxForce: 0
	},
	boundsDebug: null,
	health: null,
	spriteTween: {
		asset: Enemy.sheet,
		sequence: 'walkW'
	},
	enemy: null
});

/**
 * Component: Projectile
 */

function Projectile() {
	Component.call(this);
	this.lastPos = Vec2();
	this.color = Color.rgba(Color.white);
	debugger;
}

Projectile.prototype = Object.create(Component.prototype);

Projectile.prototype.type = 'projectile';

Projectile.prototype.create = function() {
	Vec2.copy(this.lastPos, this.components.transform.position);
};

Projectile.prototype.render = function(ctx) {
	var transform = this.components.transform;
	var pos = transform.position;
	if (Vec2.isZero(this.lastPos, Vec2.zero)) {
		Vec2.copy(this.lastPos, transform.position);
		return;
	}
	ctx.save();
	ctx.strokeStyle = this.color;
	ctx.lineWidth = 2;
	ctx.lineCap = 'butt';
	ctx.beginPath();
	ctx.moveTo(this.lastPos[0] | 0, this.lastPos[1] | 0);
	ctx.lineTo(pos[0] | 0, pos[1] | 0);
	ctx.stroke();
	ctx.restore();
	Vec2.copy(this.lastPos, pos);
};

Projectile.prototype.onTrigger = function(event) {
	event.entity.components.health.hit(this.entity, Random.rand(10, 15));
	this.entity.destroy();
};

var particleHit = Particle.generateSpriteSheet({
	color: Color(220, 20, 60),
	shape: 'rect',
	center: 1
});

Projectile.prototype.pool = new Pool(Projectile);

new Prefab('projectile', {
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