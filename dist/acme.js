(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports", "./math/mathf", "./math/random", "./core/sprite", "./vendor/pixi", "./physics/body", "./physics/boid", "./physics/border", "./core/bounds", "./physics/collider", "./math/color", "./core/component", "./debug/console", "./core/context", "./core/entity", "./core/event", "./core/input", "./physics/jitter", "./math/mat2", "./physics/particle", "./physics/physics", "./core/registry", "./core/renderer", "./core/shims", "./core/transform", "./math/tweens", "./math/vec2"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports, require("./math/mathf"), require("./math/random"), require("./core/sprite"), require("./vendor/pixi"), require("./physics/body"), require("./physics/boid"), require("./physics/border"), require("./core/bounds"), require("./physics/collider"), require("./math/color"), require("./core/component"), require("./debug/console"), require("./core/context"), require("./core/entity"), require("./core/event"), require("./core/input"), require("./physics/jitter"), require("./math/mat2"), require("./physics/particle"), require("./physics/physics"), require("./core/registry"), require("./core/renderer"), require("./core/shims"), require("./core/transform"), require("./math/tweens"), require("./math/vec2"));
	}
})(function (exports, _mathMathf, _mathRandom, _coreSprite, _vendorPixi, _physicsBody, _physicsBoid, _physicsBorder, _coreBounds, _physicsCollider, _mathColor, _coreComponent, _debugConsole, _coreContext, _coreEntity, _coreEvent, _coreInput, _physicsJitter, _mathMat2, _physicsParticle, _physicsPhysics, _coreRegistry, _coreRenderer, _coreShims, _coreTransform, _mathTweens, _mathVec2) {
	"use strict";

	var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

	var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

	var _defaults = function (obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; };

	_defaults(exports, _interopRequireWildcard(_mathMathf));

	_defaults(exports, _interopRequireWildcard(_mathRandom));

	_defaults(exports, _interopRequireWildcard(_coreSprite));

	_defaults(exports, _interopRequireWildcard(_vendorPixi));

	// export * from './vendor/box2d-js'

	var Body = _interopRequire(_physicsBody);

	var Boid = _interopRequire(_physicsBoid);

	var Border = _interopRequire(_physicsBorder);

	var Bounds = _interopRequire(_coreBounds);

	var Collider = _interopRequire(_physicsCollider);

	var Color = _interopRequire(_mathColor);

	var Component = _interopRequire(_coreComponent);

	var Console = _interopRequire(_debugConsole);

	var Context = _interopRequire(_coreContext);

	var Entity = _interopRequire(_coreEntity);

	var Event = _interopRequire(_coreEvent);

	var Input = _interopRequire(_coreInput);

	var Jitter = _interopRequire(_physicsJitter);

	var Mat2 = _interopRequire(_mathMat2);

	var Particle = _interopRequire(_physicsParticle);

	var Physics = _interopRequire(_physicsPhysics);

	var Registry = _interopRequire(_coreRegistry);

	var Renderer = _interopRequire(_coreRenderer);

	var Shims = _interopRequire(_coreShims);

	var Transform = _interopRequire(_coreTransform);

	var Tweens = _interopRequire(_mathTweens);

	var Vec2 = _interopRequire(_mathVec2);

	exports.Body = Body;
	exports.Boid = Boid;
	exports.Border = Border;
	exports.Bounds = Bounds;
	exports.Collider = Collider;
	exports.Color = Color;
	exports.Component = Component;
	exports.Console = Console;
	exports.Context = Context;
	exports.Entity = Entity;
	exports.Event = Event;
	exports.Input = Input;
	exports.Jitter = Jitter;
	exports.Mat2 = Mat2;
	exports.Particle = Particle;
	exports.Physics = Physics;
	exports.Registry = Registry;
	exports.Renderer = Renderer;
	exports.Shims = Shims;
	exports.Transform = Transform;
	exports.Tweens = Tweens;
	exports.Vec2 = Vec2;
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports);
	}
})(function (exports) {
	"use strict";

	var Context = require("./context");
	var Component = require("./component");
	var Vec2 = require("../math/vec2");
	var Color = require("./color");

	function Catapult() {
		this.position = Vec2();
		this.color = Color();
		this.start = Vec2();
		this.end = Vec2();
		this.impulse = Vec2();
		this.impulseNorm = Vec2();
	}

	Catapult.prototype = {

		attributes: {
			position: Vec2(),
			color: Color.white
		},

		create: function create(attributes) {
			Vec2.copy(this.position, attributes.position);
			Color.copy(this.color, attributes.color);
			this.state = null;
			this.radius = 90;
			this.listenRadius = this.radius * 0.15;
			this.fireRadius = this.radius * 0.1;
			this.listenRadiusSq = this.listenRadius * this.listenRadius;
			Vec2.set(this.impulse);
		},

		update: function update(dt) {
			if (this.state === "fired") {
				this.entity.emit("onCatapultFire", this.impulseNorm);
			}

			var input = Context.input;

			switch (this.state) {
				case "active":
					switch (input.touchState) {
						case "moved":
							var end = Vec2.copy(cache, input.position);
							Vec2.limit(Vec2.sub(end, this.start, this.impulse), this.radius);
							if (Vec2.len(this.impulse) < this.fireRadius) {
								Vec2.set(this.impulse);
							}
							Vec2.scale(this.impulse, 1 / this.radius, this.impulseNorm);
							break;

						case "ended":
							if (Vec2.dist(this.start, input.position) < this.fireRadius) {
								this.state = null;
							} else {
								this.state = "fired";
							}
					}
					break;

				case "fired":
					this.state = null;
					break;

				default:
					if (input.touchState === "began" && Vec2.distSq(input.position, this.position) <= this.listenRadiusSq) {
						this.state = "active";
						Vec2.copy(this.start, input.position);
						Vec2.set(this.impulse);
						Vec2.set(this.impulseNorm);
					}
					break;
			}
		},

		render: function render(ctx) {
			var active = this.state === "active";
			var pos = this.position;

			this.color[3] = active ? 1 : 0.3;

			ctx.strokeStyle = Color.rgba(this.color);
			ctx.beginPath();
			ctx.arc(pos[0] | 0, pos[1] | 0, this.listenRadius, 0, Math.TAU, true);
			ctx.closePath();
			ctx.stroke();

			if (active) {
				var target = Vec2.add(pos, this.impulse, cache);
				ctx.lineWidth = 1;
				this.color[3] = 0.5;
				ctx.strokeStyle = Color.rgba(this.color);
				this.color[3] = 0.2;
				ctx.fillStyle = Color.rgba(this.color);
				ctx.beginPath();
				ctx.arc(target[0] | 0, target[1] | 0, this.fireRadius, 0, Math.TAU, true);
				ctx.closePath();
				ctx.stroke();
				ctx.fill();
			}
		}

	};

	var cache = Vec2();

	new Component("catapult", Catapult);

	module.exports = Catapult;
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports", "./component", "./registry", "../math/color", "../math/mathf", "../math/vec2", "../math/random"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports, require("./component"), require("./registry"), require("../math/color"), require("../math/mathf"), require("../math/vec2"), require("../math/random"));
	}
})(function (exports, _component, _registry, _mathColor, _mathMathf, _mathVec2, _mathRandom) {
	"use strict";

	var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

	var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

	/**
  * Intersection circle/point
  * http://www.openprocessing.org/user/54
  * @param {Number[]} center
  * @param {Number} radius
  * @param {Number[]} point
  * @return {Boolean}
  */
	exports.circleContains = circleContains;

	/**
  * Intersection rectangle/point
  * @param {Number[]} topLeft
  * @param {Number[]} size
  * @param {Number[]} point
  * @return {Boolean}
  */
	exports.rectangleContains = rectangleContains;

	/**
  * Closes point to a line
  * http://blog.generalrelativity.org/actionscript-30/collision-detection-circleline-segment-circlecapsule/
  * @param {Number[]} a Line P1
  * @param {Number[]} b Line P2
  * @param {Number[]} point Point
  * @param {Number[]} result Result
  * @return {Number[]} Result
  */
	exports.closestLinePoint = closestLinePoint;

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
	exports.intersectLineCircle = intersectLineCircle;

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
	exports.intersectCircleRectangle = intersectCircleRectangle;

	/**
  * Intersection rectangle/rectangle
  *
  * @param {Number[]} pos
  * @param {Number[]} size
  * @param {Number[]} topLeft2
  * @param {Number[]} size2
  * @return {Boolean}
  */
	exports.intersectRectangle = intersectRectangle;

	/**
  * Random point in rectangle
  */
	exports.randomPointInRectangle = randomPointInRectangle;

	var Component = _interopRequire(_component);

	var Registry = _interopRequire(_registry);

	var Color = _interopRequire(_mathColor);

	var clamp = _mathMathf.clamp;
	var TAU = _mathMathf.TAU;

	var Vec2 = _interopRequire(_mathVec2);

	var random = _mathRandom.random;

	var _position = Vec2();

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

	var Bounds = (function (_Component) {
		function Bounds() {
			_classCallCheck(this, Bounds);

			Component.call(this);
			this.shape = "rect";
			this.radius = 0;
			this._size = Vec2();
			this._anchor = Vec2();
			this._topLeft = Vec2();
			this._bottomRight = Vec2();
			this._position = _position;
		}

		_inherits(Bounds, _Component);

		_createClass(Bounds, {
			create: {
				value: function create() {
					this._position = this.components.transform.position;
				}
			},
			attributes: {
				get: function () {
					return {
						shape: "rect",
						radius: 0,
						size: Vec2(),
						anchor: Vec2.center
					};
				}
			},
			intersectLine: {
				value: function intersectLine(a1, a2, result) {
					if (this.shape == "circle") {
						return intersectLineCircle(a1, a2, this._position, this.radius, result);
					}
					return false;
				}
			},
			contains: {
				value: function contains(point) {
					if (this.shape == "circle") {
						return circleContains(this._position, this.radius, point);
					}
					return rectangleContains(this.topLeft, this._size, point);
				}
			},
			intersectRect: {
				value: function intersectRect(topLeft, size) {
					if (this.shape == "circle") {
						return intersectCircleRectangle(topLeft, size, this._position, this.radius);
					}
					return intersectRectangle(this.topLeft, this._size, topLeft, size);
				}
			},
			top: {
				get: function () {
					if (this.shape == "circle") {
						return this._position[1] - this.radius;
					}
					return this._position[1] - this._size[1] * this._anchor[1];
				}
			},
			bottom: {
				get: function () {
					if (this.shape == "circle") {
						return this._position[1] + this.radius;
					}
					return this._position[1] + this._size[1] * this._anchor[1];
				}
			},
			left: {
				get: function () {
					if (this.shape == "circle") {
						return this._position[0] - this.radius;
					}
					return this._position[0] - this._size[0] * this._anchor[0];
				}
			},
			right: {
				get: function () {
					if (this.shape == "circle") {
						return this._position[0] + this.radius;
					}
					return this._position[0] + this._size[0] * this._anchor[0];
				}
			},
			width: {
				get: function () {
					if (this.shape == "circle") {
						return this.radius * 2;
					}
					return this._size[0];
				}
			},
			height: {
				get: function () {
					if (this.shape == "circle") {
						return this.radius * 2;
					}
					return this._size[1];
				}
			},
			topLeft: {
				get: function () {
					return Vec2.sub(this._position, Vec2.mul(this._size, this._anchor, this._topLeft), this._topLeft);
				}
			},
			bottomRight: {
				get: function () {
					return Vec2.add(this._position, Vec2.mul(this._size, this._anchor, this._bottomRight), this._topLeft);
				}
			}
		});

		return Bounds;
	})(Component);

	exports["default"] = Bounds;

	Vec2.defineProperty(Bounds, "size");
	Vec2.defineProperty(Bounds, "anchor");

	Component.create(Bounds, "bounds");

	var v = Vec2();
	var w = Vec2();
	var lineCircTest = Vec2();
	function circleContains(center, radius, point) {
		return Vec2.distSq(point, center) <= radius * radius;
	}

	function rectangleContains(topLeft, size, point) {
		return topLeft[0] - size[0] < point[0] && topLeft[1] < point[1] && topLeft[0] + size[0] > point[0] && topLeft[1] + size[1] > point[1];
	}

	function closestLinePoint(a, b, point, result) {
		Vec2.sub(b, a, v);
		Vec2.sub(point, a, w);
		var t = Mathf.clamp(Vec2.dot(w, v) / Vec2.dot(v, v), 0, 1);
		return Vec2.add(a, Vec2.scale(v, t, result));
	}

	function intersectLineCircle(a, b, center, radius, result) {
		closestLinePoint(a, b, center, lineCircTest);
		Vec2.sub(lineCircTest, center);
		if (Vec2.dot(lineCircTest, lineCircTest) > radius * radius) {
			return false;
		}
		if (!result) {
			return true;
		}
		return Vec2.copy(result, lineCircTest);
	}

	function intersectCircleRectangle(topLeft, size, center, radius) {
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
	}

	function intersectRectangle(topLeft, size, topLeft2, size2) {
		return !(topLeft[0] > topLeft2[0] + size2[0] || topLeft[0] + size[0] < topLeft2[0] || topLeft[1] > topLeft2[1] + size2[1] || topLeft[1] + size[1] < topLeft2[1]);
	}

	function randomPointInRectangle(point, pos, size) {
		Vec2.set(point, random(0, size[0]), random(0, size[1]));
		return Vec2.add(point, pos);
	}

	/*
 getAabb() {
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

	/***
  * Intersection line/rectangle
  *
 export function lineRect(point1, point2, topLeft, size) {
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
 
 	let topoverlap: Number;
 	let botoverlap: Number;
 
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
 export function lineCirc(point1, point2, center, radius) {
 	let a, b, bb4ac, c, dx, dy, ia1[0], ia2[0], ia1[1], ia2[1], mu, testX, testY;
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
 export function intersectLine(a1, a2, b1, b2, result) {
 	if (!result) {
 		// http://www.bryceboe.com/2006/10/23/line-segment-intersection-algorithm/comment-page-1/
 		return ccw(a1, b1, b2) != ccw(a2, b1, b2) &&
 			ccw(a1, a2, b1) != ccw(a1, a2, b2);
 	}
 
 	// http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect/1968345#1968345
 	let s1_x = a2[0] - a1[0];
 	let s1_y = a2[1] - a1[1];
 	let s2_x = b2[0] - b1[0];
 	let s2_y = b2[1] - b1[1];
 
 	let s = (-s1_y * (a1[0] - b1[0]) + s1_x * (a1[1] - b1[1])) / (-s2_x * s1_y + s1_x * s2_y);
 	let t = (s2_x * (a1[1] - b1[1]) - s2_y * (a1[0] - b1[0])) / (-s2_x * s1_y + s1_x * s2_y);
 
 	// Collision detected
 	if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
 		return Vec2.set(result, a1[0] + (t * s1_x), a1[1] + (t * s1_y));
 	}
 	return null;
 };
 
 function ccw(a, b, c) {
 	let cw = ((c[1] - a[1]) * (b[0] - a[0])) - ((b[1] - a[1]) * (c[0] - a[0]));
 	return (cw > 0) ? true : cw < 0 ? false : true; // colinear
 }
 */

	/**
  * @class  Debug
  * Outlines the boundaries and angle of an entity.
  * @extends Component
  */

	var BoundsDebug = (function (_Component2) {
		function BoundsDebug() {
			_classCallCheck(this, BoundsDebug);

			Component.call(this);
			this._color = Color();
		}

		_inherits(BoundsDebug, _Component2);

		_createClass(BoundsDebug, {
			attributes: {
				get: function () {
					return {
						color: Color.gray,
						opacity: 0.5,
						fill: false
					};
				}
			}
		});

		return BoundsDebug;
	})(Component);

	Color.defineProperty(BoundsDebug, "color");

	/*
 FIXME: Convert to sprite
 export function ctx) {
 	let bounds = this.components.bounds;
 	ctx.save();
 	if (this.fill) {
 		ctx.fillStyle = Color.rgba(this.color, this.opacity * 0.5);
 	}
 	ctx.strokeStyle = Color.rgba(this.color, this.opacity);
 	ctx.lineWidth = 1;
 	this._position(ctx);
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
 		let size = bounds._size;
 		ctx.strokeRect(-size[0] / 2 | 0, -size[1] / 2 | 0, size[0] | 0, size[1] | 0);
 		if (this.fill) {
 			ctx.fillRect(-size[0] / 2 | 0, -size[1] / 2 | 0, size[0] | 0, size[1] | 0);
 		}
 	}
 	ctx.restore();
 };
 */

	Component.create(BoundsDebug, "boundsDebug");
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports", "module", "./registry", "./event", "./entity"], factory);
	} else if (typeof exports !== "undefined" && typeof module !== "undefined") {
		factory(exports, module, require("./registry"), require("./event"), require("./entity"));
	}
})(function (exports, module, _registry, _event, _entity) {
	"use strict";

	var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

	var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

	/** @flow */

	var Registry = _interopRequire(_registry);

	var Event = _interopRequire(_event);

	var Entity = _interopRequire(_entity);

	var ComponentMap = _entity.ComponentMap;

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
  */

	var Component = (function () {
		function Component() {
			_classCallCheck(this, Component);

			this.uid = 0;
			this.enabled = false;
			this.allocated = false;
			this.destroyed = false;
			this.entity = emptyEntity;
			this.parent = emptyEntity;
			this.root = emptyEntity;
			this.components = emptyComponentMap;
			this.listenersRef = new Set();
		}

		_createClass(Component, {
			toString: {

				/**
     * Brief summary.
     * @private
     * @return {String}
     */

				value: function toString() {
					return "" + this.type + " #" + this.uid + " [^ " + this.entity + "]";
				}
			},
			allocate: {

				/**
     * Allocate Component.
     * @private
     */

				value: function allocate() {
					var entity = this.parent;
					var components = entity.components;
					if (components.types.has(this.type)) {
						throw new Error("Component " + this.type + " already allocated for " + entity);
					}
					components[this.type] = this;
					components.types.add(this.type);
					this.components = components;
					this.entity = entity;
					this.create();
					var event = Event.create(this.type + "Create");
					event.aggregate = true;
					event.cancelable = true;
					this.emit(event);
				}
			},
			destroy: {

				/**
     * Destroy Component, removes it from {@link Entity}.
     */

				value: function destroy() {
					if (this.destroyed) {
						return;
					}
					this.destroyed = true;
					var event = Event.create(this.type + "Destroy");
					event.aggregate = true;
					event.cancelable = false;
					this.emit(event);
					this.enabled = false;
					this.registry.destroy(this);
				}
			},
			deallocate: {

				/**
     * Free destroyed Component.
     * @private
     */

				value: function deallocate() {
					if (!this.allocated) {
						throw new Error("Component already deallocated");
					}
					this.allocated = false;
					this.destroyed = false;
					this.free();
					var refs = this.listenersRef;
					var _iteratorNormalCompletion = true;
					var _didIteratorError = false;
					var _iteratorError = undefined;

					try {
						for (var _iterator = refs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
							var ref = _step.value;

							if (ref.allocated) {
								ref.off(this);
							}
						}
					} catch (err) {
						_didIteratorError = true;
						_iteratorError = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion && _iterator["return"]) {
								_iterator["return"]();
							}
						} finally {
							if (_didIteratorError) {
								throw _iteratorError;
							}
						}
					}

					refs.clear();
					this.components[this.type] = null;
					this.components.types["delete"](this.type);
					// Clear reference to entity.components
					this.components = emptyComponentMap;
					this.entity = emptyEntity;
					this.root = emptyEntity;
					this.parent = emptyEntity;
				}
			},
			free: {
				value: function free() {}
			},
			create: {
				value: function create() {}
			},
			enable: {
				value: function enable(state) {
					if (state == null) {
						state = !this.enabled;
					}
					this.emit(Event.create("component" + (state ? "Enable" : "Disable")));
					this.enabled = state;
				}
			},
			emit: {
				value: function emit(event, detail) {
					return this.entity.emit(event, this, detail);
				}
			}
		}, {
			create: {
				value: function create(cls, type) {
					var proto = cls.prototype;
					if (!Component.prototype.isPrototypeOf(proto)) {
						(function () {
							var descriptors = {};
							Object.getOwnPropertyNames(proto).forEach(function (name) {
								descriptors[name] = Object.getOwnPropertyDescriptor(proto, name);
							});
							if (type != null) {
								descriptors.type = {
									value: type
								};
							}
							cls.prototype = Object.create(Component.prototype, descriptors);
							cls.prototype.constructor = cls;
						})();
					} else if (type) {
						proto.type = type;
					} else {
						type = proto.type;
					}
					ComponentMap.types.add(proto.type);
					Registry.create(cls);
				}
			}
		});

		return Component;
	})();

	module.exports = Component;

	Component.prototype.type = "component";
});

// override me

// override me
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports", "module", "./entity", "./registry", "./event", "./shims"], factory);
	} else if (typeof exports !== "undefined" && typeof module !== "undefined") {
		factory(exports, module, require("./entity"), require("./registry"), require("./event"), require("./shims"));
	}
})(function (exports, module, _entity, _registry, _event, _shims) {
	"use strict";

	var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

	var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

	var Entity = _interopRequire(_entity);

	var Registry = _interopRequire(_registry);

	var Event = _interopRequire(_event);

	var perf = _shims.performance;
	var raFrame = _shims.requestAnimationFrame;

	/**
  * @class Context
  * Managing renderer, scene and loop
  * @extends Entity
  */

	var Context = (function (_Entity) {
		function Context() {
			_classCallCheck(this, Context);

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
			this.enabled = true;

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

		_inherits(Context, _Entity);

		_createClass(Context, {
			init: {
				value: function init(element) {
					this.element = element;
					this.createComponent("input");
					this.createComponent("console");
				}
			},
			play: {

				/**
     * Set scene and start game loop
     * @param {Entity} scene
     * @param {Boolean} soft
     */

				value: function play(scene, soft) {
					var prev = this.scene;
					if (prev) {
						prev.emit(Event.create("sceneEnd", scene));
						prev.root = null;
						if (soft) {
							prev.enable(false, true);
						} else {
							prev.destroy();
						}
					}
					scene.root = this;
					this.scene = scene;
					this.scene.emit(Event.create("sceneStart", prev));
					this.start();
				}
			},
			start: {

				/**
     * Start loop
     */

				value: function start() {
					if (this.running) {
						return;
					}
					this.running = true;
					this.emit(Event.create("contextStart"));
					raFrame(this.tickBound);
				}
			},
			pause: {
				value: function pause() {
					if (!this.running) {
						return;
					}
					this.emit(Event.create("contextPause"));
					this.running = false;
				}
			},
			tick: {

				/**
     * Game loop tick, called by requestAnimationFrame
     *
     * @param {Number} time Delta time
     */

				value: function tick(time) {
					// Time value in seconds
					time = (time != null && time < 1000000000000 ? time : perf.now()) / 1000;
					this.time = time;
					// rfa here to be less error prone

					var i = 0;
					var l = 0;
					var methods = [];
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
							var fixedUpdates = Registry.methods.fixedUpdate;
							for (i = 0, l = fixedUpdates.length; i < l; i++) {
								if (fixedUpdates[i].enabled) {
									fixedUpdates[i].fixedUpdate(fdt);
								}
							}
							var simulates = Registry.methods.simulate;
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
						var updates = Registry.methods.update;
						for (i = 0, l = updates.length; i < l; i++) {
							if (updates[i].enabled) {
								updates[i].update(dt);
							}
						}

						Registry.free();
						Vec2.sweep();

						// Invoke postUpdate
						var postUpdates = Registry.methods.postUpdate;
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
						var preRenders = Registry.methods.preRender;
						for (i = 0, l = preRenders.length; i < l; i++) {
							if (preRenders[i].enabled) {
								preRenders[i].preRender(dt);
							}
						}

						var ctx = this.renderer.save();
						// Invoke render
						var renders = Registry.methods.render;
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
						var event = Event.create("timeEnd", samples);
						this.emit(event, samples);
					}

					if (this.running) {
						if (this.rfa) {
							raFrame(this.tickBound);
						} else {
							perf.nextTick(this.tickBound);
						}
					}
				}
			}
		});

		return Context;
	})(Entity);

	;

	Context.prototype.type = "context";

	// Singleton
	var context = new Context();

	module.exports = context;

	// Debugging hooks
	if (typeof window != "undefined" && window.console) {
		console.acme = console.acme || (console.acme = {});
		console.acme.context = context;
		console.acme.profile = function (frames) {
			if (frames == null) {
				frames = 60;
			}
			context.debug.profile = frames;
			return null;
		};
		console.acme.step = function () {
			context.debug.step = !context.debug.step;
			return null;
		};
	}
});

// debugger; // jshint ignore:line
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports", "./registry", "./event"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports, require("./registry"), require("./event"));
	}
})(function (exports, _registry, _event) {
	"use strict";

	var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

	var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

	/** @flow */

	var Registry = _interopRequire(_registry);

	var Event = _interopRequire(_event);

	Event.registerTypeOnly("enable");
	Event.registerTypeOnly("disable");

	/**
  * @class Entity
  * Entities are containers that have components attached and act as event hub.
  * With parent and children, they can be organized into a hierachy
  *
  * @abstract
  * @property {Boolean} enabled False when disabled or not allocated. Never act on disabled components!
  * @property {Entity|null} parent Parent entity
  * @property {Entity|null} root Scene entity
  */

	var Entity = (function () {
		function Entity() {
			_classCallCheck(this, Entity);

			this.type = "entity";
			this.uid = 0;
			this.enabled = false;
			this.allocated = false;
			this.parent = null;
			this.root = null;
			this.components = new ComponentMap();
			this.listeners = new Map();
			this.listenersRef = new Set();
			this.prefab = "";
			this.next = null;
			this.firstChild = null;
		}

		_createClass(Entity, {
			toString: {

				/**
     * Brief summary
     * @private
     * @return {String}
     */

				value: function toString() {
					var comps = this.componentKeys.join(", ");
					var parent = this.parent ? " [^ " + this.parent + "]" : "";
					return "Entity " + this.prefab + " #" + this.uid + " (" + comps + ")" + parent;
				}
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
				}
			},
			createComponent: {

				/**
     * Add {@link Component} to Entity
     * @param {String} type Component type
     * @param  {Object} attributes (optional) Override component attributes
     * @return {Component}
     */

				value: function createComponent(type, attributes) {
					var registry = Registry.types[type];
					if (registry == null) {
						throw new Error("Unknown component \"" + type + "\" for " + this);
					}
					return registry.allocate(this, attributes);
				}
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
						return Prefab.create(prefabId, this, attributes);
					}
					return Entity.create(this, prefabId);
				}
			},
			hasComponent: {

				/**
     * Match Entity against a list of {@link Component} types.
     * @param {Array|String} selector {@link Component} type(s)
     * @return {Boolean}
     */

				value: function hasComponent(selector) {
					return this.components.types.has(selector);
				}
			},
			hasComponents: {
				value: function hasComponents(selectors) {
					var _iteratorNormalCompletion = true;
					var _didIteratorError = false;
					var _iteratorError = undefined;

					try {
						for (var _iterator = selectors[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
							var selector = _step.value;

							if (!this.components.types.has(selector[i])) {
								return false;
							}
						}
					} catch (err) {
						_didIteratorError = true;
						_iteratorError = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion && _iterator["return"]) {
								_iterator["return"]();
							}
						} finally {
							if (_didIteratorError) {
								throw _iteratorError;
							}
						}
					}

					return true;
				}
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
				}
			},
			destroy: {

				/**
     * Destroy Entity, including children and components.
     */

				value: function destroy() {
					if (this.destroyed) {
						return;
					}
					this.destroyed = true;
					this.enabled = false;
					this.registry.destroy(this);
					var types = this.components.types;
					var _iteratorNormalCompletion = true;
					var _didIteratorError = false;
					var _iteratorError = undefined;

					try {
						for (var _iterator = types[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
							var type = _step.value;

							this.components[type].destroy();
						}
					} catch (err) {
						_didIteratorError = true;
						_iteratorError = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion && _iterator["return"]) {
								_iterator["return"]();
							}
						} finally {
							if (_didIteratorError) {
								throw _iteratorError;
							}
						}
					}

					var child = this.firstChild;
					while (child) {
						child.destroy();
						child = child.next;
					}
				}
			},
			removeChild: {
				value: function removeChild(entity) {
					var child = this.firstChild;
					var prev = null;
					while (child) {
						if (child == entity) {
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
				}
			},
			deallocate: {

				/**
     * Free destroyed Entity.
     * @private
     */

				value: function deallocate() {
					// Remove referenced subscribers
					var refs = this.listenersRef;
					var _iteratorNormalCompletion = true;
					var _didIteratorError = false;
					var _iteratorError = undefined;

					try {
						for (var _iterator = refs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
							var ref = _step.value;

							if (ref.allocated) {
								ref.off(this);
							}
						}
					} catch (err) {
						_didIteratorError = true;
						_iteratorError = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion && _iterator["return"]) {
								_iterator["return"]();
							}
						} finally {
							if (_didIteratorError) {
								throw _iteratorError;
							}
						}
					}

					refs.clear();

					// Remove own subscribers
					this.listeners.clear();

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
					this.destroyed = false;
					this.root = null;
					this.parent = null;
				}
			},
			enable: {
				value: function enable(state, deep) {
					if (state == null) {
						state = !this.enabled;
					}
					this.emit(Event.create(state ? "enable" : "disable"));
					this.enabled = state;
					var _iteratorNormalCompletion = true;
					var _didIteratorError = false;
					var _iteratorError = undefined;

					try {
						for (var _iterator = this.components.types[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
							var type = _step.value;

							this.components[type].enable(state, true);
						}
					} catch (err) {
						_didIteratorError = true;
						_iteratorError = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion && _iterator["return"]) {
								_iterator["return"]();
							}
						} finally {
							if (_didIteratorError) {
								throw _iteratorError;
							}
						}
					}

					if (deep) {
						var child = this.firstChild;
						while (child != null) {
							child.enable(state, true);
							child = child.next;
						}
					}
				}
			},
			hasEvent: {

				/**
     * Has subscriber
     * @param {String} event Event name to listenerscribe to 'on*'
     */

				value: function hasEvent(name) {
					return this.listeners.has(name);
				}
			},
			on: {

				/**
     * Subscribe to event messages
     * @param {Entity|null} scope Target Entity for listenerscription
     * @param {String} name Event name to listenerscribe to 'on*'
     * @param {String} method (optional) Local method name to call, defaults to event name
     */

				value: function on(scope, name, method) {
					if (scope == null) {
						scope = this;
					}
					if (!this.listeners.has(name)) {
						this.listeners.set(name, []);
					}
					this.listeners.get(name).push(scope, method);
					if (scope != this) {
						scope.listenersRef.add(this);
					}
				}
			},
			emit: {

				/**
     * Publish a event message for this entity and it's parents
     * @param {String} event
     */

				value: function emit(type, component, detail) {
					var event = typeof type == "string" ? Event.create(type) : type;
					var entity = this;
					event.entity = entity;
					if (component != null) {
						event.component = component;
					}
					if (detail != null) {
						event.detail = detail;
					}
					var handler = event.handler;
					if (event.aggregate) {
						Registry.call(handler, event);
					} else {
						do {
							if (entity.enabled && entity.listeners.has(handler)) {
								// Invoke
								var listeners = entity.listeners.get(handler);
								var _i = listeners.length;
								while ((_i -= 2) >= 0) {
									var listener = listeners[_i];
									if (listener != null && listener.enabled) {
										listener[listeners[_i + 1] || handler](event);
									}
								}
								if (event.stopped) {
									break;
								}
							}
							if (!event.bubbles) {
								break;
							}
							entity = entity.parent || entity.root; // Context.scene has .root
						} while (entity);
					}
					var canceled = event.canceled;
					event.destroy();
					return !canceled;
				}
			},
			off: {

				/**
     * Unsubscribe scope from event
     * @param {Entity|Component} unscope (optional) Subscriber scope to remove
     */

				value: function off(unscope) {
					var listeners = this.listeners;
					var _iteratorNormalCompletion = true;
					var _didIteratorError = false;
					var _iteratorError = undefined;

					try {
						for (var _iterator = listeners[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
							var items = _step.value;

							var _i = items.length;
							var _length = _i / 2;
							while ((_i -= 2) >= 0) {
								if (items[_i] != null && (!unscope || unscope === items[_i])) {
									items[_i] = null;
									_length--;
								}
							}
							if (_length === 0) {
								listeners["delete"](name);
							}
						}
					} catch (err) {
						_didIteratorError = true;
						_iteratorError = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion && _iterator["return"]) {
								_iterator["return"]();
							}
						} finally {
							if (_didIteratorError) {
								throw _iteratorError;
							}
						}
					}
				}
			}
		}, {
			create: {
				value: function create(parent, attributes) {
					return Entity.registry.allocate(parent, attributes);
				}
			},
			createPrefab: {
				value: function createPrefab(id, components) {
					return new Prefab(id, components);
				}
			},
			reset: {
				value: function reset() {
					Prefab.byId = {};
				}
			}
		});

		return Entity;
	})();

	exports["default"] = Entity;

	Entity.prototype.type = "entity";
	Registry.create(Entity);

	/**
  * @class
  * @constructor
  * @param {String} id Prefab Id
  * @param {Object} components Default attributes
  */

	var Prefab = exports.Prefab = (function () {
		function Prefab(id, components) {
			_classCallCheck(this, Prefab);

			this.id = id;
			Prefab.byId[this.id] = this;
			this.components = components;
			this.types = new Set();
			this.subKeys = {};
			for (var type in components) {
				this.types.add(type);
				if (components[type] == null) {
					components[type] = {};
				}
				this.subKeys[type] = Object.keys(components[type]);
			}
		}

		_createClass(Prefab, {
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
						var keys = Object.getOwnPropertyNames(components);
						var types = this.types;
						var _iteratorNormalCompletion = true;
						var _didIteratorError = false;
						var _iteratorError = undefined;

						try {
							for (var _iterator = types[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
								var type = _step.value;

								var defaults = this.components[type];
								var overrides = defaults;
								var idx = keys.indexOf(type);
								if (idx != -1) {
									keys[idx] = null;
									overrides = components[type];
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
								}
								entity.createComponent(type, overrides);
							}
						} catch (err) {
							_didIteratorError = true;
							_iteratorError = err;
						} finally {
							try {
								if (!_iteratorNormalCompletion && _iterator["return"]) {
									_iterator["return"]();
								}
							} finally {
								if (_didIteratorError) {
									throw _iteratorError;
								}
							}
						}

						var _iteratorNormalCompletion2 = true;
						var _didIteratorError2 = false;
						var _iteratorError2 = undefined;

						try {
							for (var _iterator2 = keys[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
								var key = _step2.value;

								if (key != null) {
									entity.createComponent(key, components[key]);
								}
							}
						} catch (err) {
							_didIteratorError2 = true;
							_iteratorError2 = err;
						} finally {
							try {
								if (!_iteratorNormalCompletion2 && _iterator2["return"]) {
									_iterator2["return"]();
								}
							} finally {
								if (_didIteratorError2) {
									throw _iteratorError2;
								}
							}
						}
					}
					return entity;
				}
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
				}
			}
		}, {
			create: {

				/**
     * Allocate Prefab by Id
     * @static
     * @param {String} id Prefab Id
     * @param {Entity} parent Parent entity
     * @param {Object} components Override components
     * @return {Entity}
     */

				value: function create(id, parent, components) {
					var prefab = Prefab.byId[id];
					if (prefab == null) {
						throw new Error("Prefab \"" + id + "\" not found");
					}
					return prefab.create(parent, components);
				}
			}
		});

		return Prefab;
	})();

	;

	Entity.reset();

	var ComponentMap = exports.ComponentMap = (function () {
		function ComponentMap() {
			_classCallCheck(this, ComponentMap);

			this.types = new Set();
			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = ComponentMap.types[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var type = _step.value;

					this[type] = null;
				}
			} catch (err) {
				_didIteratorError = true;
				_iteratorError = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion && _iterator["return"]) {
						_iterator["return"]();
					}
				} finally {
					if (_didIteratorError) {
						throw _iteratorError;
					}
				}
			}
		}

		_createClass(ComponentMap, {
			get: {
				value: function get(type) {
					return this[type];
				}
			}
		});

		return ComponentMap;
	})();

	ComponentMap.types = new Set();
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports", "../math/mathf"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports, require("../math/mathf"));
	}
})(function (exports, _mathMathf) {
	"use strict";

	var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

	var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

	var uid = _mathMathf.uid;

	var Event = (function () {
		function Event(cancelable, aggregate) {
			_classCallCheck(this, Event);

			this.entity = null;
			this.component = null;
			this.uid = uid();
			this.bubbles = true;
			this.aggregate = aggregate ? true : false;
			this.cancelable = cancelable ? true : false;
			this.timeStamp = Date.now();
			this.canceled = false;
			this.stopped = false;
			this.detail = null;
		}

		_createClass(Event, {
			toString: {
				value: function toString() {
					return "Event " + this.type + " [" + this.component + " on " + this.entity + "]";
				}
			},
			destroy: {
				value: function destroy() {
					this.entity = null;
					this.component = null;
					this.detail = null;
					this.registry.destroy(this);
				}
			},
			cancel: {
				value: function cancel() {
					if (this.cancelable) {
						this.cancel = true;
					}
				}
			},
			stop: {
				value: function stop() {
					this.stopped = true;
				}
			}
		}, {
			create: {
				value: function create(type, detail) {
					var event = Registry.create(Event.toType(type));
					if (detail != null) {
						event.detail = detail;
					}
					return event;
				}
			},
			register: {
				value: function register(cls, type) {
					type = Event.toType(type);
					cls.type = type;
					cls.prototype.type = type;
					cls.prototype.handler = Event.toHandler(type);
					return new Registry(cls);
				}
			},
			registerTypeOnly: {
				value: function registerTypeOnly(type) {
					var CustomEvent = (function (_Event) {
						function CustomEvent() {
							_classCallCheck(this, CustomEvent);

							Event.call(this);
						}

						_inherits(CustomEvent, _Event);

						return CustomEvent;
					})(Event);

					return Event.register(CustomEvent, type);
				}
			},
			toHandler: {
				value: function toHandler(str) {
					if (/^on/.test(str)) {
						return str;
					}
					return "on" + str.charAt(0).toUpperCase() + str.slice(1);
				}
			},
			toType: {
				value: function toType(str) {
					if (!/^on/.test(str)) {
						return str;
					}
					return str.charAt(2).toLowerCase() + str.slice(3);
				}
			}
		});

		return Event;
	})();

	exports["default"] = Event;

	var Registry = exports.Registry = (function () {
		function Registry(cls) {
			_classCallCheck(this, Registry);

			this.cls = cls;
			var proto = cls.prototype;
			var type = proto.type;
			if (Registry.types[type] != null) {
				throw new Error("Event '" + type + "' is already registered");
			}
			this.type = type;
			Registry.types[type] = this;
			cls.registry = this;
			proto.registry = this;
			this.pool = [];
			this.allocated = 0;
			this.length = 0;
		}

		_createClass(Registry, {
			create: {
				value: function create() {
					if (this.allocated == 0) {
						this.length++;
						return new this.cls();
					}
					this.allocated--;
					var instance = this.pool.pop();
					this.cls.call(instance);
					return instance;
				}
			},
			destroy: {
				value: function destroy(instance) {
					this.allocated++;
					this.pool.push(instance);
				}
			}
		}, {
			create: {
				value: function create(type) {
					var registry = Registry.types[type];
					if (registry == null) {
						// console.warn(`Event '${type}' created on demand`);
						registry = Event.registerTypeOnly(type);
					}
					return registry.create();
				}
			},
			dump: {
				value: function dump() {
					var types = Registry.types;
					console.group("Events.dump");
					for (var type in types) {
						var registry = types[type];
						console.log("%s: %d/%d allocated", type, registry.length - registry.allocated, registry.length);
					}
					console.groupEnd("Events.dump");
				}
			}
		});

		return Registry;
	})();

	Registry.types = {};

	Event.register(Event, "event");

	if (typeof window != "undefined" && window.console) {
		console.acme = console.acme || (console.acme = {});
		console.acme.dumpEvents = function () {
			Registry.dump();
			return null;
		};
	}
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports", "./component", "../math/vec2", "./context", "./event"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports, require("./component"), require("../math/vec2"), require("./context"), require("./event"));
	}
})(function (exports, _component, _mathVec2, _context, _event) {
	"use strict";

	var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

	var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

	var Component = _interopRequire(_component);

	var Vec2 = _interopRequire(_mathVec2);

	var Context = _interopRequire(_context);

	var Event = _interopRequire(_event);

	var onKeyBegan = (function (_Event) {
		function onKeyBegan() {
			_classCallCheck(this, onKeyBegan);

			Event.call(this, true, true);
			this.key = "";
		}

		_inherits(onKeyBegan, _Event);

		return onKeyBegan;
	})(Event);

	Event.register(onKeyBegan, "keyBegan");

	var onKeyEnded = (function (_Event2) {
		function onKeyEnded() {
			_classCallCheck(this, onKeyEnded);

			Event.call(this, true, true);
			this.key = "";
		}

		_inherits(onKeyEnded, _Event2);

		return onKeyEnded;
	})(Event);

	Event.register(onKeyEnded, "keyEnded");

	var onTouchBegan = (function (_Event3) {
		function onTouchBegan() {
			_classCallCheck(this, onTouchBegan);

			Event.call(this, true, true);
			this.index = 0;
		}

		_inherits(onTouchBegan, _Event3);

		return onTouchBegan;
	})(Event);

	Event.register(onTouchBegan, "touchBegan");

	var onTouchEnded = (function (_Event4) {
		function onTouchEnded() {
			_classCallCheck(this, onTouchEnded);

			Event.call(this, true, true);
			this.index = 0;
		}

		_inherits(onTouchEnded, _Event4);

		return onTouchEnded;
	})(Event);

	Event.register(onTouchEnded, "touchEnded");

	/**
  * @class Input
  * Input handling for mouse, touch, keyboard and hardware sensors
  *
  * @extends Component
  */

	var Input = (function (_Component) {
		function Input() {
			_classCallCheck(this, Input);

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

			this.events = SUPPORT.touch ? {
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

		_inherits(Input, _Component);

		_createClass(Input, {
			attach: {
				value: function attach() {
					if (this.attached) {
						return;
					}
					if (typeof window == "undefined") {
						return;
					}
					this.attached = true;
					for (var type in this.events) {
						window.addEventListener(type, this, false);
					}
					this.queue.length = 0;
				}
			},
			detach: {
				value: function detach() {
					if (!this.attached) {
						return;
					}
					this.attached = false;
					for (var type in this.events) {
						window.removeEventListener(type, this, false);
					}
				}
			},
			handleEvent: {
				value: function handleEvent(event) {
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
				}
			},
			keyStart: {
				value: function keyStart(keyEvent) {
					var key = this.map[keyEvent.keyCode];
					if (key && !this.keys[key]) {
						if (!this.lock("key-" + key)) {
							return false;
						}
						var _event = Event.create("keyBegan");
						_event.key = key;
						this.emit(_event);
						this.keys[key] = "began";
						this.updateAxis(key);
					}
				}
			},
			keyEnd: {
				value: function keyEnd(keyEvent) {
					var key = this.map[keyEvent.keyCode];
					if (key) {
						if (!this.lock("key-" + key)) {
							return false;
						}
						var _event = Event.create("keyEnded");
						_event.key = key;
						this.emit(_event);
						this.keys[key] = "ended";
						this.updateAxis(key, true);
					}
				}
			},
			startTouch: {
				value: function startTouch(touchEvent) {
					if (!this.lock("touch")) {
						return false;
					}
					this.resolve(touchEvent);
					if (!this.touchState && !touchEvent.metaKey) {
						this.touchState = "began";
						var _event = Event.create("touchBegan");
						this.emit(_event);
					}
				}
			},
			moveTouch: {
				value: function moveTouch(touchEvent) {
					var state = this.touchState;
					if ((state === "began" || state === "ended") && !this.lock("touch")) {
						return false;
					}
					this.resolve(touchEvent);
					if (state && state !== "ended" && state !== "moved") {
						this.touchState = "moved";
					}
				}
			},
			endTouch: {
				value: function endTouch(touchEvent) {
					if (!this.lock("touch")) {
						return false;
					}
					this.resolve(touchEvent);
					if (this.touchState && (!SUPPORT.touch || !touchEvent.targetTouches.length)) {
						this.touchState = "ended";
						var _event = Event.create("touchEnded");
						this.emit(_event);
					}
				}
			},
			updateAxis: {
				value: function updateAxis(key, ended) {
					var axis = this.axisMap[key];
					if (axis) {
						if (ended) {
							this.axis[axis[0]] -= axis[1];
						} else {
							this.axis[axis[0]] += axis[1];
						}
					}
				}
			},
			blur: {
				value: function blur() {
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
				}
			},
			calibrateOrientation: {
				value: function calibrateOrientation() {
					this.baseOrientationTime = this.orientationTime;
					Vec2.copy(this.baseOrientation, this.orientation);
					Vec2.set(this.orientation);
				}
			},
			deviceOrientation: {
				value: function deviceOrientation(event) {
					Vec2.copy(this.lastOrientation, this.orientation);
					Vec2.sub(Vec2.set(this.orientation, event.gamma | 0, event.beta | 0), this.baseOrientation);
					this.orientationTime = event.timeStamp / 1000;
					if (!this.baseOrientationTime) {
						this.calibrateOrientation();
					}
				}
			},
			resolve: {
				value: function resolve(event) {
					var coords = SUPPORT.touch ? event.targetTouches[0] : event;
					if (coords) {
						this.lastTime = this.time;
						this.time = event.timeStamp / 1000;
						Vec2.copy(this.lastPos, this.position);
						var renderer = Context.renderer;
						Vec2.set(this.position, (coords.pageX - renderer.margin[0]) / renderer.scale | 0, (coords.pageY - renderer.margin[1]) / renderer.scale | 0);
						return true;
					}
					return false;
				}
			},
			lock: {
				value: function lock(key) {
					if (this.locks[key] === this.frame) {
						return false;
					}
					this.locks[key] = this.frame;
					return true;
				}
			},
			postUpdate: {
				value: function postUpdate() {
					switch (this.touchState) {
						case "began":
							this.touchState = "stationary";
							break;
						case "ended":
							this.touchState = "";
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

					this.frame = Context.frame;

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
				}
			},
			onContextPause: {
				value: function onContextPause() {
					this.detach();
				}
			},
			onContextStart: {
				value: function onContextStart() {
					this.attach();
				}
			}
		});

		return Input;
	})(Component);

	;

	var SUPPORT = {};
	if (typeof window != "undefined") {
		SUPPORT.touch = "ontouchstart" in window;
		SUPPORT.orientation = "ondeviceorientation" in window;
	}

	Component.create(Input, "input");
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports", "module", "../math/mathf"], factory);
	} else if (typeof exports !== "undefined" && typeof module !== "undefined") {
		factory(exports, module, require("../math/mathf"));
	}
})(function (exports, module, _mathMathf) {
	"use strict";

	var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

	/* @flow weak */

	/**
  * @todo [description]
  */

	var uid = _mathMathf.uid;
	// EntityLike | ComponentLike;

	/**
  * Registry
  * @class
  * @param {Object} cls Class to registry
  */

	var Registry = (function () {
		function Registry(cls) {
			_classCallCheck(this, Registry);

			this.cls = cls;
			var proto = cls.prototype;
			this.instances = [];
			this.enabled = false;
			this.allocated = 0;
			this.instantiated = 0;
			var type = proto.type;
			this.type = type;
			if (Registry.types[type] != null) {
				console.warn("Registry \"%s\" was overridden with ", type, cls);
			}
			Registry.types[type] = this;
			typeIndex.add(type);

			this.events = [];
			this.methods = [];
			this.attributes = {};
			this.attributeKeys = [];

			this.isComponent = type != "entity";
			if (this.isComponent) {
				var _attributes = proto.attributes || cls.attributes;
				if (_attributes != null) {
					this.attributes = _attributes;
					this.attributeKeys = Object.keys(_attributes);
				}
				var keys = Object.getOwnPropertyNames(proto).concat(Object.keys(cls));
				var fn = "";
				var i = 0;
				var l = 0;
				for (l = keys.length; i < l; i++) {
					fn = keys[i];
					if (/^on[A-Z]/.test(fn)) {
						if (methodsIndex.indexOf(fn) === -1) {
							methodsIndex.push(fn);
							Registry.methods[fn] = [];
						}
						this.events.push(fn);
					}
				}
				for (i = 0, l = methodsIndex.length; i < l; i++) {
					fn = methodsIndex[i];
					if (cls[fn] != null) {
						Registry.methods[fn].push(cls);
					} else if (proto[fn] != null) {
						this.methods.push(fn);
					}
				}
			}
			cls.enabled = false;
			cls.registry = this;
			proto.registry = this;
		}

		_createClass(Registry, {
			toString: {

				/**
     * Brief summary.
     *
     * @return {String}
     */

				value: function toString() {
					return "Registry " + this.type + " [" + this.allocated + "/" + this.instantiated + "]";
				}
			},
			push: {
				value: function push() {
					this.instantiated++;
					instantiated++;
					var instance = new this.cls();
					this.instances.push(instance);
					// Register instance callbacks
					var methods = this.methods;
					for (var i = 0, l = methods.length; i < l; i++) {
						Registry.methods[methods[i]].push(instance);
					}
					return instance;
				}
			},
			deinstantiate: {
				value: function deinstantiate(instance) {
					var methods = this.methods;
					for (var i = 0, l = methods.length; i < l; i++) {
						var list = Registry.methods[methods[i]];
						list.splice(list.indexOf(instance), 1);
					}
				}
			},
			pop: {
				value: function pop() {
					var l = this.instantiated;
					if (this.allocated == l) {
						return this.push();
					}
					var instances = this.instances;
					for (var i = 0; i < l; i++) {
						if (!instances[i].allocated) {
							return instances[i];
						}
					}
				}
			},
			allocate: {

				/**
     * Allocate a new instance from free registry or by creating. The provided attributes are merged with the default attributes.
     * @param {Entity} parent (optional) Parent class
     * @param {Object} attributes (optional) Attributes object
     * @return {Object}
     */

				value: function allocate(parent, attributes) {
					// Get free or create new instance
					var instance = this.pop();
					this.allocated++;
					allocated++;
					this.enabled = true;
					this.cls.enabled = true;
					var id = uid();
					instance.uid = id;
					instance.enabled = true;
					instance.allocated = true;
					instance.parent = parent;
					instance.root = parent != null ? parent.root || parent : null;
					// Set layer, combined from parent layer, registry layer and uid
					// instance.layer = ((parent != null) ? parent.layer : 0) + this.layer + 2 - 1 / id;

					if (this.isComponent) {
						var i = 0;
						var defaults = this.attributes;
						var keys = this.attributeKeys;
						var l = keys.length;
						if (l > 0) {
							if (attributes == null) {
								for (i = 0; i < l; i++) {
									instance[keys[i]] = defaults[keys[i]];
								}
							} else {
								for (i = 0; i < l; i++) {
									var key = keys[i];
									if (Registry.verbose) {
										if (this.allocated == 1 && !(key in instance)) {
											console.warn("Component \"%s\" does not have attribute \"%s\"", this.type, key);
										}
									}
									instance[key] = attributes[key] !== undefined ? attributes[key] : defaults[key];
								}
							}
						}

						// Add events
						var _events = this.events;
						for (i = 0, l = _events.length; i < l; i++) {
							parent.on(instance, _events[i], _events[i]);
						}
					}
					if (instance.allocate != null) {
						instance.allocate(attributes);
					}
					return instance;
				}
			},
			destroy: {

				/**
     * Destroy given instance.
     * @param {Object} instance Registryed object
     */

				value: function destroy(instance) {
					deallocateQueue.add(instance);
				}
			},
			deallocate: {

				/**
     * Notify registry of deallocated object.
     */

				value: function deallocate() {
					allocated--;
					if (this.allocated-- === 0) {
						this.enabled = false;
						this.cls.enabled = false;
					}
				}
			},
			call: {

				/**
     * Invoke method on all enabled registryed object instances.
     * @param {String} fn Method name
     * @param {Mixed} payload (optional) Argument(s)
     */

				value: function call(fn, payload) {
					var instances = this.instances;
					var i = this.instances.length;
					while (i--) {
						if (instances[i].enabled) {
							instances[i][fn](payload);
						}
					}
				}
			}
		}, {
			reset: {

				// Create call array

				value: function reset() {
					Registry.methods = {};
					for (var i = 0, l = methodsIndex.length; i < l; i++) {
						Registry.methods[methodsIndex[i]] = [];
					}
					Registry.types = {};
				}
			},
			dump: {

				/**
     * Dump debugging details and optionally flush freed objects.
     *
     * @param {Boolean} flush (optional) Flush after debug.
     */

				value: function dump(flush) {
					var types = Registry.types;
					console.group("Registry.dump");
					var _iteratorNormalCompletion = true;
					var _didIteratorError = false;
					var _iteratorError = undefined;

					try {
						for (var _iterator = typeIndex[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
							var _type = _step.value;

							var registry = types[_type];
							console.log("%s: %d/%d allocated", _type, registry.allocated, registry.instantiated);
						}
					} catch (err) {
						_didIteratorError = true;
						_iteratorError = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion && _iterator["return"]) {
								_iterator["return"]();
							}
						} finally {
							if (_didIteratorError) {
								throw _iteratorError;
							}
						}
					}

					console.groupEnd("Registry.dump");
					if (flush) {
						Registry.flush();
					}
				}
			},
			free: {
				value: function free() {
					var _iteratorNormalCompletion = true;
					var _didIteratorError = false;
					var _iteratorError = undefined;

					try {
						for (var _iterator = deallocateQueue[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
							var instance = _step.value;

							instance.deallocate();
							instance.registry.deallocate();
						}
					} catch (err) {
						_didIteratorError = true;
						_iteratorError = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion && _iterator["return"]) {
								_iterator["return"]();
							}
						} finally {
							if (_didIteratorError) {
								throw _iteratorError;
							}
						}
					}

					deallocateQueue.clear();
					if (instantiated > Registry.flushMin && allocated / instantiated < Registry.flushRatio) {
						Registry.flush();
					}
				}
			},
			flush: {
				value: function flush() {
					// console.group('Registry.flush');
					var collectedSum = 0;
					var _iteratorNormalCompletion = true;
					var _didIteratorError = false;
					var _iteratorError = undefined;

					try {
						for (var _iterator = typeIndex[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
							var _type = _step.value;

							var registry = Registry.types[_type];
							if (registry.instantiated == registry.allocated) {
								continue;
							}
							var collected = 0;
							var _instances = registry.instances;
							var j = _instances.length;
							while (j--) {
								var instance = _instances[j];
								if (instance.allocated) {
									continue;
								}
								registry.deinstantiate(instance);
								_instances.splice(j, 1);
								collected++;
							}
							collectedSum += collected;
							registry.instantiated -= collected;
							// console.log('%s: %d flushed/%d remaining', type, collected, registry.instantiated);
						}
					} catch (err) {
						_didIteratorError = true;
						_iteratorError = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion && _iterator["return"]) {
								_iterator["return"]();
							}
						} finally {
							if (_didIteratorError) {
								throw _iteratorError;
							}
						}
					}

					instantiated -= collectedSum;
					console.log("%d flushed/%d remaining", collectedSum, instantiated);
					// console.groupEnd('Registry.flush');
				}
			},
			call: {
				value: function call(fn, arg) {
					var methods = this.methods[fn];
					if (methods == null) {
						return;
					}
					var i = methods.length;
					if (i === 0) {
						return;
					}
					while (i--) {
						if (methods[i].enabled) {
							methods[i][fn](arg);
						}
					}
				}
			},
			create: {
				value: function create(cls) {
					new Registry(cls);
				}
			}
		});

		return Registry;
	})();

	module.exports = Registry;

	var methodsIndex = ["fixedUpdate", "simulate", "update", "postUpdate", "preRender", "render"];
	var deallocateQueue = new Set();
	var typeIndex = new Set();
	var allocated = 0;
	var instantiated = 0;

	Registry.flushMin = 50;
	Registry.flushRatio = 0.1;

	Registry.verbose = false;
	Registry.types = {};
	Registry.methods = {};
	Registry.reset();

	if (typeof window != "undefined" && window.console) {
		console.acme = console.acme || (console.acme = {});
		console.acme.registry = Registry;
		console.acme.dump = function (flush) {
			Registry.dump(flush);
			return null;
		};
	}
});

// BaseRegisterable & {
// 	attributes: ?Object;
// } & {[key:string]: (payload:any) => void};

// BaseRegisterable & {
// 	on: (scope:?Entity, name:string, method:?string) => void;
// }
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports", "module", "./entity", "./bounds", "../math/vec2", "../math/color"], factory);
	} else if (typeof exports !== "undefined" && typeof module !== "undefined") {
		factory(exports, module, require("./entity"), require("./bounds"), require("../math/vec2"), require("../math/color"));
	}
})(function (exports, module, _entity, _bounds, _mathVec2, _mathColor) {
	"use strict";

	var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

	var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

	var Entity = _interopRequire(_entity);

	var Bounds = _interopRequire(_bounds);

	var Vec2 = _interopRequire(_mathVec2);

	var Color = _interopRequire(_mathColor);

	var Renderer = (function () {
		function Renderer(element, size) {
			_classCallCheck(this, Renderer);

			this.element = element || document.body;
			this.size = Vec2(size);
			this.color = Color.white;
			this.content = Vec2(size);
			this.browser = Vec2();
			this.margin = Vec2();
			this.projection = Vec2.scale(this.content, 0.5, Vec2());
			this.scale = 0;
			this.noContext = false;
			this.orientation = "landscape";

			this.canvas = document.createElement("canvas");
			// if (this.color != null) {
			// 	this.canvas.mozOpaque = true;
			// }
			this.ctx = null;

			// var deviceRatio = window.devicePixelRatio || 1;
			// var backingStoreRatio = this.ctx.backingStorePixelRatio ||
			// 	this.ctx.webkitBackingStorePixelRatio ||
			// 	this.ctx.mozBackingStorePixelRatio || 1;
			// this.ratio = deviceRatio / backingStoreRatio;
			this.ratio = window.devicePixelRatio || 1;

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

		_createClass(Renderer, {
			handleEvent: {
				value: function handleEvent(evt) {
					this.reflow();
				}
			},
			reflow: {
				value: function reflow() {
					var browser = this.browser;
					Vec2.set(browser, window.innerWidth, window.innerHeight);
					var scale = Math.min(browser[0] / this.content[0], browser[1] / this.content[1]);
					if (scale !== this.scale) {
						this.scale = scale;
						Vec2.scale(this.content, this.scale, this.size);
					}
					var offset = Vec2.scale(Vec2.sub(browser, this.size, this.margin), 0.5);
					this.element.style[this.transformProp] = "translate(" + (offset[0] | 0) + "px, " + (offset[1] | 0) + "px) scale(" + scale + ")";
				}
			},
			save: {
				value: function save() {
					if (this.noContext) {
						return null;
					}
					if (this.ctx == null) {
						this.ctx = this.canvas.getContext("2d");
					}
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
				}
			},
			restore: {
				value: function restore() {
					if (this.noContext) {
						return null;
					}
					this.ctx.restore();
				}
			},
			requestFullscreen: {
				value: function requestFullscreen() {
					var target = this.element.parentNode;
					if (target.requestFullScreen != null) {
						target.requestFullScreen();
					} else if (target.webkitRequestFullScreen != null) {
						target.webkitRequestFullScreen();
					} else if (target.mozRequestFullScreen != null) {
						target.mozRequestFullScreen();
					}
				}
			},
			topLeft: {
				get: function () {
					return Vec2.sub(Vec2.scale(this.content, 0.5, topLeft), this.projection);
				}
			},
			bottomRight: {
				get: function () {
					return Vec2.add(Vec2.scale(this.content, 0.5, bottomRight), this.projection);
				}
			}
		});

		return Renderer;
	})();

	module.exports = Renderer;

	var topLeft = Vec2();
	var bottomRight = Vec2();
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports);
	}
})(function (exports) {
	"use strict";

	/* @flow */

	var performance = exports.performance = null;
	var requestAnimationFrame = exports.requestAnimationFrame = null;

	if (typeof window != "undefined") {
		// performance.now
		performance = exports.performance = window.performance || (window.performance = {});
		performance.now = performance.now || performance.webkitNow || performance.msNow || performance.mozNow || Date.now;

		performance.nextTick = (function () {
			var queue = [];
			function nextTick(fn) {
				queue.push(fn);
				window.postMessage("nexttick", "*");
			}
			function handleMessage(event) {
				if (event.source != window || event.data != "nexttick") {
					return;
				}
				event.stopPropagation();
				if (queue.length > 0) {
					queue.shift()();
				}
			}

			window.addEventListener("message", handleMessage, true);
			return nextTick;
		})();

		requestAnimationFrame = exports.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame;
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
 	for (let key in properties) {
 		obj[key] = properties[key];
 	}
 	return obj;
 };
 */
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports", "../math/vec2", "./component", "./context", "./event"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports, require("../math/vec2"), require("./component"), require("./context"), require("./event"));
	}
})(function (exports, _mathVec2, _component, _context, _event) {
	"use strict";

	var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

	var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

	var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

	/**
  * @module core/sprite
  */

	var Vec2 = _interopRequire(_mathVec2);

	var Component = _interopRequire(_component);

	var Context = _interopRequire(_context);

	var Event = _interopRequire(_event);

	/**
  * Loads and paints a single image file. Either loaded from source or drawn via callback, created from given width/height.
  * @class
  * @param {String|Function} srcOrRepaint URL or callback to draw image on demand
  * @param {Number[]} size (optional) Override size for drawing canvas
  * @param {Number} baseScale (optional) Base scale applied to all draws, defaults to 1
  */

	var SpriteAsset = exports.SpriteAsset = (function () {
		function SpriteAsset(srcOrRepaint, size, baseScale) {
			_classCallCheck(this, SpriteAsset);

			this.baseScale = baseScale != null ? baseScale : 1;
			this.size = Vec2(size);
			this.bufferSize = Vec2(size);
			this.defaultAnchor = Vec2.center;
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
					Context.emit(Event.create("spriteAssetWillLoad", this));
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

		_createClass(SpriteAsset, {
			toString: {
				value: function toString() {
					var url = this.buffer ? this.buffer.toDataURL() : "Pending";
					var size = Vec2.toString(this.size);
					var bufferSize = Vec2.toString(this.bufferSize);
					var src = this.src || this.repaint;
					return "SpriteAsset " + size + " " + bufferSize + "\n" + src + "\n" + url;
				}
			},
			repaintOnComponent: {
				value: function repaintOnComponent() {
					this.repaintSrc.onRepaint(this.bufferCtx, this);
				}
			},
			handleEvent: {
				value: function handleEvent() {
					this.img.removeEventListener("load", this);
					if (!this.loading) {
						return;
					}
					this.loading = false;
					Vec2.set(this.size, this.img.width, this.img.height);
					Context.emit(Event.create("assetDidLoad", this));
					this.refresh();
				}
			},
			draw: {

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

				value: function draw(ctx, toPos, anchor, size, fromPos, scale) {
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
				}
			},
			repaint: {
				value: function repaint() {
					var size = this.size;
					this.buffer.width = size[0];
					this.buffer.height = size[1];
					this.bufferCtx.drawImage(this.img, 0, 0, size[0], size[1]);
					this.sample();
				}
			},
			sample: {
				value: function sample() {
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
				}
			},
			refresh: {
				value: function refresh(scale) {
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
					Context.emit(Event.create("spriteAssetRefresh", this));
				}
			}
		});

		return SpriteAsset;
	})();

	;

	/**
  * Sprite-sheet for animations.
  * @class
  * @param {Object} attributes sprites, frames, speed, size, anchor, sequences
  */

	var SpriteSheet = exports.SpriteSheet = (function () {
		function SpriteSheet(attributes) {
			_classCallCheck(this, SpriteSheet);

			var sprites = attributes.sprites || [];
			this.sprites = Array.isArray(sprites) ? sprites : [sprites];
			this.frames = [];
			if (Array.isArray(attributes.frames)) {
				var _frames = attributes.frames;
				for (var i = 0, l = _frames.length; i < l; i++) {
					this.frames.push(_frames[i]);
				}
			}
			this.defaults = {
				speed: attributes.speed != null ? attributes.speed : 0,
				size: attributes.size || Vec2(1, 1),
				anchor: attributes.anchor || Vec2.center
			};
			this.sequences = {};
			var sequences = attributes.sequences || {};
			Context.emit(Event.create("spriteSheetCreate", this));
			for (var id in sequences) {
				this.addSequence(id, sequences[id]);
			}
		}

		_createClass(SpriteSheet, {
			addSequence: {

				/**
     * Add sequence to spritesheet.
     * Sequences are defined as short-form by Array:
     *   [frameIndexes, next || null, speed || defaultSpeed || sprite || 0]
     * or Object:
     *   {frames: [], next: 'id', speed: seconds, sprite: 0}
     * @param {String} id       Sequence name (walk, jump, etc)
     * @param {Array|Object} sequence Array or object
     */

				value: function addSequence(id, sequence) {
					if (Array.isArray(sequence)) {
						// Convert short form Array to Object
						var _frames = [];
						for (var frame = sequence[0], l = sequence[1]; frame <= l; frame++) {
							_frames.push(frame);
						}
						sequence = {
							frames: _frames,
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
					Context.emit(Event.create("spriteSheetSequence", this));
					if (!this.defaultSequence) {
						this.defaultSequence = id;
					}
				}
			},
			prepare: {
				value: function prepare() {
					var sprites = this.sprites;
					var i = 0;
					var l = 0;
					for (i = 0, l = sprites.length; i < l; i++) {
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
					Context.emit(Event.create("spriteSheetReady", this));
					return true;
				}
			},
			draw: {
				value: function draw(ctx, idx) {
					if (!this.ready && !this.prepare()) {
						return;
					}
					var frame = this.frames[idx || 0];
					frame.sprite.draw(ctx, null, frame.anchor, frame.size, frame.position);
				}
			}
		});

		return SpriteSheet;
	})();

	;

	/**
  * Sprite SpriteTween lets components draw animation sequences from SpriteSheets.
  * @class
  * @extends Component
  */

	var SpriteTween = exports.SpriteTween = (function (_Component) {
		function SpriteTween() {
			_classCallCheck(this, SpriteTween);

			Component.call(this);
			this.asset = null;
			this.sequence = null;
			this.speed = 0;
			this.offset = 0;
			this.isSpriteSheet = false;
			this.paused = false;
			this.dtime = 0;
			this.frame = 0;
		}

		_inherits(SpriteTween, _Component);

		_createClass(SpriteTween, {
			attributes: {
				get: function () {
					return {
						asset: null,
						speed: 0,
						sequence: null,
						offset: 0,
						frame: 0
					};
				}
			},
			create: {
				value: function create() {
					// this.asset = attributes.asset;
					// this.sequence = attributes.sequence;
					// this.speed = attributes.speed;
					this.isSpriteSheet = this.asset instanceof SpriteSheet;
					if (this.isSpriteSheet) {
						if (!this.speed) {
							this.speed = this.asset.defaults.speed;
						}
						this.dtime = this.offset;
						if (!this.sequence) {
							this.sequence = this.asset.defaultSequence;
						}
					}
					this.paused = !this.speed;
				}
			},
			preRender: {
				value: function preRender(dt) {
					if (!this.isSpriteSheet || this.paused) {
						return;
					}
					var frames = null;
					var speed = 0;
					var frameCount = 0;
					var dtime = this.dtime += dt;
					var nextFrame = this.frame;
					if (this.sequence) {
						var sequence = this.asset.sequences[this.sequence];
						speed = sequence.speed;
						frames = sequence.frames;
						frameCount = frames.length;
						if (dtime >= frameCount * speed) {
							this.emit(Event.create("sequenceEnd", sequence));
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
						nextFrame = frames[dtime / speed | 0];
					} else {
						frames = this.asset.frames;
						frameCount = frames.length;
						speed = this.speed;
						dtime = dtime % (frameCount * speed);
						var frame = dtime / speed | 0;
						if (frame < this.frame) {
							this.emit(Event.create("frameEnd", this.frame));
						}
						nextFrame = dtime / speed | 0;
					}
					if (nextFrame != this.frame) {
						this.frame = nextFrame;
						this.emit(Event.create("frameNext", nextFrame));
					}
				}
			},
			pause: {
				value: function pause() {
					this.paused = true;
					return this;
				}
			},
			play: {
				value: function play() {
					this.paused = false;
					return this;
				}
			},
			goto: {
				value: function goto(id) {
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
						if (this.frame != id) {
							this.emit(Event.create("frameNext", id));
							this.frame = id;
						}
					}
					return this;
				}
			}
		});

		return SpriteTween;
	})(Component);

	;

	Component.create(SpriteTween, "spriteTween");

	/**
  * @class
  * @extends Component
  */

	var compositeLevels = {};
	compositeLevels[0] = "source-over";
	var alphaLevels = {};
	alphaLevels[0] = 1;

	var SpriteCanvasRenderer = exports.SpriteCanvasRenderer = (function (_Component2) {
		function SpriteCanvasRenderer() {
			_classCallCheck(this, SpriteCanvasRenderer);

			if (_Component2 != null) {
				_Component2.apply(this, arguments);
			}
		}

		_inherits(SpriteCanvasRenderer, _Component2);

		_createClass(SpriteCanvasRenderer, {
			render: {
				value: function render(ctx) {
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
			}
		});

		return SpriteCanvasRenderer;
	})(Component);

	;

	Component.create(SpriteCanvasRenderer, "spriteCanvasRenderer");
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports", "./component", "./registry", "../math/vec2", "../math/mat2"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports, require("./component"), require("./registry"), require("../math/vec2"), require("../math/mat2"));
	}
})(function (exports, _component, _registry, _mathVec2, _mathMat2) {
	"use strict";

	var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

	var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

	var Component = _interopRequire(_component);

	var Registry = _interopRequire(_registry);

	var Vec2 = _interopRequire(_mathVec2);

	var Mat2 = _interopRequire(_mathMat2);

	/**
  * Transform keeps track of transformation (position, rotation and scale) and
  * composite, alpha.
  * @extends Component
  * @class
  */

	var Transform = (function (_Component) {
		function Transform() {
			_classCallCheck(this, Transform);

			Component.call(this);
			this.rotation = 0;
			this.alpha = 1;
			this.composite = "";
			this._position = Vec2();
			this._scale = Vec2();
			this._matrix = Mat2();
			this._matrixWorld = Mat2();
			this._dirty = false;
			this._dirtyParent = false;
			this._globalPosition = Vec2();
			this.matrixAutoUpdate = false;
			this.parentTransform = null;
		}

		_inherits(Transform, _Component);

		_createClass(Transform, {
			attributes: {
				get: function () {
					return {
						position: Vec2(),
						scale: Vec2(1, 1),
						rotation: 0,
						alpha: 1,
						composite: "source-over"
					};
				}
			},
			create: {
				value: function create() {
					this._dirty = true;
					this._dirtyParent = true;
					this.matrixAutoUpdate = true;
					var parent = this.entity.parent;
					this.parentTransform = parent ? parent.components.transform : null;
				}
			},
			matrix: {
				get: function () {
					var matrix = this._matrix;
					if (this.dirty || this.matrixAutoUpdate) {
						Mat2.translate(Mat2.identity, this._position, matrix);
						Mat2.rotate(matrix, this.rotation);
						Mat2.scale(matrix, this._scale);
						this._dirty = false;
						this.dirtyParent = true;
					}
					return matrix;
				}
			},
			matrixWorld: {
				get: function () {
					var matrix = this.matrix;
					var parent = this.parentTransform;
					if (!Transform.enableTree || parent == null) {
						return matrix;
					}
					var matrixWorld = this._matrixWorld;
					if (this._dirtyParent) {
						Mat2.multiply(parent.matrixWorld, matrix, matrixWorld);
						this._dirtyParent = false;
					}
					return matrixWorld;
				}
			},
			alphaWorld: {
				get: function () {
					var alpha = this.alpha;
					if (!Transform.enableTree) {
						return alpha;
					}
					var parent = this.parentTransform;
					if (parent == null) {
						return alpha;
					}
					return parent.alphaWorld * alpha;
				}
			},
			globalPosition: {
				get: function () {
					var parent = this.parentTransform;
					var position = this.position;
					if (parent == null) {
						return position;
					}
					return Vec2.add(position, parent.globalPosition, this._globalPosition);
				}
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
				}
			},
			dealloc: {
				value: function dealloc() {
					this.parentTransform = null;
				}
			},
			dirty: {
				set: function (to) {
					if (this._dirty == to) {
						return;
					}
					this._dirty = to;
					if (to && Transform.enableTree) {
						this.dirtyParent = true;
					}
				}
			},
			dirtyParent: {
				set: function (to) {
					if (this._dirtyParent == to) {
						return;
					}
					this._dirtyParent = true;
					var start = this.entity;
					var child = start.firstChild;
					while (child != null) {
						child.components.transform._dirtyParent = true;
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
				}
			},
			compose: {
				value: function compose(position, rotation, scale) {
					if (position != null) {
						this.position = position;
					}
					if (rotation != null) {
						this.rotation = rotation;
					}
					if (scale != null) {
						this.scale = scale;
					}
					this.dirty = true;
				}
			},
			translateBy: {
				value: function translateBy(by) {
					this._position[0] += by[0];
					this._position[1] += by[1];
					this.dirty = true;
				}
			},
			translateTo: {
				value: function translateTo(to) {
					this._position[0] = to[0];
					this._position[1] = to[1];
					this.dirty = true;
				}
			},
			translateXBy: {
				value: function translateXBy(by) {
					this._position[0] += by;
					this.dirty = true;
				}
			},
			translateXTo: {
				value: function translateXTo(to) {
					this._position[0] = to;
					this.dirty = true;
				}
			},
			translateYBy: {
				value: function translateYBy(by) {
					this._position[1] += by;
					this.dirty = true;
				}
			},
			translateYTo: {
				value: function translateYTo(to) {
					this._position[1] = to;
					this.dirty = true;
				}
			},
			scaleBy: {
				value: function scaleBy(by) {
					this._scale[0] += by[0];
					this._scale[1] += by[1];
					this.dirty = true;
				}
			},
			scaleTo: {
				value: function scaleTo(to) {
					this._scale[0] = to[0];
					this._scale[1] = to[1];
					this.dirty = true;
				}
			},
			scaleXBy: {
				value: function scaleXBy(by) {
					this._scale[0] += by;
					this.dirty = true;
				}
			},
			scaleXTo: {
				value: function scaleXTo(to) {
					this._scale[0] = to;
					this.dirty = true;
				}
			},
			scaleYBy: {
				value: function scaleYBy(by) {
					this._scale[1] += by;
					this.dirty = true;
				}
			},
			scaleYTo: {
				value: function scaleYTo(to) {
					this._scale[1] = to;
					this.dirty = true;
				}
			},
			rotateBy: {
				value: function rotateBy(by) {
					this.rotation += by;
					this.dirty = true;
				}
			},
			rotateTo: {
				value: function rotateTo(to) {
					this.rotation = to;
					this.dirty = true;
				}
			},
			applyMatrixWorld: {
				value: function applyMatrixWorld(ctx) {
					var mtx = this.matrixWorld;
					ctx.setTransform(mtx[0], mtx[1], mtx[2], mtx[3], mtx[4] + 0.5 | 0, mtx[5] + 0.5 | 0);
				}
			},
			applyMatrix: {
				value: function applyMatrix(ctx) {
					if (this.positionOnly) {
						ctx.translate(this.position[0], this.position[1]);
					} else {
						var mtx = this.matrix;
						ctx.transform(mtx[0], mtx[1], mtx[2], mtx[3], mtx[4] + 0.5 | 0, mtx[5] + 0.5 | 0);
					}
				}
			}
		});

		return Transform;
	})(Component);

	Transform.enableTree = true;

	Vec2.defineProperty(Transform, "position", { dirty: true });
	Vec2.defineProperty(Transform, "scale", { dirty: true });

	Component.create(Transform, "transform");
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports", "module"], factory);
	} else if (typeof exports !== "undefined" && typeof module !== "undefined") {
		factory(exports, module);
	}
})(function (exports, module) {
	"use strict";

	var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

	/** @flow weak */

	var Component = require("../core/component");

	var Console = (function (_Component) {
		function Console() {
			_classCallCheck(this, Console);

			Component.call(this);
			this.css = "";
			this.container = null;
			this.graphStyle = false;
			this.width = 0;
			this.height = 0;
			this.cap = 0;
			this.resolution = 0;
		}

		_inherits(Console, _Component);

		_createClass(Console, {
			attributes: {
				get: function () {
					return {
						css: "",
						container: null,
						graphStyle: true,
						width: 100,
						height: 56,
						cap: 50,
						resolution: 0.2
					};
				}
			},
			create: {
				value: function create() {
					this.reset();

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
							var sections = Console.sections;
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
				}
			},
			handleEvent: {
				value: function handleEvent(evt) {
					var time = evt.timeStamp;
					if (time - this.lastClick < 500) {
						this.destroy();
					}
					this.lastClick = time;
					this.toggle();
					return false;
				}
			},
			toggle: {
				value: function toggle() {
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
				}
			},
			free: {
				value: function free() {
					(this.container || document.body).removeChild(this.wrap);
					this.wrap.removeEventListener("click", this);
					this.wrap = null;
					this.container = null;
				}
			},
			onTimeEnd: {
				value: function onTimeEnd(event) {
					var samples = event.detail;
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
				}
			},
			renderGraph: {
				value: function renderGraph() {
					var colors = Console.colors;
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

					this.reset();
				}
			},
			reset: {
				value: function reset() {
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
			}
		});

		return Console;
	})(Component);

	module.exports = Console;

	Console.colors = ["#ddd", "#fff", "#ffc", "#fcc"];

	Console.sections = ["#ffff33", "#ff8533", "#2babd6", "#9d2bd6"];
	// ['#fffa5b', '#ff945b', '#5bf4ff', '#bd5bff']

	Component.create(Console, "console");
});
(function (factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  }
})(function (exports) {
  "use strict";

  var Component = require("./component");
  var Vec2 = require("../math/vec2");

  // http://www.openprocessing.org/sketch/7522
  // https://gist.github.com/mikolalysenko/5580867

  function Attraction() {
    this.delta = Vec2();
  }

  Attraction.prototype = {

    attributes: {
      radius: 100,
      force: 100,
      target: null,
      targets: null
    },

    create: function create(attributes) {
      this.radius = attributes.radius;
      this.force = attributes.force;
      this.target = attributes.target;
      this.targets = attributes.targets;
      Vec2.set(this.delta);
    },

    fixedUpdate: function fixedUpdate(dt) {
      Vec2.sub(this.target.transform.position, this.transform.position);
      var distSq = Vec2.lenSq(this.delta);
      if (distSq < this.radius * this.radius && distSq > Math.EPSILON) {}
    }

  };

  new Component("attraction", Attraction);

  module.exports = Attraction;
});

// this.delta.norm().scale(1.0 - distSq / this.radiusSq);
// return p.acc.add(this.delta.scale(this.force));
(function (factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  }
})(function (exports) {
  "use strict";

  var Registry = require("./registry");
  var Component = require("./component");
  var Vec2 = require("../math/vec2");

  function Avoid() {}

  Avoid.prototype.attributes = {
    targets: null,
    sight: 100
  };

  Avoid.prototype.create = function (attributes) {
    this.targets = attributes.targets;
    this.sight = attributes.sight;
    this.instances = Registry.types[this.targets];
  };

  var impulse = Vec2();

  Avoid.prototype.fixedUpdate = function (dt) {
    Vec2.set(impulse);
    var targets = this.instances;
    for (var i = 0, l = targets.length; i < l; i++) {
      var target = targets[i];
      if (!target.enabled) {
        continue;
      }

      // TODO: Code!
      // http://rocketmandevelopment.com/2010/07/13/
      //   steering-behaviors-obstacle-avoidance/
      // http://my.safaribooksonline.com/book/programming/
      //   game-programming/0596005555/flocking/ch04_sect1_003
    }

    this.body.applyForce(impulse);
  };

  new Component("avoid", Avoid);

  module.exports = Avoid;
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports);
	}
})(function (exports) {
	"use strict";

	/**
  * Alternative: https://github.com/jsplumb/jsBezier
  */

	// initialize temp used in bezier calcs to avoid allocations
	var tmpX = new Float32Array(64);
	var tmpY = new Float32Array(64);

	/**
  * Calculates the bezier path vector
  *
  * @param {Number[]} points
  * @param {Number[]} delta
  * @param {Number[]} result
  */
	function calcPathBezier(points, delta, result) {
		var count = points.length;
		if (count <= 1) {
			result[0] = result[1] = 0;
			return;
		}

		var d1 = 1 - delta;

		for (var j = 0; j < count; j++) {
			var point = points[j];
			tmpX[j] = point[0];
			tmpY[j] = point[1];
		}

		for (var minusOne = count - 1; minusOne > 0; count--, minusOne--) {
			var plusOne = 1;
			for (var i = 0; i < minusOne; i++, plusOne++) {
				tmpX[i] = tmpX[i] * d1 + tmpX[plusOne] * delta;
				tmpY[i] = tmpY[i] * d1 + tmpY[plusOne] * delta;
			}
		}
		result[0] = tmpX[0];
		result[1] = tmpY[0];
	}
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports);
	}
})(function (exports) {
	"use strict";

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
		this.linear = p1[0] == p1[1] && p2[0] == p2[1];
	}

	/**
  * Pre-alculate samples.
  *
  * @param {Number} size Numbers of samples, defaults to 100
  */
	CubicBezier.prototype.sample = function (size) {
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
		return 1 - 3 * a2 + 3 * a1;
	}
	function B(a1, a2) {
		return 3 * a2 - 6 * a1;
	}
	function C(a1) {
		return 3 * a1;
	}

	/**
  * Get y for time x.
  * @param {Number} x Between 0 and 1
  * @return {Number}
  */
	CubicBezier.prototype.get = function (x) {
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
			var currentSlope = 3 * A(x1, x2) * t * t + 2 * B(x1, x2) * t + C(x1);
			if (!currentSlope) {
				break;
			}
			t -= (((A(x1, x2) * t + B(x1, x2)) * t + C(x1)) * t - x) / currentSlope;
		}
		return t;
	};

	module.exports = CubicBezier;
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports);
	}
})(function (exports) {
	"use strict";

	var Vec2 = require("../math/vec2");

	function FMathModule(stdlib) {
		"use asm";

		var UID = 0;

		// Variable Declarations
		var sqrt = stdlib.Math.sqrt;
		var x = 0;
		var y = 0;

		function uid() {
			UID = UID | 0 + 1 | 0;
			return UID | 0;
		}

		function clamp(a, low, high) {
			a = +a;
			low = +low;
			high = +high;
			if (a < low) {
				return +low;
			}
			if (a > high) {
				return +high;
			}
			return +a;
		}

		function lerp(a, b, scalar) {
			a = +a;
			b = +b;
			scalar = +scalar;
			return +(a + scalar * (b - a));
		}

		function mod(a, b) {
			a = +a;
			b = +b;
			a = +(a % b);
			if (a * b < 0) {
				return +(a + b);
			}
			return +a;
		}

		function vec2Dist(a0, a1, b0, b1) {
			a0 = +a0;
			a1 = +a1;
			b0 = +b0;
			b1 = +b1;
			x = +(b0 - a0);
			y = +(b1 - a1);
			return +sqrt(x * x + y * y);
		}

		return {
			uid: uid,
			clamp: clamp,
			mod: mod,
			lerp: lerp,
			vec2Dist: vec2Dist
		};
	}

	var FMath = FMathModule(window);

	/*
 var vecA = new Float32Array([1.3, 1.2]);
 var vecB = new Float32Array([5.3, -10.2]);
 
 function vec2Dist(a, b) {
 	return FMath.vec2Dist(a[0], a[1], b[0], b[1]);
 }
 
 var x = 0.0;
 
 for (var i = 0; i < 100000; i++) {
 	x = Math.mod(400, 360);
 	x = FMath.mod(400.0, 360.0);
 	vec2Dist(vecA, vecB);
 }
 
 console.time('fm');
 for (var i = 0; i < 100000; i++) {
 	vec2Dist(vecA, vecB);
 }
 console.timeEnd('fm');
 
 Math.mod(400, 360);
 
 console.time('m');
 for (var i = 0; i < 100000; i++) {
 	Vec2.dist(vecA, vecB);
 }
 console.timeEnd('m');
 */

	module.exports = FMath;
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports);
	}
})(function (exports) {
	"use strict";

	/**
  * Heightmap
  *
  * http://www.float4x4.net/index.php/2010/06/
  *   generating-realistic-and-playable-terrain-height-maps/
  */

	var Perlin = require("./perlin");

	var Heightmap = function Heightmap(size, scale) {
		this.size = size || 256;
		this.scale = scale || 1;

		this.perlin = new Perlin();
		this.heights = new Float32Array(size * size);
	};

	Heightmap.prototype = {

		add: function add(scale, ratio) {
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

		erode: function erode(smoothness) {
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
		smoothen: function smoothen(factor) {
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

		get: function get(x, y) {
			return this.heights[x * this.size + y];
		}

	};

	module.exports = Heightmap;
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports);
	}
})(function (exports) {
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
});
(function (factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  }
})(function (exports) {
  "use strict";

  var Registry = require("./registry");
  var Component = require("./component");
  var Vec2 = require("../math/vec2");

  function Seek() {}

  Seek.prototype.attributes = {
    targets: null,
    sight: 100
  };

  Seek.prototype.create = function (attributes) {
    this.targets = attributes.targets;
    this.sight = attributes.sight;
    this.instances = Registry.types[this.targets];
  };

  var impulse = Vec2();

  Seek.prototype.fixedUpdate = function (dt) {
    Vec2.set(impulse);
    var instances = this.instances;
    for (var i = 0, l = instances.length; i < l; i++) {
      var target = instances[i];
      if (!target.enabled) {
        continue;
      }

      // TODO: Code!
      // http://rocketmandevelopment.com/2010/06/11/steering-behaviors-seeking/
    }

    this.body.applyForce(impulse);
  };

  new Component("seek", Seek);

  module.exports = Seek;
});
(function (factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  }
})(function (exports) {
  "use strict";

  var Component = require("./component");
  var Vec2 = require("../math/vec2");

  // http://www.openprocessing.org/sketch/7522
  // https://gist.github.com/mikolalysenko/5580867

  function Spring() {}

  Spring.prototype = {

    // attributes: {
    // },

    create: function create(attributes) {},

    fixedUpdate: function fixedUpdate(dt) {}

  };

  new Component("spring", Spring);

  module.exports = Spring;
});

// http://www.openprocessing.org/sketch/7505
/*
float d = PVector.dist(position,p.position);
// natural separation: 100 units
// force on a spring: F=kx
// x = displacement from equilibrium position
float x = d - 100.0;
// apply force *along* the spring:
PVector dir = PVector.sub(p.position,position);
dir.normalize();
// F=ma should apply:
// here we adjust the velocity according to the current force
dir.mult(x/1000.0);
velocity.add(dir);
// bounce of the sides:
bounce();
// friction: dampen any movement:
velocity.mult(0.999);
 */
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports);
	}
})(function (exports) {
	"use strict";

	var Component = require("./component");
	var Vec2 = require("../math/vec2");

	function Tween() {
		this.position = Vec2();
		this.animation = [];
	}

	Tween.prototype = {

		attributes: {
			position: Vec2(),
			rotation: 0,
			alpha: 1
		},

		create: function create(attributes) {
			this.rotation = attributes.rotation;
			this.alpha = attributes.alpha;
			Vec2.copy(this.position, attributes.position);
		}

	};

	new Component("tween", Tween);

	function Animation(keyframes) {}

	Animation.prototype.update = function (entity, dt) {};

	Tween.Animation = Animation;

	module.exports = Tween;
});
(function (factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  }
})(function (exports) {
  "use strict";

  var Registry = require("./registry");
  var Component = require("./component");
  var Vec2 = require("../math/vec2");

  function Wander() {}

  Wander.prototype.attributes = {
    targets: null,
    sight: 100
  };

  Wander.prototype.create = function (attributes) {
    this.targets = attributes.targets;
    this.sight = attributes.sight;
    this.instances = Registry.types[this.targets];
  };

  Wander.prototype.fixedUpdate = function (dt) {
    Vec2.set(impulse);

    var instances = this.instances;
    for (var i = 0, l = instances.length; i < l; i++) {
      var target = instances[i];
      if (!target.enabled) {
        continue;
      }

      // TODO: Code!
      // http://gamedev.tutsplus.com/tutorials/implementation/
      // understanding-steering-behaviors-wander/
      // http://wiki.unity3d.com/index.php/Wander#JavaScript_Version_Wander.js
      // http://rocketmandevelopment.com/2010/06/16/steering-behaviors-wander/
    }

    this.body.applyForce(impulse);
  };

  var impulse = Vec2();

  new Component("wander", Wander);

  module.exports = Wander;
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports", "module", "../math/mathf", "../math/random", "../math/tweens"], factory);
	} else if (typeof exports !== "undefined" && typeof module !== "undefined") {
		factory(exports, module, require("../math/mathf"), require("../math/random"), require("../math/tweens"));
	}
})(function (exports, module, _mathMathf, _mathRandom, _mathTweens) {
	"use strict";

	var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

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
	module.exports = Color;
	var clamp = _mathMathf.clamp;
	var random = _mathRandom.random;

	var Tweens = _interopRequire(_mathTweens);

	function Color(fromOrR, g, b, a) {
		if (g != null) {
			return new Float32Array([fromOrR, g, b, a != null ? a : 1]);
		}
		if (fromOrR != null) {
			return new Float32Array([fromOrR[0], fromOrR[1], fromOrR[2], fromOrR[3] != null ? fromOrR[3] : 1]);
		}
		return new Float32Array(Color.white);
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

	Color.toHex = function (a) {
		console.log(a[0], a[1], a[2]);
		return (a[0] * 255 << 16) + (a[1] * 255 << 8) + (a[2] * 255 << 0);
	};

	Color.lerpList = function (result, list, t, ease) {
		var last = list.length - 1;
		t = clamp(t * last, 0, last);
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
		t = random(-t, t);
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
			get: function get() {
				return this[prop];
			},
			set: function set(value) {
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
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports", "module"], factory);
	} else if (typeof exports !== "undefined" && typeof module !== "undefined") {
		factory(exports, module);
	}
})(function (exports, module) {
	"use strict";

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
	module.exports = Mat2;

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
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports);
	}
})(function (exports) {
	"use strict";

	/**
  * Generate UID
  * @function uid
  * @return {Number} Unique ID
  */
	exports.uid = uid;
	exports.clamp = clamp;
	exports.map = map;

	/**
  * Correct modulo behavior
  * @param {Number} a Dividend
  * @param {Number} b Divisor
  * @return {Number} a % b where the result is between 0 and b (either
  *   0 <= x < b or b < x <= 0, depending on the sign of b).
  */
	exports.mod = mod;

	/**
  * Loops the value t, so that it is never larger than length and never
  * smaller than 0.
  * @param {Number} t
  * @param {Number} length
  * @return {Number}
  */
	exports.repeat = repeat;
	exports.toDeg = toDeg;
	exports.toRad = toRad;
	exports.normDeg = normDeg;
	exports.normRad = normRad;
	exports.distRad = distRad;
	exports.distDeg = distDeg;

	/**
  * Performs linear interpolation between values a and b.
  * @param {Number} a
  * @param {Number} b
  * @param {Number} scalar The proportion between a and b.
  * @return {Number} The interpolated value between a and b.
  */
	exports.lerp = lerp;
	exports.distAng = distAng;

	/**
  * Gradually changes a value towards a desired goal over time.
  *
  * http://docs.unity3d.com/Documentation/ScriptReference/export SmoothDamp.html
  * http://answers.unity3d.com/questions/24756/formula-behind-smoothdamp.html
  */
	exports.smoothDamp = smoothDamp;
	/** @flow */

	/*
  * http://docs.unity3d.com/Documentation/ScriptReference/export html
  * https://github.com/secretrobotron/gladius.math/
  * https://github.com/toji/gl-matrix/tree/master/src/gl-matrix
  *
  * TODO: https://github.com/photonstorm/phaser/blob/master/Phaser/GameMath.ts
  */
	var EPSILON = exports.EPSILON = 0.01;
	var PI = Math.PI;
	var TAU = exports.TAU = PI * 2;
	var HALF_PI = exports.HALF_PI = PI / 2;
	var RAD2DEG = exports.RAD2DEG = 180 / PI;
	var DEG2RAD = exports.DEG2RAD = PI / 180;

	var staticUid = 1;
	function uid() {
		return staticUid++;
	}

	;

	function clamp(a, low, high) {
		if (a < low) {
			return low;
		}
		if (a > high) {
			return high;
		}
		return a;
	}

	;

	function map(a, fromLow, fromHigh, toLow, toHigh) {
		return toLow + (a - fromLow) / (fromHigh - fromLow) * (toHigh - toLow);
	}

	;
	function mod(a, b) {
		a %= b;
		return a * b < 0 ? a + b : a;
	}

	;
	function repeat(t, length) {
		return t - Math.floor(t / length) * length;
	}

	;

	function toDeg(rad) {
		return rad * RAD2DEG;
	}

	;

	function toRad(deg) {
		return deg * DEG2RAD;
	}

	;

	function normDeg(deg) {
		deg %= 360;
		return deg * 360 < 0 ? deg + 360 : deg;
	}

	;

	function normRad(rad) {
		rad %= TAU;
		return rad * TAU < 0 ? rad + TAU : rad;
	}

	;

	function distRad(a, b) {
		var d = normRad(b) - normRad(a);
		if (d > PI) {
			return d - TAU;
		}
		if (d <= -PI) {
			return d + TAU;
		}
		return d;
	}

	;

	function distDeg(a, b) {
		var d = normDeg(b) - normDeg(a);
		if (d > 180) {
			return d - 360;
		}
		if (d <= -180) {
			return d + 360;
		}
		return d;
	}

	;
	function lerp(a, b, scalar) {
		return a + scalar * (b - a);
	}

	;

	function distAng(a, b) {
		if (a == b) {
			return 0;
		}
		var ab = a < b;
		var l = ab ? -a - TAU + b : b - a;
		var r = ab ? b - a : TAU - a + b;
		return Math.abs(l) > Math.abs(r) ? r : l;
	}

	;

	var dampState = {
		value: 0,
		velocity: 0
	};
	function smoothDamp(a, b, velocity, time, maxVelocity, delta) {
		time = Math.max(EPSILON, time);
		delta = Math.max(0.02, delta);
		var num = 2 / time;
		var num2 = num * delta;
		var num3 = 1 / (1 + num2 + 0.48 * num2 * num2 + 0.235 * num2 * num2 * num2);
		var num4 = a - b;
		var num5 = b;
		var num6 = (maxVelocity || Number.POSITIVE_INFINITY) * time;
		num4 = clamp(num4, -num6, num6);
		b = a - num4;
		var num7 = (velocity + num * num4) * delta;
		velocity = (velocity - num * num7) * num3;
		var value = b + (num4 + num7) * num3;
		if (num5 - a > 0 == value > num5) {
			value = num5;
			velocity = (value - num5) / delta;
		}
		dampState.value = value;
		dampState.velocity = velocity;
		return dampState;
	}

	;
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports);
	}
})(function (exports) {
	"use strict";

	/**
  * Seed based Math.random()
  * Inspired by http://processing.org/reference/random_.html
  * @param  {Number} low
  * @param  {Number} high
  * @return {Number} Number between 0 and 1
  */
	exports.random = random;

	/**
  * Set seed
  * @param  {Number} seed
  */
	exports.srand = srand;
	exports.values = values;
	exports.valuesKey = valuesKey;
	exports.chance = chance;
	/* @flow */

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
	function random(low, high) {
		if (high == null) {
			if (low == null) {
				high = 1;
			} else {
				high = low;
			}
			low = 0;
		}
		// define the recurrence relationship
		z = (a * z + c) % m;
		// return a float in [0, 1)
		// if z = m then z / m = 0 therefore (z % m) / m < 1 always
		return z / m * (high - low) + low;
	}

	;

	exports.random = random;

	function srand(seed) {
		z = seed | 0;
	}

	function values(values) {
		return values[random(values.length) | 0];
	}

	function valuesKey(values) {
		return random(values.length) | 0;
	}

	function chance(chance) {
		return random(0, 1) <= chance;
	}

	/**
 // http://www.protonfish.com/random.shtml
 function rnd_snd() {
 	return (Math.random()*2-1)+(Math.random()*2-1)+(Math.random()*2-1);
 }
 
 function rnd(mean, stdev) {
 	return Math.round(rnd_snd()*stdev+mean);
 }
 */

	Object.defineProperty(exports, "__esModule", {
		value: true
	});
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports", "module"], factory);
	} else if (typeof exports !== "undefined" && typeof module !== "undefined") {
		factory(exports, module);
	}
})(function (exports, module) {
	"use strict";

	/* @flow */

	var Tweens = {
		linear: function linear(t) {
			return t;
		}
	};

	module.exports = Tweens;

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
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports", "module", "../math/mathf", "../math/random"], factory);
	} else if (typeof exports !== "undefined" && typeof module !== "undefined") {
		factory(exports, module, require("../math/mathf"), require("../math/random"));
	}
})(function (exports, module, _mathMathf, _mathRandom) {
	"use strict";

	/**
  * Initialize from Vec2 array or x/y values. Returns a new (typed) array.
  * @class
  * @classdesc Float32Array representation of 2D vectors and points.
  * @param {Vec2|Number} [fromOrX=Vec2.zero] Typed array to copy from or x
  * @param {Number} y y, when x was provided as first argument
  * @returns {Vec2} vec2 New 2D Vector
  */
	module.exports = Vec2;
	var clamp = _mathMathf.clamp;
	var EPSILON = _mathMathf.EPSILON;
	var TAU = _mathMathf.TAU;
	var random = _mathRandom.random;

	function Vec2(fromOrX, y) {
		var a = new Float32Array(2);
		if (y != null) {
			a[0] = fromOrX;
			a[1] = y;
		} else if (fromOrX != null) {
			a[0] = fromOrX[0];
			a[1] = fromOrX[1];
		}
		return a;
	}

	/*
 let freeStack = [];
 let sweepStack = [];
 
 freeStack.pop()
 
 Vec2.marked = function() {
 	let a = Vec2()
 	sweepStack.push(a);
 	return a;
 };
 
 Vec2.sweep = function() {
 	if (sweepStack.length > 0) {
 		freeStack.push.apply(freeStack, sweepStack);
 		sweepStack.length = 0;
 	}
 };
 
 Vec2.destroy = function(a) {
 	freeStack.push(a);
 };
 /*
 
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
		var omega = Math.acos(clamp(Vec2.dot(Vec2.norm(a, slerpCacheA), Vec2.norm(b, slerpCacheB)), -1, 1));
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
		result[0] = a[0] + random(-delta, delta);
		result[1] = a[1] + random(-delta, delta);
		return result;
	};

	Vec2.variantCirc = function (a, delta, result) {
		result = result || a;
		var len = random(0, delta);
		var theta = random(0, TAU);
		result[0] = a[0] + len * Math.cos(theta);
		result[1] = a[1] + len * Math.sin(theta);
		return result;
	};

	Vec2.variantRad = function (a, delta, result) {
		return Vec2.rotate(a, random(-delta, delta), result);
	};

	Vec2.variantLen = function (a, delta, result) {
		return Vec2.norm(a, result, Vec2.len(a) + random(-delta, delta));
	};

	Vec2.defineProperty = function (cls, name, options) {
		if (options == null) {
			options = {};
		}
		var prop = "_" + name;
		var descriptor = {};
		if (!options.noGet) {
			descriptor.get = function () {
				return this[prop];
			};
		}
		if (options.dirty) {
			descriptor.set = function (value) {
				this[prop][0] = value[0];
				this[prop][1] = value[1];
				this.dirty = true;
			};
		} else if (!options.noSet) {
			descriptor.set = function (value) {
				this[prop][0] = value[0];
				this[prop][1] = value[1];
			};
		}
		Object.defineProperty(cls.prototype, name, descriptor);
		var copy = "copy" + name.charAt(0).toUpperCase() + name.slice(1);
		cls.prototype[copy] = function (result) {
			result[0] = this[prop][0];
			result[1] = this[prop][1];
			return result;
		};
	};
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports", "module", "../core/component", "../math/mathf", "../math/vec2"], factory);
	} else if (typeof exports !== "undefined" && typeof module !== "undefined") {
		factory(exports, module, require("../core/component"), require("../math/mathf"), require("../math/vec2"));
	}
})(function (exports, module, _coreComponent, _mathMathf, _mathVec2) {
	"use strict";

	var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

	var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

	/** @flow weak */
	/**
  * @module core/body
  */

	var Component = _interopRequire(_coreComponent);

	var TAU = _mathMathf.TAU;

	var Vec2 = _interopRequire(_mathVec2);

	/**
  * @class Body
  * Velocity integrator
  *
  * Related links:
  * http://hg.positiontspectacular.com/toxiclibs/src/689ddcd9bea3/src.physics/toxi/physics2d
  * @extends Component
  */

	var Body = (function (_Component) {
		function Body() {
			_classCallCheck(this, Body);

			Component.call(this);
			this.mass = 0;
			this.drag = 0;
			this.friction = 0;
			this.density = 0;
			this.restitution = 1;
			this.fixed = false;
			this.maxVelocity = 0;
			this.maxForce = 0;
			this.minVelocity = 0;
			this.angularVelocity = 0;
			this.torque = 0;
			this.continuousTorque = 0;
			this.angularDrag = 0;
			this.angularFriction = 0;
			this.fixedRotation = false;
			this.maxAngularVelocity = 0;
			this.maxAngularForce = 0;
			this.minAngularVelocity = 0;
			this.fast = false;
			this.awake = false;
			this.allowSleep = false;
			this.bullet = false;

			this._velocity = Vec2();
			this._force = Vec2();
			this._continuousForce = Vec2();
		}

		_inherits(Body, _Component);

		_createClass(Body, {
			attributes: {
				get: function () {
					return {
						mass: 1,
						velocity: Vec2(),
						force: Vec2(),
						continuousForce: Vec2(),
						drag: 0.999,
						friction: 15,
						density: 1,
						restitution: 0.2,
						fixed: false,
						fixedRotation: true,
						maxVelocity: 75,
						maxForce: 2000,
						minVelocity: 1,
						angularVelocity: 0,
						torque: 0,
						continuousTorque: 0,
						angularDrag: 0.999,
						angularFriction: 1,
						maxAngularVelocity: 0,
						maxAngularForce: 0,
						minAngularVelocity: TAU / 360,
						fast: false,
						bullet: false,
						awake: true,
						allowSleep: true
					};
				}
			},
			direction: {
				get: function () {
					return Vec2.rad(this._velocity);
				},
				set: function (rad) {
					Vec2.rotateTo(this._velocity, rad);
				}
			},
			speed: {
				get: function () {
					return Vec2.len(this._velocity);
				},
				set: function (length) {
					Vec2.norm(this._velocity, null, length);
				}
			},
			applyForce: {
				value: function applyForce(impulse, ignoreMass, continues) {
					Vec2.add(continues ? this._continuousForce : this._force, !ignoreMass && this.mass !== 1 ? Vec2.scale(impulse, 1 / (this.mass || 1), cache) : impulse);
				}
			},
			applyTorque: {
				value: function applyTorque(impulse, ignoreMass, continues) {
					Vec2.add(continues ? this._continuousForce : this._force, !ignoreMass && this.mass !== 1 ? Vec2.scale(impulse, 1 / (this.mass || 1), cache) : impulse);
				}
			}
		});

		return Body;
	})(Component);

	module.exports = Body;

	var cache = Vec2();

	Vec2.defineProperty(Body, "velocity");
	Vec2.defineProperty(Body, "force");
	Vec2.defineProperty(Body, "continuousForce");

	Component.create(Body, "body");
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports", "../core/component", "../math/vec2"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports, require("../core/component"), require("../math/vec2"));
	}
})(function (exports, _coreComponent, _mathVec2) {
	"use strict";

	var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

	var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

	var Component = _interopRequire(_coreComponent);

	var Vec2 = _interopRequire(_mathVec2);

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

	var Boid = (function (_Component) {
		function Boid() {
			_classCallCheck(this, Boid);

			Component.call(this);
			this.aura = 0;
			this.perception = 0;
			this.perceptionSq = 0;
			this.auraSq = 0;
			this.mod = 2;
			this.cohesionMod = 1;
			this.avoidanceMod = 2;
			this.imitationMod = 1;
		}

		_inherits(Boid, _Component);

		_createClass(Boid, {
			attributes: {
				get: function () {
					return {
						perception: 0,
						aura: 0
					};
				}
			},
			create: {
				value: function create() {
					if (this.components.bounds) {
						if (this.aura === 0) {
							this.aura = this.components.bounds.radius * 2;
						}
						if (this.perception === 0) {
							this.perception = this.aura * 4;
						}
					}
					this.perceptionSq = this.perception * this.perception;
					this.auraSq = this.aura * this.aura;
				}
			}
		});

		return Boid;
	})(Component);

	var cohesion = Vec2();
	var avoidance = Vec2();
	var imitation = Vec2();
	var distance = Vec2();
	var impulse = Vec2();

	Boid.fixedUpdate = function (dt) {
		var boids = this.registry.instances;
		var len = boids.length;
		var i = len;
		while (i--) {
			var boid1 = boids[i];
			if (!boid1.enabled) {
				continue;
			}

			var entity1 = boid1.entity;
			var pos1 = entity1.components.transform.position;
			var vel = entity1.components.body.velocity;

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
				var pos2 = entity2.components.transform.position;

				var diffSq = Vec2.distSq(pos1, pos2);
				if (diffSq < boid1.perceptionSq && diffSq) {
					Vec2.sub(pos2, pos1, distance);
					// Vec2.scale(distance, Math.sqrt(entity1.body.mass / entity2.body.mass));

					// diff = Math.sqrt(diffSq)
					// Vec2.scale(distance, Math.quadInOut(diff / boid1.perception), cache)

					// Cohesion : try to approach other boids
					cohesionCount++;
					if (cohesionCount == 1) {
						Vec2.copy(cohesion, distance);
					} else {
						Vec2.add(cohesion, distance);
					}

					// Imitation : try to move in the same way than other boids
					imitationCount++;
					if (imitationCount == 1) {
						Vec2.copy(imitation, entity2.components.body.velocity);
					} else {
						Vec2.add(imitation, entity2.components.body.velocity);
					}

					// Avoidance : try to keep a minimum distance between others.
					if (diffSq < boid1.auraSq) {
						avoidanceCount++;
						if (avoidanceCount == 1) {
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
				entity1.components.body.applyForce(Vec2.scale(cohesion, boid1.cohesionMod * mod), true);
			}

			if (imitationCount && boid1.imitationMod) {
				if (imitationCount > 1) {
					Vec2.scale(imitation, 1 / imitationCount);
				}
				Vec2.add(impulse, Vec2.scale(imitation, boid1.imitationMod * mod));
				entity1.components.body.applyForce(Vec2.sub(impulse, vel), true);
			}

			if (avoidanceCount && boid1.avoidanceMod) {
				if (avoidanceCount > 1) {
					Vec2.scale(avoidance, 1 / avoidanceCount);
				}
				entity1.components.body.applyForce(Vec2.scale(avoidance, boid1.avoidanceMod * mod), true);
			}
		}
	};

	Component.create(Boid, "boid");
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports", "../core/component", "../core/registry", "../math/vec2", "../core/context", "../core/event"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports, require("../core/component"), require("../core/registry"), require("../math/vec2"), require("../core/context"), require("../core/event"));
	}
})(function (exports, _coreComponent, _coreRegistry, _mathVec2, _coreContext, _coreEvent) {
	"use strict";

	var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

	var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

	var Component = _interopRequire(_coreComponent);

	var Registry = _interopRequire(_coreRegistry);

	var Vec2 = _interopRequire(_mathVec2);

	var Context = _interopRequire(_coreContext);

	var Event = _interopRequire(_coreEvent);

	var BorderEvent = (function (_Event) {
		function BorderEvent() {
			_classCallCheck(this, BorderEvent);

			Event.call(this);
			this.cancelable = true;
			this.diff = 0;
			this.contact = 0;
		}

		_inherits(BorderEvent, _Event);

		return BorderEvent;
	})(Event);

	Event.register(BorderEvent, "border");

	var position = Vec2();
	var velocity = Vec2();

	/**
  * @class Border
  * Border lets entities react on contact with the canvas borders.
  * @extends Component
  * @property {String} [mode="bounce"] Reaction to contact with border, "constrain", "bounce", "mirror", "kill"
  * @property {Number} [restitution=1] Restitution on bounce
  * @fires Border#onBorder
  */

	var Border = (function (_Component) {
		function Border() {
			_classCallCheck(this, Border);

			Component.call(this);
			this.mode = "";
			this.restitution = 0;
		}

		_inherits(Border, _Component);

		_createClass(Border, {
			attributes: {
				get: function () {
					return {
						mode: "bounce",
						restitution: 1
					};
				}
			},
			simulate: {
				value: function simulate(dt) {
					var topLeft = Context.renderer.topLeft;
					var bottomRight = Context.renderer.bottomRight;
					var restitution = this.restitution;
					var mode = this.mode;
					var mirror = mode == "mirror";
					var bounce = mode == "bounce";
					var entity = this.entity;
					var body = entity.components.body;
					if (bounce && body != null) {
						if (!body.enabled || !body.awake) {
							return;
						}
						body.copyVelocity(velocity);
					}
					var transform = entity.components.transform;
					transform.copyPosition(position);
					var bounds = entity.components.bounds;
					var contact = -1;

					// Horizontal
					var diff = (bounce ? bounds.left : bounds.right) - topLeft[0];
					if (diff <= 0) {
						contact = 3;
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
							contact = 1;
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
								contact = 0;
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
									contact = 2;
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
					if (contact < 0) {
						return;
					}
					var event = Event.create("border");
					event.contact = contact;
					event.diff = diff;
					if (!this.emit(event)) {
						return;
					}
					if (this.mode == "kill") {
						entity.destroy();
						return;
					}
					transform.translateTo(position);
					if (bounce && body != null) {
						body.velocity = velocity;
					}
				}
			}
		});

		return Border;
	})(Component);

	Component.create(Border, "border");
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports", "../core/component", "../core/event", "../math/vec2"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports, require("../core/component"), require("../core/event"), require("../math/vec2"));
	}
})(function (exports, _coreComponent, _coreEvent, _mathVec2) {
	"use strict";

	var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

	var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

	var Component = _interopRequire(_coreComponent);

	var Event = _interopRequire(_coreEvent);

	var Vec2 = _interopRequire(_mathVec2);

	var TriggerEvent = (function (_Event) {
		function TriggerEvent() {
			_classCallCheck(this, TriggerEvent);

			Event.call(this);
			this.other = null;
			this.overlap = 0;
			this._normal = Vec2();
		}

		_inherits(TriggerEvent, _Event);

		return TriggerEvent;
	})(Event);

	Vec2.defineProperty(TriggerEvent, "normal");
	Event.register(TriggerEvent, "trigger");

	var CollideEvent = (function (_Event2) {
		function CollideEvent() {
			_classCallCheck(this, CollideEvent);

			Event.call(this);
			this.other = null;
			this._normal = Vec2();
		}

		_inherits(CollideEvent, _Event2);

		return CollideEvent;
	})(Event);

	Vec2.defineProperty(CollideEvent, "normal");
	Event.register(CollideEvent, "collide");

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

	var Collider = (function (_Component) {
		function Collider() {
			_classCallCheck(this, Collider);

			Component.call(this);
			this.trigger = false;
			this.include = "";
			this.exclude = "";
		}

		_inherits(Collider, _Component);

		_createClass(Collider, {
			attributes: {
				get: function () {
					return {
						trigger: false,
						include: "",
						exclude: ""
					};
				}
			}
		});

		return Collider;
	})(Component);

	;

	var p = Vec2();
	var n = Vec2();
	var cache = Vec2();
	var pCache = Vec2();
	var nCache = Vec2();

	Collider.simulate = function (dt) {
		var colliders = this.registry.instances;
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
				var body1 = entity1.components.body;
				var body2 = entity2.components.body;
				if (!body1.awake && !body2.awake) {
					continue;
				}

				var include1 = collider1.include;
				var exclude1 = collider1.exclude;
				var include2 = collider2.include;
				var exclude2 = collider2.exclude;
				if (include1 && !entity2.hasComponent(include1) || include2 && !entity1.hasComponent(include2) || exclude1 && entity2.hasComponent(exclude1) || exclude2 && entity1.hasComponent(exclude2)) {
					continue;
				}

				var radius1 = entity1.components.bounds.radius;
				var radius2 = entity2.components.bounds.radius;
				var pos1 = entity1.components.transform.position;
				var pos2 = entity2.components.transform.position;
				var radiusSum = radius1 + radius2;

				var overlapSq = Vec2.distSq(pos1, pos2);
				if (overlapSq > radiusSum * radiusSum) {
					continue;
				}

				Vec2.norm(Vec2.sub(pos1, pos2, p));
				var overlap = Math.sqrt(overlapSq);

				if (collider1.trigger || collider2.trigger) {
					var triggerEvent = Event.create("trigger");
					triggerEvent.normal = p;
					triggerEvent.overlap = overlap;
					triggerEvent.other = entity2;
					entity1.emit(triggerEvent);

					triggerEvent = Event.create("trigger");
					triggerEvent.normal = p;
					triggerEvent.overlap = overlap;
					triggerEvent.other = entity1;
					entity2.emit(triggerEvent);
					continue;
				}

				overlap -= radiusSum;
				var vel1 = body1.velocity;
				var vel2 = body2.velocity;
				var mass1 = body1.mass || 1;
				var mass2 = body2.mass || 1;

				if (overlap < 0) {
					Vec2.add(pos1, Vec2.scale(p, -overlap * 2 * radius1 / radiusSum, cache));
					Vec2.add(pos2, Vec2.scale(p, overlap * 2 * radius2 / radiusSum, cache));
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

				var collideEvent = Event.create("collide");
				collideEvent.normal = n;
				collideEvent.other = entity2;
				entity1.emit(collideEvent, this);

				collideEvent = Event.create("collide");
				collideEvent.normal = n;
				collideEvent.other = entity1;
				entity2.emit(collideEvent, this);
			}
		}
	};

	Component.create(Collider, "collider");
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports", "../core/component", "../math/vec2", "../math/random"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports, require("../core/component"), require("../math/vec2"), require("../math/random"));
	}
})(function (exports, _coreComponent, _mathVec2, _mathRandom) {
	"use strict";

	var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

	var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

	var Component = _interopRequire(_coreComponent);

	var Vec2 = _interopRequire(_mathVec2);

	var chance = _mathRandom.chance;

	var force = Vec2();

	var Jitter = (function (_Component) {
		function Jitter() {
			_classCallCheck(this, Jitter);

			Component.call(this);
			this.factor = 0;
			this.force = 0;
		}

		_inherits(Jitter, _Component);

		_createClass(Jitter, {
			attributes: {
				get: function () {
					return {
						factor: 0.1,
						force: 250
					};
				}
			},
			fixedUpdate: {
				value: function fixedUpdate(dt) {
					if (chance(this.factor)) {
						Vec2.variant(Vec2.zero, this.force, force);
						this.components.body.applyForce(force);
					}
				}
			}
		});

		return Jitter;
	})(Component);

	Component.create(Jitter, "jitter");
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports", "module", "../core/entity", "../core/component", "../core/registry", "../core/context", "../math/mathf", "../math/vec2", "../math/random", "../math/tweens", "../math/color", "../core/sprite"], factory);
	} else if (typeof exports !== "undefined" && typeof module !== "undefined") {
		factory(exports, module, require("../core/entity"), require("../core/component"), require("../core/registry"), require("../core/context"), require("../math/mathf"), require("../math/vec2"), require("../math/random"), require("../math/tweens"), require("../math/color"), require("../core/sprite"));
	}
})(function (exports, module, _coreEntity, _coreComponent, _coreRegistry, _coreContext, _mathMathf, _mathVec2, _mathRandom, _mathTweens, _mathColor, _coreSprite) {
	"use strict";

	var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

	var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

	var Entity = _interopRequire(_coreEntity);

	var Component = _interopRequire(_coreComponent);

	var Registry = _interopRequire(_coreRegistry);

	var Context = _interopRequire(_coreContext);

	var TAU = _mathMathf.TAU;
	var clamp = _mathMathf.clamp;

	var Vec2 = _interopRequire(_mathVec2);

	var random = _mathRandom.random;

	var Tweens = _interopRequire(_mathTweens);

	var Color = _interopRequire(_mathColor);

	var SpriteAsset = _coreSprite.SpriteAsset;
	var SpriteSheet = _coreSprite.SpriteSheet;

	var Particle = (function (_Component) {
		function Particle() {
			_classCallCheck(this, Particle);

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

		_inherits(Particle, _Component);

		_createClass(Particle, {
			attributes: {
				get: function () {
					return {
						lifetime: 1,
						lifetimeVariant: 1,
						radius: 1,
						radiusVariant: 0,
						alphaVariant: 0,
						shrink: Tweens.quintIn,
						fade: Tweens.quintIn
					};
				}
			},
			create: {
				value: function create(attributes) {
					var variant = this.lifetimeVariant;
					if (variant > 0) {
						this.lifetime += random(-variant, variant);
					}
					variant = this.radiusVariant;
					if (variant > 0) {
						this.radius += random(-variant, variant);
					}
					variant = this.alphaVariant;
					if (variant > 0) {
						var transform = this.components.transform;
						transform.alpha = clamp(transform.alpha + random(-variant, variant), 0, 1);
					}
					this.age = 0;
				}
			},
			update: {
				value: function update(dt) {
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
			}
		}, {
			generateSpriteAsset: {
				value: function generateSpriteAsset(attributes) {
					attributes = attributes || {};
					var color = Color(attributes.color || Color.gray);
					var alpha = attributes.alpha || 1;
					var max = attributes.max = attributes.max || 25;
					var size = max * 2;
					var center = attributes.center || 0.5;
					var shape = attributes.shape || "circle";

					return new SpriteAsset(function (ctx) {
						for (var radius = 1; radius <= max; radius++) {
							var _top = max + size * (radius - 1);

							if (center < 1) {
								var grad = ctx.createRadialGradient(max, _top, 0, max, _top, radius);
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
								ctx.fillRect(max - radius / 2 | 0, _top - radius / 2, radius, radius);
							} else {
								ctx.beginPath();
								ctx.arc(max, _top, radius, 0, TAU, true);
								ctx.closePath();
								ctx.fill();
							}
						}
					}, Vec2(size, size * max));
				}
			},
			generateSpriteSheet: {
				value: function generateSpriteSheet(attributes) {
					attributes = attributes || {};
					var sprite = Particle.generateSpriteAsset(attributes);
					var size = attributes.max * 2;
					return new SpriteSheet({
						size: Vec2(size, size),
						sprites: sprite
					});
				}
			}
		});

		return Particle;
	})(Component);

	module.exports = Particle;

	Particle.defaultSpriteSheet = Particle.generateSpriteSheet();

	Entity.createPrefab("particle", {
		transform: null,
		body: {
			mass: 0.1,
			fast: true
		},
		particle: null,
		spriteTween: {
			asset: Particle.defaultSpriteSheet
		}
	});

	Component.create(Particle, "particle");
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports", "../core/component", "../core/registry", "../math/mathf", "../math/vec2"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports, require("../core/component"), require("../core/registry"), require("../math/mathf"), require("../math/vec2"));
	}
})(function (exports, _coreComponent, _coreRegistry, _mathMathf, _mathVec2) {
	"use strict";

	var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

	var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

	var Component = _interopRequire(_coreComponent);

	var Registry = _interopRequire(_coreRegistry);

	var EPSILON = _mathMathf.EPSILON;

	var Vec2 = _interopRequire(_mathVec2);

	var velocity = Vec2();
	var force = Vec2();
	var combinedVelocity = Vec2();
	var forceCache = Vec2();
	var cache = Vec2();

	var Physics = (function (_Component) {
		function Physics() {
			_classCallCheck(this, Physics);

			this._gravity = Vec2();
		}

		_inherits(Physics, _Component);

		_createClass(Physics, {
			attributes: {
				get: function () {
					return {
						gravity: Vec2()
					};
				}
			},
			simulate: {

				// onBodyCreate(event) {
				// 	console.log(event.)
				// }

				value: function simulate(dt) {
					var dtSq = dt * dt;
					var bodies = Registry.types.body.instances;
					for (var i = 0, l = bodies.length; i < l; i++) {
						var body = bodies[i];
						if (!body.enabled || body.fixed) {
							continue;
						}
						var transform = body.components.transform;
						body.copyVelocity(velocity);
						Vec2.add(body._force, body._continuousForce, force);

						// Fast path (no mass)
						if (body.fast) {
							if (body.maxForce > 0) {
								Vec2.limit(force, body.maxForce);
							}
							Vec2.add(velocity, Vec2.scale(force, dt));
							if (body.maxVelocity > 0) {
								Vec2.limit(velocity, body.maxVelocity);
							}
							body.force = Vec2.zero;
							body.velocity = velocity;
							transform.translateBy(Vec2.scale(velocity, dt));
							continue;
						}

						// Apply scene gravity
						var gravity = this._gravity;
						if (Vec2.lenSq(gravity) > 0 && body.mass > EPSILON) {
							Vec2.add(force, body.mass !== 1 ? Vec2.scale(gravity, 1 / body.mass, cache) : gravity);
						}

						// Apply friction
						if (body.friction > 0) {
							Vec2.add(force, Vec2.scale(Vec2.norm(velocity, cache), -body.friction));
						}

						if (body.maxForce > 0) {
							Vec2.limit(force, body.maxForce);
						}

						/*
      // http://www.compsoc.man.ac.uk/~lucky/Democritus/Theory/verlet.html#velver
      // http://en.wikipedia.org/wiki/Verlet_integration#Velocity_Verlet
      let lastForce = Vec2.scale(body.lastForce, dt / 2);
      */

						transform.translateBy(Vec2.add(Vec2.scale(velocity, dt, combinedVelocity), Vec2.scale(force, 0.5 * dtSq, forceCache)));

						Vec2.add(velocity, Vec2.scale(force, dt, forceCache));

						// Apply drag
						if (body.drag < 1) {
							Vec2.scale(velocity, body.drag);
						}

						// Limit velocity
						if (body.maxVelocity > 0) {
							Vec2.limit(velocity, body.maxVelocity);
						}

						var minVelocity = body.minVelocity;
						if (minVelocity > 0) {
							if (Vec2.lenSq(velocity) <= minVelocity * minVelocity) {
								if (!body.sleeping) {
									Vec2.set(velocity);
									body.sleeping = true;
									body.emit("bodySleep");
								}
							} else {
								if (body.sleeping) {
									body.sleeping = false;
									body.emit("bodyWake");
								}
							}
						}

						// Reset force
						body.force = Vec2.zero;
						body.velocity = velocity;
					}
				}
			}
		});

		return Physics;
	})(Component);

	Component.create(Physics, "physics");
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports", "../../core/component", "../../core/context", "../../math/vec2"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports, require("../../core/component"), require("../../core/context"), require("../../math/vec2"));
	}
})(function (exports, _coreComponent, _coreContext, _mathVec2) {
	"use strict";

	var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

	var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

	var Component = _interopRequire(_coreComponent);

	var Context = _interopRequire(_coreContext);

	var Vec2 = _interopRequire(_mathVec2);

	var Box2dBody = exports.Box2dBody = (function (_Component) {
		function Box2dBody() {
			_classCallCheck(this, Box2dBody);

			Component.call(this);
			this.definition = new b2BodyDef();
			this.fixture = new b2FixtureDef();
			this.body = null;
			this.world = null;
		}

		_inherits(Box2dBody, _Component);

		_createClass(Box2dBody, {
			create: {
				value: function create() {
					var $body = this.components.body;
					this.world = Context.components.b2System.world;

					var definition = this.definition;
					var fixture = this.fixture;

					var definitions = definitionPresets;
					for (var _i = 0, _l = definitions.length; _i < _l; _i++) {
						var key = definitions[_i];
						definition["set_" + key]($body[key]);
					}

					var fixed = $body.fixed;
					definition.set_type(fixed ? b2_staticBody : b2_dynamicBody);
					var body = world.CreateBody(definition);
					body.SetUserData(this.uid);

					for (i = 0, l = fixturePresets.length; i < l; i++) {
						var key = fixturePresets[i];
						fixture["set_" + key]($body[key]);
					}

					var bounds = this.components.bounds;
					var shape = null;
					switch (bounds.shape) {
						case "poly":
							shape = new b2PolygonShape();
							shape.SetAsArray(bounds.points, bounds.points.length);
							break;
						case "rect":
							shape = new b2PolygonShape();
							shape.SetAsBox(bounds.size[0] / 2, bounds.size[1] / 2);
							break;
						default:
							shape = new b2CircleShape();
							shape.set_m_radius(bounds.radius);
							break;
					}
					fixture.set_shape(shape);
					body.CreateFixture(fixture);

					box2dCache.Set(this.transform.position[0], this.transform.position[1]);
					body.SetTransform(box2dCache, this.transform.angle);

					box2dCache.Set($body.velocity[0], $body.velocity[1]);
					body.SetLinearVelocity(box2dCache);

					body.SetActive(1);
					this.body = body;
				}
			},
			free: {
				value: function free() {
					this.world.DestroyBody(this.body);
				}
			}
		});

		return Box2dBody;
	})(Component);

	Component.create(Box2dBody, "box2dBody");

	var Box2dSystem = exports.Box2dSystem = (function (_Component2) {
		function Box2dSystem() {
			_classCallCheck(this, Box2dSystem);

			this._gravity = Vec2();
		}

		_inherits(Box2dSystem, _Component2);

		_createClass(Box2dSystem, {
			attributes: {
				get: function () {
					return {
						gravity: Vec2()
					};
				}
			},
			create: {
				value: function create() {
					var gravity = new b2Vec2(this._gravity[0], this._gravity[1]);
					this.world = new b2World(gravity);
				}
			},
			onBodyCreate: {
				value: function onBodyCreate(event) {
					event.entity.createComponent("box2dBody");
				}
			},
			onBodyDestroy: {
				value: function onBodyDestroy(event) {
					event.entity.components.box2dBody.destroy();
				}
			},
			applyContinuesForce: {
				value: function applyContinuesForce(impulse) {
					box2dCache.Set(impulse[0], impulse[1]);
					this.body.ApplyLinearImpulse(box2dCache, this.body.GetWorldCenter());
				}
			},
			fixedUpdate: {
				value: function fixedUpdate() {
					Body.b2World.Step(dt * 2, 3, 3);
					var box2dBodies = Registry.types.b2Body.instances;
					for (var _i = 0, _l = b2Bodies.length; _i < _l; _i++) {
						var box2dBody = box2dBodies[_i];
						var body = box2dBody.components.body;
						if (!body.enabled || body.fixed) {
							continue;
						}
						if (b2body.IsAwake()) {
							var pos = b2body.GetPosition();
							var transform = body.components.transform;
							Vec2.set(vec2Cache, pos.get_x(), pos.get_y());
							transform.translateTo(vec2Cache);
							if (!body.fixedRotation) {
								transform.rotateTo(b2body.GetAngle());
							}
						}
					}
				}
			}
		});

		return Box2dSystem;
	})(Component);

	;

	Color.defineProperty(Box2dSystem, "gravity");

	Component.create(Box2dSystem, "box2dSystem");

	var box2dCache = new b2Vec2(0, 0);
	var vec2Cache = Vec2();

	var definitionPresets = ["allowSleep", "angularVelocity", "awake", "bullet", "fixedRotation"];
	var fixturePresets = ["density", "friction", "restitution"];

	/*
 let listener = Body.listener = new b2ContactListener();
 
 b2customizeVTable(listener, [
 	{
 		original: b2ContactListener.prototype.PostSolve,
 		replacement: function(contactPtr, impulsePtr) {
 			let bodyA, bodyB, contact;
 			contact = b2wrapPointer(contactPtr, b2Contact);
 			console.log(contact.GetFixtureA().GetBody());
 			bodyA = contact.GetFixtureA().GetBody().userData;
 			bodyB = contact.GetFixtureB().GetBody().userData;
 			bodyA.entity.emit('onCollide', bodyB.entity);
 			bodyB.entity.emit('onCollide', bodyA.entity);
 			return null;
 		}
 	}
 ]);
 
 new Registry(Body);
 
 module.exports = Body;
 */
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
});
(function (factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  }
})(function (exports) {
  "use strict";

  var Box2D = require("./lib/box2dweb");

  module.exports = {
    Vec2: Box2D.Common.Math.b2Vec2,
    BodyDef: Box2D.Dynamics.b2BodyDef,
    Body: Box2D.Dynamics.b2Body,
    FixtureDef: Box2D.Dynamics.b2FixtureDef,
    Fixture: Box2D.Dynamics.b2Fixture,
    World: Box2D.Dynamics.b2World,
    MassData: Box2D.Collision.Shapes.b2MassData,
    PolygonShape: Box2D.Collision.Shapes.b2PolygonShape,
    CircleShape: Box2D.Collision.Shapes.b2CircleShape,
    DebugDraw: Box2D.Dynamics.b2DebugDraw,
    WorldManifold: Box2D.Collision.b2WorldManifold
  };
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports);
	}
})(function (exports) {
	"use strict";

	var Component = require("./../../core/component");
	var Registry = require("./../../core/registry");
	var Vec2 = require("./../../core/math").Vec2;
	var B2 = require("./b2");

	function Body() {
		this.definition = new B2.BodyDef();
		this.fixture = new B2.FixtureDef();
	}

	Body.prototype = Object.create(Component.prototype);

	Body.prototype.type = "b2Body";

	Body.prototype.attributes = {
		fixed: false,
		velocity: Vec2(),
		allowSleep: true,
		angularVelocity: 0,
		awake: true,
		bullet: false,
		fixedRotation: false,
		density: 1,
		friction: 0.5,
		restitution: 0.2
	};

	Body.definitionPresets = ["allowSleep", "angularVelocity", "awake", "bullet", "fixedRotation"];

	Body.fixturePresets = ["density", "friction", "restitution"];

	Body.prototype.create = function (attributes) {
		var world = this.root.b2World;
		if (!world) {
			var gravity = new B2.Vec2(this.root.gravity[0], this.root.gravity[1]);
			world = new B2.World(gravity);
			this.root.b2World = world;
			Body.b2World = world;
		}
		var definition = this.definition;
		var fixture = this.fixture;
		var key = "";

		var definitions = Body.definitionPresets;
		for (var i = 0, l = definitions.length; i < l; i++) {
			key = definitions[i];
			definition[key] = attributes[key];
		}

		definition.userData = this;
		Vec2.toObj(this.transform.position, definition.position);
		definition.angle = this.transform.rotation;
		Vec2.toObj(attributes.velocity, definition.linearVelocity);

		var fixed = this.fixed = attributes.fixed;
		definition.type = fixed ? B2.Body.b2_staticBody : B2.Body.b2_dynamicBody;

		this.b2body = world.CreateBody(definition);
		var fixtures = Body.fixturePresets;
		for (i = 0, l = fixtures.length; i < l; i++) {
			key = fixtures[i];
			fixture[key] = attributes[key];
		}
		var bounds = this.bounds;
		switch (bounds.shape) {
			case "circle":
				fixture.shape = new B2.CircleShape(bounds.radius);
				break;
			case "poly":
				fixture.shape = new B2.PolygonShape(bounds.radius);
				fixture.shape.SetAsArray(bounds.points, bounds.points.length);
				break;
			case "rect":
				fixture.shape = new B2.PolygonShape();
				fixture.shape.SetAsBox(bounds.size[0] / 2, bounds.size[1] / 2);
				break;
		}
		this.b2body.CreateFixture(fixture);
	};

	Body.prototype.onTransform = function () {
		this.b2body.SetPositionAndAngle(Vec2.toObj(this.transform.position), this.transform.rotation);
	};

	Body.prototype.onEnable = function () {
		this.b2body.SetActive(true);
	};

	Body.prototype.onDisable = function () {
		this.b2body.SetActive(false);
	};

	Body.prototype.dealloc = function () {
		Body.b2World.DestroyBody(this.b2body);
		this.b2body = null;
	};

	Body.prototype.applyContinuesForce = function (impulse) {
		this.b2body.ApplyImpulse(Vec2.toObj(impulse), this.b2body.GetWorldCenter());
	};

	var manifoldCache = new B2.WorldManifold();
	var impulseCache = Vec2();
	var pointCache = Vec2();

	Body.PostSolve = function (contact, impulse) {
		var bodyA = contact.GetFixtureA().GetBody().GetUserData();
		var bodyB = contact.GetFixtureB().GetBody().GetUserData();
		Vec2.copy(impulseCache, impulse.tangentImpulses);
		contact.GetWorldManifold(manifoldCache);
		Vec2.fromObj(manifoldCache.m_points[0], pointCache);
		bodyA.entity.emit("onCollide", bodyB.entity, impulseCache);
		bodyB.entity.emit("onCollide", bodyA.entity, impulseCache);
		return null;
	};

	var empty = function empty(contact) {
		return null;
	};
	Body.BeginContact = empty;
	Body.EndContact = empty;
	Body.PreSolve = empty;

	Body.fixedUpdate = function (dt) {
		Body.b2World.Step(dt * 2, 4, 2);
		var definitions = this.instances;
		for (var i = 0, l = definitions.length; i < l; i++) {
			var body = definitions[i];
			if (!(body.enabled && !body.fixed)) {
				continue;
			}
			var b2body = body.b2body;
			if (b2body.IsAwake()) {
				Vec2.fromObj(b2body.GetPosition(), body.transform.position);
				body.transform.rotation = b2body.GetAngle();
			}
		}
	};

	new Registry(Body);

	module.exports = Body;
});
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["exports", "../../core/component", "../../core/context", "../../core/registry", "../../math/color"], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports, require("../../core/component"), require("../../core/context"), require("../../core/registry"), require("../../math/color"));
	}
})(function (exports, _coreComponent, _coreContext, _coreRegistry, _mathColor) {
	"use strict";

	var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

	var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

	var Component = _interopRequire(_coreComponent);

	var Context = _interopRequire(_coreContext);

	var Registry = _interopRequire(_coreRegistry);

	var Color = _interopRequire(_mathColor);

	var PixiSprite = exports.PixiSprite = (function (_Component) {
		function PixiSprite() {
			_classCallCheck(this, PixiSprite);

			Component.call(this);
			this.container = null;
			this.sprite = new PIXI.Sprite();
		}

		_inherits(PixiSprite, _Component);

		_createClass(PixiSprite, {
			create: {
				value: function create() {
					this.container = Context.components.pixiSpriteSystem.camera;
				}
			},
			free: {
				value: function free() {
					this.container.removeChild(this.sprite);
				}
			}
		});

		return PixiSprite;
	})(Component);

	Component.create(PixiSprite, "pixiSprite");

	var PixiSpriteSystem = exports.PixiSpriteSystem = (function (_Component2) {
		function PixiSpriteSystem() {
			_classCallCheck(this, PixiSpriteSystem);

			if (_Component2 != null) {
				_Component2.apply(this, arguments);
			}
		}

		_inherits(PixiSpriteSystem, _Component2);

		_createClass(PixiSpriteSystem, {
			create: {
				value: function create() {
					PIXI.dontSayHello = true;
					var renderer = Context.renderer;
					this.stage = new PIXI.Stage(16777215); // Color.toHex(renderer.color)
					this.camera = new PIXI.DisplayObjectContainer();
					this.stage.addChild(this.camera);
					this.renderer = new PIXI.WebGLRenderer(renderer.content[0], renderer.content[1], {
						view: renderer.canvas,
						resolution: renderer.ratio
					});
					this.renderer.resize(renderer.content[0], renderer.content[1]);
				}
			},
			onSpriteTweenCreate: {
				value: function onSpriteTweenCreate(event) {
					event.entity.createComponent("pixiSprite");
				}
			},
			onSpriteTweenDestroy: {
				value: function onSpriteTweenDestroy(event) {
					event.entity.components.pixiSprite.destroy();
				}
			},
			render: {
				value: function render() {
					var pixiSprites = Registry.types.pixiSprite.instances;
					var added = false;
					for (var i = 0, l = pixiSprites.length; i < l; i++) {
						var pixiSprite = pixiSprites[i];
						if (!pixiSprite.enabled) {
							continue;
						}
						var tween = pixiSprite.components.spriteTween;
						var sprite = pixiSprite.sprite;
						if (tween != null) {
							if (!tween.enabled) {
								continue;
							}
							var asset = tween.asset;
							if (!asset.ready) {
								if (!asset.prepare()) {
									continue;
								}
								if (asset.frames != null) {
									var _frames = asset.frames;
									for (var j = 0, k = _frames.length; j < k; j++) {
										var frame = _frames[j];
										frame.pixiTexture = new PIXI.Texture.fromCanvas(frame.sprite.buffer, PIXI.scaleModes.NEAREST);
										var size = frame.size;
										var position = frame.position;

										frame.pixiTexture.setFrame(new PIXI.Rectangle(position[0] | 0, position[1] | 0, size[0] | 0, size[1] | 0));
									}
								}
							}

							if (asset.frames != null) {
								var frame = asset.frames[tween.frame];
								if (sprite.texture != frame.pixiTexture) {
									Vec2.toObj(frame.anchor, sprite.anchor);
									sprite.setTexture(frame.pixiTexture);
								}
							} else if (sprite.texture != null) {
								sprite.setTexture(new PIXI.Texture.fromCanvas(asset.buffer, PIXI.scaleModes.NEAREST));
								Vec2.toObj(asset.defaultAnchor, sprite.anchor);
							}
						}
						if (!sprite.stage) {
							if (!sprite.texture) {
								throw new Error("PIXI.Sprite without texture");
							}
							this.camera.addChild(sprite);
							added = true;
						}
						var transform = pixiSprite.components.transform;
						Vec2.toObj(transform.position, sprite.position);
						sprite.rotation = transform.rotation;
						sprite.alpha = transform.alpha;
					}
					// if (added) {
					// 	debugger;
					// 	// this.stage.children.sort(depthCompare);
					// }
					Vec2.toObj(this.renderer.projection, Context.renderer.position);
					this.renderer.render(this.stage);
				}
			}
		});

		return PixiSpriteSystem;
	})(Component);

	;

	// function depthCompare(a, b) {
	// 	if (a.layer < b.layer) {
	// 		return -1;
	// 	}
	// 	if (a.layer > b.layer) {
	// 		return 1;
	// 	}
	// 	return 0;
	// }

	Component.create(PixiSpriteSystem, "pixiSpriteSystem");
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
});
//# sourceMappingURL=acme.js.map