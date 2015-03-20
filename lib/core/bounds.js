
import Component from './component'
import Registry from './registry'
import Color from '../math/color'
import {clamp, TAU} from '../math/mathf'
import Vec2 from '../math/vec2'
import {random} from '../math/random'

let _position = Vec2();

/**
 * @class Bounds
 * Tracks shape and dimensions of an entity.
 * TODO: Shapes into poolable objects
 * TODO: https://github.com/photonstorm/phaser/blob/master/Phaser/Collision.ts
 * @extends Component
 * @property {String} shape "circle" or "rect"
 * @property {Number} radius Circle radius
 * @property {Number[]} size Rect size
 */
export default class Bounds extends Component {
	constructor() {
		Component.call(this);
		this.shape = 'rect';
		this.radius = 0.0;
		this._size = Vec2();
		this._anchor = Vec2();
		this._topLeft = Vec2();
		this._bottomRight = Vec2();
		this._position = _position;
	}

	create() {
		this._position = this.components.transform.position;
	}

	get attributes() {
		return {
			shape: 'rect',
			radius: 0.0,
			size: Vec2(),
			anchor: Vec2.center
		};
	}

	intersectLine(a1, a2, result) {
		if (this.shape == 'circle') {
			return intersectLineCircle(a1, a2, this._position, this.radius, result);
		}
		return false;
	}

	contains(point) {
		if (this.shape == 'circle') {
			return circleContains(
				this._position,
				this.radius,
				point
			);
		}
		return rectangleContains(this.topLeft, this._size, point);
	}

	intersectRect(topLeft, size) {
		if (this.shape == 'circle') {
			return intersectCircleRectangle(
				topLeft,
				size,
				this._position,
				this.radius
			);
		}
		return intersectRectangle(this.topLeft, this._size, topLeft, size);
	}

	get top() {
		if (this.shape == 'circle') {
			return this._position[1] - this.radius;
		}
		return this._position[1] - this._size[1] * this._anchor[1];
	}

	get bottom() {
		if (this.shape == 'circle') {
			return this._position[1] + this.radius;
		}
		return this._position[1] + this._size[1] * this._anchor[1];
	}

	get left() {
		if (this.shape == 'circle') {
			return this._position[0] - this.radius;
		}
		return this._position[0] - this._size[0] * this._anchor[0];
	}

	get right() {
		if (this.shape == 'circle') {
			return this._position[0] + this.radius;
		}
		return this._position[0] + this._size[0] * this._anchor[0];
	}

	get width() {
		if (this.shape == 'circle') {
			return this.radius * 2;
		}
		return this._size[0];
	}

	get height() {
		if (this.shape == 'circle') {
			return this.radius * 2;
		}
		return this._size[1];
	}

	get topLeft() {
		return Vec2.sub(
			this._position,
			Vec2.mul(this._size, this._anchor, this._topLeft),
			this._topLeft
		);
	}

	get bottomRight() {
		return Vec2.add(
			this._position,
			Vec2.mul(this._size, this._anchor, this._bottomRight),
			this._topLeft
		);
	}
};

Vec2.defineProperty(Bounds, 'size');
Vec2.defineProperty(Bounds, 'anchor');

Component.create(Bounds, 'bounds');

let v = Vec2();
let w = Vec2();
let lineCircTest = Vec2();

/**
 * Intersection circle/point
 * http://www.openprocessing.org/user/54
 * @param {Number[]} center
 * @param {Number} radius
 * @param {Number[]} point
 * @return {Boolean}
 */
export function circleContains(center, radius, point) {
	return Vec2.distSq(point, center) <= radius * radius;
}

/**
 * Intersection rectangle/point
 * @param {Number[]} topLeft
 * @param {Number[]} size
 * @param {Number[]} point
 * @return {Boolean}
 */
export function rectangleContains(topLeft, size, point) {
	return topLeft[0] - size[0] < point[0] &&
		topLeft[1] < point[1] &&
		topLeft[0] + size[0] > point[0] &&
		topLeft[1] + size[1] > point[1];
}

/**
 * Closes point to a line
 * http://blog.generalrelativity.org/actionscript-30/collision-detection-circleline-segment-circlecapsule/
 * @param {Number[]} a Line P1
 * @param {Number[]} b Line P2
 * @param {Number[]} point Point
 * @param {Number[]} result Result
 * @return {Number[]} Result
 */
export function closestLinePoint(a, b, point, result) {
	Vec2.sub(b, a, v);
	Vec2.sub(point, a, w);
	let t = Mathf.clamp(Vec2.dot(w, v) / Vec2.dot(v, v), 0, 1);
	return Vec2.add(a, Vec2.scale(v, t, result));
}

/**
 * Intersection line/circle
 *
 * @static
 * @param {Number[]} a Line P1
 * @param {Number[]} b Line P2
 * @param {Number[]} center Circle center
 * @param {Number} radius Circe radius
 * @param {Number[]} result Result vector
 * @return {Number[]|Boolean}
 */
export function intersectLineCircle(a, b, center, radius, result) {
	closestLinePoint(a, b, center, lineCircTest);
	Vec2.sub(lineCircTest, center);
	if (Vec2.dot(lineCircTest, lineCircTest) > radius * radius) {
		return false;
	}
	if (!result) {
		return true;
	}
	return Vec2.copy(result, lineCircTest);
}

/**
 * Intersection rectangle/circle
 *
 * http://stackoverflow.com/questions/401847/circle-rectangle-collision-detection-intersection/402010#402010
 *
 * @param {Number[]} topLeft Rectangle top-left point
 * @param {Number[]} size Rectangle size
 * @param {Number[]} center Circle center
 * @param {Number} radius Circle radius
 * @return {Boolean}
 */
export function intersectCircleRectangle(topLeft, size, center, radius) {
	let circleDistanceX = Math.abs(center[0] - topLeft[0] - size[0] / 2);
	let circleDistanceY = Math.abs(center[1] - topLeft[1] - size[1] / 2);
	if (circleDistanceX > (size[0] / 2 + radius) || circleDistanceY > (size[1] / 2 + radius)) {
		return false;
	}
	if (circleDistanceX <= size[0] / 2 || circleDistanceY <= size[1] / 2) {
		return true;
	}
	let cornerDistance = Math.pow(circleDistanceX - size[0] / 2, 2) + Math.pow(circleDistanceY - size[1] / 2, 2);
	return cornerDistance <= Math.pow(radius, 2);
}

/**
 * Intersection rectangle/rectangle
 *
 * @param {Number[]} pos
 * @param {Number[]} size
 * @param {Number[]} topLeft2
 * @param {Number[]} size2
 * @return {Boolean}
 */
export function intersectRectangle(topLeft, size, topLeft2, size2) {
	return !(
		topLeft[0] > topLeft2[0] + size2[0] ||
		topLeft[0] + size[0] < topLeft2[0] ||
		topLeft[1] > topLeft2[1] + size2[1] ||
		topLeft[1] + size[1] < topLeft2[1]
	);
}

/**
 * Random point in rectangle
 */
export function randomPointInRectangle(point, pos, size) {
	Vec2.set(point, random(0, size[0]), random(0, size[1]));
	return Vec2.add(point, pos);
}

/*
getAabb() {
	if (!this.topLeft) {
		this.topLeft = Vec2();
		this.bottomRight = Vec2();
	}
	Vec2.set(
		this.topLeft,
		this.position[0] + this._size[0] * 0.5 * (this.align[0] + 1),
		this.position[1] + this._size[1] * 0.5 * (this.align[1] + 1)
	);
	Vec2.set(
		this.bottomRight,
		this.position[0] + this._size[0] * 0.5 * (this.align[0] + 5),
		this.position[1] + this._size[1] * 0.5 * (this.align[1] + 5)
	);
	return this.topLeft;
},
*/


/***
 * Intersection line/rectangle
 *
export function lineRect(point1, point2, topLeft, size) {
	// Calculate m and c for the equation for the line (y = mx+c)
	m = (a1[1] - y0) / (a1[0] - x0);
	c = y0 - (m * x0);

	// if the line is going up from right to left then the top intersect point is on the left
	if (m > 0) {
		top_intersection = (m * l + c);
		bottom_intersection = (m * r + c);
	}
	// otherwise it's on the right
	else {
		top_intersection = (m * r + c);
		bottom_intersection = (m * l + c);
	}

	// work out the top and bottom extents for the triangle
	if (y0 < a1[1]) {
		toptrianglepoint = y0;
		bottomtrianglepoint = a1[1];
	} else {
		toptrianglepoint = a1[1];
		bottomtrianglepoint = y0;
	}

	let topoverlap: Number;
	let botoverlap: Number;

	// and calculate the overlap between those two bounds
	topoverlap = top_intersection > toptrianglepoint ? top_intersection : toptrianglepoint;
	botoverlap = bottom_intersection < bottomtrianglepoint ? bottom_intersection : bottomtrianglepoint;

	// (topoverlap<botoverlap) :
	// if the intersection isn't the right way up then we have no overlap

	// (!((botoverlap<t) || (topoverlap>b)) :
	// If the bottom overlap is higher than the top of the rectangle or the top overlap is
	// lower than the bottom of the rectangle we don't have intersection. So return the negative
	// of that. Much faster than checking each of the points is within the bounds of the rectangle.
	return (topoverlap < botoverlap) && (!((botoverlap < t) || (topoverlap > b)));
};
*/

/*
export function lineCirc(point1, point2, center, radius) {
	let a, b, bb4ac, c, dx, dy, ia1[0], ia2[0], ia1[1], ia2[1], mu, testX, testY;
	dx = a2[0] - a1[0];
	dy = a2[1] - a1[1];
	a = dx * dx + dy * dy;
	b = 2 * (dx * (a1[0] - cx) + dy * (a1[1] - cy));
	c = cx * cx + cy * cy;
	c += a1[0] * a1[0] + a1[1] * a1[1];
	c -= 2 * (cx * a1[0] + cy * a1[1]);
	c -= cr * cr;
	bb4ac = b * b - 4 * a * c;
	if (bb4ac < 0) {
		return false;
	}
	mu = (-b + sqrt(b * b - 4 * a * c)) / (2 * a);
	ia1[0] = a1[0] + mu * dx;
	ia1[1] = a1[1] + mu * dy;
	mu = (-b - sqrt(b * b - 4 * a * c)) / (2 * a);
	ia2[0] = a1[0] + mu * dx;
	ia2[1] = a1[1] + mu * dy;
	if (dist(a1[0], a1[1], cx, cy) < dist(a2[0], a2[1], cx, cy)) {
		testX = a2[0];
		testY = a2[1];
	} else {
		testX = a1[0];
		testY = a1[1];
	}
	if (dist(testX, testY, ia1[0], ia1[1]) < dist(a1[0], a1[1], a2[0], a2[1]) || dist(testX, testY, ia2[0], ia2[1]) < dist(a1[0], a1[1], a2[0], a2[1])) {
		return true;
	}
	return false;
};
*/

/**
 * Intersection line/line
 *
 * http://stackoverflow.com/questions/3746274/line-intersection-with-aabb-rectangle
 * http://jsperf.com/line-intersection2/2
 *
 * @param {Number[]} a1 Line 1 P1
 * @param {Number[]} a2 Line 1 P2
 * @param {Number[]} b1 Line 2 P1
 * @param {Number[]} b2 Line 2 P2
 * @param {Number[]} result
 * @return {Number[]}
 *
export function intersectLine(a1, a2, b1, b2, result) {
	if (!result) {
		// http://www.bryceboe.com/2006/10/23/line-segment-intersection-algorithm/comment-page-1/
		return ccw(a1, b1, b2) != ccw(a2, b1, b2) &&
			ccw(a1, a2, b1) != ccw(a1, a2, b2);
	}

	// http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect/1968345#1968345
	let s1_x = a2[0] - a1[0];
	let s1_y = a2[1] - a1[1];
	let s2_x = b2[0] - b1[0];
	let s2_y = b2[1] - b1[1];

	let s = (-s1_y * (a1[0] - b1[0]) + s1_x * (a1[1] - b1[1])) / (-s2_x * s1_y + s1_x * s2_y);
	let t = (s2_x * (a1[1] - b1[1]) - s2_y * (a1[0] - b1[0])) / (-s2_x * s1_y + s1_x * s2_y);

	// Collision detected
	if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
		return Vec2.set(result, a1[0] + (t * s1_x), a1[1] + (t * s1_y));
	}
	return null;
};

function ccw(a, b, c) {
	let cw = ((c[1] - a[1]) * (b[0] - a[0])) - ((b[1] - a[1]) * (c[0] - a[0]));
	return (cw > 0) ? true : cw < 0 ? false : true; // colinear
}
*/

/**
 * @class  Debug
 * Outlines the boundaries and angle of an entity.
 * @extends Component
 */
class BoundsDebug extends Component {
	constructor() {
		Component.call(this);
		this._color = Color();
	}

	get attributes() {
		return {
			color: Color.gray,
			opacity: 0.5,
			fill: false
		};
	}
}

Color.defineProperty(BoundsDebug, 'color');

/*
FIXME: Convert to sprite
export function ctx) {
	let bounds = this.components.bounds;
	ctx.save();
	if (this.fill) {
		ctx.fillStyle = Color.rgba(this.color, this.opacity * 0.5);
	}
	ctx.strokeStyle = Color.rgba(this.color, this.opacity);
	ctx.lineWidth = 1;
	this._position(ctx);
	if (bounds.shape == 'circle') {
		ctx.beginPath();
		ctx.lineTo(0, bounds.radius);
		ctx.moveTo(0, 0);
		ctx.arc(0, 0, bounds.radius | 0, 0, Mathf.TAU);
		if (this.fill) {
			ctx.fill();
		}
		ctx.stroke();
	} else {
		let size = bounds._size;
		ctx.strokeRect(-size[0] / 2 | 0, -size[1] / 2 | 0, size[0] | 0, size[1] | 0);
		if (this.fill) {
			ctx.fillRect(-size[0] / 2 | 0, -size[1] / 2 | 0, size[0] | 0, size[1] | 0);
		}
	}
	ctx.restore();
};
*/

Component.create(BoundsDebug, 'boundsDebug');
