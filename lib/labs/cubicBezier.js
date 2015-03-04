'use strict';

/**
 * CubicBezier
 *
 * http://jsperf.com/cubic-bezier
 *
 * KeySpline - use bezier curve for transition easing function is
 * inspired from Firefox's nsSMILKeySpline.cpp
 *
 * Usage:
 *
 *     var spline = new KeySpline(0.25, 0.1, 0.25, 1.0)
 *     spline.get(x) => returns the easing value | x must be in [0, 1] range
 *
 * @param {Number} p1 Vector
 * @param {Number} p2 Vector
 */
function CubicBezier(p1, p2) {
	this.p1 = p1;
	this.p2 = p2;
	this.linear = (p1[0] == p1[1] && p2[0] == p2[1]);
}

/**
 * Pre-alculate samples.
 *
 * @param {Number} size Numbers of samples, defaults to 100
 */
CubicBezier.prototype.sample = function(size) {
	if (!size) {
		size = 100;
	}
	this.sampleSize = size;
	var samples = [];
	for (var i = 0; i < size; i++) {
		samples.push(this.get(i / size));
	}
	this.samples = new Float32Array(samples);
};

function A(a1, a2) {
	return 1.0 - 3.0 * a2 + 3.0 * a1;
}
function B(a1, a2) {
	return 3.0 * a2 - 6.0 * a1;
}
function C(a1) {
	return 3.0 * a1;
}

/**
 * Get y for time x.
 * @param {Number} x Between 0 and 1
 * @return {Number}
 */
CubicBezier.prototype.get = function(x) {
	if (this.linear) {
		return x;
	}
	if (this.samples) {
		return this.samples[x * this.sampleSize | 0];
	}

	var x1 = this.p1[0];
	var y1 = this.p1[1];
	var x2 = this.p2[0];
	var y2 = this.p2[1];

	// Newton raphson iteration
	var t = x;
	for (var i = 0; i < 4; ++i) {
		// use Horner's scheme to evaluate the Bezier polynomial
		var currentSlope = 3.0 * A(x1, x2) * t * t + 2.0 * B(x1, x2) * t + C(x1);
		if (!currentSlope) {
			break;
		}
		t -= ((((A(x1, x2) * t + B(x1, x2)) * t + C(x1)) * t) - x) / currentSlope;
	}
	return t;
};

module.exports = CubicBezier;
