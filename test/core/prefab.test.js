'use strict';

var assert = require('assert');
import Registry from '../../lib/core/registry';
import Component from '../../lib/core/component';
import Entity from '../../lib/core/entity';

describe('Prefab', function() {

	before(function() {

		function Movable() {
			Component.call(this);
			this.speed = 0;
			this.friction = 0;
		}
		Movable.prototype = {
			attributes: {
				speed: 1,
				friction: 0
			}
		};
		Component.create(Movable, 'movable');

		function Paintable() {
			Component.call(this);
			this.color = '';
			this.opacity = 0;
		}
		Paintable.prototype = {
			attributes: {
				color: 'red',
				opacity: 1
			}
		};
		Component.create(Paintable, 'paintable');
	});

	beforeEach(function() {
		Entity.reset();
	});

	describe('#constructor()', function() {

		it('should register a new type for prefab', function() {
			var prefab = Entity.createPrefab('test', {});

			assert.equal(prefab.id, 'test');
			assert.deepEqual(prefab.components, {});
		});

		it('should allow multiple components', function() {
			var components = {
				movable: {
					speed: 0
				},
				paintable: {
					color: 'blue'
				}
			};
			var prefab = Entity.createPrefab('test', components);

			assert.equal(prefab.id, 'test');
			assert.deepEqual(prefab.components, components);
		});

	});

	describe('#create()', function() {

		it('should create an entity a new type for prefab', function() {
			var prefab = Entity.createPrefab({
				id: 'test'
			});
			var entity = prefab.create();

			assert.ok(entity instanceof Entity, 'expected entity instance');
		});

		it('should create an entity with default components', function() {
			var prefab = Entity.createPrefab('test', {
				paintable: null
			});
			var entity = prefab.create();

			assert.ok(entity.hasComponent('paintable'), 'expected paintable component');
			assert.equal(entity.components.paintable.color, 'red', 'expected paintable to be color red');
			assert.equal(entity.components.paintable.opacity, 1, 'expected paintable to be opacity 1');
		});

		it('should create an entity with overridden component', function() {
			var prefab = Entity.createPrefab('test', {
				paintable: {
					color: 'blue'
				}
			});
			var entity = prefab.create();

			assert.ok(entity.hasComponent('paintable'), 'expected paintable component');
			assert.equal(entity.components.paintable.color, 'blue', 'expected paintable to be color blue');
			assert.equal(entity.components.paintable.opacity, 1, 'expected paintable to be opacity 1');
		});

		it('should create an entity with multiple overridden components', function() {
			var prefab = Entity.createPrefab('test', {
				paintable: {
					opacity: 0
				},
				movable: null
			});
			var entity = prefab.create(null, {
				movable: {
					speed: 100
				}
			});

			assert.ok(entity.hasComponent('paintable'), 'expected paintable component');
			assert.ok(entity.hasComponent('movable'), 'expected movable component');
			// assert.deepEqual(Object.keys(entity.components), ['paintable', 'movable'], 'expected components in right order');
			assert.equal(entity.components.paintable.color, 'red', 'expected paintable to be color red');
			assert.equal(entity.components.paintable.opacity, 0, 'expected paintable to be opacity 0');
			assert.equal(entity.components.movable.speed, 100, 'expected movable to be speed 100');
			assert.equal(entity.components.movable.friction, 0, 'expected movable to be friction 0');
		});

		it('should create an entity with additional components', function() {
			var prefab = Entity.createPrefab('test', {
				paintable: {
					opacity: 0
				}
			});
			var entity = prefab.create(null, {
				movable: {
					speed: 100
				}
			});

			assert.ok(entity.hasComponent('paintable'), 'expected paintable component');
			assert.ok(entity.hasComponent('movable'), 'expected movable component');
			assert.equal(entity.components.paintable.color, 'red', 'expected paintable to be color red');
			// assert.deepEqual(Object.keys(entity.components), ['paintable', 'movable'], 'expected components in right order');
			assert.equal(entity.components.paintable.opacity, 0, 'expected paintable to be opacity 0');
			assert.equal(entity.components.movable.speed, 100, 'expected movable to be speed 100');
			assert.equal(entity.components.movable.friction, 0, 'expected movable to be friction 0');
		});

	});

});