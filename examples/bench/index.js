'use strict';

var acmejs = require('acmejs');

var Vec2 = acmejs.Math.Vec2;
var Color = acmejs.Color;
var Engine = acmejs.Engine;

Engine.init(document.getElementById('game-1'));

var Renderer = acmejs.Renderer;
Engine.renderer = new Renderer(Engine.element.getElementsByClassName('game-canvas')[0], Vec2(480, 320));
Engine.renderer.color = Color.black;

var Entity = acmejs.Entity;
var Component = acmejs.Component;
var Particle = acmejs.Particle;


function GameController() {
  this.started = 0;
}

var vel = Vec2();

GameController.prototype.update = function(dt) {
  var input = Engine.input;
  if (input.touchState || input.keys.space) {
    var factor = (this.started += dt) + 1;
    var i = 100 * dt * factor | 0;
    var speed = 10;
    while (i--) {
      var spark = SparkPrefab.create(this.root);
      Vec2.set(vel, Math.rand(-speed, speed), Math.rand(-speed, speed))
      Vec2.scale(vel, factor * 25);
      spark.kinetic.applyForce(vel);
      // spark.kinetic.velocity
      Vec2.variant(input.position, 10, spark.transform.position);
      spark.particle.radius = Math.rand(2, 15);
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
    lifetime: 4,
    composite: 'lighter',
    fade: Math.quadIn,
    shrink: Math.quadIn,
    sprite: Particle.generateSprite(Color(164, 164, 164), 1)
  },
  jitter: {
    // factor: 0.5,
    // force: 2000
  }
});


Engine.gameScene = Entity.create(null, {
  gameController: null
});

Engine.play(Engine.gameScene);
