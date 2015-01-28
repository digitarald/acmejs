/** @flow */

var Pool = require('./pool');
var Entity = require('./entity');
require('../core/shims');

var ComponentMap = Pool.ComponentMap;

var emptyEntity = new Entity();
var emptyComponentMap = new ComponentMap();

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
class Component {
	type: string;
	uid: number;
	attributes: ?Object;
	enabled: boolean;
	allocated: boolean;
	entity: any;
	parent: Entity;
	root: Entity;
	layer: number;
	components: {[key:string]: ?Component};
	pool: Pool;
	eventRefs: Array<any>;

	constructor() {
		this.uid = 0;
		this.enabled = false;
		this.allocated = false;
		this.entity = emptyEntity;
		this.parent = emptyEntity;
		this.root = emptyEntity;
		this.layer = 0.0;
		this.components = emptyComponentMap;
		this.eventRefs = [];
	}

	/**
	 * Brief summary.
	 * @private
	 * @return {String}
	 */
	toString():string {
		return 'Component ' + this.type + '#' + this.uid +
			' [^ ' + this.entity + ']';
	}

	/**
	 * Allocate Component overriding default attributes.
	 * @private
	 * @param {Object} attributes Attributes
	 * @return {Component}
	 */
	allocate(attributes:?Object):void {
		var entity = this.parent;
		this.entity = entity;
		var components = entity.components;
		if (components[this.type] != null) {
			throw new Error('Component ' + this.type + ' already allocated for this Entity');
		}
		components[this.type] = this;
		this.components = components; // Bailout_Normal after setprop
		entity.componentKeys.push(this.type);
		this.create(attributes);
	}

	/**
	 * Destroy Component, removes it from {@link Entity}.
	 */
	destroy() {
		this.enabled = false;
		this.pool.destroy(this);
	}

	free() {
		// override me
	}

	create(attributes:?Object) {
		// override me
	}

	/**
	 * Free destroyed Component.
	 * @private
	 */
	superFree() {
		if (!this.allocated) {
			throw new Error('Entity already collected');
		}
		this.allocated = false;
		this.free();
		this.components[this.type] = null;
		// Clear reference to entity.components
		this.components = emptyComponentMap;
		this.entity = emptyEntity;
		this.root = emptyEntity;
		this.parent = emptyEntity;
	}

	enable(state?:boolean) {
		if (state == null) {
			state = !this.enabled;
		}
		this.entity.emit('onComponent' + (state ? 'Enable' : 'Disable'), this);
		this.enabled = state;
	}
}

Component.prototype.type = 'component';

Component.create = function(cls:any, type?:string, attributeKeys?:Array<string>):any {
	var prototype = cls.prototype;
	// deprecated
	if (attributeKeys != null) {
		console.warn('Component.create with attributeKeys is deprecated!');
		console.trace();
		var attributes = prototype.attributes || (prototype.attributes = {});
		attributeKeys.forEach(function(name) {
			attributes[name] = prototype[name];
		});
	}
	var descriptors = {};
	Object.getOwnPropertyNames(prototype).forEach(function(name) {
		descriptors[name] = Object.getOwnPropertyDescriptor(prototype, name);
	});
	if (type != null) {
		descriptors.type = {
			value: type
		};
	}
	cls.prototype = Object.create(Component.prototype, descriptors);
	cls.prototype.constructor = cls;
	cls.prototype.pool = new Pool(cls);
};

module.exports = Component;
