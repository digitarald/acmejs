'use strict';

var Component = require('./component');
var Pool = require('./pool');
var Vec2 = require('./math').Vec2;
var Engine = require('./engine');

/**
 * Input
 *
 * Input handling for mouse, touch, keyboard and hardware sensors
 *
 * @extends Component
 */
function Input() {
  this.queue = [];
  this.locks = {};
  this.pos = Vec2();
  this.prevPos = Vec2();
  this.touchState = null;
  this.axis = Vec2();
  this.mouseAxis = Vec2();
  this.orientation = Vec2();
  this.prevOrientation = Vec2();
  this.baseOrientation = Vec2();

  this.map = {
    32: 'space',
    192: 'debug',
    38: 'up',
    87: 'up',
    39: 'right',
    68: 'right',
    40: 'bottom',
    83: 'bottom',
    37: 'left',
    65: 'left',
    219: 'squareLeft',
    221: 'squareRight'
  };
  this.axisMap = {
    left: Vec2(0, -1),
    right: Vec2(0, 1),
    up: Vec2(1, -1),
    bottom: Vec2(1, 1)
  };

  this.keyNames = [];
  this.keys = {};

  var map = this.map;
  for (var code in map) {
    var key = map[code];
    if (!~this.keyNames.indexOf(key)) {
      this.keyNames.push(key);
      this.keys[key] = null;
    }
  }

  this.throttled = {
    mousemove: true,
    deviceorientation: true
  };

  this.lastEvent = null;

  this.events = this.support.touch ? {
    touchstart: 'startTouch',
    touchmove: 'moveTouch',
    touchend: 'endTouch',
    touchcancel: 'endTouch'
  } : {
    mousedown: 'startTouch',
    mousemove: 'moveTouch',
    mouseup: 'endTouch',
    keydown: 'keyStart',
    keyup: 'keyEnd'
  };

  this.events.blur = 'blur';
  this.events.deviceorientation = 'deviceOrientation';

  this.attach();
}

Input.prototype.attach = function() {
  for (var type in this.events) {
    window.addEventListener(type, this, false);
  }
};

Input.prototype.detach = function() {
  for (var type in this.events) {
    window.removeEventListener(type, this, false);
  }
};

Input.prototype.support = {
  touch: 'ontouchstart' in window,
  orientation: 'ondeviceorientation' in window
};

Input.prototype.handleEvent = function(event) {
  if (event.metaKey) {
    return;
  }
  event.preventDefault();
  var type = event.type;
  if (this.throttled[type] && this.lastEvent === type) {
    this.queue[this.queue.length - 1] = event;
  } else {
    this.lastEvent = type;
    this.queue.push(event);
  }
};

Input.prototype.keyStart = function(event) {
  var key = this.map[event.keyCode];
  if (key && !this.keys[key]) {
    if (!this.lock('key-' + key)) {
      return false;
    }
    this.keys[key] = 'began';
    this.updateAxis(key);
    Engine.pub('onKeyBegan', key);
  }
};

Input.prototype.keyEnd = function(event) {
  var key = this.map[event.keyCode];
  if (key) {
    if (!this.lock('key-' + key)) {
      return false;
    }
    this.keys[key] = 'ended';
    this.updateAxis(key, true);
    Engine.pub('onKeyEnded', key);
  }
};

Input.prototype.startTouch = function(event) {
  if (!this.lock('touch')) {
    return false;
  }
  this.resolve(event);
  if (!this.touchState && !event.metaKey) {
    this.touchState = 'began';
    Engine.pub('onTouchBegan');
  }
};

Input.prototype.moveTouch = function(event) {
  var state = this.touchState;
  if ((state === 'began' || state === 'ended') && !this.lock('touch')) {
    return false;
  }
  this.resolve(event);
  if (state && state !== 'ended' && state !== 'moved') {
    this.touchState = 'moved';
  }
};

Input.prototype.endTouch = function(event) {
  if (!this.lock('touch')) {
    return false;
  }
  this.resolve(event);
  if (this.touchState && (!this.support.touch || !event.targetTouches.length)) {
    Engine.pub('onTouchEnded');
    this.touchState = 'ended';
  }
};

Input.prototype.updateAxis = function(key, ended) {
  var axis = this.axisMap[key];
  if (axis) {
    if (ended) {
      this.axis[axis[0]] -= axis[1];
    } else {
      this.axis[axis[0]] += axis[1];
    }
  }
};

Input.prototype.blur = function() {
  if (this.touchState && this.touchState !== 'ended') {
    this.touchState = 'ended';
  }
  var keys = this.keys;
  var names = this.keyNames;
  for (var i = 0, l = names.length; i < l; i++) {
    var key = names[i];
    if (keys[key] && keys[key] !== 'ended') {
      keys[key] = 'ended';
      this.updateAxis(key, true);
    }
  }
};

Input.prototype.calibrateOrientation = function() {
  this.baseOrientationTime = this.orientationTime;
  Vec2.copy(this.baseOrientation, this.orientation);
  Vec2.set(this.orientation);
};

Input.prototype.deviceOrientation = function(event) {
  Vec2.copy(this.prevOrientation, this.orientation);
  Vec2.sub(Vec2.set(this.orientation, event.gamma | 0, event.beta | 0), this.baseOrientation);
  this.orientationTime = event.timeStamp / 1000;
  if (!this.baseOrientationTime) {
    this.calibrateOrientation();
  }
};

Input.prototype.resolve = function(event) {
  var coords = this.support.touch ? event.targetTouches[0] : event;
  if (coords) {
    this.prevTime = this.time;
    this.time = event.timeStamp / 1000;
    Vec2.copy(this.prevPos, this.pos);
    var renderer = Engine.renderer;
    Vec2.set(this.pos, (coords.pageX - renderer.margin[0]) / renderer.scale | 0, (coords.pageY - renderer.margin[1]) / renderer.scale | 0);
  }
};

Input.prototype.lock = function(key) {
  if (this.locks[key] === this.frame) {
    return false;
  }
  this.locks[key] = this.frame;
  return true;
};

Input.prototype.postUpdate = function() {
  switch (this.touchState) {
    case 'began':
      this.touchState = 'stationary';
      break;
    case 'ended':
      this.touchState = null;
      break;
  }

  var keys = this.keys;
  var names = this.keyNames;
  for (var i = 0, l = names.length; i < l; i++) {
    var key = names[i];
    switch (keys[key]) {
      case 'began':
        keys[key] = 'pressed';
        break;
      case 'ended':
        keys[key] = null;
        break;
    }
  }

  this.frame = Engine.frame;

  var event = null;
  var queue = this.queue;
  while ((event = queue[0])) {
    var type = event.type;
    if (this[this.events[type] || type](event) === false) {
      break;
    }
    queue.shift();
  }
  if (!queue.length) {
    this.lastEvent = null;
  }
};

new Component('input', Input);

module.exports = Input;
