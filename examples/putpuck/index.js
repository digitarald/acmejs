'use strict';

var acmejs = require('acmejs');

var Engine = acmejs.Engine;

Engine.init(document.getElementById('game-1'));

var Renderer = acmejs.Renderer;
var Vec2 = acmejs.Math.Vec2;

Engine.renderer = new Renderer(
	Engine.element.getElementsByClassName('game-canvas')[0],
	Vec2(320, 480)
);

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


function GameController() {}

GameController.prototype = {

	create: function() {
		// console.log('Create');
		this.player = 0;
		this.colors = {
			0: {
				high: Color(78, 205, 196)
			},
			1: {
				high: Color(255, 107, 107)
			}
		};
		this.colors[0].low = Color.lerp(this.colors[0].high, Color.white, 0.85, false, Color());
		this.colors[1].low = Color.lerp(this.colors[1].high, Color.white, 0.85, false, Color());
		this.inField1 = this.entity.createChild('field', {
			transform: {
				position: Vec2(0, 80)
			},
			bounds: {
				size: Vec2(320, 160)
			},
			field: {
				color: this.colors[0].low,
				player: 0
			}
		});
		this.inField2 = this.entity.createChild('field', {
			transform: {
				position: Vec2(0, 240)
			},
			bounds: {
				size: Vec2(320, 160)
			},
			field: {
				color: this.colors[1].low,
				player: 1
			}
		});
		this.outField1 = this.entity.createChild('field', {
			transform: {
				position: Vec2(0, 0)
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
				position: Vec2(0, 400)
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
		var radius = Math.rand(12, 25) | 0;
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
				color: this.colors[this.player].high,
				field: this.player ? this.outField1 : this.outField2
			}
		});
		puck1.on(this, 'onFlip', 'setupPuck');
	}

};

new Component('gameController', GameController);


function Puck() {
	this.color = Color();
	this.outlineColor = Color();
}

Puck.prototype = {

	layer: 1,

	attributes: {
		player: 0,
		color: Color(),
		field: null
	},

	create: function(attributes) {
		// console.log('Puck.create', this, attributes);
		this.player = attributes.player, this.field = attributes.field;
		Color.copy(this.color, attributes.color);
		Color.lerp(this.color, Color.black, 0.2, false, this.outlineColor);
		this.outlineColor[3] = 0.3;
		this.kinetic.enable(false);
		this.collider.enable(false);
		this.state = 'ready';
		this.treshold = 1;
	},

	update: function(dt) {
		var pos = this.transform.position;
		var input = Engine.input;
		switch (this.state) {
			case 'ready':
				if (input.touchState !== 'began' || !this.bounds.contains(input.position)) {
					break;
				}
				this.state = 'dragging';
				break;
			case 'dragging':
				if (input.touchState === 'moved') {
					if (this.player) {
						if (input.position[1] > this.field.bounds.bottom) {
							this.state = 'draggingEnd';
						}
					} else {
						if (input.position[1] < this.field.bounds.top) {
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
					Vec2.copy(this.transform.position, input.position);
					break;
				}
				if (input.touchState === 'ended') {
					this.state = 'draggingEnd';
					break;
				}
				break;
			case 'draggingEnd':
				if (!this.avgSpeed || Vec2.len(this.avgSpeed) < this.treshold) {
					this.state = 'ready';
					break;
				}
				console.log(Vec2.len(this.avgSpeed));
				this.state = 'flipped';
				this.kinetic.enable(true);
				this.collider.enable(true);
				Vec2.copy(this.kinetic.velocity, this.avgSpeed);
				this.entity.trigger('onFlip', this);
				this.avgSpeed = null;
				break;
			case 'flipped':
				break;
		}
	},

	onCollide: function() {
		// Particle effects, depending on size
		var i = this.bounds.radius;
		while (i--) {
			var pos = Vec2.set(posCache, Math.rand(-1, 1), Math.rand(-1, 1));
			Vec2.norm(pos, null, this.bounds.radius);

			var impulse = Vec2.copy(velocityCache, pos);
			Vec2.add(Vec2.norm(pos, null, this.bounds.radius), this.transform.position);
			Vec2.scale(impulse, Math.rand(0, Vec2.len(this.kinetic.velocity) / 2));

			this.root.createChild('particle', {
				particle: {
					lifetime: Math.rand(0.2, 0.8),
					alpha: Math.rand(0.5, 1),
					radius: Math.rand(1, 5),
					shrink: null,
					// color: this.color
					sprite: Puck.particleSmokeSprite
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
		var pos = this.transform.position;
		ctx.beginPath();
		ctx.arc(pos[0] | 0, pos[1] | 0, this.bounds.radius | 0, 0, Math.TAU);
		ctx.closePath();
		ctx.fillStyle = Color.rgba(this.color);
		ctx.fill();
		if (this.state === 'ready' || this.kinetic.sleeping) {
			ctx.lineWidth = 4;
			ctx.strokeStyle = Color.rgba(this.outlineColor);
			ctx.stroke();
		}
		ctx.restore();
	}

};

var posCache = Vec2();
var velocityCache = Vec2();

new Component('puck', Puck);


Particle.defaultEntity = null;

Puck.particleFlipSprite = Particle.generateSprite(Color(199, 244, 100));
Puck.particleSmokeSprite = Particle.generateSprite(Color(128, 128, 128), 0.5);

new Entity.Prefab('puck', {
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


function Field() {
	this.color = Color();
}

Field.prototype.attributes = {
	color: Color.white,
	out: false,
	player: 0
};

Field.prototype.create = function(attributes) {
	this.out = attributes.out, this.player = attributes.player;
	Color.copy(this.color, attributes.color);
	this.root.on(this, 'onKineticSleep');
};

Field.prototype.onKineticSleep = function(kinetic) {
	if (!this.bounds.contains(kinetic.transform.position)) {
		return;
	}
	if (this.out) {
		kinetic.entity.destroy();
	}
	return false;
};

Field.prototype.render = function(ctx) {
	if (this.out) {
		return;
	}
	ctx.fillStyle = Color.rgba(this.color);
	ctx.fillRect(this.transform.position[0], this.transform.position[1], this.bounds.size[0], this.bounds.size[1]);
};

new Component('field', Field);

new Entity.Prefab('field', {
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