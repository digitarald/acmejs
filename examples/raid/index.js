var Context = acmejs.Context;

Context.init(document.getElementById('game-1'));

var Vec2 = acmejs.Vec2;
var Renderer = acmejs.Renderer;
var Color = acmejs.Color;
var random = acmejs.random;
var chance = acmejs.chance;
var Tweens = acmejs.Tweens;
var Entity = acmejs.Entity;
var Component = acmejs.Component;
var Registry = acmejs.Registry;
var SpriteAsset = acmejs.SpriteAsset;
var SpriteSheet = acmejs.SpriteSheet;
var Border = acmejs.Border;
var Collider = acmejs.Collider;
var Body = acmejs.Body;
var Particle = acmejs.Particle;

Context.renderer = new Renderer(
	Context.element.getElementsByClassName('game-canvas')[0],
	Vec2(480, 320)
);
Context.renderer.color = Color.black;
Context.renderer.noContext = true;
Context.createComponent('pixiSpriteSystem');

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
		if (this.cooldown > 0 || Enemy.prototype.registry.allocated > 250) {
			return;
		}
		this.cooldown = random(0.15, 1.2) / 4;
		var enemy = this.root.createChild('enemy', {
			transform: {
				position: Vec2(475, random(50, 270))
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
		var axis = Context.$input.axis;
		var pos = this.$transform.position;
		var speed = 1;
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
		var input = Context.$input;
		Vec2.sub(input.position, this.$transform.position, this.aimNormal);
		var axis = input.axis;

		// Walk animation
		var spriteTween = this.$spriteTween;
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
			return;
		}
		var angle = Vec2.rad(this.aimNormal);
		var velocity = Vec2.rotate(Vec2(400, 0), angle);
		Vec2.variantLen(velocity, 10);
		Vec2.variantRad(velocity, Math.PI / 64);

		var projectile = this.root.createChild('projectile');
		projectile.$transform.translateTo(this.$transform.position);
		projectile.$body.velocity = velocity;

		this.cooldown = 0.05;
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

Hero.sheet = new SpriteSheet({
	sprites: new SpriteAsset('./assets/hero.png'),
	size: Vec2(32, 32),
	speed: 0.15,
	sequences: defaultSequence
});

Component.create(Hero, 'hero');

Entity.createPrefab('hero', {
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
		var position = entity ? entity.$transform.position : this.$transform.position;
		var velocity = entity ? entity.$body.velocity : Vec2(100, 0);
		var speed = Vec2.len(velocity);

		var i = random(15, 25) | 0;
		while (i--) {
			var direction = chance(0.3) ? -0.2 : 1;
			var impulse = Vec2.scale(velocity, direction * 15, particleVelocity);
			Vec2.variantCirc(impulse, speed * 10);

			var particle = this.root.createChild('particle', {
				particle: {
					lifetime: random(0.5, 2),
					alpha: random(0.7, 1),
					radius: random(1, 4),
					shrink: Tweens.quadIn
				},
				spriteTween: {
					asset: particleHit
				},
				body: {
					force: impulse
				},
				transform: {
					position: position
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

Enemy.prototype.update = function() {
	var transform = this.$transform;
	if (chance(0.01)) {
		this.components.health.hit(null, 10);
	}
	if (transform.position[0] < 25) {
		transform.position[0] = 550;
	}
};

Enemy.prototype.onHealthDamage = function() {
	this.$body.applyForce(Vec2(random(300, 700), 0));
};

Enemy.prototype.onDead = function() {
	this.entity.destroy();
};

Enemy.sheet = new SpriteSheet({
	sprites: new SpriteAsset('./assets/skeleton.png'),
	size: Vec2(32, 32),
	speed: 0.15,
	sequences: defaultSequence
});

Component.create(Enemy, 'enemy');

Entity.createPrefab('enemy', {
	transform: null,
	bounds: {
		radius: 14,
		shape: 'circle'
	},
	collider: {
		include: 'projectile',
		trigger: true
	},
	body: {
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
}

Projectile.prototype.onTrigger = function(event) {
	event.other.$health.hit(this.entity, random(10, 15));
	this.entity.destroy();
};

var particleHit = Particle.generateSpriteSheet({
	shape: 'circle',
	center: 1,
	color: Color(255, 0, 0)
});

Component.create(Projectile, 'projectile');

Entity.createPrefab('projectile', {
	transform: null,
	bounds: {
		shape: 'circle',
		radius: 2
	},
	body: {
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

Context.gameScene = Entity.create(null, {
	gameController: null
});

Context.play(Context.gameScene);
