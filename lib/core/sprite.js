'use strict';

var Vec2 = require('./math').Vec2;
var Component = require('./component');
var Pool = require('./pool');

/**
 * Sprite.Asset
 *
 * Represents a single image, either loaded from source or drawn via
 * callback.
 *
 * @param {String|Function} srcOrRepaint [description]
 * @param {Array} size Override size for drawing canvas
 * @param {Number} baseScale Base scale applied to all draws, defaults to 1
 */
function SpriteAsset(srcOrRepaint, size, baseScale) {
	this.baseScale = (baseScale != null) ? baseScale : 1;
	this.size = Vec2(size);
	this.bufferSize = Vec2(size);
	this.defaultAlign = Vec2.center;
	this.defaultOffset = Vec2();
	this.defaultScale = Vec2(1, 1);
	this.buffer = document.createElement('canvas');
	this.bufferCtx = this.buffer.getContext('2d');
	this.scale = 1;
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
			this.repaint = srcOrRepaint;
			this.refresh();
			break;
	}
}

SpriteAsset.prototype.toString = function() {
	var url = (this.buffer) ? this.buffer.toDataURL() : 'Pending';
	return "SpriteAsset " + (Vec2.toString(this.size)) + " " +
		(Vec2.toString(this.bufferSize)) + "\n" +
		(this.src || this.repaint) + "\n" +
		url;
};

SpriteAsset.prototype.handleEvent = function() {
	// console.log('Loaded ' + this);
	if (!this.loading) {
		return;
	}
	this.loading = false;
	Vec2.set(this.size, this.img.width, this.img.height);
	this.refresh();
};

SpriteAsset.prototype.draw = function(ctx, toPos, align, size, fromPos, scale) {
	if (!this.ready) {
		return;
	}
	if (!toPos) {
		toPos = Vec2.zero;
	}
	if (!align) {
		align = this.defaultAlign;
	}
	if (!size) {
		size = this.bufferSize;
	}
	if (!fromPos) {
		fromPos = this.defaultOffset;
	}
	if (!scale) {
		scale = this.defaultScale;
	}
	ctx.drawImage(this.buffer,
		fromPos[0] | 0, fromPos[1] | 0,
		size[0], size[1],
		toPos[0] - size[0] / 2 * (align[0] + 1) | 0,
		toPos[1] - size[1] / 2 * (align[1] + 1) | 0,
		size[0] * scale[0], size[1] * scale[1]
	);
};

SpriteAsset.prototype.repaint = function() {
	var size = this.size;
	this.buffer.width = size[0];
	this.buffer.height = size[1];
	this.bufferCtx.drawImage(this.img, 0, 0, size[0], size[1]);
	this.sample();
};

SpriteAsset.prototype.sample = function() {
	var scale = this.scale;
	var size = this.size;
	var bufferCtx = this.bufferCtx;
	var data = bufferCtx.getImageData(0, 0, size[0], size[1]).data;
	this.buffer.width = this.bufferSize[0];
	this.buffer.height = this.bufferSize[1];
	for (var x = 0, w = size[0], h = size[1]; x <= w; x += 1) {
		for (var y = 0; y <= h; y += 1) {
			var i = (y * size[0] + x) * 4;
			bufferCtx.fillStyle = "rgba(" + data[i] + ", " + data[i + 1] + ", " +
				data[i + 2] + ", " + (data[i + 3] / 255) + ")";
			bufferCtx.fillRect(x * scale, y * scale, scale, scale);
		}
	}
};

SpriteAsset.prototype.refresh = function(scale) {
	// console.log('Refresh');
	scale = (scale || 1) * this.baseScale;
	if (this.ready && this.scale === scale) {
		return;
	}
	this.scale = scale;
	this.buffer.width = this.bufferSize[0] = this.size[0] * scale | 0;
	this.buffer.height = this.bufferSize[1] = this.size[1] * scale | 0;
	Vec2.scal(this.bufferSize, -0.5, this.defaultOffset);
	this.repaint(this.bufferCtx, scale);
	this.ready = true;
};


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
	this.defaults = {};
	this.defaults.speed = attributes.speed || 0.2;
	this.defaults.size = attributes.size || Vec2(1, 1);
	this.defaults.align = attributes.align || Vec2.center;
	this.sequences = {};
	var	sequences = attributes.sequences || {};
	for (var id in sequences) {
		this.addSequence(id, sequences[id]);
	}
}

/**
 * Add sequence to spritesheet.
 *
 * Sequences are defined as short-form by Array:
 *   [frameIndexes, next || null, speed || defaultSpeed || sprite || 0]
 * or Object:
 *   {frames: [], next: "id", speed: seconds, sprite: 0}
 *
 * @param {String} id       Sequence name (walk, jump, etc)
 * @param {Array|Object} sequence Array or object
 */
SpriteSheet.prototype.addSequence = function(id, sequence) {
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
};

SpriteSheet.prototype.prepare = function() {
	var sprites = this.sprites;
	for (var i = 0, l = sprites.length; i < l; i++) {
		if (!sprites[i].ready) {
			return false;
		}
	}
	if (!this.frames.length) {
		var defaults = this.defaults;
		var size = defaults.size;
		var align = defaults.align;
		for (var j = 0, l = sprites.length; j < l; j++) {
			var sprite = sprites[j];
			var cols = sprite.size[0] / size[0] | 0;
			var rows = sprite.size[1] / size[1] | 0;
			// debugger;
			for (var y = 0; y < rows; y++) {
				for (var x = 0; x < cols; x++) {
					this.frames.push({
						sprite: sprite,
						pos: Vec2(x * size[0], y * size[1]),
						size: size,
						align: align || Vec2.center
					});
				}
			}
		}
	}
	this.ready = true;
	return true;
};

SpriteSheet.prototype.draw = function(ctx, idx) {
	if (!this.ready && !this.prepare()) {
		return;
	}
	var frame = this.frames[idx || 0];
	frame.sprite.draw(ctx, null, frame.align, frame.size, frame.pos);
};


function SpriteTween() {}

SpriteTween.prototype.attributes = {
	asset: null,
	speed: null,
	sequence: null,
	offset: 0,
	composite: null
};

SpriteTween.prototype.create = function(attributes) {
	this.asset = attributes.asset;
	this.composite = attributes.composite;
	this.sequence = attributes.sequence;
	this.speed = attributes.speed;
	this.isSheet = this.asset instanceof SpriteSheet;
	if (this.isSheet) {
		this.frame = 0;
		if (this.speed == null) {
			this.speed = this.asset.defaults.speed;
		}
		this.dtime = attributes.offset;
		if (!this.sequence) {
			this.sequence = this.asset.defaultSequence;
		}
	}
};

SpriteTween.prototype.preRender = function(dt) {
	if (this.isSheet && !this.paused) {
		var dtime = (this.dtime += dt);
		if (this.sequence) {
			var sequence = this.asset.sequences[this.sequence];
			var speed = sequence.speed;
			var frames = sequence.frames;
			var frameCount = frames.length;
			if (dtime >= frameCount * speed) {
				this.entity.pub('onSequenceEnd');
				if (sequence.next) {
					if (sequence.next !== this.sequence) {
						return this.goto(sequence.next);
					}
				} else {
					this.pause();
					return this;
				}
				dtime = dtime % (frameCount * speed);
			}
			this.frame = frames[dtime / speed | 0];
		} else {
			var frames = this.asset.frames;
			var frameCount = frames.length;
			var speed = this.speed;
			var dtime = dtime % (frameCount * speed);
			var frame = dtime / speed | 0;
			if (frame < this.frame) {
				this.entity.pub('onSequenceEnd');
			}
			this.frame = dtime / speed | 0;
		}
	}
};

SpriteTween.prototype.render = function(ctx) {
	ctx.save();
	this.transform.applyMatrix(ctx);
	if (this.composite) {
		ctx.globalCompositeOperation = this.composite;
	}
	this.asset.draw(ctx, this.frame);
	ctx.restore();
};

SpriteTween.prototype.pause = function() {
	this.paused = true;
	return this;
};

SpriteTween.prototype.play = function() {
	this.paused = false;
	return this;
};

SpriteTween.prototype.goto = function(id) {
	if (isNaN(id)) {
		if (this.sequence !== id) {
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
		this.frameIndex = id;
	}
	return this;
};

new Component('spriteTween', SpriteTween);

module.exports.Asset = SpriteAsset;
module.exports.Tween = SpriteTween;
module.exports.Sheet = SpriteSheet;
