/** @flow */
/**
 * @exports math/mathf
 */
var Mathf = {};

/*
 * http://docs.unity3d.com/Documentation/ScriptReference/Mathf.html
 * https://github.com/secretrobotron/gladius.math/
 * https://github.com/toji/gl-matrix/tree/master/src/gl-matrix
 *
 * TODO: https://github.com/photonstorm/phaser/blob/master/Phaser/GameMath.ts
 */
var EPSILON = 0.01;
Mathf.EPSILON = EPSILON;

var PI = Math.PI;
var TAU = PI * 2;
var HALF_PI = PI / 2;
var RAD2DEG = 180 / PI;
var DEG2RAD = PI / 180;
Mathf.TAU = TAU;
Mathf.HALF_PI = HALF_PI;
Mathf.RAD2DEG = RAD2DEG;
Mathf.DEG2RAD = DEG2RAD;

var uid:number = 1;

/**
 * Generate UID
 * @function uid
 * @return {Number} Unique ID
 */
Mathf.uid = function():number {
	return uid++;
};

Mathf.clamp = function(a:number, low:number, high:number):number {
	if (a < low) {
		return low;
	}
	if (a > high) {
		return high;
	}
	return a;
};

Mathf.map = function(a:number, fromLow:number, fromHigh:number, toLow:number, toHigh:number):number {
	return toLow + (((a - fromLow) / (fromHigh - fromLow)) * (toHigh - toLow));
};

/**
 * Correct modulo behavior
 * @param {Number} a Dividend
 * @param {Number} b Divisor
 * @return {Number} a % b where the result is between 0 and b (either
 *   0 <= x < b or b < x <= 0, depending on the sign of b).
 */
Mathf.mod = function(a:number, b:number):number {
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
Mathf.repeat = function(t:number, length:number):number {
	return t - Math.floor(t / length) * length;
};

Mathf.toDeg = function(rad:number):number {
	return rad * RAD2DEG;
};

Mathf.toRad = function(deg:number):number {
	return deg * DEG2RAD;
};

Mathf.normDeg = function(deg:number):number {
	deg %= 360;
	return (deg * 360 < 0) ? deg + 360 : deg;
};

Mathf.normRad = function(rad:number):number {
	rad %= TAU;
	return (rad * TAU < 0) ? rad + TAU : rad;
};

Mathf.distRad = function(a:number, b:number):number {
	var d = Mathf.normRad(b) - Mathf.normRad(a);
	if (d > PI) {
		return d - TAU;
	}
	if (d <= -PI) {
		return d + TAU;
	}
	return d;
};

Mathf.distDeg = function(a:number, b:number):number {
	var d = Mathf.normDeg(b) - Mathf.normDeg(a);
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
Mathf.lerp = function(a:number, b:number, scalar:number):number {
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
Mathf.smoothDamp = function(a:number, b:number, velocity:number, time:number, maxVelocity:number, delta:number):{value: number; velocity: number} {
	time = Math.max(EPSILON, time);
	delta = delta || 0.02;
	var num = 2 / time;
	var num2 = num * delta;
	var num3 = 1 / (1 + num2 + 0.48 * num2 * num2 + 0.235 * num2 * num2 * num2);
	var num4 = a - b;
	var num5 = b;
	var num6 = (maxVelocity || Number.POSITIVE_INFINITY) * time;
	num4 = Mathf.clamp(num4, -num6, num6);
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

Mathf.distAng = function(a:number, b:number):number {
	if (a == b) {
		return 0;
	}
	var ab = (a < b);
	var l = ab ? (-a - TAU + b) : (b - a);
	var r = ab ? (b - a) : (TAU - a + b);
	return (Math.abs(l) > Math.abs(r)) ? r : l;
};

module.exports = Mathf;
