'use strict';

var assert = require('assert');
var Registry = require('../../lib/core/registry');

describe('Registry', function() {

	function createClass(type) {
		function TestClass() {}
		TestClass.prototype.type = type || 'testCls';
		return TestClass;
	}

	function createRegistry(type) {
		var cls = createClass(type);
		return new Registry(cls);
	}

	function createComplexRegistry(options) {
		options = options || {};
		var MyClass = createClass();
		MyClass.prototype.allocate = function() {
			this.allocateWasCalled = true;
			if (options.allocate) {
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
		return new Registry(MyClass);
	}

	beforeEach(function() {
		Registry.reset();
	});

	describe('#constructor()', function() {

		it('should register a new type for a class', function() {
			var type = 'myCls';
			var MyClass = createClass(type);
			var registry = new Registry(MyClass);

			assert.equal(registry.cls, MyClass, 'class was not set');
			assert.equal(Registry.types.myCls, registry, 'class was not registered');
		});

	});

	describe('#allocate()', function() {

		it('should allocate a new entity', function() {
			var MyClass = createClass();
			var registry = new Registry(MyClass);
			var instance = registry.allocate();

			assert.ok(instance instanceof MyClass, 'class was not instanciated');
		});

		it('should allocate a new entity and call alloc', function() {
			var registry = createComplexRegistry({
				noAttributes: true
			});
			var instance = registry.allocate();

			assert.ok(instance.allocateWasCalled);
		});

		it('should create with default attributes', function() {
			var registry = createComplexRegistry();
			var instance = registry.allocate();

			assert.equal(instance.say, 'a', 'string was not defaulted');
			assert.equal(instance.speed, 1, 'number was not defaulted');
		});

		it('should create with merged attributes', function() {
			var registry = createComplexRegistry();
			var instance = registry.allocate(null, {
				speed: 2
			});

			assert.equal(instance.say, 'a', 'string was not defaulted');
			assert.equal(instance.speed, 2, 'number was not set');
		});

		it('should register callbacks for a class', function() {
			var MyClass = createClass();
			MyClass.prototype.update = function() {};
			var registry = new Registry(MyClass);
			var instance = registry.allocate();

			assert.ok(instance instanceof MyClass, 'wrong instance');
			// FIXME: Implementation detail
			assert.equal(Registry.methods.update[0], instance);
		});

	});

})