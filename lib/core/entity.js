'use strict';

var Pool = require('./pool');

/**
 * @class Entity
 * Entities are containers that have components attached and act as event hub.
 * With parent and children, they can be organized into a hierachy
 *
 * @abstract
 * @property {Boolean} enabled False when disabled or not allocated. Never act on disabled components!
 * @property {Entity|null} parent Parent entity
 * @property {Entity|null} root Scene entity
 * @property {Number} layer Z-index
 */
function Entity() {
	this.children = {};
	this.components = {};
	this.events = {};
	this.eventRefs = [];
}

Entity.prototype = {

	type: 'entity',

	/**
	 * Brief summary
	 *
	 * @private
	 * @return {String}
	 */
	toString: function() {
		var comps = Object.keys(this.components).join(', ');
		return 'Entity ' + (this.id || '') + '#' + this.uid +
			' (' + comps + ') [^ ' + this.parent + ']';
	},

	/**
	 * Allocates entity from component/attribute hash
	 *
	 * @private
	 * @param {Object} attributes List of components and their attributes
	 * @return {Entity}
	 */
	alloc: function(attributes) {
		if (this.parent) {
			this.parent.children[this.uid] = this;
		}

		if (attributes) {
			for (var key in attributes) {
				var attribute = attributes[key];
				switch (key) {
					case 'id':
						this.id = attribute;
						break;
					default:
						if (!this.createComponent(key, attribute)) {
							throw new Error('Unknown attribute key "' + key +
								'", expected component. ' + this);
						}
				}
			}
		}
	},

	/**
	 * Add {@link Component} to Entity
	 *
	 * @param {String} type Component type
	 * @param  {Object} attributes (optional) Override component attributes
	 * @return {Component}
	 */
	createComponent: function(type, attributes) {
		var pool = Pool.byType[type];
		if (!pool) {
			return null;
		}
		return pool.alloc(this, attributes);
	},

	/**
	 * Add new Entity as child
	 *
	 * @param {String|Object} {@link Prefab} ID or prefab attribute object
	 * @param {Object} attributes (optional) Override {@link Prefab} attributes
	 * @return {Entity}
	 */
	createChild: function(prefabId, attributes) {
		if (typeof prefabId === 'string') {
			return Prefab.create(prefabId, this, attributes);
		}
		return Entity.create(this, prefabId);
	},

	/**
	 * Destroy Entity, including children and components.
	 */
	destroy: function() {
		this.pool.destroy(this);
		for (var key in this.components) {
			this.components[key].destroy();
		}
		for (key in this.children) {
			this.children[key].destroy();
		}
	},

	/**
	 * Free destroyed Entity.
	 *
	 * @private
	 */
	dealloc: function() {
		// Remove referenced eventscribers
		var eventRefs = this.eventRefs;
		for (var i = 0, l = eventRefs.length; i < l; i++) {
			eventRefs[i].off(this);
		}
		eventRefs.length = 0;

		// Remove own eventscribers
		var events = this.events;
		for (var event in events) {
			events[event].length = 0;
		}
		if (this.parent) {
			delete this.parent.children[this.uid];
		}
		this.pool.dealloc(this);
	},

	/**
	 * Match Entity against a list of {@link Component} types.
	 *
	 * @param {Array|String} selector {@link Component} type(s)
	 * @return {Boolean}
	 */
	match: function(selector) {
		var components = this.components;
		if (Array.isArray(selector)) {
			for (var i = 0, l = selector.length; i < l; i++) {
				if (components[selector[i]]) {
					return true;
				}
			}
		} else if (components[selector]) {
			return true;
		}
		return false;
	},

	enable: function(state, deep) {
		if (state == null) {
			state = !this.state;
		}
		this.enabled = state;
		this.parent.trigger((state ? 'onEnable' : 'onDisable'), this);
		for (var key in this.components) {
			this.components[key].enable(state, true);
		}
		if (deep) {
			for (var key in this.children) {
				this.children[key].enable(state, true);
			}
		}
	},

	/**
	 * Subscribe to event messages
	 *
	 * @param {Entity|null} scope Target Entity for eventscription
	 * @param {String} event Event name to eventscribe to 'on*'
	 * @param {String} method (optional) Local method name to call, defaults to event name
	 */
	on: function(scope, event, method) {
		if (scope == null) {
			scope = this;
		}
		var events = this.events;
		var items = (events[event] || (events[event] = []));
		items.push(scope, method);
		if (scope !== this) {
			var refs = (scope.eventRefs || (scope.eventRefs = []));
			refs.push(this);
		}
	},

	/**
	 * Publish a event message only for this entity
	 *
	 * @param {String} event
	 * @param {Mixed} args (optional) Argument(s)
	 *
	 * @return {undefined|Boolean} Only false if one eventsciber returned false
	 */
	trigger: function(event, args) {
		var items = this.events[event], i = 0;
		if (items && (i = items.length)) {
			var scope;
			while ((scope = items[i -= 2])) {
				if (scope.enabled && scope[items[i + 1] || event](args) === false) {
					return false;
				}
			}
		}
	},

	/**
	 * Publish a event message for this entity and it's parents
	 *
	 * @param {String} event
	 * {Mixed} args (optional) Argument(s)
	 *
	 * @return {undefined|Boolean} Only false if one eventsciber returned false
	 */
	triggerUp: function(event, args) {
		var entity = this;
		do {
			if (entity.enabled && entity.trigger(event, args) === false) {
				return false;
			}
		} while (entity = entity.parent);
	},

	/**
	 * Publish a event message for all eventscribed entities
	 *
	 * @param {String} event
	 * @param {Mixed} args (optional) Argument(s)
	 */
	triggerAll: function(event, args) {
		return Pool.call(event, args);
	},

	/**
	 * Uneventscribe scope from event
	 *
	 * @param {Entity|Component} unscope (optional) Subscriber scope to remove
	 * @param {String|null} unevent (optional) Event to remove
	 */
	off: function(unscope, unevent) {
		var events = this.events, i = 0;
		for (var event in events) {
			if (unevent && unevent === event) {
				continue;
			}
			var items = events[event];
			if (!items || !(i = items.length)) {
				continue;
			}
			var length = i / 2, scope;
			while ((i -= 2) >= 0) {
				if ((scope = items[i]) && (!unscope || unscope === scope)) {
					items[i] = null;
					length--;
				}
			}
			if (length === 0) {
				items.length = 0;
			}
		}
	}

};

new Pool(Entity);

/**
 * @class Prefab
 *
 * @constructor
 * @param {String} id Prefab Id
 * @param {Object} attributes Default attributes
 */
function Prefab(id, attributes) {
	if (!attributes) {
		attributes = id;
		id = null;
	}
	this.id = id || attributes.id || Math.uid();
	this.attributes = attributes;
	this.attributeKeys = Object.keys(attributes);
	for (var key in attributes) {
		if (!attributes[key]) {
			attributes[key] = {};
		}
	}
	Prefab.byId[this.id] = this;
}

Prefab.byId = {};

/**
 * Allocate Prefab by Id
 *
 * @static
 * @param {String} id Prefab Id
 * @param {Entity} parent Parent entity
 * @param {Object} attributes Override attributes
 * @return {Entity}
 */
Prefab.create = function(id, parent, attributes) {
	var prefab = Prefab.byId[id];
	if (!prefab) {
		throw new Error('Prefab "' + id + '" not found.');
	}
	return prefab.create(parent, attributes);
};

Prefab.prototype = {

	/**
	 * Allocate {@link Entity} from Prefab
	 *
	 * @param {Entity} parent Parent entity
	 * @param {Object} attributes Override prefab attributes
	 * @return {Entity}
	 */
	create: function(parent, attributes) {
		var defaults = this.attributes;
		if (attributes) {
			var keys = this.attributeKeys;
			for (var i = 0, l = keys.length; i < l; i++) {
				var key = keys[i];
				var value = defaults[key];
				if (!attributes[key]) {
					attributes[key] = value;
				} else {
					var subPresets = attributes[key];
					if (typeof value === 'object') {
						// Evaluate use of: __proto__
						for (var subKey in value) {
							if (!(subKey in subPresets)) {
								subPresets[subKey] = value[subKey];
							}
						}
					}
					// Move to last position
					// TODO: Only when needed!
					delete attributes[key];
					attributes[key] = subPresets;
				}
			}
		}
		return Entity.create(parent, attributes || defaults);
	}

};

Entity.Prefab = Prefab;

module.exports = Entity;
