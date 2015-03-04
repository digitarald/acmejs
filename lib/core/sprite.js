'use strict';
/**
 * @module core/sprite
 */

import Vec2 from '../math/vec2'
import Component from './component'
import Context from './context'

/**
 * Loads and paints a single image file. Either loaded from source or drawn via callback, created from given width/height.
 * @class
 * @param {String|Function} srcOrRepaint URL or callback to draw image on demand
 * @param {Number[]} size (optional) Override size for drawing canvas
 * @param {Number} baseScale (optional) Base scale applied to all draws, defaults to 1
 */
export class SpriteAsset {
	constructor(srcOrRepaint, size, baseScale) {
	 	this.baseScale = (baseScale != null) ? baseScale : 1;
		this.size = Vec2(size);
		this.bufferSize = Vec2(size);
		this.defaultAnchor = Vec2.center;
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
				let img = new Image();
				this.img = img;
				img.addEventListener('load', this);
				this.loading = true;
				img.src = srcOrRepaint;
				Context.emit('spriteAssetWillLoad', this);
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

	toString() {
		let url = (this.buffer) ? this.buffer.toDataURL() : 'Pending';
		var size = Vec2.toString(this.size);
		var bufferSize = Vec2.toString(this.bufferSize);
		var src = this.src || this.repaint;
		return `SpriteAsset ${size} ${bufferSize}\n${src}\n${url}`;
	}

	repaintOnComponent() {
		this.repaintSrc.onRepaint(this.bufferCtx, this);
	}

	handleEvent() {
		this.img.removeEventListener('load', this);
		if (!this.loading) {
			return;
		}
		this.loading = false;
		Vec2.set(this.size, this.img.width, this.img.height);
		Context.emit('assetDidLoad', this);
		this.refresh();
	}

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
	draw(ctx, toPos, anchor, size, fromPos, scale) {
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
	}

	repaint() {
		let size = this.size;
		this.buffer.width = size[0];
		this.buffer.height = size[1];
		this.bufferCtx.drawImage(this.img, 0, 0, size[0], size[1]);
		this.sample();
	}

	sample() {
		let scale = this.scale;
		let size = this.size;
		let bufferCtx = this.bufferCtx;
		let data = bufferCtx.getImageData(0, 0, size[0], size[1]).data;
		this.buffer.width = this.bufferSize[0];
		this.buffer.height = this.bufferSize[1];
		for (let x = 0, w = size[0], h = size[1]; x <= w; x += 1) {
			for (let y = 0; y <= h; y += 1) {
				let i = (y * size[0] + x) * 4;
				bufferCtx.fillStyle = 'rgba(' + data[i] + ', ' + data[i + 1] + ', ' +
					data[i + 2] + ', ' + (data[i + 3] / 255) + ')';
				bufferCtx.fillRect(x * scale, y * scale, scale, scale);
			}
		}
	}

	refresh(scale) {
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
		Context.emit('spriteAssetRefresh', this);
	}
};

/**
 * Sprite-sheet for animations.
 * @class
 * @param {Object} attributes sprites, frames, speed, size, anchor, sequences
 */
export class SpriteSheet {
	constructor(attributes) {
		let sprites = attributes.sprites || [];
		this.sprites = Array.isArray(sprites) ? sprites : [sprites];
		this.frames = [];
		if (Array.isArray(attributes.frames)) {
			let frames = attributes.frames;
			for (let i = 0, l = frames.length; i < l; i++) {
				this.frames.push(frames[i]);
			}
		}
		this.defaults = {
			speed: (attributes.speed != null) ? attributes.speed : 0,
			size: attributes.size || Vec2(1, 1),
			anchor: attributes.anchor || Vec2.center
		};
		this.sequences = {};
		let sequences = attributes.sequences || {};
		Context.emit('spriteSheetCreate', this);
		for (let id in sequences) {
			this.addSequence(id, sequences[id]);
		}
	}

	/**
	 * Add sequence to spritesheet.
	 * Sequences are defined as short-form by Array:
	 *   [frameIndexes, next || null, speed || defaultSpeed || sprite || 0]
	 * or Object:
	 *   {frames: [], next: 'id', speed: seconds, sprite: 0}
	 * @param {String} id       Sequence name (walk, jump, etc)
	 * @param {Array|Object} sequence Array or object
	 */
	addSequence(id, sequence) {
		if (Array.isArray(sequence)) {
			// Convert short form Array to Object
			let frames = [];
			for (let frame = sequence[0], l = sequence[1]; frame <= l; frame++) {
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
		Context.emit('spriteSheetSequence', this);
		if (!this.defaultSequence) {
			this.defaultSequence = id;
		}
	}

	prepare() {
		let sprites = this.sprites;
		let i = 0;
		let l = 0;
		for (i = 0, l = sprites.length; i < l; i++) {
			if (!sprites[i].ready) {
				return false;
			}
		}
		if (!this.frames.length) {
			let defaults = this.defaults;
			let size = defaults.size;
			let anchor = defaults.anchor || Vec2.center;
			for (i = 0, l = sprites.length; i < l; i++) {
				let sprite = sprites[i];
				let cols = sprite.size[0] / size[0] | 0;
				let rows = sprite.size[1] / size[1] | 0;
				// debugger;
				for (let y = 0; y < rows; y++) {
					for (let x = 0; x < cols; x++) {
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
		Context.emit('spriteSheetReady', this);
		return true;
	}

	draw(ctx, idx) {
		if (!this.ready && !this.prepare()) {
			return;
		}
		let frame = this.frames[idx || 0];
		frame.sprite.draw(ctx, null, frame.anchor, frame.size, frame.position);
	}
};

/**
 * Sprite SpriteTween lets components draw animation sequences from SpriteSheets.
 * @class
 * @extends Component
 */
export class SpriteTween extends Component {
	constructor() {
		Component.call(this);
		this.asset = null;
		this.sequence = null;
		this.speed = 0.0;
		this.offset = 0.0;
		this.isSpriteSheet = false;
		this.paused = false;
		this.dtime = 0.0;
		this.frame = 0;
	}

	get attributes() {
		return {
			asset: null,
			speed: 0,
			sequence: null,
			offset: 0,
			frame: 0
		}
	}

	create() {
		// this.asset = attributes.asset;
		// this.sequence = attributes.sequence;
		// this.speed = attributes.speed;
		this.isSpriteSheet = this.asset instanceof SpriteSheet;
		if (this.isSpriteSheet) {
			if (!this.speed) {
				this.speed = this.asset.defaults.speed;
			}
			this.dtime = this.offset;
			if (!this.sequence) {
				this.sequence = this.asset.defaultSequence;
			}
		}
		this.paused = !this.speed;
	}

	preRender(dt) {
		if (!this.isSpriteSheet || this.paused) {
			return;
		}
		let frames = null;
		let speed = 0.0;
		let frameCount = 0;
		let dtime = (this.dtime += dt);
		let nextFrame = this.frame;
		if (this.sequence) {
			let sequence = this.asset.sequences[this.sequence];
			speed = sequence.speed;
			frames = sequence.frames;
			frameCount = frames.length;
			if (dtime >= frameCount * speed) {
				this.emit('sequenceEnd', sequence);
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
			nextFrame = frames[dtime / speed | 0];
		} else {
			frames = this.asset.frames;
			frameCount = frames.length;
			speed = this.speed;
			dtime = dtime % (frameCount * speed);
			let frame = dtime / speed | 0;
			if (frame < this.frame) {
				this.emit('sequenceEnd');
			}
			nextFrame = dtime / speed | 0;
		}
		if (nextFrame != this.frame) {
			this.frame = nextFrame;
			this.emit('frameNext', nextFrame);
		}
	}

	pause() {
		this.paused = true;
		return this;
	}

	play() {
		this.paused = false;
		return this;
	}

	goto(id) {
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
			if (this.frame != id) {
				this.emit('frameNext', id);
				this.frame = id;
			}
		}
		return this;
	}
};

Component.create(SpriteTween, 'spriteTween');

/**
 * @class
 * @extends Component
 */

let compositeLevels = {};
compositeLevels[0] = 'source-over';
let alphaLevels = {};
alphaLevels[0] = 1.0;

export class SpriteCanvasRenderer extends Component {
	render(ctx) {
		let scene = this.entity.scene;
		let child = scene.firstChild;
		if (child == null) {
			return;
		}
		let composite = 'source-over';
		let alpha = 1.0;
		let level = 0;
		ctx.save();
		while (child) {
			let tween = child.components.spriteTween;
			if (tween != null && tween.enabled) {
				let transform = child.components.transform;
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
