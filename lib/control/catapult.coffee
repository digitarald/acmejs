Entity = require('./entity')
Pool = require('./pool')
{Vec2} = require('./math')
Color = require('./color')
Engine = require('./engine')
Particle = require('./particle')
Kinetic = require('./kinetic')
Border = require('./border')
Boid = require('./boid')

class Catapult extends Entity

	tag: 'catapult'

	attributes:
		pos: Vec2()
		color: Color.white

	constructor: ->
		@pos = Vec2()
		@color = Color()
		@start = Vec2()
		@end = Vec2()
		@impulse = Vec2()
		@impulseNorm = Vec2()

	instantiate: (attributes) ->
		Vec2.copy(@pos, attributes.pos)
		Color.copy(@color, attributes.color)

		@state = null
		@radius = 90
		@listenRadius = @radius * 0.15
		@fireRadius = @radius * 0.1
		@listenRadiusSq = @listenRadius * @listenRadius
		Vec2.set(@impulse)
		@

	update: (dt) ->
		if @state is 'fired'
			impulse = Vec2.scal(@impulseNorm, -Kinetic.maxForce, Vec2.cache[0])
			rand = Vec2.cache[1]
			perImpulse = Vec2.cache[2]
			perPos = Vec2.cache[3]

			randImpulse = Kinetic.maxForce * 0.2

			for i in [0..Math.rand(50, 75)] by 1
				Vec2.add(
					impulse,
					Vec2.set(
						rand,
						Math.rand(-randImpulse, randImpulse),
						Math.rand(-randImpulse, randImpulse)
					),
					perImpulse
				)

				Vec2.add(
					@pos,
					Vec2.set(
						rand,
						Math.rand(-5, 5),
						Math.rand(-5, 5)
					),
					perPos
				)

				particle = Particle.alloc(
					@root,
					perPos,
					perImpulse,
					Math.rand(15, 25, Math.cubicOut),
					Math.rand(1, 15, Math.quadIn)
				)
				Boid.alloc(particle)
				# Collider.alloc(particle)
				border = Border.alloc(particle)
				# border.kill = true

		# Poll input
		input = Engine.input

		switch @state
			when null
				if input.touchState is 'began' and Vec2.distSq(input.pos, @pos) <= @listenRadiusSq
					@state = 'active'
					Vec2.copy(@start, input.pos)
					Vec2.set(@impulse)
					Vec2.set(@impulseNorm)
				break
			when 'active'
				switch input.touchState
					when 'moved'
						end = Vec2.copy(Vec2.cache[0], input.pos)
						Vec2.limit(
							Vec2.sub(end, @start, @impulse),
							@radius
						)
						if Vec2.len(@impulse) < @fireRadius
							Vec2.set(@impulse)
						Vec2.scal(@impulse, 1 / @radius, @impulseNorm)
						@
					when 'ended'
						if Vec2.dist(@start, input.pos) < @fireRadius
							@state = null
						else
							@state = 'fired'
				break
			when 'fired'
				@state = null
				break
		@


	render: (ctx) ->
		active = @state is 'active'
		pos = @pos

		@color[3] = if active then 1 else 0.3
		ctx.strokeStyle = Color.rgba(@color)

		ctx.beginPath()
		ctx.arc(pos[0] | 0, pos[1] | 0, @listenRadius, 0, Math.TAU, true)
		ctx.closePath()
		ctx.stroke()

		if active

			target = Vec2.add(pos, @impulse, Vec2.cache[0])

			ctx.lineWidth = 1
			@color[3] = 0.5
			ctx.strokeStyle = Color.rgba(@color)
			@color[3] = 0.2
			ctx.fillStyle = Color.rgba(@color)

			ctx.beginPath()
			ctx.arc(target[0] | 0, target[1] | 0, @fireRadius, 0, Math.TAU, true)
			ctx.closePath()
			ctx.stroke()
			ctx.fill()
		@

new Pool(Catapult)

module.exports = Catapult
