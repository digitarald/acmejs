Component = require('./component')
Pool = require('./pool')
{Vec2} = require('./math')

addForce = Vec2()

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
		@sleepVelSq = 1

	reset: (presets) ->
		{@mass, @drag, @friction, @fixed, @maxVel, @maxAcc} = presets
		Vec2.copy(@vel, presets.vel)
		Vec2.copy(@acc, presets.acc)
		@pos = @transform.pos
		@sleeping = false
		@

	applyForce: (acc, ignoreMass, constant) ->
		if not ignoreMass and @mass
			Vec2.scal(acc, 1 / @mass, addForce)
		else
			Vec2.copy(addForce, acc)
		if constant and not @force
			Force.alloc(@)
		Vec2.add((if constant then @force.force else @acc), addForce)
		@


Kinetic.simulate = (dt, scene) ->
	copyVel = Vec2.cache[0]
	cache = Vec2.cache[1]
	epsilon = Math.epsilon

	for kinetic in @roster when kinetic.enabled and not kinetic.fixed
		# Integrate
		vel = kinetic.vel
		acc = kinetic.acc

		# if not Vec2.validate(vel) or not Vec2.validate(acc)
		#	debugger

		# Apply scene gravity
		if scene.gravity and kinetic.mass > epsilon
			Vec2.add(
				acc,
				Vec2.scal(scene.gravity, 1 / kinetic.mass, cache)
			)

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

		if Vec2.lenSq(copyVel) > kinetic.sleepVelSq
			Vec2.add(kinetic.pos, copyVel)
			kinetic.transform.dirty = true

		Vec2.add(
			vel,
			Vec2.scal(acc, dt)
		)

		# Apply drag
		if kinetic.drag < 1
			Vec2.scal(vel, kinetic.drag)

		# Check sleep
		if kinetic.sleepVelSq
			if Vec2.lenSq(vel) < kinetic.sleepVelSq
				if not kinetic.sleeping
					Vec2.set(vel)
					kinetic.sleeping = true
					kinetic.parent.pubUp('onKineticSleep', kinetic)
			else
				if kinetic.sleeping
					kinetic.sleeping = false
					kinetic.parent.pubUp('onKineticWake', kinetic)

		# Reset forces
		Vec2.set(acc)
	@

new Pool(Kinetic)

module.exports = Kinetic
