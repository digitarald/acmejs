
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
		delete @host.boid
		delete @host
		@

	react: (target) ->
		# Cohesion : try to approach other boids
		# Avoidance : try to keep a minimum distance between others.
		# Imitation : try to move in the same way than other boids


class BoidPool extends Pool

	update: (delta) ->
		entities = @entities
		i = entities.length
		while i--
			boid = entities[i]
			if not boid.acquired
				continue

			j = i
			while j--
				if not entities[j].acquired
					continue

				boid.react(entities[j])

		@


Boid.pool = new BoidPool(->
	return new Boid()
, 512)
