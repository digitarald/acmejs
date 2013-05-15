;(function(e,t,n,r){function i(r){if(!n[r]){if(!t[r]){if(e)return e(r);throw new Error("Cannot find module '"+r+"'")}var s=n[r]={exports:{}};t[r][0](function(e){var n=t[r][1][e];return i(n?n:e)},s,s.exports)}return n[r].exports}for(var s=0;s<r.length;s++)i(r[s]);return i})(typeof require!=="undefined"&&require,{1:[function(require,module,exports){'use strict';

var Vec2 = require('../../lib/core/math').Vec2;
var Engine = require('../../lib/core/engine');

Engine.init(document.getElementById('game-1'));

var Renderer = require('../../lib/core/renderer');
Engine.renderer = new Renderer(Engine.element.getElementsByClassName('game-canvas')[0], Vec2(960, 640));

var Entity = require('../../lib/core/entity');
var Component = require('../../lib/core/component');
var Pool = require('../../lib/core/pool');
var Color = require('../../lib/core/color');
var Particle = require('../../lib/core/particle');
require('../../lib/core/transform');
require('../../lib/core/border');
require('../../lib/core/collider');
require('../../lib/core/kinetic');
require('../../lib/core/jitter');
require('../../lib/core/boid');

function GameController() {
  this.started = 0;
}

GameController.prototype.update = function(dt) {
  var input = Engine.input;
  if (input.touchState || input.keys.space) {
    var factor = (this.started += dt) + 1;
    var i = 100 * dt * factor | 0;
    var speed = 10;
    while (i--) {
      var spark = SparkPrefab.alloc(this.root);
      Vec2.scal(Vec2.set(spark.kinetic.velocity, Math.rand(-speed, speed), Math.rand(-speed, speed)), factor);
      Vec2.variant(input.pos, 10, spark.transform.pos);
      spark.particle.radius = Math.rand(5, 25);
    }
  } else if (this.started) {
    this.started = 0;
  }
};

new Component('gameController', GameController);


var SparkPrefab = new Entity.Prefab({
  transform: null,
  kinetic: {
    mass: 0.1,
    fast: true,
    maxVelocity: 200,
    maxForce: 0
  },
  particle: {
    lifetime: 5,
    // composite: 'multiply',
    fade: Math.quadIn,
    shrink: null,
    sprite: Particle.generateSprite(Color(164, 164, 164), 1)
  },
  jitter: null
});


Engine.gameScene = Entity.alloc(null, {
  gameController: null
});

Engine.play(Engine.gameScene);

},{"../../lib/core/math":2,"../../lib/core/engine":3,"../../lib/core/renderer":4,"../../lib/core/entity":5,"../../lib/core/component":6,"../../lib/core/pool":7,"../../lib/core/color":8,"../../lib/core/particle":9,"../../lib/core/transform":10,"../../lib/core/border":11,"../../lib/core/collider":12,"../../lib/core/kinetic":13,"../../lib/core/jitter":14,"../../lib/core/boid":15}],2:[function(require,module,exports){'use strict';

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

var TAU = Mth.TAU = Mth.PI * 2;
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

Mth.distAng = function(a, b) {
	if (a == b) {
		return 0;
	}
	var ab = (a < b);
	var l = ab ? (-a - TAU + b) : (b - a);
	var r = ab ? (b - a) : (TAU - a + b);

	return (Math.abs(l) > Math.abs(r)) ? r : l;
};

/**
 * Typed Array to use for vectors and matrix
 */
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

},{}],3:[function(require,module,exports){'use strict';

var Entity = require('./entity');
var Pool = require('./pool');
var Vec2 = require('./math').Vec2;

// Shimming required APIs

var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
	return setTimeout(callback, 20);
};

var perf = window.performance || {};
perf.now = perf.now || perf.webkitNow || perf.msNow || perf.mozNow || Date.now;


function Engine() {
	Entity.call(this);
}

Engine.prototype = Object.create(Entity.prototype);

Engine.prototype.tag = 'engine';

Engine.prototype.init = function(element) {
	this.element = element;

	this.time = 0.0;
	this.lastTime = 0.0;
	this.frame = 0;
	this.tail = 0.0;
	this.fdt = 1 / 30;
	this.dtMin = 1 / 60;
	this.dtCap = 0.5;
	this.fdtCap = this.fdt * 5;
	this.scale = 1;

	this.debug = {
		profile: 0,
		step: false,
		time: true
	};
	this.samples = {
		dt: 0,
		lag: 0,
		tick: 0,
		fixedUpdate: 0,
		update: 0,
		render: 0
	};

	// Late require. TODO: Justify!
	var Console = require('./console');
	Console.alloc(this);
	var Input = require('./input');
	Input.alloc(this);

	var engine = this;
	this.tickBound = function Engine_tick(now) {
		return engine.tick(now);
	};
};

Engine.prototype.play = function(scene) {
	this.scene = scene;
	this.start();
};

Engine.prototype.start = function() {
	if (this.running) {
		return;
	}
	this.running = true;
	requestAnimationFrame(this.tickBound);
};

Engine.prototype.tick = function(time) {
	time = (time && time < 1e12 ? time : perf.now()) / 1000;
	this.time = time;

	var debug = this.debug;
	var samples = this.samples;
	var fdt = this.fdt;

	if (this.lastTime) {
		var dt = time - this.lastTime;
		if (dt > this.dtCap) {
			dt = this.dtMin;
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
			console.profile("Frame " + debug.profileFrom);
		}

		var ping = perf.now();
		var pingTick = ping;

		// Invoke fixed updates
		var tail = Math.min(this.tail + dt, this.fdtCap * this.scale);
		while (tail > fdt) {
			tail -= fdt;
			Pool.invoke('fixedUpdate', fdt);
			Pool.invoke('simulate', fdt);
		}
		this.tail = tail;

		var pong = perf.now();
		samples.fixedUpdate = pong - ping;
		ping = pong;

		// Invoke update
		Pool.invoke('update', dt);

		Pool.free();

		Pool.invoke('postUpdate', dt);

		pong = perf.now();
		samples.update = pong - ping;
		ping = pong;

		// Invoke render
		Pool.invoke('preRender', dt);

		var ctx = this.renderer.save();
		Pool.invoke('render', ctx);
		this.renderer.restore();

		pong = perf.now();
		samples.render = pong - ping;
		samples.tick = pong - pingTick;

		if (debug.step) {
			debugger;
		}
		if (debug.profileFrom) {
			if (!--debug.profile) {
				console.profileEnd("Frame " + debug.profileFrom);
				debug.profileFrom = 0;
			}
		}
	}

	this.lastTime = time;
	samples.next = Math.max(time + 1 / 60, perf.now() / 1000);

	this.pub('onTimeEnd', samples);

	if (this.pauseNext) {
		this.pub('onPause');
		this.paused = true;
		this.tickBound(samples.next * 1000);
	} else if (this.running) {
		requestAnimationFrame(this.tickBound);
	}
};

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

},{"./entity":5,"./pool":7,"./math":2,"./console":16,"./input":17}],4:[function(require,module,exports){'use strict';

var Entity = require('./entity');
var Bounds = require('./bounds');
var Vec2 = require('./math').Vec2;
var Color = require('./color');


function Renderer(element, size) {
  this.element = element;
  this.size = Vec2(size);
  this.content = Vec2(size);
  this.browser = Vec2();
  this.margin = Vec2();
  this.pos = Vec2();
  this.scale = 0;
  this.orientation = 'landscape';

  this.canvas = document.createElement('canvas');
  this.element.appendChild(this.canvas);
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
    var scale = Math.min(this.browser[0] / this.content[0], this.browser[1] / this.content[1]);
    if (scale !== this.scale) {
      this.scale = scale;
      Vec2.scal(this.content, this.scale, this.size);
    }
    var off = Vec2.scal(Vec2.sub(browser, this.size, this.margin), 0.5);
    var rule = "translate(" + off[0] + "px, " + off[1] + "px) scale(" + scale + ")";
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
    Vec2.set(this.pos, pos[0] - this.size[0] / 2, pos[0] - this.size[1] / 2);
    return this;
  },

  // FIXME: Unused
  cull: function(entity) {
    var bounds = entity.bounds;
    if (!bounds) {
      return false;
    }
    if (bounds.withinRect(this.pos, this.content)) {
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

},{"./entity":5,"./bounds":18,"./math":2,"./color":8}],5:[function(require,module,exports){'use strict';

var Pool = require('./pool');

function Entity() {
	this.children = {};
	this.components = {};
	this.subs = {};
	this.refSubs = [];
}

Entity.prototype.tag = 'entity';

Entity.prototype.toString = function() {
	var comps = Object.keys(this.components).join(', ');
	return "Entity " + (this.id || '') + "#" + this.uid +
		" (" + comps + ") [^ " + this.parent + "]";
};

Entity.prototype.alloc = function(attributes) {
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
					if (!this.addComponent(key, attribute)) {
						throw new Error("Unknown attribute key '" + key +
							"', expected component. " + this);
					}
			}
		}
	}
};

Entity.prototype.addComponent = function(tag, attributes) {
	var pool = Pool.byTag[tag];
	if (!pool) {
		return false;
	}
	return pool.alloc(this, attributes);
};

Entity.prototype.addChild = function(prefabId, attributes) {
	if (typeof prefabId === 'string') {
		return Prefab.alloc(prefabId, this, attributes);
	}
	return Entity.alloc(this, prefabId);
};

Entity.prototype.destroy = function() {
	this.pool.destroy(this);
	for (var key in this.components) {
		this.components[key].destroy();
	}
	for (key in this.children) {
		this.children[key].destroy();
	}
};

Entity.prototype.free = function() {
	// Remove referenced subscribers
	var refSubs = this.refSubs;
	for (var i = 0, l = refSubs.length; i < l; i++) {
		refSubs[i].unsub(this);
	}
	refSubs.length = 0;

	// Remove own subscribers
	var subs = this.subs;
	for (var topic in subs) {
		subs[topic].length = 0;
	}
	if (this.parent) {
		delete this.parent.children[this.uid];
	}
	this.pool.free(this);
};

Entity.prototype.match = function(selector) {
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
};

Entity.prototype.enable = function(state, deep) {
	if (state == null) {
		state = !this.state;
	}
	this.enabled = state;
	this.parent.pub((state ? 'onEnable' : 'onDisable'), this);
	for (var key in this.components) {
		this.components[key].enable(state, true);
	}
	if (deep) {
		for (var key in this.children) {
			this.children[key].enable(state, true);
		}
	}
};

Entity.prototype.sub = function(scope, topic, method) {
	if (scope == null) {
		scope = this;
	}
	var subs = this.subs;
	var items = (subs[topic] || (subs[topic] = []));
	items.push(scope, method);
	if (scope !== this) {
		var refs = (scope.refSubs || (scope.refSubs = []));
		refs.push(this);
	}
};

Entity.prototype.pub = function(topic, a0, a1, a2, a3) {
	var items = this.subs[topic], i = 0;
	if (items && (i = items.length)) {
		var scope;
		while ((scope = items[i -= 2])) {
			if (scope.enabled && scope[items[i + 1] || topic](a0, a1, a2, a3) === false) {
				return false;
			}
		}
	}
};

Entity.prototype.pubUp = function(topic, a0, a1, a2, a3) {
	var entity = this;
	do {
		if (entity.enabled && entity.pub(topic, a0, a1, a2, a3) === false) {
			return false;
		}
	} while (entity = entity.parent);
};

Entity.prototype.pubAll = function(topic, a0, a1, a2, a3) {
	return Pool.call(topic, a0, a1, a2, a3);
};

Entity.prototype.unsub = function(unscope, untopic) {
	var subs = this.subs, i = 0;
	for (var topic in subs) {
		if (untopic && untopic === topic) {
			continue;
		}
		var items = subs[topic];
		if (!items || !(i = items.length)) {
			continue;
		}
		var length = i / 2, scope;
		while ((i -= 2) >= 0) {
			if ((scope = items[i]) && (!unscope || unscope === scope)) {
				items[i] = null;
				length--;
			}
		}
		if (length === 0) {
			items.length = 0;
		}
	}
};

new Pool(Entity);

/**
 * Prefab
 *
 * @param {String} id         Id
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

Prefab.alloc = function(id, parent, attributes) {
	var prefab = Prefab.byId[id];
	if (!prefab) {
		throw new Error('Prefab "' + id + '"" not found.');
	}
	return prefab.alloc(parent, attributes);
};

Prefab.prototype.alloc = function(parent, attributes) {
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
					// TODO: Use __proto__
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
	return Entity.alloc(parent, attributes || defaults);
};

Entity.Prefab = Prefab;

module.exports = Entity;

},{"./pool":7}],6:[function(require,module,exports){'use strict';

var Pool = require('./pool');

function Component(tag, cls) {
  if (!tag) {
    return null;
  }
  var proto = cls.prototype;
  cls.prototype = Object.create(Component.prototype);
  cls.prototype.tag = tag;

  var key = '';
  for (key in proto) {
    cls.prototype[key] = proto[key];
  }
  new Pool(cls);
  return null;
}

Component.prototype.tag = 'component';

Component.prototype.toString = function() {
  return "Component " + this.tag + "#" + this.uid + " [^ " + this.entity + "]";
};

Component.prototype.alloc = function(attributes) {
  var entity = this.entity = this.parent;
  entity.components[this.tag] = this;
  entity[this.tag] = this;

  var components = entity.components;
  for (var tag in components) {
    if (tag === this.tag) {
      continue;
    }
    this[tag] = components[tag];
    components[tag][this.tag] = this;
  }

  if (this.create) {
    this.create(attributes);
  }
};

Component.prototype.destroy = function() {
  this.pool.destroy(this);
};

Component.prototype.free = function() {
  delete this.entity.components[this.tag];
  this.entity[this.tag] = null;

  var components = this.entity.components;
  for (var tag in components) {
    if (tag === this.tag) {
      continue;
    }
    this[components[tag].tag] = null;
    components[tag][this.tag] = null;
  }
  this.entity = null;
  this.pool.free(this);
};

Component.prototype.enable = function(state, silent) {
  if (state == null) {
    state = !this.state;
  }
  this.enabled = state;
  if (silent) {
    this.entity.pub('onComponent' + (state ? 'Enable' : 'Disable'), this);
  }
};

module.exports = Component;

},{"./pool":7}],7:[function(require,module,exports){'use strict';

require('./math');

function Pool(cls) {
  this.cls = cls;
  var proto = cls.prototype;
  proto.pool = this;
  cls.pool = this;
  this.register = [];
  this.enabled = false;
  this.allocd = 0;
  this.tag = proto.tag;
  if (this.tag) {
    Pool.byTag[this.tag] = this;
  } else {
    throw new Error('No tag provided.');
  }

  var pool = this;
  cls.alloc = function(parent, attributes) {
    return pool.alloc(parent, attributes);
  };

  this.advanced = (this.tag !== 'entity' && !proto.light);

  if (this.advanced) {
    this.layer = proto.layer || cls.layer || 0;
    this.subs = [];
    this.calls = [];

    if ((this.attributes = proto.attributes || null)) {
      this.attributeKeys = Object.keys(this.attributes);
    }

    var types = Pool.typedCalls;
    var keys = Object.keys(proto).concat(Object.keys(cls));
    var fn = '';
    for (var i = 0, l = keys.length; i < l; i++) {
      fn = keys[i];
      if (Pool.regxCall.test(fn)) {
        if (!~types.indexOf(fn)) {
          types.push(fn);
          Pool.calls[fn] = [];
        }
        this.subs.push(fn);
      } else if (Pool.regxGetter.test(fn)) {
        var key = fn.substr(3, 1).toLowerCase() + fn.substr(4);
        Pool.defineGetter(proto, key, fn);
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

Pool.prototype.toString = function() {
  return "Pool " + this.tag +
    " [" + this.allocd + " / " + this.register.length + "]";
};

Pool.prototype.fill = function(i) {
  while (i--) {
    this.newInstance();
  }
};

Pool.prototype.newInstance = function() {
  var entity = new this.cls();
  entity.enabled = false;
  entity.allocd = false;
  this.register.push(entity);

  var calls = this.calls;
  if (calls) {
    for (var i = 0, l = calls.length; i < l; i++) {
      Pool.calls[calls[i]].push(entity);
    }
  }
  return entity;
};

Pool.prototype.alloc = function(parent, attributes) {
  // Get free or create new entity
  var entity = null;
  var register = this.register;
  var i = register.length;
  while (i--) {
    if (!register[i].allocd) {
      entity = register[i];
      break;
    }
  }
  if (!entity) {
    entity = this.newInstance();
  }

  var defaults = null;
  this.allocd++;
  this.enabled = true;
  var uid = entity.uid = Math.uid();
  entity.enabled = true;
  entity.allocd = true;
  entity.parent = parent || null;
  entity.root = parent && parent.root || parent || entity;

  if (this.advanced) {
    var calls = this.calls;
    for (var i = 0, l = calls.length; i < l; i++) {
      var call = calls[i];
      if (Pool.order[call] != null) {
        Pool.order[call] = true;
      }
    }
    entity.layer = (parent && parent.layer || 0) + this.layer + 2 - 1 / uid;
    defaults = this.attributes;
    if (defaults) {
      if (attributes && !attributes._merged) {
        if (attributes.__proto__) {
          attributes.__proto__ = defaults;
        } else {
          var attributeKeys = this.attributeKeys;
          for (i = 0, l = attributeKeys.length; i < l; i++) {
            var key = attributeKeys[i];
            if (!(key in attributes)) {
              attributes[key] = defaults[key];
            }
          }
        }
        attributes._merged = true;
      }
    }
    var subs = this.subs;
    for (var j = 0, l1 = subs.length; j < l1; j++) {
      parent.sub(entity, subs[j]);
    }
  }

  entity.alloc(attributes || defaults || null);
  // console.log(this.tag, entity);
  return entity;
};

Pool.prototype.destroy = function(entity) {
  entity.enabled = false;
  Pool.calls.free.push(entity);
};

Pool.prototype.free = function(entity) {
  entity.allocd = false;
  entity.uid = null;
  entity.root = null;
  entity.parent = null;
  this.enabled = (this.allocd--) > 1;
};

Pool.prototype.invoke = function(fn, a0, a1, a2, a3) {
  var stack = this.register;
  var i = this.register.length;
  while (i--) {
    if (stack[i].enabled) {
      stack[i][fn](a0, a1, a2, a3);
    }
  }
  return this;
};

Pool.typedCalls = ['fixedUpdate', 'simulate', 'update', 'postUpdate', 'preRender', 'render'];
// Create call array
Pool.calls = {free: []};
for (var i = 0, l = Pool.typedCalls.length; i < l; i++) {
  Pool.calls[Pool.typedCalls[i]] = [];
}

Pool.regxCall = /^on[A-Z]/;
Pool.regxGetter = /^get[A-Z]/;
Pool.byTag = {};
Pool.order = {
  render: false
};

Pool.dump = function(flush) {
  var byTag = Pool.byTag;
  for (var tag in byTag) {
    var pool = byTag[tag];
    console.log("%s: %d/%d allocd", tag, pool.allocd, pool.register.length);
  }
  if (flush) {
    Pool.flush();
  }
};

Pool.defineGetter = function(proto, key, fn) {
  Object.defineProperty(proto, key, {
    get: proto[fn],
    enumerable: true,
    configurable: true
  });
  return proto;
};

Pool.free = function() {
  var stack = this.calls.free;
  for (var i = 0, l = stack.length; i < l; i++) {
    stack[i].free();
  }
  stack.length = 0;
};

Pool.flush = function() {
  var byTag = Pool.byTag;
  for (var tag in byTag) {
    var register = byTag[tag].register;
    var i = register.length;
    var freed = 0;
    while (i--) {
      if (register[i].allocd) {
        continue;
      }
      register.splice(i, 1);
      freed++;
    }
    console.log("%s: %d/%d flushed", tag, freed, register.length);
  }
};

Pool.invoke = function(fn, arg) {
  var stack = this.calls[fn], i = stack.length;
  if (!i) {
    return;
  }
  if (Pool.order[fn]) {
    stack.sort(Pool.orderFn);
    Pool.order[fn] = false;
  }
  while (i--) {
    if (stack[i].enabled) {
      stack[i][fn](arg);
    }
  }
};

Pool.orderFn = function(a, b) {
  return b.layer - a.layer;
};

module.exports = Pool;

},{"./math":2}],8:[function(require,module,exports){'use strict';

require('./math');

var ARRAY_TYPE = Math.ARRAY_TYPE;

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

Color.set = function(result, r, g, b, a) {
  result[0] = r || 0;
  result[1] = g || 0;
  result[2] = b || 0;
  result[3] = a || 0;
  return result;
};

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

Color.lerpList = function(result, list, t) {
  var last = list.length - 1;
  var t = Math.clamp(t * last, 0, last);
  var start = t | 0;
  var sub = t - start;
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

},{"./math":2}],9:[function(require,module,exports){'use strict';

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
}

Particle.layer = 10;

Particle.prototype.attributes = {
  color: Color.black,
  colorVariant: 0,
  lifetime: 1,
  radius: 1,
  radiusVariant: 0,
  alpha: 1,
  alphaVariant: 0,
  composite: null,
  sprite: null,
  shrink: Math.quintIn,
  fade: Math.quintIn
};

Particle.prototype.create = function(attributes) {
  this.lifetime = attributes.lifetime;
  this.radius = attributes.radius;
  this.alpha = attributes.alpha;
  this.composite = attributes.composite;
  this.sprite = attributes.sprite;
  this.shrink = attributes.shrink;
  this.fade = attributes.fade;
  Color.copy(this.color, attributes.color);

  var variant = attributes.colorVariant;
  if (variant) {
    Color.variant(this.color, variant);
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
  } else if (this.shrink && (this.radius *= 1 - this.shrink(this.age / this.lifetime)) < 1) {
    this.entity.destroy();
  } else if (this.fade && (this.alpha *= 1 - this.fade(this.age / this.lifetime)) <= 0.02) {
    this.entity.destroy();
  }
};

var crop = Vec2();
var cropOffset = Vec2();
var offset = Vec2();

Particle.render = function(ctx) {
  ctx.save();
  Vec2.set(crop, 50, 50);
  Vec2.set(cropOffset, -25, -25);
  var alphaPrev = 1;
  var entityPrev = null;
  var fillPrev = null;
  var compositePrev = null;

  var defaultComposite = Particle.defaultComposite;

  var register = this.register;
  for (var i = 0, l = register.length; i < l; i++) {
    var particle = register[i];
    if (!particle.enabled) {
      continue;
    }

    var radius = particle.radius;
    var pos = particle.transform.pos;

    var alpha = particle.alpha;
    var composite = particle.composite || defaultComposite;

    if (composite !== compositePrev) {
      ctx.globalCompositeOperation = compositePrev = composite;
    }

    if (particle.sprite) {
      Vec2.set(offset, 0, 50 * (radius - 1 | 0));
      if (alpha !== alphaPrev) {
        ctx.globalAlpha = alphaPrev = alpha;
      }
      particle.sprite.draw(ctx, pos, Vec2.center, crop, offset);
    } else {
      particle.color[3] = alpha;
      var fill = Color.rgba(particle.color);
      if (fill !== fillPrev) {
        ctx.fillStyle = fillPrev = fill;
      }
      ctx.fillRect(pos[0] - radius / 2 | 0, pos[1] - radius / 2 | 0, radius | 0, radius | 0);
    }
  }
  ctx.restore();
};



Particle.generateSprite = function(color, alpha, max, center) {
  if (color == null) {
    color = Color.white;
  }
  color = Color(color);
  if (alpha == null) {
    alpha = 1;
  }
  if (max == null) {
    max = 25;
  }
  var size = max * 2;
  if (center == null) {
    center = 0.5;
  }

  return new Sprite(function(ctx) {
    for (var radius = 1; radius <= max; radius++) {
      var top = max + size * (radius - 1);

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
      ctx.beginPath();
      ctx.arc(max, top, radius, 0, Math.TAU, true);
      ctx.closePath();
      ctx.fill();
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

},{"./entity":5,"./component":6,"./pool":7,"./engine":3,"./math":2,"./color":8,"./sprite":19,"./transform":10,"./kinetic":13}],11:[function(require,module,exports){'use strict';

var Component = require('./component');
var Pool = require('./pool');
var Vec2 = require('./math').Vec2;
var Engine = require('./engine');

function Border() {}

Border.prototype = Object.create(Component.prototype);

Border.prototype.tag = 'border';

Border.prototype.attributes = {
  mode: 'bounce',
  restitution: 1
};

Border.prototype.create = function(attributes) {
  this.mode = attributes.mode;
  this.restitution = attributes.restitution;
};

var pos = Vec2();

Border.simulate = function(dt) {
  var size = Engine.renderer.content;
  var viewport = Engine.renderer.pos;
  var horizontal = Vec2.set(Vec2.cache[0], viewport[0], viewport[0] + size[0]);
  var vertical = Vec2.set(Vec2.cache[1], viewport[1], viewport[1] + size[1]);

  var register = this.register;
  for (var i = 0, l = register.length; i < l; i++) {
    var border = register[i];
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
    Vec2.copy(pos, entity.transform.pos);

    var radius = entity.bounds.radius;
    if (mirror) {
      radius *= -1;
    }
    var hit = 0;
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
      hit = -1;
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
        hit = -1;
      }
    }
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
      hit = 1;
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
        hit = 1;
      }
    }
    if (hit) {
      entity.transform.setTransform(pos);
      entity.pub('onBorder', hit);
      if (border.mode === 'kill') {
        entity.destroy();
      }
    }
  }
};

new Pool(Border);

module.exports = Border;

},{"./component":6,"./pool":7,"./math":2,"./engine":3}],12:[function(require,module,exports){'use strict';

var Component = require('./component');
var Pool = require('./pool');
var Vec2 = require('./math').Vec2;
var Engine = require('./engine');

// http://gamedev.tutsplus.com/tutorials/implementation/when-worlds-collide-simulating-circle-circle-collisions/
// https://sites.google.com/site/t3hprogrammer/research/circle-circle-collision-tutorial#TOC-Dynamic-Circle-Circle-Collision

// TODO: http://jsperf.com/circular-collision-detection/2
// http://jsperf.com/particle-collision-test/2

/**
 * Collider (Circle only)
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
  var colliders = this.register;
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

      if (!collider2.enabled || (kinetic1.sleeping && kinetic2.sleeping) || (collider1.include && !collider2[collider1.include]) || (collider2.include && !collider1[collider2.include]) || (collider1.exclude && collider2[collider1.exclude]) || (collider2.exclude && collider1[collider2.exclude])) {
        continue;
      }

      var radius1 = entity1.bounds.radius;
      var radius2 = entity2.bounds.radius;
      var pos1 = entity1.transform.pos;
      var pos2 = entity2.transform.pos;
      var radiusSum = radius1 + radius2;

      var diffSq = Vec2.distSq(pos1, pos2);
      if (diffSq > radiusSum * radiusSum) {
        continue;
      }

      var p = Vec2.norm(Vec2.sub(pos1, pos2, Vec2.cache[0]));
      var diff = Math.sqrt(diffSq);

      if (collider1.trigger || collider2.trigger) {
        entity1.pub('onTrigger', entity2, p, diff);
        entity2.pub('onTrigger', entity1, p, diff);
        continue;
      }

      diff -= radiusSum;
      var vel1 = kinetic1.velocity;
      var vel2 = kinetic2.velocity;
      var mass1 = kinetic1.mass || 1;
      var mass2 = kinetic2.mass || 1;

      if (diff < 0) {
        Vec2.add(pos1, Vec2.scal(p, -diff * 2 * radius1 / radiusSum, Vec2.cache[1]));
        Vec2.add(pos2, Vec2.scal(p, diff * 2 * radius2 / radiusSum, Vec2.cache[1]));
      }

      // normal vector to collision direction
      var n = Vec2.perp(p, Vec2.cache[1]);

      var vp1 = Vec2.dot(vel1, p); // velocity of P1 along collision direction
      var vn1 = Vec2.dot(vel1, n); // velocity of P1 normal to collision direction
      var vp2 = Vec2.dot(vel2, p); // velocity of P2 along collision direction
      var vn2 = Vec2.dot(vel2, n); // velocity of P2 normal to collision

      // fully elastic collision (energy & momentum preserved)
      var vp1After = (mass1 * vp1 + mass2 * (2 * vp2 - vp1)) / (mass1 + mass2);
      var vp2After = (mass1 * (2 * vp1 - vp2) + mass2 * vp2) / (mass1 + mass2);

      Vec2.add(Vec2.scal(p, vp1After, Vec2.cache[2]), Vec2.scal(n, vn1, Vec2.cache[3]), vel1);
      Vec2.add(Vec2.scal(p, vp2After, Vec2.cache[2]), Vec2.scal(n, vn2, Vec2.cache[3]), vel2);

      entity1.pub('onCollide', entity2, n);
      entity2.pub('onCollide', entity1, n);
    }
  }
};

new Component('collider', Collider);

module.exports = Collider;

},{"./component":6,"./pool":7,"./math":2,"./engine":3}],13:[function(require,module,exports){'use strict';

var Component = require('./component');
var Pool = require('./pool');
var Vec2 = require('./math').Vec2;

var cache = Vec2();
var copyVel = Vec2();

function Kinetic() {
  this.velocity = Vec2();
  this.force = Vec2();
  this.continuous = Vec2();
}

Kinetic.gravity = null;

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

  applyImpulse: function(impulse) {
    Vec2.add(
      this.force,
      (this.mass !== 1) ?
        Vec2.scal(impulse, 1 / (this.mass || 1), cache) :
        impulse
    );
  },

  applyForce: function(force) {
    Vec2.add(this.continuous, force);
  }

};

Kinetic.simulate = function(dt) {
  var epsilon = Math.epsilon;
  var register = this.register;
  for (var i = 0, l = register.length; i < l; i++) {
    var kinetic = register[i];
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
      Vec2.add(velocity, Vec2.scal(force, dt));
      Vec2.set(force);
      if (kinetic.maxVelocity) {
        Vec2.limit(velocity, kinetic.maxVelocity);
      }
      Vec2.add(kinetic.transform.pos, Vec2.scal(velocity, dt, cache));
      continue;
    }

    // Apply scene gravity
    var gravity = kinetic.root.gravity;
    if (gravity && kinetic.mass > epsilon) {
      debugger;
      Vec2.add(
        force,
        (kinetic.mass !== 1) ?
          Vec2.scal(gravity, 1 / kinetic.mass, cache) :
          gravity
      );
    }

    // Apply friction
    if (kinetic.friction) {
      Vec2.add(
        force,
        Vec2.scal(
          Vec2.norm(velocity, cache),
          -kinetic.friction
        )
      );
    }

    // http://www.richardlord.net/presentations/physics-for-flash-games
    // https://github.com/soulwire/Coffee-Physics/tree/master/source/engine/integrator

    if (kinetic.maxForce) {
      Vec2.limit(force, kinetic.maxForce);
    }

    Vec2.copy(copyVel, velocity);
    Vec2.add(velocity, Vec2.scal(force, dt));
    if (kinetic.maxVelocity) {
      Vec2.limit(velocity, kinetic.maxVelocity);
    }
    Vec2.scal(Vec2.add(copyVel, velocity), dt / 2);
    Vec2.add(kinetic.transform.pos, copyVel);

    Vec2.add(velocity, force);

    // Apply drag
    if (kinetic.drag < 1) {
      Vec2.scal(velocity, kinetic.drag);
    }

    var sleepVelocity = kinetic.sleepVelocity;
    if (sleepVelocity) {
      if (Vec2.lenSq(velocity) <= sleepVelocity * sleepVelocity) {
        if (!kinetic.sleeping) {
          Vec2.set(velocity);
          kinetic.sleeping = true;
          kinetic.entity.pubUp('onKineticSleep', kinetic);
        }
      } else {
        if (kinetic.sleeping) {
          kinetic.sleeping = false;
          kinetic.entity.pubUp('onKineticWake', kinetic);
        }
      }
    }

    // Reset force
    Vec2.set(force);
  }
};

new Component('kinetic', Kinetic);

module.exports = Kinetic;

},{"./component":6,"./pool":7,"./math":2}],14:[function(require,module,exports){'use strict';

var Component = require('./component');
var Pool = require('./pool');
var Vec2 = require('./math').Vec2;

var cache = Vec2();

function Jitter() {}

Jitter.prototype = Object.create(Component.prototype);

Jitter.prototype.tag = 'jitter';

Jitter.prototype.attributes = {
  factor: 0.2,
  force: 300
};

Jitter.prototype.create = function(attributes) {
  this.factor = attributes.factor;
  this.force = attributes.force;
};

Jitter.prototype.fixedUpdate = function(dt) {
  if (Math.chance(this.factor)) {
    this.entity.kinetic.applyImpulse(Vec2.set(
      cache,
      Math.rand(-this.force, this.force), Math.rand(-this.force, this.force)
    ));
  }
};

new Pool(Jitter);

module.exports = Jitter;

},{"./component":6,"./pool":7,"./math":2}],15:[function(require,module,exports){'use strict';

// http://www.openprocessing.org/sketch/7493
// http://www.openprocessing.org/sketch/11045

var Component = require('./component');
var Pool = require('./pool');
var Vec2 = require('./math').Vec2;
var Kinetic = require('./kinetic');


function Boid() {
	this.mod = 2;
	this.cohesionMod = 1;
	this.avoidanceMod = 2;
	this.imitationMod = 1;
}
Boid.prototype = Object.create(Component.prototype);

Boid.prototype.tag = 'boid';

Boid.prototype.attributes = {
	perception: 100,
	aura: 25
};

Boid.prototype.create = function(attributes) {
	this.perception = attributes.perception;
	this.aura = attributes.aura;
	if (!this.aura && this.bounds) {
		this.aura = this.bounds.radius * 1.5;
	}
	this.perceptionSq = this.perception * this.perception;
	this.auraSq = this.aura * this.aura;
	return this;
};


var cohesion = Vec2();
var avoidance = Vec2();
var imitation = Vec2();
var stretch = Vec2();
var impulse = Vec2();

Boid.fixedUpdate = function(dt) {
	var boids = this.register;
	var len = boids.length;
	var i = len;
	while (i--) {
		var boid1 = boids[i];
		if (!boid1.enabled) {
			continue;
		}
		var avoidanceCount = 0;
		var imitationCount = 0;
		var cohesionCount = 0;
		var entity1 = boid1.entity;
		var pos1 = entity1.transform.pos;
		var vel = entity1.kinetic.velocity;
		Vec2.set(impulse);

		var j = len;
		while (j--) {
			var boid2 = boids[j];
			if (!boid2.enabled || boid1 === boid2) {
				continue;
			}

			var entity2 = boid2.entity;
			var pos2 = entity2.transform.pos;

			var diffSq = Vec2.distSq(pos1, pos2);

			if (diffSq < boid1.perceptionSq && diffSq) {
				Vec2.sub(pos2, pos1, stretch);
				Vec2.scal(stretch, Math.sqrt(entity1.kinetic.mass / entity2.kinetic.mass));

				// diff = Math.sqrt(diffSq)
				// Vec2.scal(stretch, Math.quadInOut(diff / boid1.perception), cache)

				// Cohesion : try to approach other boids
				if (!(cohesionCount++)) {
					Vec2.copy(cohesion, stretch);
				} else {
					Vec2.add(cohesion, stretch);
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
						Vec2.copy(avoidance, stretch);
					} else {
						Vec2.add(avoidance, stretch);
					}
				}
			}
		}

		var mod = boid1.mod;
		if (cohesionCount && boid1.cohesionMod) {
			if (cohesionCount > 1) {
				Vec2.scal(cohesion, 1 / cohesionCount);
			}
			Vec2.add(entity1.kinetic.force, Vec2.scal(cohesion, boid1.cohesionMod * mod));
		}

		if (imitationCount && boid1.imitationMod) {
			if (imitationCount > 1) {
				Vec2.scal(imitation, 1 / imitationCount);
			}
			Vec2.add(impulse, Vec2.scal(imitation, boid1.imitationMod * mod));
			Vec2.add(entity1.kinetic.force, Vec2.sub(impulse, vel));
		}

		if (avoidanceCount && boid1.avoidanceMod) {
			if (avoidanceCount > 1) {
				Vec2.scal(avoidance, 1 / avoidanceCount);
			}
			Vec2.sub(entity1.kinetic.force, Vec2.scal(avoidance, boid1.avoidanceMod * mod));
		}
	}
};

new Pool(Boid);

module.exports = Boid;

},{"./component":6,"./pool":7,"./math":2,"./kinetic":13}],10:[function(require,module,exports){'use strict';

var Component = require('./component');
var Pool = require('./pool');
var Vec2 = require('./math').Vec2;

function Transform() {
  this.pos = Vec2();
  this.angle = 0;
  this.alpha = 1;
  this.dirty = false;
}

Transform.prototype = Object.create(Component.prototype);

Transform.prototype.tag = 'transform';

Transform.prototype.attributes = {
  pos: Vec2(),
  angle: 0,
  alpha: 1
};

Transform.prototype.create = function(attributes) {
  Vec2.copy(this.pos, attributes.pos);
  this.angle = attributes.angle;
  this.alpha = attributes.alpha;
};

Transform.prototype.setTransform = function(pos, angle, silent) {
  if (pos != null) {
    Vec2.copy(this.pos, pos);
  }
  if (angle != null) {
    this.angle = angle;
  }
  this.dirty = true;
  if (!silent) {
    this.entity.pub('onTransform', this.pos, this.angle);
  }
};

Transform.prototype.applyMatrix = function(ctx) {
  /**
   mat = Mat2.trans(Mat2.identity, @pos, @matrix)
   ctx.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5])
   if Vec2.lenSq(@pos)
   ctx.translate(@pos[0] | 0, @pos[1] | 0)
   if (x = @scale[0]) isnt 1 or (y = @scale[1]) isnt 1
    ctx.scale(x, y)
   */
  ctx.translate(this.pos[0] | 0, this.pos[1] | 0);
  if (this.angle) {
    ctx.rotate(this.angle);
  }
};

new Pool(Transform);

module.exports = Transform;

},{"./component":6,"./pool":7,"./math":2}],16:[function(require,module,exports){'use strict';

var Component = require('./component');
var Pool = require('./pool');
var Vec2 = require('./math').Vec2;
var Engine = require('./engine');


function Console() {
  this.colors = ['#ddd', '#fff', '#ffc', '#fcc'];
  this.sections = ['#f9f684', '#f9ad84', '#b778e2', '#78dbe2'];
}

Console.prototype = Object.create(Component.prototype);

Console.prototype.tag = 'console';

Console.prototype.attributes = {
  css: '',
  container: null,
  width: 100,
  height: 56,
  cap: 50,
  resolution: 0.25
};

Console.prototype.create = function(attributes) {
  this.css = attributes.css;
  this.container = attributes.container;
  this.width = attributes.width;
  this.height = attributes.height;
  this.cap = attributes.cap;
  this.resolution = attributes.resolution;

  var wrap = this.wrap = document.createElement('div');
  wrap.id = 'console';
  wrap.style.cssText = '' +
      'position: absolute;' +
      'left: 0;' +
      'top: 0;' +
      'user-select: none;' +
      'overflow: hidden;' +
      'padding: 0;' +
      'width: #{@width}px;' +
      'color: #ccc;' +
      'background-color: rgba(0, 0, 0, 0.75);' +
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
  this.graphSpan.style.cssText = '' +
    'height: ' + this.height + 'px;' +
    'z-index: 1;';
  this.graphSpan.title = 'Fixed Update + Update + Render + Lag';

  var barCss = 'width: 1px;' +
    'float: left;' +
    'margin-top: 0px;';
  var sectionCss = 'display: block;' +
    'height: 0px;';

  var i = this.width;
  while (i--) {
    var bar = document.createElement('span');
    bar.className = 'console-bar';
    bar.style.cssText = barCss;
    var  sections = this.sections;
    for (var j = 0, l = sections.length; j < l; j++) {
      var section = document.createElement('span');
      section.className = 'console-section';
      section.style.cssText = sectionCss + ('background-color: ' + sections[j]);
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
};

Console.prototype.handleEvent = function(evt) {
  var time = evt.timeStamp;
  console.log(time - this.lastClick);
  if (time - this.lastClick < 250) {
    this.destroy();
  }
  this.lastClick = time;

  this.toggle();
  return false;
};

Console.prototype.toggle = function() {
  var margin = 0;
  var opacity = 0.8;
  this.maximized = !this.maximized;
  if (!this.maximized) {
    opacity = 0.5;
    margin = -this.height + 20;
    document.cookie = 'console_max=; expires=' + (new Date()).toGMTString();
  } else {
    document.cookie = 'console_max=1'
  }
  var style = this.graphSpan.style;
  style.marginTop = '' + margin + 'px';
  style.opacity = opacity;
};

Console.prototype.free = function() {
  (this.container || document.body).removeChild(this.wrap);
  this.wrap.removeEventListener('click', this);
  this.wrap = null;
  this.container = null;
  Component.prototype.free.call(this);
};

Console.prototype.onTimeEnd = function(samples) {
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
  this.tickSpan2.textContent = tickSD < 10 ? Math.round(tickSD * 10) / 10 : Math.round(tickSD);

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

  bar.style.marginTop = '' + (this.height - overall) + 'px';

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
};

Console.prototype.nullify = function() {
  this.dtSum = 0;
  this.fpsSum = this.fpsSq = 0;
  this.tickSum = this.tickSq = 0;
  this.lagSum = this.lagSq = 0;
  this.fixedUpdateSum = 0;
  this.updateSum = 0;
  this.renderSum = 0;
  this.frames = 0;
};

new Pool(Console);

module.exports = Console;

},{"./component":6,"./pool":7,"./math":2,"./engine":3}],17:[function(require,module,exports){'use strict';

var Component = require('./component');
var Pool = require('./pool');
var Vec2 = require('./math').Vec2;
var Engine = require('./engine');

function Input() {
  this.queue = [];
  this.locks = {};
  this.pos = Vec2();
  this.prevPos = Vec2();
  this.touchState = null;
  this.axis = Vec2();
  this.mouseAxis = Vec2();
  this.orientation = Vec2();
  this.prevOrientation = Vec2();
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

  this.lastEvent = null;

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

  this.attach();
}

Input.prototype.attach = function() {
  for (var type in this.events) {
    window.addEventListener(type, this, false);
  }
};

Input.prototype.detach = function() {
  for (var type in this.events) {
    window.removeEventListener(type, this, false);
  }
};

Input.prototype.support = {
  touch: 'ontouchstart' in window,
  orientation: 'ondeviceorientation' in window
};

Input.prototype.handleEvent = function(event) {
  if (event.metaKey) {
    return;
  }
  event.preventDefault();
  var type = event.type;
  if (this.throttled[type] && this.lastEvent === type) {
    this.queue[this.queue.length - 1] = event;
  } else {
    this.lastEvent = type;
    this.queue.push(event);
  }
};

Input.prototype.keyStart = function(event) {
  var key = this.map[event.keyCode];
  if (key && !this.keys[key]) {
    if (!this.lock('key-' + key)) {
      return false;
    }
    this.keys[key] = 'began';
    this.updateAxis(key);
    Engine.pub('onKeyBegan', key);
  }
};

Input.prototype.keyEnd = function(event) {
  var key = this.map[event.keyCode];
  if (key) {
    if (!this.lock('key-' + key)) {
      return false;
    }
    this.keys[key] = 'ended';
    this.updateAxis(key, true);
    Engine.pub('onKeyEnded', key);
  }
};

Input.prototype.startTouch = function(event) {
  if (!this.lock('touch')) {
    return false;
  }
  this.resolve(event);
  if (!this.touchState && !event.metaKey) {
    this.touchState = 'began';
    Engine.pub('onTouchBegan');
  }
};

Input.prototype.moveTouch = function(event) {
  var state = this.touchState;
  if ((state === 'began' || state === 'ended') && !this.lock('touch')) {
    return false;
  }
  this.resolve(event);
  if (state && state !== 'ended' && state !== 'moved') {
    this.touchState = 'moved';
  }
};

Input.prototype.endTouch = function(event) {
  if (!this.lock('touch')) {
    return false;
  }
  this.resolve(event);
  if (this.touchState && (!this.support.touch || !event.targetTouches.length)) {
    Engine.pub('onTouchEnded');
    this.touchState = 'ended';
  }
};

Input.prototype.updateAxis = function(key, ended) {
  var axis = this.axisMap[key];
  if (axis) {
    if (ended) {
      this.axis[axis[0]] -= axis[1];
    } else {
      this.axis[axis[0]] += axis[1];
    }
  }
};

Input.prototype.blur = function() {
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
};

Input.prototype.calibrateOrientation = function() {
  this.baseOrientationTime = this.orientationTime;
  Vec2.copy(this.baseOrientation, this.orientation);
  Vec2.set(this.orientation);
};

Input.prototype.deviceOrientation = function(event) {
  Vec2.copy(this.prevOrientation, this.orientation);
  Vec2.sub(Vec2.set(this.orientation, event.gamma | 0, event.beta | 0), this.baseOrientation);
  this.orientationTime = event.timeStamp / 1000;
  if (!this.baseOrientationTime) {
    this.calibrateOrientation();
  }
};

Input.prototype.resolve = function(event) {
  var coords = this.support.touch ? event.targetTouches[0] : event;
  if (coords) {
    this.prevTime = this.time;
    this.time = event.timeStamp / 1000;
    Vec2.copy(this.prevPos, this.pos);
    var renderer = Engine.renderer;
    Vec2.set(this.pos, (coords.pageX - renderer.margin[0]) / renderer.scale | 0, (coords.pageY - renderer.margin[1]) / renderer.scale | 0);
  }
};

Input.prototype.lock = function(key) {
  if (this.locks[key] === this.frame) {
    return false;
  }
  this.locks[key] = this.frame;
  return true;
};

Input.prototype.postUpdate = function() {
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
    if (this[this.events[type] || type](event) === false) {
      break;
    }
    queue.shift();
  }
  if (!queue.length) {
    this.lastEvent = null;
  }
};

new Component('input', Input);

module.exports = Input;

},{"./component":6,"./pool":7,"./math":2,"./engine":3}],18:[function(require,module,exports){'use strict';

var Component = require('./component');
var Pool = require('./pool');
var Color = require('./color');
var Vec2 = require('./math').Vec2;

function Bounds() {
	this.size = Vec2();
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

	getTop: function() {
		if (this.shape === 'circle') {
			return this.transform.pos[1] - this.radius;
		}
		return this.transform.pos[1];
	},

	getBottom: function() {
		if (this.shape === 'circle') {
			return this.transform.pos[1] + this.radius;
		}
		return this.transform.pos[1] + this.size[1];
	},

	/*
	getAabb: function() {
		if (!this.topLeft) {
			this.topLeft = Vec2();
			this.bottomRight = Vec2();
		}
		Vec2.set(
			this.topLeft,
			this.pos[0] + this.size[0] * 0.5 * (this.align[0] + 1),
			this.pos[1] + this.size[1] * 0.5 * (this.align[1] + 1)
		);
		Vec2.set(
			this.bottomRight,
			this.pos[0] + this.size[0] * 0.5 * (this.align[0] + 5),
			this.pos[1] + this.size[1] * 0.5 * (this.align[1] + 5)
		);
		return this.topLeft;
	},
	*/

	intersectLine: function(a1, a2, result) {
		var pos = this.transform.pos;
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
		var pos = this.transform.pos;
		switch (this.shape) {
			case 'circle':
				return Bounds.circPoint(pos, this.radius, point);
			case 'rect':
				return Bounds.rectPoint(pos, this.size, point);
		}
		return false;
	},

	withinRect: function(pos, size) {
		var mypos = this.transform.pos;
		switch (this.shape) {
			case 'circle':
				return Bounds.rectCirc(pos, size, mypos, this.radius);
			case 'rect':
				return Bounds.rectRect(pos, size, mypos, this.size);
		}
		return false;
	}

};

// http://www.openprocessing.org/user/54

Bounds.circPoint = function(center, radius, point) {
	return Vec2.distSq(point, center) <= radius * radius;
};

Bounds.rectPoint = function(pos, size, point) {
	return pos[0] - size[0] < point[0] && pos[1] < point[1] && pos[0] + size[0] > point[0] && pos[1] + size[1] > point[1];
};

var v = Vec2();
var w = Vec2();

/**
 * closestLinePoint
 *
 * http://blog.generalrelativity.org/actionscript-30/collision-detection-circleline-segment-circlecapsule/
 *
 * @param  {Vec2} a     [description]
 * @param  {Vec2} b     [description]
 * @param  {Vec2} point [description]
 * @param  {Vec2} result [description]
 * @return {Vec2}       result
 */
Bounds.closestLinePoint = function(a, b, point, result) {
	Vec2.sub(b, a, v);
	Vec2.sub(point, a, w);
	var t = Math.clamp(Vec2.dot(w, v) / Vec2.dot(v, v), 0, 1);
	return Vec2.add(a, Vec2.scal(v, t, result));
};

var lineCircTest = Vec2();

/**
 * intersectLineCirc
 *
 * @param  {Vec2} a      [description]
 * @param  {Vec2} b      [description]
 * @param  {Vec2} center [description]
 * @param  {number} radius [description]
 * @param  {Vec2} result [description]
 * @return {Vec2|bool}        [description]
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

Bounds.rectCirc = function(topLeft, size, center, radius) {
	var circleDistanceX, circleDistanceY, cornerDistance;
	circleDistanceX = Math.abs(center[0] - topLeft[0] - size[0] / 2);
	circleDistanceY = Math.abs(center[1] - topLeft[1] - size[1] / 2);
	if (circleDistanceX > (size[0] / 2 + radius) || circleDistanceY > (size[1] / 2 + radius)) {
		return false;
	}
	if (circleDistanceX <= size[0] / 2 || circleDistanceY <= size[1] / 2) {
		return true;
	}
	cornerDistance = Math.pow(circleDistanceX - size[0] / 2, 2) + Math.pow(circleDistanceY - size[1] / 2, 2);
	return cornerDistance <= Math.pow(radius, 2);
};

Bounds.rectRect = function(pos, size, pos2, size2) {
	return !(pos[0] > pos2[0] + size2[0] || pos[0] + size[0] < pos2[0] || pos[1] > pos2[1] + size2[1] || pos[1] + size[1] < pos2[1]);
};

new Component('bounds', Bounds);

/**
 * Bounds.lineRect
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
 * Line Line intersection
 *
 * http://stackoverflow.com/questions/3746274/line-intersection-with-aabb-rectangle
 * http://jsperf.com/line-intersection2/2
 *
 * @return {bool} Intersects
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
}

function ccw(a, b, c) {
	var cw = ((c[1] - a[1]) * (b[0] - a[0])) - ((b[1] - a[1]) * (c[0] - a[0]));
	return (cw > 0) ? true : cw < 0 ? false : true /* colinear */
	;
};

/**
 * Component: Bounds.Debug
 *
 * Outlines the boundaries and angle of an entity.
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

},{"./component":6,"./pool":7,"./color":8,"./math":2}],19:[function(require,module,exports){'use strict';

var Vec2 = require('./math').Vec2;
var Component = require('./component');
var Pool = require('./pool');

/**
 * Sprite.Asset
 *
 * Represents a single image, either loaded from source or drawn via
 * callback.
 *
 * @param {String|Function} srcOrRepaint [description]
 * @param {Array} size Override size for drawing canvas
 * @param {Number} baseScale Base scale applied to all draws, defaults to 1
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
	}
}

SpriteAsset.prototype.toString = function() {
	var url = (this.buffer) ? this.buffer.toDataURL() : 'Pending';
	return "SpriteAsset " + (Vec2.toString(this.size)) + " " +
		(Vec2.toString(this.bufferSize)) + "\n" +
		(this.src || this.repaint) + "\n" +
		url;
};

SpriteAsset.prototype.handleEvent = function() {
	// console.log('Loaded ' + this);
	if (!this.loading) {
		return;
	}
	this.loading = false;
	Vec2.set(this.size, this.img.width, this.img.height);
	this.refresh();
};

SpriteAsset.prototype.draw = function(ctx, toPos, align, size, fromPos, scale) {
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
};

SpriteAsset.prototype.repaint = function() {
	var size = this.size;
	this.buffer.width = size[0];
	this.buffer.height = size[1];
	this.bufferCtx.drawImage(this.img, 0, 0, size[0], size[1]);
	this.sample();
};

SpriteAsset.prototype.sample = function() {
	var scale = this.scale;
	var size = this.size;
	var bufferCtx = this.bufferCtx;
	var data = bufferCtx.getImageData(0, 0, size[0], size[1]).data;
	this.buffer.width = this.bufferSize[0];
	this.buffer.height = this.bufferSize[1];
	for (var x = 0, w = size[0], h = size[1]; x <= w; x += 1) {
		for (var y = 0; y <= h; y += 1) {
			var i = (y * size[0] + x) * 4;
			bufferCtx.fillStyle = "rgba(" + data[i] + ", " + data[i + 1] + ", " +
				data[i + 2] + ", " + (data[i + 3] / 255) + ")";
			bufferCtx.fillRect(x * scale, y * scale, scale, scale);
		}
	}
};

SpriteAsset.prototype.refresh = function(scale) {
	// console.log('Refresh');
	scale = (scale || 1) * this.baseScale;
	if (this.ready && this.scale === scale) {
		return;
	}
	this.scale = scale;
	this.buffer.width = this.bufferSize[0] = this.size[0] * scale | 0;
	this.buffer.height = this.bufferSize[1] = this.size[1] * scale | 0;
	Vec2.scal(this.bufferSize, -0.5, this.defaultOffset);
	this.repaint(this.bufferCtx, scale);
	this.ready = true;
};


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

/**
 * Add sequence to spritesheet.
 *
 * Sequences are defined as short-form by Array:
 *   [frameIndexes, next || null, speed || defaultSpeed || sprite || 0]
 * or Object:
 *   {frames: [], next: "id", speed: seconds, sprite: 0}
 *
 * @param {String} id       Sequence name (walk, jump, etc)
 * @param {Array|Object} sequence Array or object
 */
SpriteSheet.prototype.addSequence = function(id, sequence) {
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
};

SpriteSheet.prototype.prepare = function() {
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
		for (var j = 0, l = sprites.length; j < l; j++) {
			var sprite = sprites[j];
			var cols = sprite.size[0] / size[0] | 0;
			var rows = sprite.size[1] / size[1] | 0;
			// debugger;
			for (var y = 0; y < rows; y++) {
				for (var x = 0; x < cols; x++) {
					this.frames.push({
						sprite: sprite,
						pos: Vec2(x * size[0], y * size[1]),
						size: size,
						align: align || Vec2.center
					});
				}
			}
		}
	}
	this.ready = true;
	return true;
};

SpriteSheet.prototype.draw = function(ctx, idx) {
	if (!this.ready && !this.prepare()) {
		return;
	}
	var frame = this.frames[idx || 0];
	frame.sprite.draw(ctx, null, frame.align, frame.size, frame.pos);
};


function SpriteTween() {}

SpriteTween.prototype.attributes = {
	asset: null,
	speed: null,
	sequence: null,
	offset: 0,
	composite: null
};

SpriteTween.prototype.create = function(attributes) {
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
};

SpriteTween.prototype.preRender = function(dt) {
	if (this.isSheet && !this.paused) {
		var dtime = (this.dtime += dt);
		if (this.sequence) {
			var sequence = this.asset.sequences[this.sequence];
			var speed = sequence.speed;
			var frames = sequence.frames;
			var frameCount = frames.length;
			if (dtime >= frameCount * speed) {
				this.entity.pub('onSequenceEnd');
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
			var frames = this.asset.frames;
			var frameCount = frames.length;
			var speed = this.speed;
			var dtime = dtime % (frameCount * speed);
			var frame = dtime / speed | 0;
			if (frame < this.frame) {
				this.entity.pub('onSequenceEnd');
			}
			this.frame = dtime / speed | 0;
		}
	}
};

SpriteTween.prototype.render = function(ctx) {
	ctx.save();
	this.transform.applyMatrix(ctx);
	if (this.composite) {
		ctx.globalCompositeOperation = this.composite;
	}
	this.asset.draw(ctx, this.frame);
	ctx.restore();
};

SpriteTween.prototype.pause = function() {
	this.paused = true;
	return this;
};

SpriteTween.prototype.play = function() {
	this.paused = false;
	return this;
};

SpriteTween.prototype.goto = function(id) {
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
};

new Component('spriteTween', SpriteTween);

module.exports.Asset = SpriteAsset;
module.exports.Tween = SpriteTween;
module.exports.Sheet = SpriteSheet;

},{"./math":2,"./component":6,"./pool":7}]},{},[1]);