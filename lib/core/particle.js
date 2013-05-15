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
}

Particle.layer = 10;

Particle.prototype.attributes = {
  color: Color.black,
  colorVariant: 0,
  lifetime: 1,
  radius: 1,
  radiusVariant: 0,
  alpha: 1,
  alphaVariant: 0,
  composite: null,
  sprite: null,
  shrink: Math.quintIn,
  fade: Math.quintIn
};

Particle.prototype.create = function(attributes) {
  this.lifetime = attributes.lifetime;
  this.radius = attributes.radius;
  this.alpha = attributes.alpha;
  this.composite = attributes.composite;
  this.sprite = attributes.sprite;
  this.shrink = attributes.shrink;
  this.fade = attributes.fade;
  Color.copy(this.color, attributes.color);

  var variant = attributes.colorVariant;
  if (variant) {
    Color.variant(this.color, variant);
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
  } else if (this.shrink && (this.radius *= 1 - this.shrink(this.age / this.lifetime)) < 1) {
    this.entity.destroy();
  } else if (this.fade && (this.alpha *= 1 - this.fade(this.age / this.lifetime)) <= 0.02) {
    this.entity.destroy();
  }
};

var crop = Vec2();
var cropOffset = Vec2();
var offset = Vec2();

Particle.render = function(ctx) {
  ctx.save();
  Vec2.set(crop, 50, 50);
  Vec2.set(cropOffset, -25, -25);
  var alphaPrev = 1;
  var entityPrev = null;
  var fillPrev = null;
  var compositePrev = null;

  var defaultComposite = Particle.defaultComposite;

  var register = this.register;
  for (var i = 0, l = register.length; i < l; i++) {
    var particle = register[i];
    if (!particle.enabled) {
      continue;
    }

    var radius = particle.radius;
    var pos = particle.transform.pos;

    var alpha = particle.alpha;
    var composite = particle.composite || defaultComposite;

    if (composite !== compositePrev) {
      ctx.globalCompositeOperation = compositePrev = composite;
    }

    if (particle.sprite) {
      Vec2.set(offset, 0, 50 * (radius - 1 | 0));
      if (alpha !== alphaPrev) {
        ctx.globalAlpha = alphaPrev = alpha;
      }
      particle.sprite.draw(ctx, pos, Vec2.center, crop, offset);
    } else {
      particle.color[3] = alpha;
      var fill = Color.rgba(particle.color);
      if (fill !== fillPrev) {
        ctx.fillStyle = fillPrev = fill;
      }
      ctx.fillRect(pos[0] - radius / 2 | 0, pos[1] - radius / 2 | 0, radius | 0, radius | 0);
    }
  }
  ctx.restore();
};



Particle.generateSprite = function(color, alpha, max, center) {
  if (color == null) {
    color = Color.white;
  }
  color = Color(color);
  if (alpha == null) {
    alpha = 1;
  }
  if (max == null) {
    max = 25;
  }
  var size = max * 2;
  if (center == null) {
    center = 0.5;
  }

  return new Sprite(function(ctx) {
    for (var radius = 1; radius <= max; radius++) {
      var top = max + size * (radius - 1);

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
      ctx.beginPath();
      ctx.arc(max, top, radius, 0, Math.TAU, true);
      ctx.closePath();
      ctx.fill();
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
