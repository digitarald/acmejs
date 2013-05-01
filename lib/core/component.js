'use strict';

var Pool = require('./pool');

function Component(tag, cls) {
  if (!tag) {
    return null;
  }
  var proto = cls.prototype;
  cls.prototype = Object.create(Component.prototype);
  cls.prototype.tag = tag;

  var key = '';
  for (key in proto) {
    cls.prototype[key] = proto[key];
  }
  new Pool(cls);
  return null;
}

Component.prototype.tag = 'component';

Component.prototype.toString = function() {
  return "Component " + this.tag + "#" + this.uid + " [^ " + this.entity + "]";
};

Component.prototype.alloc = function(attributes) {
  var entity = this.entity = this.parent;
  entity.components[this.tag] = this;
  entity[this.tag] = this;

  var components = entity.components;
  for (var tag in components) {
    if (tag === this.tag) {
      continue;
    }
    this[tag] = components[tag];
    components[tag][this.tag] = this;
  }

  if (this.create) {
    this.create(attributes);
  }
};

Component.prototype.destroy = function() {
  this.pool.destroy(this);
};

Component.prototype.free = function() {
  delete this.entity.components[this.tag];
  this.entity[this.tag] = null;

  var components = this.entity.components;
  for (var tag in components) {
    if (tag === this.tag) {
      continue;
    }
    this[components[tag].tag] = null;
    components[tag][this.tag] = null;
  }
  this.entity = null;
  this.pool.free(this);
};

Component.prototype.enable = function(state, silent) {
  if (state == null) {
    state = !this.state;
  }
  this.enabled = state;
  if (silent) {
    this.entity.pub('onComponent' + (state ? 'Enable' : 'Disable'), this);
  }
};

module.exports = Component;
