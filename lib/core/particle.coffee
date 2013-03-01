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

	@layer: 10

	presets:
		# pos: Vec2()
		# vel: Vec2()
		color: Color.black
		colorVariant: 0.5
		lifetime: 1
		radius: 1
		alpha: 1
		composite: null
		sprite: Particle.sprite
		shrink: Math.quintIn
		fade: Math.quintIn
		sprite: null

	constructor: ->
		# @pos = Vec2()
		# @vel = Vec2()
		@color = Color()

	reset: (presets) ->
		{@lifetime, @radius, @alpha, @composite, @sprite, @shrink, @fade, @colorVariant, @sprite} = presets
		Color.copy(@color, presets.color)
		Color.variant(@color, @colorVariant)
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

Particle.defaultComposite = null

crop = Vec2()
cropOffset = Vec2()
offset = Vec2()

Particle.render = (ctx) ->
	ctx.save()

	Vec2.set(crop, 50, 50)
	Vec2.set(cropOffset, -25, -25)
	alphaPrev = 1
	compositePrev = null
	defaultComposite = Particle.defaultComposite

	for particle in @roster when particle.enabled
		# if Engine.renderer.cull(particle)
		#	continue

		radius = particle.radius
		pos = particle.transform.pos

		alpha = particle.alpha
		if particle.fade
			alpha -= particle.fade(particle.age / particle.lifetime)

		composite = particle.composite or defaultComposite
		if composite isnt compositePrev
			ctx.globalCompositeOperation = compositePrev = composite

		if particle.sprite
			Vec2.set(offset, 0, 50 * (radius - 1 | 0))
			if alpha isnt alphaPrev
				ctx.globalAlpha = alphaPrev = alpha
			particle.sprite.draw(ctx, pos, Vec2.center, crop, offset)
		else
			particle.color[3] = alpha
			ctx.fillStyle = Color.rgba(particle.color)
			ctx.fillRect(
				pos[0] - radius / 2 | 0,
				pos[1] - radius / 2 | 0,
				radius | 0,
				radius | 0
			)

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
			# ctx.strokeStyle = 'red'
			# ctx.strokeRect(0, size * (radius - 1), size, size)
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
