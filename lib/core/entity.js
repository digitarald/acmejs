'use strict';

var Pool = require('./pool');

function Entity() {
	this.children = {};
	this.components = {};
	this.subs = {};
	this.refSubs = [];
}

Entity.prototype.tag = 'entity';

Entity.prototype.toString = function() {
	var comps = Object.keys(this.components).join(', ');
	return "Entity " + (this.id || '') + "#" + this.uid +
		" (" + comps + ") [^ " + this.parent + "]";
};

Entity.prototype.alloc = function(attributes) {
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
};

Entity.prototype.addComponent = function(tag, attributes) {
	var pool = Pool.byTag[tag];
	if (!pool) {
		return false;
	}
	return pool.alloc(this, attributes);
};

Entity.prototype.addChild = function(prefabId, attributes) {
	if (typeof prefabId === 'string') {
		return Prefab.alloc(prefabId, this, attributes);
	}
	return Entity.alloc(this, prefabId);
};

Entity.prototype.destroy = function() {
	this.pool.destroy(this);
	for (var key in this.components) {
		this.components[key].destroy();
	}
	for (key in this.children) {
		this.children[key].destroy();
	}
};

Entity.prototype.free = function() {
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
};

Entity.prototype.match = function(selector) {
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
};

Entity.prototype.enable = function(state, deep) {
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
};

Entity.prototype.sub = function(scope, topic, method) {
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
};

Entity.prototype.pub = function(topic, a0, a1, a2, a3) {
	var items = this.subs[topic], i = 0;
	if (items && (i = items.length)) {
		var scope;
		while ((scope = items[i -= 2])) {
			if (scope.enabled && scope[items[i + 1] || topic](a0, a1, a2, a3) === false) {
				return false;
			}
		}
	}
};

Entity.prototype.pubUp = function(topic, a0, a1, a2, a3) {
	var entity = this;
	do {
		if (entity.enabled && entity.pub(topic, a0, a1, a2, a3) === false) {
			return false;
		}
	} while (entity = entity.parent);
};

Entity.prototype.pubAll = function(topic, a0, a1, a2, a3) {
	return Pool.call(topic, a0, a1, a2, a3);
};

Entity.prototype.unsub = function(unscope, untopic) {
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
};

new Pool(Entity);

/**
 * Prefab
 *
 * @param {String} id         Id
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

Prefab.alloc = function(id, parent, attributes) {
	var prefab = Prefab.byId[id];
	if (!prefab) {
		throw new Error('Prefab "' + id + '"" not found.');
	}
	return prefab.alloc(parent, attributes);
};

Prefab.prototype.alloc = function(parent, attributes) {
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
};

Entity.Prefab = Prefab;

module.exports = Entity;
