Entity = require('./entity')
Component = require('./component')
Pool = require('./pool')
Engine = require('./engine')
{Vec2} = require('./math')
Color = require('./color')
Transform = require('./transform')
Kinetic = require('./kinetic')
Sprite = require('./sprite').Asset

class Particle extends Component

	tag: 'particle'

	# light: true # TODO

	@layer: 10

	attributes:
		# pos: Vec2()
		# vel: Vec2()
		color: Color.black
		colorVariant: 0
		lifetime: 1
		radius: 1
		radiusVariant: 0
		alpha: 1
		alphaVariant: 0
		composite: null
		sprite: null
		shrink: Math.quintIn
		fade: Math.quintIn

	constructor: ->
		# @pos = Vec2()
		# @vel = Vec2()
		@color = Color()

	instantiate: (attributes) ->
		{@lifetime, @radius, @alpha, @composite, @sprite, @shrink, @fade} = attributes
		Color.copy(@color, attributes.color)
		if (variant = attributes.colorVariant)
			Color.variant(@color, variant)
		if (variant = attributes.radiusVariant)
			@radius += Math.rand(-variant, variant)
		if (variant = attributes.alphaVariant)
			@alpha = Math.clamp(@alpha + Math.rand(-variant, variant), 0, 1)
		# Vec2.copy(@pos, attributes.pos)
		# Vec2.copy(@vel, attributes.vel)
		@age = 0
		@

	update: (dt) ->
		if (@age += dt) > @lifetime
			@entity.destroy()
		else if @shrink and (@radius *= 1 - @shrink(@age / @lifetime)) < 1
			@entity.destroy()
		else if @fade and (@alpha *= 1 - @fade(@age / @lifetime)) <= 0.02
			@entity.destroy()
		@

Particle.defaultEntity = null

crop = Vec2()
cropOffset = Vec2()
offset = Vec2()

Particle.render = (ctx) ->
	ctx.save()

	Vec2.set(crop, 50, 50)
	Vec2.set(cropOffset, -25, -25)
	alphaPrev = 1
	entityPrev = null
	fillPrev = null
	defaultComposite = Particle.defaultComposite

	for particle in @register when particle.enabled
		# if Engine.renderer.cull(particle)
		#	continue

		radius = particle.radius
		pos = particle.transform.pos

		alpha = particle.alpha
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
			fill = Color.rgba(particle.color)
			if fill isnt fillPrev
				ctx.fillStyle = fillPrev = fill
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

Particle.Prefab = new Entity.Prefab(
	transform: null
	kinetic:
		mass: 0
	particle: null
)

new Pool(Particle)

module.exports = Particle
