/* @flow */

export let performance = null;
export let requestAnimationFrame = null;

if (typeof window != 'undefined') {
	// performance.now
	performance = window.performance || (window.performance = {});
	performance.now = performance.now || performance.webkitNow ||
		performance.msNow || performance.mozNow || Date.now;

	performance.nextTick = (function() {
		let queue = [];
		function nextTick(fn) {
			queue.push(fn);
			window.postMessage('nexttick', '*');
		}
		function handleMessage(event) {
			if (event.source != window || event.data != 'nexttick') {
				return;
			}
			event.stopPropagation();
			if (queue.length > 0) {
				queue.shift()();
			}
		}

		window.addEventListener('message', handleMessage, true);
		return nextTick;
	})();

	requestAnimationFrame = window.requestAnimationFrame ||
		window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame;
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