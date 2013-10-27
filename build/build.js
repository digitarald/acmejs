
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-raf/index.js", Function("exports, require, module",
"\n\
module.exports = window.requestAnimationFrame\n\
  || window.webkitRequestAnimationFrame\n\
  || window.mozRequestAnimationFrame\n\
  || window.oRequestAnimationFrame\n\
  || window.msRequestAnimationFrame\n\
  || fallback;\n\
\n\
var prev = new Date().getTime();\n\
function fallback(fn) {\n\
  var curr = new Date().getTime();\n\
  var ms = Math.max(0, 16 - (curr - prev));\n\
  setTimeout(fn, ms);\n\
  prev = curr;\n\
}\n\
//@ sourceURL=component-raf/index.js"
));
require.register("acmejs/index.js", Function("exports, require, module",
"'use strict';\n\
\n\
module.exports = {\n\
  Random: require('./lib/core/math-random'),\n\
  Math: require('./lib/core/math'),\n\
  Color: require('./lib/core/color'),\n\
  Pool: require('./lib/core/pool'),\n\
  Engine: require('./lib/core/engine'),\n\
  Entity: require('./lib/core/entity'),\n\
  Component: require('./lib/core/component'),\n\
  Renderer: require('./lib/core/renderer'),\n\
  Console: require('./lib/core/console'),\n\
  Input: require('./lib/core/input'),\n\
  Transform: require('./lib/core/transform'),\n\
  Bounds: require('./lib/core/bounds'),\n\
  Sprite: require('./lib/core/sprite'),\n\
  Border: require('./lib/core/border'),\n\
  Collider: require('./lib/core/collider'),\n\
  Kinetic: require('./lib/core/kinetic'),\n\
  Boid: require('./lib/core/boid'),\n\
  Jitter: require('./lib/core/jitter'),\n\
  Particle: require('./lib/core/particle'),\n\
  Mat2: require('./lib/math/mat2'),\n\
  Perlin: require('./lib/labs/perlin'),\n\
  Heightmap: require('./lib/labs/heightmap')\n\
};\n\
//@ sourceURL=acmejs/index.js"
));
require.register("acmejs/lib/core/math-random.js", Function("exports, require, module",
"'use strict';\n\
\n\
// http://weblog.bocoup.com/random-numbers/\n\
// https://gist.github.com/Protonk/5367430\n\
\n\
// Linear Congruential Generator\n\
// Variant of a Lehman Generator\n\
\n\
// Set to values from http://en.wikipedia.org/wiki/Numerical_Recipes\n\
// m is basically chosen to be large (as it is the max period)\n\
// and for its relationships to a and c\n\
var m = 4294967296,\n\
\t// a - 1 should be divisible by m's prime factors\n\
\ta = 1664525,\n\
\t// c and m should be co-prime\n\
\tc = 1013904223,\n\
\tseed = 0,\n\
\tz = 0;\n\
\n\
var random = function() {\n\
\t// define the recurrence relationship\n\
\tz = (a * z + c) % m;\n\
\t// return a float in [0, 1)\n\
\t// if z = m then z / m = 0 therefore (z % m) / m < 1 always\n\
\treturn z / m;\n\
};\n\
Math._random = Math.random;\n\
Math.random = random;\n\
\n\
Math.rand = function(low, high, ease) {\n\
\treturn (ease || Math.linear)(random()) * (high - low) + low;\n\
};\n\
\n\
Math.randArray = function(array) {\n\
\treturn array[random() * array.length + 0.5 | 0];\n\
};\n\
\n\
Math.chance = function(chance) {\n\
\treturn random() <= chance;\n\
};\n\
\n\
Object.defineProperty(random, 'seed', {\n\
\tset: function(value) {\n\
\t\tseed = z = Math.round(value || Math._random() * m);\n\
\t},\n\
\tget: function() {\n\
\t\treturn seed;\n\
\t},\n\
\tenumerable: false,\n\
\tconfigurable: false\n\
});\n\
\n\
random.seed = null;\n\
\n\
module.exports = random;//@ sourceURL=acmejs/lib/core/math-random.js"
));
require.register("acmejs/lib/core/math.js", Function("exports, require, module",
"'use strict';\n\
\n\
require('./math-random');\n\
\n\
/*\n\
 * http://docs.unity3d.com/Documentation/ScriptReference/Mathf.html\n\
 * https://github.com/secretrobotron/gladius.math/\n\
 * https://github.com/toji/gl-matrix/tree/master/src/gl-matrix\n\
 *\n\
 * TODO: https://github.com/photonstorm/phaser/blob/master/Phaser/GameMath.ts\n\
 */\n\
var Mth = Math;\n\
\n\
var sqrt = Mth.sqrt;\n\
var pow = Mth.pow;\n\
var abs = Mth.abs;\n\
var atan2 = Mth.atan2;\n\
\n\
const EPSILON = Mth.EPSILON = 0.001;\n\
\n\
const PI = Mth.PI;\n\
const TAU = Mth.TAU = PI * 2;\n\
const HALF_PI = Mth.HALF_PI = PI / 2;\n\
const RAD2DEG = Mth.RAD2DEG = 180 / PI;\n\
const DEG2RAD = Mth.DEG2RAD = PI / 180;\n\
// Mth.PIRAD = 0.0174532925;\n\
Mth.UID = 1;\n\
\n\
Mth.uid = function() {\n\
\treturn Mth.UID++;\n\
};\n\
\n\
Mth.clamp = function(a, low, high) {\n\
\tif (a < low) {\n\
\t\treturn low;\n\
\t}\n\
\tif (a > high) {\n\
\t\treturn high;\n\
\t} else {\n\
\t\treturn a;\n\
\t}\n\
};\n\
\n\
/**\n\
 * Correct modulo behavior\n\
 * @param {Number} Dividend\n\
 * @param {Number} Divisor\n\
 * @return {Number} a % b where the result is between 0 and b (either\n\
 *   0 <= x < b or b < x <= 0, depending on the sign of b).\n\
 */\n\
Mth.mod = function(a, b) {\n\
\ta %= b;\n\
\treturn (a * b < 0) ? a + b : a;\n\
};\n\
\n\
/**\n\
 * Loops the value t, so that it is never larger than length and never\n\
 * smaller than 0.\n\
 * @param {Number} a\n\
 * @param {Number} length\n\
 * @return {Number}\n\
 */\n\
Mth.repeat = function(t, length) {\n\
\treturn t - Math.floor(t / length) * length;\n\
};\n\
\n\
Mth.toDeg = function(rad) {\n\
\treturn rad * RAD2DEG;\n\
};\n\
\n\
Mth.toRad = function(deg) {\n\
\treturn deg * DEG2RAD;\n\
};\n\
\n\
Mth.normDeg = function(deg) {\n\
\tdeg %= 360;\n\
\treturn (deg * 360 < 0) ? deg + 360 : deg;\n\
};\n\
\n\
Mth.normRad = function(rad) {\n\
\trad %= TAU;\n\
\treturn (rad * TAU < 0) ? rad + TAU : rad;\n\
};\n\
\n\
Mth.distRad = function(a, b) {\n\
\tvar d = Mth.normRad(b) - Mth.normRad(a);\n\
\tif (d > PI) {\n\
\t\treturn d - TAU;\n\
\t}\n\
\tif (d <= -PI) {\n\
\t\treturn d + TAU;\n\
\t}\n\
\treturn d;\n\
};\n\
\n\
Mth.distDeg = function(a, b) {\n\
\tvar d = Mth.normDeg(b) - Mth.normDeg(a);\n\
\tif (d > 180) {\n\
\t\treturn d - 360;\n\
\t}\n\
\tif (d <= -180) {\n\
\t\treturn d + 360;\n\
\t}\n\
\treturn d;\n\
};\n\
\n\
/**\n\
 * Performs linear interpolation between values a and b.\n\
 * @param {Number} a\n\
 * @param {Number} b\n\
 * @param {Number} scalar The proportion between a and b.\n\
 * @return {Number} The interpolated value between a and b.\n\
 */\n\
Mth.lerp = function(a, b, scalar) {\n\
\treturn a + scalar * (b - a);\n\
};\n\
\n\
\n\
var dampResult = {\n\
\tvalue: 0,\n\
\tvelocity: 0\n\
};\n\
\n\
/**\n\
 * Gradually changes a value towards a desired goal over time.\n\
 *\n\
 * http://docs.unity3d.com/Documentation/ScriptReference/Mathf.SmoothDamp.html\n\
 * http://answers.unity3d.com/questions/24756/formula-behind-smoothdamp.html\n\
 */\n\
Mth.smoothDamp = function(a, b, velocity, time, maxVelocity, dt) {\n\
\ttime = Mth.max(EPSILON, time);\n\
\tdt = dt || 0.02;\n\
\tvar num = 2 / time;\n\
\tvar num2 = num * dt;\n\
\tvar num3 = 1 / (1 + num2 + 0.48 * num2 * num2 + 0.235 * num2 * num2 * num2);\n\
\tvar num4 = a - b;\n\
\tvar num5 = b;\n\
\tvar num6 = (maxVelocity || Number.POSITIVE_INFINITY) * time;\n\
\tnum4 = Mth.clamp(num4, -num6, num6);\n\
\tb = a - num4;\n\
\tvar num7 = (velocity + num * num4) * dt;\n\
\tvelocity = (velocity - num * num7) * num3;\n\
\tvar value = b + (num4 + num7) * num3;\n\
\tif (num5 - a > 0 == value > num5) {\n\
\t\tvalue = num5;\n\
\t\tvelocity = (value - num5) / dt;\n\
\t}\n\
\tdampResult.value = value;\n\
\tdampResult.velocity = velocity;\n\
\treturn dampResult;\n\
}\n\
\n\
/**\n\
 * Easing\n\
 */\n\
\n\
var powIn = function(strength) {\n\
\tif (strength == null) {\n\
\t\tstrength = 2;\n\
\t}\n\
\treturn function(t) {\n\
\t\treturn pow(t, strength);\n\
\t};\n\
};\n\
\n\
var toOut = function(fn) {\n\
\treturn function(t) {\n\
\t\treturn 1 - fn(1 - t);\n\
\t};\n\
};\n\
\n\
var toInOut = function(fn) {\n\
\treturn function(t) {\n\
\t\treturn (t < 0.5 ? fn(t * 2) : 2 - fn(2 * (1 - t))) / 2;\n\
\t};\n\
};\n\
\n\
Mth.linear = function(t) {\n\
\treturn t;\n\
};\n\
\n\
var transitions = ['quad', 'cubic', 'quart', 'quint'];\n\
for (var i = 0, l = transitions.length; i < l; i++) {\n\
\tvar transition = transitions[i];\n\
\tvar fn = powIn(i + 2);\n\
\tMth[transition + 'In'] = fn;\n\
\tMth[transition + 'Out'] = toOut(fn);\n\
\tMth[transition + 'InOut'] = toInOut(fn);\n\
}\n\
\n\
Mth.distAng = function(a, b) {\n\
\tif (a == b) {\n\
\t\treturn 0;\n\
\t}\n\
\tvar ab = (a < b);\n\
\tvar l = ab ? (-a - TAU + b) : (b - a);\n\
\tvar r = ab ? (b - a) : (TAU - a + b);\n\
\n\
\treturn (Math.abs(l) > Math.abs(r)) ? r : l;\n\
};\n\
\n\
/*\n\
 * Typed Array to use for vectors and matrix\n\
 */\n\
var ARRAY_TYPE = Mth.ARRAY_TYPE = window.Float32Array || function(arr) {\n\
\t\treturn arr;\n\
\t};\n\
\n\
/**\n\
 * Vec2\n\
 *\n\
 * @constructor\n\
 * Initialize from Vec2 array or x/y values. Returns a new (typed) array.\n\
 *\n\
 * @param {Number[]|Number} fromOrX Typed array to copy from or x\n\
 * @param {Number} y y, when x was provided as first argument\n\
 */\n\
var Vec2 = Mth.Vec2 = function(fromOrX, y) {\n\
\tif (y != null) {\n\
\t\treturn new ARRAY_TYPE([fromOrX, y]);\n\
\t}\n\
\tif (fromOrX != null) {\n\
\t\treturn new ARRAY_TYPE(fromOrX);\n\
\t}\n\
\treturn new ARRAY_TYPE(Vec2.zero);\n\
};\n\
\n\
Vec2.zero = Vec2.center = Vec2(0, 0);\n\
Vec2.cache = [Vec2(), Vec2(), Vec2(), Vec2(), Vec2()];\n\
Vec2.topLeft = Vec2(-1, -1);\n\
Vec2.topCenter = Vec2(0, -1);\n\
Vec2.topRight = Vec2(1, -1);\n\
Vec2.centerLeft = Vec2(-1, 0);\n\
Vec2.centerRight = Vec2(1, 0);\n\
Vec2.bottomLeft = Vec2(-1, 1);\n\
Vec2.bottomCenter = Vec2(0, 1);\n\
Vec2.bottomRight = Vec2(1, 1);\n\
\n\
\n\
\n\
Vec2.set = function(result, x, y) {\n\
\tresult[0] = x || 0;\n\
\tresult[1] = y || 0;\n\
\treturn result;\n\
};\n\
\n\
Vec2.copy = function(result, b) {\n\
\tb = b || Vec2.zero;\n\
\tresult[0] = b[0];\n\
\tresult[1] = b[1];\n\
\treturn result;\n\
};\n\
\n\
Vec2.valid = function(a) {\n\
\treturn !(isNaN(a[0]) || isNaN(a[1]));\n\
};\n\
\n\
Vec2.toString = function(a) {\n\
\treturn \"[\" + a[0] + \", \" + a[1] + \"]\";\n\
};\n\
\n\
var objVecCache = Vec2();\n\
\n\
Vec2.fromObj = function(obj, a) {\n\
\tif (!a) {\n\
\t\ta = objVecCache;\n\
\t}\n\
\ta[0] = obj.x;\n\
\ta[1] = obj.y;\n\
\treturn a;\n\
};\n\
\n\
var objCache = {\n\
\tx: 0,\n\
\ty: 0\n\
};\n\
Vec2.toObj = function(a, obj) {\n\
\tif (!obj) {\n\
\t\tobj = objCache;\n\
\t}\n\
\tobj.x = a[0];\n\
\tobj.y = a[1];\n\
\treturn obj;\n\
};\n\
\n\
Vec2.eq = function(a, b) {\n\
\treturn abs(a[0] - b[0]) < EPSILON && abs(a[1] - b[1]) < EPSILON;\n\
};\n\
\n\
Vec2.add = function(a, b, result) {\n\
\tif (!result) {\n\
\t\tresult = a;\n\
\t}\n\
\tresult[0] = a[0] + b[0];\n\
\tresult[1] = a[1] + b[1];\n\
\treturn result;\n\
};\n\
\n\
Vec2.sub = function(a, b, result) {\n\
\tif (!result) {\n\
\t\tresult = a;\n\
\t}\n\
\tresult[0] = a[0] - b[0];\n\
\tresult[1] = a[1] - b[1];\n\
\treturn result;\n\
};\n\
\n\
Vec2.mul = function(a, b, result) {\n\
\tif (!result) {\n\
\t\tresult = a;\n\
\t}\n\
\tresult[0] = a[0] * b[0];\n\
\tresult[1] = a[1] * b[1];\n\
\treturn result;\n\
};\n\
\n\
Vec2.scale = function(a, scalar, result) {\n\
\tif (!result) {\n\
\t\tresult = a;\n\
\t}\n\
\tresult[0] = a[0] * scalar;\n\
\tresult[1] = a[1] * scalar;\n\
\treturn result;\n\
};\n\
\n\
Vec2.norm = function(a, result, scalar) {\n\
\tif (!result) {\n\
\t\tresult = a;\n\
\t}\n\
\tvar x = a[0];\n\
\tvar y = a[1];\n\
\tvar len = (scalar || 1) / (sqrt(x * x + y * y) || 1);\n\
\tresult[0] = x * len;\n\
\tresult[1] = y * len;\n\
\treturn result;\n\
};\n\
\n\
Vec2.lenSq = function(a) {\n\
\treturn a[0] * a[0] + a[1] * a[1];\n\
};\n\
\n\
Vec2.len = function(a) {\n\
\treturn sqrt(a[0] * a[0] + a[1] * a[1]);\n\
};\n\
\n\
Vec2.dot = function(a, b) {\n\
\treturn a[0] * b[0] + a[1] * b[1];\n\
};\n\
\n\
Vec2.cross = function(a, b) {\n\
\treturn a[0] * b[1] - a[1] * b[0];\n\
};\n\
\n\
Vec2.lerp = function(a, b, scalar, result) {\n\
\tif (!result) {\n\
\t\tresult = a;\n\
\t}\n\
\tresult[0] = a[0] + scalar * (b[0] - a[0]);\n\
\tresult[1] = a[1] + scalar * (b[1] - a[1]);\n\
\treturn result;\n\
};\n\
\n\
Vec2.max = function(a, b, axis) {\n\
\tif (axis != null) {\n\
\t\treturn (a[axis] > b[axis]) ? a : b;\n\
\t}\n\
\treturn (Vec2.lenSq(a) > Vec2.lenSq(b)) ? a : b;\n\
};\n\
\n\
Vec2.perp = function(a, result) {\n\
\tif (!result) {\n\
\t\tresult = a;\n\
\t}\n\
\tvar x = a[0];\n\
\tresult[0] = a[1];\n\
\tresult[1] = -x;\n\
\treturn result;\n\
};\n\
\n\
Vec2.dist = function(a, b) {\n\
\tvar x = b[0] - a[0];\n\
\tvar y = b[1] - a[1];\n\
\treturn sqrt(x * x + y * y);\n\
};\n\
\n\
Vec2.distSq = function(a, b) {\n\
\tvar x = b[0] - a[0];\n\
\tvar y = b[1] - a[1];\n\
\treturn x * x + y * y;\n\
};\n\
\n\
Vec2.limit = function(a, max, result) {\n\
\tif (!result) {\n\
\t\tresult = a;\n\
\t}\n\
\tvar x = a[0];\n\
\tvar y = a[1];\n\
\tvar ratio = max / sqrt(x * x + y * y);\n\
\tif (ratio < 1) {\n\
\t\tresult[0] = x * ratio;\n\
\t\tresult[1] = y * ratio;\n\
\t} else if (result !== a) {\n\
\t\tresult[0] = x;\n\
\t\tresult[1] = y;\n\
\t}\n\
\treturn result;\n\
};\n\
\n\
var radCache = [Vec2(), Vec2()];\n\
\n\
Vec2.rad = function(a, b) {\n\
\tif (!b) {\n\
\t\treturn Mth.atan2(a[1], a[0]);\n\
\t}\n\
\treturn Mth.acos(\n\
\t\tVec2.dot(Vec2.norm(a, radCache[0]), Vec2.norm(b, radCache[1]))\n\
\t);\n\
};\n\
\n\
Vec2.rotate = function(a, theta, result) {\n\
\tif (!result) {\n\
\t\tresult = a;\n\
\t}\n\
\tvar sinA = Mth.sin(theta);\n\
\tvar cosA = Mth.cos(theta);\n\
\tvar x = a[0];\n\
\tvar y = a[1];\n\
\tresult[0] = x * cosA - y * sinA;\n\
\tresult[1] = x * sinA + y * cosA;\n\
\treturn result;\n\
};\n\
\n\
Vec2.rotateAxis = function(a, b, theta, result) {\n\
\treturn Vec2.add(\n\
\t\tVec2.rotate(\n\
\t\t\tVec2.sub(a, b, result || a),\n\
\t\t\ttheta\n\
\t\t),\n\
\t\tb\n\
\t);\n\
};\n\
\n\
Vec2.rotateTo = function(a, rad, result) {\n\
\tvar len = Vec2.len(a);\n\
\treturn Vec2.rotate(Vec2.set(a, len, 0), rad);\n\
};\n\
\n\
Vec2.lookAt = function(a, b, result) {\n\
\tvar len = Vec2.len(a);\n\
\treturn Vec2.norm(\n\
\t\tVec2.rotate(\n\
\t\t\ta,\n\
\t\t\tMth.atan2(b[0] - a[0], b[1] - a[1]) - Mth.atan2(a[1], a[0]), result || a\n\
\t\t),\n\
\t\tnull, len\n\
\t);\n\
};\n\
\n\
Vec2.variant = function(a, delta, result) {\n\
\tif (!result) {\n\
\t\tresult = a;\n\
\t}\n\
\tresult[0] = a[0] + Math.rand(-delta, delta);\n\
\tresult[1] = a[1] + Math.rand(-delta, delta);\n\
\treturn result;\n\
}\n\
\n\
Vec2.variantRad = function(a, dt, ease, result) {\n\
\treturn Vec2.rotate(a, Math.rand(-dt, dt, ease), result);\n\
};\n\
\n\
Vec2.variantLen = function(a, dt, ease, result) {\n\
\treturn Vec2.norm(a, result, Vec2.len(a) + Math.rand(-dt, dt, ease));\n\
};\n\
\n\
module.exports.Vec2 = Vec2;//@ sourceURL=acmejs/lib/core/math.js"
));
require.register("acmejs/lib/core/color.js", Function("exports, require, module",
"'use strict';\n\
\n\
require('./math');\n\
\n\
var ARRAY_TYPE = Math.ARRAY_TYPE;\n\
\n\
/**\n\
 * Color manipulation on typed arrays.\n\
 *\n\
 * @constructor\n\
 * Initialize from Color array or RGBA values.\n\
 *\n\
 * @param {Number[]|null} fromOrR Array or red-value\n\
 * @param {Number|null} g Green-value\n\
 * @param {Number|null} b Blue-value\n\
 * @param {Number|null} a Alpha-value\n\
 */\n\
function Color(fromOrR, g, b, a) {\n\
  if (g != null) {\n\
    return new ARRAY_TYPE([fromOrR, g, b, (a != null) ? a : 1]);\n\
  }\n\
  if (fromOrR != null) {\n\
    return new ARRAY_TYPE([fromOrR[0], fromOrR[1], fromOrR[2], (fromOrR[3] != null) ? fromOrR[3] : 1]);\n\
  }\n\
  return new ARRAY_TYPE(Color.black);\n\
}\n\
\n\
Color.white = Color(255, 255, 255);\n\
Color.black = Color(0, 0, 0);\n\
Color.gray = Color(128, 128, 128);\n\
Color.cache = [Color(), Color(), Color(), Color()];\n\
\n\
/**\n\
 * Set result from color values\n\
 *\n\
 * @static\n\
 *\n\
 * @param {Number[]} result Target\n\
 * @param {Number} r\n\
 * @param {Number} g\n\
 * @param {Number} b\n\
 * @param {Number} a\n\
 *\n\
 * @return {Number[]}\n\
 */\n\
Color.set = function(result, r, g, b, a) {\n\
  result[0] = r || 0;\n\
  result[1] = g || 0;\n\
  result[2] = b || 0;\n\
  result[3] = a || 0;\n\
  return result;\n\
};\n\
\n\
/**\n\
 * Copy to result from other color\n\
 *\n\
 * @static\n\
 *\n\
 * @param {Number[]} result Target\n\
 * @param {Number[]} b Source\n\
 *\n\
 * @return {Number[]}\n\
 */\n\
Color.copy = function(result, b) {\n\
  result.set(b || Color.black);\n\
  return result;\n\
};\n\
\n\
Color.lerp = function(a, b, t, alpha, result) {\n\
  if (!result) {\n\
    result = a;\n\
  }\n\
  result[0] = (1 - t) * a[0] + t * b[0];\n\
  result[1] = (1 - t) * a[1] + t * b[1];\n\
  result[2] = (1 - t) * a[2] + t * b[2];\n\
  if (alpha > 0.05) {\n\
    result[3] = (1 - t) * a[3] + t * b[3];\n\
  } else {\n\
    result[3] = a[3];\n\
  }\n\
  return result;\n\
};\n\
\n\
Color.lerpList = function(result, list, t, ease) {\n\
  var last = list.length - 1;\n\
  var t = Math.clamp(t * last, 0, last);\n\
  var start = t | 0;\n\
  var sub = (ease || Math.linear)(t - start);\n\
  if (sub < 0.02) {\n\
    return Color.copy(result, list[start]);\n\
  }\n\
  if (sub > 0.98) {\n\
    return Color.copy(result, list[start + 1]);\n\
  }\n\
  return Color.lerp(list[start], list[start + 1], sub, null, result);\n\
};\n\
\n\
Color.variant = function(a, t, result) {\n\
  t = Math.rand(-t, t);\n\
  return Color.lerp(a, (t > 0 ? Color.white : Color.black), t, false, result);\n\
};\n\
\n\
Color.rgba = function(a, alpha) {\n\
  if (!alpha) {\n\
    alpha = a[3];\n\
  }\n\
  if (alpha > 0.98) {\n\
    return \"rgb(\" + (a[0] | 0) + \", \" + (a[1] | 0) + \", \" + (a[2] | 0) + \")\";\n\
  } else {\n\
    return \"rgba(\" + (a[0] | 0) + \", \" + (a[1] | 0) + \", \" + (a[2] | 0) + \", \" + alpha + \")\";\n\
  }\n\
};\n\
\n\
module.exports = Color;\n\
//@ sourceURL=acmejs/lib/core/color.js"
));
require.register("acmejs/lib/core/pool.js", Function("exports, require, module",
"'use strict';\n\
\n\
require('./math');\n\
\n\
/**\n\
 * Pool\n\
 *\n\
 * @param {Object} cls Class to pool\n\
 */\n\
function Pool(cls) {\n\
\tthis.cls = cls;\n\
\tvar proto = cls.prototype;\n\
\tproto.pool = this;\n\
\tcls.pool = this;\n\
\tthis.heap = [];\n\
\tthis.enabled = false;\n\
\tthis.allocated = 0;\n\
\n\
\tif (!proto.type) {\n\
\t\tthrow new Error('No type provided.');\n\
\t}\n\
\tthis.type = proto.type;\n\
\tPool.byType[this.type] = this;\n\
\n\
\tvar pool = this;\n\
\tcls.create = function(parent, attributes) {\n\
\t\treturn pool.alloc(parent, attributes);\n\
\t};\n\
\n\
\tthis.attachable = (this.type !== 'entity' && !proto.light);\n\
\n\
\tif (this.attachable) {\n\
\t\tthis.layer = proto.layer || cls.layer || 0;\n\
\t\tthis.events = [];\n\
\t\tthis.calls = [];\n\
\n\
\t\tif ((this.attributes = proto.attributes || null)) {\n\
\t\t\tthis.attributeKeys = Object.keys(this.attributes);\n\
\t\t}\n\
\n\
\t\tvar types = Pool.typedCalls;\n\
\t\tvar keys = Object.keys(proto).concat(Object.keys(cls));\n\
\n\
\t\tvar fn = '';\n\
\t\tfor (var i = 0, l = keys.length; i < l; i++) {\n\
\t\t\tfn = keys[i];\n\
\t\t\tif (Pool.regxCall.test(fn)) {\n\
\t\t\t\tif (!~types.indexOf(fn)) {\n\
\t\t\t\t\ttypes.push(fn);\n\
\t\t\t\t\tPool.calls[fn] = [];\n\
\t\t\t\t}\n\
\t\t\t\tthis.events.push(fn);\n\
\t\t\t} else if (Pool.regxGetter.test(fn)) {\n\
\t\t\t\tvar key = fn.substr(3, 1).toLowerCase() + fn.substr(4);\n\
\t\t\t\tPool.defineGetter(proto, key, fn);\n\
\t\t\t} else if (Pool.regxSetter.test(fn)) {\n\
\t\t\t\tvar key = fn.substr(3, 1).toLowerCase() + fn.substr(4);\n\
\t\t\t\tPool.defineSetter(proto, key, fn);\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\tfor (i = 0, l = types.length; i < l; i++) {\n\
\t\t\tfn = types[i];\n\
\t\t\tif (fn in cls) {\n\
\t\t\t\tthis[fn] = cls[fn];\n\
\t\t\t\tPool.calls[fn].push(this);\n\
\t\t\t} else if (fn in proto) {\n\
\t\t\t\tthis.calls.push(fn);\n\
\t\t\t}\n\
\t\t}\n\
\t}\n\
}\n\
\n\
Pool.prototype = {\n\
\n\
\t/**\n\
\t * Brief summary.\n\
\t *\n\
\t * @return {String}\n\
\t */\n\
\ttoString: function() {\n\
\t\treturn \"Pool \" + this.type +\n\
\t\t\t\" [\" + this.allocated + \" / \" + this.heap.length + \"]\";\n\
\t},\n\
\n\
\t/**\n\
\t * Fill pool with deallocd instances.\n\
\t *\n\
\t * @private\n\
\t *\n\
\t * @param {Number} amount Amount of objects to instanziate.\n\
\t */\n\
\tfill: function(amount) {\n\
\t\twhile (amount--) {\n\
\t\t\tthis.newInstance();\n\
\t\t}\n\
\t},\n\
\n\
\tnewInstance: function() {\n\
\t\tvar entity = new this.cls();\n\
\t\tentity.enabled = false;\n\
\t\tentity.allocated = false;\n\
\t\tthis.heap.push(entity);\n\
\n\
\t\tvar calls = this.calls;\n\
\t\tif (calls) {\n\
\t\t\tfor (var i = 0, l = calls.length; i < l; i++) {\n\
\t\t\t\tPool.calls[calls[i]].push(entity);\n\
\t\t\t}\n\
\t\t}\n\
\t\treturn entity;\n\
\t},\n\
\n\
\t/**\n\
\t * Allocate a new instance from dealloc pool or by creating.\n\
\t *\n\
\t * The provided attributes are merged with the default attributes.\n\
\t *\n\
\t * @param {Entity} parent (optional) Parent class\n\
\t * @param {Object} attributes (optional) Attributes object\n\
\t *\n\
\t * @return {Object}\n\
\t */\n\
\talloc: function(parent, attributes) {\n\
\t\t// Get dealloc or create new entity\n\
\t\tvar entity = null;\n\
\t\tvar heap = this.heap;\n\
\t\tvar i = heap.length;\n\
\t\twhile (i--) {\n\
\t\t\tif (!heap[i].allocated) {\n\
\t\t\t\tentity = heap[i];\n\
\t\t\t\tbreak;\n\
\t\t\t}\n\
\t\t}\n\
\t\tif (!entity) {\n\
\t\t\tentity = this.newInstance();\n\
\t\t}\n\
\n\
\t\tvar defaults = null;\n\
\t\tthis.allocated++;\n\
\t\tthis.enabled = true;\n\
\t\tvar uid = entity.uid = Math.uid();\n\
\t\tentity.enabled = true;\n\
\t\tentity.allocated = true;\n\
\t\tentity.parent = parent || null;\n\
\t\tentity.root = parent && parent.root || parent || entity;\n\
\n\
\t\tif (this.attachable) {\n\
\t\t\t// Set layer, combined from parent layer, pool layer and uid\n\
\t\t\tentity.layer = (parent && parent.layer || 0) + this.layer + 2 - 1 / uid;\n\
\n\
\t\t\t// Prepare sorting if needed\n\
\t\t\tvar calls = this.calls;\n\
\t\t\tfor (var i = 0, l = calls.length; i < l; i++) {\n\
\t\t\t\tvar call = calls[i];\n\
\t\t\t\tif (Pool.sorted[call] != null) {\n\
\t\t\t\t\tPool.sorted[call] = true;\n\
\t\t\t\t}\n\
\t\t\t}\n\
\n\
\t\t\t// Merge defaults with new attributes\n\
\t\t\tdefaults = this.attributes;\n\
\t\t\tif (defaults) {\n\
\t\t\t\tif (attributes && !attributes._merged) {\n\
\t\t\t\t\tif (attributes.__proto__) {\n\
\t\t\t\t\t\tattributes.__proto__ = defaults;\n\
\t\t\t\t\t} else {\n\
\t\t\t\t\t\tvar attributeKeys = this.attributeKeys;\n\
\t\t\t\t\t\tfor (i = 0, l = attributeKeys.length; i < l; i++) {\n\
\t\t\t\t\t\t\tvar key = attributeKeys[i];\n\
\t\t\t\t\t\t\tif (!(key in attributes)) {\n\
\t\t\t\t\t\t\t\tattributes[key] = defaults[key];\n\
\t\t\t\t\t\t\t}\n\
\t\t\t\t\t\t}\n\
\t\t\t\t\t}\n\
\t\t\t\t\tattributes._merged = true;\n\
\t\t\t\t}\n\
\t\t\t}\n\
\n\
\t\t\t// Add events\n\
\t\t\tvar events = this.events;\n\
\t\t\tfor (i = 0, l = events.length; i < l; i++) {\n\
\t\t\t\tparent.on(entity, events[i]);\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\tentity.alloc(attributes || defaults || null);\n\
\n\
\t\treturn entity;\n\
\t},\n\
\n\
\t/**\n\
\t * Destroy given instance.\n\
\t *\n\
\t * @private\n\
\t *\n\
\t * @param {Object} entity Pooled object\n\
\t */\n\
\tdestroy: function(entity) {\n\
\t\tentity.enabled = false;\n\
\t\tPool.calls.dealloc.push(entity);\n\
\t},\n\
\n\
\t/**\n\
\t * Free destroyed object.\n\
\t *\n\
\t * @param {Object} entity Pooled object\n\
\t */\n\
\tdealloc: function(entity) {\n\
\t\tentity.allocated = false;\n\
\t\tentity.uid = null;\n\
\t\tentity.root = null;\n\
\t\tentity.parent = null;\n\
\t\tthis.enabled = (this.allocated--) > 1;\n\
\t},\n\
\n\
\t/**\n\
\t * Invoke method on all enabled pooled object instances.\n\
\t *\n\
\t * @param {String} fn Method name\n\
\t * @param {Mixed} args (optional) Argument(s)\n\
\t */\n\
\tcall: function(fn, args) {\n\
\t\tvar stack = this.heap;\n\
\t\tvar i = this.heap.length;\n\
\t\twhile (i--) {\n\
\t\t\tif (stack[i].enabled) {\n\
\t\t\t\tstack[i][fn](args);\n\
\t\t\t}\n\
\t\t}\n\
\t}\n\
\n\
};\n\
\n\
Pool.typedCalls = [\n\
\t'fixedUpdate',\n\
\t'simulate',\n\
\t'update',\n\
\t'postUpdate',\n\
\t'preRender',\n\
\t'render'\n\
];\n\
\n\
// Create call array\n\
Pool.calls = {dealloc: []};\n\
for (var i = 0, l = Pool.typedCalls.length; i < l; i++) {\n\
\tPool.calls[Pool.typedCalls[i]] = [];\n\
}\n\
\n\
Pool.regxCall = /^on[A-Z]/;\n\
Pool.regxGetter = /^get[A-Z]/;\n\
Pool.regxSetter = /^set[A-Z]/;\n\
Pool.byType = {};\n\
Pool.sorted = {\n\
\trender: false\n\
};\n\
\n\
/**\n\
 * Dump debugging details and optionally flush dealloc objects.\n\
 *\n\
 * @param {Boolean} flush (optional) Flush after debug.\n\
 */\n\
Pool.dump = function(flush) {\n\
\tvar byType = Pool.byType;\n\
\tfor (var type in byType) {\n\
\t\tvar pool = byType[type];\n\
\t\tconsole.log(\"%s: %d/%d in use\", type, pool.allocated, pool.heap.length);\n\
\t}\n\
\tif (flush) {\n\
\t\tPool.flush();\n\
\t}\n\
};\n\
\n\
Pool.defineGetter = function(proto, key, fn) {\n\
\tObject.defineProperty(proto, key, {\n\
\t\tget: proto[fn],\n\
\t\tenumerable: true,\n\
\t\tconfigurable: true\n\
\t});\n\
};\n\
\n\
Pool.defineSetter = function(proto, key, fn) {\n\
\tObject.defineProperty(proto, key, {\n\
\t\tset: proto[fn],\n\
\t\tenumerable: true,\n\
\t\tconfigurable: true\n\
\t});\n\
};\n\
\n\
Pool.dealloc = function() {\n\
\tvar stack = this.calls.dealloc;\n\
\tfor (var i = 0, l = stack.length; i < l; i++) {\n\
\t\tstack[i].dealloc();\n\
\t}\n\
\tstack.length = 0;\n\
};\n\
\n\
Pool.flush = function() {\n\
\tvar byType = Pool.byType;\n\
\tfor (var type in byType) {\n\
\t\tvar dealloced = 0;\n\
\t\tvar heap = byType[type].heap;\n\
\t\tvar i = heap.length;\n\
\t\twhile (i--) {\n\
\t\t\tif (heap[i].allocated) {\n\
\t\t\t\tcontinue;\n\
\t\t\t}\n\
\t\t\theap.splice(i, 1);\n\
\t\t\tdealloced++;\n\
\t\t}\n\
\t\tconsole.log(\"%s: %d/%d flushed\", type, dealloced, heap.length);\n\
\t}\n\
};\n\
\n\
Pool.call = function(fn, arg) {\n\
\tvar stack = this.calls[fn];\n\
\tvar i = stack.length;\n\
\tif (!i) {\n\
\t\treturn;\n\
\t}\n\
\tif (Pool.sorted[fn]) {\n\
\t\tstack.sort(Pool.sortFn);\n\
\t\tPool.sorted[fn] = false;\n\
\t}\n\
\twhile (i--) {\n\
\t\tif (stack[i].enabled) {\n\
\t\t\tstack[i][fn](arg);\n\
\t\t}\n\
\t}\n\
};\n\
\n\
Pool.sortFn = function(a, b) {\n\
\treturn b.layer - a.layer;\n\
};\n\
\n\
module.exports = Pool;\n\
//@ sourceURL=acmejs/lib/core/pool.js"
));
require.register("acmejs/lib/core/engine.js", Function("exports, require, module",
"'use strict';\n\
\n\
var Entity = require('./entity');\n\
var Pool = require('./pool');\n\
var raFrame = require('raf');\n\
\n\
/**\n\
 * @class Engine\n\
 * Managing renderer, scene and loop\n\
 *\n\
 * @extends Entity\n\
 */\n\
function Engine() {\n\
\tEntity.call(this);\n\
}\n\
\n\
Engine.prototype = Object.create(Entity.prototype);\n\
\n\
Engine.prototype.type = 'engine';\n\
\n\
Engine.prototype.init = function(element) {\n\
\tthis.element = element;\n\
\n\
\tthis.time = 0.0;\n\
\tthis.lastTime = 0.0;\n\
\tthis.frame = 0;\n\
\tthis.tail = 0.0;\n\
\tthis.fdt = 1 / 30;\n\
\tthis.minDt = 1 / 60;\n\
\tthis.maxDt = 0.5;\n\
\tthis.maxFdt = this.fdt * 5;\n\
\tthis.scale = 1;\n\
\n\
\tthis.debug = {\n\
\t\tprofile: 0,\n\
\t\tstep: false,\n\
\t\ttime: true\n\
\t};\n\
\tthis.samples = {\n\
\t\tdt: 0,\n\
\t\tlag: 0,\n\
\t\ttick: 0,\n\
\t\tfixedUpdate: 0,\n\
\t\tupdate: 0,\n\
\t\trender: 0\n\
\t};\n\
\n\
\t// Late require. TODO: Justify!\n\
\trequire('./console');\n\
\tthis.createComponent('console');\n\
\n\
\trequire('./input');\n\
\tthis.createComponent('input');\n\
\n\
\tvar engine = this;\n\
\tthis.tickBound = function Engine_tick(now) {\n\
\t\treturn engine.tick(now);\n\
\t};\n\
};\n\
\n\
/**\n\
 * Set scene and start game loop\n\
 *\n\
 * @param {Entity} Scene\n\
 */\n\
Engine.prototype.play = function(scene) {\n\
\tthis.scene = scene;\n\
\tthis.start();\n\
};\n\
\n\
/**\n\
 * Start loop\n\
 */\n\
Engine.prototype.start = function() {\n\
\tif (this.running) {\n\
\t\treturn;\n\
\t}\n\
\tthis.running = true;\n\
\traFrame(this.tickBound);\n\
};\n\
\n\
/**\n\
 * Game loop tick, called by requestAnimationFrame\n\
 *\n\
 * @param {Number} Delta time\n\
 */\n\
Engine.prototype.tick = function(time) {\n\
\t// Time value in seconds\n\
\ttime = (time && time < 1e12 ? time : perf.now()) / 1000;\n\
\tthis.time = time;\n\
\n\
\tif (this.running) {\n\
\t\traFrame(this.tickBound);\n\
\t}\n\
\n\
\tvar debug = this.debug;\n\
\tvar samples = this.samples;\n\
\tvar fdt = this.fdt;\n\
\n\
\tif (this.lastTime) {\n\
\t\tvar dt = time - this.lastTime;\n\
\t\tif (dt > this.maxDt) {\n\
\t\t\tdt = this.minDt;\n\
\t\t} else if (dt > 0.01) {\n\
\t\t\tsamples.dt = dt;\n\
\t\t\tvar lag = time - samples.next;\n\
\t\t\tif (lag > 0) {\n\
\t\t\t\tsamples.lag = lag * 1000;\n\
\t\t\t}\n\
\t\t}\n\
\t\tthis.dt = (dt *= this.scale);\n\
\t\tthis.frame++;\n\
\n\
\t\tif (debug.profile && !debug.profileFrom) {\n\
\t\t\tdebug.profileFrom = debug.profile;\n\
\t\t\tconsole.profile(\"Frame \" + debug.profileFrom);\n\
\t\t}\n\
\n\
\t\tvar ping = perf.now();\n\
\t\tvar pingTick = ping;\n\
\n\
\t\t// Invoke fixed updates\n\
\t\tvar tail = Math.min(this.tail + dt, this.maxFdt * this.scale);\n\
\t\twhile (tail >= fdt) {\n\
\t\t\ttail -= fdt;\n\
\t\t\tPool.call('fixedUpdate', fdt);\n\
\t\t\tPool.call('simulate', fdt);\n\
\t\t}\n\
\t\tthis.tail = tail;\n\
\n\
\t\tvar pong = perf.now();\n\
\t\tsamples.fixedUpdate = pong - ping;\n\
\t\tping = pong;\n\
\n\
\t\t// Invoke update\n\
\t\tPool.call('update', dt);\n\
\n\
\t\tPool.dealloc();\n\
\n\
\t\tPool.call('postUpdate', dt);\n\
\n\
\t\tpong = perf.now();\n\
\t\tsamples.update = pong - ping;\n\
\t\tping = pong;\n\
\n\
\t\t// Invoke render\n\
\t\tPool.call('preRender', dt);\n\
\n\
\t\tvar ctx = this.renderer.save();\n\
\t\tPool.call('render', ctx);\n\
\t\tthis.renderer.restore();\n\
\n\
\t\tpong = perf.now();\n\
\t\tsamples.render = pong - ping;\n\
\t\tsamples.tick = pong - pingTick;\n\
\n\
\t\tif (debug.step) {\n\
\t\t\t// debugger;\n\
\t\t}\n\
\t\tif (debug.profileFrom) {\n\
\t\t\tif (!--debug.profile) {\n\
\t\t\t\tconsole.profileEnd(\"Frame \" + debug.profileFrom);\n\
\t\t\t\tdebug.profileFrom = 0;\n\
\t\t\t}\n\
\t\t}\n\
\t}\n\
\n\
\tthis.lastTime = time;\n\
\tsamples.next = Math.max(time + 1 / 60, perf.now() / 1000);\n\
\n\
\tthis.trigger('onTimeEnd', samples);\n\
};\n\
\n\
var engine = new Engine();\n\
\n\
\n\
// Debugging hooks\n\
if ('console' in window) {\n\
\tconsole.m = {\n\
\t\tpool: function(flush) {\n\
\t\t\tPool.dump(flush);\n\
\t\t\treturn null;\n\
\t\t},\n\
\t\tprofile: function(frames) {\n\
\t\t\tif (frames == null) {\n\
\t\t\t\tframes = 60;\n\
\t\t\t}\n\
\t\t\tengine.debug.profile = frames;\n\
\t\t\treturn null;\n\
\t\t},\n\
\t\tstep: function() {\n\
\t\t\tengine.debug.step = !engine.debug.step;\n\
\t\t\treturn null;\n\
\t\t}\n\
\t};\n\
}\n\
\n\
var perf = window.performance || {};\n\
perf.now = perf.now || perf.webkitNow || perf.msNow || perf.mozNow || Date.now;\n\
\n\
module.exports = engine;\n\
//@ sourceURL=acmejs/lib/core/engine.js"
));
require.register("acmejs/lib/core/entity.js", Function("exports, require, module",
"'use strict';\n\
\n\
var Pool = require('./pool');\n\
\n\
/**\n\
 * @class Entity\n\
 * Entities are containers that have components attached and act as event hub.\n\
 * With parent and children, they can be organized into a hierachy\n\
 *\n\
 * @abstract\n\
 * @property {Boolean} enabled False when disabled or not allocated. Never act on disabled components!\n\
 * @property {Entity|null} parent Parent entity\n\
 * @property {Entity|null} root Scene entity\n\
 * @property {Number} layer Z-index\n\
 */\n\
function Entity() {\n\
\tthis.children = {};\n\
\tthis.components = {};\n\
\tthis.events = {};\n\
\tthis.eventRefs = [];\n\
}\n\
\n\
Entity.prototype = {\n\
\n\
\ttype: 'entity',\n\
\n\
\t/**\n\
\t * Brief summary\n\
\t *\n\
\t * @private\n\
\t * @return {String}\n\
\t */\n\
\ttoString: function() {\n\
\t\tvar comps = Object.keys(this.components).join(', ');\n\
\t\treturn 'Entity ' + (this.id || '') + '#' + this.uid +\n\
\t\t\t' (' + comps + ') [^ ' + this.parent + ']';\n\
\t},\n\
\n\
\t/**\n\
\t * Allocates entity from component/attribute hash\n\
\t *\n\
\t * @private\n\
\t * @param {Object} attributes List of components and their attributes\n\
\t * @return {Entity}\n\
\t */\n\
\talloc: function(attributes) {\n\
\t\tif (this.parent) {\n\
\t\t\tthis.parent.children[this.uid] = this;\n\
\t\t}\n\
\n\
\t\tif (attributes) {\n\
\t\t\tfor (var key in attributes) {\n\
\t\t\t\tvar attribute = attributes[key];\n\
\t\t\t\tswitch (key) {\n\
\t\t\t\t\tcase 'id':\n\
\t\t\t\t\t\tthis.id = attribute;\n\
\t\t\t\t\t\tbreak;\n\
\t\t\t\t\tdefault:\n\
\t\t\t\t\t\tif (!this.createComponent(key, attribute)) {\n\
\t\t\t\t\t\t\tthrow new Error('Unknown attribute key \"' + key +\n\
\t\t\t\t\t\t\t\t'\", expected component. ' + this);\n\
\t\t\t\t\t\t}\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t}\n\
\t},\n\
\n\
\t/**\n\
\t * Add {@link Component} to Entity\n\
\t *\n\
\t * @param {String} type Component type\n\
\t * @param  {Object} attributes (optional) Override component attributes\n\
\t * @return {Component}\n\
\t */\n\
\tcreateComponent: function(type, attributes) {\n\
\t\tvar pool = Pool.byType[type];\n\
\t\tif (!pool) {\n\
\t\t\treturn null;\n\
\t\t}\n\
\t\treturn pool.alloc(this, attributes);\n\
\t},\n\
\n\
\t/**\n\
\t * Add new Entity as child\n\
\t *\n\
\t * @param {String|Object} {@link Prefab} ID or prefab attribute object\n\
\t * @param {Object} attributes (optional) Override {@link Prefab} attributes\n\
\t * @return {Entity}\n\
\t */\n\
\tcreateChild: function(prefabId, attributes) {\n\
\t\tif (typeof prefabId === 'string') {\n\
\t\t\treturn Prefab.create(prefabId, this, attributes);\n\
\t\t}\n\
\t\treturn Entity.create(this, prefabId);\n\
\t},\n\
\n\
\t/**\n\
\t * Destroy Entity, including children and components.\n\
\t */\n\
\tdestroy: function() {\n\
\t\tthis.pool.destroy(this);\n\
\t\tfor (var key in this.components) {\n\
\t\t\tthis.components[key].destroy();\n\
\t\t}\n\
\t\tfor (key in this.children) {\n\
\t\t\tthis.children[key].destroy();\n\
\t\t}\n\
\t},\n\
\n\
\t/**\n\
\t * Free destroyed Entity.\n\
\t *\n\
\t * @private\n\
\t */\n\
\tdealloc: function() {\n\
\t\t// Remove referenced eventscribers\n\
\t\tvar eventRefs = this.eventRefs;\n\
\t\tfor (var i = 0, l = eventRefs.length; i < l; i++) {\n\
\t\t\teventRefs[i].off(this);\n\
\t\t}\n\
\t\teventRefs.length = 0;\n\
\n\
\t\t// Remove own eventscribers\n\
\t\tvar events = this.events;\n\
\t\tfor (var event in events) {\n\
\t\t\tevents[event].length = 0;\n\
\t\t}\n\
\t\tif (this.parent) {\n\
\t\t\tdelete this.parent.children[this.uid];\n\
\t\t}\n\
\t\tthis.pool.dealloc(this);\n\
\t},\n\
\n\
\t/**\n\
\t * Match Entity against a list of {@link Component} types.\n\
\t *\n\
\t * @param {Array|String} selector {@link Component} type(s)\n\
\t * @return {Boolean}\n\
\t */\n\
\tmatch: function(selector) {\n\
\t\tvar components = this.components;\n\
\t\tif (Array.isArray(selector)) {\n\
\t\t\tfor (var i = 0, l = selector.length; i < l; i++) {\n\
\t\t\t\tif (components[selector[i]]) {\n\
\t\t\t\t\treturn true;\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t} else if (components[selector]) {\n\
\t\t\treturn true;\n\
\t\t}\n\
\t\treturn false;\n\
\t},\n\
\n\
\tenable: function(state, deep) {\n\
\t\tif (state == null) {\n\
\t\t\tstate = !this.state;\n\
\t\t}\n\
\t\tthis.enabled = state;\n\
\t\tthis.parent.trigger((state ? 'onEnable' : 'onDisable'), this);\n\
\t\tfor (var key in this.components) {\n\
\t\t\tthis.components[key].enable(state, true);\n\
\t\t}\n\
\t\tif (deep) {\n\
\t\t\tfor (var key in this.children) {\n\
\t\t\t\tthis.children[key].enable(state, true);\n\
\t\t\t}\n\
\t\t}\n\
\t},\n\
\n\
\t/**\n\
\t * Subscribe to event messages\n\
\t *\n\
\t * @param {Entity|null} scope Target Entity for eventscription\n\
\t * @param {String} event Event name to eventscribe to 'on*'\n\
\t * @param {String} method (optional) Local method name to call, defaults to event name\n\
\t */\n\
\ton: function(scope, event, method) {\n\
\t\tif (scope == null) {\n\
\t\t\tscope = this;\n\
\t\t}\n\
\t\tvar events = this.events;\n\
\t\tvar items = (events[event] || (events[event] = []));\n\
\t\titems.push(scope, method);\n\
\t\tif (scope !== this) {\n\
\t\t\tvar refs = (scope.eventRefs || (scope.eventRefs = []));\n\
\t\t\trefs.push(this);\n\
\t\t}\n\
\t},\n\
\n\
\t/**\n\
\t * Publish a event message only for this entity\n\
\t *\n\
\t * @param {String} event\n\
\t * @param {Mixed} args (optional) Argument(s)\n\
\t *\n\
\t * @return {undefined|Boolean} Only false if one eventsciber returned false\n\
\t */\n\
\ttrigger: function(event, args) {\n\
\t\tvar items = this.events[event], i = 0;\n\
\t\tif (items && (i = items.length)) {\n\
\t\t\tvar scope;\n\
\t\t\twhile ((scope = items[i -= 2])) {\n\
\t\t\t\tif (scope.enabled && scope[items[i + 1] || event](args) === false) {\n\
\t\t\t\t\treturn false;\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t}\n\
\t},\n\
\n\
\t/**\n\
\t * Publish a event message for this entity and it's parents\n\
\t *\n\
\t * @param {String} event\n\
\t * {Mixed} args (optional) Argument(s)\n\
\t *\n\
\t * @return {undefined|Boolean} Only false if one eventsciber returned false\n\
\t */\n\
\ttriggerUp: function(event, args) {\n\
\t\tvar entity = this;\n\
\t\tdo {\n\
\t\t\tif (entity.enabled && entity.trigger(event, args) === false) {\n\
\t\t\t\treturn false;\n\
\t\t\t}\n\
\t\t} while (entity = entity.parent);\n\
\t},\n\
\n\
\t/**\n\
\t * Publish a event message for all eventscribed entities\n\
\t *\n\
\t * @param {String} event\n\
\t * @param {Mixed} args (optional) Argument(s)\n\
\t */\n\
\ttriggerAll: function(event, args) {\n\
\t\treturn Pool.call(event, args);\n\
\t},\n\
\n\
\t/**\n\
\t * Uneventscribe scope from event\n\
\t *\n\
\t * @param {Entity|Component} unscope (optional) Subscriber scope to remove\n\
\t * @param {String|null} unevent (optional) Event to remove\n\
\t */\n\
\toff: function(unscope, unevent) {\n\
\t\tvar events = this.events, i = 0;\n\
\t\tfor (var event in events) {\n\
\t\t\tif (unevent && unevent === event) {\n\
\t\t\t\tcontinue;\n\
\t\t\t}\n\
\t\t\tvar items = events[event];\n\
\t\t\tif (!items || !(i = items.length)) {\n\
\t\t\t\tcontinue;\n\
\t\t\t}\n\
\t\t\tvar length = i / 2, scope;\n\
\t\t\twhile ((i -= 2) >= 0) {\n\
\t\t\t\tif ((scope = items[i]) && (!unscope || unscope === scope)) {\n\
\t\t\t\t\titems[i] = null;\n\
\t\t\t\t\tlength--;\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t\tif (length === 0) {\n\
\t\t\t\titems.length = 0;\n\
\t\t\t}\n\
\t\t}\n\
\t}\n\
\n\
};\n\
\n\
new Pool(Entity);\n\
\n\
/**\n\
 * @class Prefab\n\
 *\n\
 * @constructor\n\
 * @param {String} id Prefab Id\n\
 * @param {Object} attributes Default attributes\n\
 */\n\
function Prefab(id, attributes) {\n\
\tif (!attributes) {\n\
\t\tattributes = id;\n\
\t\tid = null;\n\
\t}\n\
\tthis.id = id || attributes.id || Math.uid();\n\
\tthis.attributes = attributes;\n\
\tthis.attributeKeys = Object.keys(attributes);\n\
\tfor (var key in attributes) {\n\
\t\tif (!attributes[key]) {\n\
\t\t\tattributes[key] = {};\n\
\t\t}\n\
\t}\n\
\tPrefab.byId[this.id] = this;\n\
}\n\
\n\
Prefab.byId = {};\n\
\n\
/**\n\
 * Allocate Prefab by Id\n\
 *\n\
 * @static\n\
 * @param {String} id Prefab Id\n\
 * @param {Entity} parent Parent entity\n\
 * @param {Object} attributes Override attributes\n\
 * @return {Entity}\n\
 */\n\
Prefab.create = function(id, parent, attributes) {\n\
\tvar prefab = Prefab.byId[id];\n\
\tif (!prefab) {\n\
\t\tthrow new Error('Prefab \"' + id + '\" not found.');\n\
\t}\n\
\treturn prefab.create(parent, attributes);\n\
};\n\
\n\
Prefab.prototype = {\n\
\n\
\t/**\n\
\t * Allocate {@link Entity} from Prefab\n\
\t *\n\
\t * @param {Entity} parent Parent entity\n\
\t * @param {Object} attributes Override prefab attributes\n\
\t * @return {Entity}\n\
\t */\n\
\tcreate: function(parent, attributes) {\n\
\t\tvar defaults = this.attributes;\n\
\t\tif (attributes) {\n\
\t\t\tvar keys = this.attributeKeys;\n\
\t\t\tfor (var i = 0, l = keys.length; i < l; i++) {\n\
\t\t\t\tvar key = keys[i];\n\
\t\t\t\tvar value = defaults[key];\n\
\t\t\t\tif (!attributes[key]) {\n\
\t\t\t\t\tattributes[key] = value;\n\
\t\t\t\t} else {\n\
\t\t\t\t\tvar subPresets = attributes[key];\n\
\t\t\t\t\tif (typeof value === 'object') {\n\
\t\t\t\t\t\t// Evaluate use of: __proto__\n\
\t\t\t\t\t\tfor (var subKey in value) {\n\
\t\t\t\t\t\t\tif (!(subKey in subPresets)) {\n\
\t\t\t\t\t\t\t\tsubPresets[subKey] = value[subKey];\n\
\t\t\t\t\t\t\t}\n\
\t\t\t\t\t\t}\n\
\t\t\t\t\t}\n\
\t\t\t\t\t// Move to last position\n\
\t\t\t\t\t// TODO: Only when needed!\n\
\t\t\t\t\tdelete attributes[key];\n\
\t\t\t\t\tattributes[key] = subPresets;\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t}\n\
\t\treturn Entity.create(parent, attributes || defaults);\n\
\t}\n\
\n\
};\n\
\n\
Entity.Prefab = Prefab;\n\
\n\
module.exports = Entity;\n\
//@ sourceURL=acmejs/lib/core/entity.js"
));
require.register("acmejs/lib/core/component.js", Function("exports, require, module",
"'use strict';\n\
\n\
var Pool = require('./pool');\n\
\n\
/**\n\
 * @class Component\n\
 * Encapsulated behaviours that can be attached to entities.\n\
 *\n\
 * @abstract\n\
 * @property {Boolean} enabled False when disabled or not allocated. Never act on disabled components!\n\
 * @property {Entity} parent Container entity\n\
 * @property {Entity} root Scene entity\n\
 * @property {Number} layer Z-index\n\
 */\n\
\n\
function Component(type, cls) {\n\
\tif (!type) {\n\
\t\treturn null;\n\
\t}\n\
\n\
\tvar props = {\n\
\t\ttype: {\n\
\t\t\tvalue: type,\n\
\t\t\twritable: false,\n\
\t\t\tenumerable: false\n\
\t\t}\n\
\t};\n\
\tvar proto = cls.prototype;\n\
\tfor (var key in proto) {\n\
\t\tvar prop = Object.getOwnPropertyDescriptor(proto, key);\n\
\t\tprops[key] = prop;\n\
\t}\n\
\tcls.prototype = Object.create(Component.prototype, props);\n\
\tnew Pool(cls);\n\
\treturn null;\n\
}\n\
\n\
Component.prototype = {\n\
\n\
\ttype: 'component',\n\
\n\
\t/**\n\
\t * Brief summary.\n\
\t *\n\
\t * @private\n\
\t * @return {String}\n\
\t */\n\
\ttoString: function() {\n\
\t\treturn \"Component \" + this.type + \"#\" + this.uid +\n\
\t\t\t\" [^ \" + this.entity + \"]\";\n\
\t},\n\
\n\
\t/**\n\
\t * Allocate Component overriding default attributes.\n\
\t *\n\
\t * @private\n\
\t * @param {Object} attributes Attributes\n\
\t * @return {Component}\n\
\t */\n\
\talloc: function(attributes) {\n\
\t\tvar entity = this.entity = this.parent;\n\
\t\tentity.components[this.type] = this;\n\
\t\tentity[this.type] = this;\n\
\n\
\t\tvar components = entity.components;\n\
\t\tfor (var type in components) {\n\
\t\t\tif (type === this.type) {\n\
\t\t\t\tcontinue;\n\
\t\t\t}\n\
\t\t\tthis[type] = components[type];\n\
\t\t\tcomponents[type][this.type] = this;\n\
\t\t}\n\
\n\
\t\tif (this.create) {\n\
\t\t\tthis.create(attributes);\n\
\t\t}\n\
\t},\n\
\n\
\t/**\n\
\t * Destroy Component, removes it from {@link Entity}.\n\
\t */\n\
\tdestroy: function() {\n\
\t\tthis.pool.destroy(this);\n\
\t},\n\
\n\
\t/**\n\
\t * Free destroyed Component.\n\
\t *\n\
\t * @private\n\
\t */\n\
\tdealloc: function() {\n\
\t\tdelete this.entity.components[this.type];\n\
\t\tthis.entity[this.type] = null;\n\
\n\
\t\tvar components = this.entity.components;\n\
\t\tfor (var type in components) {\n\
\t\t\tif (type === this.type) {\n\
\t\t\t\tcontinue;\n\
\t\t\t}\n\
\t\t\tthis[components[type].type] = null;\n\
\t\t\tcomponents[type][this.type] = null;\n\
\t\t}\n\
\t\tthis.entity = null;\n\
\t\tthis.pool.dealloc(this);\n\
\t},\n\
\n\
\tenable: function(state, silent) {\n\
\t\tif (state == null) {\n\
\t\t\tstate = !this.state;\n\
\t\t}\n\
\t\tthis.enabled = state;\n\
\t\tif (silent) {\n\
\t\t\tthis.entity.trigger('onComponent' + (state ? 'Enable' : 'Disable'), this);\n\
\t\t}\n\
\t}\n\
\n\
};\n\
\n\
module.exports = Component;//@ sourceURL=acmejs/lib/core/component.js"
));
require.register("acmejs/lib/core/renderer.js", Function("exports, require, module",
"'use strict';\n\
\n\
var Entity = require('./entity');\n\
var Bounds = require('./bounds');\n\
var Vec2 = require('./math').Vec2;\n\
var Color = require('./color');\n\
\n\
\n\
function Renderer(element, size) {\n\
  this.element = element || document.body;\n\
  this.size = Vec2(size);\n\
  this.color = Color.white;\n\
  this.content = Vec2(size);\n\
  this.browser = Vec2();\n\
  this.margin = Vec2();\n\
  this.position = Vec2();\n\
  this.scale = 0;\n\
  this.orientation = 'landscape';\n\
\n\
  this.canvas = document.createElement('canvas');\n\
  if (this.color) {\n\
    this.canvas.mozOpaque = true;\n\
  }\n\
  this.ctx = this.canvas.getContext('2d');\n\
\n\
  this.buffer = false;\n\
  if (this.buffer) {\n\
    this.buf = document.createElement('canvas');\n\
    this.bufctx = this.buf.getContext('2d');\n\
    this.buf.width = this.content[0];\n\
    this.buf.height = this.content[1];\n\
  }\n\
  this.canvas.width = this.content[0];\n\
  this.canvas.height = this.content[1];\n\
  this.element.style.width = this.content[0] + 'px';\n\
  this.element.style.height = this.content[1] + 'px';\n\
  this.element.appendChild(this.canvas);\n\
\n\
  window.addEventListener('resize', this, false);\n\
  document.addEventListener('fullscreenchange', this, false);\n\
  document.addEventListener('mozfullscreenchange', this, false);\n\
  document.addEventListener('webkitfullscreenchange', this, false);\n\
\n\
  this.reflow();\n\
}\n\
\n\
Renderer.prototype  = {\n\
\n\
  handleEvent: function(evt) {\n\
    if (~evt.type.indexOf('fullscreenchange')) {\n\
      this.fullscreenChange();\n\
    } else {\n\
      this.reflow();\n\
    }\n\
  },\n\
\n\
  reflow: function() {\n\
    var browser = Vec2.set(this.browser, window.innerWidth, window.innerHeight);\n\
    var scale = Math.min(browser[0] / this.content[0], browser[1] / this.content[1]);\n\
    if (scale !== this.scale) {\n\
      this.scale = scale;\n\
      Vec2.scale(this.content, this.scale, this.size);\n\
    }\n\
    var offset = Vec2.scale(Vec2.sub(browser, this.size, this.margin), 0.5);\n\
    var rule = \"translate(\" + offset[0] + \"px, \" +\n\
      offset[1] + \"px) scale(\" + scale + \")\";\n\
    this.element.style.transform = rule;\n\
    this.element.style.webkitTransform = rule;\n\
  },\n\
\n\
  save: function() {\n\
    var ctx = this.buffer ? this.bufctx : this.ctx;\n\
    if (this.color) {\n\
      ctx.fillStyle = Color.rgba(this.color);\n\
      ctx.fillRect(0, 0, this.content[0], this.content[1]);\n\
    } else {\n\
      ctx.clearRect(0, 0, this.content[0], this.content[1]);\n\
    }\n\
    return ctx;\n\
  },\n\
\n\
  restore: function() {\n\
    if (this.buffer) {\n\
      this.ctx.clearRect(0, 0, this.content[0], this.content[1]);\n\
      this.ctx.drawImage(this.buf, 0, 0);\n\
    }\n\
  },\n\
\n\
  // FIXME: Unused\n\
  center: function(pos) {\n\
    Vec2.set(this.position, pos[0] - this.size[0] / 2, pos[0] - this.size[1] / 2);\n\
    return this;\n\
  },\n\
\n\
  // FIXME: Unused\n\
  cull: function(entity) {\n\
    var bounds = entity.bounds;\n\
    if (!bounds) {\n\
      return false;\n\
    }\n\
    if (bounds.withinRect(this.position, this.content)) {\n\
      if (bounds.culled) {\n\
        bounds.culled = false;\n\
      }\n\
      return false;\n\
    }\n\
    if (!bounds.culled) {\n\
      bounds.culled = true;\n\
    }\n\
    return true;\n\
  },\n\
\n\
  isFullscreen: function() {\n\
    var doc = document;\n\
    return doc.fullscreen || doc.mozFullScreen || doc.webkitIsFullScreen;\n\
  },\n\
\n\
  requestFullscreen: function() {\n\
    if (!this.isFullscreen()) {\n\
      var target = this.element.parentNode;\n\
      if ('webkitRequestFullScreen' in target) {\n\
        target.webkitRequestFullScreen();\n\
      } else if ('mozRequestFullScreen' in target) {\n\
        target.mozRequestFullScreen();\n\
      }\n\
    }\n\
  },\n\
\n\
  fullscreenChange: function() {\n\
    if (this.orientation) {\n\
      this.lockOrientation(this.orientation);\n\
    }\n\
  },\n\
\n\
  lockOrientation: function(format) {\n\
    if (format == null) {\n\
      format = this.orientation;\n\
    }\n\
    var target = window.screen;\n\
    if ('lockOrientation' in target) {\n\
      screen.lockOrientation(format);\n\
    } else if ('mozLockOrientation' in target) {\n\
      screen.mozLockOrientation(format);\n\
    }\n\
  }\n\
\n\
};\n\
\n\
module.exports = Renderer;\n\
//@ sourceURL=acmejs/lib/core/renderer.js"
));
require.register("acmejs/lib/core/console.js", Function("exports, require, module",
"'use strict';\n\
\n\
var Component = require('./component');\n\
var Vec2 = require('./math').Vec2;\n\
var Engine = require('./engine');\n\
\n\
function Console() {\n\
\tthis.colors = ['#ddd', '#fff', '#ffc', '#fcc'];\n\
\tthis.sections = ['#ffff33', '#ff8533', '#2babd6', '#9d2bd6'];\n\
\t// ['#fffa5b', '#ff945b', '#5bf4ff', '#bd5bff']\n\
}\n\
\n\
Console.prototype = {\n\
\n\
\tattributes: {\n\
\t\tcss: '',\n\
\t\tcontainer: null,\n\
\t\twidth: 100,\n\
\t\theight: 56,\n\
\t\tcap: 50,\n\
\t\tresolution: 0.05,\n\
\t\tfancy: true\n\
\t},\n\
\n\
\tcreate: function(attributes) {\n\
\t\tthis.css = attributes.css;\n\
\t\tthis.container = attributes.container;\n\
\t\tthis.width = attributes.width;\n\
\t\tthis.height = attributes.height;\n\
\t\tthis.cap = attributes.cap;\n\
\t\tthis.resolution = attributes.resolution;\n\
\t\tthis.fancy = attributes.fancy;\n\
\n\
\t\tvar wrap = this.wrap = document.createElement('div');\n\
\t\twrap.id = 'console';\n\
\t\twrap.style.cssText = '' +\n\
\t\t\t'position: fixed;' +\n\
\t\t\t'left: 0;' +\n\
\t\t\t'top: 0;' +\n\
\t\t\t'user-select: none;' +\n\
\t\t\t'overflow: hidden;' +\n\
\t\t\t'padding: 0;' +\n\
\t\t\t'width: ' + this.width + 'px;' +\n\
\t\t\t'color: #ccc;' +\n\
\t\t\t'background-color: rgba(0, 0, 0, 1);' +\n\
\t\t\t'outline: 1px solid rgba(128, 128, 128, 0.5);' +\n\
\t\t\t'font: 400 9px/20px Helvetica,Arial,sans-serif;' +\n\
\t\t\t'transform: translateZ(0);' +\n\
\t\t\t'text-align: right;' +\n\
\t\t\t'text-shadow: 1px 1px 0 rgba(0, 0, 0, 1), 0 0 1px rgba(0, 0, 0, 1);' +\n\
\t\t\t'cursor: ns-resize;' + this.css;\n\
\n\
\t\tvar spanCss = 'font-weight: bold;' +\n\
\t\t\t'font-size: 12px;' +\n\
\t\t\t'float: left;';\n\
\n\
\t\tthis.fpsSpan = document.createElement('span');\n\
\t\tthis.fpsSpan.style.cssText = spanCss;\n\
\t\tthis.fpsSpan.title = 'FPS';\n\
\t\tthis.fpsSpan2 = document.createElement('span');\n\
\t\tthis.tickSpan = document.createElement('span');\n\
\t\tthis.tickSpan.style.cssText = spanCss;\n\
\t\tthis.tickSpan.title = 'MS per tick';\n\
\t\tthis.tickSpan2 = document.createElement('span');\n\
\t\tthis.fpsSpan2.title = this.tickSpan2.title = '± standard deviation';\n\
\n\
\t\tvar panelCss = 'width: 50%;' +\n\
\t\t\t'padding: 0 5px;' +\n\
\t\t\t'overflow: hidden;' +\n\
\t\t\t'position: absolute;' +\n\
\t\t\t'top: 0;' +\n\
\t\t\t'left: 0;' +\n\
\t\t\t'-moz-box-sizing: border-box;' +\n\
\t\t\t'-webkit-box-sizing: border-box;' +\n\
\t\t\t'z-index: 2;';\n\
\t\tvar panel = document.createElement('span');\n\
\t\tpanel.style.cssText = panelCss;\n\
\t\tpanel.appendChild(this.fpsSpan);\n\
\t\tpanel.appendChild(this.fpsSpan2);\n\
\t\twrap.appendChild(panel);\n\
\n\
\t\tpanel = document.createElement('span');\n\
\t\tpanel.style.cssText = panelCss + 'left: 50%;';\n\
\t\tpanel.appendChild(this.tickSpan);\n\
\t\tpanel.appendChild(this.tickSpan2);\n\
\t\twrap.appendChild(panel);\n\
\n\
\t\tvar rulerCss = 'position: absolute;' +\n\
\t\t\t'left: 0;' +\n\
\t\t\t'width: 100%;' +\n\
\t\t\t'height: 1px;' +\n\
\t\t\t'background-color: rgba(128, 128, 128, 0.5);';\n\
\n\
\t\tvar ruler = document.createElement('span');\n\
\t\truler.style.cssText = rulerCss + ('bottom: ' + (this.height * 0.66) + 'px;');\n\
\t\twrap.appendChild(ruler);\n\
\t\truler = document.createElement('span');\n\
\t\truler.style.cssText = rulerCss + ('bottom: ' + (this.height * 0.33) + 'px;');\n\
\t\twrap.appendChild(ruler);\n\
\n\
\t\tthis.graphSpan = document.createElement('div');\n\
\t\tthis.graphSpan.style.cssText = '' +\n\
\t\t\t'height: ' + this.height + 'px;' +\n\
\t\t\t'z-index: 1;';\n\
\t\tthis.graphSpan.title = 'Fixed Update + Update + Render + Lag';\n\
\n\
\t\tvar barCss = 'width: 1px;' +\n\
\t\t\t'float: left;' +\n\
\t\t\t'margin-top: 0px;';\n\
\t\tvar sectionCss = 'display: block;' +\n\
\t\t\t'height: 0px;';\n\
\t\tif (this.fancy) {\n\
\t\t\tsectionCss += 'background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.25));'\n\
\t\t}\n\
\n\
\t\tvar i = this.width;\n\
\t\twhile (i--) {\n\
\t\t\tvar bar = document.createElement('span');\n\
\t\t\tbar.className = 'console-bar';\n\
\t\t\tbar.style.cssText = barCss;\n\
\t\t\tvar sections = this.sections;\n\
\t\t\tfor (var j = 0, l = sections.length; j < l; j++) {\n\
\t\t\t\tvar section = document.createElement('span');\n\
\t\t\t\tsection.className = 'console-section';\n\
\t\t\t\tsection.style.cssText = sectionCss +\n\
\t\t\t\t\t'background-color: ' + sections[j] + ';';\n\
\t\t\t\tbar.appendChild(section);\n\
\t\t\t}\n\
\t\t\tthis.graphSpan.appendChild(bar);\n\
\t\t}\n\
\t\twrap.appendChild(this.graphSpan);\n\
\n\
\t\t(this.container || document.body).appendChild(wrap);\n\
\t\tthis.nullify();\n\
\n\
\t\tthis.lastClick = 0;\n\
\t\twrap.addEventListener('click', this);\n\
\n\
\t\tthis.maximized = !(~(document.cookie || '').indexOf('console_max'));\n\
\t\tthis.toggle();\n\
\t},\n\
\n\
\thandleEvent: function(evt) {\n\
\t\tvar time = evt.timeStamp;\n\
\t\tif (time - this.lastClick < 500) {\n\
\t\t\tthis.destroy();\n\
\t\t}\n\
\t\tthis.lastClick = time;\n\
\n\
\t\tthis.toggle();\n\
\t\treturn false;\n\
\t},\n\
\n\
\ttoggle: function() {\n\
\t\tvar margin = 0;\n\
\t\tvar opacity = 0.8;\n\
\t\tthis.maximized = !this.maximized;\n\
\t\tif (!this.maximized) {\n\
\t\t\topacity = 0.5;\n\
\t\t\tmargin = -this.height + 20;\n\
\t\t\tdocument.cookie = 'console_max=; expires=' + (new Date()).toGMTString();\n\
\t\t} else {\n\
\t\t\tdocument.cookie = 'console_max=1'\n\
\t\t}\n\
\t\tvar style = this.graphSpan.style;\n\
\t\tstyle.marginTop = '' + margin + 'px';\n\
\t\tstyle.opacity = opacity;\n\
\t},\n\
\n\
\tdealloc: function() {\n\
\t\t(this.container || document.body).removeChild(this.wrap);\n\
\t\tthis.wrap.removeEventListener('click', this);\n\
\t\tthis.wrap = null;\n\
\t\tthis.container = null;\n\
\t\tComponent.prototype.dealloc.call(this);\n\
\t},\n\
\n\
\tonTimeEnd: function(samples) {\n\
\t\tvar dt = samples.dt;\n\
\t\tthis.dtSum += dt;\n\
\t\tif (!dt) {\n\
\t\t\treturn;\n\
\t\t}\n\
\n\
\t\tvar fps = 1 / dt;\n\
\t\tthis.fpsSum += fps;\n\
\t\tthis.fpsSq += fps * fps;\n\
\t\tvar lag = samples.lag;\n\
\t\tthis.lagSum += lag;\n\
\t\tthis.lagSq += lag * lag;\n\
\t\tvar tick = samples.tick;\n\
\t\tthis.tickSum += tick;\n\
\t\tthis.tickSq += tick * tick;\n\
\t\tthis.updateSum += samples.update;\n\
\t\tthis.fixedUpdateSum += samples.fixedUpdate;\n\
\t\tthis.renderSum += samples.render;\n\
\t\tthis.frames++;\n\
\t\tif (this.dtSum < this.resolution) {\n\
\t\t\treturn;\n\
\t\t}\n\
\n\
\t\tvar colors = this.colors;\n\
\t\tvar tickMean = this.tickSum / this.frames;\n\
\t\tvar tickSD = Math.sqrt((this.tickSq - (this.tickSum * this.tickSum / this.frames)) / (this.frames - 1));\n\
\n\
\t\tvar color = colors[0];\n\
\t\tif (tickMean > 33) {\n\
\t\t\tcolor = colors[3];\n\
\t\t} else if (tickMean > 16) {\n\
\t\t\tcolor = colors[2];\n\
\t\t} else if (tickMean > 5) {\n\
\t\t\tcolor = colors[1];\n\
\t\t}\n\
\n\
\t\tthis.tickSpan.textContent = tickMean < 10 ? Math.round(tickMean * 10) / 10 : Math.round(tickMean);\n\
\t\tthis.tickSpan.style.color = color;\n\
\t\tthis.tickSpan2.textContent = tickSD < 10 ? Math.round(tickSD * 10) / 10 : Math.round(tickSD);\n\
\n\
\t\tvar bar = this.graphSpan.appendChild(this.graphSpan.firstChild);\n\
\t\tvar overall = 0;\n\
\n\
\t\tvar mag = Math.round(this.height * this.lagSum / this.frames / this.cap);\n\
\t\tbar.children[0].style.height = mag + 'px';\n\
\t\toverall += mag;\n\
\n\
\t\tmag = this.height * this.renderSum / this.frames / this.cap;\n\
\t\tbar.children[1].style.height = mag + 'px';\n\
\t\toverall += mag;\n\
\n\
\t\tmag = Math.round(this.height * this.updateSum / this.frames / this.cap);\n\
\t\tbar.children[2].style.height = mag + 'px';\n\
\t\toverall += mag;\n\
\n\
\t\tmag = Math.round(this.height * this.fixedUpdateSum / this.frames / this.cap);\n\
\t\tbar.children[3].style.height = mag + 'px';\n\
\t\toverall += mag;\n\
\n\
\t\tbar.style.marginTop = '' + (this.height - overall) + 'px';\n\
\n\
\t\tvar fpsMean = this.fpsSum / this.frames;\n\
\t\tvar fpsSD = Math.sqrt((this.fpsSq - (this.fpsSum * this.fpsSum / this.frames)) / (this.frames - 1));\n\
\t\tif (fpsMean < 30) {\n\
\t\t\tcolor = colors[3];\n\
\t\t} else if (fpsMean < 40) {\n\
\t\t\tcolor = colors[2];\n\
\t\t} else if (fpsMean < 55) {\n\
\t\t\tcolor = colors[1];\n\
\t\t} else {\n\
\t\t\tcolor = colors[0];\n\
\t\t}\n\
\t\tthis.fpsSpan.textContent = Math.round(fpsMean || 0);\n\
\t\tthis.fpsSpan.style.color = color;\n\
\t\tthis.fpsSpan2.textContent = Math.round(fpsSD || 0);\n\
\n\
\t\tthis.nullify();\n\
\t},\n\
\n\
\tnullify: function() {\n\
\t\tthis.dtSum = 0;\n\
\t\tthis.fpsSum = this.fpsSq = 0;\n\
\t\tthis.tickSum = this.tickSq = 0;\n\
\t\tthis.lagSum = this.lagSq = 0;\n\
\t\tthis.fixedUpdateSum = 0;\n\
\t\tthis.updateSum = 0;\n\
\t\tthis.renderSum = 0;\n\
\t\tthis.frames = 0;\n\
\t}\n\
\n\
};\n\
\n\
new Component('console', Console);\n\
\n\
module.exports = Console;//@ sourceURL=acmejs/lib/core/console.js"
));
require.register("acmejs/lib/core/transform.js", Function("exports, require, module",
"'use strict';\n\
\n\
var Component = require('./component');\n\
var Vec2 = require('./math').Vec2;\n\
var Mat2 = require('../math/mat2');\n\
\n\
/**\n\
 * Transform\n\
 *\n\
 * Transform keeps track of position, rotation and scale.\n\
 *\n\
 * It will eventually also keep track of composite and opacity.\n\
 *\n\
 * @extends Component\n\
 */\n\
\n\
function Transform() {\n\
  this.position = Vec2();\n\
  this.scale = Vec2();\n\
  this._matrix = Mat2();\n\
  this._matrixWorld = Mat2();\n\
}\n\
\n\
Transform.prototype = {\n\
\n\
  attributes: {\n\
    position: Vec2(),\n\
    rotation: 0,\n\
    scale: Vec2(1, 1),\n\
    alpha: 1\n\
  },\n\
\n\
  create: function(attributes) {\n\
    Vec2.copy(this.position, attributes.position);\n\
    this.rotation = attributes.rotation;\n\
    Vec2.copy(this.scale, attributes.scale);\n\
    this.alpha = attributes.alpha;\n\
\n\
    var parent = this.entity.parent;\n\
    this.parentTransform = parent ? parent.transform : null;\n\
    this._dirty = true;\n\
    this.matrixAutoUpdate = true;\n\
    this._dirtyWorld = true;\n\
\n\
    Vec2.set(this._matrix);\n\
    Vec2.set(this._matrixWorld);\n\
  },\n\
\n\
  set dirty(to) {\n\
    this._dirty = to;\n\
  },\n\
\n\
  get matrix() {\n\
    var matrix = this._matrix;\n\
    if (this._dirty || this.matrixAutoUpdate) {\n\
      Mat2.translate(Mat2.identity, this.position, matrix);\n\
      Mat2.rotate(matrix, this.rotation);\n\
      Mat2.scale(matrix, this.scale);\n\
      this._dirty = false;\n\
      this._dirtyWorld = true;\n\
    }\n\
    return matrix;\n\
  },\n\
\n\
  get matrixWorld() {\n\
    var matrix = this.matrix;\n\
    var parent = this.parentTransform;\n\
    if (!parent) {\n\
      return matrix;\n\
    }\n\
    var matrixWorld = this._matrixWorld\n\
    if (this._dirtyWorld) {\n\
      Mat2.multiply(parent.matrixWorld, matrix, matrixWorld);\n\
      this._dirtyWorld = false;\n\
    }\n\
    return matrixWorld;\n\
  },\n\
\n\
  get positionOnly() {\n\
    var parent = this.parentTransform;\n\
    return (!parent || parent.positionOnly) && this.rotation == 0 &&\n\
      this.scale == 1;\n\
  },\n\
\n\
  compose: function(position, rotation, scale) {\n\
    if (position != null) {\n\
      Vec2.copy(this.position, position);\n\
    }\n\
    if (rotation != null) {\n\
      this.rotation = rotation;\n\
    }\n\
    if (scale != null) {\n\
      Vec2.copy(this.scale, scale);\n\
    }\n\
    this._dirty = true;\n\
  },\n\
\n\
  applyMatrix: function(ctx) {\n\
    var mtx = this.matrixWorld;\n\
    ctx.setTransform(\n\
      mtx[0], mtx[1], mtx[2], mtx[3],\n\
      mtx[4] + 0.5 | 0, mtx[5] + 0.5 | 0\n\
    );\n\
  }\n\
\n\
};\n\
\n\
new Component('transform', Transform);\n\
\n\
module.exports = Transform;//@ sourceURL=acmejs/lib/core/transform.js"
));
require.register("acmejs/lib/core/bounds.js", Function("exports, require, module",
"'use strict';\n\
\n\
var Component = require('./component');\n\
var Pool = require('./pool');\n\
var Color = require('./color');\n\
var Vec2 = require('./math').Vec2;\n\
\n\
/**\n\
 * @class Bounds\n\
 *\n\
 * Tracks shape and dimensions of an entity.\n\
 *\n\
 * TODO: https://github.com/photonstorm/phaser/blob/master/Phaser/Collision.ts\n\
 *\n\
 * @extends Component\n\
 * @property {String} shape \"circle\" or \"rect\"\n\
 * @property {Number} radius Circle radius\n\
 * @property {Number[]} size Rect size\n\
 */\n\
function Bounds() {\n\
\tthis.size = Vec2();\n\
}\n\
\n\
Bounds.prototype = {\n\
\n\
\tattributes: {\n\
\t\tshape: 'rect',\n\
\t\tradius: 0,\n\
\t\tsize: Vec2()\n\
\t},\n\
\n\
\tcreate: function(attributes) {\n\
\t\tVec2.copy(this.size, attributes.size);\n\
\t\tthis.shape = attributes.shape;\n\
\t\tthis.radius = attributes.radius;\n\
\t},\n\
\n\
\tget top() {\n\
\t\tif (this.shape === 'circle') {\n\
\t\t\treturn this.transform.position[1] - this.radius;\n\
\t\t}\n\
\t\treturn this.transform.position[1];\n\
\t},\n\
\n\
\tget bottom() {\n\
\t\tif (this.shape === 'circle') {\n\
\t\t\treturn this.transform.position[1] + this.radius;\n\
\t\t}\n\
\t\treturn this.transform.position[1] + this.size[1];\n\
\t},\n\
\n\
\t/*\n\
\tgetAabb: function() {\n\
\t\tif (!this.topLeft) {\n\
\t\t\tthis.topLeft = Vec2();\n\
\t\t\tthis.bottomRight = Vec2();\n\
\t\t}\n\
\t\tVec2.set(\n\
\t\t\tthis.topLeft,\n\
\t\t\tthis.position[0] + this.size[0] * 0.5 * (this.align[0] + 1),\n\
\t\t\tthis.position[1] + this.size[1] * 0.5 * (this.align[1] + 1)\n\
\t\t);\n\
\t\tVec2.set(\n\
\t\t\tthis.bottomRight,\n\
\t\t\tthis.position[0] + this.size[0] * 0.5 * (this.align[0] + 5),\n\
\t\t\tthis.position[1] + this.size[1] * 0.5 * (this.align[1] + 5)\n\
\t\t);\n\
\t\treturn this.topLeft;\n\
\t},\n\
\t*/\n\
\n\
\tintersectLine: function(a1, a2, result) {\n\
\t\tvar pos = this.transform.position;\n\
\t\tswitch (this.shape) {\n\
\t\t\tcase 'circle':\n\
\t\t\t\treturn Bounds.intersectLineCirc(a1, a2, pos, this.radius, result);\n\
\t\t\tcase 'rect':\n\
\t\t\t\treturn false;\n\
\t\t}\n\
\t\treturn false;\n\
\t},\n\
\n\
\tintersect: function(bound) {\n\
\t\treturn null;\n\
\t},\n\
\n\
\tcontains: function(point) {\n\
\t\tvar pos = this.transform.position;\n\
\t\tswitch (this.shape) {\n\
\t\t\tcase 'circle':\n\
\t\t\t\treturn Bounds.circPoint(pos, this.radius, point);\n\
\t\t\tcase 'rect':\n\
\t\t\t\treturn Bounds.rectPoint(pos, this.size, point);\n\
\t\t}\n\
\t\treturn false;\n\
\t},\n\
\n\
\twithinRect: function(pos, size) {\n\
\t\tvar mypos = this.transform.position;\n\
\t\tswitch (this.shape) {\n\
\t\t\tcase 'circle':\n\
\t\t\t\treturn Bounds.rectCirc(pos, size, mypos, this.radius);\n\
\t\t\tcase 'rect':\n\
\t\t\t\treturn Bounds.rectRect(pos, size, mypos, this.size);\n\
\t\t}\n\
\t\treturn false;\n\
\t}\n\
\n\
};\n\
\n\
/**\n\
 * Intersection circle/point\n\
 *\n\
 * http://www.openprocessing.org/user/54\n\
 *\n\
 * @param {Number[]} center\n\
 * @param {Number} radius\n\
 * @param {Number[]} point\n\
 * @return {Boolean}\n\
 */\n\
Bounds.circPoint = function(center, radius, point) {\n\
\treturn Vec2.distSq(point, center) <= radius * radius;\n\
};\n\
\n\
/**\n\
 * Intersection rectangle/point\n\
 *\n\
 * @param {Number[]} pos\n\
 * @param {Number[]} size\n\
 * @param {Number[]} point\n\
 * @return {Boolean}\n\
 */\n\
Bounds.rectPoint = function(pos, size, point) {\n\
\treturn pos[0] - size[0] < point[0] && pos[1] < point[1] && pos[0] + size[0] > point[0] && pos[1] + size[1] > point[1];\n\
};\n\
\n\
/**\n\
 * Closes point to a line\n\
 *\n\
 * http://blog.generalrelativity.org/actionscript-30/collision-detection-circleline-segment-circlecapsule/\n\
 *\n\
 * @static\n\
 * @param {Number[]} a Line P1\n\
 * @param {Number[]} b Line P2\n\
 * @param {Number[]} point Point\n\
 * @param {Number[]} result Result\n\
 * @return {Number[]} Result\n\
 */\n\
Bounds.closestLinePoint = function(a, b, point, result) {\n\
\tVec2.sub(b, a, v);\n\
\tVec2.sub(point, a, w);\n\
\tvar t = Math.clamp(Vec2.dot(w, v) / Vec2.dot(v, v), 0, 1);\n\
\treturn Vec2.add(a, Vec2.scale(v, t, result));\n\
};\n\
\n\
var v = Vec2();\n\
var w = Vec2();\n\
\n\
/**\n\
 * Intersection line/circle\n\
 *\n\
 * @static\n\
 * @param {Number[]} a Line P1\n\
 * @param {Number[]} b Line P2\n\
 * @param {Number[]} center Circle center\n\
 * @param {Number} radius Circe radius\n\
 * @param {Number[]} result Result vector\n\
 * @return {Number[]|Boolean}\n\
 */\n\
Bounds.intersectLineCirc = function(a, b, center, radius, result) {\n\
\tBounds.closestLinePoint(a, b, center, lineCircTest);\n\
\tVec2.sub(lineCircTest, center);\n\
\tif (Vec2.dot(lineCircTest, lineCircTest) > radius * radius) {\n\
\t\treturn false;\n\
\t}\n\
\tif (!result) {\n\
\t\treturn true;\n\
\t}\n\
\treturn Vec2.copy(result, lineCircTest);\n\
};\n\
\n\
var lineCircTest = Vec2();\n\
\n\
/**\n\
 * Intersection rectangle/circle\n\
 *\n\
 * http://stackoverflow.com/questions/401847/circle-rectangle-collision-detection-intersection/402010#402010\n\
 *\n\
 * @param {Number[]} topLeft Rectangle top-left point\n\
 * @param {Number[]} size Rectangle size\n\
 * @param {Number[]} center Circle center\n\
 * @param {Number} radius Circle radius\n\
 * @return {Boolean}\n\
 */\n\
Bounds.rectCirc = function(topLeft, size, center, radius) {\n\
\tvar circleDistanceX, circleDistanceY, cornerDistance;\n\
\tcircleDistanceX = Math.abs(center[0] - topLeft[0] - size[0] / 2);\n\
\tcircleDistanceY = Math.abs(center[1] - topLeft[1] - size[1] / 2);\n\
\tif (circleDistanceX > (size[0] / 2 + radius) || circleDistanceY > (size[1] / 2 + radius)) {\n\
\t\treturn false;\n\
\t}\n\
\tif (circleDistanceX <= size[0] / 2 || circleDistanceY <= size[1] / 2) {\n\
\t\treturn true;\n\
\t}\n\
\tcornerDistance = Math.pow(circleDistanceX - size[0] / 2, 2) + Math.pow(circleDistanceY - size[1] / 2, 2);\n\
\treturn cornerDistance <= Math.pow(radius, 2);\n\
};\n\
\n\
/**\n\
 * Intersection rectangle/rectangle\n\
 *\n\
 * @param {Number[]} pos\n\
 * @param {Number[]} size\n\
 * @param {Number[]} pos2\n\
 * @param {Number[]} size2\n\
 * @return {Boolean}\n\
 */\n\
Bounds.rectRect = function(pos, size, pos2, size2) {\n\
\treturn !(pos[0] > pos2[0] + size2[0] || pos[0] + size[0] < pos2[0] || pos[1] > pos2[1] + size2[1] || pos[1] + size[1] < pos2[1]);\n\
};\n\
\n\
\n\
/**\n\
 * Random point in circle\n\
 */\n\
Bounds.randCircPoint = function(point, center, radius) {\n\
\tVec2.set(point, 0, Math.rand(0, radius));\n\
\tVec2.rotate(point, Math.rand(-Math.PI, Math.PI));\n\
\treturn Vec2.add(point, center);\n\
};\n\
\n\
/**\n\
 * Random point in rectangle\n\
 */\n\
Bounds.randRectPoint = function(point, pos, size) {\n\
\tVec2.set(point, Math.rand(0, size[0]), Math.rand(0, size[1]));\n\
\treturn Vec2.add(point, pos);\n\
};\n\
\n\
new Component('bounds', Bounds);\n\
\n\
/*\n\
 * Intersection line/rectangle\n\
 *\n\
 * http://www.openprocessing.org/sketch/8010\n\
 *\n\
 * @param  {[type]} point1  [description]\n\
 * @param  {[type]} point2  [description]\n\
 * @param  {[type]} topLeft [description]\n\
 * @param  {[type]} size    [description]\n\
 * @return {bool}           They intersect\n\
 *\n\
Bounds.lineRect = function(point1, point2, topLeft, size) {\n\
\t// Calculate m and c for the equation for the line (y = mx+c)\n\
\tm = (a1[1] - y0) / (a1[0] - x0);\n\
\tc = y0 - (m * x0);\n\
\n\
\t// if the line is going up from right to left then the top intersect point is on the left\n\
\tif (m > 0) {\n\
\t\ttop_intersection = (m * l + c);\n\
\t\tbottom_intersection = (m * r + c);\n\
\t}\n\
\t// otherwise it's on the right\n\
\telse {\n\
\t\ttop_intersection = (m * r + c);\n\
\t\tbottom_intersection = (m * l + c);\n\
\t}\n\
\n\
\t// work out the top and bottom extents for the triangle\n\
\tif (y0 < a1[1]) {\n\
\t\ttoptrianglepoint = y0;\n\
\t\tbottomtrianglepoint = a1[1];\n\
\t} else {\n\
\t\ttoptrianglepoint = a1[1];\n\
\t\tbottomtrianglepoint = y0;\n\
\t}\n\
\n\
\tvar topoverlap: Number;\n\
\tvar botoverlap: Number;\n\
\n\
\t// and calculate the overlap between those two bounds\n\
\ttopoverlap = top_intersection > toptrianglepoint ? top_intersection : toptrianglepoint;\n\
\tbotoverlap = bottom_intersection < bottomtrianglepoint ? bottom_intersection : bottomtrianglepoint;\n\
\n\
\t// (topoverlap<botoverlap) :\n\
\t// if the intersection isn't the right way up then we have no overlap\n\
\n\
\t// (!((botoverlap<t) || (topoverlap>b)) :\n\
\t// If the bottom overlap is higher than the top of the rectangle or the top overlap is\n\
\t// lower than the bottom of the rectangle we don't have intersection. So return the negative\n\
\t// of that. Much faster than checking each of the points is within the bounds of the rectangle.\n\
\treturn (topoverlap < botoverlap) && (!((botoverlap < t) || (topoverlap > b)));\n\
};\n\
*/\n\
\n\
/*\n\
Bounds.lineCirc = function(point1, point2, center, radius) {\n\
\tvar a, b, bb4ac, c, dx, dy, ia1[0], ia2[0], ia1[1], ia2[1], mu, testX, testY;\n\
\tdx = a2[0] - a1[0];\n\
\tdy = a2[1] - a1[1];\n\
\ta = dx * dx + dy * dy;\n\
\tb = 2 * (dx * (a1[0] - cx) + dy * (a1[1] - cy));\n\
\tc = cx * cx + cy * cy;\n\
\tc += a1[0] * a1[0] + a1[1] * a1[1];\n\
\tc -= 2 * (cx * a1[0] + cy * a1[1]);\n\
\tc -= cr * cr;\n\
\tbb4ac = b * b - 4 * a * c;\n\
\tif (bb4ac < 0) {\n\
\t\treturn false;\n\
\t}\n\
\tmu = (-b + sqrt(b * b - 4 * a * c)) / (2 * a);\n\
\tia1[0] = a1[0] + mu * dx;\n\
\tia1[1] = a1[1] + mu * dy;\n\
\tmu = (-b - sqrt(b * b - 4 * a * c)) / (2 * a);\n\
\tia2[0] = a1[0] + mu * dx;\n\
\tia2[1] = a1[1] + mu * dy;\n\
\tif (dist(a1[0], a1[1], cx, cy) < dist(a2[0], a2[1], cx, cy)) {\n\
\t\ttestX = a2[0];\n\
\t\ttestY = a2[1];\n\
\t} else {\n\
\t\ttestX = a1[0];\n\
\t\ttestY = a1[1];\n\
\t}\n\
\tif (dist(testX, testY, ia1[0], ia1[1]) < dist(a1[0], a1[1], a2[0], a2[1]) || dist(testX, testY, ia2[0], ia2[1]) < dist(a1[0], a1[1], a2[0], a2[1])) {\n\
\t\treturn true;\n\
\t}\n\
\treturn false;\n\
};\n\
*/\n\
\n\
/**\n\
 * Intersection line/line\n\
 *\n\
 * http://stackoverflow.com/questions/3746274/line-intersection-with-aabb-rectangle\n\
 * http://jsperf.com/line-intersection2/2\n\
 *\n\
 * @param {Number[]} a1 Line 1 P1\n\
 * @param {Number[]} a2 Line 1 P2\n\
 * @param {Number[]} b1 Line 2 P1\n\
 * @param {Number[]} b2 Line 2 P2\n\
 * @param {Number[]} result\n\
 * @return {Number[]}\n\
 */\n\
Bounds.intersectLine = function(a1, a2, b1, b2, result) {\n\
\tif (!result) {\n\
\t\t// http://www.bryceboe.com/2006/10/23/line-segment-intersection-algorithm/comment-page-1/\n\
\t\treturn ccw(a1, b1, b2) != ccw(a2, b1, b2) &&\n\
\t\t\tccw(a1, a2, b1) != ccw(a1, a2, b2);\n\
\t}\n\
\n\
\t// http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect/1968345#1968345\n\
\tvar s1_x = a2[0] - a1[0];\n\
\tvar s1_y = a2[1] - a1[1];\n\
\tvar s2_x = b2[0] - b1[0];\n\
\tvar s2_y = b2[1] - b1[1];\n\
\n\
\tvar s = (-s1_y * (a1[0] - b1[0]) + s1_x * (a1[1] - b1[1])) / (-s2_x * s1_y + s1_x * s2_y);\n\
\tvar t = (s2_x * (a1[1] - b1[1]) - s2_y * (a1[0] - b1[0])) / (-s2_x * s1_y + s1_x * s2_y);\n\
\n\
\t// Collision detected\n\
\tif (s >= 0 && s <= 1 && t >= 0 && t <= 1) {\n\
\t\treturn Vec2.set(result, a1[0] + (t * s1_x), a1[1] + (t * s1_y));\n\
\t}\n\
\treturn null;\n\
}\n\
\n\
function ccw(a, b, c) {\n\
\tvar cw = ((c[1] - a[1]) * (b[0] - a[0])) - ((b[1] - a[1]) * (c[0] - a[0]));\n\
\treturn (cw > 0) ? true : cw < 0 ? false : true; /* colinear */\n\
}\n\
\n\
/**\n\
 * Bounds.Debug\n\
 *\n\
 * Outlines the boundaries and angle of an entity.\n\
 *\n\
 * @extends Component\n\
 */\n\
function BoundsDebug() {\n\
\tthis.color = Color();\n\
}\n\
\n\
BoundsDebug.prototype = {\n\
\n\
\tattributes: {\n\
\t\tcolor: Color.gray,\n\
\t\topacity: 0.5,\n\
\t\tfill: false\n\
\t},\n\
\n\
\tcreate: function(attributes) {\n\
\t\tthis.opacity = attributes.opacity;\n\
\t\tthis.fill = attributes.fill;\n\
\t\tColor.copy(this.color, attributes.color);\n\
\t},\n\
\n\
\trender: function(ctx) {\n\
\t\tvar bounds = this.bounds;\n\
\t\tctx.save();\n\
\t\tif (this.fill) {\n\
\t\t\tctx.fillStyle = Color.rgba(this.color, this.opacity * 0.5);\n\
\t\t}\n\
\t\tctx.strokeStyle = Color.rgba(this.color, this.opacity);\n\
\t\tctx.lineWidth = 1;\n\
\t\tthis.transform.applyMatrix(ctx);\n\
\t\tif (bounds.shape === 'circle') {\n\
\t\t\tctx.beginPath();\n\
\t\t\tctx.lineTo(0, bounds.radius);\n\
\t\t\tctx.moveTo(0, 0);\n\
\t\t\tctx.arc(0, 0, bounds.radius | 0, 0, Math.TAU);\n\
\t\t\tif (this.fill) {\n\
\t\t\t\tctx.fill();\n\
\t\t\t}\n\
\t\t\tctx.stroke();\n\
\t\t} else {\n\
\t\t\tvar size = bounds.size;\n\
\t\t\tctx.strokeRect(-size[0] / 2 | 0, -size[1] / 2 | 0, size[0] | 0, size[1] | 0);\n\
\t\t\tif (this.fill) {\n\
\t\t\t\tctx.fillRect(-size[0] / 2 | 0, -size[1] / 2 | 0, size[0] | 0, size[1] | 0);\n\
\t\t\t}\n\
\t\t}\n\
\t\tctx.restore();\n\
\t}\n\
\n\
};\n\
\n\
new Component('boundsDebug', BoundsDebug);\n\
\n\
Bounds.Debug = BoundsDebug;\n\
\n\
module.exports = Bounds;\n\
//@ sourceURL=acmejs/lib/core/bounds.js"
));
require.register("acmejs/lib/core/input.js", Function("exports, require, module",
"'use strict';\n\
\n\
var Component = require('./component');\n\
var Pool = require('./pool');\n\
var Vec2 = require('./math').Vec2;\n\
var Engine = require('./engine');\n\
\n\
/**\n\
 * @class Input\n\
 * Input handling for mouse, touch, keyboard and hardware sensors\n\
 *\n\
 * @extends Component\n\
 */\n\
function Input() {\n\
  this.queue = [];\n\
  this.locks = {};\n\
  this.position = Vec2();\n\
  this.lastPos = Vec2();\n\
  this.touchState = null;\n\
  this.axis = Vec2();\n\
  this.mouseAxis = Vec2();\n\
  this.orientation = Vec2();\n\
  this.lastOrientation = Vec2();\n\
  this.baseOrientation = Vec2();\n\
\n\
  this.map = {\n\
    32: 'space',\n\
    192: 'debug',\n\
    38: 'up',\n\
    87: 'up',\n\
    39: 'right',\n\
    68: 'right',\n\
    40: 'bottom',\n\
    83: 'bottom',\n\
    37: 'left',\n\
    65: 'left',\n\
    219: 'squareLeft',\n\
    221: 'squareRight'\n\
  };\n\
  this.axisMap = {\n\
    left: Vec2(0, -1),\n\
    right: Vec2(0, 1),\n\
    up: Vec2(1, -1),\n\
    bottom: Vec2(1, 1)\n\
  };\n\
\n\
  this.keyNames = [];\n\
  this.keys = {};\n\
\n\
  var map = this.map;\n\
  for (var code in map) {\n\
    var key = map[code];\n\
    if (!~this.keyNames.indexOf(key)) {\n\
      this.keyNames.push(key);\n\
      this.keys[key] = null;\n\
    }\n\
  }\n\
\n\
  this.throttled = {\n\
    mousemove: true,\n\
    deviceorientation: true\n\
  };\n\
\n\
  this.lastEvent = null;\n\
\n\
  this.events = this.support.touch ? {\n\
    touchstart: 'startTouch',\n\
    touchmove: 'moveTouch',\n\
    touchend: 'endTouch',\n\
    touchcancel: 'endTouch'\n\
  } : {\n\
    mousedown: 'startTouch',\n\
    mousemove: 'moveTouch',\n\
    mouseup: 'endTouch',\n\
    keydown: 'keyStart',\n\
    keyup: 'keyEnd'\n\
  };\n\
\n\
  this.events.blur = 'blur';\n\
  this.events.deviceorientation = 'deviceOrientation';\n\
\n\
  this.attach();\n\
}\n\
\n\
Input.prototype = {\n\
\n\
  attach: function() {\n\
    for (var type in this.events) {\n\
      window.addEventListener(type, this, false);\n\
    }\n\
  },\n\
\n\
  detach: function() {\n\
    for (var type in this.events) {\n\
      window.removeEventListener(type, this, false);\n\
    }\n\
  },\n\
\n\
  support: {\n\
    touch: 'ontouchstart' in window,\n\
    orientation: 'ondeviceorientation' in window\n\
  },\n\
\n\
  handleEvent: function(event) {\n\
    if (event.metaKey) {\n\
      return;\n\
    }\n\
    event.preventDefault();\n\
    var type = event.type;\n\
    if (this.throttled[type] && this.lastEvent === type) {\n\
      this.queue[this.queue.length - 1] = event;\n\
    } else {\n\
      this.lastEvent = type;\n\
      this.queue.push(event);\n\
    }\n\
  },\n\
\n\
  keyStart: function(event) {\n\
    var key = this.map[event.keyCode];\n\
    if (key && !this.keys[key]) {\n\
      if (!this.lock('key-' + key)) {\n\
        return false;\n\
      }\n\
      this.keys[key] = 'began';\n\
      this.updateAxis(key);\n\
      Engine.trigger('onKeyBegan', key);\n\
    }\n\
  },\n\
\n\
  keyEnd: function(event) {\n\
    var key = this.map[event.keyCode];\n\
    if (key) {\n\
      if (!this.lock('key-' + key)) {\n\
        return false;\n\
      }\n\
      this.keys[key] = 'ended';\n\
      this.updateAxis(key, true);\n\
      Engine.trigger('onKeyEnded', key);\n\
    }\n\
  },\n\
\n\
  startTouch: function(event) {\n\
    if (!this.lock('touch')) {\n\
      return false;\n\
    }\n\
    this.resolve(event);\n\
    if (!this.touchState && !event.metaKey) {\n\
      this.touchState = 'began';\n\
      Engine.trigger('onTouchBegan');\n\
    }\n\
  },\n\
\n\
  moveTouch: function(event) {\n\
    var state = this.touchState;\n\
    if ((state === 'began' || state === 'ended') && !this.lock('touch')) {\n\
      return false;\n\
    }\n\
    this.resolve(event);\n\
    if (state && state !== 'ended' && state !== 'moved') {\n\
      this.touchState = 'moved';\n\
    }\n\
  },\n\
\n\
  endTouch: function(event) {\n\
    if (!this.lock('touch')) {\n\
      return false;\n\
    }\n\
    this.resolve(event);\n\
    if (this.touchState && (!this.support.touch || !event.targetTouches.length)) {\n\
      Engine.trigger('onTouchEnded');\n\
      this.touchState = 'ended';\n\
    }\n\
  },\n\
\n\
  updateAxis: function(key, ended) {\n\
    var axis = this.axisMap[key];\n\
    if (axis) {\n\
      if (ended) {\n\
        this.axis[axis[0]] -= axis[1];\n\
      } else {\n\
        this.axis[axis[0]] += axis[1];\n\
      }\n\
    }\n\
  },\n\
\n\
  blur: function() {\n\
    if (this.touchState && this.touchState !== 'ended') {\n\
      this.touchState = 'ended';\n\
    }\n\
    var keys = this.keys;\n\
    var names = this.keyNames;\n\
    for (var i = 0, l = names.length; i < l; i++) {\n\
      var key = names[i];\n\
      if (keys[key] && keys[key] !== 'ended') {\n\
        keys[key] = 'ended';\n\
        this.updateAxis(key, true);\n\
      }\n\
    }\n\
  },\n\
\n\
  calibrateOrientation: function() {\n\
    this.baseOrientationTime = this.orientationTime;\n\
    Vec2.copy(this.baseOrientation, this.orientation);\n\
    Vec2.set(this.orientation);\n\
  },\n\
\n\
  deviceOrientation: function(event) {\n\
    Vec2.copy(this.lastOrientation, this.orientation);\n\
    Vec2.sub(Vec2.set(this.orientation, event.gamma | 0, event.beta | 0), this.baseOrientation);\n\
    this.orientationTime = event.timeStamp / 1000;\n\
    if (!this.baseOrientationTime) {\n\
      this.calibrateOrientation();\n\
    }\n\
  },\n\
\n\
  resolve: function(event) {\n\
    var coords = this.support.touch ? event.targetTouches[0] : event;\n\
    if (coords) {\n\
      this.lastTime = this.time;\n\
      this.time = event.timeStamp / 1000;\n\
      Vec2.copy(this.lastPos, this.position);\n\
      var renderer = Engine.renderer;\n\
      Vec2.set(this.position, (coords.pageX - renderer.margin[0]) / renderer.scale | 0, (coords.pageY - renderer.margin[1]) / renderer.scale | 0);\n\
    }\n\
  },\n\
\n\
  lock: function(key) {\n\
    if (this.locks[key] === this.frame) {\n\
      return false;\n\
    }\n\
    this.locks[key] = this.frame;\n\
    return true;\n\
  },\n\
\n\
  postUpdate: function() {\n\
    switch (this.touchState) {\n\
      case 'began':\n\
        this.touchState = 'stationary';\n\
        break;\n\
      case 'ended':\n\
        this.touchState = null;\n\
        break;\n\
    }\n\
\n\
    var keys = this.keys;\n\
    var names = this.keyNames;\n\
    for (var i = 0, l = names.length; i < l; i++) {\n\
      var key = names[i];\n\
      switch (keys[key]) {\n\
        case 'began':\n\
          keys[key] = 'pressed';\n\
          break;\n\
        case 'ended':\n\
          keys[key] = null;\n\
          break;\n\
      }\n\
    }\n\
\n\
    this.frame = Engine.frame;\n\
\n\
    var event = null;\n\
    var queue = this.queue;\n\
    while ((event = queue[0])) {\n\
      var type = event.type;\n\
      if (this[this.events[type] || type](event) === false) {\n\
        break;\n\
      }\n\
      queue.shift();\n\
    }\n\
    if (!queue.length) {\n\
      this.lastEvent = null;\n\
    }\n\
  }\n\
\n\
};\n\
\n\
new Component('input', Input);\n\
\n\
module.exports = Input;\n\
//@ sourceURL=acmejs/lib/core/input.js"
));
require.register("acmejs/lib/core/sprite.js", Function("exports, require, module",
"'use strict';\n\
\n\
var Vec2 = require('./math').Vec2;\n\
var Component = require('./component');\n\
var Pool = require('./pool');\n\
\n\
/**\n\
 * @class Sprite.Asset\n\
 *\n\
 * Loads and paints a single image file.\n\
 *\n\
 * @constructor\n\
 * Either loaded from source or drawn via callback, created from given width/height.\n\
 *\n\
 * @param {String|Function} srcOrRepaint URL or callback to draw image on demand\n\
 * @param {Number[]} size (optional) Override size for drawing canvas\n\
 * @param {Number} baseScale (optional) Base scale applied to all draws, defaults to 1\n\
 */\n\
function SpriteAsset(srcOrRepaint, size, baseScale) {\n\
\tthis.baseScale = (baseScale != null) ? baseScale : 1;\n\
\tthis.size = Vec2(size);\n\
\tthis.bufferSize = Vec2(size);\n\
\tthis.defaultAlign = Vec2.center;\n\
\tthis.defaultOffset = Vec2();\n\
\tthis.defaultScale = Vec2(1, 1);\n\
\tthis.buffer = document.createElement('canvas');\n\
\tthis.bufferCtx = this.buffer.getContext('2d');\n\
\tthis.scale = 1;\n\
\n\
\t// console.log(typeof srcOrRepaint);\n\
\n\
\tswitch (typeof srcOrRepaint) {\n\
\t\tcase 'string':\n\
\t\t\tthis.src = srcOrRepaint;\n\
\t\t\tvar img = new Image();\n\
\t\t\tthis.img = img;\n\
\t\t\timg.addEventListener('load', this);\n\
\t\t\tthis.loading = true;\n\
\t\t\timg.src = srcOrRepaint;\n\
\t\t\tif (this.loading && img.width && img.height) {\n\
\t\t\t\tthis.handleEvent();\n\
\t\t\t}\n\
\t\t\tbreak;\n\
\t\tcase 'function':\n\
\t\t\tthis.repaint = srcOrRepaint;\n\
\t\t\tthis.refresh();\n\
\t\t\tbreak;\n\
\t\tcase 'object':\n\
\t\t\tthis.repaint = this.repaintOnComponent;\n\
\t\t\tthis.repaintSrc = srcOrRepaint;\n\
\t\t\tthis.refresh();\n\
\t\t\tbreak;\n\
\t}\n\
}\n\
\n\
SpriteAsset.prototype = {\n\
\n\
\ttoString: function() {\n\
\t\tvar url = (this.buffer) ? this.buffer.toDataURL() : 'Pending';\n\
\t\treturn \"SpriteAsset \" + (Vec2.toString(this.size)) + \" \" +\n\
\t\t\t(Vec2.toString(this.bufferSize)) + \"\\n\
\" +\n\
\t\t\t(this.src || this.repaint) + \"\\n\
\" +\n\
\t\t\turl;\n\
\t},\n\
\n\
\trepaintOnComponent: function() {\n\
\t\tthis.repaintSrc.onRepaint(this.bufferCtx, this);\n\
\t},\n\
\n\
\thandleEvent: function() {\n\
\t\t// console.log('Loaded ' + this);\n\
\t\tif (!this.loading) {\n\
\t\t\treturn;\n\
\t\t}\n\
\t\tthis.loading = false;\n\
\t\tVec2.set(this.size, this.img.width, this.img.height);\n\
\t\tthis.refresh();\n\
\t},\n\
\n\
\t/**\n\
\t * Draw whole or sprite of image to canvas.\n\
\t *\n\
\t * Draws only if image is loaded.\n\
\t *\n\
\t * @param {Object} ctx 2d-canvas context\n\
\t * @param {Number[]} toPos (optional) Position to draw to.\n\
\t * @param {Number[]} align (optional) Align draw position, between lower-left [-1, -1] and upper-right [1, 1]\n\
\t * @param {Number[]} size (optional) Target size\n\
\t * @param {Number[]} fromPos (optional) Source position (for sprites)\n\
\t * @param {Number[]} scale (optional) Target scaling, applied to size\n\
\t */\n\
\tdraw: function(ctx, toPos, align, size, fromPos, scale) {\n\
\t\tif (!this.ready) {\n\
\t\t\treturn;\n\
\t\t}\n\
\t\tif (!toPos) {\n\
\t\t\ttoPos = Vec2.zero;\n\
\t\t}\n\
\t\tif (!align) {\n\
\t\t\talign = this.defaultAlign;\n\
\t\t}\n\
\t\tif (!size) {\n\
\t\t\tsize = this.bufferSize;\n\
\t\t}\n\
\t\tif (!fromPos) {\n\
\t\t\tfromPos = this.defaultOffset;\n\
\t\t}\n\
\t\tif (!scale) {\n\
\t\t\tscale = this.defaultScale;\n\
\t\t}\n\
\t\tctx.drawImage(this.buffer,\n\
\t\t\tfromPos[0] | 0, fromPos[1] | 0,\n\
\t\t\tsize[0], size[1],\n\
\t\t\ttoPos[0] - size[0] / 2 * (align[0] + 1) | 0,\n\
\t\t\ttoPos[1] - size[1] / 2 * (align[1] + 1) | 0,\n\
\t\t\tsize[0] * scale[0], size[1] * scale[1]\n\
\t\t);\n\
\t},\n\
\n\
\trepaint: function() {\n\
\t\tvar size = this.size;\n\
\t\tthis.buffer.width = size[0];\n\
\t\tthis.buffer.height = size[1];\n\
\t\tthis.bufferCtx.drawImage(this.img, 0, 0, size[0], size[1]);\n\
\t\tthis.sample();\n\
\t},\n\
\n\
\tsample: function() {\n\
\t\tvar scale = this.scale;\n\
\t\tvar size = this.size;\n\
\t\tvar bufferCtx = this.bufferCtx;\n\
\t\tvar data = bufferCtx.getImageData(0, 0, size[0], size[1]).data;\n\
\t\tthis.buffer.width = this.bufferSize[0];\n\
\t\tthis.buffer.height = this.bufferSize[1];\n\
\t\tfor (var x = 0, w = size[0], h = size[1]; x <= w; x += 1) {\n\
\t\t\tfor (var y = 0; y <= h; y += 1) {\n\
\t\t\t\tvar i = (y * size[0] + x) * 4;\n\
\t\t\t\tbufferCtx.fillStyle = \"rgba(\" + data[i] + \", \" + data[i + 1] + \", \" +\n\
\t\t\t\t\tdata[i + 2] + \", \" + (data[i + 3] / 255) + \")\";\n\
\t\t\t\tbufferCtx.fillRect(x * scale, y * scale, scale, scale);\n\
\t\t\t}\n\
\t\t}\n\
\t},\n\
\n\
\trefresh: function(scale) {\n\
\t\t// console.log('Refresh');\n\
\t\tscale = (scale || 1) * this.baseScale;\n\
\t\tif (this.ready && this.scale === scale) {\n\
\t\t\treturn;\n\
\t\t}\n\
\t\tthis.scale = scale;\n\
\t\tthis.buffer.width = this.bufferSize[0] = this.size[0] * scale | 0;\n\
\t\tthis.buffer.height = this.bufferSize[1] = this.size[1] * scale | 0;\n\
\t\t// Vec2.scale(this.bufferSize, -0.5, this.defaultOffset);\n\
\t\tthis.repaint(this.bufferCtx, this);\n\
\t\tthis.ready = true;\n\
\t}\n\
\n\
};\n\
\n\
/**\n\
 * @class Sprite.Sheet\n\
 *\n\
 * Sprite-sheet for animations.\n\
 *\n\
 * @constructor\n\
 * Create new sheet from set of pre-defined frames or automtically determined frames, given sequence size.\n\
 *\n\
 * @param {Object} attributes sprites, frames, speed, size, align, sequences\n\
 */\n\
function SpriteSheet(attributes) {\n\
\tvar sprites = attributes.sprites || [];\n\
\tthis.sprites = Array.isArray(sprites) ? sprites : [sprites];\n\
\tthis.frames = [];\n\
\tif (Array.isArray(attributes.frames)) {\n\
\t\tvar frames = attributes.frames;\n\
\t\tfor (var i = 0, l = frames.length; i < l; i++) {\n\
\t\t\tthis.frames.push(frames[i]);\n\
\t\t}\n\
\t}\n\
\tthis.defaults = {};\n\
\tthis.defaults.speed = attributes.speed || 0.2;\n\
\tthis.defaults.size = attributes.size || Vec2(1, 1);\n\
\tthis.defaults.align = attributes.align || Vec2.center;\n\
\tthis.sequences = {};\n\
\tvar\tsequences = attributes.sequences || {};\n\
\tfor (var id in sequences) {\n\
\t\tthis.addSequence(id, sequences[id]);\n\
\t}\n\
}\n\
\n\
SpriteSheet.prototype = {\n\
\n\
\t/**\n\
\t * Add sequence to spritesheet.\n\
\t *\n\
\t * Sequences are defined as short-form by Array:\n\
\t *   [frameIndexes, next || null, speed || defaultSpeed || sprite || 0]\n\
\t * or Object:\n\
\t *   {frames: [], next: \"id\", speed: seconds, sprite: 0}\n\
\t *\n\
\t * @param {String} id       Sequence name (walk, jump, etc)\n\
\t * @param {Array|Object} sequence Array or object\n\
\t */\n\
\taddSequence: function(id, sequence) {\n\
\t\tif (Array.isArray(sequence)) {\n\
\t\t\t// Convert short form Array to Object\n\
\t\t\tvar frames = [];\n\
\t\t\tfor (var frame = sequence[0], l = sequence[1]; frame <= l; frame++) {\n\
\t\t\t\tframes.push(frame);\n\
\t\t\t}\n\
\t\t\tsequence = {\n\
\t\t\t\tframes: frames,\n\
\t\t\t\tnext: sequence[2] || null,\n\
\t\t\t\tspeed: sequence[3] || this.defaults.speed,\n\
\t\t\t\tname: id,\n\
\t\t\t\tsprite: sequence[4] || 0\n\
\t\t\t};\n\
\t\t}\n\
\t\tif (sequence.next === true) {\n\
\t\t\tsequence.next = id;\n\
\t\t}\n\
\t\tif (!sequence.speed) {\n\
\t\t\tsequence.speed = this.defaults.speed;\n\
\t\t}\n\
\n\
\t\tthis.sequences[id] = sequence;\n\
\t\tif (!this.defaultSequence) {\n\
\t\t\tthis.defaultSequence = id;\n\
\t\t}\n\
\t},\n\
\n\
\tprepare: function() {\n\
\t\tvar sprites = this.sprites;\n\
\t\tfor (var i = 0, l = sprites.length; i < l; i++) {\n\
\t\t\tif (!sprites[i].ready) {\n\
\t\t\t\treturn false;\n\
\t\t\t}\n\
\t\t}\n\
\t\tif (!this.frames.length) {\n\
\t\t\tvar defaults = this.defaults;\n\
\t\t\tvar size = defaults.size;\n\
\t\t\tvar align = defaults.align;\n\
\t\t\tfor (var j = 0, l = sprites.length; j < l; j++) {\n\
\t\t\t\tvar sprite = sprites[j];\n\
\t\t\t\tvar cols = sprite.size[0] / size[0] | 0;\n\
\t\t\t\tvar rows = sprite.size[1] / size[1] | 0;\n\
\t\t\t\t// debugger;\n\
\t\t\t\tfor (var y = 0; y < rows; y++) {\n\
\t\t\t\t\tfor (var x = 0; x < cols; x++) {\n\
\t\t\t\t\t\tthis.frames.push({\n\
\t\t\t\t\t\t\tsprite: sprite,\n\
\t\t\t\t\t\t\tposition: Vec2(x * size[0], y * size[1]),\n\
\t\t\t\t\t\t\tsize: size,\n\
\t\t\t\t\t\t\talign: align || Vec2.center\n\
\t\t\t\t\t\t});\n\
\t\t\t\t\t}\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t}\n\
\t\tthis.ready = true;\n\
\t\treturn true;\n\
\t},\n\
\n\
\tdraw: function(ctx, idx) {\n\
\t\tif (!this.ready && !this.prepare()) {\n\
\t\t\treturn;\n\
\t\t}\n\
\t\tvar frame = this.frames[idx || 0];\n\
\t\tframe.sprite.draw(ctx, null, frame.align, frame.size, frame.position);\n\
\t}\n\
\n\
};\n\
\n\
/**\n\
 * @class Sprite.Tween\n\
 *\n\
 * Sprite Tween lets components draw animation sequences from Sheets.\n\
 *\n\
 * @extends Component\n\
 */\n\
function SpriteTween() {}\n\
\n\
SpriteTween.prototype = {\n\
\n\
\tattributes: {\n\
\t\tasset: null,\n\
\t\tspeed: null,\n\
\t\tsequence: null,\n\
\t\toffset: 0,\n\
\t\tcomposite: null\n\
\t},\n\
\n\
\tcreate: function(attributes) {\n\
\t\tthis.asset = attributes.asset;\n\
\t\tthis.composite = attributes.composite;\n\
\t\tthis.sequence = attributes.sequence;\n\
\t\tthis.speed = attributes.speed;\n\
\t\tthis.isSheet = this.asset instanceof SpriteSheet;\n\
\t\tif (this.isSheet) {\n\
\t\t\tthis.frame = 0;\n\
\t\t\tif (this.speed == null) {\n\
\t\t\t\tthis.speed = this.asset.defaults.speed;\n\
\t\t\t}\n\
\t\t\tthis.dtime = attributes.offset;\n\
\t\t\tif (!this.sequence) {\n\
\t\t\t\tthis.sequence = this.asset.defaultSequence;\n\
\t\t\t}\n\
\t\t}\n\
\t},\n\
\n\
\tpreRender: function(dt) {\n\
\t\tif (this.isSheet && !this.paused) {\n\
\t\t\tvar dtime = (this.dtime += dt);\n\
\t\t\tif (this.sequence) {\n\
\t\t\t\tvar sequence = this.asset.sequences[this.sequence];\n\
\t\t\t\tvar speed = sequence.speed;\n\
\t\t\t\tvar frames = sequence.frames;\n\
\t\t\t\tvar frameCount = frames.length;\n\
\t\t\t\tif (dtime >= frameCount * speed) {\n\
\t\t\t\t\tthis.entity.trigger('onSequenceEnd');\n\
\t\t\t\t\tif (sequence.next) {\n\
\t\t\t\t\t\tif (sequence.next !== this.sequence) {\n\
\t\t\t\t\t\t\treturn this.goto(sequence.next);\n\
\t\t\t\t\t\t}\n\
\t\t\t\t\t} else {\n\
\t\t\t\t\t\tthis.pause();\n\
\t\t\t\t\t\treturn this;\n\
\t\t\t\t\t}\n\
\t\t\t\t\tdtime = dtime % (frameCount * speed);\n\
\t\t\t\t}\n\
\t\t\t\tthis.frame = frames[dtime / speed | 0];\n\
\t\t\t} else {\n\
\t\t\t\tvar frames = this.asset.frames;\n\
\t\t\t\tvar frameCount = frames.length;\n\
\t\t\t\tvar speed = this.speed;\n\
\t\t\t\tvar dtime = dtime % (frameCount * speed);\n\
\t\t\t\tvar frame = dtime / speed | 0;\n\
\t\t\t\tif (frame < this.frame) {\n\
\t\t\t\t\tthis.entity.trigger('onSequenceEnd');\n\
\t\t\t\t}\n\
\t\t\t\tthis.frame = dtime / speed | 0;\n\
\t\t\t}\n\
\t\t}\n\
\t},\n\
\n\
\trender: function(ctx) {\n\
\t\tctx.save();\n\
\t\tthis.transform.applyMatrix(ctx);\n\
\t\tif (this.composite) {\n\
\t\t\tctx.globalCompositeOperation = this.composite;\n\
\t\t}\n\
\t\tthis.asset.draw(ctx, this.frame);\n\
\t\tctx.restore();\n\
\t},\n\
\n\
\tpause: function() {\n\
\t\tthis.paused = true;\n\
\t\treturn this;\n\
\t},\n\
\n\
\tplay: function() {\n\
\t\tthis.paused = false;\n\
\t\treturn this;\n\
\t},\n\
\n\
\tgoto: function(id) {\n\
\t\tif (isNaN(id)) {\n\
\t\t\tif (this.sequence !== id) {\n\
\t\t\t\tthis.dtime = 0;\n\
\t\t\t\tthis.sequence = id;\n\
\t\t\t\tif (this.paused) {\n\
\t\t\t\t\tthis.paused = false;\n\
\t\t\t\t\tthis.preRender(0);\n\
\t\t\t\t\tthis.paused = true;\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t} else {\n\
\t\t\tthis.sequence = null;\n\
\t\t\tthis.frameIndex = id;\n\
\t\t}\n\
\t\treturn this;\n\
\t}\n\
\n\
};\n\
\n\
new Component('spriteTween', SpriteTween);\n\
\n\
module.exports.Asset = SpriteAsset;\n\
module.exports.Tween = SpriteTween;\n\
module.exports.Sheet = SpriteSheet;\n\
//@ sourceURL=acmejs/lib/core/sprite.js"
));
require.register("acmejs/lib/core/border.js", Function("exports, require, module",
"'use strict';\n\
\n\
var Component = require('./component');\n\
var Pool = require('./pool');\n\
var Vec2 = require('./math').Vec2;\n\
var Engine = require('./engine');\n\
\n\
/**\n\
 * @class Border\n\
 *\n\
 * Border lets entities react on contact with the canvas borders.\n\
 *\n\
 * @extends Component\n\
 * @property {String} [mode=\"bounce\"] Reaction to contact with border, \"bounce\", \"mirror\", \"kill\"\n\
 * @property {Number} [restitution=1] Restitution on bounce\n\
 */\n\
function Border() {}\n\
\n\
Border.prototype = {\n\
\n\
\tattributes: {\n\
\t\tmode: 'bounce',\n\
\t\trestitution: 1\n\
\t},\n\
\n\
\tcreate: function(attributes) {\n\
\t\tthis.mode = attributes.mode;\n\
\t\tthis.restitution = attributes.restitution;\n\
\t}\n\
\n\
};\n\
\n\
var pos = Vec2();\n\
// TODO: Make topLeft/bottomRight\n\
var horizontal = Vec2();\n\
var vertical = Vec2();\n\
\n\
Border.simulate = function(dt) {\n\
\tvar size = Engine.renderer.content;\n\
\tvar viewport = Engine.renderer.position;\n\
\tVec2.set(horizontal, viewport[0], viewport[0] + size[0]);\n\
\tVec2.set(vertical, viewport[1], viewport[1] + size[1]);\n\
\n\
\tvar borders = this.heap;\n\
\tfor (var i = 0, l = borders.length; i < l; i++) {\n\
\t\tvar border = borders[i];\n\
\t\tif (!border.enabled) {\n\
\t\t\tcontinue;\n\
\t\t}\n\
\n\
\t\tvar entity = border.entity;\n\
\t\tvar restitution = border.restitution;\n\
\t\tvar mode = border.mode;\n\
\t\tvar kinetic = border.kinetic;\n\
\n\
\t\tvar vel = null;\n\
\t\tif (kinetic) {\n\
\t\t\tif (!kinetic.enabled || kinetic.sleeping) {\n\
\t\t\t\tcontinue;\n\
\t\t\t}\n\
\t\t\tvel = kinetic.velocity;\n\
\t\t}\n\
\n\
\t\tvar mirror = (mode === 'mirror');\n\
\t\tvar bounce = (mode === 'bounce' && vel);\n\
\t\tVec2.copy(pos, entity.transform.position);\n\
\n\
\t\tvar radius = entity.bounds.radius;\n\
\t\tif (mirror) {\n\
\t\t\tradius *= -1;\n\
\t\t}\n\
\n\
\t\tvar contact = 0;\n\
\n\
\t\t// Horizontal\n\
\t\tvar diff = pos[0] - radius - horizontal[0];\n\
\t\tif (diff < 0) {\n\
\t\t\tif (mirror) {\n\
\t\t\t\tpos[0] = horizontal[1] - radius;\n\
\t\t\t} else {\n\
\t\t\t\tpos[0] -= diff;\n\
\t\t\t\tif (bounce) {\n\
\t\t\t\t\tvel[0] *= -restitution;\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t\tcontact = -1;\n\
\t\t} else {\n\
\t\t\tdiff = pos[0] + radius - horizontal[1];\n\
\t\t\tif (diff > 0) {\n\
\t\t\t\tif (mirror) {\n\
\t\t\t\t\tpos[0] = radius;\n\
\t\t\t\t} else {\n\
\t\t\t\t\tpos[0] -= diff;\n\
\t\t\t\t\tif (bounce) {\n\
\t\t\t\t\t\tvel[0] *= -restitution;\n\
\t\t\t\t\t}\n\
\t\t\t\t}\n\
\t\t\t\tcontact = -1;\n\
\t\t\t} else {\n\
\t\t\t\t// Vertical\n\
\t\t\t\tdiff = pos[1] - radius - vertical[0];\n\
\n\
\t\t\t\tif (diff < 0) {\n\
\t\t\t\t\tif (mirror) {\n\
\t\t\t\t\t\tpos[1] = vertical[1] - radius;\n\
\t\t\t\t\t} else {\n\
\t\t\t\t\t\tpos[1] -= diff;\n\
\t\t\t\t\t\tif (bounce) {\n\
\t\t\t\t\t\t\tvel[1] *= -restitution;\n\
\t\t\t\t\t\t}\n\
\t\t\t\t\t}\n\
\t\t\t\t\tcontact = 1;\n\
\t\t\t\t} else {\n\
\t\t\t\t\tdiff = pos[1] + radius - vertical[1];\n\
\t\t\t\t\tif (diff > 0) {\n\
\t\t\t\t\t\tif (mirror) {\n\
\t\t\t\t\t\t\tpos[1] = radius;\n\
\t\t\t\t\t\t} else {\n\
\t\t\t\t\t\t\tpos[1] -= diff;\n\
\t\t\t\t\t\t\tif (bounce) {\n\
\t\t\t\t\t\t\t\tvel[1] *= -restitution;\n\
\t\t\t\t\t\t\t}\n\
\t\t\t\t\t\t}\n\
\t\t\t\t\t\tcontact = 1;\n\
\t\t\t\t\t}\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\t// We contact\n\
\t\tif (contact) {\n\
\t\t\tentity.transform.compose(pos);\n\
\t\t\t/**\n\
\t\t\t * @event onBorder Fired on contact\n\
\t\t\t * @param {Number[]} contact Contact point\n\
\t\t\t */\n\
\t\t\tentity.trigger('onBorder', contact);\n\
\t\t\tif (border.mode === 'kill') {\n\
\t\t\t\tentity.destroy();\n\
\t\t\t}\n\
\t\t}\n\
\t}\n\
};\n\
\n\
new Component('border', Border);\n\
\n\
module.exports = Border;\n\
//@ sourceURL=acmejs/lib/core/border.js"
));
require.register("acmejs/lib/core/collider.js", Function("exports, require, module",
"'use strict';\n\
\n\
var Component = require('./component');\n\
var Pool = require('./pool');\n\
var Vec2 = require('./math').Vec2;\n\
var Engine = require('./engine');\n\
\n\
/**\n\
 * Collider\n\
 *\n\
 * Circle only\n\
 *\n\
 * http://jsperf.com/circular-collision-detection/2\n\
 * https://sites.google.com/site/t3hprogrammer/research/circle-circle-collision-tutorial#TOC-Dynamic-Circle-Circle-Collision\n\
 * http://gamedev.tutsplus.com/tutorials/implementation/when-worlds-collide-simulating-circle-circle-collisions/\n\
 *\n\
 * @extends Component\n\
 */\n\
function Collider() {}\n\
\n\
Collider.prototype = {\n\
\n\
  attributes: {\n\
    trigger: false,\n\
    include: null,\n\
    exclude: null\n\
  },\n\
\n\
  create: function(attributes) {\n\
    this.trigger = attributes.trigger;\n\
    this.include = attributes.include;\n\
    this.exclude = attributes.exclude;\n\
  }\n\
\n\
};\n\
\n\
Collider.simulate = function(dt) {\n\
  var colliders = this.heap;\n\
  var i = colliders.length;\n\
  while (i--) {\n\
    var collider1 = colliders[i];\n\
    if (!collider1.enabled) {\n\
      continue;\n\
    }\n\
    var j = i;\n\
    while (j-- && collider1.enabled) {\n\
      var collider2 = colliders[j];\n\
      var kinetic1 = collider1.kinetic;\n\
      var kinetic2 = collider2.kinetic;\n\
      var entity1 = collider1.entity;\n\
      var entity2 = collider2.entity;\n\
\n\
      if (!collider2.enabled ||\n\
          (kinetic1.sleeping && kinetic2.sleeping) ||\n\
          (collider1.include && !collider2[collider1.include]) ||\n\
          (collider2.include && !collider1[collider2.include]) ||\n\
          (collider1.exclude && collider2[collider1.exclude]) ||\n\
          (collider2.exclude && collider1[collider2.exclude])) {\n\
        continue;\n\
      }\n\
\n\
      var radius1 = entity1.bounds.radius;\n\
      var radius2 = entity2.bounds.radius;\n\
      var pos1 = entity1.transform.position;\n\
      var pos2 = entity2.transform.position;\n\
      var radiusSum = radius1 + radius2;\n\
\n\
      var diffSq = Vec2.distSq(pos1, pos2);\n\
      if (diffSq > radiusSum * radiusSum) {\n\
        continue;\n\
      }\n\
\n\
      Vec2.norm(Vec2.sub(pos1, pos2, p));\n\
      var diff = Math.sqrt(diffSq);\n\
\n\
      if (collider1.trigger || collider2.trigger) {\n\
        triggerEvent.normal = p;\n\
        triggerEvent.diff = diff;\n\
        triggerEvent.entity = entity2;\n\
        entity1.trigger('onTrigger', triggerEvent);\n\
\n\
        triggerEvent.entity = entity1;\n\
        entity2.trigger('onTrigger', triggerEvent);\n\
        continue;\n\
      }\n\
\n\
      diff -= radiusSum;\n\
      var vel1 = kinetic1.velocity;\n\
      var vel2 = kinetic2.velocity;\n\
      var mass1 = kinetic1.mass || 1;\n\
      var mass2 = kinetic2.mass || 1;\n\
\n\
      if (diff < 0) {\n\
        Vec2.add(\n\
          pos1,\n\
          Vec2.scale(p, -diff * 2 * radius1 / radiusSum, cache)\n\
        );\n\
        Vec2.add(\n\
          pos2,\n\
          Vec2.scale(p, diff * 2 * radius2 / radiusSum, cache)\n\
        );\n\
      }\n\
\n\
      // normal vector to collision direction\n\
      Vec2.perp(p, n);\n\
\n\
      var vp1 = Vec2.dot(vel1, p); // velocity of P1 along collision direction\n\
      var vn1 = Vec2.dot(vel1, n); // velocity of P1 normal to collision direction\n\
      var vp2 = Vec2.dot(vel2, p); // velocity of P2 along collision direction\n\
      var vn2 = Vec2.dot(vel2, n); // velocity of P2 normal to collision\n\
\n\
      // fully elastic collision (energy & momentum preserved)\n\
      var vp1After = (mass1 * vp1 + mass2 * (2 * vp2 - vp1)) / (mass1 + mass2);\n\
      var vp2After = (mass1 * (2 * vp1 - vp2) + mass2 * vp2) / (mass1 + mass2);\n\
\n\
      Vec2.add(\n\
        Vec2.scale(p, vp1After, pCache),\n\
        Vec2.scale(n, vn1, nCache),\n\
        vel1\n\
      );\n\
      Vec2.add(\n\
        Vec2.scale(p, vp2After, pCache),\n\
        Vec2.scale(n, vn2, nCache),\n\
        vel2\n\
      );\n\
\n\
      collideEvent.normal = n;\n\
      collideEvent.entity = entity2;\n\
      entity1.trigger('onCollide', collideEvent);\n\
\n\
      collideEvent.entity = entity1;\n\
      entity2.trigger('onCollide', collideEvent);\n\
    }\n\
  }\n\
};\n\
\n\
var p = Vec2();\n\
var n = Vec2();\n\
var cache = Vec2();\n\
var pCache = Vec2();\n\
var nCache = Vec2();\n\
var triggerEvent = {};\n\
var collideEvent = {};\n\
\n\
new Component('collider', Collider);\n\
\n\
module.exports = Collider;\n\
//@ sourceURL=acmejs/lib/core/collider.js"
));
require.register("acmejs/lib/core/kinetic.js", Function("exports, require, module",
"'use strict';\n\
\n\
var Component = require('./component');\n\
var Pool = require('./pool');\n\
var Vec2 = require('./math').Vec2;\n\
\n\
/**\n\
 * @class Kinetic\n\
 * Velocity integrator\n\
 *\n\
 * Related links:\n\
 * http://hg.positiontspectacular.com/toxiclibs/src/689ddcd9bea3/src.physics/toxi/physics2d\n\
 * @extends Component\n\
 */\n\
function Kinetic() {\n\
\tthis.velocity = Vec2();\n\
\tthis.force = Vec2();\n\
\tthis.continuous = Vec2();\n\
\tthis.angularVelocity = Vec2();\n\
\tthis.torque = Vec2();\n\
\tthis.continuousTorque = Vec2();\n\
}\n\
\n\
Kinetic.prototype = {\n\
\n\
\tattributes: {\n\
\t\tmass: 1,\n\
\t\tdrag: 0.999,\n\
\t\tfriction: 15,\n\
\t\tfixed: false,\n\
\t\tmaxVelocity: 75,\n\
\t\tmaxForce: 2000,\n\
\t\tforce: Vec2(),\n\
\t\tcontinuous: Vec2(),\n\
\t\tvelocity: Vec2(),\n\
\t\tsleepVelocity: 1,\n\
\t\tfast: false\n\
\t},\n\
\n\
\tcreate: function(attributes) {\n\
\t\tthis.mass = attributes.mass;\n\
\t\tthis.drag = attributes.drag;\n\
\t\tthis.friction = attributes.friction;\n\
\t\tthis.fixed = attributes.fixed;\n\
\t\tthis.maxVelocity = attributes.maxVelocity;\n\
\t\tthis.maxForce = attributes.maxForce;\n\
\t\tthis.fast = attributes.fast;\n\
\t\tthis.sleepVelocity = attributes.sleepVelocity;\n\
\t\tVec2.copy(this.velocity, attributes.velocity);\n\
\t\tVec2.copy(this.force, attributes.force);\n\
\t\tVec2.copy(this.continuous, attributes.continuous);\n\
\t\tthis.sleeping = false;\n\
\t},\n\
\n\
\tget direction(rad) {\n\
\t\treturn Vec2.rad(this.velocity);\n\
\t},\n\
\n\
\tset direction(rad) {\n\
\t\tVec2.rotateTo(this.velocity, this.speed);\n\
\t},\n\
\n\
\tget speed() {\n\
\t\treturn Vec2.len(this.velocity);\n\
\t},\n\
\n\
\tset speed(length) {\n\
\t\tVec2.norm(this.velocity, null, length);\n\
\t},\n\
\n\
\tapplyForce: function(impulse, ignoreMass, continues) {\n\
\t\tVec2.add(\n\
\t\t\t(continues) ? this.continuous : this.force,\n\
\t\t\t(!ignoreMass && this.mass !== 1) ?\n\
\t\t\t\tVec2.scale(impulse, 1 / (this.mass || 1), cache) :\n\
\t\t\t\timpulse\n\
\t\t);\n\
\t},\n\
\n\
\tapplyContinuesForce: function(force) {\n\
\t\tVec2.add(this.continuous, force);\n\
\t}\n\
\n\
};\n\
\n\
Kinetic.simulate = function(dt) {\n\
\tvar EPSILON = Math.EPSILON;\n\
\tvar dtSq = dt * dt;\n\
\n\
\tvar kinetics = this.heap;\n\
\tfor (var i = 0, l = kinetics.length; i < l; i++) {\n\
\t\tvar kinetic = kinetics[i];\n\
\t\tif (!kinetic.enabled || kinetic.fixed) {\n\
\t\t\tcontinue;\n\
\t\t}\n\
\t\tvar velocity = kinetic.velocity;\n\
\t\tvar force = Vec2.add(kinetic.force, kinetic.continuous);\n\
\n\
\t\t// Particle\n\
\t\tif (kinetic.fast) {\n\
\t\t\tif (kinetic.maxForce) {\n\
\t\t\t\tVec2.limit(force, kinetic.maxForce);\n\
\t\t\t}\n\
\t\t\tVec2.add(velocity, Vec2.scale(force, dt));\n\
\t\t\tVec2.set(force);\n\
\t\t\tif (kinetic.maxVelocity) {\n\
\t\t\t\tVec2.limit(velocity, kinetic.maxVelocity);\n\
\t\t\t}\n\
\t\t\tVec2.add(kinetic.transform.position, Vec2.scale(velocity, dt, cache));\n\
\t\t\tcontinue;\n\
\t\t}\n\
\n\
\t\t// Apply scene gravity\n\
\t\tvar gravity = kinetic.root.gravity || Kinetic.gravity;\n\
\t\tif (gravity && kinetic.mass > EPSILON) {\n\
\t\t\tVec2.add(\n\
\t\t\t\tforce,\n\
\t\t\t\t(kinetic.mass !== 1) ?\n\
\t\t\t\t\tVec2.scale(gravity, 1 / kinetic.mass, cache) :\n\
\t\t\t\t\tgravity\n\
\t\t\t);\n\
\t\t}\n\
\n\
\t\t// Apply friction\n\
\t\tif (kinetic.friction) {\n\
\t\t\tVec2.add(\n\
\t\t\t\tforce,\n\
\t\t\t\tVec2.scale(\n\
\t\t\t\t\tVec2.norm(velocity, cache),\n\
\t\t\t\t\t-kinetic.friction\n\
\t\t\t\t)\n\
\t\t\t);\n\
\t\t}\n\
\n\
\t\tif (kinetic.maxForce) {\n\
\t\t\tVec2.limit(force, kinetic.maxForce);\n\
\t\t}\n\
\n\
\n\
\t\t/*\n\
\t\t// http://www.compsoc.man.ac.uk/~lucky/Democritus/Theory/verlet.html#velver\n\
\t\t// http://en.wikipedia.org/wiki/Verlet_integration#Velocity_Verlet\n\
\t\tvar lastForce = Vec2.scale(kinetic.lastForce, dt / 2);\n\
\n\
\t\t// calculates a half-step velocity\n\
\t\tVec2.add(velocity, lastForce);\n\
\t\tVec2.add(\n\
\t\t\tkinetic.transform.position,\n\
\t\t\tVec2.scale(velocity, dt, cache)\n\
\t\t);\n\
\n\
\t\t// Save force for next iteration\n\
\t\tVec2.copy(lastForce, force);\n\
\n\
\t\t// Save force for next iteration\n\
\t\tVec2.add(\n\
\t\t\tvelocity,\n\
\t\t\tVec2.scale(force, dt / 2)\n\
\t\t);\n\
\t\t*/\n\
\n\
\t\tVec2.add(\n\
\t\t\tVec2.add(\n\
\t\t\t\tkinetic.transform.position,\n\
\t\t\t\tVec2.scale(velocity, dt, velocityCache)\n\
\t\t\t),\n\
\t\t\tVec2.scale(force, 0.5 * dtSq, forceCache)\n\
\t\t);\n\
\n\
\t\tVec2.add(\n\
\t\t\tvelocity,\n\
\t\t\tVec2.scale(force, dt, forceCache)\n\
\t\t);\n\
\n\
\t\t// Apply drag\n\
\t\tif (kinetic.drag < 1) {\n\
\t\t\tVec2.scale(velocity, kinetic.drag);\n\
\t\t}\n\
\n\
\t\t// Limit velocity\n\
\t\tif (kinetic.maxVelocity) {\n\
\t\t\tVec2.limit(velocity, kinetic.maxVelocity);\n\
\t\t}\n\
\n\
\t\t// Reset force\n\
\t\tVec2.set(force);\n\
\n\
\t\tvar sleepVelocity = kinetic.sleepVelocity;\n\
\t\tif (sleepVelocity) {\n\
\t\t\tif (Vec2.lenSq(velocity) <= sleepVelocity * sleepVelocity) {\n\
\t\t\t\tif (!kinetic.sleeping) {\n\
\t\t\t\t\tVec2.set(velocity);\n\
\t\t\t\t\tkinetic.sleeping = true;\n\
\t\t\t\t\tkinetic.entity.triggerUp('onKineticSleep', kinetic);\n\
\t\t\t\t}\n\
\t\t\t} else {\n\
\t\t\t\tif (kinetic.sleeping) {\n\
\t\t\t\t\tkinetic.sleeping = false;\n\
\t\t\t\t\tkinetic.entity.triggerUp('onKineticWake', kinetic);\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t}\n\
\t}\n\
};\n\
\n\
var cache = Vec2();\n\
var velocityCache = Vec2();\n\
var forceCache = Vec2();\n\
\n\
new Component('kinetic', Kinetic);\n\
\n\
module.exports = Kinetic;\n\
//@ sourceURL=acmejs/lib/core/kinetic.js"
));
require.register("acmejs/lib/core/boid.js", Function("exports, require, module",
"'use strict';\n\
\n\
var Component = require('./component');\n\
var Pool = require('./pool');\n\
var Vec2 = require('./math').Vec2;\n\
var Kinetic = require('./kinetic');\n\
\n\
/**\n\
 * @class Boid\n\
 * Steering behaviour\n\
 * - http://www.openprocessing.org/sketch/7493\n\
 * - http://www.openprocessing.org/sketch/11045\n\
 * - https://github.com/paperjs/paper.js/blob/master/examples/Paperjs.org/Tadpoles.html\n\
 *\n\
 * @extends Component\n\
 *\n\
 * @constructor\n\
 * @param {Number} [perception=100]\n\
 * @param {Number} [aura=100]\n\
 */\n\
function Boid() {\n\
\tthis.mod = 2;\n\
\tthis.cohesionMod = 1;\n\
\tthis.avoidanceMod = 2;\n\
\tthis.imitationMod = 1;\n\
}\n\
\n\
Boid.prototype = {\n\
\n\
\tattributes: {\n\
\t\tperception: 100,\n\
\t\taura: 25\n\
\t},\n\
\n\
\tcreate: function(attributes) {\n\
\t\tthis.perception = attributes.perception;\n\
\t\tthis.aura = attributes.aura;\n\
\t\tif (!this.aura && this.bounds) {\n\
\t\t\tthis.aura = this.bounds.radius * 2;\n\
\t\t}\n\
\t\tthis.perceptionSq = this.perception * this.perception;\n\
\t\tthis.auraSq = this.aura * this.aura;\n\
\t}\n\
\n\
};\n\
\n\
var cohesion = Vec2();\n\
var avoidance = Vec2();\n\
var imitation = Vec2();\n\
var distance = Vec2();\n\
var impulse = Vec2();\n\
\n\
Boid.fixedUpdate = function(dt) {\n\
\tvar boids = this.heap;\n\
\tvar len = boids.length;\n\
\tvar i = len;\n\
\n\
\twhile (i--) {\n\
\t\tvar boid1 = boids[i];\n\
\t\tif (!boid1.enabled) {\n\
\t\t\tcontinue;\n\
\t\t}\n\
\n\
\t\tvar entity1 = boid1.entity;\n\
\t\tvar pos1 = entity1.transform.position;\n\
\t\tvar vel = entity1.kinetic.velocity;\n\
\n\
\t\tvar avoidanceCount = 0;\n\
\t\tvar imitationCount = 0;\n\
\t\tvar cohesionCount = 0;\n\
\t\tVec2.set(impulse);\n\
\n\
\t\tvar j = len;\n\
\t\twhile (j--) {\n\
\t\t\tvar boid2 = boids[j];\n\
\t\t\tif (!boid2.enabled || boid1 === boid2) {\n\
\t\t\t\tcontinue;\n\
\t\t\t}\n\
\n\
\t\t\tvar entity2 = boid2.entity;\n\
\t\t\tvar pos2 = entity2.transform.position;\n\
\n\
\t\t\tvar diffSq = Vec2.distSq(pos1, pos2);\n\
\t\t\tif (diffSq < boid1.perceptionSq && diffSq) {\n\
\t\t\t\tVec2.sub(pos2, pos1, distance);\n\
\t\t\t\t// Vec2.scale(distance, Math.sqrt(entity1.kinetic.mass / entity2.kinetic.mass));\n\
\n\
\t\t\t\t// diff = Math.sqrt(diffSq)\n\
\t\t\t\t// Vec2.scale(distance, Math.quadInOut(diff / boid1.perception), cache)\n\
\n\
\t\t\t\t// Cohesion : try to approach other boids\n\
\t\t\t\tif (!(cohesionCount++)) {\n\
\t\t\t\t\tVec2.copy(cohesion, distance);\n\
\t\t\t\t} else {\n\
\t\t\t\t\tVec2.add(cohesion, distance);\n\
\t\t\t\t}\n\
\n\
\t\t\t\t// Imitation : try to move in the same way than other boids\n\
\t\t\t\tif (!(imitationCount++)) {\n\
\t\t\t\t\tVec2.copy(imitation, entity2.kinetic.velocity);\n\
\t\t\t\t} else {\n\
\t\t\t\t\tVec2.add(imitation, entity2.kinetic.velocity);\n\
\t\t\t\t}\n\
\n\
\t\t\t\t// Avoidance : try to keep a minimum distance between others.\n\
\t\t\t\tif (diffSq < boid1.auraSq) {\n\
\t\t\t\t\tif (!(avoidanceCount++)) {\n\
\t\t\t\t\t\tVec2.copy(avoidance, distance);\n\
\t\t\t\t\t} else {\n\
\t\t\t\t\t\tVec2.add(avoidance, distance);\n\
\t\t\t\t\t}\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\tvar mod = boid1.mod;\n\
\t\tif (cohesionCount && boid1.cohesionMod) {\n\
\t\t\tif (cohesionCount > 1) {\n\
\t\t\t\tVec2.scale(cohesion, 1 / cohesionCount);\n\
\t\t\t}\n\
\t\t\tentity1.kinetic.applyForce(Vec2.scale(cohesion, boid1.cohesionMod * mod));\n\
\t\t}\n\
\n\
\t\tif (imitationCount && boid1.imitationMod) {\n\
\t\t\tif (imitationCount > 1) {\n\
\t\t\t\tVec2.scale(imitation, 1 / imitationCount);\n\
\t\t\t}\n\
\t\t\tVec2.add(impulse, Vec2.scale(imitation, boid1.imitationMod * mod));\n\
\t\t\tentity1.kinetic.applyForce()\n\
\t\t\tVec2.add(\n\
\t\t\t\tentity1.kinetic.force,\n\
\t\t\t\tVec2.sub(impulse, vel)\n\
\t\t\t);\n\
\t\t}\n\
\n\
\t\tif (avoidanceCount && boid1.avoidanceMod) {\n\
\t\t\tif (avoidanceCount > 1) {\n\
\t\t\t\tVec2.scale(avoidance, 1 / avoidanceCount);\n\
\t\t\t}\n\
\t\t\tVec2.sub(\n\
\t\t\t\tentity1.kinetic.force,\n\
\t\t\t\tVec2.scale(avoidance, boid1.avoidanceMod * mod)\n\
\t\t\t);\n\
\t\t}\n\
\t}\n\
};\n\
\n\
new Component('boid', Boid);\n\
\n\
module.exports = Boid;\n\
//@ sourceURL=acmejs/lib/core/boid.js"
));
require.register("acmejs/lib/core/jitter.js", Function("exports, require, module",
"'use strict';\n\
\n\
var Component = require('./component');\n\
var Pool = require('./pool');\n\
var Vec2 = require('./math').Vec2;\n\
\n\
function Jitter() {}\n\
\n\
Jitter.prototype = {\n\
\n\
  attributes: {\n\
    factor: 0.1,\n\
    force: 250\n\
  },\n\
\n\
  create: function(attributes) {\n\
    this.factor = attributes.factor;\n\
    this.force = attributes.force;\n\
  },\n\
\n\
  fixedUpdate: function(dt) {\n\
    if (Math.chance(this.factor)) {\n\
      Vec2.variant(Vec2.zero, this.force, force);\n\
      this.kinetic.applyForce(force);\n\
    }\n\
  }\n\
\n\
};\n\
\n\
var force = Vec2();\n\
\n\
new Component('jitter', Jitter);\n\
\n\
module.exports = Jitter;\n\
//@ sourceURL=acmejs/lib/core/jitter.js"
));
require.register("acmejs/lib/core/particle.js", Function("exports, require, module",
"'use strict';\n\
\n\
var Entity = require('./entity');\n\
var Component = require('./component');\n\
var Pool = require('./pool');\n\
var Engine = require('./engine');\n\
var Vec2 = require('./math').Vec2;\n\
var Color = require('./color');\n\
var Sprite = require('./sprite').Asset;\n\
require('./transform');\n\
require('./kinetic');\n\
\n\
function Particle() {\n\
  this.color = Color();\n\
}\n\
\n\
Particle.layer = 10;\n\
\n\
Particle.prototype.attributes = {\n\
  color: Color.black,\n\
  colorVariant: 0,\n\
  lifetime: 1,\n\
  radius: 1,\n\
  radiusVariant: 0,\n\
  alpha: 1,\n\
  alphaVariant: 0,\n\
  composite: null,\n\
  sprite: null,\n\
  shrink: Math.quintIn,\n\
  fade: Math.quintIn\n\
};\n\
\n\
Particle.prototype.create = function(attributes) {\n\
  this.lifetime = attributes.lifetime;\n\
  this.radius = attributes.radius;\n\
  this.alpha = attributes.alpha;\n\
  this.composite = attributes.composite;\n\
  this.sprite = attributes.sprite;\n\
  this.shrink = attributes.shrink;\n\
  this.fade = attributes.fade;\n\
  Color.copy(this.color, attributes.color);\n\
\n\
  var variant = attributes.colorVariant;\n\
  if (variant) {\n\
    Color.variant(this.color, variant);\n\
  }\n\
  variant = attributes.radiusVariant;\n\
  if (variant) {\n\
    this.radius += Math.rand(-variant, variant);\n\
  }\n\
  variant = attributes.alphaVariant;\n\
  if (variant) {\n\
    this.alpha = Math.clamp(this.alpha + Math.rand(-variant, variant), 0, 1);\n\
  }\n\
  this.age = 0;\n\
};\n\
\n\
Particle.prototype.update = function(dt) {\n\
  if ((this.age += dt) > this.lifetime) {\n\
    this.entity.destroy();\n\
  } else if (this.shrink && (this.radius *= 1 - this.shrink(this.age / this.lifetime)) < 1) {\n\
    this.entity.destroy();\n\
  } else if (this.fade && (this.alpha *= 1 - this.fade(this.age / this.lifetime)) <= 0.02) {\n\
    this.entity.destroy();\n\
  }\n\
};\n\
\n\
var crop = Vec2();\n\
var cropOffset = Vec2();\n\
var offset = Vec2();\n\
\n\
Particle.render = function(ctx) {\n\
  ctx.save();\n\
  Vec2.set(crop, 50, 50);\n\
  Vec2.set(cropOffset, -25, -25);\n\
  var alphaPrev = 1;\n\
  var entityPrev = null;\n\
  var fillPrev = null;\n\
  var compositePrev = null;\n\
\n\
  var defaultComposite = Particle.defaultComposite;\n\
\n\
  var particles = this.heap;\n\
  for (var i = 0, l = particles.length; i < l; i++) {\n\
    var particle = particles[i];\n\
    if (!particle.enabled) {\n\
      continue;\n\
    }\n\
\n\
    var radius = particle.radius;\n\
    var pos = particle.transform.position;\n\
\n\
    var alpha = particle.alpha;\n\
    var composite = particle.composite || defaultComposite;\n\
\n\
    if (composite !== compositePrev) {\n\
      ctx.globalCompositeOperation = compositePrev = composite;\n\
    }\n\
\n\
    if (particle.sprite) {\n\
      Vec2.set(offset, 0, 50 * (radius - 1 | 0));\n\
      if (alpha !== alphaPrev) {\n\
        ctx.globalAlpha = alphaPrev = alpha;\n\
      }\n\
      particle.sprite.draw(ctx, pos, Vec2.center, crop, offset);\n\
    } else {\n\
      particle.color[3] = alpha;\n\
      var fill = Color.rgba(particle.color);\n\
      if (fill !== fillPrev) {\n\
        ctx.fillStyle = fillPrev = fill;\n\
      }\n\
      ctx.fillRect(pos[0] - radius / 2 | 0, pos[1] - radius / 2 | 0, radius | 0, radius | 0);\n\
    }\n\
  }\n\
  ctx.restore();\n\
};\n\
\n\
\n\
\n\
Particle.generateSprite = function(attributes) {\n\
  attributes = attributes || {};\n\
  var color = Color(attributes.color || Color.white);\n\
  var alpha = attributes.alpha || 1;\n\
  var max = attributes.max || 25;\n\
  var size = max * 2;\n\
  var center = attributes.center || 0.5;\n\
  var shape = attributes.shape || 'circle';\n\
\n\
  return new Sprite(function(ctx) {\n\
    for (var radius = 1; radius <= max; radius++) {\n\
      var top = max + size * (radius - 1);\n\
\n\
      if (center < 1) {\n\
        var grad = ctx.createRadialGradient(max, top, 0, max, top, radius);\n\
        color[3] = alpha;\n\
        grad.addColorStop(0, Color.rgba(color));\n\
        if (center != 0.5) {\n\
          color[3] = alpha / 2;\n\
          grad.addColorStop(center, Color.rgba(color));\n\
        }\n\
        color[3] = 0;\n\
        grad.addColorStop(1, Color.rgba(color));\n\
        ctx.fillStyle = grad;\n\
      } else {\n\
        ctx.fillStyle = Color.rgba(color);\n\
      }\n\
\n\
      if (shape == 'rect') {\n\
        ctx.fillRect(max - radius / 2 | 0, top - radius / 2, radius, radius);\n\
      } else {\n\
        ctx.beginPath();\n\
        ctx.arc(max, top, radius, 0, Math.TAU, true);\n\
        ctx.closePath();\n\
        ctx.fill();\n\
      }\n\
    }\n\
  }, Vec2(size, size * max));\n\
};\n\
\n\
Particle.sprite = Particle.generateSprite();\n\
\n\
\n\
new Component('particle', Particle);\n\
\n\
Particle.Prefab = new Entity.Prefab('particle', {\n\
  transform: null,\n\
  kinetic: {\n\
    mass: 0\n\
  },\n\
  particle: {\n\
    sprite: Particle.sprite\n\
  }\n\
});\n\
\n\
new Pool(Particle);\n\
\n\
module.exports = Particle;\n\
//@ sourceURL=acmejs/lib/core/particle.js"
));
require.register("acmejs/lib/math/mat2.js", Function("exports, require, module",
"'use strict';\n\
\n\
/*\n\
 * 2x3 Matrix\n\
 *\n\
 * https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/mat2d.js\n\
 * https://github.com/simonsarris/Canvas-tutorials/blob/master/transform.js\n\
 *\n\
 * @param {[type]} fromOrA [description]\n\
 * @param {[type]} b       [description]\n\
 * @param {[type]} c       [description]\n\
 * @param {[type]} d       [description]\n\
 * @param {[type]} tx      [description]\n\
 * @param {[type]} ty      [description]\n\
 */\n\
var Mat2 = Math.Mat2 = function(fromOrA, b, c, d, tx, ty) {\n\
\tif (b != null) {\n\
\t\treturn new ARRAY_TYPE([fromOrA, b, c, d, tx, ty]);\n\
\t}\n\
\tif (fromOrA != null) {\n\
\t\treturn new ARRAY_TYPE(fromOrA);\n\
\t}\n\
\treturn new ARRAY_TYPE(Mat2.identity);\n\
};\n\
\n\
var ARRAY_TYPE = Math.ARRAY_TYPE;\n\
\n\
Mat2.identity = Mat2(1, 0, 0, 1, 0, 0);\n\
\n\
Mat2.set = function(result, a, b, c, d, tx, ty) {\n\
\tresult[0] = a || 0;\n\
\tresult[1] = b || 0;\n\
\tresult[2] = (c != null) ? c : 1;\n\
\tresult[3] = d || 0;\n\
\tresult[4] = tx || 0;\n\
\tresult[5] = (ty != null) ? ty : 1;\n\
\treturn result;\n\
};\n\
\n\
Mat2.copy = function(result, b) {\n\
\tresult.set(b);\n\
\treturn result;\n\
};\n\
\n\
Mat2.valid = function(a) {\n\
\treturn !(isNaN(a[0]) || isNaN(a[1]) || isNaN(a[2]) || isNaN(a[3]) || isNaN(a[4]) || isNaN(a[5]));\n\
};\n\
\n\
Mat2.toString = function(a) {\n\
\treturn \"[\" + a[0] + \", \" + a[1] + \" | \" + a[2] + \", \" + a[3] + \" | \" + a[4] + \", \" + a[5] + \"]\";\n\
};\n\
\n\
Mat2.multiply = function(a, b, result) {\n\
\tif (!result) {\n\
\t\tresult = a;\n\
\t}\n\
\tvar aa = a[0];\n\
\tvar ab = a[1];\n\
\tvar ac = a[2];\n\
\tvar ad = a[3];\n\
\tvar atx = a[4];\n\
\tvar aty = a[5];\n\
\tvar ba = b[0];\n\
\tvar bb = b[1];\n\
\tvar bc = b[2];\n\
\tvar bd = b[3];\n\
\tvar btx = b[4];\n\
\tvar bty = b[5];\n\
\tresult[0] = aa * ba + ab * bc;\n\
\tresult[1] = aa * bb + ab * bd;\n\
\tresult[2] = ac * ba + ad * bc;\n\
\tresult[3] = ac * bb + ad * bd;\n\
\tresult[4] = ba * atx + bc * aty + btx;\n\
\tresult[5] = bb * atx + bd * aty + bty;\n\
\treturn result;\n\
};\n\
\n\
Mat2.rotate = function(a, rad, result) {\n\
\tif (!result) {\n\
\t\tresult = a;\n\
\t}\n\
\tif (!rad) {\n\
\t\treturn result;\n\
\t}\n\
\tvar aa = a[0];\n\
\tvar ab = a[1];\n\
\tvar ac = a[2];\n\
\tvar ad = a[3];\n\
\tvar atx = a[4];\n\
\tvar aty = a[5];\n\
\tvar st = Math.sin(rad);\n\
\tvar ct = Math.cos(rad);\n\
\tresult[0] = aa * ct + ab * st;\n\
\tresult[1] = -aa * st + ab * ct;\n\
\tresult[2] = ac * ct + ad * st;\n\
\tresult[3] = -ac * st + ct * ad;\n\
\tresult[4] = ct * atx + st * aty;\n\
\tresult[5] = ct * aty - st * atx;\n\
\treturn result;\n\
};\n\
\n\
Mat2.scale = function(a, v, result) {\n\
\tif (!result) {\n\
\t\tresult = a;\n\
\t}\n\
\tvar vx = v[0];\n\
\tvar vy = v[1];\n\
\tif (vx == 1 && vy == 1) {\n\
\t\treturn result;\n\
\t}\n\
\tresult[0] = a[0] * vx;\n\
\tresult[1] = a[1] * vy;\n\
\tresult[2] = a[2] * vx;\n\
\tresult[3] = a[3] * vy;\n\
\tresult[4] = a[4] * vx;\n\
\tresult[5] = a[5] * vy;\n\
\treturn result;\n\
};\n\
\n\
Mat2.translate = function(a, v, result) {\n\
\tif (!result) {\n\
\t\tresult = a;\n\
\t} else {\n\
\t\tresult[0] = a[0];\n\
\t\tresult[1] = a[1];\n\
\t\tresult[2] = a[2];\n\
\t\tresult[3] = a[3];\n\
\t}\n\
\tresult[4] = a[4] + v[0];\n\
\tresult[5] = a[5] + v[1];\n\
\treturn result;\n\
};\n\
\n\
Mat2.apply = function(a, v, result) {\n\
\tif (!result) {\n\
\t\tresult = v;\n\
\t}\n\
\tvar x = v[0];\n\
  var y = v[1];\n\
  result[0] = x * a[0] + y * a[2] + a[4];\n\
  result[1] = x * a[1] + y * a[3] + a[5];\n\
  return result;\n\
};\n\
\n\
module.exports = Mat2;\n\
//@ sourceURL=acmejs/lib/math/mat2.js"
));
require.register("acmejs/lib/labs/perlin.js", Function("exports, require, module",
"'use strict';\n\
\n\
/**\n\
 * @class\n\
 *\n\
 * Improved Perlin Noise\n\
 *\n\
 * http://cs.nyu.edu/~perlin/noise/\n\
 * https://github.com/louisstow/pixelminer/blob/master/lib/perlin.js\n\
 */\n\
\n\
var Perlin = function() {\n\
\tvar permutation = [];\n\
\tfor (var i = 0; i <= 255; i++) {\n\
\t\tpermutation[i] = (Math.random() * 255) | 0;\n\
\t}\n\
\tthis.permutation = new Uint8Array(permutation.concat(permutation));\n\
\tconsole.log(this.permutation.length);\n\
}\n\
\n\
Perlin.prototype.get = function(x, y, z) {\n\
\tvar p = this.permutation;\n\
\n\
\tvar floorX = ~~x;\n\
\tvar floorY = ~~y;\n\
\tvar floorZ = ~~z;\n\
\n\
\tvar X = floorX & 255; // FIND UNIT CUBE THAT\n\
\tvar Y = floorY & 255; // CONTAINS POINT.\n\
\tvar Z = floorZ & 255;\n\
\tx -= floorX; // FIND RELATIVE X,Y,Z\n\
\ty -= floorY; // OF POINT IN CUBE.\n\
\tz -= floorZ;\n\
\n\
\tvar u = fade(x); // COMPUTE FADE CURVES\n\
\tvar v = fade(y); // FOR EACH OF X,Y,Z.\n\
\tvar w = fade(z);\n\
\n\
\tvar A = p[X] + Y;\n\
\tvar AA = p[A] + Z;\n\
\tvar AB = p[A + 1] + Z; // HASH COORDINATES OF\n\
\tvar B = p[X + 1] + Y;\n\
\tvar BA = p[B] + Z;\n\
\tvar BB = p[B + 1] + Z; // THE 8 CUBE CORNERS,\n\
\n\
\treturn lerp(w, lerp(v, lerp(u, grad(p[AA], x, y, z), // AND ADD\n\
\t\t\t\tgrad(p[BA], x - 1, y, z)), // BLENDED\n\
\t\t\tlerp(u, grad(p[AB], x, y - 1, z), // RESULTS\n\
\t\t\t\tgrad(p[BB], x - 1, y - 1, z))), // FROM 8\n\
\t\tlerp(v, lerp(u, grad(p[AA + 1], x, y, z - 1), // CORNERS\n\
\t\t\t\tgrad(p[BA + 1], x - 1, y, z - 1)), // OF CUBE\n\
\t\t\tlerp(u, grad(p[AB + 1], x, y - 1, z - 1),\n\
\t\t\t\tgrad(p[BB + 1], x - 1, y - 1, z - 1)))) + 0.5;\n\
};\n\
\n\
function fade(t) {\n\
\treturn t * t * t * (t * (t * 6 - 15) + 10);\n\
}\n\
\n\
function lerp(t, a, b) {\n\
\treturn a + t * (b - a);\n\
}\n\
\n\
function grad(hash, x, y, z) {\n\
\tvar h = hash & 15; // CONVERT LO 4 BITS OF HASH CODE\n\
\tvar u = h < 8 ? x : y; // INTO 12 GRADIENT DIRECTIONS.\n\
\tvar v = h < 4 ? y : h == 12 || h == 14 ? x : z;\n\
\treturn ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);\n\
}\n\
\n\
module.exports = Perlin;\n\
//@ sourceURL=acmejs/lib/labs/perlin.js"
));
require.register("acmejs/lib/labs/heightmap.js", Function("exports, require, module",
"'use strict';\n\
/**\n\
 * Heightmap\n\
 *\n\
 * http://www.float4x4.net/index.php/2010/06/generating-realistic-and-playable-terrain-height-maps/\n\
 */\n\
\n\
var Perlin = require('./perlin');\n\
\n\
var Heightmap = function(size, scale) {\n\
\tthis.size = size || 256;\n\
\tthis.scale = scale || 1;\n\
\n\
\tthis.perlin = new Perlin();\n\
\tthis.heights = new Float32Array(size * size);\n\
}\n\
\n\
Heightmap.prototype = {\n\
\n\
\tadd: function(scale, ratio) {\n\
\t\tvar size = this.size;\n\
\t\tvar perlin = this.perlin;\n\
\t\tvar heights = this.heights;\n\
\t\tvar baseScale = this.scale;\n\
\n\
\t\tvar x = size;\n\
\t\twhile (x--) {\n\
\t\t\tvar y = size;\n\
\t\t\twhile (y--) {\n\
\t\t\t\tvar factor = (baseScale + scale) / size;\n\
\t\t\t\tvar value = perlin.get(x * factor, y * factor, 0) * ratio;\n\
\t\t\t\theights[x * size + y] += value;\n\
\t\t\t}\n\
\t\t}\n\
\t},\n\
\n\
\terode: function(smoothness) {\n\
\t\tvar smoothness = smoothness || 1;\n\
\t\tvar size = this.size;\n\
\t\tvar heights = this.heights;\n\
\n\
\t\tvar x = size;\n\
\t\twhile (x--) {\n\
\t\t\tvar y = size;\n\
\t\t\twhile (y--) {\n\
\t\t\t\tvar key = x * size + y;\n\
\t\t\t\tvar dmax = 0;\n\
\t\t\t\tvar matchX = 0;\n\
\t\t\t\tvar matchY = 0;\n\
\t\t\t\tfor (var u = -1; u <= 1; u++) {\n\
\t\t\t\t\tvar xu = x + u;\n\
\t\t\t\t\tif (xu < 0 || xu >= size) {\n\
\t\t\t\t\t\tcontinue;\n\
\t\t\t\t\t}\n\
\t\t\t\t\tfor (var v = -1; v <= 1; v++) {\n\
\t\t\t\t\t\tvar yv = y + v;\n\
\t\t\t\t\t\tif (yv < 0 || yv >= size) {\n\
\t\t\t\t\t\t\tcontinue;\n\
\t\t\t\t\t\t}\n\
\t\t\t\t\t\tif (Math.abs(u) + Math.abs(v) > 0) {\n\
\t\t\t\t\t\t\tvar d = heights[key] - heights[(x + u) * size + (y + v)];\n\
\t\t\t\t\t\t\tif (d > dmax) {\n\
\t\t\t\t\t\t\t\tdmax = d;\n\
\t\t\t\t\t\t\t\tmatchX = u;\n\
\t\t\t\t\t\t\t\tmatchY = v;\n\
\t\t\t\t\t\t\t}\n\
\t\t\t\t\t\t}\n\
\t\t\t\t\t}\n\
\t\t\t\t}\n\
\t\t\t\tif (0 < dmax && dmax <= (smoothness / size)) {\n\
\t\t\t\t\tvar h = 0.5 * dmax;\n\
\t\t\t\t\theights[key] -= h;\n\
\t\t\t\t\theights[(x + matchX) * size + (y + matchY)] += h;\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t}\n\
\t},\n\
\n\
\t// 3×3 box filter\n\
\tsmoothen: function(factor) {\n\
\t\tvar factor = factor || 1;\n\
\t\tvar size = this.size;\n\
\t\tvar heights = this.heights;\n\
\n\
\t\tvar x = size;\n\
\t\twhile (x--) {\n\
\t\t\tvar y = size;\n\
\t\t\twhile (y--) {\n\
\t\t\t\tvar total = 0;\n\
\t\t\t\tvar count = 0;\n\
\t\t\t\tfor (var u = -1; u <= 1; u++) {\n\
\t\t\t\t\tvar xu = x + u;\n\
\t\t\t\t\tif (xu < 0 || xu >= size) {\n\
\t\t\t\t\t\tcontinue;\n\
\t\t\t\t\t}\n\
\t\t\t\t\tfor (var v = -1; v <= 1; v++) {\n\
\t\t\t\t\t\tvar yv = y + v;\n\
\t\t\t\t\t\tif (yv < 0 || yv >= size) {\n\
\t\t\t\t\t\t\tcontinue;\n\
\t\t\t\t\t\t}\n\
\t\t\t\t\t\tvar height = heights[xu * size + yv];\n\
\t\t\t\t\t\tif (u == 0 && v == 0) {\n\
\t\t\t\t\t\t\theight *= factor;\n\
\t\t\t\t\t\t\tcount += factor;\n\
\t\t\t\t\t\t} else {\n\
\t\t\t\t\t\t\tcount++;\n\
\t\t\t\t\t\t}\n\
\t\t\t\t\t\ttotal += height || 0;\n\
\t\t\t\t\t}\n\
\t\t\t\t}\n\
\t\t\t\theights[x * size + y] = total / count;\n\
\t\t\t}\n\
\t\t}\n\
\t},\n\
\n\
\tget: function(x, y) {\n\
\t\treturn this.heights[x * this.size + y];\n\
\t}\n\
\n\
};\n\
\n\
module.exports = Heightmap;//@ sourceURL=acmejs/lib/labs/heightmap.js"
));
require.alias("component-raf/index.js", "acmejs/deps/raf/index.js");
require.alias("component-raf/index.js", "raf/index.js");

require.alias("acmejs/index.js", "acmejs/index.js");