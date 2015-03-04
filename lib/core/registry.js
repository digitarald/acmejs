/* @flow weak */

/**
 * @todo [description]
 */

import {uid} from '../math/mathf';

type BaseRegisterable = {
	registry: Registry;
	enabled: boolean;
	uid: number;
	allocated: boolean;
	allocate: (attributes:?Object) => void;
	deallocate: () => void;
	parent: any;
	root: any;
	type: string;
};

type ComponentLike = any; // BaseRegisterable & {
// 	attributes: ?Object;
// } & {[key:string]: (payload:any) => void};

type EntityLike = any; // BaseRegisterable & {
// 	on: (scope:?Entity, name:string, method:?string) => void;
// }

type Registerable = BaseRegisterable; // EntityLike | ComponentLike;

/**
 * Registry
 * @class
 * @param {Object} cls Class to registry
 */
export default class Registry {
	cls: any;
	instances: Array<any>;
	enabled: boolean;
	allocated: number;
	type: string;
	events: Array<string>;
	methods: Array<string>;
	attributes: Object;
	attributeKeys: Array<string>;
	isComponent: boolean;

	constructor(cls:any) {
		this.cls = cls;
		let proto = cls.prototype;
		this.instances = [];
		this.enabled = false;
		this.allocated = 0;
		this.instantiated = 0;
		let type = proto.type;
		this.type = type;
		if (Registry.types[type] != null) {
			console.warn('Registry "%s" was overridden with ', type, cls);
		}
		Registry.types[type] = this;
		typeIndex.push(type);

		this.events = [];
		this.methods = [];
		this.attributes = {};
		this.attributeKeys = [];

		this.isComponent = (type != 'entity');
		if (this.isComponent) {
			let attributes = proto.attributes || cls.attributes;
			if (attributes != null) {
				this.attributes = attributes;
				this.attributeKeys = Object.keys(attributes);
			}
			let types = methodsIndex;
			let keys = Object.getOwnPropertyNames(proto).concat(Object.keys(cls));
			let fn = '';
			let i = 0;
			let l = 0;
			for (l = keys.length; i < l; i++) {
				fn = keys[i];
				if (/^on[A-Z]/.test(fn)) {
					if (!~types.indexOf(fn)) {
						types.push(fn);
						Registry.methods[fn] = [];
					}
					this.events.push(fn);
				}
			}
			for (i = 0, l = types.length; i < l; i++) {
				fn = types[i];
				if (cls[fn] != null) {
					Registry.methods[fn].push(cls);
				} else if (proto[fn] != null) {
					this.methods.push(fn);
				}
			}
		}
		cls.enabled = false;
		cls.registry = this;
		proto.registry = this;
	}

	/**
	 * Brief summary.
	 *
	 * @return {String}
	 */
	toString():string {
		return `Registry ${this.type} [${this.allocated}/${this.instantiated}]`;
	}

	push():any {
		this.instantiated++;
		instantiated++;
		let instance = new this.cls();
		this.instances.push(instance);
		// Register instance callbacks
		let methods = this.methods;
		for (let i = 0, l = methods.length; i < l; i++) {
			Registry.methods[methods[i]].push(instance);
		}
		return instance;
	}

	deinstantiate(instance) {
		let methods = this.methods;
		for (let i = 0, l = methods.length; i < l; i++) {
			let list = Registry.methods[methods[i]];
			list.splice(list.indexOf(instance), 1);
		}
	}

	pop():any {
		let l = this.instantiated;
		if (this.allocated == l) {
			return this.push();
		}
		let instances = this.instances;
		for (let i = 0; i < l; i++) {
			if (!instances[i].allocated) {
				return instances[i];
			}
		}
	}

	/**
	 * Allocate a new instance from free registry or by creating. The provided attributes are merged with the default attributes.
	 * @param {Entity} parent (optional) Parent class
	 * @param {Object} attributes (optional) Attributes object
	 * @return {Object}
	 */
	allocate(parent:EntityLike, attributes:?Object):any {
		// Get free or create new instance
		let instance = this.pop();
		this.allocated++;
		allocated++;
		this.enabled = true;
		this.cls.enabled = true;
		let id = uid();
		instance.uid = id;
		instance.enabled = true;
		instance.allocated = true;
		instance.parent = parent;
		instance.root = (parent != null) ? (parent.root || parent) : null;
		// Set layer, combined from parent layer, registry layer and uid
		// instance.layer = ((parent != null) ? parent.layer : 0) + this.layer + 2 - 1 / id;

		if (this.isComponent) {
			let i = 0;
			let defaults = this.attributes;
			let keys = this.attributeKeys;
			let l = keys.length;
			if (l > 0) {
				if (attributes == null) {
					for (i = 0; i < l; i++) {
						instance[keys[i]] = defaults[keys[i]];
					}
				} else {
					for (i = 0; i < l; i++) {
						let key = keys[i];
						if (Registry.verbose) {
							if (this.allocated == 1 && !(key in instance)) {
								console.warn('Component "%s" does not have attribute "%s"', this.type, key);
							}
						}
						instance[key] = (attributes[key] !== undefined) ?
							attributes[key] : defaults[key];
					}
				}
			}

			// Add events
			let events = this.events;
			for (i = 0, l = events.length; i < l; i++) {
				parent.on(instance, events[i], events[i]);
			}
		}
		if (instance.allocate != null) {
			instance.allocate(attributes);
		}
		return instance;
	}

	/**
	 * Destroy given instance.
	 * @param {Object} instance Registryed object
	 */
	destroy(instance:Registerable) {
		deallocateQueue.push(instance);
	}

	/**
	 * Notify registry of deallocated object.
	 */
	deallocate() {
		allocated--;
		if (this.allocated-- === 0) {
			this.enabled = false;
			this.cls.enabled = false;
		}
	}

	/**
	 * Invoke method on all enabled registryed object instances.
	 * @param {String} fn Method name
	 * @param {Mixed} payload (optional) Argument(s)
	 */
	call(fn:string, payload?:any) {
		let instances = this.instances;
		let i = this.instances.length;
		while (i--) {
			if (instances[i].enabled) {
				instances[i][fn](payload);
			}
		}
	}

	// Create call array
	static reset() {
		Registry.methods = {};
		for (let i = 0, l = methodsIndex.length; i < l; i++) {
			Registry.methods[methodsIndex[i]] = [];
		}
		Registry.types = {};
	}

	/**
	 * Dump debugging details and optionally flush freed objects.
	 *
	 * @param {Boolean} flush (optional) Flush after debug.
	 */
	static dump(flush) {
		let types = Registry.types;
		console.group('Registry.dump');
		for (let type in types) {
			let registry = types[type];
			console.log('%s: %d/%d allocated', type, registry.allocated, registry.instantiated);
		}
		console.groupEnd('Registry.dump');
		if (flush) {
			Registry.flush();
		}
	}

	static free() {
		for (let i = 0, l = deallocateQueue.length; i < l; i++) {
			deallocateQueue[i].deallocate();
			deallocateQueue[i].registry.deallocate();
		}
		deallocateQueue.length = 0;
		if (instantiated > Registry.flushMin && allocated / instantiated < Registry.flushRatio) {
			Registry.flush();
		}
	}

	static flush() {
		// console.group('Registry.flush');
		let collectedSum = 0;
		for (let i = 0; i < typeIndex.length; i++) {
			let type = typeIndex[i];
			let registry = Registry.types[type];
			if (registry.instantiated == registry.allocated) {
				continue;
			}
			let collected = 0;
			let instances = registry.instances;
			let j = instances.length;
			while (j--) {
				let instance = instances[j];
				if (instance.allocated) {
					continue;
				}
				registry.deinstantiate(instance);
				instances.splice(j, 1);
				collected++;
			}
			collectedSum += collected;
			registry.instantiated -= collected;
			// console.log('%s: %d flushed/%d remaining', type, collected, registry.instantiated);
		}
		instantiated -= collectedSum;
		console.log('%d flushed/%d remaining', collectedSum, instantiated);
		// console.groupEnd('Registry.flush');
	}

	static call(fn, arg) {
		let methods = this.methods[fn];
		if (methods == null) {
			return;
		}
		let i = methods.length;
		if (i === 0) {
			return;
		}
		while (i--) {
			if (methods[i].enabled) {
				methods[i][fn](arg);
			}
		}
	}

	static create(cls):void {
		new Registry(cls);
	}
}

let methodsIndex = [
	'fixedUpdate',
	'simulate',
	'update',
	'postUpdate',
	'preRender',
	'render'
];
let deallocateQueue = [];
let typeIndex = [];
let allocated = 0;
let instantiated = 0;

Registry.flushMin = 50;
Registry.flushRatio = 0.1;

Registry.verbose = false;
Registry.types = {};
Registry.methods = {};
Registry.reset();

if (typeof window != 'undefined' && window.console) {
	console.acme = console.acme || (console.acme = {});
	console.acme.registry = Registry;
	console.acme.dump = function(flush) {
		Registry.dump(flush);
		return null;
	};
}
