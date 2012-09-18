
MAX_SPEED = 150

origin = Vec2()
current = Vec2()
pos = Vec2()
dir = Vec2()

class Scene extends Composite

	name: 'scene'

	constructor: () ->
		super()
		@gravity = null # Vec2(0, 500)
		@friction = 0 # 5
		@drag = 1 # 0.9999

		# Firework.pool.alloc(
		#	@,
		#	Vec2(0, 0),
		#	Vec2(800, 450),
		#	Vec2(20, 20)
		#	Vec2(5, 10)
		#	Vec2(1200, 1200),
		#	0.3
		# )

		@catapult = Catapult.alloc(
			@,
			Vec2(100, 540)
		)
		Sky.alloc(@)
		Earth.alloc(@, Vec2(840, 520))


class Earth extends Composite

	name: 'earth'

	constructor: () ->
		super()
		@pos = Vec2()

		@radius = 50
		@pos = Vec2()
		@vel = Vec2()
		@acc = Vec2()

	alloc: (parent, pos) ->
		super(parent)
		Vec2.copy(@pos, pos)
		# Boid.alloc(@, 300)

	render: (ctx) ->
		Earth.sprite.draw(ctx, @pos)

Earth.sprite = new Sprite('assets/earth.png')

new Pool(Earth)


class Sky extends Composite

	name: 'sky'

	constructor: () ->
		super()
		@stars = []

	alloc: (parent, pos) ->
		super(parent)
		size = Engine.renderer.client

		for i in [0..100]
			@stars.push(
				Vec2(
					Math.randomFloat(-size[0] / 2, size[0] * 1.5),
					Math.randomFloat(-size[1] / 2, size[1] * 1.5)
				),
				Math.randomFloat(1, 10) | 0,
				Math.randomFloat(1, 4) | 0
			)

	update: (dt, scene) ->
		input = Engine.input
		pos = input.pos
		if input.keyState is 'began' and input.key is 'space'
			pos = input.pos
			Explosion.alloc(@, pos)
			# Boid.explode()

		if input.touchState is 'began' and scene.catapult.state isnt 'active'
			Meteor.alloc(@, pos)
		@

	render: (ctx, scene) ->
		if not Particle.sprite
			return

		ctx.save()
		ctx.globalCompositeOperation = 'lighter'

		crop = Vec2.set(Vec2.cache[0], 50, 50)
		cropOffset = Vec2.set(Vec2.cache[1], -25, -25)

		input = Engine.input.current

		for i in [0..@stars.length - 1] by 3
			pos = @stars[i]
			layer = @stars[i + 1]
			radius = @stars[i + 2]

			# distance = Vec2.sub(input, pos, Vec2.cache[4])
			# Vec2.scal(distance, layer * 0.1)

			pos = Vec2.add(pos, cropOffset, Vec2.cache[2])
			# Vec2.add(pos, distance)
			offset = Vec2.set(Vec2.cache[3], 0, 50 * (radius - 1))

			ctx.globalAlpha = 1 / layer

			Particle.sprite.draw(ctx, pos, crop, offset)

		ctx.restore()
		@

new Pool(Sky)
