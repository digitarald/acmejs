'use strict';

var assert = require('assert');
var Mathf = require('../../lib/math/mathf');

describe('Mathf', function() {
	describe('uid()', function() {
		it('should return an integer', function() {
			var uid = Mathf.uid();
			assert.strictEqual(uid, parseInt(uid));
		});

		it('should return a new number each call', function() {
			var uid = Mathf.uid();
			var uid2 = Mathf.uid();
			assert.notEqual(uid, uid2);
		});
	});

	describe('clamp()', function() {
	});

	describe('map()', function() {
	});

	describe('mod()', function() {
	});

	describe('repeat()', function() {
	});

	describe('toDeg()', function() {
	});

	describe('toRad()', function() {
	});

	describe('normDeg()', function() {
	});

	describe('normRad()', function() {
	});

	describe('distDeg()', function() {
	});

	describe('distRad()', function() {
	});

	describe('lerp()', function() {
	});

	describe('distAng()', function() {
	});

	describe('smoothDamp()', function() {
	});
})