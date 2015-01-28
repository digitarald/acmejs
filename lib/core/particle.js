'use strict';

var Entity = require('./entity');
var Prefab = require('./prefab');
var Component = require('./component');
var Pool = require('./pool');
var Engine = require('./engine');
var Mathf = require('../math/mathf');
var Vec2 = require('../math/vec2');
var Random = require('../math/random');
var Tweens = require('../math/tweens');
var Color = require('./color');
var Sprite = require('./sprite');
require('./transform');
require('./kinetic');

function Particle() {
  Component.call(this);
  this.lifetime = 0.0;
  this.lifetimeVariant = 0.0;
  this.radius = 0.0;
  this.radiusVariant = 0.0;
  this.alphaVariant = 0.0;
  this.shrink = Tweens.linear;
  this.fade = Tweens.linear;
  this.age = 0.0;
}

Particle.prototype = {
  attributes: {
    lifetime: 1,
    lifetimeVariant: 1,
    radius: 1,
    radiusVariant: 0,
    alphaVariant: 0,
    shrink: Tweens.quintIn,
    fade: Tweens.quintIn
  },

  create: function(attributes) {
    var variant = this.lifetimeVariant;
    if (variant > 0) {
      this.lifetime += Random.rand(-variant, variant);
    }
    variant = this.radiusVariant;
    if (variant > 0) {
      this.radius += Random.rand(-variant, variant);
    }
    variant = this.alphaVariant;
    if (variant > 0) {
      var transform = this.components.transform;
      transform.alpha = Mathf.clamp(
        transform.alpha + Random.rand(-variant, variant), 0, 1
      );
    }
    this.age = 0;
  },

  update: function(dt) {
    this.age += dt;
    var age = this.age;
    var lifetime = this.lifetime;
    if (age > lifetime) {
      this.entity.destroy();
      return;
    }
    if (this.shrink) {
      this.radius *= 1 - this.shrink(age / lifetime);
      if (this.radius < 1) {
        this.entity.destroy();
        return;
      }
    }
    if (this.fade) {
      var transform = this.components.transform;
      transform.alpha *= 1 - this.fade(age / lifetime);
      if (transform.alpha <= 0.02) {
        this.entity.destroy();
        return;
      }
    }
    this.components.spriteTween.frame = this.radius - 1 | 0;
  }
};

Particle.generateSpriteAsset = function(attributes) {
  attributes = attributes || {};
  var color = Color(attributes.color || Color.gray);
  var alpha = attributes.alpha || 1;
  var max = attributes.max = attributes.max || 25;
  var size = max * 2;
  var center = attributes.center || 0.5;
  var shape = attributes.shape || 'circle';

  return new Sprite.Asset(function(ctx) {
    for (var radius = 1; radius <= max; radius++) {
      var top = max + size * (radius - 1);

      if (center < 1) {
        var grad = ctx.createRadialGradient(max, top, 0, max, top, radius);
        color[3] = alpha;
        grad.addColorStop(0, Color.rgba(color));
        if (center != 0.5) {
          color[3] = alpha / 2;
          grad.addColorStop(center, Color.rgba(color));
        }
        color[3] = 0;
        grad.addColorStop(1, Color.rgba(color));
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = Color.rgba(color);
      }

      if (shape == 'rect') {
        ctx.fillRect(max - radius / 2 | 0, top - radius / 2, radius, radius);
      } else {
        ctx.beginPath();
        ctx.arc(max, top, radius, 0, Mathf.TAU, true);
        ctx.closePath();
        ctx.fill();
      }
    }
  }, Vec2(size, size * max));
};

Particle.generateSpriteSheet = function(attributes) {
  attributes = attributes || {};
  var sprite = Particle.generateSpriteAsset(attributes);
  var size = attributes.max * 2;
  return new Sprite.Sheet({
    size: Vec2(size, size),
    sprites: sprite
  });
};

Particle.defaultSpriteSheet = Particle.generateSpriteSheet();

Component.create(Particle, 'particle');

Particle.Prefab = new Prefab('particle', {
  transform: null,
  kinetic: {
    mass: 0,
    fast: true
  },
  particle: null,
  spriteTween: {
    asset: Particle.defaultSpriteSheet
  }
});

module.exports = Particle;
