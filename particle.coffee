Composite = require('./composite')
Component = require('./component')
Pool = require('./pool')
Engine = require('./engine')
{Vec2} = require('./math')
Color = require('./color')
Transform = require('./transform')
Kinetic = require('./kinetic')
Sprite = require('./sprite').Asset

class Particle extends Component

	type: 'particle'

	# light: true # TODO

	presets:
		# pos: Vec2()
		# vel: Vec2()
		color: Color.white
		lifetime: 1
		radius: 1
		sprite: Particle.sprite
		shrink: Math.quintIn
		fade: Math.quintIn

	constructor: ->
		# @pos = Vec2()
		# @vel = Vec2()
		@color = Color()

	reset: (presets) ->
		{@lifetime, @radius, @sprite, @shrink, @fade} = presets
		Color.copy(@color, presets.color)
		# Vec2.copy(@pos, presets.pos)
		# Vec2.copy(@vel, presets.vel)
		@age = 0
		@

	update: (dt) ->
		if (@age += dt) > @lifetime
			@parent.free()

		if @shrink
			if not (@radius *= 1 - @shrink(@age / @lifetime)) | 0
				@parent.free()
		@

Particle.defaultComposite = 'lighter'

Particle.render = (ctx) ->
	ctx.save()
	# composite = Particle.defaultComposite
	# if composite
	#	ctx.globalCompositeOperation = composite

	crop = Vec2.set(Vec2.cache[0], 50, 50)
	cropOffset = Vec2.set(Vec2.cache[1], -25, -25)

	for particle in @roster when particle.enabled
		# if Engine.renderer.cull(particle)
		#	continue

		# pos = Vec2.add(particle.transform.pos, cropOffset, Vec2.cache[2])
		pos = particle.transform.pos

		# offset = Vec2.set(Vec2.cache[3], 0, 50 * (particle.radius - 1))
		radius = particle.radius

		alpha = 1
		if particle.fade
			alpha -= particle.fade(particle.age / particle.lifetime)
		# ctx.globalAlpha = alpha
		particle.color[3] = alpha

		ctx.fillStyle = Color.rgba(particle.color)
		# if alpha < 0.5
		#	debugger

		ctx.fillRect(
			pos[0] - radius / 2 | 0,
			pos[1] - radius / 2 | 0,
			radius | 0,
			radius | 0
		)

		# particle.sprite.draw(ctx, pos, crop, offset)

	ctx.restore()
	@

Particle.generateSprite = (color = Color.white, alpha = 1, max = 25) ->
	color = Color(color)
	size = max * 2
	return new Sprite((ctx) ->
		for radius in [1..max] by 1
			top = max + size * (radius - 1)
			grad = ctx.createRadialGradient(max, top, 0, max, top, radius)
			color[3] = alpha
			grad.addColorStop(0, Color.rgba(color))
			color[3] = 0
			grad.addColorStop(1, Color.rgba(color))
			ctx.fillStyle = grad
			ctx.beginPath()
			ctx.arc(max, top, radius, 0, Math.TAU, true)
			ctx.closePath()
			ctx.fill()
	, Vec2(size, size * max))

Particle.sprite = Particle.generateSprite()

Particle.Prefab = new Composite.Prefab(
	transform: null
	kinetic:
		mass: 0
	particle: null
)

new Pool(Particle)

module.exports = Particle
