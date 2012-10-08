Component = require('./component')
Pool = require('./pool')
{Vec2} = require('./math')
Color = require('./color')
Transform = require('./transform')
Kinetic = require('./kinetic')
Sprite = require('./sprite').Asset

class Particle extends Component

	type: 'particle'

	presets:
		lifetime: 1
		radius: 1
		sprite: Particle.sprite
		shrink: Math.quintIn
		fade: Math.quintIn

	reset: (presets) ->
		{@lifetime, @radius, @sprite, @shrink, @fade} = presets
		@age = 0
		@

	update: (dt, scene) ->
		if (@age += dt) >= @lifetime
			@parent.free()
		@

	onKineticSleep: ->
		@parent.free()
		false

# Particle.render = (ctx) ->
#	ctx.save()
#	ctx.globalCompositeOperation = 'lighter'

#	crop = Vec2.set(Vec2.cache[0], 50, 50)
#	cropOffset = Vec2.set(Vec2.cache[1], -25, -25)

#	for particle in @roster when particle.enabled
#		radius = particle.radius | 0
#		if not radius
#			continue

#		color = particle.color
#		pos = particle.transform.pos

#		grad = ctx.createRadialGradient(pos[0], pos[1], 0, pos[0], pos[1], radius)
#		color[3] = particle.alpha * (1 - Math.quadIn(particle.age / particle.lifetime))
#		grad.addColorStop(0, Color.rgba(color))
#		color[3] = 0
#		grad.addColorStop(1, Color.rgba(color))
#		ctx.fillStyle = grad
#		ctx.beginPath()
#		ctx.arc(pos[0], pos[1], radius, 0, Math.TAU, true)
#		ctx.closePath()
#		ctx.fill()

#	ctx.restore()
#	@

Particle.defaultComposite = 'lighter'

Particle.render = (ctx) ->
	ctx.save()
	composite = Particle.defaultComposite
	if composite
		ctx.globalCompositeOperation = composite

	crop = Vec2.set(Vec2.cache[0], 50, 50)
	cropOffset = Vec2.set(Vec2.cache[1], -25, -25)

	for particle in @roster when particle.enabled
		radius = particle.radius
		if particle.shrink
			radius *= 1 - particle.shrink(particle.age / particle.lifetime)
		if not (radius = radius | 0)
			continue

		pos = Vec2.add(particle.transform.pos, cropOffset, Vec2.cache[2])
		offset = Vec2.set(Vec2.cache[3], 0, 50 * (radius - 1))

		alpha = 1
		if particle.fade
			alpha -= particle.fade(particle.age / particle.lifetime)
		ctx.globalAlpha = alpha

		particle.sprite.draw(ctx, pos, crop, offset)

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

new Pool(Particle)

module.exports = Particle
