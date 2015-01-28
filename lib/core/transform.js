'use strict';

var Component = require('./component');
var Pool = require('./pool');
var Vec2 = require('../math/vec2');
var Mat2 = require('../math/mat2');

/**
 * Transform keeps track of transformation (position, rotation and scale) and
 * composite, alpha.
 * @extends Component
 * @class
 */
function Transform() {
	Component.call(this);
	this.rotation = 0.0;
	this.alpha = 1.0;
	this.composite = '';
	this._position = Vec2();
	this._scale = Vec2();
	this._matrix = Mat2();
	this._matrixWorld = Mat2();
	this.dirty = false;
	this.dirtyWorld = false;
	this.matrixAutoUpdate = false;
	this.parentTransform = null;
}

Transform.prototype = {
	attributes: {
		position: Vec2(),
		scale: Vec2(1, 1),
		rotation: 0.0,
		alpha: 1.0,
		composite: 'source-over'
	},

	create: function() {
		this.dirty = true;
		this.dirtyWorld = true;
		this.matrixAutoUpdate = true;
		var parent = this.entity.parent;
		this.parentTransform = parent ? parent.components.transform : null;
	},

	get matrix() {
		var matrix = this._matrix;
		if (this.dirty || this.matrixAutoUpdate) {
			Mat2.translate(Mat2.identity, this._position, matrix);
			Mat2.rotate(matrix, this.rotation);
			Mat2.scale(matrix, this._scale);
			this.markDirty();
			this.dirty = false;
		}
		return matrix;
	},

	get matrixWorld() {
		var matrix = this.matrix;
		var parent = this.parentTransform;
		if (parent == null) {
			return matrix;
		}
		var matrixWorld = this._matrixWorld;
		if (this.dirtyWorld) {
			Mat2.multiply(parent.matrixWorld, matrix, matrixWorld);
			this.dirtyWorld = false;
		}
		return matrixWorld;
	},

	get alphaWorld() {
		var alpha = this.alpha;
		var parent = this.parentTransform;
		if (parent == null) {
			return alpha;
		}
		return parent.alphaWorld * alpha;
	},

	get positionOnly() {
		var parent = this.parentTransform;
		return (parent == null || parent.positionOnly) && this.rotation === 0 &&
			this._scale[0] == 1 && this._scale[1] == 1;
	},

	set positionOnly(to) {
		if (to) {
			this.rotation = 0;
			this.scale = Vec2.one;
			this.parentTransform.positionOnly = true;
		}
	},

	dealloc: function() {
		this.parentTransform = null;
	},

	markDirty: function(force) {
		if (this.dirty && !force) {
			return;
		}
		this.dirty = true;
		this.dirtyWorld = true;
		var start = this.entity;
		var child = start.firstChild;
		while (child != null) {
			child.components.transform.dirtyWorld = true;
			if (child.firstChild != null) {
				child = child.firstChild;
			} else if (child.next == null) {
				do {
					child = child.parent;
					if (child == start) {
						return;
					}
				} while (child.next == null);
			}
			child = child.next;
		}
	},

	compose: function(position, rotation, scale) {
		if (position != null) {
			this.position = position;
		}
		if (rotation != null) {
			this.rotation = rotation;
		}
		if (scale != null) {
			this.scale = scale;
		}
		this.markDirty();
	},

	translateBy: function(by) {
		Vec2.add(this._position, by);
		this.markDirty();
	},

	translateTo: function(to) {
		this.position = to;
		this.markDirty();
	},

	translateXBy: function(by) {
		this._position[0] += by;
		this.markDirty();
	},

	translateXTo: function(to) {
		this._position[0] = to;
		this.markDirty();
	},

	translateYBy: function(by) {
		this._position[1] += by;
		this.markDirty();
	},

	translateYTo: function(to) {
		this._position[1] = to;
		this.markDirty();
	},

	scaleBy: function(by) {
		Vec2.add(this._scale, by);
		this.markDirty();
	},

	scaleTo: function(to) {
		this.scale = to;
		this.markDirty();
	},

	scaleXBy: function(by) {
		this._scale[0] += by;
		this.markDirty();
	},

	scaleXTo: function(to) {
		this._scale[0] = to;
		this.markDirty();
	},

	scaleYBy: function(by) {
		this._scale[1] += by;
		this.markDirty();
	},

	scaleYTo: function(to) {
		this._scale[1] = to;
		this.markDirty();
	},

	rotateBy: function(by) {
		this.rotation += by;
		this.markDirty();
	},

	rotateTo: function(to) {
		this.rotation = to;
		this.markDirty();
	},

	applyMatrixWorld: function(ctx) {
		var mtx = this.matrixWorld;
		ctx.setTransform(
			mtx[0], mtx[1], mtx[2], mtx[3],
			mtx[4] + 0.5 | 0, mtx[5] + 0.5 | 0
		);
	},

	applyMatrix: function(ctx) {
		if (this.positionOnly) {
			ctx.translate(this.position[0], this.position[1]);
		} else {
			var mtx = this.matrix;
			ctx.transform(
				mtx[0], mtx[1], mtx[2], mtx[3],
				mtx[4] + 0.5 | 0, mtx[5] + 0.5 | 0
			);
		}
	}
};

Vec2.defineProperty(Transform, 'position');
Vec2.defineProperty(Transform, 'scale');

Component.create(Transform, 'transform');

module.exports = Transform;
