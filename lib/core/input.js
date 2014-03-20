'use strict';

var Component = require('./component');
var Pool = require('./pool');
var Vec2 = require('./math').Vec2;
var Engine = require('./engine');

/**
 * @class Input
 * Input handling for mouse, touch, keyboard and hardware sensors
 *
 * @extends Component
 */
function Input() {
  this.queue = [];
  this.locks = {};
  this.position = Vec2();
  this.lastPos = Vec2();
  this.touchState = '';
  this.axis = Vec2();
  this.mouseAxis = Vec2();
  this.orientation = Vec2();
  this.lastOrientation = Vec2();
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

  this.lastEvent = '';
  this.attached = false;

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
}

Input.prototype = {

  attach: function() {
    if (this.attached) {
      return;
    }
    this.attached = true;
    for (var type in this.events) {
      window.addEventListener(type, this, false);
    }
    this.queue.length = 0;
  },

  detach: function() {
    if (!this.attached) {
      return;
    }
    this.attached = false;
    for (var type in this.events) {
      window.removeEventListener(type, this, false);
    }
  },

  support: {
    touch: 'ontouchstart' in window,
    orientation: 'ondeviceorientation' in window
  },

  handleEvent: function(event) {
    if (event.metaKey) {
      return;
    }
    // event.preventDefault();
    var type = event.type;
    if (this.throttled[type] && this.lastEvent == type) {
      this.queue[this.queue.length - 1] = event;
      return;
    }
    this.lastEvent = type;
    this.queue.push(event);
  },

  keyStart: function(event) {
    var key = this.map[event.keyCode];
    if (key && !this.keys[key]) {
      if (!this.lock('key-' + key)) {
        return false;
      }
      this.keys[key] = 'began';
      this.updateAxis(key);
      Engine.trigger('onKeyBegan', key);
    }
  },

  keyEnd: function(event) {
    var key = this.map[event.keyCode];
    if (key) {
      if (!this.lock('key-' + key)) {
        return false;
      }
      this.keys[key] = 'ended';
      this.updateAxis(key, true);
      Engine.trigger('onKeyEnded', key);
    }
  },

  startTouch: function(event) {
    if (!this.lock('touch')) {
      return false;
    }
    this.resolve(event);
    if (!this.touchState && !event.metaKey) {
      this.touchState = 'began';
      Engine.trigger('onTouchBegan');
    }
  },

  moveTouch: function(event) {
    var state = this.touchState;
    if ((state === 'began' || state === 'ended') && !this.lock('touch')) {
      return false;
    }
    this.resolve(event);
    if (state && state !== 'ended' && state !== 'moved') {
      this.touchState = 'moved';
    }
  },

  endTouch: function(event) {
    if (!this.lock('touch')) {
      return false;
    }
    this.resolve(event);
    if (this.touchState && (!this.support.touch || !event.targetTouches.length)) {
      Engine.trigger('onTouchEnded');
      this.touchState = 'ended';
    }
  },

  updateAxis: function(key, ended) {
    var axis = this.axisMap[key];
    if (axis) {
      if (ended) {
        this.axis[axis[0]] -= axis[1];
      } else {
        this.axis[axis[0]] += axis[1];
      }
    }
  },

  blur: function() {
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
  },

  calibrateOrientation: function() {
    this.baseOrientationTime = this.orientationTime;
    Vec2.copy(this.baseOrientation, this.orientation);
    Vec2.set(this.orientation);
  },

  deviceOrientation: function(event) {
    Vec2.copy(this.lastOrientation, this.orientation);
    Vec2.sub(Vec2.set(this.orientation, event.gamma | 0, event.beta | 0), this.baseOrientation);
    this.orientationTime = event.timeStamp / 1000;
    if (!this.baseOrientationTime) {
      this.calibrateOrientation();
    }
  },

  resolve: function(event) {
    var coords = this.support.touch ? event.targetTouches[0] : event;
    if (coords) {
      this.lastTime = this.time;
      this.time = event.timeStamp / 1000;
      Vec2.copy(this.lastPos, this.position);
      var renderer = Engine.renderer;
      Vec2.set(this.position, (coords.pageX - renderer.margin[0]) / renderer.scale | 0, (coords.pageY - renderer.margin[1]) / renderer.scale | 0);
    }
  },

  lock: function(key) {
    if (this.locks[key] === this.frame) {
      return false;
    }
    this.locks[key] = this.frame;
    return true;
  },

  postUpdate: function() {
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
      if (this[this.events[type] || type](event) != null) {
        break;
      }
      queue.shift();
    }
    if (!queue.length) {
      this.lastEvent = '';
    }
  },

  onEnginePause: function() {
    this.detach();
  },

  onEngineStart: function() {
    this.attach();
  }

};

new Component('input', Input);

module.exports = Input;
