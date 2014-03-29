'use strict';

var Vec2 = require('./math').Vec2;

function FMathModule(stdlib) {
	'use asm';

	var UID = 0;

	// Variable Declarations
	var sqrt = stdlib.Math.sqrt;
	var x = 0.0;
	var y = 0.0;

	function uid() {
		UID = (UID | 0 + 1) | 0;
		return UID | 0;
	}

	function clamp(a, low, high) {
		a = + a;
		low = + low;
		high = + high;
		if (a < low) {
			return + low;
		}
		if (a > high) {
			return + high;
		}
		return + a;
	}

	function lerp(a, b, scalar) {
		a = + a;
		b = + b;
		scalar = + scalar;
		return + (a + scalar * (b - a));
	}

	function mod(a, b) {
		a = + a;
		b = + b;
		a = + (a % b);
		if (a * b < 0.0) {
			return + (a + b);
		}
		return + a;
	}

	function vec2Dist(a0, a1, b0, b1) {
		a0 = + a0;
		a1 = + a1;
		b0 = + b0;
		b1 = + b1;
		x = + (b0 - a0);
		y = + (b1 - a1);
		return + sqrt(x * x + y * y);
	}

	return {
		uid: uid,
		clamp: clamp,
		mod: mod,
		lerp: lerp,
		vec2Dist: vec2Dist
	};
}

var FMath = FMathModule(window);

var vecA = new Float32Array([1.3, 1.2]);
var vecB = new Float32Array([5.3, -10.2]);

function vec2Dist(a, b) {
	return FMath.vec2Dist(a[0], a[1], b[0], b[1]);
}

var x = 0.0;

for (var i = 0; i < 100000; i++) {
	x = Math.mod(400, 360);
	x = FMath.mod(400.0, 360.0);
	vec2Dist(vecA, vecB);
}

console.time('fm');
for (var i = 0; i < 100000; i++) {
	vec2Dist(vecA, vecB);
}
console.timeEnd('fm');

Math.mod(400, 360);

console.time('m');
for (var i = 0; i < 100000; i++) {
	Vec2.dist(vecA, vecB);
}
console.timeEnd('m');

module.exports = FMath;
