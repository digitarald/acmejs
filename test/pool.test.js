'use strict';

var assert = require('assert');
var Pool = require('../lib/core/pool');

describe('Pool', function() {

	function createClass(type) {
		function TestClass() {}
		TestClass.prototype.type = type || 'testCls';
		return TestClass;
	}

	function createPool(type) {
		var cls = createClass(type);
		return new Pool(cls);
	}

	function createComplexPool(options) {
		options = options || {};
		var MyClass = createClass();
		MyClass.prototype.alloc = function() {
			this.allocWasCalled = true;
			if (options.alloc) {
				alloc.call(this, arguments);
			}
		};
		MyClass.prototype.attributes = options.noAttributes ? {} : {
			say: 'a',
			speed: 1
		};
		if (options.props) {
			for (var name in options.props) {
				MyClass[name] = options.props[name];
			}
		}
		if (options.proto) {
			for (var name in options.proto) {
				MyClass.prototype[name] = options.proto[name];
			}
		}
		return new Pool(MyClass);
	}

	beforeEach(function() {
		Pool.reset();
	});

	describe('#constructor()', function() {

		it('should register a new type for a class', function() {
			var type = 'myCls';
			var MyClass = createClass(type);
			var pool = new Pool(MyClass);

			assert.equal(pool.cls, MyClass, 'class was not set');
			assert.equal(Pool.byType.myCls, pool, 'class was not registered');
		});

	});

	describe('#alloc()', function() {

		it('should allocate a new entity', function() {
			var MyClass = createClass();
			var pool = new Pool(MyClass);
			var instance = pool.alloc();

			assert.ok(instance instanceof MyClass, 'class was not instanciated');
		});

		it('should allocate a new entity and call alloc', function() {
			var pool = createComplexPool({
				noAttributes: true
			});
			var instance = pool.alloc();

			assert.ok(instance.allocWasCalled);
		});

		it('should create with default attributes', function() {
			var pool = createComplexPool();
			var instance = pool.alloc();

			assert.equal(instance.say, 'a', 'string was not defaulted');
			assert.equal(instance.speed, 1, 'number was not defaulted');
		});

		it('should create with merged attributes', function() {
			var pool = createComplexPool();
			var instance = pool.alloc(null, {
				speed: 2
			});

			assert.equal(instance.say, 'a', 'string was not defaulted');
			assert.equal(instance.speed, 2, 'number was not set');
		});

		it('should register callbacks for a class', function() {
			var MyClass = createClass();
			MyClass.prototype.update = function() {};
			var pool = new Pool(MyClass);
			var instance = pool.alloc();

			assert.ok(instance instanceof MyClass, 'wrong instance');
			assert.equal(Pool.calls.update[0], instance);
		});

	});

})