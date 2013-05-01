'use strict';

require('./math');

function Pool(cls) {
  this.cls = cls;
  var proto = cls.prototype;
  proto.pool = this;
  cls.pool = this;
  this.register = [];
  this.enabled = false;
  this.allocd = 0;
  this.tag = proto.tag;
  if (this.tag) {
    Pool.byTag[this.tag] = this;
  } else {
    throw new Error('No tag provided.');
  }

  var pool = this;
  cls.alloc = function(parent, attributes) {
    return pool.alloc(parent, attributes);
  };

  this.advanced = (this.tag !== 'entity' && !proto.light);

  if (this.advanced) {
    this.layer = proto.layer || cls.layer || 0;
    this.subs = [];
    this.calls = [];

    if ((this.attributes = proto.attributes || null)) {
      this.attributeKeys = Object.keys(this.attributes);
    }

    var types = Pool.typedCalls;
    var keys = Object.keys(proto).concat(Object.keys(cls));
    var fn = '';
    for (var i = 0, l = keys.length; i < l; i++) {
      fn = keys[i];
      if (Pool.regxCall.test(fn)) {
        if (!~types.indexOf(fn)) {
          types.push(fn);
          Pool.calls[fn] = [];
        }
        this.subs.push(fn);
      } else if (Pool.regxGetter.test(fn)) {
        var key = fn.substr(3, 1).toLowerCase() + fn.substr(4);
        Pool.defineGetter(proto, key, fn);
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

Pool.prototype.toString = function() {
  return "Pool " + this.tag +
    " [" + this.allocd + " / " + this.register.length + "]";
};

Pool.prototype.fill = function(i) {
  while (i--) {
    this.newInstance();
  }
};

Pool.prototype.newInstance = function() {
  var entity = new this.cls();
  entity.enabled = false;
  entity.allocd = false;
  this.register.push(entity);

  var calls = this.calls;
  if (calls) {
    for (var i = 0, l = calls.length; i < l; i++) {
      Pool.calls[calls[i]].push(entity);
    }
  }
  return entity;
};

Pool.prototype.alloc = function(parent, attributes) {
  // Get free or create new entity
  var entity = null;
  var register = this.register;
  var i = register.length;
  while (i--) {
    if (!register[i].allocd) {
      entity = register[i];
      break;
    }
  }
  if (!entity) {
    entity = this.newInstance();
  }

  var defaults = null;
  this.allocd++;
  this.enabled = true;
  var uid = entity.uid = Math.uid();
  entity.enabled = true;
  entity.allocd = true;
  entity.parent = parent || null;
  entity.root = parent && parent.root || parent || entity;

  if (this.advanced) {
    var calls = this.calls;
    for (var i = 0, l = calls.length; i < l; i++) {
      var call = calls[i];
      if (Pool.order[call] != null) {
        Pool.order[call] = true;
      }
    }
    entity.layer = (parent && parent.layer || 0) + this.layer + 2 - 1 / uid;
    defaults = this.attributes;
    if (defaults) {
      if (attributes && !attributes._merged) {
        if (attributes.__proto__) {
          attributes.__proto__ = defaults;
        } else {
          var attributeKeys = this.attributeKeys;
          for (i = 0, l = attributeKeys.length; i < l; i++) {
            var key = attributeKeys[i];
            if (!(key in attributes)) {
              attributes[key] = defaults[key];
            }
          }
        }
        attributes._merged = true;
      }
    }
    var subs = this.subs;
    for (var j = 0, l1 = subs.length; j < l1; j++) {
      parent.sub(entity, subs[j]);
    }
  }

  entity.alloc(attributes || defaults || null);
  // console.log(this.tag, entity);
  return entity;
};

Pool.prototype.destroy = function(entity) {
  entity.enabled = false;
  Pool.calls.free.push(entity);
};

Pool.prototype.free = function(entity) {
  entity.allocd = false;
  entity.uid = null;
  entity.root = null;
  entity.parent = null;
  this.enabled = (this.allocd--) > 1;
};

Pool.prototype.invoke = function(fn, a0, a1, a2, a3) {
  var stack = this.register;
  var i = this.register.length;
  while (i--) {
    if (stack[i].enabled) {
      stack[i][fn](a0, a1, a2, a3);
    }
  }
  return this;
};

Pool.typedCalls = ['fixedUpdate', 'simulate', 'update', 'postUpdate', 'preRender', 'render'];
// Create call array
Pool.calls = {free: []};
for (var i = 0, l = Pool.typedCalls.length; i < l; i++) {
  Pool.calls[Pool.typedCalls[i]] = [];
}

Pool.regxCall = /^on[A-Z]/;
Pool.regxGetter = /^get[A-Z]/;
Pool.byTag = {};
Pool.order = {
  render: false
};

Pool.dump = function(flush) {
  var byTag = Pool.byTag;
  for (var tag in byTag) {
    var pool = byTag[tag];
    console.log("%s: %d/%d allocd", tag, pool.allocd, pool.register.length);
  }
  if (flush) {
    Pool.flush();
  }
};

Pool.defineGetter = function(proto, key, fn) {
  Object.defineProperty(proto, key, {
    get: proto[fn],
    enumerable: true,
    configurable: true
  });
  return proto;
};

Pool.free = function() {
  var stack = this.calls.free;
  for (var i = 0, l = stack.length; i < l; i++) {
    stack[i].free();
  }
  stack.length = 0;
};

Pool.flush = function() {
  var byTag = Pool.byTag;
  for (var tag in byTag) {
    var register = byTag[tag].register;
    var i = register.length;
    var freed = 0;
    while (i--) {
      if (register[i].allocd) {
        continue;
      }
      register.splice(i, 1);
      freed++;
    }
    console.log("%s: %d/%d flushed", tag, freed, register.length);
  }
};

Pool.invoke = function(fn, arg) {
  var stack = this.calls[fn], i = stack.length;
  if (!i) {
    return;
  }
  if (Pool.order[fn]) {
    stack.sort(Pool.orderFn);
    Pool.order[fn] = false;
  }
  while (i--) {
    if (stack[i].enabled) {
      stack[i][fn](arg);
    }
  }
};

Pool.orderFn = function(a, b) {
  return b.layer - a.layer;
};

module.exports = Pool;
