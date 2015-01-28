'use strict';

var Entity = require('./entity');
var Bounds = require('./bounds');
var Vec2 = require('../math/vec2');
var Color = require('./color');

function Renderer(element, size) {
	this.element = element || document.body;
	this.size = Vec2(size);
	this.color = Color.white;
	this.content = Vec2(size);
	this.browser = Vec2();
	this.margin = Vec2();
	this.position = Vec2();
	this.scale = 0;
	this.orientation = 'landscape';

	this.canvas = document.createElement('canvas');
	if (this.color != null) {
		this.canvas.mozOpaque = true;
	}
	this.ctx = this.canvas.getContext('2d');

	// var deviceRatio = window.devicePixelRatio || 1;
	// var backingStoreRatio = this.ctx.backingStorePixelRatio ||
	// 	this.ctx.webkitBackingStorePixelRatio ||
	// 	this.ctx.mozBackingStorePixelRatio || 1;
	// this.ratio = deviceRatio / backingStoreRatio;
	this.ratio = 1;

	// var oldSave = this.ctx.save;
	// var oldRestore = this.ctx.restore;
	// this.ctx.save = function() {
	// 	this.saved++;
	// 	// console.log('SAVE');
	// 	// debugger;
	// 	oldSave.call(this);
	// };
	// this.ctx.restore = function() {
	// 	this.saved--;
	// 	// console.log('RESTORE');
	// 	// debugger;
	// 	oldRestore.call(this);
	// }
	// this.ctx.saved = 0;

	this.canvas.width = this.content[0] * this.ratio;
	this.canvas.height = this.content[1] * this.ratio;
	this.element.style.width = this.content[0] + 'px';
	this.element.style.height = this.content[1] + 'px';
	this.element.appendChild(this.canvas);

	var style = this.element.style;
	this.transformProp = ['transform', 'webkitTransform'].filter(function(key) {
		return style[key] != null;
	})[0];

	window.addEventListener('resize', this, false);
	this.reflow();
}

Renderer.prototype = {

	handleEvent: function(evt) {
		this.reflow();
	},

	reflow: function() {
		var browser = this.browser;
		Vec2.set(browser, window.innerWidth, window.innerHeight);
		var scale = Math.min(browser[0] / this.content[0],
			browser[1] / this.content[1]);
		if (scale !== this.scale) {
			this.scale = scale;
			Vec2.scale(this.content, this.scale, this.size);
		}
		var offset = Vec2.scale(Vec2.sub(browser, this.size, this.margin), 0.5);
		this.element.style[this.transformProp] = 'translate(' + (offset[0] | 0) +
			'px, ' + (offset[1] | 0) + 'px) scale(' + scale + ')';
	},

	save: function() {
		var ctx = this.ctx;
		this.ctx.save();
		if (this.color != null) {
			ctx.fillStyle = Color.rgba(this.color);
			ctx.fillRect(0, 0, this.content[0], this.content[1]);
		} else {
			ctx.clearRect(0, 0, this.content[0], this.content[1]);
		}
		ctx.scale(this.ratio, this.ratio);
		return ctx;
	},

	restore: function() {
		this.ctx.restore();
		// TODO: Filters?
	}

	// cull: function(entity) {
	//   var bounds = entity.bounds;
	//   if (!bounds) {
	//     return false;
	//   }
	//   if (bounds.withinRect(this.position, this.content)) {
	//     if (bounds.culled) {
	//       bounds.culled = false;
	//     }
	//     return false;
	//   }
	//   if (!bounds.culled) {
	//     bounds.culled = true;
	//   }
	//   return true;
	// },

	// isFullscreen: function() {
	//   var doc = document;
	//   return doc.fullscreen || doc.mozFullScreen || doc.webkitIsFullScreen;
	// },

	// requestFullscreen: function() {
	//   if (!this.isFullscreen()) {
	//     var target = this.element.parentNode;
	//     if ('webkitRequestFullScreen' in target) {
	//       target.webkitRequestFullScreen();
	//     } else if ('mozRequestFullScreen' in target) {
	//       target.mozRequestFullScreen();
	//     }
	//   }
	// },

	// fullscreenChange: function() {
	//   if (this.orientation) {
	//     this.lockOrientation(this.orientation);
	//   }
	// },

	// lockOrientation: function(format) {
	//   if (format == null) {
	//     format = this.orientation;
	//   }
	//   var target = window.screen;
	//   if ('lockOrientation' in target) {
	//     screen.lockOrientation(format);
	//   } else if ('mozLockOrientation' in target) {
	//     screen.mozLockOrientation(format);
	//   }
	// }

};

module.exports = Renderer;