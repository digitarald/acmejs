'use strict';

/**
 * @class
 *
 * Improved Perlin Noise
 *
 * http://cs.nyu.edu/~perlin/noise/
 * https://github.com/louisstow/pixelminer/blob/master/lib/perlin.js
 */

var Perlin = function() {
	var permutation = [];
	for (var i = 0; i <= 255; i++) {
		permutation[i] = (Math.random() * 255) | 0;
	}
	this.permutation = new Uint8Array(permutation.concat(permutation));
	console.log(this.permutation.length);
}

Perlin.prototype.get = function(x, y, z) {
	var p = this.permutation;

	var floorX = ~~x;
	var floorY = ~~y;
	var floorZ = ~~z;

	var X = floorX & 255; // FIND UNIT CUBE THAT
	var Y = floorY & 255; // CONTAINS POINT.
	var Z = floorZ & 255;
	x -= floorX; // FIND RELATIVE X,Y,Z
	y -= floorY; // OF POINT IN CUBE.
	z -= floorZ;

	var u = fade(x); // COMPUTE FADE CURVES
	var v = fade(y); // FOR EACH OF X,Y,Z.
	var w = fade(z);

	var A = p[X] + Y;
	var AA = p[A] + Z;
	var AB = p[A + 1] + Z; // HASH COORDINATES OF
	var B = p[X + 1] + Y;
	var BA = p[B] + Z;
	var BB = p[B + 1] + Z; // THE 8 CUBE CORNERS,

	return lerp(w, lerp(v, lerp(u, grad(p[AA], x, y, z), // AND ADD
				grad(p[BA], x - 1, y, z)), // BLENDED
			lerp(u, grad(p[AB], x, y - 1, z), // RESULTS
				grad(p[BB], x - 1, y - 1, z))), // FROM 8
		lerp(v, lerp(u, grad(p[AA + 1], x, y, z - 1), // CORNERS
				grad(p[BA + 1], x - 1, y, z - 1)), // OF CUBE
			lerp(u, grad(p[AB + 1], x, y - 1, z - 1),
				grad(p[BB + 1], x - 1, y - 1, z - 1)))) + 0.5;
};

function fade(t) {
	return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(t, a, b) {
	return a + t * (b - a);
}

function grad(hash, x, y, z) {
	var h = hash & 15; // CONVERT LO 4 BITS OF HASH CODE
	var u = h < 8 ? x : y; // INTO 12 GRADIENT DIRECTIONS.
	var v = h < 4 ? y : h == 12 || h == 14 ? x : z;
	return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
}

module.exports = Perlin;
