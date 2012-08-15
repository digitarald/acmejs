
class Particle

	constructor: () ->
		@pos = Vec2()
		@vel = Vec2()
		@acc = Vec2()
		@angle = Vec2()

	alloc: (pos, dir, @lifetime = 1000, @radius = 1, @mass = @radius) ->
		Vec2.copy(@pos, pos)
		Vec2.copy(@vel, dir)
		Vec2.set(@acc)
		# Color.copy(@color, @colorStart)
		@massInv = 1 / @mass
		@age = 0
		@maxVel = 120

		Pubsub.pool.alloc(@)
		@

	free: ->
		@allocd = false
		@pubsub.pub('free', @)
		@pubsub.free()
		@


class Pool.Particles extends Pool

	instantiate: ->
		return new Particle()

	update: (dt, engine) ->
		oldVel = Vec2.cache[0]
		cache = Vec2.cache[1]

		for particle in @roster when particle.allocd

			age = (particle.age += dt)

			if age > particle.lifetime
				particle.free()
				continue

			# Using alpha = more CPU
			# particle.color[3] = 1 - Math.quadIn(age / particle.lifetime)

			# Integrate

			vel = particle.vel
			acc = Vec2.add(
				particle.acc,
				# Scale gravity force to mass.
				Vec2.scal(engine.gravity, particle.massInv, cache)
			)
			# Duplicate velocity to preserve momentum.
			oldVel = Vec2.copy(oldVel, vel)

			# Apply friction
			if engine.friction
				Vec2.add(
					acc,
					Vec2.scal(
						Vec2.norm(Vec2.inv(vel, cache)),
						engine.friction
					)
				)

			# Apply drag
			if engine.drag < 1
				Vec2.scal(vel, engine.drag)

			Vec2.limit(
				Vec2.add(
					vel,
					Vec2.scal(acc, dt / 1000, cache)
				),
				# Constrain
				particle.maxVel
			)

			# Add velocity to position
			Vec2.add(
				particle.pos,
				Vec2.scal(Vec2.add(oldVel, particle.vel), 0.5 * dt / 1000)
			)

			Vec2.copy(particle.angle, acc)

			# Reset forces
			Vec2.set(acc, 0, 0)

			# Euler
			# Vec2.add(
			# 	particle.pos,
			# 	Vec2.scal(particle.vel, dt / 1000, oldVel)
			# )
		@

	draw: (context) ->
		TAU = Math.TAU

		context.save()
		context.globalCompositeOperation = 'xor'

		for particle in @roster when particle.allocd
			context.fillStyle = Color.rgba(particle.color)

			context.beginPath()
			context.arc(particle.pos[0] | 0, particle.pos[1] | 0, particle.radius | 0, 0, TAU, true)
			context.closePath()
			context.fill()

		context.restore()
		@

Particle.pool = new Pool.Particles(128)
