
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
    throwError()
    return
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

  function throwError () {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
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

require.exts = [
    '',
    '.js',
    '.json',
    '/index.js',
    '/index.json'
 ];

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  for (var i = 0; i < 5; i++) {
    var fullPath = path + require.exts[i];
    if (require.modules.hasOwnProperty(fullPath)) return fullPath;
    if (require.aliases.hasOwnProperty(fullPath)) return require.aliases[fullPath];
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
    if ('..' === path[i]) {
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
    throwError()
    return
  }
  require.aliases[to] = from;

  function throwError () {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
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
    if ('/' === c) return path.slice(1);
    if ('.' === c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = segs.length;
    while (i--) {
      if (segs[i] === 'deps') {
        break;
      }
    }
    path = segs.slice(0, i + 2).join('/') + '/deps/' + path;
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
require.register("acmejs/lib/index.js", function(exports, require, module){
'use strict';

module.exports = {
  Shims: require('./core/shims'),
  Random: require('./core/math-random'),
  Math: require('./core/math'),
  Color: require('./core/color'),
  Pool: require('./core/pool'),
  Engine: require('./core/engine'),
  Entity: require('./core/entity'),
  Component: require('./core/component'),
  Renderer: require('./core/renderer'),
  Console: require('./core/console'),
  Input: require('./core/input'),
  Transform: require('./core/transform'),
  Bounds: require('./core/bounds'),
  Sprite: require('./core/sprite'),
  Border: require('./core/border'),
  Collider: require('./core/collider'),
  Kinetic: require('./core/kinetic'),
  Boid: require('./core/boid'),
  Jitter: require('./core/jitter'),
  Particle: require('./core/particle'),
  Mat2: require('./math/mat2'),
  Perlin: require('./labs/perlin'),
  Heightmap: require('./labs/heightmap')
};

});
require.register("acmejs/lib/core/shims.js", function(exports, require, module){
'use strict';

// performance.now
var perf = window.performance || (window.performance = {});
perf.now = perf.now || perf.webkitNow || perf.msNow || perf.mozNow || Date.now;

// Object.setPrototypeOf
Object.setPrototypeOf = Object.setPrototypeOf || function(obj, proto) {
	obj.__proto__ = proto;
	return obj;
};

var lastTime = 0;
window.requestAnimationFrame = window.requestAnimationFrame ||
	window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame ||
	function(callback, element) {
		var now = perf.now();
		var dt = Math.max(0, 16 - (now - lastTime));
		var id = window.setTimeout(function() {
			callback(now + dt);
		}, dt);
		lastTime = now + dt;
		return id;
};

});
require.register("acmejs/lib/core/math-random.js", function(exports, require, module){
'use strict';

// API ideas: http://docs.python.org/2/library/random.html

// http://weblog.bocoup.com/random-numbers/
// https://gist.github.com/Protonk/5367430

// Linear Congruential Generator
// Variant of a Lehman Generator

// Set to values from http://en.wikipedia.org/wiki/Numerical_Recipes
// m is basically chosen to be large (as it is the max period)
// and for its relationships to a and c
var m = 4294967296;
// a - 1 should be divisible by m's prime factors
var a = 1664525;
// c and m should be co-prime
var c = 1013904223;
var z = 0;

var Random = {};

var rand = function() {
	// define the recurrence relationship
	z = (a * z + c) % m;
	// return a float in [0, 1)
	// if z = m then z / m = 0 therefore (z % m) / m < 1 always
	return z / m;
};

Random.srand = function(seed) {
	z = seed | 0;
};

Random.rand = rand;

function linear(x) {
	return x;
}

Random.randRange = function(low, high, ease) {
	return (ease || linear)(rand()) * (high - low) + low;
};

Random.srandArray = function(array) {
	return array[rand() * array.length + 0.5 | 0];
};

Random.chance = function(chance) {
	return rand() <= chance;
};

/**
 * @deprecated
 */
Math.rand = Random.randRange;

/**
// http://www.protonfish.com/random.shtml
function rnd_snd() {
	return (Math.random()*2-1)+(Math.random()*2-1)+(Math.random()*2-1);
}

function rnd(mean, stdev) {
	return Math.round(rnd_snd()*stdev+mean);
}
 */

module.exports = Random;
});
require.register("acmejs/lib/core/math.js", function(exports, require, module){
'use strict';

var Random = require('./math-random');
var randRange = Random.randRange;

/*
 * http://docs.unity3d.com/Documentation/ScriptReference/Mathf.html
 * https://github.com/secretrobotron/gladius.math/
 * https://github.com/toji/gl-matrix/tree/master/src/gl-matrix
 *
 * TODO: https://github.com/photonstorm/phaser/blob/master/Phaser/GameMath.ts
 */
var EPSILON = Math.EPSILON = 0.001;

var PI = Math.PI;
var TAU = Math.TAU = PI * 2;
var HALF_PI = Math.HALF_PI = PI / 2;
var RAD2DEG = Math.RAD2DEG = 180 / PI;
var DEG2RAD = Math.DEG2RAD = PI / 180;
// Math.PIRAD = 0.0174532925;
Math.UID = 1;

Math.uid = function() {
	return Math.UID++;
};

Math.clamp = function(a, low, high) {
	if (a < low) {
		return low;
	}
	if (a > high) {
		return high;
	} else {
		return a;
	}
};

/**
 * Correct modulo behavior
 * @param {Number} a Dividend
 * @param {Number} b Divisor
 * @return {Number} a % b where the result is between 0 and b (either
 *   0 <= x < b or b < x <= 0, depending on the sign of b).
 */
Math.mod = function(a, b) {
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
Math.repeat = function(t, length) {
	return t - Math.floor(t / length) * length;
};

Math.toDeg = function(rad) {
	return rad * RAD2DEG;
};

Math.toRad = function(deg) {
	return deg * DEG2RAD;
};

Math.normDeg = function(deg) {
	deg %= 360;
	return (deg * 360 < 0) ? deg + 360 : deg;
};

Math.normRad = function(rad) {
	rad %= TAU;
	return (rad * TAU < 0) ? rad + TAU : rad;
};

Math.distRad = function(a, b) {
	var d = Math.normRad(b) - Math.normRad(a);
	if (d > PI) {
		return d - TAU;
	}
	if (d <= -PI) {
		return d + TAU;
	}
	return d;
};

Math.distDeg = function(a, b) {
	var d = Math.normDeg(b) - Math.normDeg(a);
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
Math.lerp = function(a, b, scalar) {
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
Math.smoothDamp = function(a, b, velocity, time, maxVelocity, delta) {
	time = Math.max(EPSILON, time);
	delta = delta || 0.02;
	var num = 2 / time;
	var num2 = num * delta;
	var num3 = 1 / (1 + num2 + 0.48 * num2 * num2 + 0.235 * num2 * num2 * num2);
	var num4 = a - b;
	var num5 = b;
	var num6 = (maxVelocity || Number.POSITIVE_INFINITY) * time;
	num4 = Math.clamp(num4, -num6, num6);
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

/**
 * Easing
 */

var powIn = function(strength) {
	if (strength == null) {
		strength = 2;
	}
	return function(t) {
		return Math.pow(t, strength);
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

Math.linear = function(t) {
	return t;
};

// http://greweb.me/2012/02/bezier-curve-based-easing-functions-from-concept-to-implementation/
// https://github.com/petehunt/react-touch/blob/gh-pages/src/math/EasingFunctions.js
// https://gist.github.com/gre/1650294

var transitions = ['quad', 'cubic', 'quart', 'quint'];
for (var i = 0, l = transitions.length; i < l; i++) {
	var transition = transitions[i];
	var fn = powIn(i + 2);
	Math[transition + 'In'] = fn;
	Math[transition + 'Out'] = toOut(fn);
	Math[transition + 'InOut'] = toInOut(fn);
}

Math.distAng = function(a, b) {
	if (a == b) {
		return 0;
	}
	var ab = (a < b);
	var l = ab ? (-a - TAU + b) : (b - a);
	var r = ab ? (b - a) : (TAU - a + b);

	return (Math.abs(l) > Math.abs(r)) ? r : l;
};

/**
 * Vec2
 *
 * @constructor
 * Initialize from Vec2 array or x/y values. Returns a new (typed) array.
 *
 * @param {Number[]|Number} fromOrX Typed array to copy from or x
 * @param {Number} y y, when x was provided as first argument
 */
var Vec2 = Math.Vec2 = function(fromOrX, y) {
	if (y != null) {
		return new Float32Array([fromOrX, y]);
	}
	return new Float32Array(fromOrX || Vec2.zero);
};

Vec2.zero = Vec2.center = Vec2(0, 0);
Vec2.topLeft = Vec2(-1, -1);
Vec2.topCenter = Vec2(0, -1);
Vec2.topRight = Vec2(1, -1);
Vec2.centerLeft = Vec2(-1, 0);
Vec2.centerRight = Vec2(1, 0);
Vec2.bottomLeft = Vec2(-1, 1);
Vec2.bottomCenter = Vec2(0, 1);
Vec2.bottomRight = Vec2(1, 1);

Vec2.set = function(result, x, y) {
	result[0] = x || 0;
	result[1] = y || 0;
	return result;
};

Vec2.copy = function(result, b) {
	b = b || Vec2.zero;
	result[0] = b[0];
	result[1] = b[1];
	return result;
};

Vec2.valid = function(a) {
	return !(isNaN(a[0]) || isNaN(a[1]));
};

Vec2.toString = function(a) {
	return '[' + a[0] + ', ' + a[1] + ']';
};

var objVecCache = Vec2();

Vec2.fromObj = function(obj, a) {
	a = a || objVecCache;
	a[0] = obj.x;
	a[1] = obj.y;
	return a;
};

var objCache = {
	x: 0,
	y: 0
};
Vec2.toObj = function(a, obj) {
	obj = obj || objCache;
	obj.x = a[0];
	obj.y = a[1];
	return obj;
};

Vec2.eq = function(a, b) {
	return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON;
};

Vec2.add = function(a, b, result) {
	result = result || a;
	result[0] = a[0] + b[0];
	result[1] = a[1] + b[1];
	return result;
};

Vec2.sub = function(a, b, result) {
	result = result || a;
	result[0] = a[0] - b[0];
	result[1] = a[1] - b[1];
	return result;
};

Vec2.mul = function(a, b, result) {
	result = result || a;
	result[0] = a[0] * b[0];
	result[1] = a[1] * b[1];
	return result;
};

Vec2.scale = function(a, scalar, result) {
	result = result || a;
	result[0] = a[0] * scalar;
	result[1] = a[1] * scalar;
	return result;
};

Vec2.norm = function(a, result, scalar) {
	result = result || a;
	var x = a[0];
	var y = a[1];
	var len = (scalar || 1) / (Math.sqrt(x * x + y * y) || 1);
	result[0] = x * len;
	result[1] = y * len;
	return result;
};

Vec2.lenSq = function(a) {
	return a[0] * a[0] + a[1] * a[1];
};

Vec2.len = function(a) {
	return Math.sqrt(a[0] * a[0] + a[1] * a[1]);
};

Vec2.dot = function(a, b) {
	return a[0] * b[0] + a[1] * b[1];
};

Vec2.cross = function(a, b) {
	return a[0] * b[1] - a[1] * b[0];
};

Vec2.lerp = function(a, b, scalar, result) {
	result = result || a;
	result[0] = a[0] + scalar * (b[0] - a[0]);
	result[1] = a[1] + scalar * (b[1] - a[1]);
	return result;
};

Vec2.max = function(a, b, axis) {
	if (axis != null) {
		return (a[axis] > b[axis]) ? a : b;
	}
	return (Vec2.lenSq(a) > Vec2.lenSq(b)) ? a : b;
};

Vec2.perp = function(a, result) {
	result = result || a;
	var x = a[0];
	result[0] = a[1];
	result[1] = -x;
	return result;
};

Vec2.dist = function(a, b) {
	var x = b[0] - a[0];
	var y = b[1] - a[1];
	return Math.sqrt(x * x + y * y);
};

Vec2.distSq = function(a, b) {
	var x = b[0] - a[0];
	var y = b[1] - a[1];
	return x * x + y * y;
};

Vec2.limit = function(a, max, result) {
	result = result || a;
	var x = a[0];
	var y = a[1];
	var ratio = max / Math.sqrt(x * x + y * y);
	if (ratio < 1) {
		result[0] = x * ratio;
		result[1] = y * ratio;
	} else if (result !== a) {
		result[0] = x;
		result[1] = y;
	}
	return result;
};

var radCache = [Vec2(), Vec2()];

Vec2.rad = function(a, b) {
	if (!b) {
		return Math.atan2(a[1], a[0]);
	}
	return Math.acos(
		Vec2.dot(Vec2.norm(a, radCache[0]), Vec2.norm(b, radCache[1]))
	);
};

Vec2.rotate = function(a, theta, result) {
	result = result || a;
	var sinA = Math.sin(theta);
	var cosA = Math.cos(theta);
	var x = a[0];
	var y = a[1];
	result[0] = x * cosA - y * sinA;
	result[1] = x * sinA + y * cosA;
	return result;
};

Vec2.rotateAxis = function(a, b, theta, result) {
	return Vec2.add(
		Vec2.rotate(
			Vec2.sub(a, b, result || a),
			theta
		),
		b
	);
};

Vec2.rotateTo = function(a, rad, result) {
	result = result || a;
	var len = Vec2.len(a);
	return Vec2.rotate(Vec2.set(result, len, 0), rad);
};

Vec2.lookAt = function(a, b, result) {
	var len = Vec2.len(a);
	return Vec2.norm(
		Vec2.rotate(
			a,
			Math.atan2(b[0] - a[0], b[1] - a[1]) - Math.atan2(a[1], a[0]),
			result || a
		),
		null, len
	);
};

Vec2.variant = function(a, delta, result) {
	result = result || a;
	result[0] = a[0] + Random.randRange(-delta, delta);
	result[1] = a[1] + Random.randRange(-delta, delta);
	return result;
};

var circRand = Vec2();

Vec2.variantCirc = function(a, delta, ease, result) {
	result = result || a;
	var len = randRange(0, delta, ease);
	var theta = randRange(0, TAU);
	var sinA = Math.sin(theta);
	var cosA = Math.cos(theta);
	result[0] = a[0] + (len * cosA - 0 * sinA);
	result[1] = a[1] + (len * sinA + 0 * cosA);
	return result;
};

Vec2.variantRad = function(a, delta, ease, result) {
	return Vec2.rotate(a, randRange(-delta, delta, ease), result);
};

Vec2.variantLen = function(a, delta, ease, result) {
	return Vec2.norm(a, result, Vec2.len(a) + randRange(-delta, delta, ease));
};

module.exports.Vec2 = Vec2;

});
require.register("acmejs/lib/core/color.js", function(exports, require, module){
'use strict';

require('./math');

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
	t = Math.clamp(t * last, 0, last);
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
	if (alpha == null) {
		alpha = a[3];
	}
	if (alpha > 0.98) {
		return 'rgb(' + (a[0] | 0) + ', ' + (a[1] | 0) + ', ' + (a[2] | 0) + ')';
	}
	return 'rgba(' + (a[0] | 0) + ', ' + (a[1] | 0) + ', ' + (a[2] | 0) + ', ' + alpha + ')';
};

module.exports = Color;

});
require.register("acmejs/lib/core/pool.js", function(exports, require, module){
'use strict';

require('./math');

/**
 * Pool
 *
 * @param {Object} cls Class to pool
 */
function Pool(cls) {
	this.cls = cls;
	var proto = cls.prototype;
	proto.pool = this;
	cls.pool = this;
	this.heap = [];
	this.enabled = false;
	this.allocated = 0;

	if (!proto.type) {
		throw new Error('No type provided.');
	}
	this.type = proto.type;
	Pool.byType[this.type] = this;

	var pool = this;
	cls.create = function(parent, attributes) {
		return pool.alloc(parent, attributes);
	};

	this.attachable = (this.type !== 'entity' && !proto.light);

	if (this.attachable) {
		this.layer = proto.layer || cls.layer || 0;
		this.events = [];
		this.calls = [];

		if ((this.attributes = proto.attributes || null)) {
			this.attributeKeys = Object.keys(this.attributes);
		}

		var types = Pool.typedCalls;
		var keys = Object.keys(proto).concat(Object.keys(cls));

		var fn = '';
		var key = '';
		for (var i = 0, l = keys.length; i < l; i++) {
			fn = keys[i];
			if (Pool.regxCall.test(fn)) {
				if (!~types.indexOf(fn)) {
					types.push(fn);
					Pool.calls[fn] = [];
				}
				this.events.push(fn);
			} else if (Pool.regxGetter.test(fn)) {
				key = fn.substr(3, 1).toLowerCase() + fn.substr(4);
				Object.defineProperty(proto, key, {
					get: proto[fn],
					enumerable: true,
					configurable: true
				});
			} else if (Pool.regxSetter.test(fn)) {
				key = fn.substr(3, 1).toLowerCase() + fn.substr(4);
				Object.defineProperty(proto, key, {
					set: proto[fn],
					enumerable: true,
					configurable: true
				});
			}
		}

		for (i = 0, l = types.length; i < l; i++) {
			fn = types[i];
			if (fn in cls) {
				this[fn] = cls[fn];
				Pool.calls[fn].push(this);
			} else if (fn in proto) {
				this.calls.push(fn);
			}
		}
	}
}

Pool.prototype = {

	/**
	 * Brief summary.
	 *
	 * @return {String}
	 */
	toString: function() {
		return 'Pool ' + this.type +
			' [' + this.allocated + ' / ' + this.heap.length + ']';
	},

	/**
	 * Fill pool with deallocd instances.
	 *
	 * @private
	 *
	 * @param {Number} amount Amount of objects to instanziate.
	 */
	fill: function(amount) {
		while (amount--) {
			this.newInstance();
		}
	},

	newInstance: function() {
		var entity = new this.cls();
		entity.enabled = false;
		entity.allocated = false;
		this.heap.push(entity);

		var calls = this.calls;
		if (calls) {
			for (var i = 0, l = calls.length; i < l; i++) {
				Pool.calls[calls[i]].push(entity);
			}
		}
		return entity;
	},

	/**
	 * Allocate a new instance from dealloc pool or by creating.
	 *
	 * The provided attributes are merged with the default attributes.
	 *
	 * @param {Entity} parent (optional) Parent class
	 * @param {Object} attributes (optional) Attributes object
	 *
	 * @return {Object}
	 */
	alloc: function(parent, attributes) {
		// Get dealloc or create new entity
		var entity = null;
		var heap = this.heap;
		var i = heap.length;
		while (i--) {
			if (!heap[i].allocated) {
				entity = heap[i];
				break;
			}
		}
		if (!entity) {
			entity = this.newInstance();
		}

		var defaults = null;
		this.allocated++;
		this.enabled = true;
		var uid = entity.uid = Math.uid();
		entity.enabled = true;
		entity.allocated = true;
		entity.parent = parent || null;
		entity.root = parent && parent.root || parent || entity;

		if (this.attachable) {
			// Set layer, combined from parent layer, pool layer and uid
			entity.layer = (parent && parent.layer || 0) + this.layer + 2 - 1 / uid;

			// Prepare sorting if needed
			var calls = this.calls;
			for (i = 0, l = calls.length; i < l; i++) {
				var call = calls[i];
				if (Pool.sorted[call] != null) {
					Pool.sorted[call] = true;
				}
			}

			// Merge defaults with new attributes
			defaults = this.attributes;
			if (defaults) {
				if (attributes && !attributes.__merged__) {
					Object.setPrototypeOf(attributes, defaults);
					attributes.__merged__ = true;
				}
			}

			// Add events
			var events = this.events;
			for (i = 0, l = events.length; i < l; i++) {
				parent.on(entity, events[i]);
			}
		}

		entity.alloc(attributes || defaults || null);

		return entity;
	},

	/**
	 * Destroy given instance.
	 *
	 * @private
	 *
	 * @param {Object} entity Pooled object
	 */
	destroy: function(entity) {
		entity.enabled = false;
		Pool.calls.dealloc.push(entity);
	},

	/**
	 * Free destroyed object.
	 *
	 * @param {Object} entity Pooled object
	 */
	dealloc: function(entity) {
		entity.allocated = false;
		entity.uid = 0;
		entity.root = null;
		entity.parent = null;
		this.enabled = (this.allocated--) > 1;
	},

	/**
	 * Invoke method on all enabled pooled object instances.
	 *
	 * @param {String} fn Method name
	 * @param {Mixed} args (optional) Argument(s)
	 */
	call: function(fn, args) {
		var stack = this.heap;
		var i = this.heap.length;
		while (i--) {
			if (stack[i].enabled) {
				stack[i][fn](args);
			}
		}
	}

};

Pool.typedCalls = [
	'fixedUpdate',
	'simulate',
	'update',
	'postUpdate',
	'preRender',
	'render'
];

// Create call array
Pool.calls = {dealloc: []};
for (var i = 0, l = Pool.typedCalls.length; i < l; i++) {
	Pool.calls[Pool.typedCalls[i]] = [];
}

Pool.regxCall = /^on[A-Z]/;
Pool.regxGetter = /^get[A-Z]/;
Pool.regxSetter = /^set[A-Z]/;
Pool.byType = {};
Pool.sorted = {
	render: false
};

/**
 * Dump debugging details and optionally flush dealloc objects.
 *
 * @param {Boolean} flush (optional) Flush after debug.
 */
Pool.dump = function(flush) {
	var byType = Pool.byType;
	for (var type in byType) {
		var pool = byType[type];
		console.log('%s: %d/%d in use', type, pool.allocated, pool.heap.length);
	}
	if (flush) {
		Pool.flush();
	}
};

Pool.dealloc = function() {
	var stack = this.calls.dealloc;
	for (var i = 0, l = stack.length; i < l; i++) {
		stack[i].dealloc();
	}
	stack.length = 0;
};

Pool.flush = function() {
	var byType = Pool.byType;
	for (var type in byType) {
		var dealloced = 0;
		var heap = byType[type].heap;
		var i = heap.length;
		while (i--) {
			if (heap[i].allocated) {
				continue;
			}
			heap.splice(i, 1);
			dealloced++;
		}
		console.log('%s: %d/%d flushed', type, dealloced, heap.length);
	}
};

Pool.call = function(fn, arg) {
	var stack = this.calls[fn];
	if (!stack) {
		return;
	}
	var i = stack.length;
	if (!i) {
		return;
	}
	if (Pool.sorted[fn]) {
		stack.sort(Pool.sortFn);
		Pool.sorted[fn] = false;
	}
	while (i--) {
		if (stack[i].enabled) {
			// BAILOUT after callelem
			stack[i][fn](arg);
		}
	}
};

Pool.sortFn = function(a, b) {
	return b.layer - a.layer;
};

module.exports = Pool;

});
require.register("acmejs/lib/core/engine.js", function(exports, require, module){
'use strict';

var Entity = require('./entity');
var Pool = require('./pool');
require('./shims');

var perf = window.performance;
var raFrame = window.requestAnimationFrame;

/**
 * @class Engine
 * Managing renderer, scene and loop
 * @extends Entity
 */
function Engine() {
	Entity.call(this);

	this.running = false;
	this.time = 0.0;
	this.lastTime = 0.0;
	this.frame = 0;
	this.tail = 0.0;
	this.fdt = 1 / 30;
	this.minDt = 1 / 60;
	this.maxDt = 0.5;
	this.maxFdt = this.fdt * 5;
	this.scale = 1;

	this.debug = {
		profile: 0,
		step: false,
		time: true,
		profileFrom: 0
	};
	this.samples = {
		dt: 0,
		lag: 0,
		tick: 0,
		fixedUpdate: 0,
		update: 0,
		render: 0
	};

	var engine = this;
	this.tickBound = function Engine_tick(now) {
		return engine.tick(now);
	};

	this.element = null;
	this.scene = null;
}

Engine.prototype = Object.create(Entity.prototype);

Engine.prototype.type = 'engine';

Engine.prototype.init = function(element) {
	this.element = element;

	// Late require. TODO: Justify!
	require('./console');
	// this.createComponent('console');

	require('./input');
	this.createComponent('input');
};

/**
 * Set scene and start game loop
 * @param {Entity} scene
 * @param {Boolean} soft
 */
Engine.prototype.play = function(scene, soft) {
	if (this.scene) {
		this.triggerAll('onSceneEnd', this.scene);
		if (soft) {
			this.scene.enable(false, true);
		} else {
			this.scene.destroy();
		}
	}
	this.scene = scene;
	this.triggerAll('onSceneStart', scene);
	this.start();
};

/**
 * Start loop
 */
Engine.prototype.start = function() {
	if (this.running) {
		return;
	}
	this.running = true;
	this.triggerAll('onEngineStart');
	raFrame(this.tickBound);
};

Engine.prototype.pause = function() {
	if (!this.running) {
		return;
	}
	this.triggerAll('onEnginePause');
	this.running = false;
};

/**
 * Game loop tick, called by requestAnimationFrame
 *
 * @param {Number} time Delta time
 */
Engine.prototype.tick = function(time) {
	// Time value in seconds
	time = (time && time < 1e12 ? time : perf.now()) / 1000;
	this.time = time;

	if (this.running) {
		raFrame(this.tickBound);
	}

	var debug = this.debug;
	var samples = this.samples;
	var fdt = this.fdt;

	if (this.lastTime) {
		var dt = time - this.lastTime;
		if (dt > this.maxDt) {
			dt = this.minDt;
		} else if (dt > 0.01) {
			samples.dt = dt;
			var lag = time - samples.next;
			if (lag > 0) {
				samples.lag = lag * 1000;
			}
		}
		this.dt = (dt *= this.scale);
		this.frame++;

		if (debug.profile && !debug.profileFrom) {
			debug.profileFrom = debug.profile;
			console.profile('Frame ' + debug.profileFrom);
		}

		var ping = perf.now();
		var pingTick = ping;

		// Invoke fixed updates
		var tail = Math.min(this.tail + dt, this.maxFdt * this.scale);
		while (tail >= fdt) {
			tail -= fdt;
			Pool.call('fixedUpdate', fdt);
			Pool.call('simulate', fdt);
		}
		this.tail = tail;

		var pong = perf.now();
		samples.fixedUpdate = pong - ping;
		ping = pong;

		// Invoke update
		Pool.call('update', dt);

		Pool.dealloc();

		Pool.call('postUpdate', dt);

		pong = perf.now();
		samples.update = pong - ping;
		ping = pong;

		// Invoke render
		Pool.call('preRender', dt);

		var ctx = this.renderer.save();
		Pool.call('render', ctx);
		this.renderer.restore();

		pong = perf.now();
		samples.render = pong - ping;
		samples.tick = pong - pingTick;

		if (debug.step) {
			// debugger; // jshint ignore:line
		}

		if (debug.profileFrom) {
			if (!--debug.profile) {
				console.profileEnd('Frame ' + debug.profileFrom);
				debug.profileFrom = 0;
			}
		}
	}

	this.lastTime = time;
	samples.next = Math.max(time + 1 / 60, perf.now() / 1000);

	this.trigger('onTimeEnd', samples);
};

// Singleton
var engine = new Engine();

// Debugging hooks
if ('console' in window) {
	console.m = {
		pool: function(flush) {
			Pool.dump(flush);
			return null;
		},
		profile: function(frames) {
			if (frames == null) {
				frames = 60;
			}
			engine.debug.profile = frames;
			return null;
		},
		step: function() {
			engine.debug.step = !engine.debug.step;
			return null;
		}
	};
}

module.exports = engine;
});
require.register("acmejs/lib/core/entity.js", function(exports, require, module){
'use strict';

var Pool = require('./pool');

/**
 * @class Entity
 * Entities are containers that have components attached and act as event hub.
 * With parent and children, they can be organized into a hierachy
 *
 * @abstract
 * @property {Boolean} enabled False when disabled or not allocated. Never act on disabled components!
 * @property {Entity|null} parent Parent entity
 * @property {Entity|null} root Scene entity
 * @property {Number} layer Z-index
 */
function Entity() {
	this.children = {};
	this.components = {};
	this.events = {};
	this.eventRefs = [];
}

Entity.prototype = {

	type: 'entity',

	/**
	 * Brief summary
	 * @private
	 * @return {String}
	 */
	toString: function() {
		var comps = Object.keys(this.components).join(', ');
		return 'Entity ' + (this.id || '') + '#' + this.uid +
			' (' + comps + ') [^ ' + this.parent + ']';
	},

	/**
	 * Allocates entity from component/attribute hash
	 * @private
	 * @param {Object} attributes List of components and their attributes
	 * @return {Entity}
	 */
	alloc: function(attributes) {
		if (this.parent) {
			this.parent.children[this.uid] = this;
		}

		if (attributes) {
			for (var key in attributes) {
				var attribute = attributes[key];
				switch (key) {
					case 'id':
						this.id = attribute;
						break;
					default:
						if (!this.createComponent(key, attribute)) {
							throw new Error('Unknown attribute key "' + key +
								'", expected component. ' + this);
						}
				}
			}
		}
	},

	/**
	 * Add {@link Component} to Entity
	 * @param {String} type Component type
	 * @param  {Object} attributes (optional) Override component attributes
	 * @return {Component}
	 */
	createComponent: function(type, attributes) {
		var pool = Pool.byType[type];
		if (!pool) {
			return null;
		}
		return pool.alloc(this, attributes);
	},

	/**
	 * Add new Entity as child
	 * @param {String|Object} prefabId {@link Prefab} ID or prefab attribute object
	 * @param {Object} attributes (optional) Override {@link Prefab} attributes
	 * @return {Entity}
	 */
	createChild: function(prefabId, attributes) {
		if (typeof prefabId === 'string') {
			return Prefab.create(prefabId, this, attributes);
		}
		return Entity.create(this, prefabId);
	},

	removeComponents: function() {
		for (var key in this.components) {
			this.components[key].destroy();
		}
	},

	removeChildren: function() {
		for (var key in this.children) {
			this.children[key].destroy();
		}
	},

	/**
	 * Destroy Entity, including children and components.
	 */
	destroy: function() {
		this.pool.destroy(this);
		this.removeComponents();
		this.removeChildren();
	},

	/**
	 * Free destroyed Entity.
	 * @private
	 */
	dealloc: function() {
		// Remove referenced eventscribers
		var eventRefs = this.eventRefs;
		for (var i = 0, l = eventRefs.length; i < l; i++) {
			eventRefs[i].off(this);
		}
		eventRefs.length = 0;

		// Remove own eventscribers
		var events = this.events;
		for (var event in events) {
			events[event].length = 0;
		}
		if (this.parent) {
			delete this.parent.children[this.uid];
		}
		this.pool.dealloc(this);
	},

	/**
	 * Match Entity against a list of {@link Component} types.
	 * @param {Array|String} selector {@link Component} type(s)
	 * @return {Boolean}
	 */
	match: function(selector) {
		var components = this.components;
		if (Array.isArray(selector)) {
			for (var i = 0, l = selector.length; i < l; i++) {
				if (components[selector[i]]) {
					return true;
				}
			}
		} else if (components[selector]) {
			return true;
		}
		return false;
	},

	enable: function(state, deep) {
		if (state == null) {
			state = !this.enabled;
		}
		this.trigger((state ? 'onEnable' : 'onDisable'), this);
		this.enabled = state;
		for (var key in this.components) {
			this.components[key].enable(state, true);
		}
		if (deep) {
			for (key in this.children) {
				this.children[key].enable(state, true);
			}
		}
	},

	/**
	 * Subscribe to event messages
	 *
	 * @param {Entity|null} scope Target Entity for eventscription
	 * @param {String} event Event name to eventscribe to 'on*'
	 * @param {String} method (optional) Local method name to call, defaults to event name
	 */
	on: function(scope, event, method) {
		if (scope == null) {
			scope = this;
		}
		var events = this.events;
		var items = (events[event] || (events[event] = []));
		items.push(scope, method);
		if (scope !== this) {
			var refs = (scope.eventRefs || (scope.eventRefs = []));
			refs.push(this);
		}
	},

	/**
	 * Publish a event message only for this entity
	 *
	 * @param {String} event
	 * @param {Mixed} args (optional) Argument(s)
	 *
	 * @return {undefined|Boolean} Only false if one eventsciber returned false
	 */
	trigger: function(event, args) {
		var items = this.events[event];
		var i = 0;
		if (items && (i = items.length)) {
			while ((i -= 2) >= 0) {
				if (items[i] && items[i].enabled) {
					items[i][items[i + 1] || event](args);
				}
			}
		}
	},

	/**
	 * Publish a event message for this entity and it's parents
	 *
	 * @param {String} event
	 * {Mixed} args (optional) Argument(s)
	 *
	 * @return {undefined|Boolean} Only false if one eventsciber returned false
	 */
	triggerUp: function(event, args) {
		var entity = this;
		do {
			if (entity.enabled) {
				entity.trigger(event, args);
			}
		} while ((entity = entity.parent));
	},

	/**
	 * Publish a event message for all eventscribed entities
	 *
	 * @param {String} event
	 * @param {Mixed} args (optional) Argument(s)
	 */
	triggerAll: function(event, args) {
		return Pool.call(event, args);
	},

	/**
	 * Uneventscribe scope from event
	 *
	 * @param {Entity|Component} unscope (optional) Subscriber scope to remove
	 * @param {String|null} unevent (optional) Event to remove
	 */
	off: function(unscope, unevent) {
		var events = this.events;
		var i = 0;
		for (var event in events) {
			if (unevent && unevent === event) {
				continue;
			}
			var items = events[event];
			if (!items || !(i = items.length)) {
				continue;
			}
			var length = i / 2;
			while ((i -= 2) >= 0) {
				if (items[i] && (!unscope || unscope === items[i])) {
					items[i] = null;
					length--;
				}
			}
			if (length === 0) {
				items.length = 0;
			}
		}
	}

};

new Pool(Entity);

/**
 * @class Prefab
 *
 * @constructor
 * @param {String} id Prefab Id
 * @param {Object} attributes Default attributes
 */
function Prefab(id, attributes) {
	if (!attributes) {
		attributes = id;
		id = null;
	}
	this.id = id || attributes.id || Math.uid();
	this.attributes = attributes;
	this.attributeKeys = Object.keys(attributes);
	for (var key in attributes) {
		if (!attributes[key]) {
			attributes[key] = {};
		}
	}
	Prefab.byId[this.id] = this;
}

Prefab.byId = {};

/**
 * Allocate Prefab by Id
 *
 * @static
 * @param {String} id Prefab Id
 * @param {Entity} parent Parent entity
 * @param {Object} attributes Override attributes
 * @return {Entity}
 */
Prefab.create = function(id, parent, attributes) {
	var prefab = Prefab.byId[id];
	if (!prefab) {
		throw new Error('Prefab "' + id + '" not found.');
	}
	return prefab.create(parent, attributes);
};

Prefab.prototype = {

	/**
	 * Allocate {@link Entity} from Prefab
	 *
	 * @param {Entity} parent Parent entity
	 * @param {Object} attributes Override prefab attributes
	 * @return {Entity}
	 */
	create: function(parent, attributes) {
		var defaults = this.attributes;
		if (attributes) {
			var keys = this.attributeKeys;
			for (var i = 0, l = keys.length; i < l; i++) {
				var key = keys[i];
				var value = defaults[key];
				if (!attributes[key]) {
					attributes[key] = value;
				} else {
					var subPresets = attributes[key];
					if (typeof value === 'object') {
						// Evaluate use of: __proto__
						for (var subKey in value) {
							if (!(subKey in subPresets)) {
								subPresets[subKey] = value[subKey];
							}
						}
					}
					// Move to last position
					// TODO: Only when needed!
					delete attributes[key];
					attributes[key] = subPresets;
				}
			}
		}
		return Entity.create(parent, attributes || defaults);
	}

};

Entity.Prefab = Prefab;

module.exports = Entity;

});
require.register("acmejs/lib/core/component.js", function(exports, require, module){
'use strict';

var Pool = require('./pool');

/**
 * @class Component
 * Encapsulated behaviours that can be attached to entities.
 *
 * @abstract
 * @property {Boolean} enabled False when disabled or not allocated. Never act on disabled components!
 * @property {Entity} parent Container entity
 * @property {Entity} root Scene entity
 * @property {Number} layer Z-index
 */

function Component(type, cls) {
	if (!type) {
		return null;
	}

	var props = {
		type: {
			value: type,
			writable: false,
			enumerable: false
		}
	};
	var proto = cls.prototype;
	for (var key in proto) {
		var prop = Object.getOwnPropertyDescriptor(proto, key);
		props[key] = prop;
	}
	cls.prototype = Object.create(Component.prototype, props);
	new Pool(cls);
	return null;
}

Component.prototype = {

	type: 'component',

	/**
	 * Brief summary.
	 *
	 * @private
	 * @return {String}
	 */
	toString: function() {
		return 'Component ' + this.type + '#' + this.uid +
			' [^ ' + this.entity + ']';
	},

	/**
	 * Allocate Component overriding default attributes.
	 *
	 * @private
	 * @param {Object} attributes Attributes
	 * @return {Component}
	 */
	alloc: function(attributes) {
		var entity = this.entity = this.parent;
		entity.components[this.type] = this;
		entity[this.type] = this;

		var components = entity.components;
		for (var type in components) {
			if (type == this.type) {
				continue;
			}
			this[type] = components[type];
			components[type][this.type] = this;
		}

		if (this.create) {
			this.create(attributes);
		}
	},

	/**
	 * Destroy Component, removes it from {@link Entity}.
	 */
	destroy: function() {
		this.pool.destroy(this);
	},

	/**
	 * Free destroyed Component.
	 *
	 * @private
	 */
	dealloc: function() {
		// BAILOUT_ShapeGuard
		delete this.entity.components[this.type];
		this.entity[this.type] = null;

		var components = this.entity.components;
		for (var type in components) {
			if (type == this.type) {
				continue;
			}
			this[components[type].type] = null;
			components[type][this.type] = null;
		}
		this.entity = null;
		this.pool.dealloc(this);
	},

	enable: function(state) {
		if (state == null) {
			state = !this.enabled;
		}
		this.entity.trigger('onComponent' + (state ? 'Enable' : 'Disable'), this);
		this.enabled = state;
	}

};

module.exports = Component;
});
require.register("acmejs/lib/core/renderer.js", function(exports, require, module){
'use strict';

var Entity = require('./entity');
var Bounds = require('./bounds');
var Vec2 = require('./math').Vec2;
var Color = require('./color');

function Renderer(element, size) {
  this.element = element || document.body;
  this.size = Vec2(size);
  this.color = Color.white;
  this.content = Vec2(size);
  this.browser = Vec2();
  this.margin = Vec2();
  this.position = Vec2();
  this.scale = 0;
  this.orientation = 'landscape';

  this.canvas = document.createElement('canvas');
  if (this.color) {
    this.canvas.mozOpaque = true;
  }
  this.ctx = this.canvas.getContext('2d');

  this.buffer = false;
  if (this.buffer) {
    this.buf = document.createElement('canvas');
    this.bufctx = this.buf.getContext('2d');
    this.buf.width = this.content[0];
    this.buf.height = this.content[1];
  }
  this.canvas.width = this.content[0];
  this.canvas.height = this.content[1];
  this.element.style.width = this.content[0] + 'px';
  this.element.style.height = this.content[1] + 'px';
  this.element.appendChild(this.canvas);

  window.addEventListener('resize', this, false);
  document.addEventListener('fullscreenchange', this, false);
  document.addEventListener('mozfullscreenchange', this, false);
  document.addEventListener('webkitfullscreenchange', this, false);

  this.reflow();
}

Renderer.prototype  = {

  handleEvent: function(evt) {
    if (~evt.type.indexOf('fullscreenchange')) {
      this.fullscreenChange();
    } else {
      this.reflow();
    }
  },

  reflow: function() {
    var browser = Vec2.set(this.browser, window.innerWidth, window.innerHeight);
    var scale = Math.min(browser[0] / this.content[0], browser[1] / this.content[1]);
    if (scale !== this.scale) {
      this.scale = scale;
      Vec2.scale(this.content, this.scale, this.size);
    }
    var offset = Vec2.scale(Vec2.sub(browser, this.size, this.margin), 0.5);
    var rule = 'translate(' + offset[0] + 'px, ' +
      offset[1] + 'px) scale(' + scale + ')';
    this.element.style.transform = rule;
    this.element.style.webkitTransform = rule;
  },

  save: function() {
    var ctx = this.buffer ? this.bufctx : this.ctx;
    if (this.color) {
      ctx.fillStyle = Color.rgba(this.color);
      ctx.fillRect(0, 0, this.content[0], this.content[1]);
    } else {
      ctx.clearRect(0, 0, this.content[0], this.content[1]);
    }
    return ctx;
  },

  restore: function() {
    if (this.buffer) {
      this.ctx.clearRect(0, 0, this.content[0], this.content[1]);
      this.ctx.drawImage(this.buf, 0, 0);
    }
  },

  // FIXME: Unused
  center: function(pos) {
    Vec2.set(this.position, pos[0] - this.size[0] / 2, pos[0] - this.size[1] / 2);
    return this;
  },

  // FIXME: Unused
  cull: function(entity) {
    var bounds = entity.bounds;
    if (!bounds) {
      return false;
    }
    if (bounds.withinRect(this.position, this.content)) {
      if (bounds.culled) {
        bounds.culled = false;
      }
      return false;
    }
    if (!bounds.culled) {
      bounds.culled = true;
    }
    return true;
  },

  isFullscreen: function() {
    var doc = document;
    return doc.fullscreen || doc.mozFullScreen || doc.webkitIsFullScreen;
  },

  requestFullscreen: function() {
    if (!this.isFullscreen()) {
      var target = this.element.parentNode;
      if ('webkitRequestFullScreen' in target) {
        target.webkitRequestFullScreen();
      } else if ('mozRequestFullScreen' in target) {
        target.mozRequestFullScreen();
      }
    }
  },

  fullscreenChange: function() {
    if (this.orientation) {
      this.lockOrientation(this.orientation);
    }
  },

  lockOrientation: function(format) {
    if (format == null) {
      format = this.orientation;
    }
    var target = window.screen;
    if ('lockOrientation' in target) {
      screen.lockOrientation(format);
    } else if ('mozLockOrientation' in target) {
      screen.mozLockOrientation(format);
    }
  }

};

module.exports = Renderer;

});
require.register("acmejs/lib/core/console.js", function(exports, require, module){
'use strict';

var Component = require('./component');
var Vec2 = require('./math').Vec2;
var Engine = require('./engine');

function Console() {
	this.colors = ['#ddd', '#fff', '#ffc', '#fcc'];
	this.sections = ['#ffff33', '#ff8533', '#2babd6', '#9d2bd6'];
	// ['#fffa5b', '#ff945b', '#5bf4ff', '#bd5bff']
}

Console.prototype = {

	attributes: {
		css: '',
		container: null,
		width: 100,
		height: 56,
		cap: 50,
		resolution: 0.05,
		fancy: true
	},

	create: function(attributes) {
		this.css = attributes.css;
		this.container = attributes.container;
		this.width = attributes.width;
		this.height = attributes.height;
		this.cap = attributes.cap;
		this.resolution = attributes.resolution;
		this.fancy = attributes.fancy;

		var wrap = this.wrap = document.createElement('div');
		wrap.id = 'console';
		wrap.style.cssText = 'position: fixed;' +
			'transform: translateZ(0);' +
			'left: 0;' +
			'top: 0;' +
			'user-select: none;' +
			'overflow: hidden;' +
			'padding: 0;' +
			'width: ' + this.width + 'px;' +
			'color: #ccc;' +
			'background-color: rgba(0, 0, 0, 1);' +
			'outline: 1px solid rgba(128, 128, 128, 0.5);' +
			'font: 400 9px/20px Helvetica,Arial,sans-serif;' +
			'transform: translateZ(0);' +
			'text-align: right;' +
			'text-shadow: 1px 1px 0 rgba(0, 0, 0, 1), 0 0 1px rgba(0, 0, 0, 1);' +
			'cursor: ns-resize;' + this.css;

		var spanCss = 'font-weight: bold;' +
			'font-size: 12px;' +
			'float: left;';

		this.fpsSpan = document.createElement('span');
		this.fpsSpan.style.cssText = spanCss;
		this.fpsSpan.title = 'FPS';
		this.fpsSpan2 = document.createElement('span');
		this.tickSpan = document.createElement('span');
		this.tickSpan.style.cssText = spanCss;
		this.tickSpan.title = 'MS per tick';
		this.tickSpan2 = document.createElement('span');
		this.fpsSpan2.title = this.tickSpan2.title = '± standard deviation';

		var panelCss = 'width: 50%;' +
			'padding: 0 5px;' +
			'overflow: hidden;' +
			'position: absolute;' +
			'top: 0;' +
			'left: 0;' +
			'-moz-box-sizing: border-box;' +
			'-webkit-box-sizing: border-box;' +
			'z-index: 2;';
		var panel = document.createElement('span');
		panel.style.cssText = panelCss;
		panel.appendChild(this.fpsSpan);
		panel.appendChild(this.fpsSpan2);
		wrap.appendChild(panel);

		panel = document.createElement('span');
		panel.style.cssText = panelCss + 'left: 50%;';
		panel.appendChild(this.tickSpan);
		panel.appendChild(this.tickSpan2);
		wrap.appendChild(panel);

		var rulerCss = 'position: absolute;' +
			'left: 0;' +
			'width: 100%;' +
			'height: 1px;' +
			'background-color: rgba(128, 128, 128, 0.5);';

		var ruler = document.createElement('span');
		ruler.style.cssText = rulerCss + ('bottom: ' + (this.height * 0.66) + 'px;');
		wrap.appendChild(ruler);
		ruler = document.createElement('span');
		ruler.style.cssText = rulerCss + ('bottom: ' + (this.height * 0.33) + 'px;');
		wrap.appendChild(ruler);

		this.graphSpan = document.createElement('div');
		this.graphSpan.style.cssText = 'height: ' + this.height + 'px;' +
			'z-index: 1;';
		this.graphSpan.title = 'Fixed Update + Update + Render + Lag';

		var barCss = 'width: 1px;' +
			'float: left;' +
			'margin-top: 0px;';
		var sectionCss = 'display: block;' +
			'height: 0px;';
		if (this.fancy) {
			sectionCss += 'background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.25));';
		}

		var i = this.width;
		while (i--) {
			var bar = document.createElement('span');
			bar.className = 'console-bar';
			bar.style.cssText = barCss;
			var sections = this.sections;
			for (var j = 0, l = sections.length; j < l; j++) {
				var section = document.createElement('span');
				section.className = 'console-section';
				section.style.cssText = sectionCss +
					'background-color: ' + sections[j] + ';';
				bar.appendChild(section);
			}
			this.graphSpan.appendChild(bar);
		}
		wrap.appendChild(this.graphSpan);

		(this.container || document.body).appendChild(wrap);
		this.nullify();

		this.lastClick = 0;
		wrap.addEventListener('click', this);

		this.maximized = !(~(document.cookie || '').indexOf('console_max'));
		this.toggle();
	},

	handleEvent: function(evt) {
		var time = evt.timeStamp;
		if (time - this.lastClick < 500) {
			this.destroy();
		}
		this.lastClick = time;

		this.toggle();
		return false;
	},

	toggle: function() {
		var margin = 0;
		var opacity = 0.8;
		this.maximized = !this.maximized;
		if (!this.maximized) {
			opacity = 0.5;
			margin = -this.height + 20;
			document.cookie = 'console_max=; expires=' + (new Date()).toGMTString();
		} else {
			document.cookie = 'console_max=1';
		}
		var style = this.graphSpan.style;
		style.marginTop = margin + 'px';
		style.opacity = opacity;
	},

	dealloc: function() {
		(this.container || document.body).removeChild(this.wrap);
		this.wrap.removeEventListener('click', this);
		this.wrap = null;
		this.container = null;
		Component.prototype.dealloc.call(this);
	},

	onTimeEnd: function(samples) {
		var dt = samples.dt;
		this.dtSum += dt;
		if (!dt) {
			return;
		}

		var fps = 1 / dt;
		this.fpsSum += fps;
		this.fpsSq += fps * fps;
		var lag = samples.lag;
		this.lagSum += lag;
		this.lagSq += lag * lag;
		var tick = samples.tick;
		this.tickSum += tick;
		this.tickSq += tick * tick;
		this.updateSum += samples.update;
		this.fixedUpdateSum += samples.fixedUpdate;
		this.renderSum += samples.render;
		this.frames++;
		if (this.dtSum < this.resolution) {
			return;
		}

		var colors = this.colors;
		var tickMean = this.tickSum / this.frames;
		var tickSD = Math.sqrt((this.tickSq - (this.tickSum * this.tickSum / this.frames)) / (this.frames - 1));

		var color = colors[0];
		if (tickMean > 33) {
			color = colors[3];
		} else if (tickMean > 16) {
			color = colors[2];
		} else if (tickMean > 5) {
			color = colors[1];
		}

		this.tickSpan.textContent = tickMean < 10 ? Math.round(tickMean * 10) / 10 : Math.round(tickMean);
		this.tickSpan.style.color = color;
		this.tickSpan2.textContent = tickSD < 10 ? Math.round(tickSD || 0 * 10) / 10 : Math.round(tickSD);

		var bar = this.graphSpan.appendChild(this.graphSpan.firstChild);
		var overall = 0;

		var mag = Math.round(this.height * this.lagSum / this.frames / this.cap);
		bar.children[0].style.height = mag + 'px';
		overall += mag;

		mag = this.height * this.renderSum / this.frames / this.cap;
		bar.children[1].style.height = mag + 'px';
		overall += mag;

		mag = Math.round(this.height * this.updateSum / this.frames / this.cap);
		bar.children[2].style.height = mag + 'px';
		overall += mag;

		mag = Math.round(this.height * this.fixedUpdateSum / this.frames / this.cap);
		bar.children[3].style.height = mag + 'px';
		overall += mag;

		bar.style.marginTop = (this.height - overall) + 'px';

		var fpsMean = this.fpsSum / this.frames;
		var fpsSD = Math.sqrt((this.fpsSq - (this.fpsSum * this.fpsSum / this.frames)) / (this.frames - 1));
		if (fpsMean < 30) {
			color = colors[3];
		} else if (fpsMean < 40) {
			color = colors[2];
		} else if (fpsMean < 55) {
			color = colors[1];
		} else {
			color = colors[0];
		}
		this.fpsSpan.textContent = Math.round(fpsMean || 0);
		this.fpsSpan.style.color = color;
		this.fpsSpan2.textContent = Math.round(fpsSD || 0);

		this.nullify();
	},

	nullify: function() {
		this.dtSum = 0;
		this.fpsSum = this.fpsSq = 0;
		this.tickSum = this.tickSq = 0;
		this.lagSum = this.lagSq = 0;
		this.fixedUpdateSum = 0;
		this.updateSum = 0;
		this.renderSum = 0;
		this.frames = 0;
	}

};

new Component('console', Console);

module.exports = Console;
});
require.register("acmejs/lib/core/transform.js", function(exports, require, module){
'use strict';

var Component = require('./component');
var Vec2 = require('./math').Vec2;
var Mat2 = require('../math/mat2');

/**
 * Transform
 *
 * Transform keeps track of position, rotation and scale.
 *
 * It will eventually also keep track of composite and opacity.
 *
 * @extends Component
 */

function Transform() {
	this.position = Vec2();
	this.scale = Vec2();
	this._matrix = Mat2();
	this._matrixWorld = Mat2();
}

Transform.prototype = {

	attributes: {
		position: Vec2(),
		rotation: 0,
		scale: Vec2(1, 1),
		alpha: 1
	},

	create: function(attributes) {
		Vec2.copy(this.position, attributes.position);
		this.rotation = attributes.rotation;
		Vec2.copy(this.scale, attributes.scale);
		this.alpha = attributes.alpha;

		var parent = this.entity.parent;
		this.parentTransform = parent ? parent.transform : null;
		this._dirty = true;
		this.matrixAutoUpdate = true;
		this._dirtyWorld = true;

		Vec2.set(this._matrix);
		Vec2.set(this._matrixWorld);
	},

	get dirty() {
		return this._dirty;
	},

	set dirty(to) {
		this._dirty = to;
	},

	get matrix() {
		var matrix = this._matrix;
		if (this._dirty || this.matrixAutoUpdate) {
			Mat2.translate(Mat2.identity, this.position, matrix);
			Mat2.rotate(matrix, this.rotation);
			Mat2.scale(matrix, this.scale);
			this._dirty = false;
			this._dirtyWorld = true;
		}
		return matrix;
	},

	get matrixWorld() {
		var matrix = this.matrix;
		var parent = this.parentTransform;
		if (!parent) {
			return matrix;
		}
		var matrixWorld = this._matrixWorld;
		if (this._dirtyWorld) {
			Mat2.multiply(parent.matrixWorld, matrix, matrixWorld);
			this._dirtyWorld = false;
		}
		return matrixWorld;
	},

	get positionOnly() {
		var parent = this.parentTransform;
		return (!parent || parent.positionOnly) && this.rotation === 0 &&
			this.scale == 1;
	},

	set positionOnly(to) {
		if (to) {
			this.rotation = 0;
			this.scale = 1;
			this.parentTransform.positionOnly = true;
		}
	},

	compose: function(position, rotation, scale) {
		if (position != null) {
			Vec2.copy(this.position, position);
		}
		if (rotation != null) {
			this.rotation = rotation;
		}
		if (scale != null) {
			Vec2.copy(this.scale, scale);
		}
		this._dirty = true;
	},

	applyMatrix: function(ctx) {
		var mtx = this.matrixWorld;
		ctx.setTransform(
			mtx[0], mtx[1], mtx[2], mtx[3],
			mtx[4] + 0.5 | 0, mtx[5] + 0.5 | 0
		);
	}

};

new Component('transform', Transform);

module.exports = Transform;
});
require.register("acmejs/lib/core/bounds.js", function(exports, require, module){
'use strict';

var Component = require('./component');
var Pool = require('./pool');
var Color = require('./color');
var Vec2 = require('./math').Vec2;

/**
 * @class Bounds
 *
 * Tracks shape and dimensions of an entity.
 *
 * TODO: https://github.com/photonstorm/phaser/blob/master/Phaser/Collision.ts
 *
 * @extends Component
 * @property {String} shape "circle" or "rect"
 * @property {Number} radius Circle radius
 * @property {Number[]} size Rect size
 */
function Bounds() {
	this.size = Vec2();
	this.shape = '';
	this.radius = 0.0;
}

Bounds.prototype = {

	attributes: {
		shape: 'rect',
		radius: 0,
		size: Vec2()
	},

	create: function(attributes) {
		Vec2.copy(this.size, attributes.size);
		this.shape = attributes.shape;
		this.radius = attributes.radius;
	},

	get top() {
		if (this.shape === 'circle') {
			return this.transform.position[1] - this.radius;
		}
		return this.transform.position[1];
	},

	get bottom() {
		if (this.shape === 'circle') {
			return this.transform.position[1] + this.radius;
		}
		return this.transform.position[1] + this.size[1];
	},

	/*
	getAabb: function() {
		if (!this.topLeft) {
			this.topLeft = Vec2();
			this.bottomRight = Vec2();
		}
		Vec2.set(
			this.topLeft,
			this.position[0] + this.size[0] * 0.5 * (this.align[0] + 1),
			this.position[1] + this.size[1] * 0.5 * (this.align[1] + 1)
		);
		Vec2.set(
			this.bottomRight,
			this.position[0] + this.size[0] * 0.5 * (this.align[0] + 5),
			this.position[1] + this.size[1] * 0.5 * (this.align[1] + 5)
		);
		return this.topLeft;
	},
	*/

	intersectLine: function(a1, a2, result) {
		var pos = this.transform.position;
		switch (this.shape) {
			case 'circle':
				return Bounds.intersectLineCirc(a1, a2, pos, this.radius, result);
			case 'rect':
				return false;
		}
		return false;
	},

	intersect: function(bound) {
		return null;
	},

	contains: function(point) {
		var pos = this.transform.position;
		switch (this.shape) {
			case 'circle':
				return Bounds.circPoint(pos, this.radius, point);
			case 'rect':
				return Bounds.rectPoint(pos, this.size, point);
		}
		return false;
	},

	withinRect: function(pos, size) {
		var mypos = this.transform.position;
		switch (this.shape) {
			case 'circle':
				return Bounds.rectCirc(pos, size, mypos, this.radius);
			case 'rect':
				return Bounds.rectRect(pos, size, mypos, this.size);
		}
		return false;
	}

};

/**
 * Intersection circle/point
 *
 * http://www.openprocessing.org/user/54
 *
 * @param {Number[]} center
 * @param {Number} radius
 * @param {Number[]} point
 * @return {Boolean}
 */
Bounds.circPoint = function(center, radius, point) {
	return Vec2.distSq(point, center) <= radius * radius;
};

/**
 * Intersection rectangle/point
 *
 * @param {Number[]} pos
 * @param {Number[]} size
 * @param {Number[]} point
 * @return {Boolean}
 */
Bounds.rectPoint = function(pos, size, point) {
	return pos[0] - size[0] < point[0] && pos[1] < point[1] && pos[0] + size[0] > point[0] && pos[1] + size[1] > point[1];
};

/**
 * Closes point to a line
 *
 * http://blog.generalrelativity.org/actionscript-30/collision-detection-circleline-segment-circlecapsule/
 *
 * @static
 * @param {Number[]} a Line P1
 * @param {Number[]} b Line P2
 * @param {Number[]} point Point
 * @param {Number[]} result Result
 * @return {Number[]} Result
 */
Bounds.closestLinePoint = function(a, b, point, result) {
	Vec2.sub(b, a, v);
	Vec2.sub(point, a, w);
	var t = Math.clamp(Vec2.dot(w, v) / Vec2.dot(v, v), 0, 1);
	return Vec2.add(a, Vec2.scale(v, t, result));
};

var v = Vec2();
var w = Vec2();

/**
 * Intersection line/circle
 *
 * @static
 * @param {Number[]} a Line P1
 * @param {Number[]} b Line P2
 * @param {Number[]} center Circle center
 * @param {Number} radius Circe radius
 * @param {Number[]} result Result vector
 * @return {Number[]|Boolean}
 */
Bounds.intersectLineCirc = function(a, b, center, radius, result) {
	Bounds.closestLinePoint(a, b, center, lineCircTest);
	Vec2.sub(lineCircTest, center);
	if (Vec2.dot(lineCircTest, lineCircTest) > radius * radius) {
		return false;
	}
	if (!result) {
		return true;
	}
	return Vec2.copy(result, lineCircTest);
};

var lineCircTest = Vec2();

/**
 * Intersection rectangle/circle
 *
 * http://stackoverflow.com/questions/401847/circle-rectangle-collision-detection-intersection/402010#402010
 *
 * @param {Number[]} topLeft Rectangle top-left point
 * @param {Number[]} size Rectangle size
 * @param {Number[]} center Circle center
 * @param {Number} radius Circle radius
 * @return {Boolean}
 */
Bounds.rectCirc = function(topLeft, size, center, radius) {
	var circleDistanceX = Math.abs(center[0] - topLeft[0] - size[0] / 2);
	var circleDistanceY = Math.abs(center[1] - topLeft[1] - size[1] / 2);
	if (circleDistanceX > (size[0] / 2 + radius) || circleDistanceY > (size[1] / 2 + radius)) {
		return false;
	}
	if (circleDistanceX <= size[0] / 2 || circleDistanceY <= size[1] / 2) {
		return true;
	}
	var cornerDistance = Math.pow(circleDistanceX - size[0] / 2, 2) + Math.pow(circleDistanceY - size[1] / 2, 2);
	return cornerDistance <= Math.pow(radius, 2);
};

/**
 * Intersection rectangle/rectangle
 *
 * @param {Number[]} pos
 * @param {Number[]} size
 * @param {Number[]} pos2
 * @param {Number[]} size2
 * @return {Boolean}
 */
Bounds.rectRect = function(pos, size, pos2, size2) {
	return !(pos[0] > pos2[0] + size2[0] || pos[0] + size[0] < pos2[0] || pos[1] > pos2[1] + size2[1] || pos[1] + size[1] < pos2[1]);
};

/**
 * Random point in circle
 */
Bounds.randCircPoint = function(point, center, radius) {
	Vec2.set(point, 0, Math.rand(0, radius));
	Vec2.rotate(point, Math.rand(-Math.PI, Math.PI));
	return Vec2.add(point, center);
};

/**
 * Random point in rectangle
 */
Bounds.randRectPoint = function(point, pos, size) {
	Vec2.set(point, Math.rand(0, size[0]), Math.rand(0, size[1]));
	return Vec2.add(point, pos);
};

new Component('bounds', Bounds);

/**
 * Intersection line/rectangle
 *
 * http://www.openprocessing.org/sketch/8010
 *
 * @param  {[type]} point1  [description]
 * @param  {[type]} point2  [description]
 * @param  {[type]} topLeft [description]
 * @param  {[type]} size    [description]
 * @return {bool}           They intersect
 *
Bounds.lineRect = function(point1, point2, topLeft, size) {
	// Calculate m and c for the equation for the line (y = mx+c)
	m = (a1[1] - y0) / (a1[0] - x0);
	c = y0 - (m * x0);

	// if the line is going up from right to left then the top intersect point is on the left
	if (m > 0) {
		top_intersection = (m * l + c);
		bottom_intersection = (m * r + c);
	}
	// otherwise it's on the right
	else {
		top_intersection = (m * r + c);
		bottom_intersection = (m * l + c);
	}

	// work out the top and bottom extents for the triangle
	if (y0 < a1[1]) {
		toptrianglepoint = y0;
		bottomtrianglepoint = a1[1];
	} else {
		toptrianglepoint = a1[1];
		bottomtrianglepoint = y0;
	}

	var topoverlap: Number;
	var botoverlap: Number;

	// and calculate the overlap between those two bounds
	topoverlap = top_intersection > toptrianglepoint ? top_intersection : toptrianglepoint;
	botoverlap = bottom_intersection < bottomtrianglepoint ? bottom_intersection : bottomtrianglepoint;

	// (topoverlap<botoverlap) :
	// if the intersection isn't the right way up then we have no overlap

	// (!((botoverlap<t) || (topoverlap>b)) :
	// If the bottom overlap is higher than the top of the rectangle or the top overlap is
	// lower than the bottom of the rectangle we don't have intersection. So return the negative
	// of that. Much faster than checking each of the points is within the bounds of the rectangle.
	return (topoverlap < botoverlap) && (!((botoverlap < t) || (topoverlap > b)));
};
*/

/*
Bounds.lineCirc = function(point1, point2, center, radius) {
	var a, b, bb4ac, c, dx, dy, ia1[0], ia2[0], ia1[1], ia2[1], mu, testX, testY;
	dx = a2[0] - a1[0];
	dy = a2[1] - a1[1];
	a = dx * dx + dy * dy;
	b = 2 * (dx * (a1[0] - cx) + dy * (a1[1] - cy));
	c = cx * cx + cy * cy;
	c += a1[0] * a1[0] + a1[1] * a1[1];
	c -= 2 * (cx * a1[0] + cy * a1[1]);
	c -= cr * cr;
	bb4ac = b * b - 4 * a * c;
	if (bb4ac < 0) {
		return false;
	}
	mu = (-b + sqrt(b * b - 4 * a * c)) / (2 * a);
	ia1[0] = a1[0] + mu * dx;
	ia1[1] = a1[1] + mu * dy;
	mu = (-b - sqrt(b * b - 4 * a * c)) / (2 * a);
	ia2[0] = a1[0] + mu * dx;
	ia2[1] = a1[1] + mu * dy;
	if (dist(a1[0], a1[1], cx, cy) < dist(a2[0], a2[1], cx, cy)) {
		testX = a2[0];
		testY = a2[1];
	} else {
		testX = a1[0];
		testY = a1[1];
	}
	if (dist(testX, testY, ia1[0], ia1[1]) < dist(a1[0], a1[1], a2[0], a2[1]) || dist(testX, testY, ia2[0], ia2[1]) < dist(a1[0], a1[1], a2[0], a2[1])) {
		return true;
	}
	return false;
};
*/

/**
 * Intersection line/line
 *
 * http://stackoverflow.com/questions/3746274/line-intersection-with-aabb-rectangle
 * http://jsperf.com/line-intersection2/2
 *
 * @param {Number[]} a1 Line 1 P1
 * @param {Number[]} a2 Line 1 P2
 * @param {Number[]} b1 Line 2 P1
 * @param {Number[]} b2 Line 2 P2
 * @param {Number[]} result
 * @return {Number[]}
 */
Bounds.intersectLine = function(a1, a2, b1, b2, result) {
	if (!result) {
		// http://www.bryceboe.com/2006/10/23/line-segment-intersection-algorithm/comment-page-1/
		return ccw(a1, b1, b2) != ccw(a2, b1, b2) &&
			ccw(a1, a2, b1) != ccw(a1, a2, b2);
	}

	// http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect/1968345#1968345
	var s1_x = a2[0] - a1[0];
	var s1_y = a2[1] - a1[1];
	var s2_x = b2[0] - b1[0];
	var s2_y = b2[1] - b1[1];

	var s = (-s1_y * (a1[0] - b1[0]) + s1_x * (a1[1] - b1[1])) / (-s2_x * s1_y + s1_x * s2_y);
	var t = (s2_x * (a1[1] - b1[1]) - s2_y * (a1[0] - b1[0])) / (-s2_x * s1_y + s1_x * s2_y);

	// Collision detected
	if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
		return Vec2.set(result, a1[0] + (t * s1_x), a1[1] + (t * s1_y));
	}
	return null;
};

function ccw(a, b, c) {
	var cw = ((c[1] - a[1]) * (b[0] - a[0])) - ((b[1] - a[1]) * (c[0] - a[0]));
	return (cw > 0) ? true : cw < 0 ? false : true; /* colinear */
}

/**
 * Bounds.Debug
 *
 * Outlines the boundaries and angle of an entity.
 *
 * @extends Component
 */
function BoundsDebug() {
	this.color = Color();
}

BoundsDebug.prototype = {

	attributes: {
		color: Color.gray,
		opacity: 0.5,
		fill: false
	},

	create: function(attributes) {
		this.opacity = attributes.opacity;
		this.fill = attributes.fill;
		Color.copy(this.color, attributes.color);
	},

	render: function(ctx) {
		var bounds = this.bounds;
		ctx.save();
		if (this.fill) {
			ctx.fillStyle = Color.rgba(this.color, this.opacity * 0.5);
		}
		ctx.strokeStyle = Color.rgba(this.color, this.opacity);
		ctx.lineWidth = 1;
		this.transform.applyMatrix(ctx);
		if (bounds.shape === 'circle') {
			ctx.beginPath();
			ctx.lineTo(0, bounds.radius);
			ctx.moveTo(0, 0);
			ctx.arc(0, 0, bounds.radius | 0, 0, Math.TAU);
			if (this.fill) {
				ctx.fill();
			}
			ctx.stroke();
		} else {
			var size = bounds.size;
			ctx.strokeRect(-size[0] / 2 | 0, -size[1] / 2 | 0, size[0] | 0, size[1] | 0);
			if (this.fill) {
				ctx.fillRect(-size[0] / 2 | 0, -size[1] / 2 | 0, size[0] | 0, size[1] | 0);
			}
		}
		ctx.restore();
	}

};

new Component('boundsDebug', BoundsDebug);

Bounds.Debug = BoundsDebug;

module.exports = Bounds;

});
require.register("acmejs/lib/core/input.js", function(exports, require, module){
'use strict';

var Component = require('./component');
var Pool = require('./pool');
var Vec2 = require('./math').Vec2;
var Engine = require('./engine');

/**
 * @class Input
 * Input handling for mouse, touch, keyboard and hardware sensors
 *
 * @extends Component
 */
function Input() {
  this.queue = [];
  this.locks = {};
  this.position = Vec2();
  this.lastPos = Vec2();
  this.touchState = '';
  this.axis = Vec2();
  this.mouseAxis = Vec2();
  this.orientation = Vec2();
  this.lastOrientation = Vec2();
  this.baseOrientation = Vec2();

  this.map = {
    32: 'space',
    192: 'debug',
    38: 'up',
    87: 'up',
    39: 'right',
    68: 'right',
    40: 'bottom',
    83: 'bottom',
    37: 'left',
    65: 'left',
    219: 'squareLeft',
    221: 'squareRight'
  };
  this.axisMap = {
    left: Vec2(0, -1),
    right: Vec2(0, 1),
    up: Vec2(1, -1),
    bottom: Vec2(1, 1)
  };

  this.keyNames = [];
  this.keys = {};

  var map = this.map;
  for (var code in map) {
    var key = map[code];
    if (!~this.keyNames.indexOf(key)) {
      this.keyNames.push(key);
      this.keys[key] = null;
    }
  }

  this.throttled = {
    mousemove: true,
    deviceorientation: true
  };

  this.lastEvent = '';
  this.attached = false;

  this.events = this.support.touch ? {
    touchstart: 'startTouch',
    touchmove: 'moveTouch',
    touchend: 'endTouch',
    touchcancel: 'endTouch'
  } : {
    mousedown: 'startTouch',
    mousemove: 'moveTouch',
    mouseup: 'endTouch',
    keydown: 'keyStart',
    keyup: 'keyEnd'
  };

  this.events.blur = 'blur';
  this.events.deviceorientation = 'deviceOrientation';
}

Input.prototype = {

  attach: function() {
    if (this.attached) {
      return;
    }
    this.attached = true;
    for (var type in this.events) {
      window.addEventListener(type, this, false);
    }
    this.queue.length = 0;
  },

  detach: function() {
    if (!this.attached) {
      return;
    }
    this.attached = false;
    for (var type in this.events) {
      window.removeEventListener(type, this, false);
    }
  },

  support: {
    touch: 'ontouchstart' in window,
    orientation: 'ondeviceorientation' in window
  },

  handleEvent: function(event) {
    if (event.metaKey) {
      return;
    }
    // event.preventDefault();
    var type = event.type;
    if (this.throttled[type] && this.lastEvent == type) {
      this.queue[this.queue.length - 1] = event;
      return;
    }
    this.lastEvent = type;
    this.queue.push(event);
  },

  keyStart: function(event) {
    var key = this.map[event.keyCode];
    if (key && !this.keys[key]) {
      if (!this.lock('key-' + key)) {
        return false;
      }
      this.keys[key] = 'began';
      this.updateAxis(key);
      Engine.trigger('onKeyBegan', key);
    }
  },

  keyEnd: function(event) {
    var key = this.map[event.keyCode];
    if (key) {
      if (!this.lock('key-' + key)) {
        return false;
      }
      this.keys[key] = 'ended';
      this.updateAxis(key, true);
      Engine.trigger('onKeyEnded', key);
    }
  },

  startTouch: function(event) {
    if (!this.lock('touch')) {
      return false;
    }
    this.resolve(event);
    if (!this.touchState && !event.metaKey) {
      this.touchState = 'began';
      Engine.trigger('onTouchBegan');
    }
  },

  moveTouch: function(event) {
    var state = this.touchState;
    if ((state === 'began' || state === 'ended') && !this.lock('touch')) {
      return false;
    }
    this.resolve(event);
    if (state && state !== 'ended' && state !== 'moved') {
      this.touchState = 'moved';
    }
  },

  endTouch: function(event) {
    if (!this.lock('touch')) {
      return false;
    }
    this.resolve(event);
    if (this.touchState && (!this.support.touch || !event.targetTouches.length)) {
      Engine.trigger('onTouchEnded');
      this.touchState = 'ended';
    }
  },

  updateAxis: function(key, ended) {
    var axis = this.axisMap[key];
    if (axis) {
      if (ended) {
        this.axis[axis[0]] -= axis[1];
      } else {
        this.axis[axis[0]] += axis[1];
      }
    }
  },

  blur: function() {
    if (this.touchState && this.touchState !== 'ended') {
      this.touchState = 'ended';
    }
    var keys = this.keys;
    var names = this.keyNames;
    for (var i = 0, l = names.length; i < l; i++) {
      var key = names[i];
      if (keys[key] && keys[key] !== 'ended') {
        keys[key] = 'ended';
        this.updateAxis(key, true);
      }
    }
  },

  calibrateOrientation: function() {
    this.baseOrientationTime = this.orientationTime;
    Vec2.copy(this.baseOrientation, this.orientation);
    Vec2.set(this.orientation);
  },

  deviceOrientation: function(event) {
    Vec2.copy(this.lastOrientation, this.orientation);
    Vec2.sub(Vec2.set(this.orientation, event.gamma | 0, event.beta | 0), this.baseOrientation);
    this.orientationTime = event.timeStamp / 1000;
    if (!this.baseOrientationTime) {
      this.calibrateOrientation();
    }
  },

  resolve: function(event) {
    var coords = this.support.touch ? event.targetTouches[0] : event;
    if (coords) {
      this.lastTime = this.time;
      this.time = event.timeStamp / 1000;
      Vec2.copy(this.lastPos, this.position);
      var renderer = Engine.renderer;
      Vec2.set(this.position, (coords.pageX - renderer.margin[0]) / renderer.scale | 0, (coords.pageY - renderer.margin[1]) / renderer.scale | 0);
    }
  },

  lock: function(key) {
    if (this.locks[key] === this.frame) {
      return false;
    }
    this.locks[key] = this.frame;
    return true;
  },

  postUpdate: function() {
    switch (this.touchState) {
      case 'began':
        this.touchState = 'stationary';
        break;
      case 'ended':
        this.touchState = null;
        break;
    }

    var keys = this.keys;
    var names = this.keyNames;
    for (var i = 0, l = names.length; i < l; i++) {
      var key = names[i];
      switch (keys[key]) {
        case 'began':
          keys[key] = 'pressed';
          break;
        case 'ended':
          keys[key] = null;
          break;
      }
    }

    this.frame = Engine.frame;

    var event = null;
    var queue = this.queue;
    while ((event = queue[0])) {
      var type = event.type;
      if (this[this.events[type] || type](event) != null) {
        break;
      }
      queue.shift();
    }
    if (!queue.length) {
      this.lastEvent = '';
    }
  },

  onEnginePause: function() {
    this.detach();
  },

  onEngineStart: function() {
    this.attach();
  }

};

new Component('input', Input);

module.exports = Input;

});
require.register("acmejs/lib/core/sprite.js", function(exports, require, module){
'use strict';

var Vec2 = require('./math').Vec2;
var Component = require('./component');
var Pool = require('./pool');

/**
 * @class Sprite.Asset
 *
 * Loads and paints a single image file.
 *
 * @constructor
 * Either loaded from source or drawn via callback, created from given width/height.
 *
 * @param {String|Function} srcOrRepaint URL or callback to draw image on demand
 * @param {Number[]} size (optional) Override size for drawing canvas
 * @param {Number} baseScale (optional) Base scale applied to all draws, defaults to 1
 */
function SpriteAsset(srcOrRepaint, size, baseScale) {
	this.baseScale = (baseScale != null) ? baseScale : 1;
	this.size = Vec2(size);
	this.bufferSize = Vec2(size);
	this.defaultAlign = Vec2.center;
	this.defaultOffset = Vec2();
	this.defaultScale = Vec2(1, 1);
	this.buffer = document.createElement('canvas');
	this.bufferCtx = this.buffer.getContext('2d');
	this.scale = 1;

	// console.log(typeof srcOrRepaint);

	switch (typeof srcOrRepaint) {
		case 'string':
			this.src = srcOrRepaint;
			var img = new Image();
			this.img = img;
			img.addEventListener('load', this);
			this.loading = true;
			img.src = srcOrRepaint;
			if (this.loading && img.width && img.height) {
				this.handleEvent();
			}
			break;
		case 'function':
			this.repaint = srcOrRepaint;
			this.refresh();
			break;
		case 'object':
			this.repaint = this.repaintOnComponent;
			this.repaintSrc = srcOrRepaint;
			this.refresh();
			break;
	}
}

SpriteAsset.prototype = {

	toString: function() {
		var url = (this.buffer) ? this.buffer.toDataURL() : 'Pending';
		return 'SpriteAsset ' + (Vec2.toString(this.size)) + ' ' +
			(Vec2.toString(this.bufferSize)) + '\n' +
			(this.src || this.repaint) + '\n' +
			url;
	},

	repaintOnComponent: function() {
		this.repaintSrc.onRepaint(this.bufferCtx, this);
	},

	handleEvent: function() {
		// console.log('Loaded ' + this);
		if (!this.loading) {
			return;
		}
		this.loading = false;
		Vec2.set(this.size, this.img.width, this.img.height);
		this.refresh();
	},

	/**
	 * Draw whole or sprite of image to canvas.
	 *
	 * Draws only if image is loaded.
	 *
	 * @param {Object} ctx 2d-canvas context
	 * @param {Number[]} toPos (optional) Position to draw to.
	 * @param {Number[]} align (optional) Align draw position, between
	 *   lower-left [-1, -1] and upper-right [1, 1]
	 * @param {Number[]} size (optional) Target size
	 * @param {Number[]} fromPos (optional) Source position (for sprites)
	 * @param {Number[]} scale (optional) Target scaling, applied to size
	 */
	draw: function(ctx, toPos, align, size, fromPos, scale) {
		if (!this.ready) {
			return;
		}
		if (!toPos) {
			toPos = Vec2.zero;
		}
		if (!align) {
			align = this.defaultAlign;
		}
		if (!size) {
			size = this.bufferSize;
		}
		if (!fromPos) {
			fromPos = this.defaultOffset;
		}
		if (!scale) {
			scale = this.defaultScale;
		}
		ctx.drawImage(this.buffer,
			fromPos[0] | 0, fromPos[1] | 0,
			size[0], size[1],
			toPos[0] - size[0] / 2 * (align[0] + 1) | 0,
			toPos[1] - size[1] / 2 * (align[1] + 1) | 0,
			size[0] * scale[0], size[1] * scale[1]
		);
	},

	repaint: function() {
		var size = this.size;
		this.buffer.width = size[0];
		this.buffer.height = size[1];
		this.bufferCtx.drawImage(this.img, 0, 0, size[0], size[1]);
		this.sample();
	},

	sample: function() {
		var scale = this.scale;
		var size = this.size;
		var bufferCtx = this.bufferCtx;
		var data = bufferCtx.getImageData(0, 0, size[0], size[1]).data;
		this.buffer.width = this.bufferSize[0];
		this.buffer.height = this.bufferSize[1];
		for (var x = 0, w = size[0], h = size[1]; x <= w; x += 1) {
			for (var y = 0; y <= h; y += 1) {
				var i = (y * size[0] + x) * 4;
				bufferCtx.fillStyle = 'rgba(' + data[i] + ', ' + data[i + 1] + ', ' +
					data[i + 2] + ', ' + (data[i + 3] / 255) + ')';
				bufferCtx.fillRect(x * scale, y * scale, scale, scale);
			}
		}
	},

	refresh: function(scale) {
		// console.log('Refresh');
		scale = (scale || 1) * this.baseScale;
		if (this.ready && this.scale === scale) {
			return;
		}
		this.scale = scale;
		this.buffer.width = this.bufferSize[0] = this.size[0] * scale | 0;
		this.buffer.height = this.bufferSize[1] = this.size[1] * scale | 0;
		// Vec2.scale(this.bufferSize, -0.5, this.defaultOffset);
		this.repaint(this.bufferCtx, this);
		this.ready = true;
	}

};

/**
 * @class Sprite.Sheet
 *
 * Sprite-sheet for animations.
 *
 * @constructor
 * Create new sheet from set of pre-defined frames or automtically
 * determined frames, given sequence size.
 *
 * @param {Object} attributes sprites, frames, speed, size, align, sequences
 */
function SpriteSheet(attributes) {
	var sprites = attributes.sprites || [];
	this.sprites = Array.isArray(sprites) ? sprites : [sprites];
	this.frames = [];
	if (Array.isArray(attributes.frames)) {
		var frames = attributes.frames;
		for (var i = 0, l = frames.length; i < l; i++) {
			this.frames.push(frames[i]);
		}
	}
	this.defaults = {};
	this.defaults.speed = attributes.speed || 0.2;
	this.defaults.size = attributes.size || Vec2(1, 1);
	this.defaults.align = attributes.align || Vec2.center;
	this.sequences = {};
	var	sequences = attributes.sequences || {};
	for (var id in sequences) {
		this.addSequence(id, sequences[id]);
	}
}

SpriteSheet.prototype = {

	/**
	 * Add sequence to spritesheet.
	 *
	 * Sequences are defined as short-form by Array:
	 *   [frameIndexes, next || null, speed || defaultSpeed || sprite || 0]
	 * or Object:
	 *   {frames: [], next: 'id', speed: seconds, sprite: 0}
	 *
	 * @param {String} id       Sequence name (walk, jump, etc)
	 * @param {Array|Object} sequence Array or object
	 */
	addSequence: function(id, sequence) {
		if (Array.isArray(sequence)) {
			// Convert short form Array to Object
			var frames = [];
			for (var frame = sequence[0], l = sequence[1]; frame <= l; frame++) {
				frames.push(frame);
			}
			sequence = {
				frames: frames,
				next: sequence[2] || null,
				speed: sequence[3] || this.defaults.speed,
				name: id,
				sprite: sequence[4] || 0
			};
		}
		if (sequence.next === true) {
			sequence.next = id;
		}
		if (!sequence.speed) {
			sequence.speed = this.defaults.speed;
		}

		this.sequences[id] = sequence;
		if (!this.defaultSequence) {
			this.defaultSequence = id;
		}
	},

	prepare: function() {
		var sprites = this.sprites;
		for (var i = 0, l = sprites.length; i < l; i++) {
			if (!sprites[i].ready) {
				return false;
			}
		}
		if (!this.frames.length) {
			var defaults = this.defaults;
			var size = defaults.size;
			var align = defaults.align;
			for (i = 0, l = sprites.length; i < l; i++) {
				var sprite = sprites[i];
				var cols = sprite.size[0] / size[0] | 0;
				var rows = sprite.size[1] / size[1] | 0;
				// debugger;
				for (var y = 0; y < rows; y++) {
					for (var x = 0; x < cols; x++) {
						this.frames.push({
							sprite: sprite,
							position: Vec2(x * size[0], y * size[1]),
							size: size,
							align: align || Vec2.center
						});
					}
				}
			}
		}
		this.ready = true;
		return true;
	},

	draw: function(ctx, idx) {
		if (!this.ready && !this.prepare()) {
			return;
		}
		var frame = this.frames[idx || 0];
		frame.sprite.draw(ctx, null, frame.align, frame.size, frame.position);
	}

};

/**
 * @class Sprite.Tween
 *
 * Sprite Tween lets components draw animation sequences from Sheets.
 *
 * @extends Component
 */
function SpriteTween() {}

SpriteTween.prototype = {

	attributes: {
		asset: null,
		speed: null,
		sequence: null,
		offset: 0,
		composite: null
	},

	create: function(attributes) {
		this.asset = attributes.asset;
		this.composite = attributes.composite;
		this.sequence = attributes.sequence;
		this.speed = attributes.speed;
		this.isSheet = this.asset instanceof SpriteSheet;
		if (this.isSheet) {
			this.frame = 0;
			if (this.speed == null) {
				this.speed = this.asset.defaults.speed;
			}
			this.dtime = attributes.offset;
			if (!this.sequence) {
				this.sequence = this.asset.defaultSequence;
			}
		}
	},

	preRender: function(dt) {
		if (this.isSheet && !this.paused) {
			var dtime = (this.dtime += dt);
			var frames;
			var speed;
			var frameCount;
			if (this.sequence) {
				var sequence = this.asset.sequences[this.sequence];
				speed = sequence.speed;
				frames = sequence.frames;
				frameCount = frames.length;
				if (dtime >= frameCount * speed) {
					this.entity.trigger('onSequenceEnd');
					if (sequence.next) {
						if (sequence.next !== this.sequence) {
							return this.goto(sequence.next);
						}
					} else {
						this.pause();
						return this;
					}
					dtime = dtime % (frameCount * speed);
				}
				this.frame = frames[dtime / speed | 0];
			} else {
				frames = this.asset.frames;
				frameCount = frames.length;
				speed = this.speed;
				dtime = dtime % (frameCount * speed);
				var frame = dtime / speed | 0;
				if (frame < this.frame) {
					this.entity.trigger('onSequenceEnd');
				}
				this.frame = dtime / speed | 0;
			}
		}
	},

	render: function(ctx) {
		ctx.save();
		this.transform.applyMatrix(ctx);
		if (this.composite) {
			ctx.globalCompositeOperation = this.composite;
		}
		this.asset.draw(ctx, this.frame);
		ctx.restore();
	},

	pause: function() {
		this.paused = true;
		return this;
	},

	play: function() {
		this.paused = false;
		return this;
	},

	goto: function(id) {
		if (isNaN(id)) {
			if (this.sequence !== id) {
				this.dtime = 0;
				this.sequence = id;
				if (this.paused) {
					this.paused = false;
					this.preRender(0);
					this.paused = true;
				}
			}
		} else {
			this.sequence = null;
			this.frameIndex = id;
		}
		return this;
	}

};

new Component('spriteTween', SpriteTween);

module.exports.Asset = SpriteAsset;
module.exports.Tween = SpriteTween;
module.exports.Sheet = SpriteSheet;

});
require.register("acmejs/lib/core/border.js", function(exports, require, module){
'use strict';

var Component = require('./component');
var Pool = require('./pool');
var Vec2 = require('./math').Vec2;
var Engine = require('./engine');

/**
 * @class Border
 *
 * Border lets entities react on contact with the canvas borders.
 *
 * @extends Component
 * @property {String} [mode="bounce"] Reaction to contact with border, "bounce", "mirror", "kill"
 * @property {Number} [restitution=1] Restitution on bounce
 */
function Border() {}

Border.prototype = {

	attributes: {
		mode: 'bounce',
		restitution: 1
	},

	create: function(attributes) {
		this.mode = attributes.mode;
		this.restitution = attributes.restitution;
	}

};

var pos = Vec2();
// TODO: Make topLeft/bottomRight
var horizontal = Vec2();
var vertical = Vec2();

Border.simulate = function(dt) {
	var size = Engine.renderer.content;
	var viewport = Engine.renderer.position;
	Vec2.set(horizontal, viewport[0], viewport[0] + size[0]);
	Vec2.set(vertical, viewport[1], viewport[1] + size[1]);

	var borders = this.heap;
	for (var i = 0, l = borders.length; i < l; i++) {
		var border = borders[i];
		if (!border.enabled) {
			continue;
		}

		var entity = border.entity;
		var restitution = border.restitution;
		var mode = border.mode;
		var kinetic = border.kinetic;

		var vel = null;
		if (kinetic) {
			if (!kinetic.enabled || kinetic.sleeping) {
				continue;
			}
			vel = kinetic.velocity;
		}

		var mirror = (mode === 'mirror');
		var bounce = (mode === 'bounce' && vel);
		Vec2.copy(pos, entity.transform.position);

		var radius = entity.bounds.radius;
		if (mirror) {
			radius *= -1;
		}

		var contact = 0;

		// Horizontal
		var diff = pos[0] - radius - horizontal[0];
		if (diff < 0) {
			if (mirror) {
				pos[0] = horizontal[1] - radius;
			} else {
				pos[0] -= diff;
				if (bounce) {
					vel[0] *= -restitution;
				}
			}
			contact = -1;
		} else {
			diff = pos[0] + radius - horizontal[1];
			if (diff > 0) {
				if (mirror) {
					pos[0] = radius;
				} else {
					pos[0] -= diff;
					if (bounce) {
						vel[0] *= -restitution;
					}
				}
				contact = -1;
			} else {
				// Vertical
				diff = pos[1] - radius - vertical[0];

				if (diff < 0) {
					if (mirror) {
						pos[1] = vertical[1] - radius;
					} else {
						pos[1] -= diff;
						if (bounce) {
							vel[1] *= -restitution;
						}
					}
					contact = 1;
				} else {
					diff = pos[1] + radius - vertical[1];
					if (diff > 0) {
						if (mirror) {
							pos[1] = radius;
						} else {
							pos[1] -= diff;
							if (bounce) {
								vel[1] *= -restitution;
							}
						}
						contact = 1;
					}
				}
			}
		}

		// We contact
		if (contact) {
			entity.transform.compose(pos);
			/**
			 * @event onBorder Fired on contact
			 * @param {Number[]} contact Contact point
			 */
			entity.trigger('onBorder', contact);
			if (border.mode === 'kill') {
				entity.destroy();
			}
		}
	}
};

new Component('border', Border);

module.exports = Border;

});
require.register("acmejs/lib/core/collider.js", function(exports, require, module){
'use strict';

var Component = require('./component');
var Pool = require('./pool');
var Vec2 = require('./math').Vec2;
var Engine = require('./engine');

/**
 * Collider
 *
 * Circle only
 *
 * http://jsperf.com/circular-collision-detection/2
 * https://sites.google.com/site/t3hprogrammer/research/circle-circle-collision-tutorial#TOC-Dynamic-Circle-Circle-Collision
 * http://gamedev.tutsplus.com/tutorials/implementation/when-worlds-collide-simulating-circle-circle-collisions/
 *
 * @extends Component
 */
function Collider() {}

Collider.prototype = {

  attributes: {
    trigger: false,
    include: null,
    exclude: null
  },

  create: function(attributes) {
    this.trigger = attributes.trigger;
    this.include = attributes.include;
    this.exclude = attributes.exclude;
  }

};

Collider.simulate = function(dt) {
  var colliders = this.heap;
  var i = colliders.length;
  while (i--) {
    var collider1 = colliders[i];
    if (!collider1.enabled) {
      continue;
    }
    var j = i;
    while (j-- && collider1.enabled) {
      var collider2 = colliders[j];
      var kinetic1 = collider1.kinetic;
      var kinetic2 = collider2.kinetic;
      var entity1 = collider1.entity;
      var entity2 = collider2.entity;

      if (!collider2.enabled ||
          (kinetic1.sleeping && kinetic2.sleeping) ||
          (collider1.include && !collider2[collider1.include]) ||
          (collider2.include && !collider1[collider2.include]) ||
          (collider1.exclude && collider2[collider1.exclude]) ||
          (collider2.exclude && collider1[collider2.exclude])) {
        continue;
      }

      var radius1 = entity1.bounds.radius;
      var radius2 = entity2.bounds.radius;
      var pos1 = entity1.transform.position;
      var pos2 = entity2.transform.position;
      var radiusSum = radius1 + radius2;

      var diffSq = Vec2.distSq(pos1, pos2);
      if (diffSq > radiusSum * radiusSum) {
        continue;
      }

      Vec2.norm(Vec2.sub(pos1, pos2, p));
      var diff = Math.sqrt(diffSq);

      if (collider1.trigger || collider2.trigger) {
        triggerEvent.normal = p;
        triggerEvent.diff = diff;
        triggerEvent.entity = entity2;
        entity1.trigger('onTrigger', triggerEvent);

        triggerEvent.entity = entity1;
        entity2.trigger('onTrigger', triggerEvent);
        continue;
      }

      diff -= radiusSum;
      var vel1 = kinetic1.velocity;
      var vel2 = kinetic2.velocity;
      var mass1 = kinetic1.mass || 1;
      var mass2 = kinetic2.mass || 1;

      if (diff < 0) {
        Vec2.add(
          pos1,
          Vec2.scale(p, -diff * 2 * radius1 / radiusSum, cache)
        );
        Vec2.add(
          pos2,
          Vec2.scale(p, diff * 2 * radius2 / radiusSum, cache)
        );
      }

      // normal vector to collision direction
      Vec2.perp(p, n);

      var vp1 = Vec2.dot(vel1, p); // velocity of P1 along collision direction
      var vn1 = Vec2.dot(vel1, n); // velocity of P1 normal to collision direction
      var vp2 = Vec2.dot(vel2, p); // velocity of P2 along collision direction
      var vn2 = Vec2.dot(vel2, n); // velocity of P2 normal to collision

      // fully elastic collision (energy & momentum preserved)
      var vp1After = (mass1 * vp1 + mass2 * (2 * vp2 - vp1)) / (mass1 + mass2);
      var vp2After = (mass1 * (2 * vp1 - vp2) + mass2 * vp2) / (mass1 + mass2);

      Vec2.add(
        Vec2.scale(p, vp1After, pCache),
        Vec2.scale(n, vn1, nCache),
        vel1
      );
      Vec2.add(
        Vec2.scale(p, vp2After, pCache),
        Vec2.scale(n, vn2, nCache),
        vel2
      );

      collideEvent.normal = n;
      collideEvent.entity = entity2;
      entity1.trigger('onCollide', collideEvent);

      collideEvent.entity = entity1;
      entity2.trigger('onCollide', collideEvent);
    }
  }
};

var p = Vec2();
var n = Vec2();
var cache = Vec2();
var pCache = Vec2();
var nCache = Vec2();
var triggerEvent = {};
var collideEvent = {};

new Component('collider', Collider);

module.exports = Collider;

});
require.register("acmejs/lib/core/kinetic.js", function(exports, require, module){
'use strict';

var Component = require('./component');
var Pool = require('./pool');
var Vec2 = require('./math').Vec2;

/**
 * @class Kinetic
 * Velocity integrator
 *
 * Related links:
 * http://hg.positiontspectacular.com/toxiclibs/src/689ddcd9bea3/src.physics/toxi/physics2d
 * @extends Component
 */
function Kinetic() {
	this.velocity = Vec2();
	this.force = Vec2();
	this.continuous = Vec2();
	this.angularVelocity = Vec2();
	this.torque = Vec2();
	this.continuousTorque = Vec2();
}

Kinetic.gravity = Vec2();

Kinetic.prototype = {

	attributes: {
		mass: 1,
		drag: 0.999,
		friction: 15,
		fixed: false,
		maxVelocity: 75,
		maxForce: 2000,
		force: Vec2(),
		continuous: Vec2(),
		velocity: Vec2(),
		sleepVelocity: 1,
		fast: false
	},

	create: function(attributes) {
		this.mass = attributes.mass;
		this.drag = attributes.drag;
		this.friction = attributes.friction;
		this.fixed = attributes.fixed;
		this.maxVelocity = attributes.maxVelocity;
		this.maxForce = attributes.maxForce;
		this.fast = attributes.fast;
		this.sleepVelocity = attributes.sleepVelocity;
		Vec2.copy(this.velocity, attributes.velocity);
		Vec2.copy(this.force, attributes.force);
		Vec2.copy(this.continuous, attributes.continuous);
		this.sleeping = false;
	},

	get direction() {
		return Vec2.rad(this.velocity);
	},

	set direction(rad) {
		Vec2.rotateTo(this.velocity, rad);
	},

	get speed() {
		return Vec2.len(this.velocity);
	},

	set speed(length) {
		Vec2.norm(this.velocity, null, length);
	},

	applyForce: function(impulse, ignoreMass, continues) {
		Vec2.add(
			(continues) ? this.continuous : this.force,
			(!ignoreMass && this.mass !== 1) ?
				Vec2.scale(impulse, 1 / (this.mass || 1), cache) :
				impulse
		);
	},

	applyContinuesForce: function(force) {
		Vec2.add(this.continuous, force);
	}

};

Kinetic.simulate = function(dt) {
	var EPSILON = Math.EPSILON;
	var dtSq = dt * dt;

	var kinetics = this.heap;
	for (var i = 0, l = kinetics.length; i < l; i++) {
		var kinetic = kinetics[i];
		if (!kinetic.enabled || kinetic.fixed) {
			continue;
		}
		var velocity = kinetic.velocity;
		var force = Vec2.add(kinetic.force, kinetic.continuous);

		// Particle
		if (kinetic.fast) {
			if (kinetic.maxForce) {
				Vec2.limit(force, kinetic.maxForce);
			}
			Vec2.add(velocity, Vec2.scale(force, dt));
			Vec2.set(force);
			if (kinetic.maxVelocity) {
				Vec2.limit(velocity, kinetic.maxVelocity);
			}
			Vec2.add(kinetic.transform.position, Vec2.scale(velocity, dt, cache));
			continue;
		}

		// Apply scene gravity
		var gravity = kinetic.root.gravity || Kinetic.gravity;
		if (Vec2.lenSq(gravity) && kinetic.mass > EPSILON) {
			Vec2.add(
				force,
				(kinetic.mass !== 1) ?
					Vec2.scale(gravity, 1 / kinetic.mass, cache) :
					gravity
			);
		}

		// Apply friction
		if (kinetic.friction > 0) {
			Vec2.add(
				force,
				Vec2.scale(
					Vec2.norm(velocity, cache),
					-kinetic.friction
				)
			);
		}

		if (kinetic.maxForce > 0) {
			Vec2.limit(force, kinetic.maxForce);
		}

		/*
		// http://www.compsoc.man.ac.uk/~lucky/Democritus/Theory/verlet.html#velver
		// http://en.wikipedia.org/wiki/Verlet_integration#Velocity_Verlet
		var lastForce = Vec2.scale(kinetic.lastForce, dt / 2);

		// calculates a half-step velocity
		Vec2.add(velocity, lastForce);
		Vec2.add(
			kinetic.transform.position,
			Vec2.scale(velocity, dt, cache)
		);

		// Save force for next iteration
		Vec2.copy(lastForce, force);

		// Save force for next iteration
		Vec2.add(
			velocity,
			Vec2.scale(force, dt / 2)
		);
		*/

		Vec2.add(
			Vec2.add(
				kinetic.transform.position,
				Vec2.scale(velocity, dt, velocityCache)
			),
			Vec2.scale(force, 0.5 * dtSq, forceCache)
		);

		Vec2.add(
			velocity,
			Vec2.scale(force, dt, forceCache)
		);

		// Apply drag
		if (kinetic.drag < 1) {
			Vec2.scale(velocity, kinetic.drag);
		}

		// Limit velocity
		if (kinetic.maxVelocity > 0) {
			Vec2.limit(velocity, kinetic.maxVelocity);
		}

		// Reset force
		Vec2.set(force);

		var sleepVelocity = kinetic.sleepVelocity;
		if (sleepVelocity) {
			if (Vec2.lenSq(velocity) <= sleepVelocity * sleepVelocity) {
				if (!kinetic.sleeping) {
					Vec2.set(velocity);
					kinetic.sleeping = true;
					kinetic.entity.triggerUp('onKineticSleep', kinetic);
				}
			} else {
				if (kinetic.sleeping) {
					kinetic.sleeping = false;
					kinetic.entity.triggerUp('onKineticWake', kinetic);
				}
			}
		}
	}
};

var cache = Vec2();
var velocityCache = Vec2();
var forceCache = Vec2();

new Component('kinetic', Kinetic);

module.exports = Kinetic;

});
require.register("acmejs/lib/core/boid.js", function(exports, require, module){
'use strict';

var Component = require('./component');
var Pool = require('./pool');
var Vec2 = require('./math').Vec2;
var Kinetic = require('./kinetic');

/**
 * @class Boid
 * Steering behaviour
 * - http://www.openprocessing.org/sketch/7493
 * - http://www.openprocessing.org/sketch/11045
 * - https://github.com/paperjs/paper.js/blob/master/examples/Paperjs.org/Tadpoles.html
 *
 * @extends Component
 *
 * @constructor
 * @param {Number} [perception=100]
 * @param {Number} [aura=100]
 */
function Boid() {
	this.mod = 2;
	this.cohesionMod = 1;
	this.avoidanceMod = 2;
	this.imitationMod = 1;
}

Boid.prototype = {

	attributes: {
		perception: 100,
		aura: 25
	},

	create: function(attributes) {
		this.perception = attributes.perception;
		this.aura = attributes.aura;
		if (!this.aura && this.bounds) {
			this.aura = this.bounds.radius * 2;
		}
		this.perceptionSq = this.perception * this.perception;
		this.auraSq = this.aura * this.aura;
	}

};

var cohesion = Vec2();
var avoidance = Vec2();
var imitation = Vec2();
var distance = Vec2();
var impulse = Vec2();

Boid.fixedUpdate = function(dt) {
	var boids = this.heap;
	var len = boids.length;
	var i = len;

	while (i--) {
		var boid1 = boids[i];
		if (!boid1.enabled) {
			continue;
		}

		var entity1 = boid1.entity;
		var pos1 = entity1.transform.position;
		var vel = entity1.kinetic.velocity;

		var avoidanceCount = 0;
		var imitationCount = 0;
		var cohesionCount = 0;
		Vec2.set(impulse);

		var j = len;
		while (j--) {
			var boid2 = boids[j];
			if (!boid2.enabled || boid1 === boid2) {
				continue;
			}

			var entity2 = boid2.entity;
			var pos2 = entity2.transform.position;

			var diffSq = Vec2.distSq(pos1, pos2);
			if (diffSq < boid1.perceptionSq && diffSq) {
				Vec2.sub(pos2, pos1, distance);
				// Vec2.scale(distance, Math.sqrt(entity1.kinetic.mass / entity2.kinetic.mass));

				// diff = Math.sqrt(diffSq)
				// Vec2.scale(distance, Math.quadInOut(diff / boid1.perception), cache)

				// Cohesion : try to approach other boids
				if (!(cohesionCount++)) {
					Vec2.copy(cohesion, distance);
				} else {
					Vec2.add(cohesion, distance);
				}

				// Imitation : try to move in the same way than other boids
				if (!(imitationCount++)) {
					Vec2.copy(imitation, entity2.kinetic.velocity);
				} else {
					Vec2.add(imitation, entity2.kinetic.velocity);
				}

				// Avoidance : try to keep a minimum distance between others.
				if (diffSq < boid1.auraSq) {
					if (!(avoidanceCount++)) {
						Vec2.copy(avoidance, distance);
					} else {
						Vec2.add(avoidance, distance);
					}
				}
			}
		}

		var mod = boid1.mod;
		if (cohesionCount && boid1.cohesionMod) {
			if (cohesionCount > 1) {
				Vec2.scale(cohesion, 1 / cohesionCount);
			}
			entity1.kinetic.applyForce(Vec2.scale(cohesion, boid1.cohesionMod * mod));
		}

		if (imitationCount && boid1.imitationMod) {
			if (imitationCount > 1) {
				Vec2.scale(imitation, 1 / imitationCount);
			}
			Vec2.add(impulse, Vec2.scale(imitation, boid1.imitationMod * mod));
			entity1.kinetic.applyForce();
			Vec2.add(
				entity1.kinetic.force,
				Vec2.sub(impulse, vel)
			);
		}

		if (avoidanceCount && boid1.avoidanceMod) {
			if (avoidanceCount > 1) {
				Vec2.scale(avoidance, 1 / avoidanceCount);
			}
			Vec2.sub(
				entity1.kinetic.force,
				Vec2.scale(avoidance, boid1.avoidanceMod * mod)
			);
		}
	}
};

new Component('boid', Boid);

module.exports = Boid;

});
require.register("acmejs/lib/core/jitter.js", function(exports, require, module){
'use strict';

var Component = require('./component');
var Pool = require('./pool');
var Vec2 = require('./math').Vec2;
var Random = require('./math-random');

function Jitter() {}

Jitter.prototype = {

  attributes: {
    factor: 0.1,
    force: 250
  },

  create: function(attributes) {
    this.factor = attributes.factor;
    this.force = attributes.force;
  },

  fixedUpdate: function(dt) {
    if (Random.chance(this.factor)) {
      Vec2.variant(Vec2.zero, this.force, force);
      this.kinetic.applyForce(force);
    }
  }

};

var force = Vec2();

new Component('jitter', Jitter);

module.exports = Jitter;

});
require.register("acmejs/lib/core/particle.js", function(exports, require, module){
'use strict';

var Entity = require('./entity');
var Component = require('./component');
var Pool = require('./pool');
var Engine = require('./engine');
var Vec2 = require('./math').Vec2;
var Color = require('./color');
var Sprite = require('./sprite').Asset;
require('./transform');
require('./kinetic');

function Particle() {
  this.color = Color();
  this.colorVariant = 0;
  this.lifetime = 0.0;
  this.lifetimeVariant = 0.0;
  this.radius = 0.0;
  this.radiusVariant = 0.0;
  this.alpha = 0.0;
  this.alphaVariant = 0.0;
  this.composite = '';
  this.sprite = null;
  this.shrink = Math.linear;
  this.fade = Math.linear;
  this.age = 0.0;
}

Particle.layer = 10;
Particle.defaultComposite = 'source-over';

Particle.prototype.attributes = {
  color: Color.black,
  colorVariant: 0,
  lifetime: 1,
  lifetimeVariant: 1,
  radius: 1,
  radiusVariant: 0,
  alpha: 1,
  alphaVariant: 0,
  composite: 'source-over',
  sprite: null,
  shrink: Math.quintIn,
  fade: Math.quintIn
};

Particle.prototype.create = function(attributes) {
  Color.copy(this.color, attributes.color);
  this.lifetime = attributes.lifetime;
  this.radius = attributes.radius;
  this.alpha = attributes.alpha;
  this.composite = attributes.composite;
  this.sprite = attributes.sprite;
  this.shrink = attributes.shrink;
  this.fade = attributes.fade;

  var variant = attributes.colorVariant;
  if (variant) {
    Color.variant(this.color, variant);
  }
  variant = attributes.lifetimeVariant;
  if (variant) {
    this.lifetime += Math.rand(-variant, variant);
  }
  variant = attributes.radiusVariant;
  if (variant) {
    this.radius += Math.rand(-variant, variant);
  }
  variant = attributes.alphaVariant;
  if (variant) {
    this.alpha = Math.clamp(this.alpha + Math.rand(-variant, variant), 0, 1);
  }
  this.age = 0;
};

Particle.prototype.update = function(dt) {
  if ((this.age += dt) > this.lifetime) {
    this.entity.destroy();
    return;
  }
  if (this.shrink) {
    this.radius *= 1 - this.shrink(this.age / this.lifetime);
    if (this.radius < 1) {
      // BAILOUT_ShapeGuard
      this.entity.destroy();
      return;
    }
  }
  if (this.fade) {
    this.alpha *= 1 - this.fade(this.age / this.lifetime);
    if (this.alpha <= 0.02) {
      // BAILOUT after getprop
      this.entity.destroy();
      return;
    }
  }
};

var crop = Vec2();
var cropOffset = Vec2();
var offset = Vec2();
var pos = Vec2(); // JIT-hint

Particle.render = function(ctx) {
  ctx.save();
  Vec2.set(crop, 50, 50);
  Vec2.set(cropOffset, -25, -25);

  var fillPrev = '';
  var alphaPrev = 1;
  ctx.globalAlpha = 1;
  var defaultComposite = Particle.defaultComposite;
  var compositePrev = defaultComposite;
  ctx.globalCompositeOperation = defaultComposite;

  var particles = this.heap;
  for (var i = 0, l = particles.length; i < l; i++) {
    var particle = particles[i];
    if (!particle.enabled) {
      continue;
    }

    var radius = particle.radius;
    pos = particle.transform.position;

    var alpha = particle.alpha;
    var composite = particle.composite || defaultComposite;

    if (composite != compositePrev) {
      compositePrev = composite;
      ctx.globalCompositeOperation = composite;
    }

    if (particle.sprite) {
      Vec2.set(offset, 0, 50 * (radius - 1 | 0));
      if (alpha !== alphaPrev) {
        alphaPrev = alpha;
        ctx.globalAlpha = alpha;
      }
      particle.sprite.draw(ctx, pos, Vec2.center, crop, offset);
    } else {
      // FIXME: ctx.globalAlpha might be set wrong
      var fill = Color.rgba(particle.color, alpha);
      if (fill != fillPrev) {
        fillPrev = fill;
        ctx.fillStyle = fill;
      }
      ctx.fillRect(
        pos[0] - radius / 2 | 0, pos[1] - radius / 2 | 0,
        radius | 0, radius | 0
      );
    }
  }
  ctx.restore();
};

Particle.generateSprite = function(attributes) {
  attributes = attributes || {};
  var color = Color(attributes.color || Color.white);
  var alpha = attributes.alpha || 1;
  var max = attributes.max || 25;
  var size = max * 2;
  var center = attributes.center || 0.5;
  var shape = attributes.shape || 'circle';

  return new Sprite(function(ctx) {
    for (var radius = 1; radius <= max; radius++) {
      var top = max + size * (radius - 1);

      if (center < 1) {
        var grad = ctx.createRadialGradient(max, top, 0, max, top, radius);
        color[3] = alpha;
        grad.addColorStop(0, Color.rgba(color));
        if (center != 0.5) {
          color[3] = alpha / 2;
          grad.addColorStop(center, Color.rgba(color));
        }
        color[3] = 0;
        grad.addColorStop(1, Color.rgba(color));
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = Color.rgba(color);
      }

      if (shape == 'rect') {
        ctx.fillRect(max - radius / 2 | 0, top - radius / 2, radius, radius);
      } else {
        ctx.beginPath();
        ctx.arc(max, top, radius, 0, Math.TAU, true);
        ctx.closePath();
        ctx.fill();
      }
    }
  }, Vec2(size, size * max));
};

Particle.sprite = Particle.generateSprite();

new Component('particle', Particle);

Particle.Prefab = new Entity.Prefab('particle', {
  transform: null,
  kinetic: {
    mass: 0
  },
  particle: {
    sprite: Particle.sprite
  }
});

new Pool(Particle);

module.exports = Particle;

});
require.register("acmejs/lib/math/mat2.js", function(exports, require, module){
'use strict';

/*
 * 2x3 Matrix
 *
 * https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/mat2d.js
 * https://github.com/simonsarris/Canvas-tutorials/blob/master/transform.js
 *
 * @param {[type]} fromOrA [description]
 * @param {[type]} b       [description]
 * @param {[type]} c       [description]
 * @param {[type]} d       [description]
 * @param {[type]} tx      [description]
 * @param {[type]} ty      [description]
 */
var Mat2 = Math.Mat2 = function(fromOrA, b, c, d, tx, ty) {
	if (b != null) {
		return new Float32Array([fromOrA, b, c, d, tx, ty]);
	}
	return new Float32Array(fromOrA || Mat2.identity);
};

Mat2.identity = Mat2(1, 0, 0, 1, 0, 0);

Mat2.set = function(result, a, b, c, d, tx, ty) {
	result[0] = a || 0;
	result[1] = b || 0;
	result[2] = (c != null) ? c : 1;
	result[3] = d || 0;
	result[4] = tx || 0;
	result[5] = (ty != null) ? ty : 1;
	return result;
};

Mat2.copy = function(result, b) {
	result.set(b);
	return result;
};

Mat2.valid = function(a) {
	return !(isNaN(a[0]) || isNaN(a[1]) || isNaN(a[2]) ||
		isNaN(a[3])|| isNaN(a[4]) || isNaN(a[5]));
};

Mat2.toString = function(a) {
	return '[' + a[0] + ', ' + a[1] + ' | ' + a[2] + ', ' + a[3] +
	' | ' + a[4] + ', ' + a[5] + ']';
};

Mat2.multiply = function(a, b, result) {
	if (!result) {
		result = a;
	}
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

Mat2.rotate = function(a, rad, result) {
	if (!result) {
		result = a;
	}
	if (!rad) {
		return result;
	}
	var aa = a[0];
	var ab = a[1];
	var ac = a[2];
	var ad = a[3];
	var atx = a[4];
	var aty = a[5];
	var st = Math.sin(rad);
	var ct = Math.cos(rad);
	result[0] = aa * ct + ab * st;
	result[1] = -aa * st + ab * ct;
	result[2] = ac * ct + ad * st;
	result[3] = -ac * st + ct * ad;
	result[4] = ct * atx + st * aty;
	result[5] = ct * aty - st * atx;
	return result;
};

Mat2.scale = function(a, v, result) {
	if (!result) {
		result = a;
	}
	var vx = v[0];
	var vy = v[1];
	if (vx == 1 && vy == 1) {
		return result;
	}
	result[0] = a[0] * vx;
	result[1] = a[1] * vy;
	result[2] = a[2] * vx;
	result[3] = a[3] * vy;
	result[4] = a[4] * vx;
	result[5] = a[5] * vy;
	return result;
};

Mat2.translate = function(a, v, result) {
	if (!result) {
		result = a;
	} else {
		result[0] = a[0];
		result[1] = a[1];
		result[2] = a[2];
		result[3] = a[3];
	}
	result[4] = a[4] + v[0];
	result[5] = a[5] + v[1];
	return result;
};

Mat2.apply = function(a, v, result) {
	if (!result) {
		result = v;
	}
	var x = v[0];
  var y = v[1];
  result[0] = x * a[0] + y * a[2] + a[4];
  result[1] = x * a[1] + y * a[3] + a[5];
  return result;
};

module.exports = Mat2;

});
require.register("acmejs/lib/labs/perlin.js", function(exports, require, module){
'use strict';

/**
 * @class
 *
 * Improved Perlin Noise
 *
 * http://cs.nyu.edu/~perlin/noise/
 * https://github.com/louisstow/pixelminer/blob/master/lib/perlin.js
 */

function Perlin() {
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
	return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

module.exports = Perlin;

});
require.register("acmejs/lib/labs/heightmap.js", function(exports, require, module){
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
});
require.alias("acmejs/lib/index.js", "acmejs/index.js");