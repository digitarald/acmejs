/* @flow weak */

var Mathf = require('../math/mathf');
require('../core/shims');

type BasePoolable = {
	pool: Pool;
	enabled: boolean;
	uid: number;
	allocated: boolean;
	allocate: (attributes:?Object) => void;
	superFree: () => void;
	parent: any;
	root: any;
	type: string;
	layer: number;
};

type ComponentLike = any; // BasePoolable & {
// 	attributes: ?Object;
// } & {[key:string]: (payload:any) => void};

type EntityLike = any; // BasePoolable & {
// 	on: (scope:?Entity, name:string, method:?string) => void;
// }

type Poolable = BasePoolable; // EntityLike | ComponentLike;

/**
 * Pool
 * @class
 * @param {Object} cls Class to pool
 */
class Pool {
	cls: any;
	heap: Array<any>;
	enabled: boolean;
	allocated: number;
	type: string;
	layer: number;
	events: Array<string>;
	calls: Array<string>;
	attributes: Object;
	attributeKeys: Array<string>;
	isComponent: boolean;

	constructor(cls:any) {
		this.cls = cls;
		cls.pool = this;
		cls.enabled = false;
		var proto = cls.prototype;
		proto.pool = this;
		this.heap = [];
		this.enabled = false;
		this.allocated = 0;
		var type = proto.type;
		this.type = type;
		if (Pool.byType[type] != null) {
			console.warn('Pool "%s" was overridden with ', type, cls);
		}
		Pool.byType[type] = this;

		this.layer = 0.0;
		this.events = [];
		this.calls = [];
		this.attributes = {};
		this.attributeKeys = [];

		this.isComponent = (type != 'entity');
		if (this.isComponent) {
			var attributes = proto.attributes;
			if (attributes != null) {
				this.attributes = attributes;
				this.attributeKeys = Object.keys(attributes);
			}
			var types = Pool.typedCalls;
			var keys = Object.keys(proto).concat(Object.keys(cls));
			var fn = '';
			for (var i = 0, l = keys.length; i < l; i++) {
				fn = keys[i];
				if (callRegex.test(fn)) {
					if (!~types.indexOf(fn)) {
						types.push(fn);
						Pool.calls[fn] = [];
					}
					this.events.push(fn);
				}
			}
			for (i = 0, l = types.length; i < l; i++) {
				fn = types[i];
				if (cls[fn] != null) {
					Pool.calls[fn].push(cls);
				} else if (proto[fn] != null) {
					this.calls.push(fn);
				}
			}
			ComponentMap.prototype[type] = null;
		}
	}

	/**
	 * Brief summary.
	 *
	 * @return {String}
	 */
	toString():string {
		return 'Pool ' + this.type +
			' [' + this.allocated + '/' + this.heap.length + ']';
	}

	pushInstance():any {
		var entity = new this.cls();
		this.heap.push(entity);
		// Register entity callbacks
		var calls = this.calls;
		for (var i = 0, l = calls.length; i < l; i++) {
			Pool.calls[calls[i]].push(entity);
		}
		return entity;
	}

	popInstance():any {
		var heap = this.heap;
		var l = heap.length;
		if (this.allocated == l) {
			return this.pushInstance();
		}
		for (var i = 0; i < l; i++) {
			if (!heap[i].allocated) {
				return heap[i];
			}
		}
	}

	/**
	 * Allocate a new instance from free pool or by creating. The provided attributes are merged with the default attributes.
	 * @param {Entity} parent (optional) Parent class
	 * @param {Object} attributes (optional) Attributes object
	 * @return {Object}
	 */
	allocate(parent:EntityLike, attributes:?Object):any {
		// Get free or create new entity
		var entity = this.popInstance();
		this.allocated++;
		this.enabled = true;
		this.cls.enabled = true;
		var uid = Mathf.uid();
		entity.uid = uid;
		entity.enabled = true;
		entity.allocated = true;
		entity.parent = parent;
		entity.root = (parent != null) ? (parent.root || parent) : null;
		// Set layer, combined from parent layer, pool layer and uid
		entity.layer = ((parent != null) ? parent.layer : 0) + this.layer + 2 - 1 / uid;

		if (this.isComponent) {
			var i = 0;
			var defaults = this.attributes;
			var keys = this.attributeKeys;
			var l = keys.length;
			if (l > 0) {
				if (attributes == null) {
					for (i = 0; i < l; i++) {
						entity[keys[i]] = defaults[keys[i]];
					}
				} else {
					for (i = 0; i < l; i++) {
						var key = keys[i];
						if (Pool.verbose) {
							if (this.allocated == 1 && !(key in entity)) {
								console.warn('Component "%s" did not pre-allocate have attribute "%s"', this.type, key);
							}
						}
						entity[key] = (attributes[key] !== undefined) ? attributes[key] :
							defaults[key];
					}
				}
			}

			// Add events
			var events = this.events;
			for (i = 0, l = events.length; i < l; i++) {
				parent.on(entity, events[i], events[i]);
			}
		}
		if (entity.allocate != null) {
			entity.allocate(attributes);
		}
		return entity;
	}

	/**
	 * Destroy given instance.
	 * @param {Object} entity Pooled object
	 */
	destroy(entity:Poolable) {
		Pool.calls.free.push(entity);
	}

	/**
	 * Free destroyed object.
	 * @param {Object} entity Pooled object
	 */
	free(entity:Poolable) {
		var allocated = this.allocated--;
		this.enabled = !!allocated;
		this.cls.enabled = !!allocated;
	}

	/**
	 * Invoke method on all enabled pooled object instances.
	 * @param {String} fn Method name
	 * @param {Mixed} payload (optional) Argument(s)
	 */
	call(fn:string, payload?:any) {
		var heap = this.heap;
		var i = this.heap.length;
		while (i--) {
			if (heap[i].enabled) {
				heap[i][fn](payload);
			}
		}
	}
}

Pool.verbose = false;

Pool.calls = {};
Pool.typedCalls = [
	'fixedUpdate',
	'simulate',
	'update',
	'postUpdate',
	'preRender',
	'render'
];
var callRegex = /^on[A-Z]/;

// Create call array
Pool.reset = function() {
	Pool.calls = {
		free: []
	};
	for (var i = 0, l = Pool.typedCalls.length; i < l; i++) {
		Pool.calls[Pool.typedCalls[i]] = [];
	}
	Pool.byType = {};
};

Pool.reset();

/**
 * Dump debugging details and optionally flush freed objects.
 *
 * @param {Boolean} flush (optional) Flush after debug.
 */
Pool.dump = function(flush) {
	var byType = Pool.byType;
	for (var type in byType) {
		var pool = byType[type];
		console.log('%s: %d/%d in use', type, pool.allocated, pool.heap.length);
	}
	if (flush) {
		Pool.flush();
	}
};

Pool.free = function() {
	var calls = this.calls.free;
	for (var i = 0, l = calls.length; i < l; i++) {
		calls[i].superFree();
		calls[i].pool.free();
	}
	calls.length = 0;
};

Pool.flush = function() {
	var byType = Pool.byType;
	for (var type in byType) {
		var collected = 0;
		var heap = byType[type].heap;
		var i = heap.length;
		while (i--) {
			if (heap[i].allocated) {
				continue;
			}
			heap.splice(i, 1);
			collected++;
		}
		console.log('%s: %d/%d flushed', type, collected, heap.length);
	}
};

Pool.call = function(fn, arg) {
	var calls = this.calls[fn];
	if (calls == null) {
		return;
	}
	var i = calls.length;
	if (i === 0) {
		return;
	}
	while (i--) {
		if (calls[i].enabled) {
			// BAILOUT after callelem
			calls[i][fn](arg);
		}
	}
};

class ComponentMap {}
Pool.ComponentMap = ComponentMap;

module.exports = Pool;
