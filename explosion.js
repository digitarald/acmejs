// Generated by CoffeeScript 1.3.3
var Explosion,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Explosion = (function(_super) {

  __extends(Explosion, _super);

  Explosion.prototype.name = 'explosion';

  function Explosion() {
    Explosion.__super__.constructor.call(this);
    this.pos = Vec2();
    this.color = Color();
  }

  Explosion.prototype.alloc = function(parent, pos, lifetime, maxSize) {
    this.lifetime = lifetime != null ? lifetime : 0.4;
    this.maxSize = maxSize != null ? maxSize : 100;
    Explosion.__super__.alloc.call(this, parent);
    Vec2.copy(this.pos, pos);
    Color.copy(this.color, Color.white);
    this.age = 0;
    this.state = 'began';
    return this;
  };

  Explosion.prototype.update = function(dt, scene) {
    var acc, age, dist, factor, i, kinetic, max, particle, radius, radiusSq, _i, _j, _len, _ref;
    if (this.state === 'began') {
      max = Kinetic.maxAcc;
      radius = this.maxSize;
      radiusSq = this.maxSize * this.maxSize;
      _ref = Kinetic.pool.roster;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        kinetic = _ref[_i];
        if (!(kinetic.mass && (dist = Vec2.distSq(this.pos, kinetic.pos)) < radiusSq)) {
          continue;
        }
        factor = Math.quadOut(1 - Math.sqrt(dist) / radius);
        Vec2.add(kinetic.acc, Vec2.scal(Vec2.norm(Vec2.sub(kinetic.pos, this.pos, Vec2.cache[0])), max * factor));
      }
      acc = Vec2.cache[0];
      for (i = _j = 0; _j <= 100; i = _j += 1) {
        Vec2.norm(Vec2.set(acc, Math.randomFloat(-1, 1), Math.randomFloat(-1, 1)), null, Math.randomFloat(0, max));
        particle = Particle.alloc(this.scene, this.pos, acc, Math.randomFloat(this.lifetime / 2, this.lifetime * 2), Math.randomFloat(1, 4), 0);
      }
      this.state = 'exploding';
    }
    age = (this.age += dt);
    if (age >= this.lifetime) {
      this.free();
    } else {
      this.factor = Math.quadOut(age / this.lifetime);
      this.size = this.factor * this.maxSize;
    }
    return this;
  };

  Explosion.prototype.render = function(ctx) {
    var circles, factor, i, pos, _i;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    pos = this.pos;
    circles = 10;
    for (i = _i = 1; _i <= circles; i = _i += 1) {
      factor = Math.quadOut(i / circles);
      ctx.beginPath();
      ctx.arc(pos[0] | 0, pos[1] | 0, this.size * factor | 0, 0, Math.TAU, true);
      ctx.closePath();
      this.color[3] = factor * (1 - this.factor);
      ctx.lineWidth = 10 * factor;
      ctx.strokeStyle = Color.rgba(this.color);
      ctx.stroke();
    }
    ctx.restore();
    return this;
  };

  return Explosion;

})(Composite);

new Pool(Explosion);