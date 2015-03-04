'use strict';

var assert = require('assert');
var Random = require('../../lib/math/random');

describe('Random', function() {

	describe('random()', function() {

		it('should return a float', function() {
			var f = Random.random(0, 1);
			assert.strictEqual(f, parseFloat(f));
		});

		it('should return a number between min and max', function() {
			var f = Random.random(1, 1.1);
			assert(f >= 1);
			assert(f <= 1.1);
		});

	});

})