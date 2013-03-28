Component = require('./component')
Pool = require('./pool')
{Vec2} = require('./math')

cache = Vec2()
copyVel = Vec2()

class Kinetic extends Component

	tag: 'kinetic'

	@gravity: null # Vec2(0, 500)

	attributes:
		mass: 1
		drag: 0.999
		friction: 15
		fixed: false
		maxVelocity: 75
		maxForce: 2000
		force: Vec2()
		continuous: Vec2()
		velocity: Vec2()
		sleepVelocity: 0
		fast: false

	constructor: () ->
		@velocity = Vec2()
		@force = Vec2()
		@continuous = Vec2()

	instantiate: (attributes) ->
		{@mass, @drag, @friction, @fixed, @maxVelocity, @maxForce, @fast, @sleepVelocity} = attributes
		Vec2.copy(@velocity, attributes.velocity)
		Vec2.copy(@force, attributes.force)
		Vec2.copy(@continuous, attributes.continuous)
		@sleeping = false
		@

	applyImpulse: (impulse) ->
		Vec2.add(
			@force,
			if @mass isnt 1
				Vec2.scal(impulse, 1 / (@mass or 1), cache)
			else
				impulse
		)
		@

	applyForce: (force) ->
		Vec2.add(@continuous, force)
		@


Kinetic.simulate = (dt) ->
	epsilon = Math.epsilon

	for kinetic in @register when kinetic.enabled and not kinetic.fixed
		# Integrate
		velocity = kinetic.velocity
		force = Vec2.add(
			kinetic.force,
			kinetic.continuous
		)

		# Particle
		if kinetic.fast
			if kinetic.maxForce
				Vec2.limit(force, kinetic.maxForce)
			Vec2.add(velocity, Vec2.scal(force, dt))
			Vec2.set(force)
			if kinetic.maxVelocity
				Vec2.limit(velocity, kinetic.maxVelocity)
			Vec2.add(kinetic.transform.pos, Vec2.scal(velocity, dt, cache))
			continue

		# if not Vec2.valid(velocity) or not Vec2.valid(force)
		#	debugger

		# if not Vec2.validate(velocity) or not Vec2.validate(force)
		#	debugger

		# Apply scene gravity
		if (gravity = kinetic.root.gravity) and kinetic.mass > epsilon
			Vec2.add(
				force,
				if (kinetic.mass isnt 1)
					Vec2.scal(gravity, 1 / kinetic.mass, cache)
				else
					gravity
			)

		# if not kinetic.dirty and not Vec2.lenSq(force) and kinetic.sleeping
		#	# No force, no computation
		#	continue

		# Apply friction
		if kinetic.friction
			Vec2.add(
				force,
				Vec2.scal(
					Vec2.norm(velocity, cache),
					-kinetic.friction
				)
			)

		# http://www.richardlord.net/presentations/physics-for-flash-games
		#	https://github.com/soulwire/Coffee-Physics/tree/master/source/engine/integrator

		if kinetic.maxForce
			Vec2.limit(force, kinetic.maxForce)

		Vec2.copy(copyVel, velocity)
		Vec2.add(velocity, Vec2.scal(force, dt))
		if kinetic.maxVelocity
			Vec2.limit(velocity, kinetic.maxVelocity)
		Vec2.scal(Vec2.add(copyVel, velocity), dt / 2)
		Vec2.add(kinetic.transform.pos, copyVel)
		# kinetic.dirty = false

		Vec2.add(velocity, force)

		# Apply drag
		if kinetic.drag < 1
			Vec2.scal(velocity, kinetic.drag)

		# Check sleep
		if (sleepVelocity = kinetic.sleepVelocity)
			if Vec2.lenSq(velocity) <= sleepVelocity * sleepVelocity
				if not kinetic.sleeping
					Vec2.set(velocity)
					kinetic.sleeping = true
					kinetic.entity.pubUp('onKineticSleep', kinetic)
			else
				# kinetic.transform.dirty = true
				if kinetic.sleeping
					kinetic.sleeping = false
					kinetic.entity.pubUp('onKineticWake', kinetic)

		# Reset forces
		Vec2.set(force)
	@

new Pool(Kinetic)

module.exports = Kinetic
