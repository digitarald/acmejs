'use strict';

var Component = require('./component');
var Vec2 = require('./math').Vec2;

/**
 * Transform
 *
 * Transform keeps track of position, angle and scale.
 *
 * It will eventually also keep track of composite and opacity.
 *
 * @extends Component
 */
function Transform() {
  this.pos = Vec2();
}

Transform.prototype = {

  attributes: {
    pos: Vec2(),
    angle: 0,
    alpha: 1
  },

  create: function(attributes) {
    Vec2.copy(this.pos, attributes.pos);
    this.angle = attributes.angle;
    this.alpha = attributes.alpha;
    this.dirty = false;
  },

  setTransform: function(pos, angle, silent) {
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
  },

  applyMatrix: function(ctx) {
    /*
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
  }

};

new Component('transform', Transform);

module.exports = Transform;
