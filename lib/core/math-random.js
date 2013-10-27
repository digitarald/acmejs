'use strict';

// http://weblog.bocoup.com/random-numbers/
// https://gist.github.com/Protonk/5367430

// Linear Congruential Generator
// Variant of a Lehman Generator

// Set to values from http://en.wikipedia.org/wiki/Numerical_Recipes
// m is basically chosen to be large (as it is the max period)
// and for its relationships to a and c
var m = 4294967296,
	// a - 1 should be divisible by m's prime factors
	a = 1664525,
	// c and m should be co-prime
	c = 1013904223,
	seed = 0,
	z = 0;

var random = function() {
	// define the recurrence relationship
	z = (a * z + c) % m;
	// return a float in [0, 1)
	// if z = m then z / m = 0 therefore (z % m) / m < 1 always
	return z / m;
};
Math._random = Math.random;
Math.random = random;

Math.rand = function(low, high, ease) {
	return (ease || Math.linear)(random()) * (high - low) + low;
};

Math.randArray = function(array) {
	return array[random() * array.length + 0.5 | 0];
};

Math.chance = function(chance) {
	return random() <= chance;
};

Object.defineProperty(random, 'seed', {
	set: function(value) {
		seed = z = Math.round(value || Math._random() * m);
	},
	get: function() {
		return seed;
	},
	enumerable: false,
	configurable: false
});

random.seed = null;

module.exports = random;