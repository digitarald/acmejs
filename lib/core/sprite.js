'use strict';
/**
 * @module core/sprite
 */

var Vec2 = require('../math/vec2');
var Component = require('./component');
var Pool = require('./pool');

/**
 * Loads and paints a single image file. Either loaded from source or drawn via callback, created from given width/height.
 * @class
 * @param {String|Function} srcOrRepaint URL or callback to draw image on demand
 * @param {Number[]} size (optional) Override size for drawing canvas
 * @param {Number} baseScale (optional) Base scale applied to all draws, defaults to 1
 */
function SpriteAsset(srcOrRepaint, size, baseScale) {
	this.baseScale = (baseScale != null) ? baseScale : 1;
	this.size = Vec2(size);
	this.bufferSize = Vec2(size);
	this.defaultAnchor = Vec2.topLeft;
	this.defaultOffset = Vec2();
	this.defaultScale = Vec2(1, 1);
	this.buffer = document.createElement('canvas');
	this.bufferCtx = this.buffer.getContext('2d');
	this.scale = 1;
	this.ready = false;
	this.repaintSrc = null;
	this.customRepaint = null;
	this.src = '';
	this.loading = false;

	// console.log(typeof srcOrRepaint);

	switch (typeof srcOrRepaint) {
		case 'string':
			this.src = srcOrRepaint;
			var img = new Image();
			this.img = img;
			img.addEventListener('load', this);
			this.loading = true;
			img.src = srcOrRepaint;
			if (this.loading && img.width && img.height) {
				this.handleEvent();
			}
			break;
		case 'function':
			this.customRepaint = srcOrRepaint;
			this.refresh();
			break;
		case 'object':
			this.repaintSrc = srcOrRepaint;
			this.refresh();
			break;
	}
}

SpriteAsset.prototype = {

	toString: function() {
		var url = (this.buffer) ? this.buffer.toDataURL() : 'Pending';
		return 'SpriteAsset ' + (Vec2.toString(this.size)) + ' ' +
			(Vec2.toString(this.bufferSize)) + '\n' +
			(this.src || this.repaint) + '\n' +
			url;
	},

	repaintOnComponent: function() {
		this.repaintSrc.onRepaint(this.bufferCtx, this);
	},

	handleEvent: function() {
		// console.log('Loaded ' + this);
		if (!this.loading) {
			return;
		}
		this.loading = false;
		Vec2.set(this.size, this.img.width, this.img.height);
		this.refresh();
	},

	/**
	 * Draw whole or sprite of image to canvas. Draws only if image is loaded.
	 * @param {Object} ctx 2d-canvas context
	 * @param {Number[]} toPos (optional) Position to draw to.
	 * @param {Number[]} anchor (optional) anchor draw position, between
	 *   lower-left [-1, -1] and upper-right [1, 1]
	 * @param {Number[]} size (optional) Target size
	 * @param {Number[]} fromPos (optional) Source position (for sprites)
	 * @param {Number[]} scale (optional) Target scaling, applied to size
	 */
	draw: function(ctx, toPos, anchor, size, fromPos, scale) {
		if (!this.ready) {
			return;
		}
		if (toPos == null) {
			toPos = Vec2.zero;
		}
		if (anchor == null) {
			anchor = this.defaultAnchor;
		}
		if (size == null) {
			size = this.bufferSize;
		}
		if (fromPos == null) {
			fromPos = this.defaultOffset;
		}
		if (scale == null) {
			scale = this.defaultScale;
		}
		ctx.drawImage(this.buffer,
			fromPos[0] | 0, fromPos[1] | 0,
			size[0], size[1],
			toPos[0] - size[0] * anchor[0] + 0.5 | 0,
			toPos[1] - size[1] * anchor[1] + 0.5 | 0,
			size[0] * scale[0], size[1] * scale[1]
		);
	},

	repaint: function() {
		var size = this.size;
		this.buffer.width = size[0];
		this.buffer.height = size[1];
		this.bufferCtx.drawImage(this.img, 0, 0, size[0], size[1]);
		this.sample();
	},

	sample: function() {
		var scale = this.scale;
		var size = this.size;
		var bufferCtx = this.bufferCtx;
		var data = bufferCtx.getImageData(0, 0, size[0], size[1]).data;
		this.buffer.width = this.bufferSize[0];
		this.buffer.height = this.bufferSize[1];
		for (var x = 0, w = size[0], h = size[1]; x <= w; x += 1) {
			for (var y = 0; y <= h; y += 1) {
				var i = (y * size[0] + x) * 4;
				bufferCtx.fillStyle = 'rgba(' + data[i] + ', ' + data[i + 1] + ', ' +
					data[i + 2] + ', ' + (data[i + 3] / 255) + ')';
				bufferCtx.fillRect(x * scale, y * scale, scale, scale);
			}
		}
	},

	refresh: function(scale) {
		// console.log('Refresh');
		scale = (scale || 1) * this.baseScale;
		if (this.ready && this.scale == scale) {
			return;
		}
		this.scale = scale;
		this.buffer.width = this.bufferSize[0] = this.size[0] * scale | 0;
		this.buffer.height = this.bufferSize[1] = this.size[1] * scale | 0;
		// Vec2.scale(this.bufferSize, -0.5, this.defaultOffset);
		if (this.repaintSrc) {
			this.repaintOnComponent();
		} else if (this.customRepaint) {
			this.customRepaint(this.bufferCtx, this);
		} else {
			this.repaint();
		}
		this.ready = true;
	}

};

/**
 * Sprite-sheet for animations.
 * @class
 * @param {Object} attributes sprites, frames, speed, size, anchor, sequences
 */
function SpriteSheet(attributes) {
	var sprites = attributes.sprites || [];
	this.sprites = Array.isArray(sprites) ? sprites : [sprites];
	this.frames = [];
	if (Array.isArray(attributes.frames)) {
		var frames = attributes.frames;
		for (var i = 0, l = frames.length; i < l; i++) {
			this.frames.push(frames[i]);
		}
	}
	this.defaults = {
		speed: (attributes.speed != null) ? attributes.speed : 0,
		size: attributes.size || Vec2(1, 1),
		anchor: attributes.anchor || Vec2.center
	};
	this.sequences = {};
	var sequences = attributes.sequences || {};
	for (var id in sequences) {
		this.addSequence(id, sequences[id]);
	}
}

SpriteSheet.prototype = {
	/**
	 * Add sequence to spritesheet.
	 * Sequences are defined as short-form by Array:
	 *   [frameIndexes, next || null, speed || defaultSpeed || sprite || 0]
	 * or Object:
	 *   {frames: [], next: 'id', speed: seconds, sprite: 0}
	 * @param {String} id       Sequence name (walk, jump, etc)
	 * @param {Array|Object} sequence Array or object
	 */
	addSequence: function(id, sequence) {
		if (Array.isArray(sequence)) {
			// Convert short form Array to Object
			var frames = [];
			for (var frame = sequence[0], l = sequence[1]; frame <= l; frame++) {
				frames.push(frame);
			}
			sequence = {
				frames: frames,
				next: sequence[2] || null,
				speed: sequence[3] || this.defaults.speed,
				name: id,
				sprite: sequence[4] || 0
			};
		}
		if (sequence.next === true) {
			sequence.next = id;
		}
		if (!sequence.speed) {
			sequence.speed = this.defaults.speed;
		}

		this.sequences[id] = sequence;
		if (!this.defaultSequence) {
			this.defaultSequence = id;
		}
	},

	prepare: function() {
		var sprites = this.sprites;
		for (var i = 0, l = sprites.length; i < l; i++) {
			if (!sprites[i].ready) {
				return false;
			}
		}
		if (!this.frames.length) {
			var defaults = this.defaults;
			var size = defaults.size;
			var anchor = defaults.anchor || Vec2.center;
			for (i = 0, l = sprites.length; i < l; i++) {
				var sprite = sprites[i];
				var cols = sprite.size[0] / size[0] | 0;
				var rows = sprite.size[1] / size[1] | 0;
				// debugger;
				for (var y = 0; y < rows; y++) {
					for (var x = 0; x < cols; x++) {
						this.frames.push({
							sprite: sprite,
							position: Vec2(x * size[0], y * size[1]),
							size: size,
							anchor: anchor
						});
					}
				}
			}
		}
		this.ready = true;
		return true;
	},

	draw: function(ctx, idx) {
		if (!this.ready && !this.prepare()) {
			return;
		}
		var frame = this.frames[idx || 0];
		frame.sprite.draw(ctx, null, frame.anchor, frame.size, frame.position);
	}
};

/**
 * Sprite Tween lets components draw animation sequences from Sheets.
 * @class
 * @extends Component
 */
function SpriteTween() {
	Component.call(this);
	this.asset = null;
	this.sequence = null;
	this.speed = 0.0;
	this.offset = 0.0;
	this.isSheet = false;
	this.paused = false;
	this.dtime = 0.0;
	this.frame = 0;
}

SpriteTween.prototype = {
	attributes: {
		asset: null,
		speed: 0,
		sequence: null,
		offset: 0
	},

	create: function() {
		// this.asset = attributes.asset;
		// this.sequence = attributes.sequence;
		// this.speed = attributes.speed;
		this.isSheet = this.asset instanceof SpriteSheet;
		if (this.isSheet) {
			this.frame = 0;
			if (!this.speed) {
				this.speed = this.asset.defaults.speed;
			}
			this.dtime = this.offset;
			if (!this.sequence) {
				this.sequence = this.asset.defaultSequence;
			}
		}
		this.paused = !this.speed;
	},

	preRender: function(dt) {
		if (!this.isSheet || this.paused) {
			return;
		}
		var frames = null;
		var speed = 0.0;
		var frameCount = 0;
		var dtime = (this.dtime += dt);
		if (this.sequence) {
			var sequence = this.asset.sequences[this.sequence];
			speed = sequence.speed;
			frames = sequence.frames;
			frameCount = frames.length;
			if (dtime >= frameCount * speed) {
				this.entity.emit('onSequenceEnd');
				if (sequence.next) {
					if (sequence.next !== this.sequence) {
						this.goto(sequence.next);
						return;
					}
				} else {
					this.pause();
					return;
				}
				dtime = dtime % (frameCount * speed);
			}
			this.frame = frames[dtime / speed | 0];
		} else {
			frames = this.asset.frames;
			frameCount = frames.length;
			speed = this.speed;
			dtime = dtime % (frameCount * speed);
			var frame = dtime / speed | 0;
			if (frame < this.frame) {
				this.entity.emit('onSequenceEnd');
			}
			this.frame = dtime / speed | 0;
		}
	},

	pause: function() {
		this.paused = true;
		return this;
	},

	play: function() {
		this.paused = false;
		return this;
	},

	goto: function(id) {
		if (isNaN(id)) {
			if (this.sequence != id) {
				this.dtime = 0;
				this.sequence = id;
				if (this.paused) {
					this.paused = false;
					this.preRender(0);
					this.paused = true;
				}
			}
		} else {
			this.sequence = null;
			this.frame = id;
		}
		return this;
	}
};

Component.create(SpriteTween, 'spriteTween');

/**
 * @class
 * @extends Component
 */
function SpriteCanvasRenderer() {
	Component.call(this);
}

var compositeLevels = {};
compositeLevels[0] = 'source-over';
var alphaLevels = {};
alphaLevels[0] = 1.0;

SpriteCanvasRenderer.prototype = {
	render: function(ctx) {
		var scene = this.entity.scene;
		var child = scene.firstChild;
		if (child == null) {
			return;
		}
		var composite = 'source-over';
		var alpha = 1.0;
		var level = 0;
		ctx.save();
		while (child) {
			var tween = child.components.spriteTween;
			if (tween != null && tween.enabled) {
				var transform = child.components.transform;
				transform.applyMatrixWorld(ctx);
				if (transform.composite != composite) {
					composite = transform.composite;
					ctx.globalCompositeOperation = composite;
				}
				if (transform.alpha != alpha) {
					alpha = transform.alpha;
					ctx.globalAlpha = alpha;
				}
				tween.asset.draw(ctx, tween.frame);
			}
			if (child.firstChild != null) {
				level++;
				child = child.firstChild;
			} else {
				while (child.next == null) {
					level--;
					child = child.parent;
					if (child == scene) {
						ctx.restore();
						return;
					}
				}
				child = child.next;
			}
		}
		ctx.restore();
	}
};

Component.create(SpriteCanvasRenderer, 'spriteCanvasRenderer');

module.exports.Asset = SpriteAsset;
module.exports.Tween = SpriteTween;
module.exports.Sheet = SpriteSheet;
module.exports.CanvasRenderer = SpriteCanvasRenderer;
