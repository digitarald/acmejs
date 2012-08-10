
class Boid

	constructor: ->
		@aura = 100

	acquire: (host) ->
		@acquired = true
		host.boid = @
		@host = host
		@

	release: ->
		@acquired = false
		@host = @host.boid = null
		@

	react: (target) ->
		# Cohesion : try to approach other boids
		# Avoidance : try to keep a minimum distance between others.
		# Imitation : try to move in the same way than other boids


class Pool.Boids extends Pool

	allocate: ->
		return new	 Boid()

	update: (delta) ->
		boids = @buffer
		i = boids.length
		while i--
			boid = boids[i]
			if not boid.acquired
				continue

			j = i
			while j--
				if not boids[j].acquired
					continue

				boid.react(boids[j])
		@


Boid.pool = new Pool.Boids(128)
