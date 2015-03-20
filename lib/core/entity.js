/** @flow */

import Registry from './registry';
import Event from './event';

Event.registerTypeOnly('enable');
Event.registerTypeOnly('disable');

/**
 * @class Entity
 * Entities are containers that have components attached and act as event hub.
 * With parent and children, they can be organized into a hierachy
 *
 * @abstract
 * @property {Boolean} enabled False when disabled or not allocated. Never act on disabled components!
 * @property {Entity|null} parent Parent entity
 * @property {Entity|null} root Scene entity
 */
export default class Entity {
	constructor() {
		this.type = 'entity';
		this.uid = 0;
		this.enabled = false;
		this.allocated = false;
		this.parent = null;
		this.root = null;
		this.components = new ComponentMap();
		this.listeners = new Map();
		this.listenersRef = new Set();
		this.prefab = '';
		this.next = null;
		this.firstChild = null;
	}

	/**
	 * Brief summary
	 * @private
	 * @return {String}
	 */
	toString() {
		let comps = this.componentKeys.join(', ');
		let parent = this.parent ? ` [^ ${this.parent}]` : '';
		return `Entity ${this.prefab} #${this.uid} (${comps})${parent}`;
	}

	/**
	 * Allocates entity from component/attribute hash
	 * @private
	 * @param {Object} attributes List of components and their attributes
	 * @return {Entity}
	 */
	allocate(attributes) {
		let parent = this.parent
		if (parent != null) {
			let last = parent.lastChild;
			if (last != null) {
				last.next = this;
			} else {
				parent.firstChild = this;
			}
		}
		this.prefab = '';
		if (attributes != null) {
			for (let type in attributes) {
				this.createComponent(type, attributes[type]);
			}
		}
	}

	/**
	 * Add {@link Component} to Entity
	 * @param {String} type Component type
	 * @param  {Object} attributes (optional) Override component attributes
	 * @return {Component}
	 */
	createComponent(type, attributes) {
		let registry = Registry.types[type];
		if (registry == null) {
			throw new Error(`Unknown component "${type}" for ${this}`);
		}
		return registry.allocate(this, attributes);
	}

	/**
	 * Add new Entity as child
	 * @param {String|Object} prefabId {@link Prefab} ID or prefab attribute object
	 * @param {Object} attributes (optional) Override {@link Prefab} attributes
	 * @return {Entity}
	 */
	createChild(prefabId, attributes) {
		if (typeof prefabId == 'string') {
			return Prefab.create(prefabId, this, attributes);
		}
		return Entity.create(this, prefabId);
	}

	/**
	 * Match Entity against a list of {@link Component} types.
	 * @param {Array|String} selector {@link Component} type(s)
	 * @return {Boolean}
	 */
	hasComponent(selector) {
		return this.components.types.has(selector);
	}

	hasComponents(selectors) {
		for (let selector of selectors) {
			if (!this.components.types.has(selector[i])) {
				return false;
			}
		}
		return true;
	}

	get lastChild() {
		let previous = this.firstChild;
		if (previous != null) {
			while (previous.next != null) {
				previous = previous.next;
			}
		}
		return previous;
	}

	/**
	 * Destroy Entity, including children and components.
	 */
	destroy() {
		if (this.destroyed) {
			return;
		}
		this.destroyed = true;
		this.enabled = false;
		this.registry.destroy(this);
		let types = this.components.types;
		for (let type of types) {
			this.components[type].destroy();
		}
		let child = this.firstChild;
		while (child) {
			child.destroy();
			child = child.next;
		}
	}

	removeChild(entity) {
		let child = this.firstChild;
		let prev = null;
		while (child) {
			if (child == entity) {
				if (prev == null) {
					this.firstChild = child.next;
				} else {
					prev.next = child.next;
				}
				child.next = null;
				child.parent = null;
				return true;
			}
			prev = child;
			child = child.next;
		}
		return false;
	}

	/**
	 * Free destroyed Entity.
	 * @private
	 */
	deallocate() {
		// Remove referenced subscribers
		let refs = this.listenersRef;
		for (let ref of refs) {
			if (ref.allocated) {
				ref.off(this);
			}
		}
		refs.clear();

		// Remove own subscribers
		this.listeners.clear();

		// Eager deallocate
		let child = this.firstChild;
		this.firstChild = null;
		let next = null;
		while (child != null) {
			next = child.next;
			child.next = null;
			child = next;
		}

		let parent = this.parent;
		if (parent != null) {
			parent.removeChild(this);
		}
		this.allocated = false;
		this.destroyed = false;
		this.root = null;
		this.parent = null;
	}

	enable(state, deep) {
		if (state == null) {
			state = !this.enabled;
		}
		this.emit(Event.create(state ? 'enable' : 'disable'));
		this.enabled = state;
		for (let type of this.components.types) {
			this.components[type].enable(state, true);
		}
		if (deep) {
			let child = this.firstChild;
			while (child != null) {
				child.enable(state, true);
				child = child.next;
			}
		}
	}

	/**
	 * Has subscriber
	 * @param {String} event Event name to listenerscribe to 'on*'
	 */
	hasEvent(name) {
		return this.listeners.has(name);
	}

	/**
	 * Subscribe to event messages
	 * @param {Entity|null} scope Target Entity for listenerscription
	 * @param {String} name Event name to listenerscribe to 'on*'
	 * @param {String} method (optional) Local method name to call, defaults to event name
	 */
	on(scope, name, method?) {
		if (scope == null) {
			scope = this;
		}
		if (!this.listeners.has(name)) {
			this.listeners.set(name, []);
		}
		this.listeners.get(name).push(scope, method);
		if (scope != this) {
			scope.listenersRef.add(this);
		}
	}

	/**
	 * Publish a event message for this entity and it's parents
	 * @param {String} event
	 */
	emit(type, component, detail) {
		let event = (typeof type == 'string') ? Event.create(type) : type;
		let entity = this;
		event.entity = entity;
		if (component != null) {
			event.component = component;
		}
		if (detail != null) {
			event.detail = detail;
		}
		let handler = event.handler;
		if (event.aggregate) {
			Registry.call(handler, event);
		} else {
			do {
				if (entity.enabled && entity.listeners.has(handler)) {
					// Invoke
					let listeners = entity.listeners.get(handler);
					let i = listeners.length;
					while ((i -= 2) >= 0) {
						let listener = listeners[i];
						if (listener != null && listener.enabled) {
							listener[listeners[i + 1] || handler](event);
						}
					}
					if (event.stopped) {
						break;
					}
				}
				if (!event.bubbles) {
					break;
				}
				entity = entity.parent || entity.root; // Context.scene has .root
			} while (entity);
		}
		let canceled = event.canceled;
		event.destroy();
		return !canceled;
	}

	/**
	 * Unsubscribe scope from event
	 * @param {Entity|Component} unscope (optional) Subscriber scope to remove
	 */
	off(unscope) {
		let listeners = this.listeners;
		for (let items of listeners) {
			let i = items.length;
			let length = i / 2;
			while ((i -= 2) >= 0) {
				if (items[i] != null && (!unscope || unscope === items[i])) {
					items[i] = null;
					length--;
				}
			}
			if (length === 0) {
				listeners.delete(name);
			}
		}
	}

	static create(parent, attributes) {
		return Entity.registry.allocate(parent, attributes);
	}

	static createPrefab(id, components) {
		return new Prefab(id, components);
	}

	static reset() {
		Prefab.byId = {};
	}
}

Entity.prototype.type = 'entity';
Registry.create(Entity);

/**
 * @class
 * @constructor
 * @param {String} id Prefab Id
 * @param {Object} components Default attributes
 */
export class Prefab {
	constructor(id, components) {
		this.id = id;
		Prefab.byId[this.id] = this;
		this.components = components;
		this.types = new Set();
		this.subKeys = {};
		for (let type in components) {
			this.types.add(type);
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
	create(parent, components) {
		let entity = Entity.create(parent,
			(components == null) ? this.components : null
		);
		entity.prefab = this.id;
		if (components != null) {
			var keys = Object.getOwnPropertyNames(components);
			let types = this.types;
			for (let type of types) {
				let defaults = this.components[type];
				let overrides = defaults;
				var idx = keys.indexOf(type);
				if (idx != -1) {
					keys[idx] = null;
					overrides = components[type];
					let subKeys = this.subKeys[type];
					let k = subKeys.length;
					if (k > 0) {
						for (let j = 0; j < k; j++) {
							let subKey = subKeys[j];
							if (overrides[subKey] === undefined) {
								overrides[subKey] = defaults[subKey];
							}
						}
					}
				}
				entity.createComponent(type, overrides);
			}
			for (let key of keys) {
				if (key != null) {
					entity.createComponent(key, components[key]);
				}
			}
		}
		return entity;
	}

	/**
	 * Brief summary
	 * @private
	 * @return {String}
	 */
	toString() {
		let comps = Object.keys(this.components).join(', ');
		return `Prefab #${this.id}`;
	}

	/**
	 * Allocate Prefab by Id
	 * @static
	 * @param {String} id Prefab Id
	 * @param {Entity} parent Parent entity
	 * @param {Object} components Override components
	 * @return {Entity}
	 */
	static create(id, parent, components) {
		let prefab = Prefab.byId[id];
		if (prefab == null) {
			throw new Error(`Prefab "${id}" not found`);
		}
		return prefab.create(parent, components);
	}
};

Entity.reset();

export class ComponentMap {
	constructor() {
		this.types = new Set();
		for (let type of ComponentMap.types) {
			this[type] = null;
		}
	}

	get(type) {
		return this[type];
	}
}

ComponentMap.types = new Set();
