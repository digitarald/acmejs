var acmejs =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	module.exports = {
	  Boid: __webpack_require__(1),
	  Border: __webpack_require__(2),
	  Bounds: __webpack_require__(3),
	  Collider: __webpack_require__(4),
	  Color: __webpack_require__(5),
	  Component: __webpack_require__(6),
	  Console: __webpack_require__(7),
	  Engine: __webpack_require__(8),
	  Entity: __webpack_require__(9),
	  Heightmap: __webpack_require__(20),
	  Input: __webpack_require__(10),
	  Jitter: __webpack_require__(11),
	  Kinetic: __webpack_require__(12),
	  Mat2: __webpack_require__(22),
	  Mathf: __webpack_require__(23),
	  Particle: __webpack_require__(13),
	  Perlin: __webpack_require__(21),
	  Pool: __webpack_require__(14),
	  Prefab: __webpack_require__(15),
	  Random: __webpack_require__(24),
	  Renderer: __webpack_require__(16),
	  Shims: __webpack_require__(17),
	  Sprite: __webpack_require__(18),
	  Transform: __webpack_require__(19),
	  Tweens: __webpack_require__(25),
	  Vec2: __webpack_require__(26) };

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var Component = __webpack_require__(6);
	var Vec2 = __webpack_require__(26);
	var Kinetic = __webpack_require__(12);
	
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
	
	  create: function () {
	    if (this.aura === 0 && this.bounds) {
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
	
	Boid.fixedUpdate = function (dt) {
	  var boids = this.pool.heap;
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
	        if (! cohesionCount++) {
	          Vec2.copy(cohesion, distance);
	        } else {
	          Vec2.add(cohesion, distance);
	        }
	
	        // Imitation : try to move in the same way than other boids
	        if (! imitationCount++) {
	          Vec2.copy(imitation, entity2.kinetic.velocity);
	        } else {
	          Vec2.add(imitation, entity2.kinetic.velocity);
	        }
	
	        // Avoidance : try to keep a minimum distance between others.
	        if (diffSq < boid1.auraSq) {
	          if (! avoidanceCount++) {
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
	      Vec2.add(entity1.kinetic.force, Vec2.sub(impulse, vel));
	    }
	
	    if (avoidanceCount && boid1.avoidanceMod) {
	      if (avoidanceCount > 1) {
	        Vec2.scale(avoidance, 1 / avoidanceCount);
	      }
	      Vec2.sub(entity1.kinetic.force, Vec2.scale(avoidance, boid1.avoidanceMod * mod));
	    }
	  }
	};
	
	Component.create(Boid, "boid");
	
	module.exports = Boid;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var Component = __webpack_require__(6);
	var Pool = __webpack_require__(14);
	var Vec2 = __webpack_require__(26);
	var Engine = __webpack_require__(8);
	
	/**
	 * @class Border
	 * Border lets entities react on contact with the canvas borders.
	 * @extends Component
	 * @property {String} [mode="bounce"] Reaction to contact with border, "constrain", "bounce", "mirror", "kill"
	 * @property {Number} [restitution=1] Restitution on bounce
	 * @fires Border#onBorder
	 */
	function Border() {
	  Component.call(this);
	  this.mode = "";
	  this.restitution = 0;
	}
	
	Border.prototype = {
	  attributes: {
	    mode: "bounce",
	    restitution: 1
	  }
	};
	
	var position = Vec2();
	var velocity = Vec2();
	var topLeft = Vec2();
	var bottomRight = Vec2();
	
	Border.simulate = function (dt) {
	  topLeft = Engine.renderer.position;
	  Vec2.add(topLeft, Engine.renderer.content, bottomRight);
	
	  var borders = this.pool.heap;
	  for (var i = 0, l = borders.length; i < l; i++) {
	    var border = borders[i];
	    if (!border.enabled) {
	      continue;
	    }
	
	    var restitution = border.restitution;
	    var mode = border.mode;
	    var mirror = mode == "mirror";
	    var bounce = mode == "bounce";
	    var entity = border.entity;
	    var kinetic = entity.components.kinetic;
	    if (bounce && kinetic != null) {
	      if (!kinetic.enabled || kinetic.sleeping) {
	        continue;
	      }
	      kinetic.copyVelocity(velocity);
	    }
	    var transform = entity.components.transform;
	    transform.copyPosition(position);
	    var bounds = entity.components.bounds;
	    var contact = true;
	
	    // Horizontal
	    var diff = (bounce ? bounds.left : bounds.right) - topLeft[0];
	    if (diff <= 0) {
	      contact = true;
	      if (mirror) {
	        position[0] = bottomRight[0] + bounds.width;
	      } else {
	        position[0] -= diff;
	        if (bounce) {
	          velocity[0] *= -restitution;
	        }
	      }
	    } else {
	      diff = (bounce ? bounds.right : bounds.left) - bottomRight[0];
	      if (diff >= 0) {
	        contact = true;
	        if (mirror) {
	          position[0] = topLeft[0] - bounds.width;
	        } else {
	          position[0] -= diff;
	          if (bounce) {
	            velocity[0] *= -restitution;
	          }
	        }
	      } else {
	        // Vertical
	        diff = (bounce ? bounds.top : bounds.bottom) - topLeft[1];
	        if (diff <= 0) {
	          contact = true;
	          if (mirror) {
	            position[1] = bottomRight[1] + bounds.height;
	          } else {
	            position[1] -= diff;
	            if (bounce) {
	              velocity[1] *= -restitution;
	            }
	          }
	        } else {
	          diff = (bounce ? bounds.bottom : bounds.top) - bottomRight[1];
	          if (diff >= 0) {
	            contact = true;
	            if (mirror) {
	              position[1] = topLeft[1] - bounds.height;
	            } else {
	              position[1] -= diff;
	              if (bounce) {
	                velocity[1] *= -restitution;
	              }
	            }
	          }
	        }
	      }
	    }
	
	    // We contact
	    if (contact) {
	      transform.position = position;
	      if (kinetic != null) {
	        kinetic.velocity = velocity;
	      }
	      /**
	       * Fired on contact
	       * @event Border#onBorder
	       * @param {Number[]} contact Contact point
	       */
	      entity.emit("onBorder");
	      if (border.mode == "kill") {
	        entity.destroy();
	      }
	    }
	  }
	};

	Component.create(Border, "border");

	module.exports = Border;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var Component = __webpack_require__(6);
	var Pool = __webpack_require__(14);
	var Color = __webpack_require__(5);
	var Mathf = __webpack_require__(23);
	var Vec2 = __webpack_require__(26);
	var Random = __webpack_require__(24);
	
	/**
	 * @class Bounds
	 * Tracks shape and dimensions of an entity.
	 * TODO: Shapes into poolable objects
	 * TODO: https://github.com/photonstorm/phaser/blob/master/Phaser/Collision.ts
	 * @extends Component
	 * @property {String} shape "circle" or "rect"
	 * @property {Number} radius Circle radius
	 * @property {Number[]} size Rect size
	 */
	function Bounds() {
	  Component.call(this);
	  this.shape = "rect";
	  this.radius = 0;
	  this._size = Vec2();
	  this._anchor = Vec2();
	}
	
	Bounds.prototype = Object.defineProperties({
	  attributes: {
	    shape: "rect",
	    radius: 0,
	    size: Vec2(),
	    anchor: Vec2.center
	  },
	
	  intersectLine: function (a1, a2, result) {
	    var pos = this.components.transform.position;
	    if (this.shape == "circle") {
	      return Bounds.intersectLineCirc(a1, a2, pos, this.radius, result);
	    }
	    return false;
	  },
	
	  contains: function (point) {
	    var pos = this.components.transform.position;
	    if (this.shape == "circle") {
	      return Bounds.circPoint(pos, this.radius, point);
	    }
	    return Bounds.rectPoint(pos, this._size, point);
	  },
	
	  withinRect: function (pos, size) {
	    var mypos = this.components.transform.position;
	    if (this.shape == "circle") {
	      return Bounds.rectCirc(pos, size, mypos, this.radius);
	    }
	    return Bounds.rectRect(pos, size, mypos, this._size);
	  } }, {
	  top: {
	    get: function () {
	      var y = this.components.transform.position[1];
	      if (this.shape == "circle") {
	        return y - this.radius;
	      }
	      return y - this._size[1] / 2;
	    },
	    enumerable: true,
	    configurable: true
	  },
	  bottom: {
	    get: function () {
	      var y = this.components.transform.position[1];
	      if (this.shape == "circle") {
	        return y + this.radius;
	      }
	      return y + this._size[1] / 2;
	    },
	    enumerable: true,
	    configurable: true
	  },
	  left: {
	    get: function () {
	      var x = this.components.transform.position[0];
	      if (this.shape == "circle") {
	        return x - this.radius;
	      }
	      return x - this._size[1] / 2;
	    },
	    enumerable: true,
	    configurable: true
	  },
	  right: {
	    get: function () {
	      var x = this.components.transform.position[0];
	      if (this.shape == "circle") {
	        return x + this.radius;
	      }
	      return x + this._size[1] / 2;
	    },
	    enumerable: true,
	    configurable: true
	  },
	  width: {
	    get: function () {
	      if (this.shape == "circle") {
	        return this.radius * 2;
	      }
	      return this._size[0];
	    },
	    enumerable: true,
	    configurable: true
	  },
	  height: {
	    get: function () {
	      if (this.shape == "circle") {
	        return this.radius * 2;
	      }
	      return this._size[1];
	    },
	    enumerable: true,
	    configurable: true
	  }
	});
	
	Vec2.defineProperty(Bounds, "size");
	Vec2.defineProperty(Bounds, "anchor");
	
	/*
	getAabb: function() {
		if (!this.topLeft) {
			this.topLeft = Vec2();
			this.bottomRight = Vec2();
		}
		Vec2.set(
			this.topLeft,
			this.position[0] + this._size[0] * 0.5 * (this.align[0] + 1),
			this.position[1] + this._size[1] * 0.5 * (this.align[1] + 1)
		);
		Vec2.set(
			this.bottomRight,
			this.position[0] + this._size[0] * 0.5 * (this.align[0] + 5),
			this.position[1] + this._size[1] * 0.5 * (this.align[1] + 5)
		);
		return this.topLeft;
	},
	*/
	
	/**
	 * Intersection circle/point
	 * http://www.openprocessing.org/user/54
	 * @param {Number[]} center
	 * @param {Number} radius
	 * @param {Number[]} point
	 * @return {Boolean}
	 */
	Bounds.circPoint = function (center, radius, point) {
	  return Vec2.distSq(point, center) <= radius * radius;
	};
	
	/**
	 * Intersection rectangle/point
	 * @param {Number[]} pos
	 * @param {Number[]} size
	 * @param {Number[]} point
	 * @return {Boolean}
	 */
	Bounds.rectPoint = function (pos, size, point) {
	  return pos[0] - size[0] < point[0] && pos[1] < point[1] && pos[0] + size[0] > point[0] && pos[1] + size[1] > point[1];
	};
	
	/**
	 * Closes point to a line
	 * http://blog.generalrelativity.org/actionscript-30/collision-detection-circleline-segment-circlecapsule/
	 * @param {Number[]} a Line P1
	 * @param {Number[]} b Line P2
	 * @param {Number[]} point Point
	 * @param {Number[]} result Result
	 * @return {Number[]} Result
	 */
	Bounds.closestLinePoint = function (a, b, point, result) {
	  Vec2.sub(b, a, v);
	  Vec2.sub(point, a, w);
	  var t = Mathf.clamp(Vec2.dot(w, v) / Vec2.dot(v, v), 0, 1);
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
	Bounds.intersectLineCirc = function (a, b, center, radius, result) {
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
	Bounds.rectCirc = function (topLeft, size, center, radius) {
	  var circleDistanceX = Math.abs(center[0] - topLeft[0] - size[0] / 2);
	  var circleDistanceY = Math.abs(center[1] - topLeft[1] - size[1] / 2);
	  if (circleDistanceX > size[0] / 2 + radius || circleDistanceY > size[1] / 2 + radius) {
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
	Bounds.rectRect = function (pos, size, pos2, size2) {
	  return !(pos[0] > pos2[0] + size2[0] || pos[0] + size[0] < pos2[0] || pos[1] > pos2[1] + size2[1] || pos[1] + size[1] < pos2[1]);
	};
	
	/**
	 * Random point in circle
	 */
	Bounds.randCircPoint = function (point, center, radius) {
	  Vec2.set(point, 0, Random.rand(0, radius));
	  Vec2.rotate(point, Random.rand(-Math.PI, Math.PI));
	  return Vec2.add(point, center);
	};
	
	/**
	 * Random point in rectangle
	 */
	Bounds.randRectPoint = function (point, pos, size) {
	  Vec2.set(point, Random.rand(0, size[0]), Random.rand(0, size[1]));
	  return Vec2.add(point, pos);
	};
	
	Component.create(Bounds, "bounds");
	
	/***
	 * Intersection line/rectangle
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
	 *
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
		return (cw > 0) ? true : cw < 0 ? false : true; // colinear
	}
	*/
	
	/**
	 * @class  Bounds.Debug
	 * Outlines the boundaries and angle of an entity.
	 * @extends Component
	 */
	function BoundsDebug() {
	  Component.call(this);
	  this.color = Color();
	}
	
	BoundsDebug.prototype = {
	  attributes: {
	    color: Color.gray,
	    opacity: 0.5,
	    fill: false
	  },
	
	  create: function (attributes) {
	    this.opacity = attributes.opacity;
	    this.fill = attributes.fill;
	  }
	};
	
	
	/*
	FIXME: Convert to sprite
	render = function(ctx) {
		var bounds = this.components.bounds;
		ctx.save();
		if (this.fill) {
			ctx.fillStyle = Color.rgba(this.color, this.opacity * 0.5);
		}
		ctx.strokeStyle = Color.rgba(this.color, this.opacity);
		ctx.lineWidth = 1;
		this.components.transform.applyMatrix(ctx);
		if (bounds.shape == 'circle') {
			ctx.beginPath();
			ctx.lineTo(0, bounds.radius);
			ctx.moveTo(0, 0);
			ctx.arc(0, 0, bounds.radius | 0, 0, Mathf.TAU);
			if (this.fill) {
				ctx.fill();
			}
			ctx.stroke();
		} else {
			var size = bounds._size;
			ctx.strokeRect(-size[0] / 2 | 0, -size[1] / 2 | 0, size[0] | 0, size[1] | 0);
			if (this.fill) {
				ctx.fillRect(-size[0] / 2 | 0, -size[1] / 2 | 0, size[0] | 0, size[1] | 0);
			}
		}
		ctx.restore();
	};
	*/
	
	Component.create(BoundsDebug, "boundsDebug");
	
	Bounds.Debug = BoundsDebug;
	
	module.exports = Bounds;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var Component = __webpack_require__(6);
	var Pool = __webpack_require__(14);
	var Vec2 = __webpack_require__(26);
	var Engine = __webpack_require__(8);
	
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
	function Collider() {
	  Component.call(this);
	  this.trigger = false;
	  this.include = null;
	  this.exclude = null;
	}
	
	Collider.prototype = {
	  attributes: {
	    trigger: false,
	    include: null,
	    exclude: null
	  }
	};
	
	var p = Vec2();
	var n = Vec2();
	var cache = Vec2();
	var pCache = Vec2();
	var nCache = Vec2();
	var triggerEvent = {};
	var collideEvent = {};
	
	Collider.simulate = function (dt) {
	  var colliders = this.pool.heap;
	  var i = colliders.length;
	  while (i--) {
	    var collider1 = colliders[i];
	    if (!collider1.enabled) {
	      continue;
	    }
	    var j = i;
	    while (j-- && collider1.enabled) {
	      var collider2 = colliders[j];
	      if (!collider2.enabled) {
	        continue;
	      }
	      var entity1 = collider1.entity;
	      var entity2 = collider2.entity;
	      var kinetic1 = entity1.components.kinetic;
	      var kinetic2 = entity2.components.kinetic;
	
	      if (kinetic1.sleeping && kinetic2.sleeping || collider1.include && !entity2.has(collider1.include) || collider2.include && !entity1.has(collider2.include) || collider1.exclude && entity2.has(collider1.exclude) || collider2.exclude && entity1.has(collider2.exclude)) {
	        continue;
	      }
	
	      var radius1 = entity1.components.bounds.radius;
	      var radius2 = entity2.components.bounds.radius;
	      var pos1 = entity1.components.transform.position;
	      var pos2 = entity2.components.transform.position;
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
	        entity1.emit("onTrigger", triggerEvent);
	
	        triggerEvent.entity = entity1;
	        entity2.emit("onTrigger", triggerEvent);
	        continue;
	      }
	
	      diff -= radiusSum;
	      var vel1 = kinetic1.velocity;
	      var vel2 = kinetic2.velocity;
	      var mass1 = kinetic1.mass || 1;
	      var mass2 = kinetic2.mass || 1;
	
	      if (diff < 0) {
	        Vec2.add(pos1, Vec2.scale(p, -diff * 2 * radius1 / radiusSum, cache));
	        Vec2.add(pos2, Vec2.scale(p, diff * 2 * radius2 / radiusSum, cache));
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
	
	      Vec2.add(Vec2.scale(p, vp1After, pCache), Vec2.scale(n, vn1, nCache), vel1);
	      Vec2.add(Vec2.scale(p, vp2After, pCache), Vec2.scale(n, vn2, nCache), vel2);
	
	      collideEvent.normal = n;
	      collideEvent.entity = entity2;
	      entity1.emit("onCollide", collideEvent);
	
	      collideEvent.entity = entity1;
	      entity2.emit("onCollide", collideEvent);
	    }
	  }
	};
	
	Component.create(Collider, "collider");
	
	module.exports = Collider;

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/**
	 * @module core/color
	 */
	
	var Mathf = __webpack_require__(23);
	var Random = __webpack_require__(24);
	var Tweens = __webpack_require__(25);
	
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
	    return new Float32Array([fromOrR, g, b, a != null ? a : 1]);
	  }
	  if (fromOrR != null) {
	    return new Float32Array([fromOrR[0], fromOrR[1], fromOrR[2], fromOrR[3] != null ? fromOrR[3] : 1]);
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
	Color.set = function (result, r, g, b, a) {
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
	Color.copy = function (result, b) {
	  result[0] = b[0];
	  result[1] = b[1];
	  result[2] = b[2];
	  result[3] = b[3];
	  return result;
	};
	
	Color.lerp = function (a, b, t, alpha, result) {
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
	
	Color.lerpList = function (result, list, t, ease) {
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
	
	Color.variant = function (a, t, result) {
	  t = Random.rand(-t, t);
	  return Color.lerp(a, t > 0 ? Color.white : Color.black, t, false, result);
	};
	
	Color.rgba = function (a, alpha) {
	  if (alpha == null) {
	    alpha = a[3];
	  }
	  if (alpha > 0.98) {
	    return "rgb(" + (a[0] | 0) + ", " + (a[1] | 0) + ", " + (a[2] | 0) + ")";
	  }
	  return "rgba(" + (a[0] | 0) + ", " + (a[1] | 0) + ", " + (a[2] | 0) + ", " + alpha + ")";
	};
	
	Color.defineProperty = function (cls, name) {
	  var prop = "_" + name;
	  Object.defineProperty(cls.prototype, name, {
	    get: function () {
	      return this[prop];
	    },
	    set: function (value) {
	      this[prop][0] = value[0];
	      this[prop][1] = value[1];
	      this[prop][2] = value[2];
	      this[prop][3] = value[3];
	    }
	  });
	  var copy = "copy" + name.charAt(0).toUpperCase() + name.slice(1);
	  cls.prototype[copy] = function (result) {
	    result[0] = this[prop][0];
	    result[1] = this[prop][1];
	    result[2] = this[prop][2];
	    result[3] = this[prop][3];
	  };
	};
	
	module.exports = Color;

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _prototypeProperties = function (child, staticProps, instanceProps) {
	  if (staticProps) Object.defineProperties(child, staticProps);
	  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
	};
	
	/** @flow */
	
	var Pool = __webpack_require__(14);
	var Entity = __webpack_require__(9);
	__webpack_require__(17);
	
	var ComponentMap = Pool.ComponentMap;
	
	var emptyEntity = new Entity();
	var emptyComponentMap = new ComponentMap();
	
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
	var Component = (function () {
	  function Component() {
	    this.uid = 0;
	    this.enabled = false;
	    this.allocated = false;
	    this.entity = emptyEntity;
	    this.parent = emptyEntity;
	    this.root = emptyEntity;
	    this.layer = 0;
	    this.components = emptyComponentMap;
	    this.eventRefs = [];
	  }
	
	  _prototypeProperties(Component, null, {
	    toString: {
	
	      /**
	       * Brief summary.
	       * @private
	       * @return {String}
	       */
	      value: function toString() {
	        return "Component " + this.type + "#" + this.uid + " [^ " + this.entity + "]";
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    },
	    allocate: {
	
	      /**
	       * Allocate Component overriding default attributes.
	       * @private
	       * @param {Object} attributes Attributes
	       * @return {Component}
	       */
	      value: function allocate(attributes) {
	        var entity = this.parent;
	        this.entity = entity;
	        var components = entity.components;
	        if (components[this.type] != null) {
	          throw new Error("Component " + this.type + " already allocated for this Entity");
	        }
	        components[this.type] = this;
	        this.components = components; // Bailout_Normal after setprop
	        entity.componentKeys.push(this.type);
	        this.create(attributes);
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    },
	    destroy: {
	
	      /**
	       * Destroy Component, removes it from {@link Entity}.
	       */
	      value: function destroy() {
	        this.enabled = false;
	        this.pool.destroy(this);
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    },
	    free: {
	      value: function free() {},
	      writable: true,
	      enumerable: true,
	      configurable: true
	    },
	    create: {
	      value: function create(attributes) {},
	      writable: true,
	      enumerable: true,
	      configurable: true
	    },
	    superFree: {
	
	      /**
	       * Free destroyed Component.
	       * @private
	       */
	      value: function superFree() {
	        if (!this.allocated) {
	          throw new Error("Entity already collected");
	        }
	        this.allocated = false;
	        this.free();
	        this.components[this.type] = null;
	        // Clear reference to entity.components
	        this.components = emptyComponentMap;
	        this.entity = emptyEntity;
	        this.root = emptyEntity;
	        this.parent = emptyEntity;
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    },
	    enable: {
	      value: function enable(state) {
	        if (state == null) {
	          state = !this.enabled;
	        }
	        this.entity.emit("onComponent" + (state ? "Enable" : "Disable"), this);
	        this.enabled = state;
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    }
	  });
	
	  return Component;
	})();
	
	Component.prototype.type = "component";
	
	Component.create = function (cls, type, attributeKeys) {
	  var prototype = cls.prototype;
	  // deprecated
	  if (attributeKeys != null) {
	    console.warn("Component.create with attributeKeys is deprecated!");
	    console.trace();
	    var attributes = prototype.attributes || (prototype.attributes = {});
	    attributeKeys.forEach(function (name) {
	      attributes[name] = prototype[name];
	    });
	  }
	  var descriptors = {};
	  Object.getOwnPropertyNames(prototype).forEach(function (name) {
	    descriptors[name] = Object.getOwnPropertyDescriptor(prototype, name);
	  });
	  if (type != null) {
	    descriptors.type = {
	      value: type
	    };
	  }
	  cls.prototype = Object.create(Component.prototype, descriptors);
	  cls.prototype.constructor = cls;
	  cls.prototype.pool = new Pool(cls);
	};
	
	module.exports = Component;
	// override me
	// override me

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	/** @flow weak */
	
	var Component = __webpack_require__(6);
	var Vec2 = __webpack_require__(26);
	var Engine = __webpack_require__(8);
	var Pool = __webpack_require__(14);
	
	var Console = function Console() {
	  Component.call(this);
	  this.css = "";
	  this.container = null;
	  this.graphStyle = false;
	  this.width = 0;
	  this.height = 0;
	  this.cap = 0;
	  this.resolution = 0;
	};
	
	Console.prototype = {
	  colors: ["#ddd", "#fff", "#ffc", "#fcc"],
	
	  sections: ["#ffff33", "#ff8533", "#2babd6", "#9d2bd6"],
	  // ['#fffa5b', '#ff945b', '#5bf4ff', '#bd5bff']
	
	  attributes: {
	    css: "",
	    container: null,
	    graphStyle: true,
	    width: 100,
	    height: 56,
	    cap: 50,
	    resolution: 0.2
	  },
	
	  create: function () {
	    this.nullify();
	
	    var wrapCss = "position: fixed;" + "transform: translateZ(0);" + "left: 0;" + "top: 0;" + "user-select: none;" + "overflow: hidden;" + "padding: 0;" + "width: " + this.width + "px;" + "color: #ccc;" + "background-color: rgba(0, 0, 0, 1);" + "outline: 1px solid rgba(128, 128, 128, 0.5);" + "font: 400 9px/20px Helvetica,Arial,sans-serif;" + "text-align: right;" + "text-shadow: 1px 1px 0 rgba(0, 0, 0, 1), 0 0 1px rgba(0, 0, 0, 1);" + "cursor: ns-resize;" + this.css;
	    var panelCss = "width: 50%;" + "overflow: hidden;" + "display: inline-block;" + "-moz-box-sizing: border-box;" + "-webkit-box-sizing: border-box;" + "box-sizing: border-box;" + "z-index: 2;";
	    var spanSmallCss = "display: inline-block;" + "width: 38%;" + "padding-right: 3px;" + "-moz-box-sizing: border-box;" + "-webkit-box-sizing: border-box;" + "box-sizing: border-box;";
	    var spanCss = spanSmallCss + "width: 62%;" + "font-weight: bold;" + "font-size: 12px;";
	
	    if (this.graphStyle) {
	      panelCss += "position: absolute;" + "top: 0;" + "left: 0;";
	    } else {
	      wrapCss += "height: 20px;";
	    }
	
	    var wrap = this.wrap = document.createElement("div");
	    wrap.id = "console";
	    wrap.style.cssText = wrapCss;
	
	    this.fpsSpan = document.createElement("span");
	    this.fpsSpan.style.cssText = spanCss;
	    this.fpsSpan.title = "FPS";
	    this.fpsSpan2 = document.createElement("span");
	    this.fpsSpan2.style.cssText = spanSmallCss;
	    this.tickSpan = document.createElement("span");
	    this.tickSpan.style.cssText = spanCss;
	    this.tickSpan.title = "MS per tick";
	    this.tickSpan2 = document.createElement("span");
	    this.tickSpan2.style.cssText = spanSmallCss;
	    this.fpsSpan2.title = this.tickSpan2.title = "± standard deviation";
	
	    var panel = document.createElement("span");
	    panel.style.cssText = panelCss;
	    panel.appendChild(this.fpsSpan);
	    panel.appendChild(this.fpsSpan2);
	    wrap.appendChild(panel);
	
	    panel = document.createElement("span");
	    panel.style.cssText = panelCss + "left: 50%;";
	    panel.appendChild(this.tickSpan);
	    panel.appendChild(this.tickSpan2);
	    wrap.appendChild(panel);
	
	    if (this.graphStyle) {
	      var rulerCss = "position: absolute;" + "left: 0;" + "width: 100%;" + "height: 1px;" + "background-color: rgba(128, 128, 128, 0.3);";
	
	      var ruler = document.createElement("span");
	      ruler.style.cssText = rulerCss + ("bottom: " + this.height * 0.66 + "px;");
	      wrap.appendChild(ruler);
	      ruler = document.createElement("span");
	      ruler.style.cssText = rulerCss + ("bottom: " + this.height * 0.33 + "px;");
	      wrap.appendChild(ruler);
	
	      this.graphSpan = document.createElement("div");
	      this.graphSpan.style.cssText = "height: " + this.height + "px;" + "z-index: 1;";
	      this.graphSpan.title = "Fixed Update + Update + Render + Lag";
	
	      var barCss = "width: 1px;" + "float: left;" + "margin-top: 0px;";
	      var sectionCss = "display: block;" + "height: 0px;";
	
	      var i = this.width;
	      while (i--) {
	        var bar = document.createElement("span");
	        bar.className = "console-bar";
	        bar.style.cssText = barCss;
	        var sections = this.sections;
	        for (var j = 0, l = sections.length; j < l; j++) {
	          var section = document.createElement("span");
	          section.className = "console-section";
	          section.style.cssText = sectionCss + "background-color: " + sections[j] + ";";
	          bar.appendChild(section);
	        }
	        this.graphSpan.appendChild(bar);
	      }
	      wrap.appendChild(this.graphSpan);
	    }
	
	    (this.container || document.body).appendChild(wrap);
	
	    this.lastClick = 0;
	    wrap.addEventListener("click", this);
	
	    this.maximized = ! ~(document.cookie || "").indexOf("console_max");
	    this.toggle();
	  },
	
	  handleEvent: function (evt) {
	    var time = evt.timeStamp;
	    if (time - this.lastClick < 500) {
	      this.destroy();
	    }
	    this.lastClick = time;
	    this.toggle();
	    return false;
	  },
	
	  toggle: function () {
	    if (!this.graphStyle) {
	      return;
	    }
	    var margin = 0;
	    var opacity = 1;
	    this.maximized = !this.maximized;
	    if (!this.maximized) {
	      opacity = 0.5;
	      margin = -this.height + 20;
	      document.cookie = "console_max=; expires=" + new Date().toGMTString();
	    } else {
	      document.cookie = "console_max=1";
	    }
	    var style = this.graphSpan.style;
	    style.marginTop = margin + "px";
	    style.opacity = opacity;
	  },
	
	  free: function () {
	    (this.container || document.body).removeChild(this.wrap);
	    this.wrap.removeEventListener("click", this);
	    this.wrap = null;
	    this.container = null;
	  },
	
	  onTimeEnd: function (samples) {
	    var dt = samples.dt;
	    if (!dt) {
	      return;
	    }
	    this.dtSum += dt;
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
	    if (this.dtSum >= this.resolution) {
	      this.renderGraph();
	    }
	  },
	
	  renderGraph: function () {
	    var colors = this.colors;
	    var tickMean = this.tickSum / this.frames;
	    var tickSD = Math.sqrt((this.tickSq - this.tickSum * this.tickSum / this.frames) / (this.frames - 1));
	
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
	
	    if (this.graphStyle) {
	      var bar = this.graphSpan.appendChild(this.graphSpan.firstChild);
	      var overall = 0;
	
	      var mag = Math.round(this.height * this.lagSum / this.frames / this.cap);
	      bar.children[0].style.height = mag + "px";
	      overall += mag;
	
	      mag = this.height * this.renderSum / this.frames / this.cap;
	      bar.children[1].style.height = mag + "px";
	      overall += mag;
	
	      mag = Math.round(this.height * this.updateSum / this.frames / this.cap);
	      bar.children[2].style.height = mag + "px";
	      overall += mag;
	
	      mag = Math.round(this.height * this.fixedUpdateSum / this.frames / this.cap);
	      bar.children[3].style.height = mag + "px";
	      overall += mag;
	
	      bar.style.marginTop = this.height - overall + "px";
	    }
	
	    var fpsMean = this.fpsSum / this.frames;
	    var fpsSD = Math.sqrt((this.fpsSq - this.fpsSum * this.fpsSum / this.frames) / (this.frames - 1));
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
	
	  nullify: function () {
	    this.dtSum = 0;
	    this.fpsSum = 0;
	    this.fpsSq = 0;
	    this.tickSum = 0;
	    this.tickSq = 0;
	    this.lagSum = 0;
	    this.lagSq = 0;
	    this.fixedUpdateSum = 0;
	    this.updateSum = 0;
	    this.renderSum = 0;
	    this.frames = 0;
	  }
	};
	
	Component.create(Console, "console");
	
	module.exports = Console;

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var Entity = __webpack_require__(9);
	var Pool = __webpack_require__(14);
	__webpack_require__(17);
	
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
	  this.time = 0;
	  this.lastTime = 0;
	  this.frame = 0;
	  this.tail = 0;
	  this.fdtEnabled = false;
	  this.fdt = 1 / 30;
	  this.dt = 1 / 60;
	  this.maxDt = 0.5;
	  this.maxFdt = this.fdt * 5;
	  this.scale = 1;
	  this.rfa = true;
	
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
	
	  this.tickBound = this.tick.bind(this);
	
	  this.element = null;
	  this.scene = null;
	}
	
	Engine.prototype = Object.create(Entity.prototype);
	
	Engine.prototype.type = "engine";
	
	Engine.prototype.init = function (element) {
	  this.element = element;
	
	  // Late require. TODO: Justify!
	  __webpack_require__(7);
	  this.createComponent("console");
	
	  __webpack_require__(10);
	  this.createComponent("input");
	};
	
	/**
	 * Set scene and start game loop
	 * @param {Entity} scene
	 * @param {Boolean} soft
	 */
	Engine.prototype.play = function (scene, soft) {
	  if (this.scene) {
	    this.emitAll("onSceneEnd", this.scene);
	    if (soft) {
	      this.scene.enable(false, true);
	    } else {
	      this.scene.destroy();
	    }
	  }
	  this.scene = scene;
	  this.emitAll("onSceneStart", scene);
	  this.start();
	};
	
	/**
	 * Start loop
	 */
	Engine.prototype.start = function () {
	  if (this.running) {
	    return;
	  }
	  this.running = true;
	  this.emitAll("onEngineStart");
	  raFrame(this.tickBound);
	};
	
	Engine.prototype.pause = function () {
	  if (!this.running) {
	    return;
	  }
	  this.emitAll("onEnginePause");
	  this.running = false;
	};
	
	/**
	 * Game loop tick, called by requestAnimationFrame
	 *
	 * @param {Number} time Delta time
	 */
	Engine.prototype.tick = function (time) {
	  // Time value in seconds
	  time = (time != null && time < 1000000000000 ? time : perf.now()) / 1000;
	  this.time = time;
	  // rfa here to be less error prone
	
	  var i = 0;
	  var l = 0;
	  var calls = [];
	  var debug = this.debug;
	  var samples = this.hasEvent("onTimeEnd") ? this.samples : null;
	  var pong = 0;
	
	  if (this.lastTime) {
	    var dt = time - this.lastTime;
	    if (dt > this.maxDt || dt <= 0) {
	      dt = this.dt;
	    } else if (dt > 0.01 && samples != null) {
	      samples.dt = dt;
	      var lag = time - samples.next;
	      if (lag > 0) {
	        samples.lag = lag * 1000;
	      }
	    }
	    this.dt = dt *= this.scale;
	    this.frame++;
	
	    if (debug.profile && !debug.profileFrom) {
	      debug.profileFrom = debug.profile;
	      console.profile("Frame " + debug.profileFrom);
	    }
	
	    var ping = samples != null ? perf.now() : 0;
	    var pingTick = ping;
	
	    // Invoke fixed updates
	    var fdt = this.fdtEnabled ? this.fdt : dt;
	    var tail = Math.min(this.tail + dt, this.maxFdt * this.scale);
	    while (tail >= fdt) {
	      tail -= fdt;
	      var fixedUpdates = Pool.calls.fixedUpdate;
	      for (i = 0, l = fixedUpdates.length; i < l; i++) {
	        if (fixedUpdates[i].enabled) {
	          fixedUpdates[i].fixedUpdate(fdt);
	        }
	      }
	      var simulates = Pool.calls.simulate;
	      for (i = 0, l = simulates.length; i < l; i++) {
	        if (simulates[i].enabled) {
	          simulates[i].simulate(fdt);
	        }
	      }
	    }
	    this.tail = tail;
	
	    if (samples != null) {
	      pong = perf.now();
	      samples.fixedUpdate = pong - ping;
	      ping = pong;
	    }
	
	    // Invoke update
	    var updates = Pool.calls.update;
	    for (i = 0, l = updates.length; i < l; i++) {
	      if (updates[i].enabled) {
	        updates[i].update(dt);
	      }
	    }
	
	    Pool.free();
	
	    // Invoke postUpdate
	    var postUpdates = Pool.calls.postUpdate;
	    for (i = 0, l = postUpdates.length; i < l; i++) {
	      if (postUpdates[i].enabled) {
	        postUpdates[i].postUpdate(dt);
	      }
	    }
	
	    if (samples != null) {
	      pong = perf.now();
	      samples.update = pong - ping;
	      ping = pong;
	    }
	
	    // Invoke preRender
	    var preRenders = Pool.calls.preRender;
	    for (i = 0, l = preRenders.length; i < l; i++) {
	      if (preRenders[i].enabled) {
	        preRenders[i].preRender(dt);
	      }
	    }
	
	    var ctx = this.renderer.save();
	    // Invoke render
	    var renders = Pool.calls.render;
	    for (i = 0, l = renders.length; i < l; i++) {
	      if (renders[i].enabled) {
	        renders[i].render(ctx);
	      }
	    }
	    this.renderer.restore();
	
	    if (samples != null) {
	      pong = perf.now();
	      samples.render = pong - ping;
	      samples.tick = pong - pingTick;
	    }
	
	    if (debug.step) {}
	
	    if (debug.profileFrom) {
	      if (! --debug.profile) {
	        console.profileEnd("Frame " + debug.profileFrom);
	        debug.profileFrom = 0;
	      }
	    }
	  }
	
	  this.lastTime = time;
	
	  if (samples != null) {
	    samples.next = Math.max(time + 1 / 60, perf.now() / 1000);
	    this.emit("onTimeEnd", samples);
	  }
	
	  if (this.running) {
	    if (this.rfa) {
	      raFrame(this.tickBound);
	    } else {
	      perf.nextTick(this.tickBound);
	    }
	  }
	};
	
	// Singleton
	var engine = new Engine();
	
	// Debugging hooks
	if ("console" in window) {
	  console.m = {
	    pool: function (flush) {
	      Pool.dump(flush);
	      return null;
	    },
	    profile: function (frames) {
	      if (frames == null) {
	        frames = 60;
	      }
	      engine.debug.profile = frames;
	      return null;
	    },
	    step: function () {
	      engine.debug.step = !engine.debug.step;
	      return null;
	    }
	  };
	}
	
	module.exports = engine;
	// debugger; // jshint ignore:line

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _prototypeProperties = function (child, staticProps, instanceProps) {
	  if (staticProps) Object.defineProperties(child, staticProps);
	  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
	};
	
	/** @flow */
	
	var Pool = __webpack_require__(14);
	var Mathf = __webpack_require__(23);
	var ComponentMap = Pool.ComponentMap;
	var Prefab = null;
	
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
	var Entity = (function () {
	  function Entity() {
	    this.type = "entity";
	    this.uid = 0;
	    this.enabled = false;
	    this.allocated = false;
	    this.layer = 0;
	    this.parent = null;
	    this.root = null;
	    this.components = new ComponentMap();
	    this.componentKeys = [];
	    this.events = {};
	    this.eventRefs = [];
	    this.prefab = "";
	    this.next = null;
	    this.firstChild = null;
	  }
	
	  _prototypeProperties(Entity, null, {
	    toString: {
	
	      /**
	       * Brief summary
	       * @private
	       * @return {String}
	       */
	      value: function toString() {
	        var comps = this.componentKeys.join(", ");
	        return "Entity #" + this.uid + " (" + comps + ") [^ " + this.parent + "]";
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    },
	    allocate: {
	
	      /**
	       * Allocates entity from component/attribute hash
	       * @private
	       * @param {Object} attributes List of components and their attributes
	       * @return {Entity}
	       */
	      value: function allocate(attributes) {
	        var parent = this.parent;
	        if (parent != null) {
	          var last = parent.lastChild;
	          if (last != null) {
	            last.next = this;
	          } else {
	            parent.firstChild = this;
	          }
	        }
	        this.prefab = "";
	        if (attributes != null) {
	          for (var type in attributes) {
	            this.createComponent(type, attributes[type]);
	          }
	        }
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    },
	    createComponent: {
	
	      /**
	       * Add {@link Component} to Entity
	       * @param {String} type Component type
	       * @param  {Object} attributes (optional) Override component attributes
	       * @return {Component}
	       */
	      value: function createComponent(type, attributes) {
	        var pool = Pool.byType[type];
	        if (pool == null) {
	          throw new Error("Unknown component \"" + type + "\". " + this);
	        }
	        return pool.allocate(this, attributes);
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    },
	    createChild: {
	
	      /**
	       * Add new Entity as child
	       * @param {String|Object} prefabId {@link Prefab} ID or prefab attribute object
	       * @param {Object} attributes (optional) Override {@link Prefab} attributes
	       * @return {Entity}
	       */
	      value: function createChild(prefabId, attributes) {
	        if (typeof prefabId == "string") {
	          if (Prefab == null) {
	            // Interdependent modules :(
	            Prefab = __webpack_require__(15);
	          }
	          return Prefab.create(prefabId, this, attributes);
	        }
	        return Entity.create(this, prefabId);
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    },
	    has: {
	
	      /**
	       * Match Entity against a list of {@link Component} types.
	       * @param {Array|String} selector {@link Component} type(s)
	       * @return {Boolean}
	       */
	      value: function has(selector) {
	        var components = this.components;
	        if (Array.isArray(selector)) {
	          for (var i = 0, l = selector.length; i < l; i++) {
	            if (components[selector[i]]) {
	              return true;
	            }
	          }
	        } else if (components[selector] != null) {
	          return true;
	        }
	        return false;
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    },
	    lastChild: {
	      get: function () {
	        var previous = this.firstChild;
	        if (previous != null) {
	          while (previous.next != null) {
	            previous = previous.next;
	          }
	        }
	        return previous;
	      },
	      enumerable: true,
	      configurable: true
	    },
	    destroy: {
	
	      /**
	       * Destroy Entity, including children and components.
	       */
	      value: function destroy() {
	        this.enabled = false;
	        this.pool.destroy(this);
	        var keys = this.componentKeys;
	        for (var i = 0, l = keys.length; i < l; i++) {
	          var key = keys[i];
	          if (this.components[key] != null) {
	            this.components[key].destroy();
	          }
	        }
	        keys.length = 0;
	        var child = this.firstChild;
	        while (child) {
	          child.destroy();
	          child = child.next;
	        }
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    },
	    removeChild: {
	      value: function removeChild(needle) {
	        var child = this.firstChild;
	        var prev = null;
	        while (child) {
	          if (child == needle) {
	            if (prev == null) {
	              this.firstChild = child.next;
	            } else {
	              prev.next = child.next;
	            }
	            child.next = null;
	            child.parent = null;
	            return true;
	          }
	          prev = child;
	          child = child.next;
	        }
	        return false;
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    },
	    superFree: {
	
	      /**
	       * Free destroyed Entity.
	       * @private
	       */
	      value: function superFree() {
	        // Remove referenced subscribers
	        var refs = this.eventRefs;
	        for (var i = 0, l = refs.length; i < l; i++) {
	          refs[i].off(this);
	        }
	        refs.length = 0;
	        // Remove own subscribers
	        var events = this.events;
	        for (var event in events) {
	          events[event].length = 0;
	        }
	
	        // Eager deallocate
	        var child = this.firstChild;
	        this.firstChild = null;
	        var next = null;
	        while (child != null) {
	          next = child.next;
	          child.next = null;
	          child = next;
	        }
	
	        var parent = this.parent;
	        if (parent != null) {
	          parent.removeChild(this);
	        }
	        this.allocated = false;
	        this.root = null;
	        this.parent = null;
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    },
	    enable: {
	      value: function enable(state, deep) {
	        if (state == null) {
	          state = !this.enabled;
	        }
	        this.emit(state ? "onEnable" : "onDisable", this);
	        this.enabled = state;
	        var keys = this.componentKeys;
	        for (var i = 0, l = keys.length; i < l; i++) {
	          var key = keys[i];
	          if (this.components[key] != null) {
	            this.components[key].enable(state, true);
	          }
	        }
	        if (deep) {
	          var child = this.firstChild;
	          while (child != null) {
	            child.enable(state, true);
	            child = child.next;
	          }
	        }
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    },
	    hasEvent: {
	
	      /**
	       * Has subscriber
	       * @param {String} event Event name to eventscribe to 'on*'
	       */
	      value: function hasEvent(name) {
	        var events = this.events[name];
	        return events && events.length > 0;
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    },
	    on: {
	
	      /**
	       * Subscribe to event messages
	       * @param {Entity|null} scope Target Entity for eventscription
	       * @param {String} name Event name to eventscribe to 'on*'
	       * @param {String} method (optional) Local method name to call, defaults to event name
	       */
	      value: function on(scope, name, method) {
	        if (scope == null) {
	          scope = this;
	        }
	        var events = this.events;
	        var items = events[name] || (events[name] = []);
	        items.push(scope, method);
	        if (scope != this) {
	          scope.eventRefs.push(this);
	        }
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    },
	    emit: {
	
	      /**
	       * Publish a event message only for this entity
	       * @param {String} event
	       * @param {Object|null} payload Argument(s)
	       */
	      value: function emit(name, payload) {
	        var items = this.events[name];
	        if (items != null) {
	          var i = items.length;
	          while ((i -= 2) >= 0) {
	            if (items[i] != null && items[i].enabled) {
	              items[i][items[i + 1] || name](payload);
	            }
	          }
	        }
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    },
	    emitUp: {
	
	      /**
	       * Publish a event message for this entity and it's parents
	       * @param {String} event
	       * @param {Object|null} payload Argument(s)
	       */
	      value: function emitUp(name, payload) {
	        var entity = this;
	        do {
	          if (entity.enabled) {
	            entity.emit(name, payload);
	          }
	          entity = entity.parent;
	        } while (entity);
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    },
	    emitAll: {
	
	      /**
	       * Publish a event message for all subscribed entities
	       * @param {String} name
	       * @param {Object|null} payload Argument(s)
	       */
	      value: function emitAll(name, payload) {
	        Pool.call(name, payload);
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    },
	    off: {
	
	      /**
	       * Unsubscribe scope from event
	       * @param {Entity|Component} unscope (optional) Subscriber scope to remove
	       * @param {String|null} needle (optional) Event to remove
	       */
	      value: function off(unscope, needle) {
	        var events = this.events;
	        var i = 0;
	        for (var name in events) {
	          if (needle != null && needle === name) {
	            continue;
	          }
	          var items = events[name];
	          if (items == null || !(i = items.length)) {
	            continue;
	          }
	          var length = i / 2;
	          while ((i -= 2) >= 0) {
	            if (items[i] != null && (!unscope || unscope === items[i])) {
	              items[i] = null;
	              length--;
	            }
	          }
	          if (length === 0) {
	            items.length = 0;
	          }
	        }
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    }
	  });
	
	  return Entity;
	})();
	
	Entity.create = function (parent, attributes) {
	  return Entity.pool.allocate(parent, attributes);
	};
	
	Entity.prototype.pool = new Pool(Entity);
	
	module.exports = Entity;
	// {[key:string]: Array<Entity|string>};

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var Component = __webpack_require__(6);
	var Pool = __webpack_require__(14);
	var Vec2 = __webpack_require__(26);
	var Engine = __webpack_require__(8);
	
	/**
	 * @class Input
	 * Input handling for mouse, touch, keyboard and hardware sensors
	 *
	 * @extends Component
	 */
	function Input() {
	  Component.call(this);
	  this.queue = [];
	  this.locks = {};
	  this.position = Vec2();
	  this.lastPos = Vec2();
	  this.touchState = "";
	  this.axis = Vec2();
	  this.mouseAxis = Vec2();
	  this.orientation = Vec2();
	  this.lastOrientation = Vec2();
	  this.baseOrientation = Vec2();
	
	  this.map = {
	    32: "space",
	    192: "debug",
	    38: "up",
	    87: "up",
	    39: "right",
	    68: "right",
	    40: "bottom",
	    83: "bottom",
	    37: "left",
	    65: "left",
	    219: "squareLeft",
	    221: "squareRight"
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
	    if (! ~this.keyNames.indexOf(key)) {
	      this.keyNames.push(key);
	      this.keys[key] = null;
	    }
	  }
	
	  this.throttled = {
	    mousemove: true,
	    deviceorientation: true
	  };
	
	  this.lastEvent = "";
	  this.attached = false;
	
	  this.events = this.support.touch ? {
	    touchstart: "startTouch",
	    touchmove: "moveTouch",
	    touchend: "endTouch",
	    touchcancel: "endTouch"
	  } : {
	    mousedown: "startTouch",
	    mousemove: "moveTouch",
	    mouseup: "endTouch",
	    keydown: "keyStart",
	    keyup: "keyEnd"
	  };
	
	  this.events.blur = "blur";
	  this.events.deviceorientation = "deviceOrientation";
	}
	
	Input.prototype = Object.create(Component.prototype);
	
	Input.prototype.type = "input";
	
	Input.prototype.attach = function () {
	  if (this.attached) {
	    return;
	  }
	  this.attached = true;
	  for (var type in this.events) {
	    window.addEventListener(type, this, false);
	  }
	  this.queue.length = 0;
	};
	
	Input.prototype.detach = function () {
	  if (!this.attached) {
	    return;
	  }
	  this.attached = false;
	  for (var type in this.events) {
	    window.removeEventListener(type, this, false);
	  }
	};
	
	Input.prototype.support = {
	  touch: "ontouchstart" in window,
	  orientation: "ondeviceorientation" in window
	};
	
	Input.prototype.handleEvent = function (event) {
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
	};
	
	Input.prototype.keyStart = function (event) {
	  var key = this.map[event.keyCode];
	  if (key && !this.keys[key]) {
	    if (!this.lock("key-" + key)) {
	      return false;
	    }
	    this.keys[key] = "began";
	    this.updateAxis(key);
	    Engine.emit("onKeyBegan", key);
	  }
	};
	
	Input.prototype.keyEnd = function (event) {
	  var key = this.map[event.keyCode];
	  if (key) {
	    if (!this.lock("key-" + key)) {
	      return false;
	    }
	    this.keys[key] = "ended";
	    this.updateAxis(key, true);
	    Engine.emit("onKeyEnded", key);
	  }
	};
	
	Input.prototype.startTouch = function (event) {
	  if (!this.lock("touch")) {
	    return false;
	  }
	  this.resolve(event);
	  if (!this.touchState && !event.metaKey) {
	    this.touchState = "began";
	    Engine.emit("onTouchBegan");
	  }
	};
	
	Input.prototype.moveTouch = function (event) {
	  var state = this.touchState;
	  if ((state === "began" || state === "ended") && !this.lock("touch")) {
	    return false;
	  }
	  this.resolve(event);
	  if (state && state !== "ended" && state !== "moved") {
	    this.touchState = "moved";
	  }
	};
	
	Input.prototype.endTouch = function (event) {
	  if (!this.lock("touch")) {
	    return false;
	  }
	  this.resolve(event);
	  if (this.touchState && (!this.support.touch || !event.targetTouches.length)) {
	    Engine.emit("onTouchEnded");
	    this.touchState = "ended";
	  }
	};
	
	Input.prototype.updateAxis = function (key, ended) {
	  var axis = this.axisMap[key];
	  if (axis) {
	    if (ended) {
	      this.axis[axis[0]] -= axis[1];
	    } else {
	      this.axis[axis[0]] += axis[1];
	    }
	  }
	};
	
	Input.prototype.blur = function () {
	  if (this.touchState && this.touchState !== "ended") {
	    this.touchState = "ended";
	  }
	  var keys = this.keys;
	  var names = this.keyNames;
	  for (var i = 0, l = names.length; i < l; i++) {
	    var key = names[i];
	    if (keys[key] && keys[key] !== "ended") {
	      keys[key] = "ended";
	      this.updateAxis(key, true);
	    }
	  }
	};
	
	Input.prototype.calibrateOrientation = function () {
	  this.baseOrientationTime = this.orientationTime;
	  Vec2.copy(this.baseOrientation, this.orientation);
	  Vec2.set(this.orientation);
	};
	
	Input.prototype.deviceOrientation = function (event) {
	  Vec2.copy(this.lastOrientation, this.orientation);
	  Vec2.sub(Vec2.set(this.orientation, event.gamma | 0, event.beta | 0), this.baseOrientation);
	  this.orientationTime = event.timeStamp / 1000;
	  if (!this.baseOrientationTime) {
	    this.calibrateOrientation();
	  }
	};
	
	Input.prototype.resolve = function (event) {
	  var coords = this.support.touch ? event.targetTouches[0] : event;
	  if (coords) {
	    this.lastTime = this.time;
	    this.time = event.timeStamp / 1000;
	    Vec2.copy(this.lastPos, this.position);
	    var renderer = Engine.renderer;
	    Vec2.set(this.position, (coords.pageX - renderer.margin[0]) / renderer.scale | 0, (coords.pageY - renderer.margin[1]) / renderer.scale | 0);
	  }
	};
	
	Input.prototype.lock = function (key) {
	  if (this.locks[key] === this.frame) {
	    return false;
	  }
	  this.locks[key] = this.frame;
	  return true;
	};
	
	Input.prototype.postUpdate = function () {
	  switch (this.touchState) {
	    case "began":
	      this.touchState = "stationary";
	      break;
	    case "ended":
	      this.touchState = null;
	      break;
	  }
	
	  var keys = this.keys;
	  var names = this.keyNames;
	  for (var i = 0, l = names.length; i < l; i++) {
	    var key = names[i];
	    switch (keys[key]) {
	      case "began":
	        keys[key] = "pressed";
	        break;
	      case "ended":
	        keys[key] = null;
	        break;
	    }
	  }
	
	  this.frame = Engine.frame;
	
	  var event = null;
	  var queue = this.queue;
	  while (event = queue[0]) {
	    var type = event.type;
	    if (this[this.events[type] || type](event) != null) {
	      break;
	    }
	    queue.shift();
	  }
	  if (!queue.length) {
	    this.lastEvent = "";
	  }
	};
	
	Input.prototype.onEnginePause = function () {
	  this.detach();
	};
	
	Input.prototype.onEngineStart = function () {
	  this.attach();
	};

	Input.prototype.pool = new Pool(Input);

	module.exports = Input;

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var Component = __webpack_require__(6);
	var Pool = __webpack_require__(14);
	var Vec2 = __webpack_require__(26);
	var Random = __webpack_require__(24);
	
	function Jitter() {
	  Component.call(this);
	  this.factor = 0;
	  this.force = 0;
	}
	
	Jitter.prototype = Object.create(Component.prototype);
	
	Jitter.prototype.type = "jitter";
	
	Jitter.prototype.attributes = {
	  factor: 0.1,
	  force: 250
	};
	
	var force = Vec2();
	
	Jitter.prototype.fixedUpdate = function (dt) {
	  if (Random.chance(this.factor)) {
	    Vec2.variant(Vec2.zero, this.force, force);
	    this.components.kinetic.applyForce(force);
	  }
	};

	Jitter.prototype.pool = new Pool(Jitter);

	module.exports = Jitter;

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	/** @flow weak */
	/**
	 * @module core/kinetic
	 */
	
	var Component = __webpack_require__(6);
	var Pool = __webpack_require__(14);
	var Mathf = __webpack_require__(23);
	var Vec2 = __webpack_require__(26);
	
	/**
	 * @class Kinetic
	 * Velocity integrator
	 *
	 * Related links:
	 * http://hg.positiontspectacular.com/toxiclibs/src/689ddcd9bea3/src.physics/toxi/physics2d
	 * @extends Component
	 */
	function Kinetic() {
	  Component.call(this);
	  this.mass = 0;
	  this.drag = 0;
	  this.friction = 0;
	  this.fixed = false;
	  this.maxVelocity = 0;
	  this.maxForce = 0;
	  this.minVelocity = 0;
	  this.angularVelocity = 0;
	  this.torque = 0;
	  this.continuousTorque = 0;
	  this.angularDrag = 0;
	  this.angularFriction = 0;
	  this.angularFixed = false;
	  this.maxAngularVelocity = 0;
	  this.maxAngularForce = 0;
	  this.minAngularVelocity = 0;
	  this.fast = false;
	
	  this._velocity = Vec2();
	  this._force = Vec2();
	  this._continuousForce = Vec2();
	  this.sleeping = false;
	}
	
	Kinetic.gravity = Vec2();
	
	Kinetic.prototype = Object.defineProperties({
	  attributes: {
	    mass: 1,
	    velocity: Vec2(),
	    force: Vec2(),
	    continuousForce: Vec2(),
	    drag: 0.999,
	    friction: 15,
	    fixed: false,
	    maxVelocity: 75,
	    maxForce: 2000,
	    minVelocity: 1,
	    angularVelocity: 0,
	    torque: 0,
	    continuousTorque: 0,
	    angularDrag: 0.999,
	    angularFriction: 1,
	    angularFixed: false,
	    maxAngularVelocity: 0,
	    maxAngularForce: 0,
	    minAngularVelocity: Mathf.TAU / 360,
	    fast: false
	  },
	
	  create: function () {
	    this.sleeping = false;
	  },
	
	  applyForce: function (impulse, ignoreMass, continues) {
	    Vec2.add(continues ? this._continuousForce : this._force, !ignoreMass && this.mass !== 1 ? Vec2.scale(impulse, 1 / (this.mass || 1), cache) : impulse);
	  },
	
	  applyTorque: function (impulse, ignoreMass, continues) {
	    Vec2.add(continues ? this._continuousForce : this._force, !ignoreMass && this.mass !== 1 ? Vec2.scale(impulse, 1 / (this.mass || 1), cache) : impulse);
	  }
	}, {
	  direction: {
	    get: function () {
	      return Vec2.rad(this._velocity);
	    },
	    set: function (rad) {
	      Vec2.rotateTo(this._velocity, rad);
	    },
	    enumerable: true,
	    configurable: true
	  },
	  speed: {
	    get: function () {
	      return Vec2.len(this._velocity);
	    },
	    set: function (length) {
	      Vec2.norm(this._velocity, null, length);
	    },
	    enumerable: true,
	    configurable: true
	  }
	});
	
	Vec2.defineProperty(Kinetic, "velocity");
	Vec2.defineProperty(Kinetic, "force");
	Vec2.defineProperty(Kinetic, "continuousForce");
	
	var velocity = Vec2();
	var force = Vec2();
	var velocityCache = Vec2();
	var forceCache = Vec2();
	var cache = Vec2();
	
	Kinetic.simulate = function (dt) {
	  var dtSq = dt * dt;
	  var kinetics = this.pool.heap;
	  for (var i = 0, l = kinetics.length; i < l; i++) {
	    var kinetic = kinetics[i];
	    if (!kinetic.enabled || kinetic.fixed) {
	      continue;
	    }
	    var transform = kinetic.components.transform;
	    Vec2.copy(velocity, kinetic._velocity);
	    Vec2.add(kinetic._force, kinetic._continuousForce, force);
	
	    // Fast path (no mass)
	    if (kinetic.fast) {
	      if (kinetic.maxForce > 0) {
	        Vec2.limit(force, kinetic.maxForce);
	      }
	      Vec2.add(velocity, Vec2.scale(force, dt));
	      if (kinetic.maxVelocity > 0) {
	        Vec2.limit(velocity, kinetic.maxVelocity);
	      }
	      kinetic.force = Vec2.zero;
	      kinetic.velocity = velocity;
	      transform.translateBy(Vec2.scale(velocity, dt));
	      continue;
	    }
	
	    // Apply scene gravity
	    var gravity = kinetic.root.gravity || Kinetic.gravity;
	    if (Vec2.lenSq(gravity) > 0 && kinetic.mass > Mathf.EPSILON) {
	      Vec2.add(force, kinetic.mass !== 1 ? Vec2.scale(gravity, 1 / kinetic.mass, cache) : gravity);
	    }
	
	    // Apply friction
	    if (kinetic.friction > 0) {
	      Vec2.add(force, Vec2.scale(Vec2.norm(velocity, cache), -kinetic.friction));
	    }
	
	    if (kinetic.maxForce > 0) {
	      Vec2.limit(force, kinetic.maxForce);
	    }
	
	    /*
	    // http://www.compsoc.man.ac.uk/~lucky/Democritus/Theory/verlet.html#velver
	    // http://en.wikipedia.org/wiki/Verlet_integration#Velocity_Verlet
	    var lastForce = Vec2.scale(kinetic.lastForce, dt / 2);
	    */
	
	    Vec2.add(Vec2.add(transform.position, Vec2.scale(velocity, dt, velocityCache)), Vec2.scale(force, 0.5 * dtSq, forceCache));
	    // transform.markDirty();
	
	    Vec2.add(velocity, Vec2.scale(force, dt, forceCache));
	
	    // Apply drag
	    if (kinetic.drag < 1) {
	      Vec2.scale(velocity, kinetic.drag);
	    }
	
	    // Limit velocity
	    if (kinetic.maxVelocity > 0) {
	      Vec2.limit(velocity, kinetic.maxVelocity);
	    }
	
	    var minVelocity = kinetic.minVelocity;
	    if (minVelocity > 0) {
	      if (Vec2.lenSq(velocity) <= minVelocity * minVelocity) {
	        if (!kinetic.sleeping) {
	          Vec2.set(velocity);
	          kinetic.sleeping = true;
	          kinetic.entity.emitUp("onKineticSleep", kinetic);
	        }
	      } else {
	        if (kinetic.sleeping) {
	          kinetic.sleeping = false;
	          kinetic.entity.emitUp("onKineticWake", kinetic);
	        }
	      }
	    }
	
	    // Reset force
	    kinetic.force = Vec2.zero;
	    kinetic.velocity = velocity;
	  }
	};
	
	Component.create(Kinetic, "kinetic");
	
	module.exports = Kinetic;

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var Entity = __webpack_require__(9);
	var Prefab = __webpack_require__(15);
	var Component = __webpack_require__(6);
	var Pool = __webpack_require__(14);
	var Engine = __webpack_require__(8);
	var Mathf = __webpack_require__(23);
	var Vec2 = __webpack_require__(26);
	var Random = __webpack_require__(24);
	var Tweens = __webpack_require__(25);
	var Color = __webpack_require__(5);
	var Sprite = __webpack_require__(18);
	__webpack_require__(19);
	__webpack_require__(12);
	
	function Particle() {
	  Component.call(this);
	  this.lifetime = 0;
	  this.lifetimeVariant = 0;
	  this.radius = 0;
	  this.radiusVariant = 0;
	  this.alphaVariant = 0;
	  this.shrink = Tweens.linear;
	  this.fade = Tweens.linear;
	  this.age = 0;
	}
	
	Particle.prototype = {
	  attributes: {
	    lifetime: 1,
	    lifetimeVariant: 1,
	    radius: 1,
	    radiusVariant: 0,
	    alphaVariant: 0,
	    shrink: Tweens.quintIn,
	    fade: Tweens.quintIn
	  },
	
	  create: function (attributes) {
	    var variant = this.lifetimeVariant;
	    if (variant > 0) {
	      this.lifetime += Random.rand(-variant, variant);
	    }
	    variant = this.radiusVariant;
	    if (variant > 0) {
	      this.radius += Random.rand(-variant, variant);
	    }
	    variant = this.alphaVariant;
	    if (variant > 0) {
	      var transform = this.components.transform;
	      transform.alpha = Mathf.clamp(transform.alpha + Random.rand(-variant, variant), 0, 1);
	    }
	    this.age = 0;
	  },
	
	  update: function (dt) {
	    this.age += dt;
	    var age = this.age;
	    var lifetime = this.lifetime;
	    if (age > lifetime) {
	      this.entity.destroy();
	      return;
	    }
	    if (this.shrink) {
	      this.radius *= 1 - this.shrink(age / lifetime);
	      if (this.radius < 1) {
	        this.entity.destroy();
	        return;
	      }
	    }
	    if (this.fade) {
	      var transform = this.components.transform;
	      transform.alpha *= 1 - this.fade(age / lifetime);
	      if (transform.alpha <= 0.02) {
	        this.entity.destroy();
	        return;
	      }
	    }
	    this.components.spriteTween.frame = this.radius - 1 | 0;
	  }
	};
	
	Particle.generateSpriteAsset = function (attributes) {
	  attributes = attributes || {};
	  var color = Color(attributes.color || Color.gray);
	  var alpha = attributes.alpha || 1;
	  var max = attributes.max = attributes.max || 25;
	  var size = max * 2;
	  var center = attributes.center || 0.5;
	  var shape = attributes.shape || "circle";
	
	  return new Sprite.Asset(function (ctx) {
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
	
	      if (shape == "rect") {
	        ctx.fillRect(max - radius / 2 | 0, top - radius / 2, radius, radius);
	      } else {
	        ctx.beginPath();
	        ctx.arc(max, top, radius, 0, Mathf.TAU, true);
	        ctx.closePath();
	        ctx.fill();
	      }
	    }
	  }, Vec2(size, size * max));
	};
	
	Particle.generateSpriteSheet = function (attributes) {
	  attributes = attributes || {};
	  var sprite = Particle.generateSpriteAsset(attributes);
	  var size = attributes.max * 2;
	  return new Sprite.Sheet({
	    size: Vec2(size, size),
	    sprites: sprite
	  });
	};
	
	Particle.defaultSpriteSheet = Particle.generateSpriteSheet();
	
	Component.create(Particle, "particle");
	
	Particle.Prefab = new Prefab("particle", {
	  transform: null,
	  kinetic: {
	    mass: 0,
	    fast: true
	  },
	  particle: null,
	  spriteTween: {
	    asset: Particle.defaultSpriteSheet
	  }
	});
	
	module.exports = Particle;

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _prototypeProperties = function (child, staticProps, instanceProps) {
	  if (staticProps) Object.defineProperties(child, staticProps);
	  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
	};
	
	/* @flow weak */
	
	var Mathf = __webpack_require__(23);
	__webpack_require__(17);
	
	// BasePoolable & {
	// 	attributes: ?Object;
	// } & {[key:string]: (payload:any) => void};
	
	// BasePoolable & {
	// 	on: (scope:?Entity, name:string, method:?string) => void;
	// }
	
	// EntityLike | ComponentLike;
	
	/**
	 * Pool
	 * @class
	 * @param {Object} cls Class to pool
	 */
	var Pool = (function () {
	  function Pool(cls) {
	    this.cls = cls;
	    cls.pool = this;
	    cls.enabled = false;
	    var proto = cls.prototype;
	    proto.pool = this;
	    this.heap = [];
	    this.enabled = false;
	    this.allocated = 0;
	    var type = proto.type;
	    this.type = type;
	    if (Pool.byType[type] != null) {
	      console.warn("Pool \"%s\" was overridden with ", type, cls);
	    }
	    Pool.byType[type] = this;
	
	    this.layer = 0;
	    this.events = [];
	    this.calls = [];
	    this.attributes = {};
	    this.attributeKeys = [];
	
	    this.isComponent = type != "entity";
	    if (this.isComponent) {
	      var attributes = proto.attributes;
	      if (attributes != null) {
	        this.attributes = attributes;
	        this.attributeKeys = Object.keys(attributes);
	      }
	      var types = Pool.typedCalls;
	      var keys = Object.keys(proto).concat(Object.keys(cls));
	      var fn = "";
	      for (var i = 0, l = keys.length; i < l; i++) {
	        fn = keys[i];
	        if (callRegex.test(fn)) {
	          if (! ~types.indexOf(fn)) {
	            types.push(fn);
	            Pool.calls[fn] = [];
	          }
	          this.events.push(fn);
	        }
	      }
	      for (i = 0, l = types.length; i < l; i++) {
	        fn = types[i];
	        if (cls[fn] != null) {
	          Pool.calls[fn].push(cls);
	        } else if (proto[fn] != null) {
	          this.calls.push(fn);
	        }
	      }
	      ComponentMap.prototype[type] = null;
	    }
	  }
	
	  _prototypeProperties(Pool, null, {
	    toString: {
	
	      /**
	       * Brief summary.
	       *
	       * @return {String}
	       */
	      value: function toString() {
	        return "Pool " + this.type + " [" + this.allocated + "/" + this.heap.length + "]";
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    },
	    pushInstance: {
	      value: function pushInstance() {
	        var entity = new this.cls();
	        this.heap.push(entity);
	        // Register entity callbacks
	        var calls = this.calls;
	        for (var i = 0, l = calls.length; i < l; i++) {
	          Pool.calls[calls[i]].push(entity);
	        }
	        return entity;
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    },
	    popInstance: {
	      value: function popInstance() {
	        var heap = this.heap;
	        var l = heap.length;
	        if (this.allocated == l) {
	          return this.pushInstance();
	        }
	        for (var i = 0; i < l; i++) {
	          if (!heap[i].allocated) {
	            return heap[i];
	          }
	        }
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    },
	    allocate: {
	
	      /**
	       * Allocate a new instance from free pool or by creating. The provided attributes are merged with the default attributes.
	       * @param {Entity} parent (optional) Parent class
	       * @param {Object} attributes (optional) Attributes object
	       * @return {Object}
	       */
	      value: function allocate(parent, attributes) {
	        // Get free or create new entity
	        var entity = this.popInstance();
	        this.allocated++;
	        this.enabled = true;
	        this.cls.enabled = true;
	        var uid = Mathf.uid();
	        entity.uid = uid;
	        entity.enabled = true;
	        entity.allocated = true;
	        entity.parent = parent;
	        entity.root = parent != null ? parent.root || parent : null;
	        // Set layer, combined from parent layer, pool layer and uid
	        entity.layer = (parent != null ? parent.layer : 0) + this.layer + 2 - 1 / uid;
	
	        if (this.isComponent) {
	          var i = 0;
	          var defaults = this.attributes;
	          var keys = this.attributeKeys;
	          var l = keys.length;
	          if (l > 0) {
	            if (attributes == null) {
	              for (i = 0; i < l; i++) {
	                entity[keys[i]] = defaults[keys[i]];
	              }
	            } else {
	              for (i = 0; i < l; i++) {
	                var key = keys[i];
	                if (Pool.verbose) {
	                  if (this.allocated == 1 && !(key in entity)) {
	                    console.warn("Component \"%s\" did not pre-allocate have attribute \"%s\"", this.type, key);
	                  }
	                }
	                entity[key] = attributes[key] !== undefined ? attributes[key] : defaults[key];
	              }
	            }
	          }
	
	          // Add events
	          var events = this.events;
	          for (i = 0, l = events.length; i < l; i++) {
	            parent.on(entity, events[i], events[i]);
	          }
	        }
	        if (entity.allocate != null) {
	          entity.allocate(attributes);
	        }
	        return entity;
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    },
	    destroy: {
	
	      /**
	       * Destroy given instance.
	       * @param {Object} entity Pooled object
	       */
	      value: function destroy(entity) {
	        Pool.calls.free.push(entity);
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    },
	    free: {
	
	      /**
	       * Free destroyed object.
	       * @param {Object} entity Pooled object
	       */
	      value: function free(entity) {
	        var allocated = this.allocated--;
	        this.enabled = !!allocated;
	        this.cls.enabled = !!allocated;
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    },
	    call: {
	
	      /**
	       * Invoke method on all enabled pooled object instances.
	       * @param {String} fn Method name
	       * @param {Mixed} payload (optional) Argument(s)
	       */
	      value: function call(fn, payload) {
	        var heap = this.heap;
	        var i = this.heap.length;
	        while (i--) {
	          if (heap[i].enabled) {
	            heap[i][fn](payload);
	          }
	        }
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    }
	  });
	
	  return Pool;
	})();
	
	Pool.verbose = false;
	
	Pool.calls = {};
	Pool.typedCalls = ["fixedUpdate", "simulate", "update", "postUpdate", "preRender", "render"];
	var callRegex = /^on[A-Z]/;
	
	// Create call array
	Pool.reset = function () {
	  Pool.calls = {
	    free: []
	  };
	  for (var i = 0, l = Pool.typedCalls.length; i < l; i++) {
	    Pool.calls[Pool.typedCalls[i]] = [];
	  }
	  Pool.byType = {};
	};
	
	Pool.reset();
	
	/**
	 * Dump debugging details and optionally flush freed objects.
	 *
	 * @param {Boolean} flush (optional) Flush after debug.
	 */
	Pool.dump = function (flush) {
	  var byType = Pool.byType;
	  for (var type in byType) {
	    var pool = byType[type];
	    console.log("%s: %d/%d in use", type, pool.allocated, pool.heap.length);
	  }
	  if (flush) {
	    Pool.flush();
	  }
	};
	
	Pool.free = function () {
	  var calls = this.calls.free;
	  for (var i = 0, l = calls.length; i < l; i++) {
	    calls[i].superFree();
	    calls[i].pool.free();
	  }
	  calls.length = 0;
	};
	
	Pool.flush = function () {
	  var byType = Pool.byType;
	  for (var type in byType) {
	    var collected = 0;
	    var heap = byType[type].heap;
	    var i = heap.length;
	    while (i--) {
	      if (heap[i].allocated) {
	        continue;
	      }
	      heap.splice(i, 1);
	      collected++;
	    }
	    console.log("%s: %d/%d flushed", type, collected, heap.length);
	  }
	};
	
	Pool.call = function (fn, arg) {
	  var calls = this.calls[fn];
	  if (calls == null) {
	    return;
	  }
	  var i = calls.length;
	  if (i === 0) {
	    return;
	  }
	  while (i--) {
	    if (calls[i].enabled) {
	      // BAILOUT after callelem
	      calls[i][fn](arg);
	    }
	  }
	};
	
	var ComponentMap = function ComponentMap() {};
	
	Pool.ComponentMap = ComponentMap;
	
	module.exports = Pool;

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _prototypeProperties = function (child, staticProps, instanceProps) {
	  if (staticProps) Object.defineProperties(child, staticProps);
	  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
	};
	
	/** @flow */
	
	var Mathf = __webpack_require__(23);
	var Entity = __webpack_require__(9);
	
	/**
	 * @class
	 * @constructor
	 * @param {String} id Prefab Id
	 * @param {Object} components Default attributes
	 */
	var Prefab = (function () {
	  function Prefab(id, components) {
	    this.id = id;
	    Prefab.byId[this.id] = this;
	    this.components = components;
	    this.types = [];
	    this.subKeys = {};
	    for (var type in components) {
	      this.types.push(type);
	      if (components[type] == null) {
	        components[type] = {};
	      }
	      this.subKeys[type] = Object.keys(components[type]);
	    }
	  }
	
	  _prototypeProperties(Prefab, null, {
	    create: {
	
	      /**
	       * Allocate {@link Entity} from Prefab
	       * @param {Entity} parent Parent entity
	       * @param {Object} components Override prefab components
	       * @return {Entity}
	       */
	      value: function create(parent, components) {
	        var entity = Entity.create(parent, components == null ? this.components : null);
	        entity.prefab = this.id;
	        if (components != null) {
	          var types = this.types;
	          var type = "";
	          for (var i = 0, l = types.length; i < l; i++) {
	            type = types[i];
	            var defaults = this.components[type];
	            var overrides = components[type];
	            if (overrides != null) {
	              delete components[type];
	              var subKeys = this.subKeys[type];
	              var k = subKeys.length;
	              if (k > 0) {
	                for (var j = 0; j < k; j++) {
	                  var subKey = subKeys[j];
	                  if (overrides[subKey] === undefined) {
	                    overrides[subKey] = defaults[subKey];
	                  }
	                }
	              }
	            } else {
	              overrides = defaults;
	            }
	            entity.createComponent(type, overrides);
	          }
	          for (type in components) {
	            entity.createComponent(type, components[type]);
	          }
	        }
	        return entity;
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    },
	    toString: {
	
	      /**
	       * Brief summary
	       * @private
	       * @return {String}
	       */
	      value: function toString() {
	        var comps = Object.keys(this.components).join(", ");
	        return "Prefab #" + this.id;
	      },
	      writable: true,
	      enumerable: true,
	      configurable: true
	    }
	  });
	
	  return Prefab;
	})();
	
	;
	
	Prefab.reset = function () {
	  Prefab.byId = {};
	};
	
	Prefab.reset();
	
	/**
	 * Allocate Prefab by Id
	 * @static
	 * @param {String} id Prefab Id
	 * @param {Entity} parent Parent entity
	 * @param {Object} components Override components
	 * @return {Entity}
	 */
	Prefab.create = function (id, parent, components) {
	  var prefab = Prefab.byId[id];
	  if (prefab == null) {
	    throw new Error("Prefab \"" + id + "\" not found.");
	  }
	  return prefab.create(parent, components);
	};
	
	module.exports = Prefab;

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var Entity = __webpack_require__(9);
	var Bounds = __webpack_require__(3);
	var Vec2 = __webpack_require__(26);
	var Color = __webpack_require__(5);
	
	function Renderer(element, size) {
	  this.element = element || document.body;
	  this.size = Vec2(size);
	  this.color = Color.white;
	  this.content = Vec2(size);
	  this.browser = Vec2();
	  this.margin = Vec2();
	  this.position = Vec2();
	  this.scale = 0;
	  this.orientation = "landscape";
	
	  this.canvas = document.createElement("canvas");
	  if (this.color != null) {
	    this.canvas.mozOpaque = true;
	  }
	  this.ctx = this.canvas.getContext("2d");
	
	  // var deviceRatio = window.devicePixelRatio || 1;
	  // var backingStoreRatio = this.ctx.backingStorePixelRatio ||
	  // 	this.ctx.webkitBackingStorePixelRatio ||
	  // 	this.ctx.mozBackingStorePixelRatio || 1;
	  // this.ratio = deviceRatio / backingStoreRatio;
	  this.ratio = 1;
	
	  // var oldSave = this.ctx.save;
	  // var oldRestore = this.ctx.restore;
	  // this.ctx.save = function() {
	  // 	this.saved++;
	  // 	// console.log('SAVE');
	  // 	// debugger;
	  // 	oldSave.call(this);
	  // };
	  // this.ctx.restore = function() {
	  // 	this.saved--;
	  // 	// console.log('RESTORE');
	  // 	// debugger;
	  // 	oldRestore.call(this);
	  // }
	  // this.ctx.saved = 0;
	
	  this.canvas.width = this.content[0] * this.ratio;
	  this.canvas.height = this.content[1] * this.ratio;
	  this.element.style.width = this.content[0] + "px";
	  this.element.style.height = this.content[1] + "px";
	  this.element.appendChild(this.canvas);
	
	  var style = this.element.style;
	  this.transformProp = ["transform", "webkitTransform"].filter(function (key) {
	    return style[key] != null;
	  })[0];
	
	  window.addEventListener("resize", this, false);
	  this.reflow();
	}
	
	Renderer.prototype = {
	
	  handleEvent: function (evt) {
	    this.reflow();
	  },
	
	  reflow: function () {
	    var browser = this.browser;
	    Vec2.set(browser, window.innerWidth, window.innerHeight);
	    var scale = Math.min(browser[0] / this.content[0], browser[1] / this.content[1]);
	    if (scale !== this.scale) {
	      this.scale = scale;
	      Vec2.scale(this.content, this.scale, this.size);
	    }
	    var offset = Vec2.scale(Vec2.sub(browser, this.size, this.margin), 0.5);
	    this.element.style[this.transformProp] = "translate(" + (offset[0] | 0) + "px, " + (offset[1] | 0) + "px) scale(" + scale + ")";
	  },
	
	  save: function () {
	    var ctx = this.ctx;
	    this.ctx.save();
	    if (this.color != null) {
	      ctx.fillStyle = Color.rgba(this.color);
	      ctx.fillRect(0, 0, this.content[0], this.content[1]);
	    } else {
	      ctx.clearRect(0, 0, this.content[0], this.content[1]);
	    }
	    ctx.scale(this.ratio, this.ratio);
	    return ctx;
	  },
	
	  restore: function () {
	    this.ctx.restore();
	    // TODO: Filters?
	  }
	
	  // cull: function(entity) {
	  //   var bounds = entity.bounds;
	  //   if (!bounds) {
	  //     return false;
	  //   }
	  //   if (bounds.withinRect(this.position, this.content)) {
	  //     if (bounds.culled) {
	  //       bounds.culled = false;
	  //     }
	  //     return false;
	  //   }
	  //   if (!bounds.culled) {
	  //     bounds.culled = true;
	  //   }
	  //   return true;
	  // },
	
	  // isFullscreen: function() {
	  //   var doc = document;
	  //   return doc.fullscreen || doc.mozFullScreen || doc.webkitIsFullScreen;
	  // },
	
	  // requestFullscreen: function() {
	  //   if (!this.isFullscreen()) {
	  //     var target = this.element.parentNode;
	  //     if ('webkitRequestFullScreen' in target) {
	  //       target.webkitRequestFullScreen();
	  //     } else if ('mozRequestFullScreen' in target) {
	  //       target.mozRequestFullScreen();
	  //     }
	  //   }
	  // },
	
	  // fullscreenChange: function() {
	  //   if (this.orientation) {
	  //     this.lockOrientation(this.orientation);
	  //   }
	  // },
	
	  // lockOrientation: function(format) {
	  //   if (format == null) {
	  //     format = this.orientation;
	  //   }
	  //   var target = window.screen;
	  //   if ('lockOrientation' in target) {
	  //     screen.lockOrientation(format);
	  //   } else if ('mozLockOrientation' in target) {
	  //     screen.mozLockOrientation(format);
	  //   }
	  // }
	
	};
	
	module.exports = Renderer;

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	/* @flow */
	/**
	 * @module core/shims
	 */
	
	if (typeof window != "undefined") {
	  // performance.now
	  var perf = window.performance || (window.performance = {});
	  perf.now = perf.now || perf.webkitNow || perf.msNow || perf.mozNow || Date.now;
	
	  perf.nextTick = (function () {
	    var nextTick = function (fn) {
	      queue.push(fn);
	      window.postMessage("nexttick", "*");
	    };
	
	    var handleMessage = function (event) {
	      if (event.source != window || event.data != "nexttick") {
	        return;
	      }
	      event.stopPropagation();
	      if (queue.length > 0) {
	        queue.shift()();
	      }
	    };
	
	    var queue = [];
	
	
	    window.addEventListener("message", handleMessage, true);
	    return nextTick;
	  })();
	
	  window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame;
	}
	
	/* Unused
	// Object.setPrototypeOf
	// http://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.setprototypeof
	Object.setPrototypeOf = Object.setPrototypeOf || function(obj, proto) {
		obj.__proto__ = proto;
		return obj;
	};
	
	// Object.mixin
	Object.mixin = Object.mixin || function(obj, properties) {
		for (var key in properties) {
			obj[key] = properties[key];
		}
		return obj;
	};
	*/

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/**
	 * @module core/sprite
	 */
	
	var Vec2 = __webpack_require__(26);
	var Component = __webpack_require__(6);
	var Pool = __webpack_require__(14);
	
	/**
	 * Loads and paints a single image file. Either loaded from source or drawn via callback, created from given width/height.
	 * @class
	 * @param {String|Function} srcOrRepaint URL or callback to draw image on demand
	 * @param {Number[]} size (optional) Override size for drawing canvas
	 * @param {Number} baseScale (optional) Base scale applied to all draws, defaults to 1
	 */
	function SpriteAsset(srcOrRepaint, size, baseScale) {
	  this.baseScale = baseScale != null ? baseScale : 1;
	  this.size = Vec2(size);
	  this.bufferSize = Vec2(size);
	  this.defaultAnchor = Vec2.topLeft;
	  this.defaultOffset = Vec2();
	  this.defaultScale = Vec2(1, 1);
	  this.buffer = document.createElement("canvas");
	  this.bufferCtx = this.buffer.getContext("2d");
	  this.scale = 1;
	  this.ready = false;
	  this.repaintSrc = null;
	  this.customRepaint = null;
	  this.src = "";
	  this.loading = false;
	
	  // console.log(typeof srcOrRepaint);
	
	  switch (typeof srcOrRepaint) {
	    case "string":
	      this.src = srcOrRepaint;
	      var img = new Image();
	      this.img = img;
	      img.addEventListener("load", this);
	      this.loading = true;
	      img.src = srcOrRepaint;
	      if (this.loading && img.width && img.height) {
	        this.handleEvent();
	      }
	      break;
	    case "function":
	      this.customRepaint = srcOrRepaint;
	      this.refresh();
	      break;
	    case "object":
	      this.repaintSrc = srcOrRepaint;
	      this.refresh();
	      break;
	  }
	}
	
	SpriteAsset.prototype = {
	
	  toString: function () {
	    var url = this.buffer ? this.buffer.toDataURL() : "Pending";
	    return "SpriteAsset " + Vec2.toString(this.size) + " " + Vec2.toString(this.bufferSize) + "\n" + (this.src || this.repaint) + "\n" + url;
	  },
	
	  repaintOnComponent: function () {
	    this.repaintSrc.onRepaint(this.bufferCtx, this);
	  },
	
	  handleEvent: function () {
	    // console.log('Loaded ' + this);
	    if (!this.loading) {
	      return;
	    }
	    this.loading = false;
	    Vec2.set(this.size, this.img.width, this.img.height);
	    this.refresh();
	  },
	
	  /**
	   * Draw whole or sprite of image to canvas. Draws only if image is loaded.
	   * @param {Object} ctx 2d-canvas context
	   * @param {Number[]} toPos (optional) Position to draw to.
	   * @param {Number[]} anchor (optional) anchor draw position, between
	   *   lower-left [-1, -1] and upper-right [1, 1]
	   * @param {Number[]} size (optional) Target size
	   * @param {Number[]} fromPos (optional) Source position (for sprites)
	   * @param {Number[]} scale (optional) Target scaling, applied to size
	   */
	  draw: function (ctx, toPos, anchor, size, fromPos, scale) {
	    if (!this.ready) {
	      return;
	    }
	    if (toPos == null) {
	      toPos = Vec2.zero;
	    }
	    if (anchor == null) {
	      anchor = this.defaultAnchor;
	    }
	    if (size == null) {
	      size = this.bufferSize;
	    }
	    if (fromPos == null) {
	      fromPos = this.defaultOffset;
	    }
	    if (scale == null) {
	      scale = this.defaultScale;
	    }
	    ctx.drawImage(this.buffer, fromPos[0] | 0, fromPos[1] | 0, size[0], size[1], toPos[0] - size[0] * anchor[0] + 0.5 | 0, toPos[1] - size[1] * anchor[1] + 0.5 | 0, size[0] * scale[0], size[1] * scale[1]);
	  },
	
	  repaint: function () {
	    var size = this.size;
	    this.buffer.width = size[0];
	    this.buffer.height = size[1];
	    this.bufferCtx.drawImage(this.img, 0, 0, size[0], size[1]);
	    this.sample();
	  },
	
	  sample: function () {
	    var scale = this.scale;
	    var size = this.size;
	    var bufferCtx = this.bufferCtx;
	    var data = bufferCtx.getImageData(0, 0, size[0], size[1]).data;
	    this.buffer.width = this.bufferSize[0];
	    this.buffer.height = this.bufferSize[1];
	    for (var x = 0, w = size[0], h = size[1]; x <= w; x += 1) {
	      for (var y = 0; y <= h; y += 1) {
	        var i = (y * size[0] + x) * 4;
	        bufferCtx.fillStyle = "rgba(" + data[i] + ", " + data[i + 1] + ", " + data[i + 2] + ", " + data[i + 3] / 255 + ")";
	        bufferCtx.fillRect(x * scale, y * scale, scale, scale);
	      }
	    }
	  },
	
	  refresh: function (scale) {
	    // console.log('Refresh');
	    scale = (scale || 1) * this.baseScale;
	    if (this.ready && this.scale == scale) {
	      return;
	    }
	    this.scale = scale;
	    this.buffer.width = this.bufferSize[0] = this.size[0] * scale | 0;
	    this.buffer.height = this.bufferSize[1] = this.size[1] * scale | 0;
	    // Vec2.scale(this.bufferSize, -0.5, this.defaultOffset);
	    if (this.repaintSrc) {
	      this.repaintOnComponent();
	    } else if (this.customRepaint) {
	      this.customRepaint(this.bufferCtx, this);
	    } else {
	      this.repaint();
	    }
	    this.ready = true;
	  }
	
	};
	
	/**
	 * Sprite-sheet for animations.
	 * @class
	 * @param {Object} attributes sprites, frames, speed, size, anchor, sequences
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
	  this.defaults = {
	    speed: attributes.speed != null ? attributes.speed : 0,
	    size: attributes.size || Vec2(1, 1),
	    anchor: attributes.anchor || Vec2.center
	  };
	  this.sequences = {};
	  var sequences = attributes.sequences || {};
	  for (var id in sequences) {
	    this.addSequence(id, sequences[id]);
	  }
	}
	
	SpriteSheet.prototype = {
	  /**
	   * Add sequence to spritesheet.
	   * Sequences are defined as short-form by Array:
	   *   [frameIndexes, next || null, speed || defaultSpeed || sprite || 0]
	   * or Object:
	   *   {frames: [], next: 'id', speed: seconds, sprite: 0}
	   * @param {String} id       Sequence name (walk, jump, etc)
	   * @param {Array|Object} sequence Array or object
	   */
	  addSequence: function (id, sequence) {
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
	
	  prepare: function () {
	    var sprites = this.sprites;
	    for (var i = 0, l = sprites.length; i < l; i++) {
	      if (!sprites[i].ready) {
	        return false;
	      }
	    }
	    if (!this.frames.length) {
	      var defaults = this.defaults;
	      var size = defaults.size;
	      var anchor = defaults.anchor || Vec2.center;
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
	              anchor: anchor
	            });
	          }
	        }
	      }
	    }
	    this.ready = true;
	    return true;
	  },
	
	  draw: function (ctx, idx) {
	    if (!this.ready && !this.prepare()) {
	      return;
	    }
	    var frame = this.frames[idx || 0];
	    frame.sprite.draw(ctx, null, frame.anchor, frame.size, frame.position);
	  }
	};
	
	/**
	 * Sprite Tween lets components draw animation sequences from Sheets.
	 * @class
	 * @extends Component
	 */
	function SpriteTween() {
	  Component.call(this);
	  this.asset = null;
	  this.sequence = null;
	  this.speed = 0;
	  this.offset = 0;
	  this.isSheet = false;
	  this.paused = false;
	  this.dtime = 0;
	  this.frame = 0;
	}
	
	SpriteTween.prototype = {
	  attributes: {
	    asset: null,
	    speed: 0,
	    sequence: null,
	    offset: 0
	  },
	
	  create: function () {
	    // this.asset = attributes.asset;
	    // this.sequence = attributes.sequence;
	    // this.speed = attributes.speed;
	    this.isSheet = this.asset instanceof SpriteSheet;
	    if (this.isSheet) {
	      this.frame = 0;
	      if (!this.speed) {
	        this.speed = this.asset.defaults.speed;
	      }
	      this.dtime = this.offset;
	      if (!this.sequence) {
	        this.sequence = this.asset.defaultSequence;
	      }
	    }
	    this.paused = !this.speed;
	  },
	
	  preRender: function (dt) {
	    if (!this.isSheet || this.paused) {
	      return;
	    }
	    var frames = null;
	    var speed = 0;
	    var frameCount = 0;
	    var dtime = this.dtime += dt;
	    if (this.sequence) {
	      var sequence = this.asset.sequences[this.sequence];
	      speed = sequence.speed;
	      frames = sequence.frames;
	      frameCount = frames.length;
	      if (dtime >= frameCount * speed) {
	        this.entity.emit("onSequenceEnd");
	        if (sequence.next) {
	          if (sequence.next !== this.sequence) {
	            this.goto(sequence.next);
	            return;
	          }
	        } else {
	          this.pause();
	          return;
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
	        this.entity.emit("onSequenceEnd");
	      }
	      this.frame = dtime / speed | 0;
	    }
	  },
	
	  pause: function () {
	    this.paused = true;
	    return this;
	  },
	
	  play: function () {
	    this.paused = false;
	    return this;
	  },
	
	  goto: function (id) {
	    if (isNaN(id)) {
	      if (this.sequence != id) {
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
	      this.frame = id;
	    }
	    return this;
	  }
	};
	
	Component.create(SpriteTween, "spriteTween");
	
	/**
	 * @class
	 * @extends Component
	 */
	function SpriteCanvasRenderer() {
	  Component.call(this);
	}
	
	var compositeLevels = {};
	compositeLevels[0] = "source-over";
	var alphaLevels = {};
	alphaLevels[0] = 1;
	
	SpriteCanvasRenderer.prototype = {
	  render: function (ctx) {
	    var scene = this.entity.scene;
	    var child = scene.firstChild;
	    if (child == null) {
	      return;
	    }
	    var composite = "source-over";
	    var alpha = 1;
	    var level = 0;
	    ctx.save();
	    while (child) {
	      var tween = child.components.spriteTween;
	      if (tween != null && tween.enabled) {
	        var transform = child.components.transform;
	        transform.applyMatrixWorld(ctx);
	        if (transform.composite != composite) {
	          composite = transform.composite;
	          ctx.globalCompositeOperation = composite;
	        }
	        if (transform.alpha != alpha) {
	          alpha = transform.alpha;
	          ctx.globalAlpha = alpha;
	        }
	        tween.asset.draw(ctx, tween.frame);
	      }
	      if (child.firstChild != null) {
	        level++;
	        child = child.firstChild;
	      } else {
	        while (child.next == null) {
	          level--;
	          child = child.parent;
	          if (child == scene) {
	            ctx.restore();
	            return;
	          }
	        }
	        child = child.next;
	      }
	    }
	    ctx.restore();
	  }
	};
	
	Component.create(SpriteCanvasRenderer, "spriteCanvasRenderer");
	
	module.exports.Asset = SpriteAsset;
	module.exports.Tween = SpriteTween;
	module.exports.Sheet = SpriteSheet;
	module.exports.CanvasRenderer = SpriteCanvasRenderer;

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var Component = __webpack_require__(6);
	var Pool = __webpack_require__(14);
	var Vec2 = __webpack_require__(26);
	var Mat2 = __webpack_require__(22);
	
	/**
	 * Transform keeps track of transformation (position, rotation and scale) and
	 * composite, alpha.
	 * @extends Component
	 * @class
	 */
	function Transform() {
	  Component.call(this);
	  this.rotation = 0;
	  this.alpha = 1;
	  this.composite = "";
	  this._position = Vec2();
	  this._scale = Vec2();
	  this._matrix = Mat2();
	  this._matrixWorld = Mat2();
	  this.dirty = false;
	  this.dirtyWorld = false;
	  this.matrixAutoUpdate = false;
	  this.parentTransform = null;
	}
	
	Transform.prototype = Object.defineProperties({
	  attributes: {
	    position: Vec2(),
	    scale: Vec2(1, 1),
	    rotation: 0,
	    alpha: 1,
	    composite: "source-over"
	  },
	
	  create: function () {
	    this.dirty = true;
	    this.dirtyWorld = true;
	    this.matrixAutoUpdate = true;
	    var parent = this.entity.parent;
	    this.parentTransform = parent ? parent.components.transform : null;
	  },
	
	  dealloc: function () {
	    this.parentTransform = null;
	  },
	
	  markDirty: function (force) {
	    if (this.dirty && !force) {
	      return;
	    }
	    this.dirty = true;
	    this.dirtyWorld = true;
	    var start = this.entity;
	    var child = start.firstChild;
	    while (child != null) {
	      child.components.transform.dirtyWorld = true;
	      if (child.firstChild != null) {
	        child = child.firstChild;
	      } else if (child.next == null) {
	        do {
	          child = child.parent;
	          if (child == start) {
	            return;
	          }
	        } while (child.next == null);
	      }
	      child = child.next;
	    }
	  },
	
	  compose: function (position, rotation, scale) {
	    if (position != null) {
	      this.position = position;
	    }
	    if (rotation != null) {
	      this.rotation = rotation;
	    }
	    if (scale != null) {
	      this.scale = scale;
	    }
	    this.markDirty();
	  },
	
	  translateBy: function (by) {
	    Vec2.add(this._position, by);
	    this.markDirty();
	  },
	
	  translateTo: function (to) {
	    this.position = to;
	    this.markDirty();
	  },
	
	  translateXBy: function (by) {
	    this._position[0] += by;
	    this.markDirty();
	  },
	
	  translateXTo: function (to) {
	    this._position[0] = to;
	    this.markDirty();
	  },
	
	  translateYBy: function (by) {
	    this._position[1] += by;
	    this.markDirty();
	  },
	
	  translateYTo: function (to) {
	    this._position[1] = to;
	    this.markDirty();
	  },
	
	  scaleBy: function (by) {
	    Vec2.add(this._scale, by);
	    this.markDirty();
	  },
	
	  scaleTo: function (to) {
	    this.scale = to;
	    this.markDirty();
	  },
	
	  scaleXBy: function (by) {
	    this._scale[0] += by;
	    this.markDirty();
	  },
	
	  scaleXTo: function (to) {
	    this._scale[0] = to;
	    this.markDirty();
	  },
	
	  scaleYBy: function (by) {
	    this._scale[1] += by;
	    this.markDirty();
	  },
	
	  scaleYTo: function (to) {
	    this._scale[1] = to;
	    this.markDirty();
	  },
	
	  rotateBy: function (by) {
	    this.rotation += by;
	    this.markDirty();
	  },
	
	  rotateTo: function (to) {
	    this.rotation = to;
	    this.markDirty();
	  },
	
	  applyMatrixWorld: function (ctx) {
	    var mtx = this.matrixWorld;
	    ctx.setTransform(mtx[0], mtx[1], mtx[2], mtx[3], mtx[4] + 0.5 | 0, mtx[5] + 0.5 | 0);
	  },
	
	  applyMatrix: function (ctx) {
	    if (this.positionOnly) {
	      ctx.translate(this.position[0], this.position[1]);
	    } else {
	      var mtx = this.matrix;
	      ctx.transform(mtx[0], mtx[1], mtx[2], mtx[3], mtx[4] + 0.5 | 0, mtx[5] + 0.5 | 0);
	    }
	  }
	}, {
	  matrix: {
	    get: function () {
	      var matrix = this._matrix;
	      if (this.dirty || this.matrixAutoUpdate) {
	        Mat2.translate(Mat2.identity, this._position, matrix);
	        Mat2.rotate(matrix, this.rotation);
	        Mat2.scale(matrix, this._scale);
	        this.markDirty();
	        this.dirty = false;
	      }
	      return matrix;
	    },
	    enumerable: true,
	    configurable: true
	  },
	  matrixWorld: {
	    get: function () {
	      var matrix = this.matrix;
	      var parent = this.parentTransform;
	      if (parent == null) {
	        return matrix;
	      }
	      var matrixWorld = this._matrixWorld;
	      if (this.dirtyWorld) {
	        Mat2.multiply(parent.matrixWorld, matrix, matrixWorld);
	        this.dirtyWorld = false;
	      }
	      return matrixWorld;
	    },
	    enumerable: true,
	    configurable: true
	  },
	  alphaWorld: {
	    get: function () {
	      var alpha = this.alpha;
	      var parent = this.parentTransform;
	      if (parent == null) {
	        return alpha;
	      }
	      return parent.alphaWorld * alpha;
	    },
	    enumerable: true,
	    configurable: true
	  },
	  positionOnly: {
	    get: function () {
	      var parent = this.parentTransform;
	      return (parent == null || parent.positionOnly) && this.rotation === 0 && this._scale[0] == 1 && this._scale[1] == 1;
	    },
	    set: function (to) {
	      if (to) {
	        this.rotation = 0;
	        this.scale = Vec2.one;
	        this.parentTransform.positionOnly = true;
	      }
	    },
	    enumerable: true,
	    configurable: true
	  }
	});
	
	Vec2.defineProperty(Transform, "position");
	Vec2.defineProperty(Transform, "scale");
	
	Component.create(Transform, "transform");
	
	module.exports = Transform;

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/**
	 * Heightmap
	 *
	 * http://www.float4x4.net/index.php/2010/06/
	 *   generating-realistic-and-playable-terrain-height-maps/
	 */
	
	var Perlin = __webpack_require__(21);
	
	var Heightmap = function (size, scale) {
	  this.size = size || 256;
	  this.scale = scale || 1;
	
	  this.perlin = new Perlin();
	  this.heights = new Float32Array(size * size);
	};
	
	Heightmap.prototype = {
	
	  add: function (scale, ratio) {
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
	
	  erode: function (smoothness) {
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
	        if (dmax > 0 && dmax <= smoothness / size) {
	          var h = 0.5 * dmax;
	          heights[key] -= h;
	          heights[(x + matchX) * size + (y + matchY)] += h;
	        }
	      }
	    }
	  },
	
	  // 3×3 box filter
	  smoothen: function (factor) {
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
	
	  get: function (x, y) {
	    return this.heights[x * this.size + y];
	  }
	
	};

	module.exports = Heightmap;

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
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
	    permutation[i] = Math.random() * 255 | 0;
	  }
	  this.permutation = new Uint8Array(permutation.concat(permutation));
	  console.log(this.permutation.length);
	}
	
	Perlin.prototype.get = function (x, y, z) {
	  var p = this.permutation;
	
	  var floorX = ~ ~x;
	  var floorY = ~ ~y;
	  var floorZ = ~ ~z;
	
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
	  lerp(u, grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1)))) + 0.5;
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

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/**
	 * @module math/mat2
	 */
	
	/*
	 * 2x3 Matrix
	 * @class
	 * @classdesc Float32Array representation of 2x3 transformation matrix.
	 * [a, c, tx,
	 *  b, d, ty,
	 *  0, 0, 1]
	 * https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/mat2d.js
	 * https://github.com/simonsarris/Canvas-tutorials/blob/master/transform.js
	 * @param {Number[]|Number} fromOrA
	 * @param {Number} b
	 * @param {Number} c
	 * @param {Number} d
	 * @param {Number} tx
	 * @param {Number} ty
	 * @returns {Mat2} mat2 New 2D Matrix
	 */
	function Mat2(fromOrA, b, c, d, tx, ty) {
	  if (b != null) {
	    return new Float32Array([fromOrA, b, c, d, tx, ty]);
	  }
	  return new Float32Array(fromOrA || Mat2.identity);
	}
	
	Mat2.identity = Mat2(1, 0, 0, 1, 0, 0);
	
	/**
	 * Set Matrix from a, b, c, d, tx, ty
	 * @param {Mat2} result [description]
	 * @param {Number} a
	 * @param {Number} b
	 * @param {Number} c
	 * @param {Number} d
	 * @param {Number} tx
	 * @param {Number} ty
	 */
	Mat2.set = function (result, a, b, c, d, tx, ty) {
	  result[0] = a || 0;
	  result[1] = b || 0;
	  result[2] = c != null ? c : 1;
	  result[3] = d || 0;
	  result[4] = tx || 0;
	  result[5] = ty != null ? ty : 1;
	  return result;
	};
	
	Mat2.reset = function (result) {
	  result.set(Mat2.identity);
	};
	
	Mat2.toString = function (a) {
	  return "[" + a[0] + ", " + a[1] + " | " + a[2] + ", " + a[3] + " | " + a[4] + ", " + a[5] + "]";
	};
	
	Mat2.copy = function (result, b) {
	  result.set(b || Mat2.identity);
	  return result;
	};
	
	Mat2.valid = function (a) {
	  return !(isNaN(a[0]) || isNaN(a[1]) || isNaN(a[2]) || isNaN(a[3]) || isNaN(a[4]) || isNaN(a[5]));
	};
	
	Mat2.isIdentity = function (a) {
	  return a[0] == 1 && a[1] === 0 && a[2] === 0 && a[3] == 1 && a[4] === 0 && a[5] === 0;
	};
	
	Mat2.multiply = function (a, b, result) {
	  result = result || a;
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
	
	Mat2.rotate = function (a, rad, result) {
	  result = result || a;
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
	
	Mat2.scale = function (a, v, result) {
	  result = result || a;
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
	
	Mat2.translate = function (a, v, result) {
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
	
	Mat2.apply = function (a, v, result) {
	  result = result || v;
	  var x = v[0];
	  var y = v[1];
	  result[0] = x * a[0] + y * a[2] + a[4];
	  result[1] = x * a[1] + y * a[3] + a[5];
	  return result;
	};
	
	module.exports = Mat2;

/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	/** @flow */
	/**
	 * @exports math/mathf
	 */
	var Mathf = {};
	
	/*
	 * http://docs.unity3d.com/Documentation/ScriptReference/Mathf.html
	 * https://github.com/secretrobotron/gladius.math/
	 * https://github.com/toji/gl-matrix/tree/master/src/gl-matrix
	 *
	 * TODO: https://github.com/photonstorm/phaser/blob/master/Phaser/GameMath.ts
	 */
	var EPSILON = 0.01;
	Mathf.EPSILON = EPSILON;
	
	var PI = Math.PI;
	var TAU = PI * 2;
	var HALF_PI = PI / 2;
	var RAD2DEG = 180 / PI;
	var DEG2RAD = PI / 180;
	Mathf.TAU = TAU;
	Mathf.HALF_PI = HALF_PI;
	Mathf.RAD2DEG = RAD2DEG;
	Mathf.DEG2RAD = DEG2RAD;
	
	var uid = 1;
	
	/**
	 * Generate UID
	 * @function uid
	 * @return {Number} Unique ID
	 */
	Mathf.uid = function () {
	  return uid++;
	};
	
	Mathf.clamp = function (a, low, high) {
	  if (a < low) {
	    return low;
	  }
	  if (a > high) {
	    return high;
	  }
	  return a;
	};
	
	Mathf.map = function (a, fromLow, fromHigh, toLow, toHigh) {
	  return toLow + (a - fromLow) / (fromHigh - fromLow) * (toHigh - toLow);
	};
	
	/**
	 * Correct modulo behavior
	 * @param {Number} a Dividend
	 * @param {Number} b Divisor
	 * @return {Number} a % b where the result is between 0 and b (either
	 *   0 <= x < b or b < x <= 0, depending on the sign of b).
	 */
	Mathf.mod = function (a, b) {
	  a %= b;
	  return a * b < 0 ? a + b : a;
	};
	
	/**
	 * Loops the value t, so that it is never larger than length and never
	 * smaller than 0.
	 * @param {Number} t
	 * @param {Number} length
	 * @return {Number}
	 */
	Mathf.repeat = function (t, length) {
	  return t - Math.floor(t / length) * length;
	};
	
	Mathf.toDeg = function (rad) {
	  return rad * RAD2DEG;
	};
	
	Mathf.toRad = function (deg) {
	  return deg * DEG2RAD;
	};
	
	Mathf.normDeg = function (deg) {
	  deg %= 360;
	  return deg * 360 < 0 ? deg + 360 : deg;
	};
	
	Mathf.normRad = function (rad) {
	  rad %= TAU;
	  return rad * TAU < 0 ? rad + TAU : rad;
	};
	
	Mathf.distRad = function (a, b) {
	  var d = Mathf.normRad(b) - Mathf.normRad(a);
	  if (d > PI) {
	    return d - TAU;
	  }
	  if (d <= -PI) {
	    return d + TAU;
	  }
	  return d;
	};
	
	Mathf.distDeg = function (a, b) {
	  var d = Mathf.normDeg(b) - Mathf.normDeg(a);
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
	Mathf.lerp = function (a, b, scalar) {
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
	Mathf.smoothDamp = function (a, b, velocity, time, maxVelocity, delta) {
	  time = Math.max(EPSILON, time);
	  delta = delta || 0.02;
	  var num = 2 / time;
	  var num2 = num * delta;
	  var num3 = 1 / (1 + num2 + 0.48 * num2 * num2 + 0.235 * num2 * num2 * num2);
	  var num4 = a - b;
	  var num5 = b;
	  var num6 = (maxVelocity || Number.POSITIVE_INFINITY) * time;
	  num4 = Mathf.clamp(num4, -num6, num6);
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
	
	Mathf.distAng = function (a, b) {
	  if (a == b) {
	    return 0;
	  }
	  var ab = a < b;
	  var l = ab ? -a - TAU + b : b - a;
	  var r = ab ? b - a : TAU - a + b;
	  return Math.abs(l) > Math.abs(r) ? r : l;
	};
	
	module.exports = Mathf;

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	/* @flow */
	/**
	 * @exports math/random
	 */
	var Random = {};
	
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
	
	/**
	 * Seed based Math.random()
	 * Inspired by http://processing.org/reference/random_.html
	 * @param  {Number} low
	 * @param  {Number} high
	 * @return {Number} Number between 0 and 1
	 */
	Random.rand = function (low, high) {
	  // define the recurrence relationship
	  z = (a * z + c) % m;
	  // return a float in [0, 1)
	  // if z = m then z / m = 0 therefore (z % m) / m < 1 always
	  return z / m * (high - low) + low;
	};
	
	/**
	 * Set seed
	 * @param  {Number} seed
	 */
	Random.srand = function (seed) {
	  z = seed | 0;
	};
	
	Random.values = function (values) {
	  return values[Random.rand(0, values.length) | 0];
	};
	
	Random.chance = function (chance) {
	  return Random.rand(0, 1) <= chance;
	};
	
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

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	/* @flow */
	/**
	 * @module math/tweens
	 */
	var Tweens = {
	  linear: function (t) {
	    return t;
	  }
	};
	
	// http://greweb.me/2012/02/bezier-curve-based-easing-functions-from-concept-to-implementation/
	// https://github.com/petehunt/react-touch/blob/gh-pages/src/math/EasingFunctions.js
	// https://gist.github.com/gre/1650294
	// http://joshondesign.com/2013/03/01/improvedEasingEquations
	
	function powIn(exp) {
	  return function (t) {
	    return Math.pow(t, exp);
	  };
	}
	
	function toOut(exp) {
	  return function (t) {
	    return 1 - Math.pow(1 - t, exp);
	  };
	}
	
	function toInOut(exp) {
	  return function (t) {
	    return (t < 0.5 ? Math.pow(t * 2, exp) : 2 - Math.pow(2 * (1 - t), exp)) / 2;
	  };
	}
	
	var transitions = ["quad", "cubic", "quart", "quint"];
	for (var i = 0, l = transitions.length; i < l; i++) {
	  var transition = transitions[i];
	  Tweens[transition + "In"] = powIn(i + 2);
	  Tweens[transition + "Out"] = toOut(i + 2);
	  Tweens[transition + "InOut"] = toInOut(i + 2);
	}
	
	module.exports = Tweens;

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	/**
	 * @module math/vec2
	 */
	
	var rand = __webpack_require__(24).rand;
	var Mathf = __webpack_require__(23);
	var EPSILON = Mathf.EPSILON;
	var TAU = Mathf.TAU;
	
	/**
	 * Initialize from Vec2 array or x/y values. Returns a new (typed) array.
	 * @class
	 * @classdesc Float32Array representation of 2D vectors and points.
	 * @param {Vec2|Number} [fromOrX=Vec2.zero] Typed array to copy from or x
	 * @param {Number} y y, when x was provided as first argument
	 * @returns {Vec2} vec2 New 2D Vector
	 */
	function Vec2(fromOrX, y) {
	  if (y != null) {
	    return new Float32Array([fromOrX, y]);
	  }
	  return new Float32Array(fromOrX || Vec2.zero);
	}
	
	Vec2.zero = Vec2(0, 0);
	Vec2.one = Vec2(1, 1);
	Vec2.center = Vec2(0.5, 0.5);
	Vec2.topLeft = Vec2(0, 0);
	Vec2.topCenter = Vec2(0.5, 0);
	Vec2.topRight = Vec2(1, 0);
	Vec2.centerLeft = Vec2(0, 0.5);
	Vec2.centerRight = Vec2(1, 0.5);
	Vec2.bottomLeft = Vec2(1, 1);
	Vec2.bottomCenter = Vec2(0.5, 1);
	Vec2.bottomRight = Vec2(0.5, 0.5);
	
	/**
	 * Set vector from x and y value
	 * @param {Vec2} result Vec2 to mutate
	 * @param {Number} [x=0]
	 * @param {Number} [y=0]
	 * @return {Vec2} result
	 */
	Vec2.set = function (result, x, y) {
	  result[0] = x || 0;
	  result[1] = y || 0;
	  return result;
	};
	
	Vec2.copy = function (result, b) {
	  result[0] = b[0];
	  result[1] = b[1];
	  return result;
	};
	
	Vec2.reset = function (result) {
	  result[0] = 0;
	  result[1] = 0;
	  return result;
	};
	
	Vec2.valid = function (a) {
	  return !(isNaN(a[0]) || isNaN(a[1]));
	};
	
	Vec2.toString = function (a) {
	  return "[" + a[0] + ", " + a[1] + "]";
	};
	
	var objVecCache = Vec2();
	
	Vec2.fromObj = function (obj, a) {
	  a = a || objVecCache;
	  a[0] = obj.x;
	  a[1] = obj.y;
	  return a;
	};
	
	var objCache = {
	  x: 0,
	  y: 0
	};
	Vec2.toObj = function (a, obj) {
	  obj = obj || objCache;
	  obj.x = a[0];
	  obj.y = a[1];
	  return obj;
	};
	
	Vec2.equals = function (a, b) {
	  return a[0] == b[0] && a[1] == b[1];
	};
	
	Vec2.approx = function (a, b) {
	  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON;
	};
	
	Vec2.isZero = function (a, b) {
	  return a[0] === 0 && a[1] === 0;
	};
	
	Vec2.approxZero = function (a, b) {
	  return a[0] < EPSILON && a[0] > -EPSILON && a[1] < EPSILON && a[1] > -EPSILON;
	};
	
	Vec2.add = function (a, b, result) {
	  result = result || a;
	  result[0] = a[0] + b[0];
	  result[1] = a[1] + b[1];
	  return result;
	};
	
	Vec2.sub = function (a, b, result) {
	  result = result || a;
	  result[0] = a[0] - b[0];
	  result[1] = a[1] - b[1];
	  return result;
	};
	
	Vec2.mul = function (a, b, result) {
	  result = result || a;
	  result[0] = a[0] * b[0];
	  result[1] = a[1] * b[1];
	  return result;
	};
	
	Vec2.scale = function (a, scalar, result) {
	  result = result || a;
	  result[0] = a[0] * scalar;
	  result[1] = a[1] * scalar;
	  return result;
	};
	
	Vec2.norm = function (a, result, scalar) {
	  result = result || a;
	  var x = a[0];
	  var y = a[1];
	  var len = (scalar || 1) / (Math.sqrt(x * x + y * y) || 1);
	  result[0] = x * len;
	  result[1] = y * len;
	  return result;
	};
	
	Vec2.lenSq = function (a) {
	  return a[0] * a[0] + a[1] * a[1];
	};
	
	Vec2.len = function (a) {
	  return Math.sqrt(a[0] * a[0] + a[1] * a[1]);
	};
	
	Vec2.dot = function (a, b) {
	  return a[0] * b[0] + a[1] * b[1];
	};
	
	Vec2.cross = function (a, b) {
	  return a[0] * b[1] - a[1] * b[0];
	};
	
	/**
	 * Linear interpolation
	 * http://en.wikipedia.org/wiki/Lerp_%28computing%29
	 * @param  {Vec2} a
	 * @param  {Vec2} b
	 * @param  {Number} scalar Interpolation parameter between 0 and 1
	 * @return {Vec2} Result
	 */
	Vec2.lerp = function (a, b, scalar, result) {
	  result = result || a;
	  result[0] = a[0] + scalar * (b[0] - a[0]);
	  result[1] = a[1] + scalar * (b[1] - a[1]);
	  return result;
	};
	
	var slerpCacheA = Vec2();
	var slerpCacheB = Vec2();
	
	/**
	 * Spherical linear interpolation
	 * http://en.wikipedia.org/wiki/Slerp
	 * @param  {Vec2} a
	 * @param  {Vec2} b
	 * @param  {Number} scalar Interpolation parameter between 0 and 1
	 * @return {Vec2} Result
	 */
	Vec2.slerp = function (a, b, scalar, result) {
	  result = result || a;
	  var omega = Math.acos(Mathf.clamp(Vec2.dot(Vec2.norm(a, slerpCacheA), Vec2.norm(b, slerpCacheB)), -1, 1));
	  return Vec2.lerp(a, b, Math.min(scalar, omega) / omega, result);
	};
	
	Vec2.max = function (a, b, axis) {
	  if (axis != null) {
	    return a[axis] > b[axis] ? a : b;
	  }
	  return Vec2.lenSq(a) > Vec2.lenSq(b) ? a : b;
	};
	
	Vec2.perp = function (a, result) {
	  result = result || a;
	  var x = a[0];
	  result[0] = a[1];
	  result[1] = -x;
	  return result;
	};
	
	Vec2.dist = function (a, b) {
	  var x = b[0] - a[0];
	  var y = b[1] - a[1];
	  return Math.sqrt(x * x + y * y);
	};
	
	Vec2.distSq = function (a, b) {
	  var x = b[0] - a[0];
	  var y = b[1] - a[1];
	  return x * x + y * y;
	};
	
	Vec2.near = function (a, b, dist) {
	  return Vec2.distSq(a, b) <= dist * dist;
	};
	
	Vec2.limit = function (a, max, result) {
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
	
	Vec2.clamp = Vec2.limit;
	
	var radCache1 = Vec2();
	var radCache2 = Vec2();
	
	Vec2.rad = function (a, b) {
	  if (!b) {
	    return Math.atan2(a[1], a[0]);
	  }
	  return Math.acos(Vec2.dot(Vec2.norm(a, radCache1), Vec2.norm(b, radCache2)));
	};
	
	Vec2.rotate = function (a, theta, result) {
	  result = result || a;
	  var sinA = Math.sin(theta);
	  var cosA = Math.cos(theta);
	  result[0] = a[0] * cosA - a[1] * sinA;
	  result[1] = a[0] * sinA + a[1] * cosA;
	  return result;
	};
	
	Vec2.rotateAxis = function (a, b, theta, result) {
	  return Vec2.add(Vec2.rotate(Vec2.sub(a, b, result || a), theta), b);
	};
	
	Vec2.rotateTo = function (a, rad, result) {
	  result = result || a;
	  var len = Vec2.len(a);
	  return Vec2.rotate(Vec2.set(result, len, 0), rad);
	};
	
	Vec2.lookAt = function (a, b, result) {
	  var len = Vec2.len(a);
	  return Vec2.norm(Vec2.rotate(a, Math.atan2(b[0] - a[0], b[1] - a[1]) - Math.atan2(a[1], a[0]), result || a), null, len);
	};
	
	Vec2.variant = function (a, delta, result) {
	  result = result || a;
	  result[0] = a[0] + rand(-delta, delta);
	  result[1] = a[1] + rand(-delta, delta);
	  return result;
	};
	
	Vec2.variantCirc = function (a, delta, result) {
	  result = result || a;
	  var len = rand(0, delta);
	  var theta = rand(0, TAU);
	  result[0] = a[0] + len * Math.cos(theta);
	  result[1] = a[1] + len * Math.sin(theta);
	  return result;
	};
	
	Vec2.variantRad = function (a, delta, result) {
	  return Vec2.rotate(a, rand(-delta, delta), result);
	};
	
	Vec2.variantLen = function (a, delta, result) {
	  return Vec2.norm(a, result, Vec2.len(a) + rand(-delta, delta));
	};
	
	Vec2.defineProperty = function (cls, name) {
	  var prop = "_" + name;
	  Object.defineProperty(cls.prototype, name, {
	    get: function () {
	      return this[prop];
	    },
	    set: function (value) {
	      this[prop][0] = value[0];
	      this[prop][1] = value[1];
	    }
	  });
	  var copy = "copy" + name.charAt(0).toUpperCase() + name.slice(1);
	  cls.prototype[copy] = function (result) {
	    result[0] = this[prop][0];
	    result[1] = this[prop][1];
	    return result;
	  };
	};
	
	module.exports = Vec2;

/***/ }
/******/ ])
//# sourceMappingURL=acme.js.map