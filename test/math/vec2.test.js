'use strict';

var assert = require('assert');
var Vec2 = require('../../lib/math/vec2');

describe('Vec2', function() {

	describe('#constructor()', function() {

		it('should return a Float32Array', function() {
			assert(Vec2() instanceof Float32Array);
			assert(Vec2([1, 1]) instanceof Float32Array);
			assert(Vec2(new Float32Array([1, 1])) instanceof Float32Array);
			assert(Vec2(1, 1) instanceof Float32Array);
		});

		it('should convert the given arguments into a Float32Array', function() {
			assert.deepEqual(Vec2(), new Float32Array([0, 0]));
			assert.deepEqual(Vec2(1, 1), new Float32Array([1, 1]));
			assert.deepEqual(Vec2([1, 1]), new Float32Array([1, 1]));
		});

	});

})