
class Boid

	constructor: ->
		@cohesionMod = 5
		@avoidanceMod = 1
		@imitationMod = 1

	alloc: (owner, @perception = 80, @aura = 10) ->
		owner.boid = @
		owner.pubsub.sub(@, 'free')
		@owner = owner

		@perceptionSq = @perception * @perception
		@auraSq = @aura * @aura
		@

	free: ->
		@allocd = false
		@owner.pubsub.unsub(@)
		@owner = @owner.boid = null
		@

class Pool.Boids extends Pool

	instantiate: ->
		return new Boid()

	update: (dt) ->
		cohesion = Vec2.cache[0]
		avoidance = Vec2.cache[1]
		imitation = Vec2.cache[2]

		limit = 100

		boids = @roster
		i = boids.length
		while i--
			boid1 = boids[i]
			continue if not boid1.allocd

			avoidanceCount = imitationCount  = cohesionCount = 0

			j = boids.length
			while j--
				boid2 = boids[j]
				continue if not boid2.allocd or boid1 is boid2

				owner1 = boid1.owner
				owner2 = boid2.owner

				diffSq = Vec2.distSq(owner1.pos, owner2.pos)

				if diffSq < boid1.perceptionSq

					# Cohesion : try to approach other boids
					if not cohesionCount++
						Vec2.copy(cohesion, owner2.pos)
					else
						Vec2.add(cohesion, owner2.pos)

					# Imitation : try to move in the same way than other boids
					if not imitationCount++
						Vec2.copy(imitation, owner2.vel)
					else
						Vec2.add(imitation, owner2.vel)

				# Avoidance : try to keep a minimum distance between others.
				if diffSq < boid1.auraSq
					diff = Math.sqrt(diffSq)
					Vec2.add(
						owner1.acc,
						Vec2.scal(
							Vec2.sub(owner1.pos, owner2.pos, avoidance),
							2
						)
					)

			if cohesionCount
				if cohesionCount > 1
					Vec2.scal(cohesion, 1 / cohesionCount)
				Vec2.limit(
					Vec2.sub(cohesion, owner1.pos),
					limit
				)
				Vec2.add(owner1.acc, Vec2.scal(cohesion, boid1.cohesionMod))

			if imitationCount
				if imitationCount > 1
					Vec2.scal(imitation, 1 / imitationCount)
				Vec2.limit(imitation, limit)
				Vec2.add(owner1.acc, Vec2.scal(imitation, boid1.imitationMod))

		@


Pool.boids = new Pool.Boids(128)
