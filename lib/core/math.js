'use strict';

/**
 * http://docs.unity3d.com/Documentation/ScriptReference/Mathf.html
 * https://github.com/secretrobotron/gladius.math/
 * https://github.com/toji/gl-matrix/tree/master/src/gl-matrix
 */
var Mth = Math;

var sqrt = Mth.sqrt;
var pow = Mth.pow;
var abs = Mth.abs;
var random = Mth.random;

var EPSILON = Mth.EPSILON = 0.001;

Mth.TAU = Mth.PI * 2;
Mth.PIRAD = 0.0174532925;
Mth.UID = 1;

Mth.uid = function() {
  return Mth.UID++;
};

Mth.clamp = function(a, low, high) {
  if (a < low) {
    return low;
  }
  if (a > high) {
    return high;
  } else {
    return a;
  }
};

Mth.rand = function(low, high, ease) {
  return (ease || Mth.linear)(random()) * (high - low) + low;
};

Mth.randArray = function(array) {
  return array[random() * array.length + 0.5 | 0];
};

Mth.chance = function(chance) {
  return random() <= chance;
};

var powIn = function(strength) {
  if (strength == null) {
    strength = 2;
  }
  return function(t) {
    return pow(t, strength);
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

Mth.linear = function(t) {
  return t;
};

var transitions = ['quad', 'cubic', 'quart', 'quint'];
for (var i = 0, l = transitions.length; i < l; i++) {
  var transition = transitions[i];
  var fn = powIn(i + 2);
  Mth[transition + 'In'] = fn;
  Mth[transition + 'Out'] = toOut(fn);
  Mth[transition + 'InOut'] = toInOut(fn);
}

var ARRAY_TYPE = Mth.ARRAY_TYPE = window.Float32Array || function(arr) {
  return arr;
};

/**
 * Vec2
 *
 * Returns a new (typed) array.
 *
 * @param {Vec2|number} fromOrX Typed array to copy from or x
 * @param {number} y       y, when x was provided as first argument
 */
var Vec2 = Mth.Vec2 = function(fromOrX, y) {
  if (y != null) {
    return new ARRAY_TYPE([fromOrX, y]);
  }
  if (fromOrX != null) {
    return new ARRAY_TYPE(fromOrX);
  }
  return new ARRAY_TYPE(Vec2.zero);
};

Vec2.zero = Vec2.center = Vec2(0, 0);
Vec2.cache = [Vec2(), Vec2(), Vec2(), Vec2(), Vec2()];
Vec2.topLeft = Vec2(-1, -1);
Vec2.topCenter = Vec2(0, -1);
Vec2.topRight = Vec2(1, -1);
Vec2.centerLeft = Vec2(-1, 0);
Vec2.centerRight = Vec2(1, 0);
Vec2.bottomLeft = Vec2(-1, 1);
Vec2.bottomCenter = Vec2(0, 1);
Vec2.bottomRight = Vec2(1, 1);

var radCache = [Vec2(), Vec2()];
var objCache = {
  x: 0,
  y: 0
};
var objVecCache = Vec2();

Vec2.set = function(result, x, y) {
  result[0] = x || 0;
  result[1] = y || 0;
  return result;
};

Vec2.copy = function(result, b) {
  result.set(b || Vec2.zero);
  return result;
};

Vec2.valid = function(a) {
  return !(isNaN(a[0]) || isNaN(a[1]));
};

Vec2.toString = function(a) {
  return "[" + a[0] + ", " + a[1] + "]";
};

Vec2.fromObj = function(obj, a) {
  if (!a) {
    a = objVecCache;
  }
  a[0] = obj.x;
  a[1] = obj.y;
  return a;
};

Vec2.toObj = function(a, obj) {
  if (!obj) {
    obj = objCache;
  }
  obj.x = a[0];
  obj.y = a[1];
  return obj;
};

Vec2.eq = function(a, b) {
  return abs(a[0] - b[0]) < EPSILON && abs(a[1] - b[1]) < EPSILON;
};

Vec2.add = function(a, b, result) {
  if (!result) {
    result = a;
  }
  result[0] = a[0] + b[0];
  result[1] = a[1] + b[1];
  return result;
};

Vec2.sub = function(a, b, result) {
  if (!result) {
    result = a;
  }
  result[0] = a[0] - b[0];
  result[1] = a[1] - b[1];
  return result;
};

Vec2.mul = function(a, b, result) {
  if (!result) {
    result = a;
  }
  result[0] = a[0] * b[0];
  result[1] = a[1] * b[1];
  return result;
};

Vec2.scal = function(a, scalar, result) {
  if (!result) {
    result = a;
  }
  result[0] = a[0] * scalar;
  result[1] = a[1] * scalar;
  return result;
};

Vec2.norm = function(a, result, scalar) {
  if (!result) {
    result = a;
  }
  var x = a[0];
  var y = a[1];
  var len = (scalar || 1) / (sqrt(x * x + y * y) || 1);
  result[0] = x * len;
  result[1] = y * len;
  return result;
};

Vec2.lenSq = function(a) {
  return a[0] * a[0] + a[1] * a[1];
};

Vec2.len = function(a) {
  return sqrt(a[0] * a[0] + a[1] * a[1]);
};

Vec2.dot = function(a, b) {
  return a[0] * b[0] + a[1] * b[1];
};

Vec2.cross = function(a, b) {
  return a[0] * b[1] - a[1] * b[0];
};

Vec2.lerp = function(a, b, scalar, result) {
  if (!result) {
    result = a;
  }
  result[0] = a[0] + scalar * (b[0] - a[0]);
  result[1] = a[1] + scalar * (b[1] - a[1]);
  return result;
};

Vec2.max = function(a, b, axis) {
  if (axis != null) {
    if (a[axis] > b[axis]) {
      return a;
    } else {
      return b;
    }
  }
  if (Vec2.lenSq(a) > Vec2.lenSq(b)) {
    return a;
  } else {
    return b;
  }
};

// http://www.cas.kth.se/CURE/doc-cure-2.2.1/html/toolbox_2src_2Math_2Vector2D_8hh-source.html
Vec2.perp = function(a, result) {
  if (!result) {
    result = a;
  }
  var x = a[0];
  result[0] = a[1];
  result[1] = -x;
  return result;
};

Vec2.dist = function(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  return sqrt(x * x + y * y);
};

Vec2.distSq = function(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  return x * x + y * y;
};

Vec2.limit = function(a, max, result) {
  if (!result) {
    result = a;
  }
  var x = a[0];
  var y = a[1];
  var ratio = max / sqrt(x * x + y * y);
  if (ratio < 1) {
    result[0] = x * ratio;
    result[1] = y * ratio;
  } else if (result !== a) {
    result[0] = x;
    result[1] = y;
  }
  return result;
};

Vec2.rad = function(a, b) {
  if (!b) {
    return Mth.atan2(a[1], a[0]);
  }
  return Mth.acos(Vec2.dot(Vec2.norm(a, radCache[0]), Vec2.norm(b, radCache[1])));
};

Vec2.rot = function(a, theta, result) {
  if (!result) {
    result = a;
  }
  var sinA = Mth.sin(theta);
  var cosA = Mth.cos(theta);
  var x = a[0];
  var y = a[1];
  result[0] = x * cosA - y * sinA;
  result[1] = x * sinA + y * cosA;
  return result;
};

Vec2.rotAxis = function(a, b, theta, result) {
  return Vec2.add(
    Vec2.rot(
      Vec2.sub(a, b, result || a),
      theta
    ),
    b
  );
};

Vec2.lookAt = function(a, b, result) {
  var len = Vec2.len(a);
  return Vec2.norm(Vec2.rot(a, Mth.atan2(b[0] - a[0], b[1] - a[1]) - Mth.atan2(a[1], a[0]), result || a), null, len);
};

Vec2.variant = function(a, delta, result) {
  if (!result) {
    result = a;
  }
  result[0] = a[0] + Math.rand(-delta, delta);
  result[1] = a[1] + Math.rand(-delta, delta);
  return result;
};

/**

// initialize temp arrays used in bezier calcs to avoid allocations
Vector._tmpBezierX = new Array(64);
Vector._tmpBezierY = new Array(64);

Vector.calcPathBezier = function (points, delta) {
    var result = new Vector(0, 0);
    Vector.setCalcPathBezier(points, delta, result);
    return result;
};

/**
 * Calculates the bezier path vector
 * @param points {Array.<Vector>}
 * @param delta {number}
 * @param result {Vector}
 *
Vector.setCalcPathBezier = function (points, delta, result) {
    var count = points.length;
    if (count <= 1) {
        result.x = result.y = 0;
        return;
    }

    var xs = Vector._tmpBezierX,
        ys = Vector._tmpBezierY,
        d1 = 1 - delta;

    for (var j = 0; j < count; j++) {
        var point = points[j];
        xs[j] = point.x;
        ys[j] = point.y;
    }

    var countMinusOne = count - 1;
    for (; countMinusOne > 0; count--, countMinusOne--) {
        var i = 0, iPlusOne = 1;
        for (; i < countMinusOne; i++, iPlusOne++) {
            xs[i] = xs[i] * d1 + xs[iPlusOne] * delta;
            ys[i] = ys[i] * d1 + ys[iPlusOne] * delta;
        }
    }
    result.x = xs[0];
    result.y = ys[0];
};
 */

module.exports.Vec2 = Vec2;

/**
 * 2x3 Matrix
 *
 * https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/mat2d.js
 * @param {[type]} fromOrA [description]
 * @param {[type]} b       [description]
 * @param {[type]} c       [description]
 * @param {[type]} d       [description]
 * @param {[type]} tx      [description]
 * @param {[type]} ty      [description]
 */
var Mat2 = Mth.Mat2 = function(fromOrA, b, c, d, tx, ty) {
  if (b != null) {
    return new ARRAY_TYPE([fromOrA, b, c, d, tx, ty]);
  }
  if (fromOrA != null) {
    return new ARRAY_TYPE(fromOrA);
  }
  return new ARRAY_TYPE(Mat2.identity);
};

Mat2.identity = Mat2(1, 0, 0, 1, 0, 0);

Mat2.set = function(result, a, b, c, d, tx, ty) {
  result[0] = a || 0;
  result[1] = b || 0;
  result[2] = c || 0;
  result[3] = d || 0;
  result[4] = tx || 0;
  result[5] = ty || 0;
  return result;
};

Mat2.copy = function(result, b) {
  result.set(b);
  return result;
};

Mat2.valid = function(a) {
  return !(isNaN(a[0]) || isNaN(a[1]) || isNaN(a[2]) || isNaN(a[3]) || isNaN(a[4]) || isNaN(a[5]));
};

Mat2.toString = function(a) {
  return "[" + a[0] + ", " + a[1] + " | " + a[2] + ", " + a[3] + " | " + a[4] + ", " + a[5] + "]";
};

Mat2.mul = function(a, b, result) {
  result || (result = a);
  var aa = a[0];
  var ab = a[1];
  var ac = a[2];
  var ad = a[3];
  var atx = a[4];
  var aty = a[5];
  var ba = b[0];
  var bb = b[1];
  var bc = b[2];
  var bd = b[3];
  var btx = b[4];
  var bty = b[5];
  result[0] = aa * ba + ab * bc;
  result[1] = aa * bb + ab * bd;
  result[2] = ac * ba + ad * bc;
  result[3] = ac * bb + ad * bd;
  result[4] = ba * atx + bc * aty + btx;
  result[5] = bb * atx + bd * aty + bty;
  return result;
};

Mat2.rot = function(a, rad, result) {
  result || (result = a);
  var aa = a[0];
  var ab = a[1];
  var ac = a[2];
  var ad = a[3];
  var atx = a[4];
  var aty = a[5];
  var st = Mth.sin(rad);
  var ct = Mth.cos(rad);
  result[0] = aa * ct + ab * st;
  result[1] = -aa * st + ab * ct;
  result[2] = ac * ct + ad * st;
  result[3] = -ac * st + ct * ad;
  result[4] = ct * atx + st * aty;
  result[5] = ct * aty - st * atx;
  return result;
};

Mat2.scal = function(a, v, result) {
  result || (result = a);
  var vx = v[0];
  var vy = v[1];
  result[0] = a[0] * vx;
  result[1] = a[1] * vy;
  result[2] = a[2] * vx;
  result[3] = a[3] * vy;
  result[4] = a[4] * vx;
  result[5] = a[5] * vy;
  return result;
};

Mat2.trans = function(a, v, result) {
  result || (result = a);
  result[0] = a[0];
  result[1] = a[1];
  result[2] = a[2];
  result[3] = a[3];
  result[4] = a[4] + v[0];
  result[5] = a[5] + v[1];
  return result;
};

module.exports.Mat2 = Mat2;
