
class Particle

	constructor: () ->
		@pos = Vec2()
		@vel = Vec2()
		@acc = Vec2()
		@colorStart = Color()
		@color = Color()

		@friction = 20
		@drag = 0 # 0.999

	acquire: (posX, posY, dirX, dirY, @lifetime = 1000) ->
		@acquired = true
		Vec2.set(@pos, posX, posY)
		Vec2.set(@vel, dirX, dirY)
		Vec2.set(@acc)
		Color.copy(@color, @colorStart)

		@radius = @mass = Math.randomFloat(3, 12) | 0
		@massInv = 1 / @mass
		@age = 0

		Pubsub.pool.acquire(@)
		Collider.pool.acquire(@)
		# Boid.pool.acquire(@)
		@

	release: ->
		@acquired = false
		@pubsub.pub('release', @).release()
		@


class ParticlePool extends Pool

	update: (delta) ->
		oldVel = Vec2.cache[0]
		cache = Vec2.cache[1]

		for particle in @entities when particle.acquired

			age = (particle.age += delta)

			if age > particle.lifetime
				particle.release()
				continue

			particle.color[3] = 1 - Math.quadIn(age / particle.lifetime)

			# Integrate

			# Improved Euler
			# p1 = position;
			# v1 = velocity;
			# a1 = acceleration( p1, v1);
			# p2 = p1 + v1 * time;
			# v2 = v1 + a1 * time;
			# a2 = acceleration( p2, v2);
			# position += (v1 + v2) * time / 2;
			# velocity += (a1 + a2) * time / 2;

			vel = particle.vel
			acc = Vec2.set(particle.acc, 0, 980) # Gravity
			# Duplicate velocity to preserve momentum.
			oldVel = Vec2.copy(oldVel, vel)

			# Scale force to mass.
			Vec2.scal(acc, particle.massInv)

			# Apply friction
			if particle.friction
				Vec2.add(
					acc,
					Vec2.scal(
						Vec2.norm(Vec2.inv(vel, cache)),
						particle.friction
					)
				)

			# Apply drag
			if particle.drag
				Vec2.scal(vel, particle.drag)

			Vec2.add(
				particle.vel,
				Vec2.scal(acc, delta / 1000, cache)
			)

			# Add velocity to position
			Vec2.add(
				particle.pos,
				Vec2.scal(Vec2.add(oldVel, particle.vel), 0.5 * delta / 1000)
			)

			# Reset forces
			Vec2.set(acc, 0, 0)

			# Euler
			# Vec2.add(
			# 	particle.pos,
			# 	Vec2.scal(particle.vel, delta / 1000, oldVel)
			# )
		@

	draw: (context) ->
		TAU = Math.TAU

		context.save()
		for particle in @entities when particle.acquired

			color = particle.color
			context.fillStyle = Color.rgba(color)

			context.beginPath()
			context.arc(particle.pos[0] | 0, particle.pos[1] | 0, particle.radius, 0, TAU, true)
			context.closePath()
			context.fill()

		context.restore()
		@


Particle.pool = new ParticlePool(->
	return new Particle()
, 256)
