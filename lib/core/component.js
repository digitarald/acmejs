'use strict';

var Pool = require('./pool');

/**
 * @class Component
 * Encapsulated behaviours that can be attached to entities.
 *
 * @abstract
 * @property {Boolean} enabled False when disabled or not allocated. Never act on disabled components!
 * @property {Entity} parent Container entity
 * @property {Entity} root Scene entity
 * @property {Number} layer Z-index
 */

function Component(type, cls) {
	if (!type) {
		return null;
	}

	var props = {
		type: {
			value: type,
			writable: false,
			enumerable: false
		}
	};
	var proto = cls.prototype;
	for (var key in proto) {
		var prop = Object.getOwnPropertyDescriptor(proto, key);
		props[key] = prop;
	}
	cls.prototype = Object.create(Component.prototype, props);
	new Pool(cls);
	return null;
}

Component.prototype = {

	type: 'component',

	/**
	 * Brief summary.
	 *
	 * @private
	 * @return {String}
	 */
	toString: function() {
		return 'Component ' + this.type + '#' + this.uid +
			' [^ ' + this.entity + ']';
	},

	/**
	 * Allocate Component overriding default attributes.
	 *
	 * @private
	 * @param {Object} attributes Attributes
	 * @return {Component}
	 */
	alloc: function(attributes) {
		var entity = this.entity = this.parent;
		entity.components[this.type] = this;
		entity[this.type] = this;

		var components = entity.components;
		for (var type in components) {
			if (type == this.type) {
				continue;
			}
			this[type] = components[type];
			components[type][this.type] = this;
		}

		if (this.create) {
			this.create(attributes);
		}
	},

	/**
	 * Destroy Component, removes it from {@link Entity}.
	 */
	destroy: function() {
		this.pool.destroy(this);
	},

	/**
	 * Free destroyed Component.
	 *
	 * @private
	 */
	_dealloc: function() {
		if (this.dealloc) {
			this.dealloc();
		}
		// BAILOUT_ShapeGuard
		delete this.entity.components[this.type];
		this.entity[this.type] = null;

		var components = this.entity.components;
		for (var type in components) {
			if (type == this.type) {
				continue;
			}
			this[components[type].type] = null;
			components[type][this.type] = null;
		}
		this.entity = null;
		this.pool.dealloc(this);
	},

	enable: function(state) {
		if (state == null) {
			state = !this.enabled;
		}
		this.entity.trigger('onComponent' + (state ? 'Enable' : 'Disable'), this);
		this.enabled = state;
	}

};

module.exports = Component;