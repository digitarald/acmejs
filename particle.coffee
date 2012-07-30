
class Particle

	constructor: () ->

		@pos = Vec2()
		@dir = Vec2()
		@color = Color()

		@lifetime = 5000

		@awake = false

	sleep: ->

		@awake = false

		@

	wakeup: (posX, posY, dirX, dirY) ->

		@awake = true

		Vec2.set(@pos, posX or 0, posY or 0)
		Vec2.set(@dir, dirX or 0, dirY or 0)
		Color.set(@color, 255, 0, 0, 1)

		@age = 0

		@

class Particle.Pool extends Pool

	update: (delta) ->
		for entity in @entities
			if not entity.awake
				continue

			entity.age += delta

			if entity.age > entity.lifetime
				entity.sleep()
				return @

			Vec2.add(entity.pos, entity.dir)
			# Vec2.color = Color.tint(Vec2.color, 0.0001)

		@

	draw: (context) ->
		TAU = Math.TAU

		context.save()
		for entity in @entities
			if not entity.awake
				continue

			context.fillStyle = Color.rgba(entity.color)
			context.beginPath()
			context.arc(entity.pos[0], entity.pos[1], 4, 0, TAU, true)
			context.closePath()
			context.fill()

		context.restore()
		@



Particle.pool = new Particle.Pool(->
	return new Particle()
, [], 128)