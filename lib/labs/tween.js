'use strict';

var Component = require('./component');
var Vec2 = require('./math').Vec2;

function Tween() {
	this.animation = [];
}

Tween.prototype = {
	attributes: {
		pos: Vec2(),
		angle: 0,
		alpha: 1
	},
	create: function(attributes) {
		this.angle = attributes.angle;
		this.alpha = attributes.alpha;
		Vec2.copy(this.pos, attributes.pos);
	}
};

new Component('tween', Tween);

function Animation(keyframes) {
}

Animation.prototype.update = function(entity, dt) {
};

Tween.Animation = Animation;

module.exports = Tween;
