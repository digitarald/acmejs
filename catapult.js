// Generated by CoffeeScript 1.3.3
var Catapult,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Catapult = (function(_super) {

  __extends(Catapult, _super);

  Catapult.prototype.name = 'catapult';

  function Catapult() {
    this.pos = Vec2();
    this.color = Color();
    this.start = Vec2();
    this.end = Vec2();
    this.acc = Vec2();
    this.accNorm = Vec2();
    Catapult.__super__.constructor.call(this);
  }

  Catapult.prototype.alloc = function(parent, pos) {
    Vec2.copy(this.pos, pos);
    Color.copy(this.color, Color.white);
    this.state = null;
    this.radius = 90;
    this.listenRadius = this.radius * 0.15;
    this.fireRadius = this.radius * 0.1;
    this.listenRadiusSq = this.listenRadius * this.listenRadius;
    Vec2.set(this.acc);
    return Catapult.__super__.alloc.call(this, parent);
  };

  Catapult.prototype.update = function(dt) {
    var acc, border, end, i, input, particle, perAcc, perPos, rand, randAcc, _i, _ref;
    if (this.state === 'fired') {
      acc = Vec2.scal(this.accNorm, -Kinetic.maxAcc, Vec2.cache[0]);
      rand = Vec2.cache[1];
      perAcc = Vec2.cache[2];
      perPos = Vec2.cache[3];
      randAcc = Kinetic.maxAcc * 0.2;
      for (i = _i = 0, _ref = Math.randomFloat(50, 75); _i <= _ref; i = _i += 1) {
        Vec2.add(acc, Vec2.set(rand, Math.randomFloat(-randAcc, randAcc), Math.randomFloat(-randAcc, randAcc)), perAcc);
        Vec2.add(this.pos, Vec2.set(rand, Math.randomFloat(-5, 5), Math.randomFloat(-5, 5)), perPos);
        particle = Particle.alloc(this.scene, perPos, perAcc, Math.randomFloat(15, 25, Math.cubicOut), Math.randomFloat(1, 15, Math.quadIn));
        Boid.alloc(particle);
        border = Border.alloc(particle);
      }
    }
    input = Engine.input;
    switch (this.state) {
      case null:
        if (input.touchState === 'began' && Vec2.distSq(input.pos, this.pos) <= this.listenRadiusSq) {
          this.state = 'active';
          Vec2.copy(this.start, input.pos);
          Vec2.set(this.acc);
          Vec2.set(this.accNorm);
        }
        break;
      case 'active':
        switch (input.touchState) {
          case 'moved':
            end = Vec2.copy(Vec2.cache[0], input.pos);
            Vec2.limit(Vec2.sub(end, this.start, this.acc), this.radius);
            if (Vec2.len(this.acc) < this.fireRadius) {
              Vec2.set(this.acc);
            }
            Vec2.scal(this.acc, 1 / this.radius, this.accNorm);
            this;

            break;
          case 'ended':
            if (Vec2.dist(this.start, input.pos) < this.fireRadius) {
              this.state = null;
            } else {
              this.state = 'fired';
            }
        }
        break;
      case 'fired':
        this.state = null;
        break;
    }
    return this;
  };

  Catapult.prototype.render = function(ctx) {
    var active, pos, target;
    active = this.state === 'active';
    pos = this.pos;
    this.color[3] = active ? 1 : 0.3;
    ctx.strokeStyle = Color.rgba(this.color);
    ctx.beginPath();
    ctx.arc(pos[0] | 0, pos[1] | 0, this.listenRadius, 0, Math.TAU, true);
    ctx.closePath();
    ctx.stroke();
    if (active) {
      target = Vec2.add(pos, this.acc, Vec2.cache[0]);
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
    return this;
  };

  return Catapult;

})(Composite);

new Pool(Catapult);