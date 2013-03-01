
Component = require('./../../core/component')
Pool = require('./../../core/pool')
{Vec2} = require('./../../core/math')
B2 = require('./b2')

class Body extends Component

	type: 'b2Body'

	presets:
		fixed: false
		vel: Vec2()
		allowSleep: true
		angularVelocity: 0
		awake: true
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

	reset: (presets) ->
		if not (world = @root.b2World)
			gravity = new B2.Vec2(@root.gravity[0], @root.gravity[1])
			world = new B2.World(gravity)
			# world.SetContactListener(Body)
			@root.b2World = world
			Body.b2World = world

		{definition, fixture} = @

		for key in Body.definitionPresets
			definition[key] = presets[key]

		definition.userData = @
		Vec2.toObj(@transform.pos, definition.position)
		definition.angle = @transform.angle
		Vec2.toObj(presets.vel, definition.linearVelocity)
		@fixed = fixed = presets.fixed
		definition.type = if fixed then B2.Body.b2_staticBody else B2.Body.b2_dynamicBody

		@b2body = world.CreateBody(definition)

		for key in Body.fixturePresets
			fixture[key] = presets[key]

		bounds = @bounds
		switch bounds.shape
			when 'circle'
				fixture.shape = new B2.CircleShape(bounds.radius)
				break
			when 'poly'
				fixture.shape = new B2.PolygonShape(bounds.radius)
				fixture.shape.SetAsArray(bounds.points, bounds.points.length)
				break
			when 'rect'
				fixture.shape = new B2.PolygonShape()
				fixture.shape.SetAsBox(bounds.size[0] / 2, bounds.size[1] / 2)
				break

		@b2body.CreateFixture(fixture)
		@

	onTransform: ->
		@b2body.SetPositionAndAngle(Vec2.toObj(@transform.pos), @transform.angle)
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
		@b2body.ApplyImpulse(Vec2.toObj(acc), @b2body.GetWorldCenter())
		@

manifoldCache = new B2.WorldManifold()
impulseCache = Vec2()
pointCache = Vec2()
Body.PostSolve = (contact, impulse) ->
	bodyA = contact.GetFixtureA().GetBody().GetUserData()
	bodyB = contact.GetFixtureB().GetBody().GetUserData()
	Vec2.copy(impulseCache, impulse.tangentImpulses)

	contact.GetWorldManifold(manifoldCache)
	Vec2.fromObj(manifoldCache.m_points[0], pointCache)

	bodyA.parent.pub('onCollide', bodyB.parent, impulseCache)
	bodyB.parent.pub('onCollide', bodyA.parent, impulseCache)
	null

empty = (contact) -> null
Body.BeginContact = empty
Body.EndContact = empty
Body.PreSolve = empty

Body.fixedUpdate = (dt) ->
	Body.b2World.Step(dt * 2, 4, 2)

	for body in @roster when body.enabled and not body.fixed
		b2body = body.b2body
		if b2body.IsAwake()
			Vec2.fromObj(b2body.GetPosition(), body.transform.pos)
			body.transform.angle = b2body.GetAngle()
	@

new Pool(Body)

module.exports = Body