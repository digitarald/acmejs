
MAX_SPEED = 150

origin = Vec2()
current = Vec2()
pos = Vec2()
dir = Vec2()

class World

	constructor: () ->
		@updateQueue = [
			Collider.pool,
			Firework.pool,
			Particle.pool
		]
		@drawQueue = [Particle.pool]

		@pubsub = Pubsub.pool.acquire(@)
		@firework = Firework.pool.acquire(
			@,
			Vec2(0, 0),
			Vec2(800, 450),
			Vec2(20, 20)
			Vec2(15, 35)
			Vec2(500, 500),
			0.2
		)

		@steps = 0
		@minStep = 10
		@gravity = Vec2(0, 500)
		@friction = 20
		@drag = 0.9999

	update: (delta) ->
		if delta > 500
			delta = 100

		@steps += delta

		# Update
		min = @minStep
		while @steps > min
			@steps -= min

			for instance in @updateQueue
				instance.update(min, @)
			@

	draw: (context) ->
		for instance in @drawQueue
			instance.draw(context, @)
		@