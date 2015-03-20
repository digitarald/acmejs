import Component from './component';
import Vec2 from '../math/vec2';
import Context from './context';
import Event from './event';

class onKeyBegan extends Event {
	constructor() {
		Event.call(this, true, true);
		this.key = '';
	}
}
Event.register(onKeyBegan, 'keyBegan');

class onKeyEnded extends Event {
	constructor() {
		Event.call(this, true, true);
		this.key = '';
	}
}
Event.register(onKeyEnded, 'keyEnded');

class onTouchBegan extends Event {
	constructor() {
		Event.call(this, true, true);
		this.index = 0;
	}
}
Event.register(onTouchBegan, 'touchBegan');

class onTouchEnded extends Event {
	constructor() {
		Event.call(this, true, true);
		this.index = 0;
	}
}
Event.register(onTouchEnded, 'touchEnded');

/**
 * @class Input
 * Input handling for mouse, touch, keyboard and hardware sensors
 *
 * @extends Component
 */
class Input extends Component {
	constructor() {
		Component.call(this);
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

		let map = this.map;
		for (let code in map) {
			let key = map[code];
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

		this.events = SUPPORT.touch ? {
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

	attach() {
		if (this.attached) {
			return;
		}
		if (typeof window == 'undefined') {
			return;
		}
		this.attached = true;
		for (let type in this.events) {
			window.addEventListener(type, this, false);
		}
		this.queue.length = 0;
	}

	detach() {
		if (!this.attached) {
			return;
		}
		this.attached = false;
		for (let type in this.events) {
			window.removeEventListener(type, this, false);
		}
	}

	handleEvent(event) {
		if (event.metaKey) {
			return;
		}
		// event.preventDefault();
		let type = event.type;
		if (this.throttled[type] && this.lastEvent == type) {
			this.queue[this.queue.length - 1] = event;
			return;
		}
		this.lastEvent = type;
		this.queue.push(event);
	}

	keyStart(keyEvent) {
		let key = this.map[keyEvent.keyCode];
		if (key && !this.keys[key]) {
			if (!this.lock('key-' + key)) {
				return false;
			}
			let event = Event.create('keyBegan');
			event.key = key;
			this.emit(event);
			this.keys[key] = 'began';
			this.updateAxis(key);
		}
	}

	keyEnd(keyEvent) {
		let key = this.map[keyEvent.keyCode];
		if (key) {
			if (!this.lock('key-' + key)) {
				return false;
			}
			let event = Event.create('keyEnded');
			event.key = key;
			this.emit(event);
			this.keys[key] = 'ended';
			this.updateAxis(key, true);
		}
	}

	startTouch(touchEvent) {
		if (!this.lock('touch')) {
			return false;
		}
		this.resolve(touchEvent);
		if (!this.touchState && !touchEvent.metaKey) {
			this.touchState = 'began';
			let event = Event.create('touchBegan');
			this.emit(event);
		}
	}

	moveTouch(touchEvent) {
		let state = this.touchState;
		if ((state === 'began' || state === 'ended') && !this.lock('touch')) {
			return false;
		}
		this.resolve(touchEvent);
		if (state && state !== 'ended' && state !== 'moved') {
			this.touchState = 'moved';
		}
	}

	endTouch(touchEvent) {
		if (!this.lock('touch')) {
			return false;
		}
		this.resolve(touchEvent);
		if (this.touchState && (!SUPPORT.touch || !touchEvent.targetTouches.length)) {
			this.touchState = 'ended';
			let event = Event.create('touchEnded');
			this.emit(event)
		}
	}

	updateAxis(key, ended) {
		let axis = this.axisMap[key];
		if (axis) {
			if (ended) {
				this.axis[axis[0]] -= axis[1];
			} else {
				this.axis[axis[0]] += axis[1];
			}
		}
	}

	blur() {
		if (this.touchState && this.touchState !== 'ended') {
			this.touchState = 'ended';
		}
		let keys = this.keys;
		let names = this.keyNames;
		for (let i = 0, l = names.length; i < l; i++) {
			let key = names[i];
			if (keys[key] && keys[key] !== 'ended') {
				keys[key] = 'ended';
				this.updateAxis(key, true);
			}
		}
	}

	calibrateOrientation() {
		this.baseOrientationTime = this.orientationTime;
		Vec2.copy(this.baseOrientation, this.orientation);
		Vec2.set(this.orientation);
	}

	deviceOrientation(event) {
		Vec2.copy(this.lastOrientation, this.orientation);
		Vec2.sub(Vec2.set(this.orientation, event.gamma | 0, event.beta | 0), this.baseOrientation);
		this.orientationTime = event.timeStamp / 1000;
		if (!this.baseOrientationTime) {
			this.calibrateOrientation();
		}
	}

	resolve(event) {
		let coords = SUPPORT.touch ? event.targetTouches[0] : event;
		if (coords) {
			this.lastTime = this.time;
			this.time = event.timeStamp / 1000;
			Vec2.copy(this.lastPos, this.position);
			let renderer = Context.renderer;
			Vec2.set(this.position, (coords.pageX - renderer.margin[0]) / renderer.scale | 0, (coords.pageY - renderer.margin[1]) / renderer.scale | 0);
			return true;
		}
		return false;
	}

	lock(key) {
		if (this.locks[key] === this.frame) {
			return false;
		}
		this.locks[key] = this.frame;
		return true;
	}

	postUpdate() {
		switch (this.touchState) {
			case 'began':
				this.touchState = 'stationary';
				break;
			case 'ended':
				this.touchState = '';
				break;
		}

		let keys = this.keys;
		let names = this.keyNames;
		for (let i = 0, l = names.length; i < l; i++) {
			let key = names[i];
			switch (keys[key]) {
				case 'began':
					keys[key] = 'pressed';
					break;
				case 'ended':
					keys[key] = null;
					break;
			}
		}

		this.frame = Context.frame;

		let event = null;
		let queue = this.queue;
		while ((event = queue[0])) {
			let type = event.type;
			if (this[this.events[type] || type](event) != null) {
				break;
			}
			queue.shift();
		}
		if (!queue.length) {
			this.lastEvent = '';
		}
	}

	onContextPause() {
		this.detach();
	}

	onContextStart() {
		this.attach();
	}
};

const SUPPORT = {};
if (typeof window != 'undefined') {
	SUPPORT.touch = 'ontouchstart' in window;
	SUPPORT.orientation = 'ondeviceorientation' in window;
}

Component.create(Input, 'input');
