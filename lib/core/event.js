
import {uid} from '../math/mathf';

export default class Event {
	constructor(cancelable, aggregate) {
		this.entity = null;
		this.component = null;
		this.uid = uid();
		this.bubbles = true;
		this.aggregate = (aggregate) ? true : false;
		this.cancelable = (cancelable) ? true : false;
		this.timeStamp = Date.now();
		this.canceled = false;
		this.stopped = false;
		this.detail = null;
	}

	toString() {
		return `Event ${this.type} [${this.component} on ${this.entity}]`;
	}

	destroy() {
		this.entity = null;
		this.component = null;
		this.detail = null;
		this.registry.destroy(this);
	}

	cancel() {
		if (this.cancelable) {
			this.cancel = true;
		}
	}

	stop() {
		this.stopped = true;
	}

	static create(type, detail) {
		let event = Registry.create(Event.toType(type));
		if (detail != null) {
			event.detail = detail;
		}
		return event;
	}

	static register(cls, type) {
		type = Event.toType(type);
		cls.type = type;
		cls.prototype.type = type;
		cls.prototype.handler = Event.toHandler(type);
		return new Registry(cls);
	}

	static registerTypeOnly(type) {
		class CustomEvent extends Event {
			constructor() {
				Event.call(this);
			}
		}
		return Event.register(CustomEvent, type);
	}

	static toHandler(str) {
		if ((/^on/).test(str)) {
			return str;
		}
		return 'on' + str.charAt(0).toUpperCase() + str.slice(1);
	}

	static toType(str) {
		if (!(/^on/).test(str)) {
			return str;
		}
		return str.charAt(2).toLowerCase() + str.slice(3);
	}
}

export class Registry {
	constructor(cls) {
		this.cls = cls;
		let proto = cls.prototype;
		let type = proto.type;
		if (Registry.types[type] != null) {
			throw new Error(`Event '${type}' is already registered`);
		}
		this.type = type;
		Registry.types[type] = this;
		cls.registry = this;
		proto.registry = this;
		this.pool = [];
		this.allocated = 0;
		this.length = 0;
	}

	static create(type) {
		let registry = Registry.types[type];
		if (registry == null) {
			// console.warn(`Event '${type}' created on demand`);
			registry = Event.registerTypeOnly(type);
		}
		return registry.create();
	}

	create() {
		if (this.allocated == 0) {
			this.length++;
			return new this.cls();
		}
		this.allocated--;
		let instance = this.pool.pop();
		this.cls.call(instance);
		return instance;
	}

	destroy(instance) {
		this.allocated++;
		this.pool.push(instance);
	}

	static dump() {
		let types = Registry.types;
		console.group('Events.dump');
		for (let type in types) {
			let registry = types[type];
			console.log('%s: %d/%d allocated', type, registry.length - registry.allocated, registry.length);
		}
		console.groupEnd('Events.dump');
	}
}

Registry.types = {};

Event.register(Event, 'event');

if (typeof window != 'undefined' && window.console) {
	console.acme = console.acme || (console.acme = {});
	console.acme.dumpEvents = function() {
		Registry.dump();
		return null;
	};
}
