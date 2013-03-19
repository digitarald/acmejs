Component = require('./component')
Entity = require('./entity')
Pool = require('./pool')
Engine = require('./engine')
{Vec2} = require('./math')
Catapult = require('./catapult')
Sprite = require('./sprite').Asset
Particle = require('./particle')

class Scene extends Entity

	tag: 'scene'

	constructor: () ->
		@gravity = null # Vec2(0, 500)
		@friction = 0 # 5
		@drag = 1 # 0.9999

		@catapult = Catapult.alloc(@, Vec2(100, 540))
		Sky.alloc(@)
		Earth.alloc(@, Vec2(840, 520))

module.exports = Scene

# Earth

class Earth extends Component

	tag: 'earth'

	onTrigger: (entity) ->
		pos = entity.transform.pos
		entity.destroy()
		require('./explosion').alloc(@, pos)
		@

	render: (ctx) ->
		Earth.sprite.draw(ctx, @transform.pos)
		@

Earth.sprite = new Sprite('assets/earth.png')

new Pool(Earth)

# Sky

class Sky extends Component

	tag: 'sky'

	constructor: () ->
		@stars = []

	instantiate: () ->
		size = Engine.renderer.client

		for i in [0..100]
			@stars.push(
				Vec2(
					Math.rand(-size[0] / 2, size[0] * 1.5),
					Math.rand(-size[1] / 2, size[1] * 1.5)
				),
				Math.rand(1, 10) | 0,
				Math.rand(1, 4) | 0
			)

	update: (dt, scene) ->
		input = Engine.input
		pos = input.pos
		if input.keys.space is 'began'
			pos = input.pos
			require('./explosion').alloc(@, pos)
			# Boid.explode()

		if input.touchState is 'began' and scene.catapult.state isnt 'active'
			require('./../meteor').alloc(@, pos)
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
