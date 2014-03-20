'use strict';
/**
 * Heightmap
 *
 * http://www.float4x4.net/index.php/2010/06/
 *   generating-realistic-and-playable-terrain-height-maps/
 */

var Perlin = require('./perlin');

var Heightmap = function(size, scale) {
	this.size = size || 256;
	this.scale = scale || 1;

	this.perlin = new Perlin();
	this.heights = new Float32Array(size * size);
};

Heightmap.prototype = {

	add: function(scale, ratio) {
		var size = this.size;
		var perlin = this.perlin;
		var heights = this.heights;
		var baseScale = this.scale;

		var x = size;
		while (x--) {
			var y = size;
			while (y--) {
				var factor = (baseScale + scale) / size;
				var value = perlin.get(x * factor, y * factor, 0) * ratio;
				heights[x * size + y] += value;
			}
		}
	},

	erode: function(smoothness) {
		smoothness = smoothness || 1;
		var size = this.size;
		var heights = this.heights;

		var x = size;
		while (x--) {
			var y = size;
			while (y--) {
				var key = x * size + y;
				var dmax = 0;
				var matchX = 0;
				var matchY = 0;
				for (var u = -1; u <= 1; u++) {
					var xu = x + u;
					if (xu < 0 || xu >= size) {
						continue;
					}
					for (var v = -1; v <= 1; v++) {
						var yv = y + v;
						if (yv < 0 || yv >= size) {
							continue;
						}
						if (Math.abs(u) + Math.abs(v) > 0) {
							var d = heights[key] - heights[(x + u) * size + (y + v)];
							if (d > dmax) {
								dmax = d;
								matchX = u;
								matchY = v;
							}
						}
					}
				}
				if (dmax > 0 && dmax <= (smoothness / size)) {
					var h = 0.5 * dmax;
					heights[key] -= h;
					heights[(x + matchX) * size + (y + matchY)] += h;
				}
			}
		}
	},

	// 3×3 box filter
	smoothen: function(factor) {
		factor = factor || 1;
		var size = this.size;
		var heights = this.heights;

		var x = size;
		while (x--) {
			var y = size;
			while (y--) {
				var total = 0;
				var count = 0;
				for (var u = -1; u <= 1; u++) {
					var xu = x + u;
					if (xu < 0 || xu >= size) {
						continue;
					}
					for (var v = -1; v <= 1; v++) {
						var yv = y + v;
						if (yv < 0 || yv >= size) {
							continue;
						}
						var height = heights[xu * size + yv];
						if (u === 0 && v === 0) {
							height *= factor;
							count += factor;
						} else {
							count++;
						}
						total += height || 0;
					}
				}
				heights[x * size + y] = total / count;
			}
		}
	},

	get: function(x, y) {
		return this.heights[x * this.size + y];
	}

};

module.exports = Heightmap;