'use strict';

var Component = require('./component');
var Vec2 = require('./math').Vec2;
var Mat2 = require('../math/mat2');

/**
 * Transform
 *
 * Transform keeps track of position, rotation and scale.
 *
 * It will eventually also keep track of composite and opacity.
 *
 * @extends Component
 */

function Transform() {
	this.position = Vec2();
	this.scale = Vec2();
	this._matrix = Mat2();
	this._matrixWorld = Mat2();
}

Transform.prototype = {

	attributes: {
		position: Vec2(),
		rotation: 0,
		scale: Vec2(1, 1),
		alpha: 1
	},

	create: function(attributes) {
		Vec2.copy(this.position, attributes.position);
		this.rotation = attributes.rotation;
		Vec2.copy(this.scale, attributes.scale);
		this.alpha = attributes.alpha;

		var parent = this.entity.parent;
		this.parentTransform = parent ? parent.transform : null;
		this._dirty = true;
		this.matrixAutoUpdate = true;
		this._dirtyWorld = true;

		Vec2.set(this._matrix);
		Vec2.set(this._matrixWorld);
	},

	get dirty() {
		return this._dirty;
	},

	set dirty(to) {
		this._dirty = to;
	},

	get matrix() {
		var matrix = this._matrix;
		if (this._dirty || this.matrixAutoUpdate) {
			Mat2.translate(Mat2.identity, this.position, matrix);
			Mat2.rotate(matrix, this.rotation);
			Mat2.scale(matrix, this.scale);
			this._dirty = false;
			this._dirtyWorld = true;
		}
		return matrix;
	},

	get matrixWorld() {
		var matrix = this.matrix;
		var parent = this.parentTransform;
		if (!parent) {
			return matrix;
		}
		var matrixWorld = this._matrixWorld;
		if (this._dirtyWorld) {
			Mat2.multiply(parent.matrixWorld, matrix, matrixWorld);
			this._dirtyWorld = false;
		}
		return matrixWorld;
	},

	get positionOnly() {
		var parent = this.parentTransform;
		return (!parent || parent.positionOnly) && this.rotation === 0 &&
			this.scale == 1;
	},

	set positionOnly(to) {
		if (to) {
			this.rotation = 0;
			this.scale = 1;
			this.parentTransform.positionOnly = true;
		}
	},

	compose: function(position, rotation, scale) {
		if (position != null) {
			Vec2.copy(this.position, position);
		}
		if (rotation != null) {
			this.rotation = rotation;
		}
		if (scale != null) {
			Vec2.copy(this.scale, scale);
		}
		this._dirty = true;
	},

	applyMatrix: function(ctx) {
		var mtx = this.matrixWorld;
		ctx.setTransform(
			mtx[0], mtx[1], mtx[2], mtx[3],
			mtx[4] + 0.5 | 0, mtx[5] + 0.5 | 0
		);
	}

};

new Component('transform', Transform);

module.exports = Transform;