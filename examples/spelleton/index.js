// Generated by CoffeeScript 1.6.1
'use strict';
var Border, Collider, Component, Enemy, Engine, Entity, Explosion, GameController, Kinetic, Magician, Pool, Renderer, Sprite, Transform, Vec2, defaultSequence,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Vec2 = require('../../lib/core/math').Vec2;

Engine = require('../../lib/core/engine');

Engine.init(document.getElementById('game-1'));

Renderer = require('../../lib/core/renderer');

Engine.renderer = new Renderer(Engine.element.getElementsByClassName('game-canvas')[0], Vec2(480, 320));

Entity = require('../../lib/core/entity');

Component = require('../../lib/core/component');

Pool = require('../../lib/core/pool');

Sprite = require('../../lib/core/sprite');

Transform = require('../../lib/core/transform');

Border = require('../../lib/core/border');

Collider = require('../../lib/core/collider');

Kinetic = require('../../lib/core/kinetic');

GameController = (function(_super) {

  __extends(GameController, _super);

  function GameController() {
    return GameController.__super__.constructor.apply(this, arguments);
  }

  GameController.prototype.tag = 'gameController';

  GameController.prototype.instantiate = function() {
    Magician.Prefab.alloc(this.root, {
      transform: {
        pos: Vec2(240, 200)
      }
    });
    return this;
  };

  GameController.prototype.update = function() {
    var input;
    input = Engine.input;
    if (input.keys.space === 'began') {
      Explosion.Prefab.alloc(this.root, {
        transform: {
          pos: input.pos
        }
      });
      return this;
    }
  };

  return GameController;

})(Component);

new Pool(GameController);

Explosion = (function(_super) {

  __extends(Explosion, _super);

  function Explosion() {
    return Explosion.__super__.constructor.apply(this, arguments);
  }

  Explosion.prototype.tag = 'explosion';

  Explosion.prototype.onSequenceEnd = function() {
    return this.entity.destroy();
  };

  return Explosion;

})(Component);

new Pool(Explosion);

Explosion.sheetBlue = new Sprite.Sheet({
  sprites: new Sprite.Asset('./assets/explosion-blue.jpg'),
  size: Vec2(120, 120),
  speed: 0.12
});

Explosion.sheetFire = new Sprite.Sheet({
  sprites: new Sprite.Asset('./assets/explosion-fire.png'),
  size: Vec2(192, 192),
  speed: 0.05
});

Explosion.Prefab = new Entity.Prefab({
  transform: null,
  spriteTween: {
    asset: Explosion.sheetFire
  },
  explosion: null
});

defaultSequence = {
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

Magician = (function(_super) {

  __extends(Magician, _super);

  function Magician() {
    return Magician.__super__.constructor.apply(this, arguments);
  }

  Magician.prototype.tag = 'magician';

  Magician.prototype.simulate = function() {
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
    return this;
  };

  Magician.prototype.postUpdate = function() {
    var axis, spriteTween;
    axis = Engine.input.axis;
    spriteTween = this.spriteTween;
    if (axis[1] < 0) {
      spriteTween.goto('walkN').play();
    } else if (axis[1] > 0) {
      spriteTween.goto('walkS').play();
    } else if (axis[0] < 0) {
      spriteTween.goto('walkW').play();
    } else if (axis[0] > 0) {
      spriteTween.goto('walkE').play();
    } else if (!spriteTween.paused) {
      spriteTween.pause();
    }
    return this;
  };

  return Magician;

})(Component);

new Pool(Magician);

Magician.sheet = new Sprite.Sheet({
  sprites: new Sprite.Asset('./assets/magician.png'),
  size: Vec2(32, 32),
  speed: 0.15,
  sequences: defaultSequence
});

Magician.Prefab = new Entity.Prefab({
  transform: null,
  spriteTween: {
    asset: Magician.sheet,
    sequence: 'walkS'
  },
  bounds: {
    radius: 15,
    shape: 'circle'
  },
  border: null,
  magician: null
});

Enemy = (function(_super) {

  __extends(Enemy, _super);

  function Enemy() {
    return Enemy.__super__.constructor.apply(this, arguments);
  }

  Enemy.prototype.tag = 'enemy';

  return Enemy;

})(Component);

new Pool(Enemy);

Enemy.sheet = new Sprite.Sheet({
  sprites: new Sprite.Asset('./assets/grinch.png'),
  size: Vec2(32, 32),
  speed: 0.15,
  sequences: defaultSequence
});

Enemy.Prefab = new Entity.Prefab({
  transform: null,
  spriteTween: {
    asset: Enemy.sheet,
    sequence: 'walkS'
  }
});

Engine.gameScene = Entity.alloc(null, {
  gameController: null
});

Engine.play(Engine.gameScene);
