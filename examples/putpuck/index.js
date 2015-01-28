'use strict';

var Engine = acmejs.Engine;

Engine.init(document.getElementById('game-1'));

var Renderer = acmejs.Renderer;
var Vec2 = acmejs.Vec2;
var Mathf = acmejs.Mathf;
var Random = acmejs.Random;
var Entity = acmejs.Entity;
var Prefab = acmejs.Prefab;
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

Engine.renderer = new Renderer(
	Engine.element.getElementsByClassName('game-canvas')[0],
	Vec2(320, 480)
);
Engine.createComponent('spriteCanvasRenderer');

var Config = {
	colors: [{
		mid: Color(78, 205, 196)
	}, {
		mid: Color(255, 107, 107)
	}]
};
Config.colors.forEach(function(entry) {
	entry.high = Color.lerp(entry.mid, Color.white, 0.85, false, Color());
	entry.fieldAsset = new Sprite.Asset(function(ctx) {
		ctx.fillStyle = Color.rgba(entry.high);
		ctx.fillRect(0, 0, 320, 80);
	}, Vec2(320, 80));
});

/**
 * GameController Component
 */
function GameController() {
	Component.call(this);
};

GameController.prototype = {
	create: function() {
		// console.log('Create');
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
		// console.log('setupPuck');
		this.player = this.player ? 0 : 1;
		var radius = Random.rand(12, 25) | 0;
		var puck1 = this.entity.createChild('puck', {
			transform: {
				position: Vec2(160, this.player ? 40 : 440)
			},
			bounds: {
				radius: radius
			},
			kinetic: {
				mass: radius
			},
			puck: {
				player: this.player,
				color: Config.colors[this.player].mid,
				field: this.player ? this.outField1 : this.outField2
			}
		});
		puck1.on(this, 'onFlip', 'setupPuck');
	}
};

Component.create(GameController, 'gameController');

/**
 * Puck Component
 */
function Puck() {
	Component.call(this);
	this._color = Color();
	this.outlineColor = Color();
}

Puck.layer = 1;
var velocityCache = Vec2();
var posCache = Vec2();

Puck.prototype = {
	attributes: {
		player: 0,
		color: Color(),
		field: null
	},

	create: function() {
		// console.log('Puck.create', this, attributes);
		Color.lerp(this.color, Color.black, 0.2, false, this.outlineColor);
		this.outlineColor[3] = 0.3;
		this.components.kinetic.enable(false);
		this.components.collider.enable(false);
		this.state = 'ready';
		this.treshold = 1;
	},

	update: function(dt) {
		var pos = this.components.transform.position;
		var input = Engine.components.input;
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
						console.log(this.field.components.bounds.bottom);
						if (input.position[1] > this.field.components.bounds.bottom) {
							console.log(
								'bottom',
								input.position[1],
								this.field.components.bounds.bottom
							);
							this.state = 'draggingEnd';
						}
					} else {
						if (input.position[1] < this.field.components.bounds.top) {
							console.log(
								'top',
								input.position[1],
								this.field.components.bounds.top
							);
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
					Vec2.copy(this.components.transform.position, input.position);
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
				this.state = 'flipped';
				this.components.kinetic.enable(true);
				this.components.collider.enable(true);
				Vec2.copy(this.components.kinetic.velocity, this.avgSpeed);
				this.entity.emit('onFlip', this);
				this.avgSpeed = null;
				break;
			case 'flipped':
				break;
		}
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
			Vec2.scale(impulse, Random.rand(0, Vec2.len(this.components.kinetic.velocity) / 2));

			this.root.createChild('particle', {
				particle: {
					lifetime: Random.rand(0.2, 0.8),
					alpha: Random.rand(0.5, 1),
					radius: Random.rand(1, 5),
					shrink: null
				},
				kinetic: {
					force: impulse
				},
				transform: {
					position: pos
				}
			});
		}
	},

	render: function(ctx) {
		ctx.save();
		var pos = this.components.transform.position;
		ctx.beginPath();
		ctx.arc(pos[0] | 0, pos[1] | 0, this.components.bounds.radius | 0, 0, Mathf.TAU);
		ctx.closePath();
		ctx.fillStyle = Color.rgba(this.color);
		ctx.fill();
		if (this.state == 'ready' || this.components.kinetic.sleeping) {
			ctx.lineWidth = 4;
			ctx.strokeStyle = Color.rgba(this.outlineColor);
			ctx.stroke();
		}
		ctx.restore();
	},

	free: function() {
		this.field = null;
	}
};

Color.defineProperty(Puck, 'color');

// Puck.particleFlipSprite = Particle.generateSprite(Color(199, 244, 100));
// Puck.particleSmokeSprite = Particle.generateSprite(Color(128, 128, 128), 0.5);

Component.create(Puck, 'puck');

new Prefab('puck', {
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
		this.root.on(this, 'onKineticSleep');
	},

	onKineticSleep: function(kinetic) {
		if (!this.components.bounds.contains(kinetic.components.transform.position)) {
			return;
		}
		if (this.out) {
			kinetic.entity.destroy();
		}
		return false;
	}
};

Component.create(Field, 'field');

new Prefab('field', {
	transform: null,
	bounds: {
		shape: 'rect'
	},
	field: null
});

Engine.gameScene = Entity.create(null, {
	gameController: null
});

Engine.play(Engine.gameScene);