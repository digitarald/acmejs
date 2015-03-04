
import Entity from './entity';
import Bounds from './bounds';
import Vec2 from '../math/vec2';
import Color from '../math/color';

export default class Renderer {
	constructor(element, size) {
		this.element = element || document.body;
		this.size = Vec2(size);
		this.color = Color.white;
		this.content = Vec2(size);
		this.browser = Vec2();
		this.margin = Vec2();
		this.projection = Vec2.scale(this.content, 0.5, Vec2());
		this.scale = 0;
		this.noContext = false;
		this.orientation = 'landscape';

		this.canvas = document.createElement('canvas');
		// if (this.color != null) {
		// 	this.canvas.mozOpaque = true;
		// }
		this.ctx = null;

		// var deviceRatio = window.devicePixelRatio || 1;
		// var backingStoreRatio = this.ctx.backingStorePixelRatio ||
		// 	this.ctx.webkitBackingStorePixelRatio ||
		// 	this.ctx.mozBackingStorePixelRatio || 1;
		// this.ratio = deviceRatio / backingStoreRatio;
		this.ratio = window.devicePixelRatio || 1;

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

	handleEvent(evt) {
		this.reflow();
	}

	reflow() {
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
	}

	save() {
		if (this.noContext) {
			return null;
		}
		if (this.ctx == null) {
			this.ctx = this.canvas.getContext('2d');
		}
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
	}

	restore() {
		if (this.noContext) {
			return null;
		}
		this.ctx.restore();
	}

	requestFullscreen() {
		var target = this.element.parentNode;
		if (target.requestFullScreen != null) {
			target.requestFullScreen();
		} else if (target.webkitRequestFullScreen != null) {
			target.webkitRequestFullScreen();
		} else if (target.mozRequestFullScreen != null) {
			target.mozRequestFullScreen();
		}
	}

	get topLeft() {
		return Vec2.sub(
			Vec2.scale(this.content, 0.5, topLeft),
			this.projection
		);
	}

	get bottomRight() {
		return Vec2.add(
			Vec2.scale(this.content, 0.5, bottomRight),
			this.projection
		);
	}
};

let topLeft = Vec2();
let bottomRight = Vec2();
