'use strict';

var assert = require('assert');
var Mat2 = require('../../lib/math/mat2');

describe('Mat2', function() {

	describe('#constructor()', function() {

		it('should return a Float32Array', function() {
			assert(Mat2() instanceof Float32Array);
			assert(Mat2([1, 1, 1, 1, 1, 1]) instanceof Float32Array);
			assert(Mat2(new Float32Array([1, 1, 1, 1, 1, 1])) instanceof Float32Array);
			assert(Mat2(1, 1, 1, 1, 1, 1) instanceof Float32Array);
		});

		it('should convert the given arguments into a Float32Array', function() {
			assert.deepEqual(Mat2(), new Float32Array([1, 0, 0, 1, 0, 0]));
			assert.deepEqual(Mat2(1, 1, 1, 1, 1, 1), new Float32Array([1, 1, 1, 1, 1, 1]));
			assert.deepEqual(Mat2([1, 1, 1, 1, 1, 1]), new Float32Array([1, 1, 1, 1, 1, 1]));
		});

	});

})