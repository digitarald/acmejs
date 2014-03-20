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
