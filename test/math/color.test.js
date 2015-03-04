'use strict';

var assert = require('assert');
var Color = require('../../lib/math/color');

describe('Color', function() {

	describe('#constructor()', function() {

		it('should return a Float32Array', function() {
			assert(Color() instanceof Float32Array);
			assert(Color([1, 1, 1, 1]) instanceof Float32Array);
			assert(Color(new Float32Array([1, 1, 1])) instanceof Float32Array);
			assert(Color(1, 1, 1) instanceof Float32Array);
		});

		it('should convert the given arguments into a Float32Array', function() {
			assert.deepEqual(Color(), new Float32Array([255, 255, 255, 1]));
			assert.deepEqual(Color(1, 1, 1, 1), new Float32Array([1, 1, 1, 1]));
			assert.deepEqual(Color([1, 1, 1, 1]), new Float32Array([1, 1, 1, 1]));
		});

	});

})