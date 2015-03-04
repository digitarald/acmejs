/* @flow */

var Tweens = {
	linear: function(t:number):number {
		return t;
	}
};

export default Tweens;

// http://greweb.me/2012/02/bezier-curve-based-easing-functions-from-concept-to-implementation/
// https://github.com/petehunt/react-touch/blob/gh-pages/src/math/EasingFunctions.js
// https://gist.github.com/gre/1650294
// http://joshondesign.com/2013/03/01/improvedEasingEquations

function powIn(exp:number) {
	return function(t:number):number {
		return Math.pow(t, exp);
	};
}

function toOut(exp:number) {
	return function(t:number):number {
		return 1 - Math.pow(1 - t, exp);
	};
}

function toInOut(exp:number) {
	return function(t:number):number {
		return ((t < 0.5) ? Math.pow(t * 2, exp) : 2 - Math.pow(2 * (1 - t), exp)) / 2;
	};
}

var transitions = ['quad', 'cubic', 'quart', 'quint'];
for (var i = 0, l = transitions.length; i < l; i++) {
	var transition = transitions[i];
	Tweens[transition + 'In'] = powIn(i + 2);
	Tweens[transition + 'Out'] = toOut(i + 2);
	Tweens[transition + 'InOut'] = toInOut(i + 2);
}
