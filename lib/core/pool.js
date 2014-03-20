'use strict';

require('./math');

/**
 * Pool
 *
 * @param {Object} cls Class to pool
 */
function Pool(cls) {
	this.cls = cls;
	var proto = cls.prototype;
	proto.pool = this;
	cls.pool = this;
	this.heap = [];
	this.enabled = false;
	this.allocated = 0;

	if (!proto.type) {
		throw new Error('No type provided.');
	}
	this.type = proto.type;
	Pool.byType[this.type] = this;

	var pool = this;
	cls.create = function(parent, attributes) {
		return pool.alloc(parent, attributes);
	};

	this.attachable = (this.type !== 'entity' && !proto.light);

	if (this.attachable) {
		this.layer = proto.layer || cls.layer || 0;
		this.events = [];
		this.calls = [];

		if ((this.attributes = proto.attributes || null)) {
			this.attributeKeys = Object.keys(this.attributes);
		}

		var types = Pool.typedCalls;
		var keys = Object.keys(proto).concat(Object.keys(cls));

		var fn = '';
		var key = '';
		for (var i = 0, l = keys.length; i < l; i++) {
			fn = keys[i];
			if (Pool.regxCall.test(fn)) {
				if (!~types.indexOf(fn)) {
					types.push(fn);
					Pool.calls[fn] = [];
				}
				this.events.push(fn);
			} else if (Pool.regxGetter.test(fn)) {
				key = fn.substr(3, 1).toLowerCase() + fn.substr(4);
				Object.defineProperty(proto, key, {
					get: proto[fn],
					enumerable: true,
					configurable: true
				});
			} else if (Pool.regxSetter.test(fn)) {
				key = fn.substr(3, 1).toLowerCase() + fn.substr(4);
				Object.defineProperty(proto, key, {
					set: proto[fn],
					enumerable: true,
					configurable: true
				});
			}
		}

		for (i = 0, l = types.length; i < l; i++) {
			fn = types[i];
			if (fn in cls) {
				this[fn] = cls[fn];
				Pool.calls[fn].push(this);
			} else if (fn in proto) {
				this.calls.push(fn);
			}
		}
	}
}

Pool.prototype = {

	/**
	 * Brief summary.
	 *
	 * @return {String}
	 */
	toString: function() {
		return 'Pool ' + this.type +
			' [' + this.allocated + ' / ' + this.heap.length + ']';
	},

	/**
	 * Fill pool with deallocd instances.
	 *
	 * @private
	 *
	 * @param {Number} amount Amount of objects to instanziate.
	 */
	fill: function(amount) {
		while (amount--) {
			this.newInstance();
		}
	},

	newInstance: function() {
		var entity = new this.cls();
		entity.enabled = false;
		entity.allocated = false;
		this.heap.push(entity);

		var calls = this.calls;
		if (calls) {
			for (var i = 0, l = calls.length; i < l; i++) {
				Pool.calls[calls[i]].push(entity);
			}
		}
		return entity;
	},

	/**
	 * Allocate a new instance from dealloc pool or by creating.
	 *
	 * The provided attributes are merged with the default attributes.
	 *
	 * @param {Entity} parent (optional) Parent class
	 * @param {Object} attributes (optional) Attributes object
	 *
	 * @return {Object}
	 */
	alloc: function(parent, attributes) {
		// Get dealloc or create new entity
		var entity = null;
		var heap = this.heap;
		var i = heap.length;
		while (i--) {
			if (!heap[i].allocated) {
				entity = heap[i];
				break;
			}
		}
		if (!entity) {
			entity = this.newInstance();
		}

		var defaults = null;
		this.allocated++;
		this.enabled = true;
		var uid = entity.uid = Math.uid();
		entity.enabled = true;
		entity.allocated = true;
		entity.parent = parent || null;
		entity.root = parent && parent.root || parent || entity;

		if (this.attachable) {
			// Set layer, combined from parent layer, pool layer and uid
			entity.layer = (parent && parent.layer || 0) + this.layer + 2 - 1 / uid;

			// Prepare sorting if needed
			var calls = this.calls;
			for (i = 0, l = calls.length; i < l; i++) {
				var call = calls[i];
				if (Pool.sorted[call] != null) {
					Pool.sorted[call] = true;
				}
			}

			// Merge defaults with new attributes
			defaults = this.attributes;
			if (defaults) {
				if (attributes && !attributes.__merged__) {
					Object.setPrototypeOf(attributes, defaults);
					attributes.__merged__ = true;
				}
			}

			// Add events
			var events = this.events;
			for (i = 0, l = events.length; i < l; i++) {
				parent.on(entity, events[i]);
			}
		}

		entity.alloc(attributes || defaults || null);

		return entity;
	},

	/**
	 * Destroy given instance.
	 *
	 * @private
	 *
	 * @param {Object} entity Pooled object
	 */
	destroy: function(entity) {
		entity.enabled = false;
		Pool.calls.dealloc.push(entity);
	},

	/**
	 * Free destroyed object.
	 *
	 * @param {Object} entity Pooled object
	 */
	dealloc: function(entity) {
		entity.allocated = false;
		entity.root = null;
		entity.parent = null;
		this.enabled = (this.allocated--) > 1;
	},

	/**
	 * Invoke method on all enabled pooled object instances.
	 *
	 * @param {String} fn Method name
	 * @param {Mixed} args (optional) Argument(s)
	 */
	call: function(fn, args) {
		var stack = this.heap;
		var i = this.heap.length;
		while (i--) {
			if (stack[i].enabled) {
				stack[i][fn](args);
			}
		}
	}

};

Pool.typedCalls = [
	'fixedUpdate',
	'simulate',
	'update',
	'postUpdate',
	'preRender',
	'render'
];

// Create call array
Pool.calls = {dealloc: []};
for (var i = 0, l = Pool.typedCalls.length; i < l; i++) {
	Pool.calls[Pool.typedCalls[i]] = [];
}

Pool.regxCall = /^on[A-Z]/;
Pool.regxGetter = /^get[A-Z]/;
Pool.regxSetter = /^set[A-Z]/;
Pool.byType = {};
Pool.sorted = {
	render: false
};

/**
 * Dump debugging details and optionally flush dealloc objects.
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

Pool.dealloc = function() {
	var stack = this.calls.dealloc;
	for (var i = 0, l = stack.length; i < l; i++) {
		stack[i]._dealloc();
	}
	stack.length = 0;
};

Pool.flush = function() {
	var byType = Pool.byType;
	for (var type in byType) {
		var dealloced = 0;
		var heap = byType[type].heap;
		var i = heap.length;
		while (i--) {
			if (heap[i].allocated) {
				continue;
			}
			heap.splice(i, 1);
			dealloced++;
		}
		console.log('%s: %d/%d flushed', type, dealloced, heap.length);
	}
};

Pool.call = function(fn, arg) {
	var stack = this.calls[fn];
	if (!stack) {
		return;
	}
	var i = stack.length;
	if (!i) {
		return;
	}
	if (Pool.sorted[fn]) {
		stack.sort(Pool.sortFn);
		Pool.sorted[fn] = false;
	}
	while (i--) {
		if (stack[i].enabled) {
			// BAILOUT after callelem
			stack[i][fn](arg);
		}
	}
};

Pool.sortFn = function(a, b) {
	return b.layer - a.layer;
};

module.exports = Pool;
