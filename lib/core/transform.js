'use strict';

import Component from './component';
import Registry from './registry';
import Vec2 from '../math/vec2';
import Mat2 from '../math/mat2';

/**
 * Transform keeps track of transformation (position, rotation and scale) and
 * composite, alpha.
 * @extends Component
 * @class
 */
class Transform extends Component {
	constructor() {
		Component.call(this);
		this.rotation = 0.0;
		this.alpha = 1.0;
		this.composite = '';
		this._position = Vec2();
		this._scale = Vec2();
		this._matrix = Mat2();
		this._matrixWorld = Mat2();
		this._dirty = false;
		this._dirtyParent = false;
		this._globalPosition = Vec2();
		this.matrixAutoUpdate = false;
		this.parentTransform = null;
	}

	get attributes() {
		return {
			position: Vec2(),
			scale: Vec2(1, 1),
			rotation: 0.0,
			alpha: 1.0,
			composite: 'source-over'
		};
	}

	create() {
		this._dirty = true;
		this._dirtyParent = true;
		this.matrixAutoUpdate = true;
		let parent = this.entity.parent;
		this.parentTransform = parent ? parent.components.transform : null;
	}

	get matrix() {
		let matrix = this._matrix;
		if (this.dirty || this.matrixAutoUpdate) {
			Mat2.translate(Mat2.identity, this._position, matrix);
			Mat2.rotate(matrix, this.rotation);
			Mat2.scale(matrix, this._scale);
			this._dirty = false;
			this.dirtyParent = true;
		}
		return matrix;
	}

	get matrixWorld() {
		let matrix = this.matrix;
		let parent = this.parentTransform;
		if (!Transform.enableTree || parent == null) {
			return matrix;
		}
		let matrixWorld = this._matrixWorld;
		if (this._dirtyParent) {
			Mat2.multiply(parent.matrixWorld, matrix, matrixWorld);
			this._dirtyParent = false;
		}
		return matrixWorld;
	}

	get alphaWorld() {
		let alpha = this.alpha;
		if (!Transform.enableTree) {
			return alpha;
		}
		let parent = this.parentTransform;
		if (parent == null) {
			return alpha;
		}
		return parent.alphaWorld * alpha;
	}

	get globalPosition() {
		let parent = this.parentTransform;
		let position = this.position;
		if (parent == null) {
			return position;
		}
		return Vec2.add(
			position,
			parent.globalPosition,
			this._globalPosition
		);
	}

	get positionOnly() {
		let parent = this.parentTransform;
		return (parent == null || parent.positionOnly) && this.rotation === 0 &&
			this._scale[0] == 1 && this._scale[1] == 1;
	}

	set positionOnly(to) {
		if (to) {
			this.rotation = 0;
			this.scale = Vec2.one;
			this.parentTransform.positionOnly = true;
		}
	}

	dealloc() {
		this.parentTransform = null;
	}

	set dirty(to) {
		if (this._dirty == to) {
			return;
		}
		this._dirty = to;
		if (to && Transform.enableTree) {
			this.dirtyParent = true;
		}
	}

	set dirtyParent(to) {
		if (this._dirtyParent == to) {
			return;
		}
		this._dirtyParent = true;
		let start = this.entity;
		let child = start.firstChild;
		while (child != null) {
			child.components.transform._dirtyParent = true;
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
	}

	compose(position, rotation, scale) {
		if (position != null) {
			this.position = position;
		}
		if (rotation != null) {
			this.rotation = rotation;
		}
		if (scale != null) {
			this.scale = scale;
		}
		this.dirty = true;
	}

	translateBy(by) {
		this._position[0] += by[0];
		this._position[1] += by[1];
		this.dirty = true;
	}

	translateTo(to) {
		this._position[0] = to[0];
		this._position[1] = to[1];
		this.dirty = true;
	}

	translateXBy(by) {
		this._position[0] += by;
		this.dirty = true;
	}

	translateXTo(to) {
		this._position[0] = to;
		this.dirty = true;
	}

	translateYBy(by) {
		this._position[1] += by;
		this.dirty = true;
	}

	translateYTo(to) {
		this._position[1] = to;
		this.dirty = true;
	}

	scaleBy(by) {
		this._scale[0] += by[0];
		this._scale[1] += by[1];
		this.dirty = true;
	}

	scaleTo(to) {
		this._scale[0] = to[0];
		this._scale[1] = to[1];
		this.dirty = true;
	}

	scaleXBy(by) {
		this._scale[0] += by;
		this.dirty = true;
	}

	scaleXTo(to) {
		this._scale[0] = to;
		this.dirty = true;
	}

	scaleYBy(by) {
		this._scale[1] += by;
		this.dirty = true;
	}

	scaleYTo(to) {
		this._scale[1] = to;
		this.dirty = true;
	}

	rotateBy(by) {
		this.rotation += by;
		this.dirty = true;
	}

	rotateTo(to) {
		this.rotation = to;
		this.dirty = true;
	}

	applyMatrixWorld(ctx) {
		let mtx = this.matrixWorld;
		ctx.setTransform(
			mtx[0], mtx[1], mtx[2], mtx[3],
			mtx[4] + 0.5 | 0, mtx[5] + 0.5 | 0
		);
	}

	applyMatrix(ctx) {
		if (this.positionOnly) {
			ctx.translate(this.position[0], this.position[1]);
		} else {
			let mtx = this.matrix;
			ctx.transform(
				mtx[0], mtx[1], mtx[2], mtx[3],
				mtx[4] + 0.5 | 0, mtx[5] + 0.5 | 0
			);
		}
	}
}

Transform.enableTree = true;

Vec2.defineProperty(Transform, 'position', {dirty: true});
Vec2.defineProperty(Transform, 'scale', {dirty: true});

Component.create(Transform, 'transform');
