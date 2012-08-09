
MAX_SPEED = 120

class World

	constructor: () ->
		@updateQueue = [Collider.pool, Particle.pool]
		@drawQueue = [Particle.pool]

	update: (delta) ->
		if Math.randomBool(0.7)
			particle = Particle.pool.acquire(
				Math.randomFloat(-300, 300), Math.randomFloat(-250, 250),
				Math.randomFloat(-MAX_SPEED, MAX_SPEED), Math.randomFloat(-MAX_SPEED, MAX_SPEED),
				Math.randomFloat(1500, 2500)
			)

		for instance in @updateQueue
			instance.update(delta)
		@

	draw: (context) ->
		for instance in @drawQueue
			instance.draw(context)
		@