/** @flow */

import Registry from './registry';
import Event from './event';
import Entity, {ComponentMap} from './entity';

let emptyEntity = new Entity();
let emptyComponentMap = new ComponentMap();

/**
 * @class Component
 * Encapsulated behaviours that can be attached to entities.
 *
 * @abstract
 * @property {Boolean} enabled False when disabled or not allocated. Never act on disabled components!
 * @property {Entity} parent Container entity
 * @property {Entity} root Scene entity
 */
export default class Component {
	constructor() {
		this.uid = 0;
		this.enabled = false;
		this.allocated = false;
		this.destroyed = false;
		this.entity = emptyEntity;
		this.parent = emptyEntity;
		this.root = emptyEntity;
		this.components = emptyComponentMap;
		this.listenersRef = new Set();
	}

	/**
	 * Brief summary.
	 * @private
	 * @return {String}
	 */
	toString() {
		return `${this.type} #${this.uid} [^ ${this.entity}]`;
	}

	/**
	 * Allocate Component.
	 * @private
	 */
	allocate() {
		let entity = this.parent;
		let components = entity.components;
		if (components.types.has(this.type)) {
			throw new Error(`Component ${this.type} already allocated for ${entity}`);
		}
		components[this.type] = this;
		components.types.add(this.type);
		this.components = components;
		this.entity = entity;
		this.create();
		let event = Event.create(this.type + 'Create');
		event.aggregate = true;
		event.cancelable = true;
		this.emit(event);
	}

	/**
	 * Destroy Component, removes it from {@link Entity}.
	 */
	destroy() {
		if (this.destroyed) {
			return;
		}
		this.destroyed = true;
		let event = Event.create(this.type + 'Destroy');
		event.aggregate = true;
		event.cancelable = false;
		this.emit(event);
		this.enabled = false;
		this.registry.destroy(this);
	}

	/**
	 * Free destroyed Component.
	 * @private
	 */
	deallocate() {
		if (!this.allocated) {
			throw new Error('Component already deallocated');
		}
		this.allocated = false;
		this.destroyed = false;
		this.free();
		let refs = this.listenersRef;
		for (let ref of refs) {
			if (ref.allocated) {
				ref.off(this);
			}
		}
		refs.clear();
		this.components[this.type] = null;
		this.components.types.delete(this.type);
		// Clear reference to entity.components
		this.components = emptyComponentMap;
		this.entity = emptyEntity;
		this.root = emptyEntity;
		this.parent = emptyEntity;
	}

	free() {
		// override me
	}

	create() {
		// override me
	}

	enable(state) {
		if (state == null) {
			state = !this.enabled;
		}
		this.emit(Event.create('component' + (state ? 'Enable' : 'Disable')));
		this.enabled = state;
	}

	emit(event, detail) {
		return this.entity.emit(event, this, detail);
	}

	static create(cls, type) {
		let proto = cls.prototype;
		if (!Component.prototype.isPrototypeOf(proto)) {
			let descriptors = {};
			Object.getOwnPropertyNames(proto).forEach(function(name) {
				descriptors[name] = Object.getOwnPropertyDescriptor(proto, name);
			});
			if (type != null) {
				descriptors.type = {
					value: type
				};
			}
			cls.prototype = Object.create(Component.prototype, descriptors);
			cls.prototype.constructor = cls;
		} else if (type) {
			proto.type = type;
		} else {
			type = proto.type;
		}
		ComponentMap.types.add(proto.type);
		Registry.create(cls);
	}
}

Component.prototype.type = 'component';
