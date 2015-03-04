
import {clamp, EPSILON, TAU} from '../math/mathf';
import {random} from '../math/random';

/**
 * Initialize from Vec2 array or x/y values. Returns a new (typed) array.
 * @class
 * @classdesc Float32Array representation of 2D vectors and points.
 * @param {Vec2|Number} [fromOrX=Vec2.zero] Typed array to copy from or x
 * @param {Number} y y, when x was provided as first argument
 * @returns {Vec2} vec2 New 2D Vector
 */
export default function Vec2(fromOrX, y) {
	if (y != null) {
		return new Float32Array([fromOrX, y]);
	}
	return new Float32Array(fromOrX || 2);
}

Vec2.zero = Vec2(0, 0);
Vec2.one = Vec2(1, 1);
Vec2.center = Vec2(0.5, 0.5);
Vec2.topLeft = Vec2(0, 0);
Vec2.topCenter = Vec2(0.5, 0);
Vec2.topRight = Vec2(1, 0);
Vec2.centerLeft = Vec2(0, 0.5);
Vec2.centerRight = Vec2(1, 0.5);
Vec2.bottomLeft = Vec2(1, 1);
Vec2.bottomCenter = Vec2(0.5, 1);
Vec2.bottomRight = Vec2(0.5, 0.5);

/**
 * Set vector from x and y value
 * @param {Vec2} result Vec2 to mutate
 * @param {Number} [x=0]
 * @param {Number} [y=0]
 * @return {Vec2} result
 */
Vec2.set = function(result, x, y) {
	result[0] = x || 0;
	result[1] = y || 0;
	return result;
};

Vec2.copy = function(result, b) {
	result[0] = b[0];
	result[1] = b[1];
	return result;
};

Vec2.reset = function(result) {
	result[0] = 0;
	result[1] = 0;
	return result;
};

Vec2.valid = function(a) {
	return !(isNaN(a[0]) || isNaN(a[1]));
};

Vec2.toString = function(a) {
	return `[${a[0]}, ${a[1]}]`;
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

Vec2.equals = function(a, b) {
	return a[0] == b[0] && a[1] == b[1];
};

Vec2.approx = function(a, b) {
	return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON;
};

Vec2.isZero = function(a, b) {
	return a[0] === 0 && a[1] === 0;
};

Vec2.approxZero = function(a, b) {
	return a[0] < EPSILON && a[0] > -EPSILON && a[1] < EPSILON && a[1] > -EPSILON;
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

/**
 * Linear interpolation
 * http://en.wikipedia.org/wiki/Lerp_%28computing%29
 * @param  {Vec2} a
 * @param  {Vec2} b
 * @param  {Number} scalar Interpolation parameter between 0 and 1
 * @return {Vec2} Result
 */
Vec2.lerp = function(a, b, scalar, result) {
	result = result || a;
	result[0] = a[0] + scalar * (b[0] - a[0]);
	result[1] = a[1] + scalar * (b[1] - a[1]);
	return result;
};

var slerpCacheA = Vec2();
var slerpCacheB = Vec2();

/**
 * Spherical linear interpolation
 * http://en.wikipedia.org/wiki/Slerp
 * @param  {Vec2} a
 * @param  {Vec2} b
 * @param  {Number} scalar Interpolation parameter between 0 and 1
 * @return {Vec2} Result
 */
Vec2.slerp = function(a, b, scalar, result) {
	result = result || a;
	var omega = Math.acos(clamp(Vec2.dot(
		Vec2.norm(a, slerpCacheA),
		Vec2.norm(b, slerpCacheB)
	), -1, 1));
	return Vec2.lerp(a, b, Math.min(scalar, omega) / omega, result);
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

Vec2.near = function(a, b, dist) {
	return Vec2.distSq(a, b) <= dist * dist;
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

Vec2.clamp = Vec2.limit;

var radCache1 = Vec2();
var radCache2 = Vec2();

Vec2.rad = function(a, b) {
	if (!b) {
		return Math.atan2(a[1], a[0]);
	}
	return Math.acos(
		Vec2.dot(Vec2.norm(a, radCache1), Vec2.norm(b, radCache2))
	);
};

Vec2.rotate = function(a, theta, result) {
	result = result || a;
	var sinA = Math.sin(theta);
	var cosA = Math.cos(theta);
	result[0] = a[0] * cosA - a[1] * sinA;
	result[1] = a[0] * sinA + a[1] * cosA;
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
	result[0] = a[0] + random(-delta, delta);
	result[1] = a[1] + random(-delta, delta);
	return result;
};

Vec2.variantCirc = function(a, delta, result) {
	result = result || a;
	var len = random(0, delta);
	var theta = random(0, TAU);
	result[0] = a[0] + len * Math.cos(theta);
	result[1] = a[1] + len * Math.sin(theta);
	return result;
};

Vec2.variantRad = function(a, delta, result) {
	return Vec2.rotate(a, random(-delta, delta), result);
};

Vec2.variantLen = function(a, delta, result) {
	return Vec2.norm(a, result, Vec2.len(a) + random(-delta, delta));
};

var Vec2Property = {};
for (var prop in Vec2) {
	if (typeof prop == 'function') {

	}
}

Vec2.defineProperty = function(cls, name, options) {
	if (options == null) {
		options = {};
	}
	var prop = '_' + name;
	var descriptor = {};
	if (!options.noGet) {
		descriptor.get = function() {
			return this[prop];
		};
	}
	if (options.dirty) {
		descriptor.set = function(value) {
			this[prop][0] = value[0];
			this[prop][1] = value[1];
			this.dirty = true;
		}
	} else if (!options.noSet) {
		descriptor.set = function(value) {
			this[prop][0] = value[0];
			this[prop][1] = value[1];
		}
	}
	Object.defineProperty(cls.prototype, name, descriptor);
	var copy = 'copy' + name.charAt(0).toUpperCase() + name.slice(1);
	cls.prototype[copy] = function(result) {
		result[0] = this[prop][0];
		result[1] = this[prop][1];
		return result;
	};
};
