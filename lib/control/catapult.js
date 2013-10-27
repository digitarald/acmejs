'use strict';

var Vec2 = require('./math').Vec2;
var Color = require('./color');

function Catapult() {
  this.position = Vec2();
  this.color = Color();
  this.start = Vec2();
  this.end = Vec2();
  this.impulse = Vec2();
  this.impulseNorm = Vec2();
}

Catapult.prototype.attributes = {
  position: Vec2(),
  color: Color.white
};

Catapult.prototype.create = function(attributes) {
  Vec2.copy(this.position, attributes.position);
  Color.copy(this.color, attributes.color);
  this.state = null;
  this.radius = 90;
  this.listenRadius = this.radius * 0.15;
  this.fireRadius = this.radius * 0.1;
  this.listenRadiusSq = this.listenRadius * this.listenRadius;
  Vec2.set(this.impulse);
};

Catapult.prototype.update = function(dt) {
  if (this.state === 'fired') {
    this.entity.trigger('onCatapultFire', this.impulseNorm);
  }

  var input = Engine.input;

  switch (this.state) {
    case 'active':
      switch (input.touchState) {
        case 'moved':
          var end = Vec2.copy(cache, input.position);
          Vec2.limit(Vec2.sub(end, this.start, this.impulse), this.radius);
          if (Vec2.len(this.impulse) < this.fireRadius) {
            Vec2.set(this.impulse);
          }
          Vec2.scale(this.impulse, 1 / this.radius, this.impulseNorm);
          this;
          break;

        case 'ended':
          if (Vec2.dist(this.start, input.position) < this.fireRadius) {
            this.state = null;
          } else {
            this.state = 'fired';
          }
      }
      break;

    case 'fired':
      this.state = null;
      break;

    default:
      if (input.touchState === 'began' && Vec2.distSq(input.position, this.position) <= this.listenRadiusSq) {
        this.state = 'active';
        Vec2.copy(this.start, input.position);
        Vec2.set(this.impulse);
        Vec2.set(this.impulseNorm);
      }
      break;
  }
};

Catapult.prototype.render = function(ctx) {
  var active = this.state === 'active';
  var pos = this.position;

  this.color[3] = active ? 1 : 0.3;

  ctx.strokeStyle = Color.rgba(this.color);
  ctx.beginPath();
  ctx.arc(pos[0] | 0, pos[1] | 0, this.listenRadius, 0, Math.TAU, true);
  ctx.closePath();
  ctx.stroke();

  if (active) {
    var target = Vec2.add(pos, this.impulse, cache);
    ctx.lineWidth = 1;
    this.color[3] = 0.5;
    ctx.strokeStyle = Color.rgba(this.color);
    this.color[3] = 0.2;
    ctx.fillStyle = Color.rgba(this.color);
    ctx.beginPath();
    ctx.arc(target[0] | 0, target[1] | 0, this.fireRadius, 0, Math.TAU, true);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
  }
};

var cache = Vec2();

new Component('catapult', Catapult);

module.exports = Catapult;
