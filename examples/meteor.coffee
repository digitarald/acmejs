Composite = require('./lib/composite')
Pool = require('./lib/pool')
{Vec2} = require('./lib/math')
Kinetic = require('./lib/kinetic')
Color = require('./lib/color')
Transform = require('./lib/transform')
Collider = require('./lib/collider')

class Meteor extends Composite

	type: 'meteor'

	constructor: () ->
		super()
		@color = Color(120, 120, 120)
		@shadow = Color(64, 64, 64)
		@surface = []

	alloc: (parent, pos, @radius = 50, mass = @radius) ->
		super(parent)
		Transform.alloc(@, pos)
		Kinetic.alloc(@, mass)
		Collider.alloc(@)

		radiusMin = @radius * 0.9
		radiusMax = @radius * 1.1

		@surface.length = 0
		steps = 32
		for i in [0..steps - 1] by 1
			rad = i / steps * Math.TAU
			point = Vec2.rot(Vec2(0, 1), rad)
			Vec2.scal(point, Math.rand(radiusMin, radiusMax))
			@surface.push(point)
		@

	# update: (dt) ->
	#	if (@age += dt) >= @lifetime
	#		@free()
	#	@

	render: (ctx) ->
		point = Vec2.cache[0]
		start = Vec2.cache[1]
		pos = @transform.pos

		ctx.save()
		ctx.fillStyle = Color.rgba(@color)
		ctx.strokeStyle = Color.rgba(Color.white)

		# ctx.beginPath()
		# ctx.arc(pos[0] | 0, pos[1] | 0, @radius | 0, 0, Math.TAU, true)
		# ctx.closePath()
		# ctx.stroke()

		grad = ctx.createRadialGradient(
			pos[0] - @radius / 4, pos[1] - @radius / 4, 0,
			pos[0] - @radius / 4, pos[1] - @radius / 4, @radius)
		grad.addColorStop(0, Color.rgba(@color))
		grad.addColorStop(1, Color.rgba(@shadow))
		ctx.fillStyle = grad

		ctx.beginPath()
		for offset, i in @surface
			Vec2.add(pos, offset, point)
			if not i
				ctx.moveTo(point[0], point[1])
				Vec2.copy(start, point)
			else
				ctx.lineTo(point[0], point[1])
		ctx.lineTo(start[0], start[1])
		ctx.closePath()
		# ctx.stroke()
		ctx.fill()
		ctx.restore()
		@


new Pool(Meteor)

module.exports = Meteor
