/* @flow */

// API ideas: http://docs.python.org/2/library/random.html
// http://weblog.bocoup.com/random-numbers/
// https://gist.github.com/Protonk/5367430

// Linear Congruential Generator
// Variant of a Lehman Generator

// Set to values from http://en.wikipedia.org/wiki/Numerical_Recipes
// m is basically chosen to be large (as it is the max period)
// and for its relationships to a and c
let m = 4294967296;
// a - 1 should be divisible by m's prime factors
let a = 1664525;
// c and m should be co-prime
let c = 1013904223;
let z = 0;

/**
 * Seed based Math.random()
 * Inspired by http://processing.org/reference/random_.html
 * @param  {Number} low
 * @param  {Number} high
 * @return {Number} Number between 0 and 1
 */
export function random(low:number, high:number):number {
	if (high == null) {
		if (low == null) {
			high = 1.0;
		} else {
			high = low;
		}
		low = 0.0;
	}
	// define the recurrence relationship
	z = (a * z + c) % m;
	// return a float in [0, 1)
	// if z = m then z / m = 0 therefore (z % m) / m < 1 always
	return z / m * (high - low) + low;
};

export {random as random};

/**
 * Set seed
 * @param  {Number} seed
 */
export function srand(seed:number):void {
	z = seed | 0;
}

export function values(values:Array<number>):number {
	return values[random(values.length) | 0];
}

export function valuesKey(values:Array<number>):number {
	return random(values.length) | 0;
}

export function chance(chance:number):boolean {
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
