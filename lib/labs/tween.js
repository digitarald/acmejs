'use strict';

var Component = require('./component');
var Vec2 = require('./math').Vec2;

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

	create: function(attributes) {
		this.rotation = attributes.rotation;
		this.alpha = attributes.alpha;
		Vec2.copy(this.position, attributes.position);
	}

};

new Component('tween', Tween);

function Animation(keyframes) {
}

Animation.prototype.update = function(entity, dt) {
};

Tween.Animation = Animation;

module.exports = Tween;
