'use strict';

var Vec2 = require('../../lib/core/math').Vec2;
var Engine = require('../../lib/core/engine');

Engine.init(document.getElementById('game-1'));

var Renderer = require('../../lib/core/renderer');
Engine.renderer = new Renderer(Engine.element.getElementsByClassName('game-canvas')[0], Vec2(960, 640));

var Entity = require('../../lib/core/entity');
var Component = require('../../lib/core/component');
var Pool = require('../../lib/core/pool');
var Color = require('../../lib/core/color');
var Particle = require('../../lib/core/particle');
require('../../lib/core/transform');
require('../../lib/core/border');
require('../../lib/core/collider');
require('../../lib/core/kinetic');
require('../../lib/core/jitter');
require('../../lib/core/boid');

function GameController() {
  this.started = 0;
}

GameController.prototype.update = function(dt) {
  var input = Engine.input;
  if (input.touchState || input.keys.space) {
    var factor = (this.started += dt) + 1;
    var i = 100 * dt * factor | 0;
    var speed = 10;
    while (i--) {
      var spark = SparkPrefab.alloc(this.root);
      Vec2.scal(Vec2.set(spark.kinetic.velocity, Math.rand(-speed, speed), Math.rand(-speed, speed)), factor);
      Vec2.variant(input.pos, 10, spark.transform.pos);
      spark.particle.radius = Math.rand(5, 25);
    }
  } else if (this.started) {
    this.started = 0;
  }
};

new Component('gameController', GameController);


var SparkPrefab = new Entity.Prefab({
  transform: null,
  kinetic: {
    mass: 0.1,
    fast: true,
    maxVelocity: 200,
    maxForce: 0
  },
  particle: {
    lifetime: 5,
    // composite: 'multiply',
    fade: Math.quadIn,
    shrink: null,
    sprite: Particle.generateSprite(Color(164, 164, 164), 1)
  },
  jitter: null
});


Engine.gameScene = Entity.alloc(null, {
  gameController: null
});

Engine.play(Engine.gameScene);
