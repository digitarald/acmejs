
MAX_SPEED = 150

origin = Vec2()
current = Vec2()
pos = Vec2()
dir = Vec2()

class World

	constructor: (@renderer) ->
		@updateQueue = [
			Collider.pool,
			Pool.borders,
			Pool.boids,
			Firework.pool,
			Particle.pool
		]
		@drawQueue = [Particle.pool]

		@pubsub = Pubsub.pool.alloc(@)
		@firework = Firework.pool.alloc(
			@,
			Vec2(0, 0),
			Vec2(800, 450),
			Vec2(20, 20)
			Vec2(5, 10)
			Vec2(300, 300),
			0.03
		)

		@steps = 0
		@minStep = 100 / 6
		# @gravity = Vec2(0, 500)
		@gravity = Vec2(0, 0)
		@friction = 10
		@drag = 1 # 0.9999

	update: (dt) ->
		if dt > 500
			dt = 100

		@steps += dt

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