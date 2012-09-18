
class Firework extends Component

	name: 'firework'

	constructor: ->
		@center = Vec2()
		@size = Vec2()
		@spread = Vec2()
		@amount = Vec2()
		@acc = Vec2()
		super()

	alloc: (parent, center, size, spread, amount, acc, @chance = 0.1, @lifetime = 0) ->
		Vec2.copy(@center, center)
		Vec2.copy(@size, size)
		Vec2.copy(@spread, spread)
		Vec2.copy(@amount, amount)
		Vec2.copy(@acc, acc)
		super(parent)

	simulate: (dt, scene) ->
		age = (@age += dt)

		if @lifetime and age > @lifetime
			@free()
			return

		input = Engine.input

		if not input.touchState or not Math.randomBool(@chance)
			return

		pos = Vec2.cache[1]
		dir = Vec2.cache[2]
		origin = Vec2.add(
			Engine.renderer.pos,
			input.to,
			Vec2.cache[0]
		)
		# @center[0] + Math.randomFloat(-@size[0] / 2, @size[0] / 2),
		# @center[1] + Math.randomFloat(-@size[1] / 2, @size[1] / 2)


		for i in [0..Math.randomFloat(@amount[0], @amount[1])] by 1
			Vec2.add(
				Vec2.set(
					pos,
					Math.randomFloat(-@spread[0] / 2, @spread[0] / 2),
					Math.randomFloat(-@spread[1] / 2, @spread[1] / 2)
				),
				origin
			)
			Vec2.set(
				dir,
				Math.randomFloat(-@acc[0], @acc[0]),
				Math.randomFloat(-@acc[1], @acc[1])
			)

			particle = Particle.pool.alloc(
				scene,
				pos,
				dir,
				Math.randomFloat(5000, 10000),
				Math.randomFloat(1, 4),
				1
			)

			# Collider.pool.alloc(particle)
			Boid.alloc(particle)
			Border.alloc(particle)

new Pool(Firework)