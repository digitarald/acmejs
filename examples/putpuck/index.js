'use strict';

var Engine = require('../../lib/core/engine');

Engine.init(document.getElementById('game-1'));

var Renderer = require('../../lib/core/renderer');
var Vec2 = require('../../lib/core/math').Vec2;

Engine.renderer = new Renderer(Engine.element.getElementsByClassName('game-canvas')[0], Vec2(320, 480));

var Entity = require('../../lib/core/entity');
var Component = require('../../lib/core/component');
var Pool = require('../../lib/core/pool');
var Color = require('../../lib/core/color');
var Sprite = require('../../lib/core/sprite');
var Transform = require('../../lib/core/transform');
var Bounds = require('../../lib/core/bounds');
var Border = require('../../lib/core/border');
var Particle = require('../../lib/core/particle');
var Collider = require('../../lib/core/collider');
var Kinetic = require('../../lib/core/kinetic');


function GameController() {}

GameController.prototype.create = function() {
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
  this.inField1 = this.entity.addChild('field', {
    transform: {
      pos: Vec2(0, 80)
    },
    bounds: {
      size: Vec2(320, 160)
    },
    field: {
      color: this.colors[0].low,
      player: 0
    }
  });
  this.inField2 = this.entity.addChild('field', {
    transform: {
      pos: Vec2(0, 240)
    },
    bounds: {
      size: Vec2(320, 160)
    },
    field: {
      color: this.colors[1].low,
      player: 1
    }
  });
  this.outField1 = this.entity.addChild('field', {
    transform: {
      pos: Vec2(0, 0)
    },
    bounds: {
      size: Vec2(320, 80)
    },
    field: {
      out: true,
      player: 0
    }
  });
  this.outField2 = this.entity.addChild('field', {
    transform: {
      pos: Vec2(0, 400)
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
};

GameController.prototype.setupPuck = function() {
  this.player = this.player ? 0 : 1;
  var radius = Math.rand(12, 25) | 0;
  var puck1 = this.entity.addChild('puck', {
    transform: {
      pos: Vec2(160, this.player ? 40 : 440)
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
  puck1.sub(this, 'onFlip', 'setupPuck');
};

new Component('gameController', GameController);



function Puck() {
  this.color = Color();
  this.outlineColor = Color();
}

Puck.prototype.layer = 1;

Puck.prototype.attributes = {
  player: 0,
  color: Color(),
  field: null
};


Puck.prototype.create = function(attributes) {
  this.player = attributes.player, this.field = attributes.field;
  Color.copy(this.color, attributes.color);
  Color.lerp(this.color, Color.black, 0.2, false, this.outlineColor);
  this.outlineColor[3] = 0.3;
  this.kinetic.enable(false);
  this.collider.enable(false);
  this.state = 'ready';
  this.treshold = 1;
};

Puck.prototype.update = function(dt) {
  var pos = this.transform.pos;
  var input = Engine.input;
  switch (this.state) {
    case 'ready':
      if (input.touchState !== 'began' || !this.bounds.contains(input.pos)) {
        break;
      }
      this.state = 'dragging';
      break;
    case 'dragging':
      if (input.touchState === 'moved') {
        if (this.player) {
          if (input.pos[1] > this.field.bounds.bottom) {
            this.state = 'draggingEnd';
          }
        } else {
          if (input.pos[1] < this.field.bounds.top) {
            this.state = 'draggingEnd';
          }
        }
        var delta = input.time - input.prevTime;
        var speed = Vec2.scal(
          Vec2.sub(input.pos, input.prevPos, Vec2.cache[0]),
          delta * 1000
        );
        if (this.avgSpeed) {
          Vec2.lerp(this.avgSpeed, speed, 0.5);
        } else {
          this.avgSpeed = Vec2(speed);
        }
        Vec2.copy(this.transform.pos, input.pos);
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
      this.entity.pub('onFlip', this);
      this.avgSpeed = null;
      break;
    case 'flipped':
    /*
      break;
      var vel = Vec2.len(this.kinetic.velocity);
      var i = vel / 40 | 0;
      while (i--) {
        pos = Vec2.set(Vec2.cache[0], Math.rand(-1, 1), Math.rand(-1, 1));
        Vec2.norm(pos, null, this.bounds.radius);
        pointer = Vec2.copy(Vec2.cache[1], pos);
        Vec2.add(Vec2.norm(pos, null, this.bounds.radius), this.transform.pos);
        Vec2.scal(pointer, Math.rand(0, vel / 8));
        particle = Particle.Prefab.alloc(this.root, {
          particle: {
            lifetime: Math.rand(0.1, 0.5),
            radius: Math.rand(2, 10),
            color: this.color,
            sprite: Puck.particleSmokeSprite
          },
          kinetic: {
            velocity: pointer
          },
          transform: {
            pos: pos
          }
        });
      }
      */
      break;
  }
};

var particlePos = Vec2();
var speed = Vec2();

Puck.prototype.onCollide = function() {
  var i, particle, pointer, pos;
  i = this.bounds.radius;
  while (i--) {
    pos = Vec2.set(particlePos, Math.rand(-1, 1), Math.rand(-1, 1));
    Vec2.norm(pos, null, this.bounds.radius);
    pointer = Vec2.copy(speed, pos);
    Vec2.add(Vec2.norm(pos, null, this.bounds.radius), this.transform.pos);
    Vec2.scal(pointer, Math.rand(0, Vec2.len(this.kinetic.velocity) / 8));
    particle = this.root.addChild('particle', {
      particle: {
        lifetime: Math.rand(0.1, 0.5),
        radius: Math.rand(1, 3),
        color: this.color
      },
      kinetic: {
        velocity: pointer
      },
      transform: {
        pos: pos
      }
    });
  }
  return this;
};

Puck.prototype.render = function(ctx) {
  var pos;
  ctx.save();
  pos = this.transform.pos;
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
  return this;
};

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
  this.root.sub(this, 'onKineticSleep');
};

Field.prototype.onKineticSleep = function(kinetic) {
  if (!this.bounds.contains(kinetic.transform.pos)) {
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
  ctx.fillRect(this.transform.pos[0], this.transform.pos[1], this.bounds.size[0], this.bounds.size[1]);
};

new Component('field', Field);

new Entity.Prefab('field', {
  transform: null,
  bounds: {
    shape: 'rect'
  },
  field: null
});


Engine.gameScene = Entity.alloc(null, {
  gameController: null
});

Engine.play(Engine.gameScene);
