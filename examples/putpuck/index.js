// Generated by CoffeeScript 1.6.1
'use strict';
var Border, Bounds, Collider, Color, Component, Composite, Engine, Field, Kinetic, Particle, Pool, Puck, Renderer, Scene, Sprite, Transform, Vec2,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Vec2 = require('../../lib/core/math').Vec2;

Engine = require('../../lib/core/engine');

Engine.init(document.getElementById('game-1'));

Renderer = require('../../lib/core/renderer');

Engine.renderer = new Renderer(Engine.element.getElementsByClassName('game-canvas')[0], Vec2(320, 480));

Composite = require('../../lib/core/composite');

Component = require('../../lib/core/component');

Pool = require('../../lib/core/pool');

Color = require('../../lib/core/color');

Sprite = require('../../lib/core/sprite');

Transform = require('../../lib/core/transform');

Bounds = require('../../lib/core/bounds');

Border = require('../../lib/core/border');

Particle = require('../../lib/core/particle');

Collider = require('../../lib/core/collider');

Kinetic = require('../../lib/core/kinetic');

Scene = (function(_super) {

  __extends(Scene, _super);

  Scene.prototype.type = 'scene';

  function Scene() {
    Scene.__super__.constructor.call(this);
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
    this.inField1 = Field.Prefab.alloc(this, {
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
    this.inField2 = Field.Prefab.alloc(this, {
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
    this.outField1 = Field.Prefab.alloc(this, {
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
    this.outField2 = Field.Prefab.alloc(this, {
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
    this;
  }

  Scene.prototype.setupPuck = function() {
    var puck1, radius;
    this.player = this.player ? 0 : 1;
    radius = Math.rand(12, 25) | 0;
    puck1 = Puck.Prefab.alloc(this, {
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
    puck1.player = this.player;
    puck1.sub(this, 'onFlip', 'setupPuck');
    return this;
  };

  return Scene;

})(Composite);

Puck = (function(_super) {
  var particlePos, speed;

  __extends(Puck, _super);

  Puck.prototype.type = 'puck';

  Puck.prototype.layer = 1;

  Puck.prototype.presets = {
    player: 0,
    color: Color(),
    field: null
  };

  function Puck() {
    this.color = Color();
    this.outlineColor = Color();
  }

  Puck.prototype.reset = function(presets) {
    this.player = presets.player, this.field = presets.field;
    Color.copy(this.color, presets.color);
    Color.lerp(this.color, Color.black, 0.2, false, this.outlineColor);
    this.outlineColor[3] = 0.3;
    this.kinetic.enable(false);
    this.collider.enable(false);
    this.state = 'ready';
    this.treshold = 1;
    return this;
  };

  Puck.prototype.update = function(dt) {
    var delta, i, input, particle, pointer, pos, speed, vel;
    pos = this.transform.pos;
    input = Engine.input;
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
          delta = input.time - input.prevTime;
          speed = Vec2.scal(Vec2.sub(input.pos, input.prevPos, Vec2.cache[0]), delta * 1000);
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
        Vec2.copy(this.kinetic.vel, this.avgSpeed);
        this.parent.pub('onFlip', this);
        this.avgSpeed = null;
        break;
      case 'flipped':
        break;
        vel = Vec2.len(this.kinetic.vel);
        i = vel / 40 | 0;
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
              vel: pointer
            },
            transform: {
              pos: pos
            }
          });
        }
        break;
    }
    return this;
  };

  particlePos = Vec2();

  speed = Vec2();

  Puck.prototype.onCollide = function() {
    var i, particle, pointer, pos;
    i = this.bounds.radius;
    while (i--) {
      pos = Vec2.set(particlePos, Math.rand(-1, 1), Math.rand(-1, 1));
      Vec2.norm(pos, null, this.bounds.radius);
      pointer = Vec2.copy(speed, pos);
      Vec2.add(Vec2.norm(pos, null, this.bounds.radius), this.transform.pos);
      Vec2.scal(pointer, Math.rand(0, Vec2.len(this.kinetic.vel) / 8));
      particle = Particle.Prefab.alloc(this.root, {
        particle: {
          lifetime: Math.rand(0.1, 0.5),
          radius: Math.rand(1, 3),
          color: this.color
        },
        kinetic: {
          vel: pointer
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

  return Puck;

})(Component);

new Pool(Puck);

Particle.defaultComposite = null;

Puck.particleFlipSprite = Particle.generateSprite(Color(199, 244, 100));

Puck.particleSmokeSprite = Particle.generateSprite(Color(128, 128, 128), 0.5);

console.log(Puck.particleSmokeSprite.toString());

Puck.Prefab = new Composite.Prefab({
  transform: null,
  bounds: {
    shape: 'circle',
    radius: 15
  },
  kinetic: {
    mass: 1,
    drag: 0.995,
    maxVel: 900
  },
  collider: null,
  border: {
    bounce: true,
    restitution: 0.6
  },
  puck: null
});

Field = (function(_super) {

  __extends(Field, _super);

  Field.prototype.type = 'field';

  Field.prototype.presets = {
    color: Color.white,
    out: false,
    player: 0
  };

  function Field() {
    this.color = Color();
  }

  Field.prototype.reset = function(presets) {
    this.out = presets.out, this.player = presets.player;
    Color.copy(this.color, presets.color);
    this.root.sub(this, 'onKineticSleep');
    return this;
  };

  Field.prototype.onKineticSleep = function(kinetic) {
    if (this.bounds.contains(kinetic.pos) && this.out) {
      kinetic.parent.free();
    }
    return this;
  };

  Field.prototype.render = function(ctx) {
    if (this.out) {
      return this;
    }
    ctx.fillStyle = Color.rgba(this.color);
    ctx.fillRect(this.transform.pos[0], this.transform.pos[1], this.bounds.size[0], this.bounds.size[1]);
    return this;
  };

  return Field;

})(Component);

new Pool(Field);

Field.Prefab = new Composite.Prefab({
  transform: null,
  bounds: {
    shape: 'rect'
  },
  field: null
});

Engine.play(new Scene());
