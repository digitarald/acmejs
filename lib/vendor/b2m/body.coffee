
Component = require('./../../core/component')
Pool = require('./../../core/pool')
{Vec2} = require('./../../core/math')
B2 = require('./b2')

vec2Cache = new B2.Vec2(0, 0)

class Body extends Component

	tag: 'b2Body'

	attributes:
		fixed: false
		vel: Vec2()
		allowSleep: true
		angularVelocity: 0
		bullet: false
		fixedRotation: false
		density: 1
		friction: 0.5
		restitution: 0.2

	@definitionPresets: ['allowSleep', 'angularVelocity', 'awake', 'bullet', 'fixedRotation']

	@fixturePresets: ['density', 'friction', 'restitution']

	constructor: ->
		@definition = new B2.BodyDef()
		@fixture = new B2.FixtureDef()

	instantiate: (attributes) ->
		if not (world = @root.b2World)
			gravity = new B2.Vec2(@root.gravity[0], @root.gravity[1])
			world = new B2.World(gravity)
			# world.SetContactListener(Body.listener)
			@root.b2World = world
			Body.b2World = world

		{definition, fixture} = @

		for key in Body.definitionPresets
			definition['set_' + key](attributes[key])

		@fixed = fixed = attributes.fixed
		definition.set_type(if fixed then B2.staticBody else B2.dynamicBody)

		@b2body = body = world.CreateBody(definition)
		body.SetUserData(@uid)

		for key in Body.fixturePresets
			fixture['set_' + key](attributes[key])

		bounds = @bounds
		switch bounds.shape
			when 'poly'
				shape = new B2.PolygonShape()
				shape.SetAsArray(bounds.points, bounds.points.length)
				break
			when 'rect'
				shape = new B2.PolygonShape()
				shape.SetAsBox(bounds.size[0] / 2, bounds.size[1] / 2)
				break
			else
				shape = new B2.CircleShape()
				shape.set_m_radius(bounds.radius)
				break
		fixture.set_shape(shape)

		body.CreateFixture(fixture)

		vec2Cache.Set(@transform.pos[0], @transform.pos[1])
		body.SetTransform(vec2Cache, @transform.angle)

		vec2Cache.Set(attributes.vel[0], attributes.vel[1])
		body.SetLinearVelocity(vec2Cache)

		body.SetActive(1)
		@

	onTransform: (pos, angle) ->
		vec2Cache.Set(pos[0], pos[1])
		@b2body.SetTransform(vec2Cache, angle)
		@

	onEnable: ->
		@b2body.SetActive(true)
		@

	onDisable: ->
		@b2body.SetActive(false)
		@

	free: ->
		Body.b2World.DestroyBody(@b2body)
		@b2body = null
		super()

	applyForce: (acc) ->
		vec2Cache.Set(acc[0], acc[1])
		# @b2body.ApplyForceToCenter(vec2Cache)
		@b2body.ApplyLinearImpulse(vec2Cache, @b2body.GetWorldCenter())
		@

Body.listener = listener = new B2.ContactListener()

B2.customizeVTable(listener, [
	original: B2.ContactListener.prototype.PostSolve,
	replacement: (contactPtr, impulsePtr) ->
			contact = B2.wrapPointer(contactPtr, B2.Contact)
			console.log(contact.GetFixtureA().GetBody())
			bodyA = contact.GetFixtureA().GetBody().userData
			bodyB = contact.GetFixtureB().GetBody().userData

			# impulse = B2.wrapPointer(impulsePtr, B2.Contact)
			# Vec2.copy(impulseCache, impulse.tangentImpulses)

			# contact.GetWorldManifold(manifoldCache)
			# Vec2.fromObj(manifoldCache.m_points[0], pointCache)

			bodyA.entity.pub('onCollide', bodyB.entity)
			bodyB.entity.pub('onCollide', bodyA.entity)
			null
])

# manifoldCache = new B2.WorldManifold()
# impulseCache = Vec2()
# pointCache = Vec2()
# Body.PostSolve = (contact, impulse) ->


# empty = (contact) -> null
# Body.BeginContact = empty
# Body.EndContact = empty
# Body.PreSolve = empty

Body.fixedUpdate = (dt) ->
	Body.b2World.Step(dt * 2, 3, 3)

	for body in @register when body.enabled and not body.fixed
		b2body = body.b2body
		if b2body.IsAwake()
			pos = b2body.GetPosition()
			Vec2.set(body.transform.pos, pos.get_x(), pos.get_y())
			body.transform.angle = b2body.GetAngle()
	@

new Pool(Body)

module.exports = Body