'use strict';
/**
 * @module core/color
 */

var Mathf = require('../math/mathf');
var Random = require('../math/random');
var Tweens = require('../math/tweens');

/**
 * Initialize from Color array or RGBA. Returns a new (typed) array.
 * @class
 * @classdesc Representation of RGBA colors.
 * @param {Number[]|null} fromOrR Array or red-value
 * @param {Number|null} g Green-value
 * @param {Number|null} b Blue-value
 * @param {Number|null} a Alpha-value
 * @returns {Number[]} new Float32Array [r, g, b, a]
 */
function Color(fromOrR, g, b, a) {
	if (g != null) {
		return new Float32Array([fromOrR, g, b, (a != null) ? a : 1]);
	}
	if (fromOrR != null) {
		return new Float32Array([fromOrR[0], fromOrR[1], fromOrR[2],
			(fromOrR[3] != null) ? fromOrR[3] : 1]);
	}
	return new Float32Array(Color.black);
}

Color.white = Color(255, 255, 255);
Color.black = Color(0, 0, 0);
Color.gray = Color(128, 128, 128);
Color.cache = [Color(), Color(), Color(), Color()];

/**
 * Set result from color values
 * @memberOf Color
 * @param {Number[]} result Color to mutate
 * @param {Number} r
 * @param {Number} g
 * @param {Number} b
 * @param {Number} a
 * @return {Number[]} result
 */
Color.set = function(result, r, g, b, a) {
	result[0] = r || 0;
	result[1] = g || 0;
	result[2] = b || 0;
	result[3] = a || 0;
	return result;
};

/**
 * Copy to result from other color
 * @param {Number[]} result Target
 * @param {Number[]} b Source
 * @return {Number[]}
 */
Color.copy = function(result, b) {
	result[0] = b[0];
	result[1] = b[1];
	result[2] = b[2];
	result[3] = b[3];
	return result;
};

Color.lerp = function(a, b, t, alpha, result) {
	result = result || a;
	result[0] = (1 - t) * a[0] + t * b[0];
	result[1] = (1 - t) * a[1] + t * b[1];
	result[2] = (1 - t) * a[2] + t * b[2];
	if (alpha > 0.05) {
		result[3] = (1 - t) * a[3] + t * b[3];
	} else {
		result[3] = a[3];
	}
	return result;
};

Color.lerpList = function(result, list, t, ease) {
	var last = list.length - 1;
	t = Mathf.clamp(t * last, 0, last);
	var start = t | 0;
	var sub = (ease || Tweens.linear)(t - start);
	if (sub < 0.02) {
		return Color.copy(result, list[start]);
	}
	if (sub > 0.98) {
		return Color.copy(result, list[start + 1]);
	}
	return Color.lerp(list[start], list[start + 1], sub, null, result);
};

Color.variant = function(a, t, result) {
	t = Random.rand(-t, t);
	return Color.lerp(a, (t > 0 ? Color.white : Color.black), t, false, result);
};

Color.rgba = function(a, alpha) {
	if (alpha == null) {
		alpha = a[3];
	}
	if (alpha > 0.98) {
		return 'rgb(' + (a[0] | 0) + ', ' + (a[1] | 0) + ', ' + (a[2] | 0) + ')';
	}
	return 'rgba(' + (a[0] | 0) + ', ' + (a[1] | 0) + ', ' + (a[2] | 0) + ', ' + alpha + ')';
};

Color.defineProperty = function(cls, name) {
	var prop = '_' + name;
	Object.defineProperty(cls.prototype, name, {
		get: function() {
			return this[prop];
		},
		set: function(value) {
			this[prop][0] = value[0];
			this[prop][1] = value[1];
			this[prop][2] = value[2];
			this[prop][3] = value[3];
		}
	});
	var copy = 'copy' + name.charAt(0).toUpperCase() + name.slice(1);
	cls.prototype[copy] = function(result) {
		result[0] = this[prop][0];
		result[1] = this[prop][1];
		result[2] = this[prop][2];
		result[3] = this[prop][3];
	};
};

module.exports = Color;
