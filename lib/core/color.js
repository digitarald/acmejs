'use strict';

require('./math');

var ARRAY_TYPE = Math.ARRAY_TYPE;

/**
 * Color manipulation on typed arrays.
 *
 * @constructor
 * Initialize from Color array or RGBA values.
 *
 * @param {Number[]|null} fromOrR Array or red-value
 * @param {Number|null} g Green-value
 * @param {Number|null} b Blue-value
 * @param {Number|null} a Alpha-value
 */
function Color(fromOrR, g, b, a) {
  if (g != null) {
    return new ARRAY_TYPE([fromOrR, g, b, (a != null) ? a : 1]);
  }
  if (fromOrR != null) {
    return new ARRAY_TYPE([fromOrR[0], fromOrR[1], fromOrR[2], (fromOrR[3] != null) ? fromOrR[3] : 1]);
  }
  return new ARRAY_TYPE(Color.black);
}

Color.white = Color(255, 255, 255);
Color.black = Color(0, 0, 0);
Color.gray = Color(128, 128, 128);
Color.cache = [Color(), Color(), Color(), Color()];

/**
 * Set result from color values
 *
 * @static
 *
 * @param {Number[]} result Target
 * @param {Number} r
 * @param {Number} g
 * @param {Number} b
 * @param {Number} a
 *
 * @return {Number[]}
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
 *
 * @static
 *
 * @param {Number[]} result Target
 * @param {Number[]} b Source
 *
 * @return {Number[]}
 */
Color.copy = function(result, b) {
  result.set(b || Color.black);
  return result;
};

Color.lerp = function(a, b, t, alpha, result) {
  if (!result) {
    result = a;
  }
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
  var t = Math.clamp(t * last, 0, last);
  var start = t | 0;
  var sub = (ease || Math.linear)(t - start);
  if (sub < 0.02) {
    return Color.copy(result, list[start]);
  }
  if (sub > 0.98) {
    return Color.copy(result, list[start + 1]);
  }
  return Color.lerp(list[start], list[start + 1], sub, null, result);
};

Color.variant = function(a, t, result) {
  t = Math.rand(-t, t);
  return Color.lerp(a, (t > 0 ? Color.white : Color.black), t, false, result);
};

Color.rgba = function(a, alpha) {
  if (!alpha) {
    alpha = a[3];
  }
  if (alpha > 0.98) {
    return "rgb(" + (a[0] | 0) + ", " + (a[1] | 0) + ", " + (a[2] | 0) + ")";
  } else {
    return "rgba(" + (a[0] | 0) + ", " + (a[1] | 0) + ", " + (a[2] | 0) + ", " + alpha + ")";
  }
};

module.exports = Color;
