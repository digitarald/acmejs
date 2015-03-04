/** @flow */

/*
 * http://docs.unity3d.com/Documentation/ScriptReference/export html
 * https://github.com/secretrobotron/gladius.math/
 * https://github.com/toji/gl-matrix/tree/master/src/gl-matrix
 *
 * TODO: https://github.com/photonstorm/phaser/blob/master/Phaser/GameMath.ts
 */
export const EPSILON = 0.01;
const PI = Math.PI;
export const TAU = PI * 2;
export const HALF_PI = PI / 2;
export const RAD2DEG = 180 / PI;
export const DEG2RAD = PI / 180;

let staticUid:number = 1;

/**
 * Generate UID
 * @function uid
 * @return {Number} Unique ID
 */
export function uid():number {
	return staticUid++;
};

export function clamp(a:number, low:number, high:number):number {
	if (a < low) {
		return low;
	}
	if (a > high) {
		return high;
	}
	return a;
};

export function map(a:number, fromLow:number, fromHigh:number, toLow:number, toHigh:number):number {
	return toLow + (((a - fromLow) / (fromHigh - fromLow)) * (toHigh - toLow));
};

/**
 * Correct modulo behavior
 * @param {Number} a Dividend
 * @param {Number} b Divisor
 * @return {Number} a % b where the result is between 0 and b (either
 *   0 <= x < b or b < x <= 0, depending on the sign of b).
 */
export function mod(a:number, b:number):number {
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
export function repeat(t:number, length:number):number {
	return t - Math.floor(t / length) * length;
};

export function toDeg(rad:number):number {
	return rad * RAD2DEG;
};

export function toRad(deg:number):number {
	return deg * DEG2RAD;
};

export function normDeg(deg:number):number {
	deg %= 360;
	return (deg * 360 < 0) ? deg + 360 : deg;
};

export function normRad(rad:number):number {
	rad %= TAU;
	return (rad * TAU < 0) ? rad + TAU : rad;
};

export function distRad(a:number, b:number):number {
	let d = normRad(b) - normRad(a);
	if (d > PI) {
		return d - TAU;
	}
	if (d <= -PI) {
		return d + TAU;
	}
	return d;
};

export function distDeg(a:number, b:number):number {
	let d = normDeg(b) - normDeg(a);
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
export function lerp(a:number, b:number, scalar:number):number {
	return a + scalar * (b - a);
};

export function distAng(a:number, b:number):number {
	if (a == b) {
		return 0;
	}
	let ab = (a < b);
	let l = ab ? (-a - TAU + b) : (b - a);
	let r = ab ? (b - a) : (TAU - a + b);
	return (Math.abs(l) > Math.abs(r)) ? r : l;
};

let dampState = {
	value: 0,
	velocity: 0
};

/**
 * Gradually changes a value towards a desired goal over time.
 *
 * http://docs.unity3d.com/Documentation/ScriptReference/export SmoothDamp.html
 * http://answers.unity3d.com/questions/24756/formula-behind-smoothdamp.html
 */
export function smoothDamp(a:number, b:number, velocity:number, time:number, maxVelocity:number, delta:number):{value: number; velocity: number} {
	time = Math.max(EPSILON, time);
	delta = Math.max(0.02, delta);
	let num = 2 / time;
	let num2 = num * delta;
	let num3 = 1 / (1 + num2 + 0.48 * num2 * num2 + 0.235 * num2 * num2 * num2);
	let num4 = a - b;
	let num5 = b;
	let num6 = (maxVelocity || Number.POSITIVE_INFINITY) * time;
	num4 = clamp(num4, -num6, num6);
	b = a - num4;
	let num7 = (velocity + num * num4) * delta;
	velocity = (velocity - num * num7) * num3;
	let value = b + (num4 + num7) * num3;
	if (num5 - a > 0 == value > num5) {
		value = num5;
		velocity = (value - num5) / delta;
	}
	dampState.value = value;
	dampState.velocity = velocity;
	return dampState;
};
