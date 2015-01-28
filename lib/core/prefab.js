/** @flow */

var Mathf = require('../math/mathf');
var Entity = require('./entity');

/**
 * @class
 * @constructor
 * @param {String} id Prefab Id
 * @param {Object} components Default attributes
 */
class Prefab {
	id: string;
	components: Object;
	types: Array<string>;
	subKeys: {[key:string]: Array<string>};

	constructor(id:string, components:Object) {
		this.id = id;
		Prefab.byId[this.id] = this;
		this.components = components;
		this.types = [];
		this.subKeys = {};
		for (var type in components) {
			this.types.push(type);
			if (components[type] == null) {
				components[type] = {};
			}
			this.subKeys[type] = Object.keys(components[type]);
		}
	}

	/**
	 * Allocate {@link Entity} from Prefab
	 * @param {Entity} parent Parent entity
	 * @param {Object} components Override prefab components
	 * @return {Entity}
	 */
	create(parent:Entity, components:?Object):Entity {
		var entity = Entity.create(parent,
			(components == null) ? this.components : null
		);
		entity.prefab = this.id;
		if (components != null) {
			var types = this.types;
			var type = '';
			for (var i = 0, l = types.length; i < l; i++) {
				type = types[i];
				var defaults = this.components[type];
				var overrides = components[type];
				if (overrides != null) {
					delete components[type];
					var subKeys = this.subKeys[type];
					var k = subKeys.length;
					if (k > 0) {
						for (var j = 0; j < k; j++) {
							var subKey = subKeys[j];
							if (overrides[subKey] === undefined) {
								overrides[subKey] = defaults[subKey];
							}
						}
					}
				} else {
					overrides = defaults;
				}
				entity.createComponent(type, overrides);
			}
			for (type in components) {
				entity.createComponent(type, components[type]);
			}
		}
		return entity;
	}

	/**
	 * Brief summary
	 * @private
	 * @return {String}
	 */
	toString():string {
		var comps = Object.keys(this.components).join(', ');
		return 'Prefab #' + this.id;
	}
};

Prefab.reset = function() {
	Prefab.byId = {};
};

Prefab.reset();

/**
 * Allocate Prefab by Id
 * @static
 * @param {String} id Prefab Id
 * @param {Entity} parent Parent entity
 * @param {Object} components Override components
 * @return {Entity}
 */
Prefab.create = function(id, parent, components) {
	var prefab = Prefab.byId[id];
	if (prefab == null) {
		throw new Error('Prefab "' + id + '" not found.');
	}
	return prefab.create(parent, components);
};

module.exports = Prefab;
