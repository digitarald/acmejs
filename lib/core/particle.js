'use strict';

var Entity = require('./entity');
var Component = require('./component');
var Pool = require('./pool');
var Engine = require('./engine');
var Vec2 = require('./math').Vec2;
var Color = require('./color');
var Sprite = require('./sprite').Asset;
require('./transform');
require('./kinetic');

function Particle() {
  this.color = Color();
  this.colorVariant = 0;
  this.lifetime = 0.0;
  this.lifetimeVariant = 0.0;
  this.radius = 0.0;
  this.radiusVariant = 0.0;
  this.alpha = 0.0;
  this.alphaVariant = 0.0;
  this.composite = '';
  this.sprite = null;
  this.shrink = Math.linear;
  this.fade = Math.linear;
  this.age = 0.0;
}

Particle.layer = 10;
Particle.defaultComposite = 'source-over';

Particle.prototype.attributes = {
  color: Color.black,
  colorVariant: 0,
  lifetime: 1,
  lifetimeVariant: 1,
  radius: 1,
  radiusVariant: 0,
  alpha: 1,
  alphaVariant: 0,
  composite: 'source-over',
  sprite: null,
  shrink: Math.quintIn,
  fade: Math.quintIn
};

Particle.prototype.create = function(attributes) {
  Color.copy(this.color, attributes.color);
  this.lifetime = attributes.lifetime;
  this.radius = attributes.radius;
  this.alpha = attributes.alpha;
  this.composite = attributes.composite;
  this.sprite = attributes.sprite;
  this.shrink = attributes.shrink;
  this.fade = attributes.fade;

  var variant = attributes.colorVariant;
  if (variant) {
    Color.variant(this.color, variant);
  }
  variant = attributes.lifetimeVariant;
  if (variant) {
    this.lifetime += Math.rand(-variant, variant);
  }
  variant = attributes.radiusVariant;
  if (variant) {
    this.radius += Math.rand(-variant, variant);
  }
  variant = attributes.alphaVariant;
  if (variant) {
    this.alpha = Math.clamp(this.alpha + Math.rand(-variant, variant), 0, 1);
  }
  this.age = 0;
};

Particle.prototype.update = function(dt) {
  if ((this.age += dt) > this.lifetime) {
    this.entity.destroy();
    return;
  }
  if (this.shrink) {
    this.radius *= 1 - this.shrink(this.age / this.lifetime);
    if (this.radius < 1) {
      // BAILOUT_ShapeGuard
      this.entity.destroy();
      return;
    }
  }
  if (this.fade) {
    this.alpha *= 1 - this.fade(this.age / this.lifetime);
    if (this.alpha <= 0.02) {
      // BAILOUT after getprop
      this.entity.destroy();
      return;
    }
  }
};

var crop = Vec2();
var cropOffset = Vec2();
var offset = Vec2();
var pos = Vec2(); // JIT-hint

Particle.render = function(ctx) {
  ctx.save();
  Vec2.set(crop, 50, 50);
  Vec2.set(cropOffset, -25, -25);

  var fillPrev = '';
  var alphaPrev = 1;
  ctx.globalAlpha = 1;
  var defaultComposite = Particle.defaultComposite;
  var compositePrev = defaultComposite;
  ctx.globalCompositeOperation = defaultComposite;

  var particles = this.heap;
  for (var i = 0, l = particles.length; i < l; i++) {
    var particle = particles[i];
    if (!particle.enabled) {
      continue;
    }

    var radius = particle.radius;
    pos = particle.transform.position;

    var alpha = particle.alpha;
    var composite = particle.composite || defaultComposite;

    if (composite != compositePrev) {
      compositePrev = composite;
      ctx.globalCompositeOperation = composite;
    }

    if (particle.sprite) {
      Vec2.set(offset, 0, 50 * (radius - 1 | 0));
      if (alpha !== alphaPrev) {
        alphaPrev = alpha;
        ctx.globalAlpha = alpha;
      }
      particle.sprite.draw(ctx, pos, Vec2.center, crop, offset);
    } else {
      // FIXME: ctx.globalAlpha might be set wrong
      var fill = Color.rgba(particle.color, alpha);
      if (fill != fillPrev) {
        fillPrev = fill;
        ctx.fillStyle = fill;
      }
      ctx.fillRect(
        pos[0] - radius / 2 | 0, pos[1] - radius / 2 | 0,
        radius | 0, radius | 0
      );
    }
  }
  ctx.restore();
};

Particle.generateSprite = function(attributes) {
  attributes = attributes || {};
  var color = Color(attributes.color || Color.white);
  var alpha = attributes.alpha || 1;
  var max = attributes.max || 25;
  var size = max * 2;
  var center = attributes.center || 0.5;
  var shape = attributes.shape || 'circle';

  return new Sprite(function(ctx) {
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
        ctx.arc(max, top, radius, 0, Math.TAU, true);
        ctx.closePath();
        ctx.fill();
      }
    }
  }, Vec2(size, size * max));
};

Particle.sprite = Particle.generateSprite();

new Component('particle', Particle);

Particle.Prefab = new Entity.Prefab('particle', {
  transform: null,
  kinetic: {
    mass: 0
  },
  particle: {
    sprite: Particle.sprite
  }
});

new Pool(Particle);

module.exports = Particle;
