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
	type: string;
	uid: number;
	attributes: ?Object;
	enabled: boolean;
	allocated: boolean;
	entity: any;
	parent: Entity;
	root: Entity;
	components: {[key:string]: ?Component};
	registry: Registry;
	listenersRef: Array<any>;

	constructor() {
		this.uid = 0;
		this.enabled = false;
		this.allocated = false;
		this.destroyed = false;
		this.entity = emptyEntity;
		this.parent = emptyEntity;
		this.root = emptyEntity;
		this.components = emptyComponentMap;
		this.listenersRef = [];
	}

	/**
	 * Brief summary.
	 * @private
	 * @return {String}
	 */
	toString():string {
		return `${this.type} #${this.uid} [^ ${this.entity}]`;
	}

	/**
	 * Allocate Component.
	 * @private
	 */
	allocate():void {
		let entity = this.parent;
		this.entity = entity;
		let components = entity.components;
		if (components[this.type] != null) {
			throw new Error(`Component ${this.type} already allocated for ${entity}`);
		}
		components[this.type] = this;
		this.components = components; // Bailout_Normal after setprop
		entity.componentKeys.push(this.type);
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
		event.cancelable = true;
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
		if (this.listenersRef.length) {
			let refs = this.listenersRef;
			for (let i = 0, l = refs.length; i < l; i++) {
				refs[i].off(this);
			}
			refs.length = 0;
		}
		this.components[this.type] = null;
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

	enable(state?:boolean) {
		if (state == null) {
			state = !this.enabled;
		}
		this.emit('onComponent' + (state ? 'Enable' : 'Disable'));
		this.enabled = state;
	}

	emit(event:Event, detail:any) {
		return this.entity.emit(event, this, detail);
	}

	static create(cls:any, type?:string):any {
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
		ComponentMap.prototype[proto.type] = null;
		let getter = {
			get: function() {
				return this.components[type];
			}
		}
		Object.defineProperty(Component.prototype, '$' + type, getter);
		Object.defineProperty(Entity.prototype, '$' + type, getter);
		Registry.create(cls);
	}
}

Component.prototype.type = 'component';
