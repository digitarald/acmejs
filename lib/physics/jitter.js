
import Component from '../core/component';
import Vec2 from '../math/vec2';
import {chance} from '../math/random';

let force = Vec2();

class Jitter extends Component {
  constructor() {
  	Component.call(this);
	  this.factor = 0.0;
	  this.force = 0.0;
  }

  get attributes() {
  	return {
		  factor: 0.1,
		  force: 250
		};
  }

  fixedUpdate(dt) {
	  if (chance(this.factor)) {
	    Vec2.variant(Vec2.zero, this.force, force);
	    this.components.body.applyForce(force);
	  }
	}
}

Component.create(Jitter, 'jitter');
