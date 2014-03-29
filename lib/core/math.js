'use strict';

var Random = require('./math-random');
var randRange = Random.randRange;

/*
 * http://docs.unity3d.com/Documentation/ScriptReference/Mathf.html
 * https://github.com/secretrobotron/gladius.math/
 * https://github.com/toji/gl-matrix/tree/master/src/gl-matrix
 *
 * TODO: https://github.com/photonstorm/phaser/blob/master/Phaser/GameMath.ts
 */
var EPSILON = Math.EPSILON = 0.001;

var PI = Math.PI;
var TAU = Math.TAU = PI * 2;
var HALF_PI = Math.HALF_PI = PI / 2;
var RAD2DEG = Math.RAD2DEG = 180 / PI;
var DEG2RAD = Math.DEG2RAD = PI / 180;

// Math.PIRAD = 0.0174532925;
Math.UID = 1;

Math.uid = function() {
	return Math.UID++;
};

Math.clamp = function(a, low, high) {
	if (a < low) {
		return low;
	}
	if (a > high) {
		return high;
	} else {
		return a;
	}
};

/**
 * Correct modulo behavior
 * @param {Number} a Dividend
 * @param {Number} b Divisor
 * @return {Number} a % b where the result is between 0 and b (either
 *   0 <= x < b or b < x <= 0, depending on the sign of b).
 */
Math.mod = function(a, b) {
	a %= b;
	return (a * b < 0) ? a + b : a;
};

/**
 * Loops the value t, so that it is never larger than length and never
 * smaller than 0.
 * @param {Number} t
 * @param {Number} length
 * @return {Number}
 */
Math.repeat = function(t, length) {
	return t - Math.floor(t / length) * length;
};

Math.toDeg = function(rad) {
	return rad * RAD2DEG;
};

Math.toRad = function(deg) {
	return deg * DEG2RAD;
};

Math.normDeg = function(deg) {
	deg %= 360;
	return (deg * 360 < 0) ? deg + 360 : deg;
};

Math.normRad = function(rad) {
	rad %= TAU;
	return (rad * TAU < 0) ? rad + TAU : rad;
};

Math.distRad = function(a, b) {
	var d = Math.normRad(b) - Math.normRad(a);
	if (d > PI) {
		return d - TAU;
	}
	if (d <= -PI) {
		return d + TAU;
	}
	return d;
};

Math.distDeg = function(a, b) {
	var d = Math.normDeg(b) - Math.normDeg(a);
	if (d > 180) {
		return d - 360;
	}
	if (d <= -180) {
		return d + 360;
	}
	return d;
};

/**
 * Performs linear interpolation between values a and b.
 * @param {Number} a
 * @param {Number} b
 * @param {Number} scalar The proportion between a and b.
 * @return {Number} The interpolated value between a and b.
 */
Math.lerp = function(a, b, scalar) {
	return a + scalar * (b - a);
};

var dampResult = {
	value: 0,
	velocity: 0
};

/**
 * Gradually changes a value towards a desired goal over time.
 *
 * http://docs.unity3d.com/Documentation/ScriptReference/Mathf.SmoothDamp.html
 * http://answers.unity3d.com/questions/24756/formula-behind-smoothdamp.html
 */
Math.smoothDamp = function(a, b, velocity, time, maxVelocity, delta) {
	time = Math.max(EPSILON, time);
	delta = delta || 0.02;
	var num = 2 / time;
	var num2 = num * delta;
	var num3 = 1 / (1 + num2 + 0.48 * num2 * num2 + 0.235 * num2 * num2 * num2);
	var num4 = a - b;
	var num5 = b;
	var num6 = (maxVelocity || Number.POSITIVE_INFINITY) * time;
	num4 = Math.clamp(num4, -num6, num6);
	b = a - num4;
	var num7 = (velocity + num * num4) * delta;
	velocity = (velocity - num * num7) * num3;
	var value = b + (num4 + num7) * num3;
	if (num5 - a > 0 == value > num5) {
		value = num5;
		velocity = (value - num5) / delta;
	}
	dampResult.value = value;
	dampResult.velocity = velocity;
	return dampResult;
};

/**
 * Easing
 */

var powIn = function(strength) {
	if (strength == null) {
		strength = 2;
	}
	return function(t) {
		return Math.pow(t, strength);
	};
};

var toOut = function(fn) {
	return function(t) {
		return 1 - fn(1 - t);
	};
};

var toInOut = function(fn) {
	return function(t) {
		return (t < 0.5 ? fn(t * 2) : 2 - fn(2 * (1 - t))) / 2;
	};
};

Math.linear = function(t) {
	return t;
};

// http://greweb.me/2012/02/bezier-curve-based-easing-functions-from-concept-to-implementation/
// https://github.com/petehunt/react-touch/blob/gh-pages/src/math/EasingFunctions.js
// https://gist.github.com/gre/1650294

var transitions = ['quad', 'cubic', 'quart', 'quint'];
for (var i = 0, l = transitions.length; i < l; i++) {
	var transition = transitions[i];
	var fn = powIn(i + 2);
	Math[transition + 'In'] = fn;
	Math[transition + 'Out'] = toOut(fn);
	Math[transition + 'InOut'] = toInOut(fn);
}

Math.distAng = function(a, b) {
	if (a == b) {
		return 0;
	}
	var ab = (a < b);
	var l = ab ? (-a - TAU + b) : (b - a);
	var r = ab ? (b - a) : (TAU - a + b);

	return (Math.abs(l) > Math.abs(r)) ? r : l;
};

/**
 * Vec2
 *
 * @constructor
 * Initialize from Vec2 array or x/y values. Returns a new (typed) array.
 *
 * @param {Number[]|Number} fromOrX Typed array to copy from or x
 * @param {Number} y y, when x was provided as first argument
 */
var Vec2 = Math.Vec2 = function(fromOrX, y) {
	if (y != null) {
		return new Float32Array([fromOrX, y]);
	}
	return new Float32Array(fromOrX || Vec2.zero);
};

Vec2.zero = Vec2.center = Vec2(0, 0);
Vec2.topLeft = Vec2(-1, -1);
Vec2.topCenter = Vec2(0, -1);
Vec2.topRight = Vec2(1, -1);
Vec2.centerLeft = Vec2(-1, 0);
Vec2.centerRight = Vec2(1, 0);
Vec2.bottomLeft = Vec2(-1, 1);
Vec2.bottomCenter = Vec2(0, 1);
Vec2.bottomRight = Vec2(1, 1);

Vec2.set = function(result, x, y) {
	result[0] = x || 0;
	result[1] = y || 0;
	return result;
};

Vec2.copy = function(result, b) {
	b = b || Vec2.zero;
	result[0] = b[0];
	result[1] = b[1];
	return result;
};

Vec2.valid = function(a) {
	return !(isNaN(a[0]) || isNaN(a[1]));
};

Vec2.toString = function(a) {
	return '[' + a[0] + ', ' + a[1] + ']';
};

var objVecCache = Vec2();

Vec2.fromObj = function(obj, a) {
	a = a || objVecCache;
	a[0] = obj.x;
	a[1] = obj.y;
	return a;
};

var objCache = {
	x: 0,
	y: 0
};
Vec2.toObj = function(a, obj) {
	obj = obj || objCache;
	obj.x = a[0];
	obj.y = a[1];
	return obj;
};

Vec2.eq = function(a, b) {
	return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON;
};

Vec2.add = function(a, b, result) {
	result = result || a;
	result[0] = a[0] + b[0];
	result[1] = a[1] + b[1];
	return result;
};

Vec2.sub = function(a, b, result) {
	result = result || a;
	result[0] = a[0] - b[0];
	result[1] = a[1] - b[1];
	return result;
};

Vec2.mul = function(a, b, result) {
	result = result || a;
	result[0] = a[0] * b[0];
	result[1] = a[1] * b[1];
	return result;
};

Vec2.scale = function(a, scalar, result) {
	result = result || a;
	result[0] = a[0] * scalar;
	result[1] = a[1] * scalar;
	return result;
};

Vec2.norm = function(a, result, scalar) {
	result = result || a;
	var x = a[0];
	var y = a[1];
	var len = (scalar || 1) / (Math.sqrt(x * x + y * y) || 1);
	result[0] = x * len;
	result[1] = y * len;
	return result;
};

Vec2.lenSq = function(a) {
	return a[0] * a[0] + a[1] * a[1];
};

Vec2.len = function(a) {
	return Math.sqrt(a[0] * a[0] + a[1] * a[1]);
};

Vec2.dot = function(a, b) {
	return a[0] * b[0] + a[1] * b[1];
};

Vec2.cross = function(a, b) {
	return a[0] * b[1] - a[1] * b[0];
};

Vec2.lerp = function(a, b, scalar, result) {
	result = result || a;
	result[0] = a[0] + scalar * (b[0] - a[0]);
	result[1] = a[1] + scalar * (b[1] - a[1]);
	return result;
};

Vec2.max = function(a, b, axis) {
	if (axis != null) {
		return (a[axis] > b[axis]) ? a : b;
	}
	return (Vec2.lenSq(a) > Vec2.lenSq(b)) ? a : b;
};

Vec2.perp = function(a, result) {
	result = result || a;
	var x = a[0];
	result[0] = a[1];
	result[1] = -x;
	return result;
};

Vec2.dist = function(a, b) {
	var x = b[0] - a[0];
	var y = b[1] - a[1];
	return Math.sqrt(x * x + y * y);
};

Vec2.distSq = function(a, b) {
	var x = b[0] - a[0];
	var y = b[1] - a[1];
	return x * x + y * y;
};

Vec2.limit = function(a, max, result) {
	result = result || a;
	var x = a[0];
	var y = a[1];
	var ratio = max / Math.sqrt(x * x + y * y);
	if (ratio < 1) {
		result[0] = x * ratio;
		result[1] = y * ratio;
	} else if (result !== a) {
		result[0] = x;
		result[1] = y;
	}
	return result;
};

var radCache = [Vec2(), Vec2()];

Vec2.rad = function(a, b) {
	if (!b) {
		return Math.atan2(a[1], a[0]);
	}
	return Math.acos(
		Vec2.dot(Vec2.norm(a, radCache[0]), Vec2.norm(b, radCache[1]))
	);
};

Vec2.rotate = function(a, theta, result) {
	result = result || a;
	var sinA = Math.sin(theta);
	var cosA = Math.cos(theta);
	var x = a[0];
	var y = a[1];
	result[0] = x * cosA - y * sinA;
	result[1] = x * sinA + y * cosA;
	return result;
};

Vec2.rotateAxis = function(a, b, theta, result) {
	return Vec2.add(
		Vec2.rotate(
			Vec2.sub(a, b, result || a),
			theta
		),
		b
	);
};

Vec2.rotateTo = function(a, rad, result) {
	result = result || a;
	var len = Vec2.len(a);
	return Vec2.rotate(Vec2.set(result, len, 0), rad);
};

Vec2.lookAt = function(a, b, result) {
	var len = Vec2.len(a);
	return Vec2.norm(
		Vec2.rotate(
			a,
			Math.atan2(b[0] - a[0], b[1] - a[1]) - Math.atan2(a[1], a[0]),
			result || a
		),
		null, len
	);
};

Vec2.variant = function(a, delta, result) {
	result = result || a;
	result[0] = a[0] + Random.randRange(-delta, delta);
	result[1] = a[1] + Random.randRange(-delta, delta);
	return result;
};

var circRand = Vec2();

Vec2.variantCirc = function(a, delta, ease, result) {
	result = result || a;
	var len = randRange(0, delta, ease);
	var theta = randRange(0, TAU);
	var sinA = Math.sin(theta);
	var cosA = Math.cos(theta);
	result[0] = a[0] + (len * cosA - 0 * sinA);
	result[1] = a[1] + (len * sinA + 0 * cosA);
	return result;
};

Vec2.variantRad = function(a, delta, ease, result) {
	return Vec2.rotate(a, randRange(-delta, delta, ease), result);
};

Vec2.variantLen = function(a, delta, ease, result) {
	return Vec2.norm(a, result, Vec2.len(a) + randRange(-delta, delta, ease));
};

module.exports.Vec2 = Vec2;