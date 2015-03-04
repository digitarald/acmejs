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
	type: string;
	uid: number;
	enabled: boolean;
	allocated: boolean;
	parent: ?Entity;
	root: ?Entity;
	components: {[key:string]: any};
	componentKeys: Array<string>;
	listeners: Object; // {[key:string]: Array<Entity|string>};
	listenersRef: Array<any>;
	registry: Registry;
	prefab: ?string;
	next: ?Entity;
	firstChild: ?Entity;
	lastChild: ?Entity;

	constructor() {
		this.type = 'entity';
		this.uid = 0;
		this.enabled = false;
		this.allocated = false;
		this.parent = null;
		this.root = null;
		this.components = new ComponentMap();
		this.componentKeys = [];
		this.listeners = {};
		this.listenersRef = [];
		this.listenersIndex = [];
		this.prefab = '';
		this.next = null;
		this.firstChild = null;
	}

	/**
	 * Brief summary
	 * @private
	 * @return {String}
	 */
	toString():string {
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
	allocate(attributes:?Object):void {
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
	createComponent(type:string, attributes:?Object):any {
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
	createChild(prefabId:string|Object, attributes:?Object):Entity {
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
	hasComponent(selector:string):boolean {
		let components = this.components;
		if (components[selector] != null) {
			return true;
		}
		return false;
	}

	hasComponents(selector:Array<string>, any):boolean {
		for (let i = 0, l = selector.length; i < l; i++) {
			if (components[selector[i]]) {
				return true;
			}
			if (!any) {
				return false;
			}
		}
		return false;
	}

	get lastChild():?Entity {
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
	destroy():void {
		this.enabled = false;
		this.registry.destroy(this);
		let keys = this.componentKeys;
		for (let i = 0, l = keys.length; i < l; i++) {
			let key = keys[i];
			if (this.components[key] != null) {
				this.components[key].destroy();
			}
		}
		keys.length = 0;
		let child = this.firstChild;
		while (child) {
			child.destroy();
			child = child.next;
		}
	}

	removeChild(entity:Entity):boolean {
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
	deallocate():void {
		// Remove referenced subscribers
		let refs = this.listenersRef;
		for (let i = 0, l = refs.length; i < l; i++) {
			refs[i].off(this);
		}
		refs.length = 0;
		// Remove own subscribers
		let listeners = this.listeners;
		for (let event in listeners) {
			listeners[event].length = 0;
		}

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
		this.root = null;
		this.parent = null;
	}

	enable(state:?boolean, deep:?boolean):void {
		if (state == null) {
			state = !this.enabled;
		}
		this.emit(Event.create(state ? 'enable' : 'disable'));
		this.enabled = state;
		let keys = this.componentKeys;
		for (let i = 0, l = keys.length; i < l; i++) {
			let key = keys[i];
			if (this.components[key] != null) {
				this.components[key].enable(state, true);
			}
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
	hasEvent(name:string):boolean {
		let listeners = this.listeners[name];
		return listeners && listeners.length > 0;
	}

	/**
	 * Subscribe to event messages
	 * @param {Entity|null} scope Target Entity for listenerscription
	 * @param {String} name Event name to listenerscribe to 'on*'
	 * @param {String} method (optional) Local method name to call, defaults to event name
	 */
	on(scope:?Entity, name:string, method?:string):void {
		if (scope == null) {
			scope = this;
		}
		let listeners = this.listeners;
		if (listeners[name] == null) {
			listeners[name] = [];
			this.listenersIndex.push(name);
		}
		let items = listeners[name];
		items.push(scope, method);
		if (scope != this) {
			scope.listenersRef.push(this);
		}
	}

	/**
	 * Publish a event message for this entity and it's parents
	 * @param {String} event
	 */
	emit(type:string|Event, component:?Component, detail):boolean {
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
				if (entity.enabled) {
					// Invoke
					let listeners = entity.listeners[handler];
					if (listeners != null) {
						let i = listeners.length;
						while ((i -= 2) >= 0) {
							let listener = listeners[i];
							if (listener != null && listener.enabled) {
								listener[listeners[i + 1] || handler](event);
							}
						}
					}
					if (event.stopped) {
						break;
					}
				}
				if (!event.bubbles) {
					break;
				}
				entity = entity.parent;
			} while (entity);
		}
		let canceled = event.canceled;
		event.destroy();
		return canceled;
	}

	/**
	 * Unsubscribe scope from event
	 * @param {Entity|Component} unscope (optional) Subscriber scope to remove
	 * @param {String|null} handle (optional) Event to remove
	 */
	off(unscope:?Entity, handle?:string):void {
		var index = this.listenersIndex;
		let listeners = this.listeners;
		let i = 0;
		for (let j = 0, l = index.length; j < l; j++) {
			let name = index[j];
			if (handle != null && handle === name) {
				continue;
			}
			let items = listeners[name];
			if (items == null) {
				continue;
			}
			let i = items.length;
			if (i == 0) {
				continue;
			}
			let length = i / 2;
			while ((i -= 2) >= 0) {
				if (items[i] != null && (!unscope || unscope === items[i])) {
					items[i] = null;
					length--;
				}
			}
			if (length === 0) {
				items.length = 0;
			}
		}
	}

	static create(parent:Entity, attributes:Object) {
		return Entity.registry.allocate(parent, attributes);
	}

	static createPrefab(id:string, components:Object):Prefab {
		return new Prefab(id, components);
	}

	static reset():void {
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
		for (let type in components) {
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
		let entity = Entity.create(parent,
			(components == null) ? this.components : null
		);
		entity.prefab = this.id;
		if (components != null) {
			let types = this.types;
			let type = '';
			for (let i = 0, l = types.length; i < l; i++) {
				type = types[i];
				let defaults = this.components[type];
				let overrides = components[type];
				if (overrides != null) {
					delete components[type];
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
	static create(id:string, parent:Entity, components):Entity {
		let prefab = Prefab.byId[id];
		if (prefab == null) {
			throw new Error(`Prefab "${id}" not found`);
		}
		return prefab.create(parent, components);
	}
};

Entity.reset();

export class ComponentMap {}
