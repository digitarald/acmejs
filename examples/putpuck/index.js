'use strict';

var Context = acmejs.Context;

Context.init(document.getElementById('game-1'));

var Renderer = acmejs.Renderer;
var Vec2 = acmejs.Vec2;
var Entity = acmejs.Entity;
var Component = acmejs.Component;
var Registry = acmejs.Registry;
var Color = acmejs.Color;
var SpriteAsset = acmejs.SpriteAsset;
var SpriteSheet = acmejs.SpriteSheet;
var Transform = acmejs.Transform;
var Bounds = acmejs.Bounds;
var Border = acmejs.Border;
var Particle = acmejs.Particle;
var Collider = acmejs.Collider;
var Body = acmejs.Body;

var TAU = acmejs.TAU;
var random = acmejs.random;
var values = acmejs.values;
var valuesKey = acmejs.valuesKey;

Context.renderer = new Renderer(
	Context.element.getElementsByClassName('game-canvas')[0],
	Vec2(320, 480)
);
Context.renderer.color = Color.white;
Context.renderer.noContext = true;
Context.createComponent('pixiSpriteSystem');

var Config = {
	colors: [{
		mid: Color(78, 205, 196)
	}, {
		mid: Color(305, 107, 107)
	}],
	sizes: [10, 15, 20, 25]
};
Config.colors.forEach(function(entry) {
	entry.high = Color.lerp(entry.mid, Color.white, 0.85, false, Color());
	entry.fieldAsset = new SpriteAsset(function(ctx) {
		ctx.fillStyle = Color.rgba(entry.high);
		ctx.fillRect(0, 0, 320, 160);
	}, Vec2(320, 160));
	entry.puckAsset = new SpriteAsset(function(ctx) {
		Config.sizes.forEach(function(radius, i) {
			let top = 30 + i * 30 * 2;
			ctx.fillStyle = Color.rgba(entry.mid);
			ctx.strokeStyle = Color.rgba(entry.mid, 0.3);

			ctx.beginPath();
			ctx.arc(30, top, radius, 0, TAU);
			ctx.closePath();
			ctx.fill();

			ctx.beginPath();
			ctx.arc(90, top, radius, 0, TAU);
			ctx.closePath();
			ctx.lineWidth = 5;
			ctx.fill();
			ctx.stroke();
		});
	}, Vec2(120, 120 * 4));
	entry.puckSheet = new SpriteSheet({
		sprites: entry.puckAsset,
		size: Vec2(60, 60),
		speed: 0
	});
});

/**
 * GameController Component
 */
function GameController() {
	Component.call(this);
	this.puck = null;
};

GameController.prototype = {
	create: function() {
		this.player = 0;
		this.inField1 = this.entity.createChild('field', {
			transform: {
				position: Vec2(160, 160)
			},
			bounds: {
				size: Vec2(320, 160)
			},
			field: {
				player: 0
			},
			spriteTween: {
				asset: Config.colors[0].fieldAsset
			}
		});
		this.inField2 = this.entity.createChild('field', {
			transform: {
				position: Vec2(160, 320)
			},
			bounds: {
				size: Vec2(320, 160)
			},
			field: {
				player: 1
			},
			spriteTween: {
				asset: Config.colors[1].fieldAsset
			}
		});
		this.outField1 = this.entity.createChild('field', {
			transform: {
				position: Vec2(160, 40)
			},
			bounds: {
				size: Vec2(320, 80)
			},
			field: {
				out: true,
				player: 0
			}
		});
		this.outField2 = this.entity.createChild('field', {
			transform: {
				position: Vec2(160, 440)
			},
			bounds: {
				size: Vec2(320, 80)
			},
			field: {
				out: true,
				player: 1
			}
		});
		this.setupPuck();
	},

	setupPuck: function() {
		this.player = this.player ? 0 : 1;
		var radiusKey = random(Config.sizes.length) | 0;
		var radius = Config.sizes[radiusKey];
		this.puck = this.entity.createChild('puck', {
			transform: {
				position: Vec2(160, this.player ? 40 : 440)
			},
			bounds: {
				radius: radius
			},
			body: {
				mass: radius
			},
			spriteTween: {
				asset: Config.colors[this.player].puckSheet,
				frame: radiusKey * 2
			},
			puck: {
				player: this.player,
				field: this.player ? this.outField1 : this.outField2
			}
		});
		this.puck.on(this, 'onFlip', 'setupPuck');
	},

	onKeyBegan: function(event) {
		if (event.key == 'space') {
			if (this.puck) {
				this.puck.components.puck.flip(Vec2.variantCirc(Vec2(), 1000));
			}
		}
	}
};

Component.create(GameController, 'gameController');

/**
 * Puck Component
 */
function Puck() {
	Component.call(this);
}

Puck.layer = 1;
var velocityCache = Vec2();
var posCache = Vec2();

Puck.prototype = {
	attributes: {
		player: 0,
		field: null
	},

	create: function() {
		this.components.body.enable(false);
		// this.components.boid.enable(false);
		this.components.collider.enable(false);
		this.state = 'ready';
		this.treshold = 1;
	},

	update: function(dt) {
		var pos = this.components.transform.position;
		var input = Context.components.input;
		switch (this.state) {
			case 'ready':
				if (input.touchState !== 'began' || !this.components.bounds.contains(input.position)) {
					break;
				}
				this.state = 'dragging';
				break;
			case 'dragging':
				if (input.touchState == 'moved') {
					if (this.player) {
						if (input.position[1] > this.field.components.bounds.bottom) {
							this.state = 'draggingEnd';
						}
					} else {
						if (input.position[1] < this.field.components.bounds.top) {
							this.state = 'draggingEnd';
						}
					}
					var delta = input.time - input.lastTime;
					var speed = Vec2.scale(
						Vec2.sub(input.position, input.lastPos, velocityCache),
						delta * 1000
					);
					if (this.avgSpeed) {
						Vec2.lerp(this.avgSpeed, speed, 0.5);
					} else {
						this.avgSpeed = Vec2(speed);
					}
					this.components.transform.translateTo(input.position);
					break;
				}
				if (input.touchState == 'ended') {
					this.state = 'draggingEnd';
					break;
				}
				break;
			case 'draggingEnd':
				if (!this.avgSpeed || Vec2.len(this.avgSpeed) < this.treshold) {
					this.state = 'ready';
					break;
				}
				this.flip(this.avgSpeed);
				this.avgSpeed = null;
				break;
			case 'flipped':
				break;
		}
	},

	flip: function(speed) {
		this.state = 'flipped';
		this.components.body.enable(true);
		this.components.collider.enable(true);
		// this.components.boid.enable(true);
		this.components.body.velocity = speed;
		this.emit('onFlip', speed);
	},

	onCollide: function() {
		return;

		// Particle effects, depending on size
		var bounds = this.components.bounds;
		var i = bounds.radius;
		while (i--) {
			var pos = Vec2.variantCirc(Vec2.zero, bounds.radius, posCache);

			var impulse = Vec2.copy(velocityCache, pos);
			Vec2.add(Vec2.norm(pos, null, bounds.radius), this.components.transform.position);
			Vec2.scale(impulse, Random.rand(0, Vec2.len(this.components.body.velocity) / 2));

			this.root.createChild('particle', {
				particle: {
					lifetime: Random.rand(0.2, 0.8),
					alpha: Random.rand(0.5, 1),
					radius: Random.rand(1, 5),
					shrink: null
				},
				body: {
					force: impulse
				},
				transform: {
					position: pos
				}
			});
		}
	},

	onBodySleep: function() {
		var tween = this.$spriteTween;
		tween.goto(tween.frame + 1);
	},

	onBodyWake: function() {
		var tween = this.$spriteTween;
		tween.goto(tween.frame - 1);
	},

	free: function() {
		this.field = null;
	}
};

// Puck.particleFlipSprite = Particle.generateSprite(Color(199, 244, 100));
// Puck.particleSmokeSprite = Particle.generateSprite(Color(128, 128, 128), 0.5);

Component.create(Puck, 'puck');

Entity.createPrefab('puck', {
	transform: null,
	bounds: {
		shape: 'circle',
		radius: 15
	},
	body: {
		mass: 1,
		drag: 0.995,
		maxVelocity: 900
	},
	// boid: null,
	collider: null,
	border: {
		bounce: true,
		restitution: 0.6
	},
	puck: null
});

/**
 * Field Component
 */
function Field() {
	Component.call(this);
};

Field.prototype = {
	attributes: {
		out: false,
		player: 0
	},

	create: function(attributes) {
		if (this.out) {
			this.root.on(this, 'onBodySleep', 'rootOnBodySleep');
		}
	},

	rootOnBodySleep: function(event) {
		var body = event.component;
		var transform = body.components.transform;
		if (!this.$bounds.contains(transform.position)) {
			return;
		}
		body.entity.destroy();
	}
};

Component.create(Field, 'field');

Entity.createPrefab('field', {
	transform: null,
	bounds: {
		shape: 'rect'
	},
	field: null
});

Context.gameScene = Entity.create(null, {
	gameController: null
});

Context.play(Context.gameScene);