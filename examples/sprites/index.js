'use strict';

var acmejs = require('acmejs');

var Engine = acmejs.Engine;
Engine.init(document.getElementById('game-1'));

var Renderer = acmejs.Renderer;
var Vec2 = acmejs.Vec2;
Engine.renderer = new Renderer(Engine.element.getElementsByClassName('game-canvas')[0], Vec2(480, 320));

var Entity = acmejs.Entity;
var Component = acmejs.Component;
var Sprite = acmejs.Sprite;

function GameController() {}

GameController.prototype.create = function() {
  this.root.createChild('agent', {
    transform: {
      position: Vec2(240, 200)
    }
  });
};

GameController.prototype.update = function() {
  var input = Engine.input;
  if (input.keys.space) {
    this.root.createChild('explosion', {
      transform: {
        position: input.position
      },
      spriteTween: {
        offset: Math.rand(0, 1)
      }
    });
  }
};

GameController.prototype.spawnExplosion = function() {
  this.root.createChild('explosion', {
    transform: {
      position: Vec2(Math.rand(25, 450), Math.rand(25, 295))
    },
    spriteTween: {
      offset: Math.rand(0, 1)
    }
  });
};

new Component('gameController', GameController);


var explisionSheet = new Sprite.Sheet({
  sprites: new Sprite.Asset('../shared/mini-explosion.png'),
  size: Vec2(20, 20),
  speed: 0.05
});

function Explosion() {}

Explosion.prototype.onSequenceEnd = function() {
  this.entity.destroy();
};

new Component('explosion', Explosion);

new Entity.Prefab('explosion', {
  transform: null,
  spriteTween: {
    asset: explisionSheet
  },
  bounds: {
    shape: 'circle',
    radius: 15
  },
  explosion: null
});


var agentSheet = new Sprite.Sheet({
  sprites: [
    new Sprite.Asset('../shared/char_walk.png'),
    new Sprite.Asset('../shared/char_shoot.png'),
    new Sprite.Asset('../shared/char_hurt.png')
  ],
  size: Vec2(64, 64),
  speed: 0.09,
  anchor: Vec2.bottomCenter,
  sequences: {
    walkN: [1, 8, 'walkW', null],
    walkW: [10, 17, 'walkS', null],
    walkS: [19, 26, 'walkE', null],
    walkE: [28, 35, 'shootW', null],
    shootW: [36, 37, 'shootS', 0.3],
    shootS: [39, 40, 'shootN', 0.3],
    shootN: [42, 43, 'hurt', 0.3],
    hurt: [45, 50, null, 0.15]
  }
});

new Entity.Prefab('agent', {
  transform: null,
  spriteTween: {
    asset: agentSheet,
    sequence: 'walkN'
  }
});

Engine.gameScene = Entity.create(null, {
  gameController: null
});

Engine.play(Engine.gameScene);
