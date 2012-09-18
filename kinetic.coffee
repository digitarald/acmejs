
class Kinetic extends Component

	@maxVel = 500
	@maxAcc = 10000
	@sleep = 1
	@sleepSq = @sleep * @sleep

	name: 'kinetic'

	constructor: () ->
		super()
		@vel = Vec2()
		@acc = Vec2()

	alloc: (parent, @mass = 0) ->
		super(parent)
		Vec2.set(@vel)
		Vec2.set(@acc)
		@pos = parent.transform.pos

		@sleeping = true
		@fixed = false
		@massInv = if mass then 1 / mass else 0
		@maxVel = Kinetic.maxVel # + factor * 75
		@maxAcc = Kinetic.maxAcc # + factor * 2000
		@drag = @scene.drag
		@friction = @scene.friction
		@

Kinetic.simulate = (dt, scene) ->
	dtSq = dt * dt * 0.5
	copyVel = Vec2.cache[0]
	copyAcc = Vec2.cache[1]
	cache = Vec2.cache[2]

	for kinetic in @roster when kinetic.enabled and not kinetic.fixed
		# Integrate
		vel = kinetic.vel
		acc = kinetic.acc

		# Apply scene gravity
		if scene.gravity and kinetic.mass > 0.01
			Vec2.add(
				acc,
				Vec2.scal(scene.gravity, kinetic.massInv, cache)
			)

		# Apply friction
		if not kinetic.sleeping
			if kinetic.friction
				Vec2.add(
					acc,
					Vec2.scal(
						Vec2.norm(vel, cache),
						-kinetic.friction
					)
				)

		# Scale forces to mass.
		# Vec2.scal(acc, kinetic.massInv)

		Vec2.add(
			kinetic.pos,
			Vec2.add(
				Vec2.scal(vel, dt, copyVel), # Preserve momentum
				Vec2.scal(acc, dtSq, copyAcc)
			)
		)

		Vec2.add(
			vel,
			Vec2.scal(acc, dt)
		)

		# Vec2.add(
		#	vel,
		#	Vec2.scal(
		#		Vec2.limit(acc, kinetic.maxAcc),
		#		dt,
		#		cache
		#	)
		# )

		# Gentle max velocity
		# currentVel = Vec2.len(vel)
		# factor = 1 / currentVel / kinetic.maxVel
		# if factor < 0.99
		#	Vec2.scal(
		#		vel,
		#		factor + (1 - factor) * 2
		#	)

		# Add velocity to position
		# Vec2.add(
		#	kinetic.pos,
		#	Vec2.scal(
		#		Vec2.add(copyVel, vel),
		#		0.5 * dt
		#	)
		# )


		# Apply drag
		if kinetic.drag < 1
			Vec2.scal(vel, kinetic.drag)

		# Euler
		# Vec2.add(
		#	kinetic.pos,
		#	Vec2.scal(
		#		Vec2.limit(vel, kinetic.maxVel),
		#		dt,
		#		cache
		#	)
		# )

		# Improved Verlet
		# p1 = position;
		# v1 = velocity;
		# a1 = acceleration( p1, v1);
		# p2 = p1 + v1 * time;
		# v2 = v1 + a1 * time;
		# a2 = acceleration( p2, v2);
		# position += (v1 + v2) * time / 2;
		# velocity += (a1 + a2) * time / 2;

		# console.log(Vec2.len(vel), Vec2.len(cache))
		# debugger

		kinetic.sleeping = Vec2.lenSq(vel) < Kinetic.sleep

		# Vec2.copy(kinetic.angle, acc)

		# Reset forces
		Vec2.set(acc)
	@

new Pool(Kinetic)