'use strict';

var Component = require('./component');
var Pool = require('./pool');
var Vec2 = require('./math').Vec2;

function Transform() {
  this.pos = Vec2();
  this.angle = 0;
  this.alpha = 1;
  this.dirty = false;
}

Transform.prototype = Object.create(Component.prototype);

Transform.prototype.tag = 'transform';

Transform.prototype.attributes = {
  pos: Vec2(),
  angle: 0,
  alpha: 1
};

Transform.prototype.create = function(attributes) {
  Vec2.copy(this.pos, attributes.pos);
  this.angle = attributes.angle;
  this.alpha = attributes.alpha;
};

Transform.prototype.setTransform = function(pos, angle, silent) {
  if (pos != null) {
    Vec2.copy(this.pos, pos);
  }
  if (angle != null) {
    this.angle = angle;
  }
  this.dirty = true;
  if (!silent) {
    this.entity.pub('onTransform', this.pos, this.angle);
  }
};

Transform.prototype.applyMatrix = function(ctx) {
  /**
   mat = Mat2.trans(Mat2.identity, @pos, @matrix)
   ctx.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5])
   if Vec2.lenSq(@pos)
   ctx.translate(@pos[0] | 0, @pos[1] | 0)
   if (x = @scale[0]) isnt 1 or (y = @scale[1]) isnt 1
    ctx.scale(x, y)
   */
  ctx.translate(this.pos[0] | 0, this.pos[1] | 0);
  if (this.angle) {
    ctx.rotate(this.angle);
  }
};

new Pool(Transform);

module.exports = Transform;
