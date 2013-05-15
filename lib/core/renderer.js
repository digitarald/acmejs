'use strict';

var Entity = require('./entity');
var Bounds = require('./bounds');
var Vec2 = require('./math').Vec2;
var Color = require('./color');


function Renderer(element, size) {
  this.element = element;
  this.size = Vec2(size);
  this.content = Vec2(size);
  this.browser = Vec2();
  this.margin = Vec2();
  this.pos = Vec2();
  this.scale = 0;
  this.orientation = 'landscape';

  this.canvas = document.createElement('canvas');
  this.element.appendChild(this.canvas);
  this.ctx = this.canvas.getContext('2d');

  this.buffer = false;
  if (this.buffer) {
    this.buf = document.createElement('canvas');
    this.bufctx = this.buf.getContext('2d');
    this.buf.width = this.content[0];
    this.buf.height = this.content[1];
  }
  this.canvas.width = this.content[0];
  this.canvas.height = this.content[1];
  this.element.style.width = this.content[0] + 'px';
  this.element.style.height = this.content[1] + 'px';

  window.addEventListener('resize', this, false);
  document.addEventListener('fullscreenchange', this, false);
  document.addEventListener('mozfullscreenchange', this, false);
  document.addEventListener('webkitfullscreenchange', this, false);

  this.reflow();
}

Renderer.prototype  = {

    handleEvent: function(evt) {
    if (~evt.type.indexOf('fullscreenchange')) {
      this.fullscreenChange();
    } else {
      this.reflow();
    }
  },

  reflow: function() {
    var browser = Vec2.set(this.browser, window.innerWidth, window.innerHeight);
    var scale = Math.min(this.browser[0] / this.content[0], this.browser[1] / this.content[1]);
    if (scale !== this.scale) {
      this.scale = scale;
      Vec2.scal(this.content, this.scale, this.size);
    }
    var off = Vec2.scal(Vec2.sub(browser, this.size, this.margin), 0.5);
    var rule = "translate(" + off[0] + "px, " + off[1] + "px) scale(" + scale + ")";
    this.element.style.transform = rule;
    this.element.style.webkitTransform = rule;
  },

  save: function() {
    var ctx = this.buffer ? this.bufctx : this.ctx;
    if (this.color) {
      ctx.fillStyle = Color.rgba(this.color);
      ctx.fillRect(0, 0, this.content[0], this.content[1]);
    } else {
      ctx.clearRect(0, 0, this.content[0], this.content[1]);
    }
    return ctx;
  },

  restore: function() {
    if (this.buffer) {
      this.ctx.clearRect(0, 0, this.content[0], this.content[1]);
      this.ctx.drawImage(this.buf, 0, 0);
    }
  },

  // FIXME: Unused
  center: function(pos) {
    Vec2.set(this.pos, pos[0] - this.size[0] / 2, pos[0] - this.size[1] / 2);
    return this;
  },

  // FIXME: Unused
  cull: function(entity) {
    var bounds = entity.bounds;
    if (!bounds) {
      return false;
    }
    if (bounds.withinRect(this.pos, this.content)) {
      if (bounds.culled) {
        bounds.culled = false;
      }
      return false;
    }
    if (!bounds.culled) {
      bounds.culled = true;
    }
    return true;
  },

  isFullscreen: function() {
    var doc = document;
    return doc.fullscreen || doc.mozFullScreen || doc.webkitIsFullScreen;
  },

  requestFullscreen: function() {
    if (!this.isFullscreen()) {
      var target = this.element.parentNode;
      if ('webkitRequestFullScreen' in target) {
        target.webkitRequestFullScreen();
      } else if ('mozRequestFullScreen' in target) {
        target.mozRequestFullScreen();
      }
    }
  },

  fullscreenChange: function() {
    if (this.orientation) {
      this.lockOrientation(this.orientation);
    }
  },

  lockOrientation: function(format) {
    if (format == null) {
      format = this.orientation;
    }
    var target = window.screen;
    if ('lockOrientation' in target) {
      screen.lockOrientation(format);
    } else if ('mozLockOrientation' in target) {
      screen.mozLockOrientation(format);
    }
  }

};

module.exports = Renderer;
