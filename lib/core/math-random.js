'use strict';

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

var Random = {};

var rand = function() {
	// define the recurrence relationship
	z = (a * z + c) % m;
	// return a float in [0, 1)
	// if z = m then z / m = 0 therefore (z % m) / m < 1 always
	return z / m;
};

Random.srand = function(seed) {
	z = seed | 0;
};

Random.rand = rand;

function linear(x) {
	return x;
}

Random.randRange = function(low, high, ease) {
	return (ease || linear)(rand()) * (high - low) + low;
};

Random.srandArray = function(array) {
	return array[rand() * array.length + 0.5 | 0];
};

Random.chance = function(chance) {
	return rand() <= chance;
};

/**
 * @deprecated
 */
Math.rand = Random.randRange;

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