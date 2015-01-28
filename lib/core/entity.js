/** @flow */

var Pool = require('./pool');
var Mathf = require('../math/mathf');
var ComponentMap = Pool.ComponentMap;
var Prefab = null;

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
class Entity {
	type: string;
	uid: number;
	enabled: boolean;
	allocated: boolean;
	parent: ?Entity;
	root: ?Entity;
	layer: number;
	components: {[key:string]: any};
	componentKeys: Array<string>;
	events: Object; // {[key:string]: Array<Entity|string>};
	eventRefs: Array<any>;
	pool: Pool;
	prefab: ?string;
	next: ?Entity;
	firstChild: ?Entity;
	lastChild: ?Entity;

	constructor() {
		this.type = 'entity';
		this.uid = 0;
		this.enabled = false;
		this.allocated = false;
		this.layer = 0.0;
		this.parent = null;
		this.root = null;
		this.components = new ComponentMap();
		this.componentKeys = [];
		this.events = {};
		this.eventRefs = [];
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
		var comps = this.componentKeys.join(', ');
		return 'Entity #' + this.uid + ' (' + comps + ') [^ ' +
			this.parent + ']';
	}

	/**
	 * Allocates entity from component/attribute hash
	 * @private
	 * @param {Object} attributes List of components and their attributes
	 * @return {Entity}
	 */
	allocate(attributes:?Object):void {
		var parent = this.parent
		if (parent != null) {
			var last = parent.lastChild;
			if (last != null) {
				last.next = this;
			} else {
				parent.firstChild = this;
			}
		}
		this.prefab = '';
		if (attributes != null) {
			for (var type in attributes) {
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
		var pool = Pool.byType[type];
		if (pool == null) {
			throw new Error('Unknown component "' + type + '". ' + this);
		}
		return pool.allocate(this, attributes);
	}

	/**
	 * Add new Entity as child
	 * @param {String|Object} prefabId {@link Prefab} ID or prefab attribute object
	 * @param {Object} attributes (optional) Override {@link Prefab} attributes
	 * @return {Entity}
	 */
	createChild(prefabId:string|Object, attributes:?Object):Entity {
		if (typeof prefabId == 'string') {
			if (Prefab == null) { // Interdependent modules :(
				Prefab = require('./prefab');
			}
			return Prefab.create(prefabId, this, attributes);
		}
		return Entity.create(this, prefabId);
	}

	/**
	 * Match Entity against a list of {@link Component} types.
	 * @param {Array|String} selector {@link Component} type(s)
	 * @return {Boolean}
	 */
	has(selector:string|Array<string>):boolean {
		var components = this.components;
		if (Array.isArray(selector)) {
			for (var i = 0, l = selector.length; i < l; i++) {
				if (components[selector[i]]) {
					return true;
				}
			}
		} else if (components[selector] != null) {
			return true;
		}
		return false;
	}

	get lastChild():?Entity {
		var previous = this.firstChild;
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
		this.pool.destroy(this);
		var keys = this.componentKeys;
		for (var i = 0, l = keys.length; i < l; i++) {
			var key = keys[i];
			if (this.components[key] != null) {
				this.components[key].destroy();
			}
		}
		keys.length = 0;
		var child = this.firstChild;
		while (child) {
			child.destroy();
			child = child.next;
		}
	}

	removeChild(needle:Entity):boolean {
		var child = this.firstChild;
		var prev = null;
		while (child) {
			if (child == needle) {
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
	superFree():void {
		// Remove referenced subscribers
		var refs = this.eventRefs;
		for (var i = 0, l = refs.length; i < l; i++) {
			refs[i].off(this);
		}
		refs.length = 0;
		// Remove own subscribers
		var events = this.events;
		for (var event in events) {
			events[event].length = 0;
		}

		// Eager deallocate
		var child = this.firstChild;
		this.firstChild = null;
		var next = null;
		while (child != null) {
			next = child.next;
			child.next = null;
			child = next;
		}

		var parent = this.parent;
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
		this.emit((state ? 'onEnable' : 'onDisable'), this);
		this.enabled = state;
		var keys = this.componentKeys;
		for (var i = 0, l = keys.length; i < l; i++) {
			var key = keys[i];
			if (this.components[key] != null) {
				this.components[key].enable(state, true);
			}
		}
		if (deep) {
			var child = this.firstChild;
			while (child != null) {
				child.enable(state, true);
				child = child.next;
			}
		}
	}

	/**
	 * Has subscriber
	 * @param {String} event Event name to eventscribe to 'on*'
	 */
	hasEvent(name:string):boolean {
		var events = this.events[name];
		return events && events.length > 0;
	}

	/**
	 * Subscribe to event messages
	 * @param {Entity|null} scope Target Entity for eventscription
	 * @param {String} name Event name to eventscribe to 'on*'
	 * @param {String} method (optional) Local method name to call, defaults to event name
	 */
	on(scope:?Entity, name:string, method?:string):void {
		if (scope == null) {
			scope = this;
		}
		var events = this.events;
		var items = (events[name] || (events[name] = []));
		items.push(scope, method);
		if (scope != this) {
			scope.eventRefs.push(this);
		}
	}

	/**
	 * Publish a event message only for this entity
	 * @param {String} event
	 * @param {Object|null} payload Argument(s)
	 */
	emit(name:string, payload:any):void {
		var items = this.events[name];
		if (items != null) {
			var i = items.length;
			while ((i -= 2) >= 0) {
				if (items[i] != null && items[i].enabled) {
					items[i][items[i + 1] || name](payload);
				}
			}
		}
	}

	/**
	 * Publish a event message for this entity and it's parents
	 * @param {String} event
	 * @param {Object|null} payload Argument(s)
	 */
	emitUp(name:string, payload:any):void {
		var entity = this;
		do {
			if (entity.enabled) {
				entity.emit(name, payload);
			}
			entity = entity.parent;
		} while (entity);
	}

	/**
	 * Publish a event message for all subscribed entities
	 * @param {String} name
	 * @param {Object|null} payload Argument(s)
	 */
	emitAll(name:string, payload:any):void {
		Pool.call(name, payload);
	}

	/**
	 * Unsubscribe scope from event
	 * @param {Entity|Component} unscope (optional) Subscriber scope to remove
	 * @param {String|null} needle (optional) Event to remove
	 */
	off(unscope:?Entity, needle?:string):void {
		var events = this.events;
		var i = 0;
		for (var name in events) {
			if (needle != null && needle === name) {
				continue;
			}
			var items = events[name];
			if (items == null || !(i = items.length)) {
				continue;
			}
			var length = i / 2;
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


}

Entity.create = function(parent:Entity, attributes) {
	return Entity.pool.allocate(parent, attributes);
};

Entity.prototype.pool = new Pool(Entity);

module.exports = Entity;
