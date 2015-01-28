/* @flow */
/**
 * @module core/shims
 */

if (typeof window != 'undefined') {
	// performance.now
	var perf = window.performance || (window.performance = {});
	perf.now = perf.now || perf.webkitNow || perf.msNow || perf.mozNow || Date.now;

	perf.nextTick = (function() {
		var queue = [];
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

	window.requestAnimationFrame = window.requestAnimationFrame ||
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
	for (var key in properties) {
		obj[key] = properties[key];
	}
	return obj;
};
*/