// Generated by CoffeeScript 1.3.3
var Spring,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Spring = (function(_super) {

  __extends(Spring, _super);

  function Spring() {
    this.pos = Vec2();
  }

  Spring.prototype.alloc = function(parent, pos) {
    Spring.__super__.alloc.call(this, parent);
    return Vec2.copy(this.pos, pos);
  };

  return Spring;

})(Component);

new Pool(Spring);