'use strict';

var Engine = require('../../lib/core/engine');

Engine.init(document.getElementById('game-1'));

var Renderer = require('../../lib/core/renderer');
var Vec2 = require('../../lib/core/math').Vec2;

Engine.renderer = new Renderer(Engine.element.getElementsByClassName('game-canvas')[0], Vec2(480, 320));

var Entity = require('../../lib/core/entity');
var Component = require('../../lib/core/component');
var Pool = require('../../lib/core/pool');
var Color = require('../../lib/core/color');
var Sprite = require('../../lib/core/sprite');
var Transform = require('../../lib/core/transform');
var Bounds = require('../../lib/core/bounds');
var Border = require('../../lib/core/border');
var Collider = require('../../lib/core/collider');
var Kinetic = require('../../lib/core/kinetic');

/**
 * Game
 */

function GameController() {}

GameController.prototype.create = function() {
  this.colors = [
    Color(0, 160, 176),
    Color(106, 74, 60),
    Color(204, 51, 63),
    Color(235, 104, 65),
    Color(237, 201, 81)
  ];
  this.root.gravity = Vec2(0, 500);
  this.spawnBodies(25);
  if (!Engine.input.support.orientation) {
    Engine.debug.warn = 'No devicemotion';
  }
};

GameController.prototype.spawnBodies = function(count) {
  while (count--) {
    var color = Math.floor(Math.rand(0, this.colors.length - 1));
    var radius = Math.rand(5, 15);
    this.root.createChild('body', {
      transform: {
        position: Vec2(Math.rand(25, 295), Math.rand(25, 295))
      },
      bounds: {
        radius: radius
      },
      kinetic: {
        mass: radius
      },
      body: {
        color: this.colors[color]
      }
    });
  }
};

/*
GameController.prototype.update = function(dt) {
  var input = Engine.input;
  if (input.support.orientation) {
    // Vec2.scale(input.orientation, 100, this.root.gravity);
  }
};
*/

new Component('gameController', GameController);


function Body() {
  this.color = Color();
  this.stroke = Color(Color.white);
}

Body.prototype.layer = 1;

Body.prototype.attributes = {
  color: Color()
};


Body.prototype.create = function(attributes) {
  this.player = attributes.player;
  Color.copy(this.color, attributes.color);
};

Body.prototype.render = function(ctx) {
  ctx.save();
  var pos = this.transform.position;
  ctx.fillStyle = Color.rgba(this.color);
  ctx.strokeStyle = Color.rgba(this.stroke);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(pos[0] | 0, pos[1] | 0, this.bounds.radius | 0, 0, Math.TAU);
  ctx.stroke();
  ctx.fill();
  ctx.restore();
};

new Component('body', Body);

new Entity.Prefab('body', {
  transform: null,
  bounds: {
    shape: 'circle',
    radius: 15
  },
  kinetic: {
    mass: 1,
    drag: 0.998,
    friction: 0.1,
    maxVelocity: 200
  },
  border: {
    bounciness: 0.2
  },
  body: null
});

/**
 * Init
 */

Engine.gameScene = Entity.create(null, {
  gameController: null
});

Engine.play(Engine.gameScene);
