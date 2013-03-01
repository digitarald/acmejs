Component = require('./component')
Pool = require('./pool')
Force = require('./force')
{Vec2} = require('./math')

cache = Vec2()
copyVel = Vec2()

class Kinetic extends Component

	type: 'kinetic'

	@gravity: null # Vec2(0, 500)

	@friction: 15

	@drag: 0.999

	presets:
		mass: 0
		drag: Kinetic.drag
		friction: Kinetic.friction
		fixed: false
		maxVel: 75
		maxAcc: 2000
		acc: Vec2()
		vel: Vec2()

	constructor: () ->
		@vel = Vec2()
		@acc = Vec2()
		@sleepVelSq = 0.2

	reset: (presets) ->
		{@mass, @drag, @friction, @fixed, @maxVel, @maxAcc} = presets
		Vec2.copy(@vel, presets.vel)
		Vec2.copy(@acc, presets.acc)
		@pos = @transform.pos
		@sleeping = false
		@

	applyImpulse: (acc) ->
		Vec2.add(
			@acc,
			Vec2.scal(acc, 1 / (@mass or 1), cache)
		)
		@

	applyForce: (acc) ->
		if not @force
			Force.alloc(@)
		@force.add(acc)
		@


Kinetic.simulate = (dt) ->
	epsilon = Math.epsilon

	for kinetic in @roster when kinetic.enabled and not kinetic.fixed
		# Integrate
		vel = kinetic.vel
		acc = kinetic.acc

		# if not Vec2.valid(vel) or not Vec2.valid(acc)
		#	debugger

		# if not Vec2.validate(vel) or not Vec2.validate(acc)
		#	debugger

		# Apply scene gravity
		if kinetic.root.gravity and kinetic.mass > epsilon
			Vec2.add(
				acc,
				Vec2.scal(kinetic.root.gravity, 1 / kinetic.mass, cache)
			)

		# if not kinetic.dirty and not Vec2.lenSq(acc) and kinetic.sleeping
		#	# No acc, no computation
		#	continue

		# Apply friction
		if kinetic.friction
			Vec2.add(
				acc,
				Vec2.scal(
					Vec2.norm(vel, cache),
					-kinetic.friction
				)
			)

		# http://www.richardlord.net/presentations/physics-for-flash-games
		#	https://github.com/soulwire/Coffee-Physics/tree/master/source/engine/integrator

		if kinetic.maxAcc
			Vec2.limit(acc, kinetic.maxAcc)

		Vec2.copy(copyVel, vel)
		Vec2.add(vel, Vec2.scal(acc, dt, cache))
		if kinetic.maxVel
			Vec2.limit(vel, kinetic.maxVel)
		Vec2.scal(Vec2.add(copyVel, vel), dt / 2)
		Vec2.add(kinetic.pos, copyVel)
		# kinetic.dirty = false

		Vec2.add(
			vel,
			Vec2.scal(acc, dt)
		)

		# Apply drag
		if kinetic.drag < 1
			Vec2.scal(vel, kinetic.drag)

		# Check sleep
		if kinetic.sleepVelSq
			if Vec2.lenSq(vel) <= kinetic.sleepVelSq
				if not kinetic.sleeping
					Vec2.set(vel)
					kinetic.sleeping = true
					kinetic.parent.pubUp('onKineticSleep', kinetic)
			else
				# kinetic.transform.dirty = true
				if kinetic.sleeping
					kinetic.sleeping = false
					kinetic.parent.pubUp('onKineticWake', kinetic)

		# Reset forces
		Vec2.set(acc)
	@

new Pool(Kinetic)

module.exports = Kinetic
