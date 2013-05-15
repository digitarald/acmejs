'use strict';

var Pool = require('./pool');

/**
 * Entity
 *
 * Entities are containers that have components attached and act as event hub.
 *
 * With parent and children, they can be organized into a hierachy
 */
function Entity() {
	this.children = {};
	this.components = {};
	this.subs = {};
	this.refSubs = [];
}

Entity.prototype = {

	tag: 'entity',

	/**
	 * Brief summary
	 *
	 * @private
	 *
	 * @return {String}
	 */
	toString: function() {
		var comps = Object.keys(this.components).join(', ');
		return "Entity " + (this.id || '') + "#" + this.uid +
			" (" + comps + ") [^ " + this.parent + "]";
	},

	/**
	 * Allocates entity from component/attribute hash
	 *
	 * @private
	 *
	 * @param {Object} attributes List of components and their attributes
	 *
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
						if (!this.addComponent(key, attribute)) {
							throw new Error("Unknown attribute key '" + key +
								"', expected component. " + this);
						}
				}
			}
		}
	},

	/**
	 * Add {@link Component} to Entity
	 *
	 * @param {String} tag Component tag
	 * @param  {Object} attributes (optional) Override component attributes
	 *
	 * @return {Component}
	 */
	addComponent: function(tag, attributes) {
		var pool = Pool.byTag[tag];
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
	 *
	 * @return {Entity}
	 */
	addChild: function(prefabId, attributes) {
		if (typeof prefabId === 'string') {
			return Prefab.alloc(prefabId, this, attributes);
		}
		return Entity.alloc(this, prefabId);
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
	free: function() {
		// Remove referenced subscribers
		var refSubs = this.refSubs;
		for (var i = 0, l = refSubs.length; i < l; i++) {
			refSubs[i].unsub(this);
		}
		refSubs.length = 0;

		// Remove own subscribers
		var subs = this.subs;
		for (var topic in subs) {
			subs[topic].length = 0;
		}
		if (this.parent) {
			delete this.parent.children[this.uid];
		}
		this.pool.free(this);
	},

	/**
	 * Match Entity against a list of {@link Component} tags.
	 *
	 * @param {Array|String} selector {@link Component} tag(s)
	 *
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
		this.parent.pub((state ? 'onEnable' : 'onDisable'), this);
		for (var key in this.components) {
			this.components[key].enable(state, true);
		}
		if (deep) {
			for (var key in this.children) {
				this.children[key].enable(state, true);
			}
		}
	},

	sub: function(scope, topic, method) {
		if (scope == null) {
			scope = this;
		}
		var subs = this.subs;
		var items = (subs[topic] || (subs[topic] = []));
		items.push(scope, method);
		if (scope !== this) {
			var refs = (scope.refSubs || (scope.refSubs = []));
			refs.push(this);
		}
	},

	pub: function(topic, a0, a1, a2, a3) {
		var items = this.subs[topic], i = 0;
		if (items && (i = items.length)) {
			var scope;
			while ((scope = items[i -= 2])) {
				if (scope.enabled && scope[items[i + 1] || topic](a0, a1, a2, a3) === false) {
					return false;
				}
			}
		}
	},

	pubUp: function(topic, a0, a1, a2, a3) {
		var entity = this;
		do {
			if (entity.enabled && entity.pub(topic, a0, a1, a2, a3) === false) {
				return false;
			}
		} while (entity = entity.parent);
	},

	pubAll: function(topic, a0, a1, a2, a3) {
		return Pool.call(topic, a0, a1, a2, a3);
	},

	unsub: function(unscope, untopic) {
		var subs = this.subs, i = 0;
		for (var topic in subs) {
			if (untopic && untopic === topic) {
				continue;
			}
			var items = subs[topic];
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
 * Prefab
 *
 * @param {String} Id
 * @param {Object} Default attributes
 * @class
 * @constructor
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
 * @param {String} id Prefab ID
 * @param {Entity} parent Parent entity
 * @param {Object} attributes Override attributes
 * @return {Entity}
 */
Prefab.alloc = function(id, parent, attributes) {
	var prefab = Prefab.byId[id];
	if (!prefab) {
		throw new Error('Prefab "' + id + '"" not found.');
	}
	return prefab.alloc(parent, attributes);
};

Prefab.prototype = {

	/**
	 * Allocate {@link Entity} from Prefab
	 *
	 * @param {Entity} parent Parent entity
	 * @param {Object} attributes Override prefab attributes
	 * @return {Entity}
	 */
	alloc: function(parent, attributes) {
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
						// TODO: Use __proto__
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
		return Entity.alloc(parent, attributes || defaults);
	}

};

Entity.Prefab = Prefab;

module.exports = Entity;
