
class Particle extends Composite

	name: 'particle'

	constructor: () ->
		super()
		@color = Color()

	alloc: (parent, pos, acc, @lifetime = 1, @radius = 1, mass = radius / 3) ->
		super(parent)
		Color.copy(@color, Color.white)
		Transform.alloc(@, pos)
		kinetic = Kinetic.alloc(@, mass)
		Vec2.add(kinetic.acc, acc)
		@age = 0
		@sharpness = Math.randomFloat(0, 0.25)
		@alpha = Math.randomFloat(0.8, 1)
		@innerRadius = @radius * @sharpness
		@

	update: (dt, scene) ->
		if (@age += dt) >= @lifetime
			@free()
		@

Particle.render = (ctx) ->
	ctx.save()
	ctx.globalCompositeOperation = 'lighter'

	crop = Vec2.set(Vec2.cache[0], 50, 50)
	cropOffset = Vec2.set(Vec2.cache[1], -25, -25)

	for particle in @roster when particle.enabled
		radius = particle.radius | 0
		if not radius
			continue

		color = particle.color
		pos = particle.transform.pos

		grad = ctx.createRadialGradient(pos[0], pos[1], 0, pos[0], pos[1], radius)
		color[3] = particle.alpha * (1 - Math.quadIn(particle.age / particle.lifetime))
		grad.addColorStop(0, Color.rgba(color))
		color[3] = 0
		grad.addColorStop(1, Color.rgba(color))
		ctx.fillStyle = grad
		ctx.beginPath()
		ctx.arc(pos[0], pos[1], radius, 0, Math.TAU, true)
		ctx.closePath()
		ctx.fill()

	ctx.restore()
	@

Particle.renderSprite = (ctx) ->
	ctx.save()
	ctx.globalCompositeOperation = 'lighter'

	crop = Vec2.set(Vec2.cache[0], 50, 50)
	cropOffset = Vec2.set(Vec2.cache[1], -25, -25)

	for particle in @roster when particle.enabled
		radius = particle.radius | 0
		if not radius
			continue

		pos = Vec2.add(particle.transform.pos, cropOffset, Vec2.cache[2])
		offset = Vec2.set(Vec2.cache[3], 0, 50 * (radius - 1))

		ctx.globalAlpha = 1 - Math.quintIn(particle.age / particle.lifetime)
		Particle.sprite.draw(ctx, pos, crop, offset)

	ctx.restore()
	@

Particle.sprite = new Sprite((ctx) ->
	color = Color(Color.white)
	for radius in [1..25] by 1
		top = 25 + 50 * (radius - 1)
		grad = ctx.createRadialGradient(25, top, 0, 25, top, radius)
		for i in [0..1] by 0.1
			color[3] = Math.quadIn(i)
			grad.addColorStop(1 - i, Color.rgba(color))
		ctx.fillStyle = grad
		ctx.beginPath()
		ctx.arc(25, top, radius, 0, Math.TAU, true)
		ctx.closePath()
		ctx.fill()
, Vec2(50, 50 * 25))


new Pool(Particle)
