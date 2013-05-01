'use strict';

var Component = require('./component');
var Pool = require('./pool');
var Color = require('./color');
var Vec2 = require('./math').Vec2;

function Bounds() {
	this.size = Vec2();
}

Bounds.prototype = {

	attributes: {
		shape: 'rect',
		radius: 0,
		size: Vec2()
	},

	create: function(attributes) {
		Vec2.copy(this.size, attributes.size);
		this.shape = attributes.shape;
		this.radius = attributes.radius;
	},

	getTop: function() {
		if (this.shape === 'circle') {
			return this.transform.pos[1] - this.radius;
		}
		return this.transform.pos[1];
	},

	getBottom: function() {
		if (this.shape === 'circle') {
			return this.transform.pos[1] + this.radius;
		}
		return this.transform.pos[1] + this.size[1];
	},

	/*
	getAabb: function() {
		if (!this.topLeft) {
			this.topLeft = Vec2();
			this.bottomRight = Vec2();
		}
		Vec2.set(
			this.topLeft,
			this.pos[0] + this.size[0] * 0.5 * (this.align[0] + 1),
			this.pos[1] + this.size[1] * 0.5 * (this.align[1] + 1)
		);
		Vec2.set(
			this.bottomRight,
			this.pos[0] + this.size[0] * 0.5 * (this.align[0] + 5),
			this.pos[1] + this.size[1] * 0.5 * (this.align[1] + 5)
		);
		return this.topLeft;
	},
	*/

	intersectLine: function(a1, a2, result) {
		var pos = this.transform.pos;
		switch (this.shape) {
			case 'circle':
				return Bounds.intersectLineCirc(a1, a2, pos, this.radius, result);
			case 'rect':
				return false;
		}
		return false;
	},

	intersect: function(bound) {
		return null;
	},

	contains: function(point) {
		var pos = this.transform.pos;
		switch (this.shape) {
			case 'circle':
				return Bounds.circPoint(pos, this.radius, point);
			case 'rect':
				return Bounds.rectPoint(pos, this.size, point);
		}
		return false;
	},

	withinRect: function(pos, size) {
		var mypos = this.transform.pos;
		switch (this.shape) {
			case 'circle':
				return Bounds.rectCirc(pos, size, mypos, this.radius);
			case 'rect':
				return Bounds.rectRect(pos, size, mypos, this.size);
		}
		return false;
	}

};

// http://www.openprocessing.org/user/54

Bounds.circPoint = function(center, radius, point) {
	return Vec2.distSq(point, center) <= radius * radius;
};

Bounds.rectPoint = function(pos, size, point) {
	return pos[0] - size[0] < point[0] && pos[1] < point[1] && pos[0] + size[0] > point[0] && pos[1] + size[1] > point[1];
};

var v = Vec2();
var w = Vec2();

/**
 * closestLinePoint
 *
 * http://blog.generalrelativity.org/actionscript-30/collision-detection-circleline-segment-circlecapsule/
 *
 * @param  {Vec2} a     [description]
 * @param  {Vec2} b     [description]
 * @param  {Vec2} point [description]
 * @param  {Vec2} result [description]
 * @return {Vec2}       result
 */
Bounds.closestLinePoint = function(a, b, point, result) {
	Vec2.sub(b, a, v);
	Vec2.sub(point, a, w);
	var t = Math.clamp(Vec2.dot(w, v) / Vec2.dot(v, v), 0, 1);
	return Vec2.add(a, Vec2.scal(v, t, result));
};

var lineCircTest = Vec2();

/**
 * intersectLineCirc
 *
 * @param  {Vec2} a      [description]
 * @param  {Vec2} b      [description]
 * @param  {Vec2} center [description]
 * @param  {number} radius [description]
 * @param  {Vec2} result [description]
 * @return {Vec2|bool}        [description]
 */
Bounds.intersectLineCirc = function(a, b, center, radius, result) {
	Bounds.closestLinePoint(a, b, center, lineCircTest);
	Vec2.sub(lineCircTest, center);
	if (Vec2.dot(lineCircTest, lineCircTest) > radius * radius) {
		return false;
	}
	if (!result) {
		return true;
	}
	return Vec2.copy(result, lineCircTest);
};

Bounds.rectCirc = function(topLeft, size, center, radius) {
	var circleDistanceX, circleDistanceY, cornerDistance;
	circleDistanceX = Math.abs(center[0] - topLeft[0] - size[0] / 2);
	circleDistanceY = Math.abs(center[1] - topLeft[1] - size[1] / 2);
	if (circleDistanceX > (size[0] / 2 + radius) || circleDistanceY > (size[1] / 2 + radius)) {
		return false;
	}
	if (circleDistanceX <= size[0] / 2 || circleDistanceY <= size[1] / 2) {
		return true;
	}
	cornerDistance = Math.pow(circleDistanceX - size[0] / 2, 2) + Math.pow(circleDistanceY - size[1] / 2, 2);
	return cornerDistance <= Math.pow(radius, 2);
};

Bounds.rectRect = function(pos, size, pos2, size2) {
	return !(pos[0] > pos2[0] + size2[0] || pos[0] + size[0] < pos2[0] || pos[1] > pos2[1] + size2[1] || pos[1] + size[1] < pos2[1]);
};

new Component('bounds', Bounds);

/**
 * Bounds.lineRect
 *
 * http://www.openprocessing.org/sketch/8010
 *
 * @param  {[type]} point1  [description]
 * @param  {[type]} point2  [description]
 * @param  {[type]} topLeft [description]
 * @param  {[type]} size    [description]
 * @return {bool}           They intersect
 *
Bounds.lineRect = function(point1, point2, topLeft, size) {
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

	var topoverlap: Number;
	var botoverlap: Number;

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
Bounds.lineCirc = function(point1, point2, center, radius) {
	var a, b, bb4ac, c, dx, dy, ia1[0], ia2[0], ia1[1], ia2[1], mu, testX, testY;
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
 * Line Line intersection
 *
 * http://stackoverflow.com/questions/3746274/line-intersection-with-aabb-rectangle
 * http://jsperf.com/line-intersection2/2
 *
 * @return {bool} Intersects
 */
Bounds.intersectLine = function(a1, a2, b1, b2, result) {
	if (!result) {
		// http://www.bryceboe.com/2006/10/23/line-segment-intersection-algorithm/comment-page-1/
		return ccw(a1, b1, b2) != ccw(a2, b1, b2) &&
			ccw(a1, a2, b1) != ccw(a1, a2, b2);
	}

	// http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect/1968345#1968345
	var s1_x = a2[0] - a1[0];
	var s1_y = a2[1] - a1[1];
	var s2_x = b2[0] - b1[0];
	var s2_y = b2[1] - b1[1];

	var s = (-s1_y * (a1[0] - b1[0]) + s1_x * (a1[1] - b1[1])) / (-s2_x * s1_y + s1_x * s2_y);
	var t = (s2_x * (a1[1] - b1[1]) - s2_y * (a1[0] - b1[0])) / (-s2_x * s1_y + s1_x * s2_y);

	// Collision detected
	if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
		return Vec2.set(result, a1[0] + (t * s1_x), a1[1] + (t * s1_y));
	}
	return null;
}

function ccw(a, b, c) {
	var cw = ((c[1] - a[1]) * (b[0] - a[0])) - ((b[1] - a[1]) * (c[0] - a[0]));
	return (cw > 0) ? true : cw < 0 ? false : true /* colinear */
	;
};

/**
 * Component: Bounds.Debug
 *
 * Outlines the boundaries and angle of an entity.
 */
function BoundsDebug() {
	this.color = Color();
}

BoundsDebug.prototype = {

	attributes: {
		color: Color.gray,
		opacity: 0.5,
		fill: false
	},

	create: function(attributes) {
		this.opacity = attributes.opacity;
		this.fill = attributes.fill;
		Color.copy(this.color, attributes.color);
	},

	render: function(ctx) {
		var bounds = this.bounds;
		ctx.save();
		if (this.fill) {
			ctx.fillStyle = Color.rgba(this.color, this.opacity * 0.5);
		}
		ctx.strokeStyle = Color.rgba(this.color, this.opacity);
		ctx.lineWidth = 1;
		this.transform.applyMatrix(ctx);
		if (bounds.shape === 'circle') {
			ctx.beginPath();
			ctx.lineTo(0, bounds.radius);
			ctx.moveTo(0, 0);
			ctx.arc(0, 0, bounds.radius | 0, 0, Math.TAU);
			if (this.fill) {
				ctx.fill();
			}
			ctx.stroke();
		} else {
			var size = bounds.size;
			ctx.strokeRect(-size[0] / 2 | 0, -size[1] / 2 | 0, size[0] | 0, size[1] | 0);
			if (this.fill) {
				ctx.fillRect(-size[0] / 2 | 0, -size[1] / 2 | 0, size[0] | 0, size[1] | 0);
			}
		}
		ctx.restore();
	}

};

new Component('boundsDebug', BoundsDebug);

Bounds.Debug = BoundsDebug;

module.exports = Bounds;
