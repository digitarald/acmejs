import Component from '../../core/component'
import Context from '../../core/context'
import Vec2 from '../../math/vec2'

export class Box2dBody extends Component {
	constructor() {
		Component.call(this);
		this.definition = new b2BodyDef();
		this.fixture = new b2FixtureDef();
		this.body = null;
		this.world = null;
	}

	create() {
		let $body = this.components.body;
		this.world = Context.$b2System.world;

		let definition = this.definition;
		let fixture = this.fixture;

		let definitions = definitionPresets;
		for (let i = 0, l = definitions.length; i < l; i++) {
			let key = definitions[i];
			definition['set_' + key]($body[key]);
		}

		let fixed = $body.fixed;
		definition.set_type(fixed ? b2_staticBody : b2_dynamicBody);
		let body = world.CreateBody(definition);
		body.SetUserData(this.uid);

		for (i = 0, l = fixturePresets.length; i < l; i++) {
			let key = fixturePresets[i];
			fixture['set_' + key]($body[key]);
		}

		let bounds = this.components.bounds;
		let shape = null;
		switch (bounds.shape) {
			case 'poly':
				shape = new b2PolygonShape();
				shape.SetAsArray(bounds.points, bounds.points.length);
				break;
			case 'rect':
				shape = new b2PolygonShape();
				shape.SetAsBox(bounds.size[0] / 2, bounds.size[1] / 2);
				break;
			default:
				shape = new b2CircleShape();
				shape.set_m_radius(bounds.radius);
				break;
		}
		fixture.set_shape(shape);
		body.CreateFixture(fixture);

		box2dCache.Set(this.transform.position[0], this.transform.position[1]);
		body.SetTransform(box2dCache, this.transform.angle);

		box2dCache.Set($body.velocity[0], $body.velocity[1]);
		body.SetLinearVelocity(box2dCache);

		body.SetActive(1);
		this.body = body;
	}

	free() {
		this.world.DestroyBody(this.body);
	}
}

Component.create(Box2dBody, 'box2dBody');

export class Box2dSystem extends Component {
	constructor() {
		this._gravity = Vec2();
	}

	get attributes() {
		return {
			gravity: Vec2()
		};
	}

	create() {
		let gravity = new b2Vec2(this._gravity[0], this._gravity[1]);
		this.world = new b2World(gravity);
	}

	onBodyCreate(event) {
		event.entity.createComponent('box2dBody');
	}

	onBodyDestroy(event) {
		event.entity.$box2dBody.destroy();
	}

	applyContinuesForce(impulse) {
		box2dCache.Set(impulse[0], impulse[1]);
		this.body.ApplyLinearImpulse(box2dCache, this.body.GetWorldCenter());
	}

	fixedUpdate() {
		Body.b2World.Step(dt * 2, 3, 3);
		let box2dBodies = Registry.types.b2Body.instances;
		for (let i = 0, l = b2Bodies.length; i < l; i++) {
			let box2dBody = box2dBodies[i];
			let body = box2dBody.components.body;
			if (!body.enabled || body.fixed) {
				continue;
			}
			if (b2body.IsAwake()) {
				let pos = b2body.GetPosition();
				let transform = body.components.transform;
				Vec2.set(vec2Cache, pos.get_x(), pos.get_y());
				transform.translateTo(vec2Cache);
				if (!body.fixedRotation) {
					transform.rotateTo(b2body.GetAngle());
				}
			}
		}
	}
};

Color.defineProperty(Box2dSystem, 'gravity');

Component.create(Box2dSystem, 'box2dSystem');

let box2dCache = new b2Vec2(0, 0);
let vec2Cache = Vec2();

let definitionPresets = ['allowSleep', 'angularVelocity', 'awake', 'bullet', 'fixedRotation'];
let fixturePresets = ['density', 'friction', 'restitution'];

/*
let listener = Body.listener = new b2ContactListener();

b2customizeVTable(listener, [
	{
		original: b2ContactListener.prototype.PostSolve,
		replacement: function(contactPtr, impulsePtr) {
			let bodyA, bodyB, contact;
			contact = b2wrapPointer(contactPtr, b2Contact);
			console.log(contact.GetFixtureA().GetBody());
			bodyA = contact.GetFixtureA().GetBody().userData;
			bodyB = contact.GetFixtureB().GetBody().userData;
			bodyA.entity.emit('onCollide', bodyB.entity);
			bodyB.entity.emit('onCollide', bodyA.entity);
			return null;
		}
	}
]);

new Registry(Body);

module.exports = Body;
*/
