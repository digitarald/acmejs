
Component = require('./../../core/component')
Pool = require('./../../core/pool')
{Vec2} = require('./../../core/math')
cp = require('./cp')

V = cp.v

class Shape extends Component

	tag: 'cpShape'

	attributes:
		fixed: false
		velocity: Vec2()
		allowSleep: true
		angle: 0
		angularVelocity: 0
		awake: true
		bullet: false
		fixedRotation: false
		density: 1
		friction: 0.5
		restitution: 0.5

	instantiate: (attributes) ->
		if not (space = @root.cpSpace)
			space = new cp.Space()
			@root.cpSpace = space
			Shape.cpSpace = space

		mass = 1
		bounds = @bounds
		switch bounds.shape
			when 'circle'
				body = new cp.Body(mass, cp.momentForCircle(mass, 0, bounds.radius, V(0, 0)))
				shape = space.addShape(new cp.CircleShape(body, bounds.radius, V(0, 0)))
				break
			when 'poly'
				fixture.shape = new B2.PolygonShape(bounds.radius)
				fixture.shape.SetAsArray(bounds.points, bounds.points.length)
				break
			when 'rect'
				fixture.shape = new B2.PolygonShape()
				fixture.shape.SetAsBox(bounds.size[0] / 2, bounds.size[1] / 2)
				break

		shape.setElasticity(attributes);
		shape.setFriction(0.7);

		Vec2.toObj(@transform.pos, new cp.Vect)
		Vec2.toObj(attributes.velocity, new cp.Vect)
		@fixed = fixed = attributes.fixed
		definition.type = if fixed then B2.Shape.cp_staticShape else B2.Shape.cp_dynamicShape

		@cpshape = space.CreateShape(definition)

		for key in Shape.fixturePresets
			fixture[key] = attributes[key]


		@cpshape.CreateFixture(fixture)
		@

	onTransform: ->
		@cpshape.setPos(Vec2.toObj(@transform.pos, @cpshape.p))
		@cpshape.setAngle(@transform.angle)
		@

	# onEnable: ->
	#	@cpshape.SetActive(true)
	#	@

	# onDisable: ->
	#	@cpshape.SetActive(false)
	#	@

	free: ->
		Shape.cpSpace.removeShape(@cpshape)
		@cpshape = null
		super()

	applyForce: (impulse) ->
		# @cpshape.ApplyImpulse(Vec2.toObj(impulse), @cpshape.GetWorldCenter())
		@

# manifoldCache = new B2.WorldManifold()
# impulseCache = Vec2()
# pointCache = Vec2()
# Shape.PostSolve = (contact, impulse) ->
#	shapeA = contact.GetFixtureA().GetShape().GetUserData()
#	shapeB = contact.GetFixtureB().GetShape().GetUserData()
#	Vec2.copy(impulseCache, impulse.tangentImpulses)

#	contact.GetWorldManifold(manifoldCache)
#	Vec2.fromObj(manifoldCache.m_points[0], pointCache)

#	shapeA.entity.pub('onCollide', shapeB.entity, impulseCache)
#	shapeB.entity.pub('onCollide', shapeA.entity, impulseCache)
#	null
#
# empty = (contact) -> null
# Shape.BeginContact = empty
# Shape.EndContact = empty
# Shape.PreSolve = empty

Shape.fixedUpdate = (dt) ->
	Shape.cpSpace(dt)

	for shape in @register when shape.enabled and not shape.fixed
		cpshape = shape.cpshape
		if cpshape.IsAwake()
			Vec2.fromObj(cpshape.GetPosition(), shape.transform.pos)
			shape.transform.angle = cpshape.GetAngle()
	@

new Pool(Shape)

module.exports = Shape