Component = require('./component')
Pool = require('./pool')
{Vec2} = require('./math')
Engine = require('./engine')

class Border extends Component

	type: 'border'

	reset: () ->
		@kill = null
		@bounciness = 1

Border.simulate = (dt) ->
	size = Engine.renderer.content
	viewport = Engine.renderer.pos

	horizontal = Vec2.set(
		Vec2.cache[0],
		viewport[0],
		viewport[0] + size[0]
	)
	vertical = Vec2.set(
		Vec2.cache[1],
		viewport[1],
		viewport[1] + size[1]
	)

	for border in @roster when border.enabled
		parent = border.parent
		bounciness = border.bounciness
		pos = parent.transform.pos
		vel = parent.kinetic.vel
		radius = parent.radius or parent.bounds.radius # FIXME
		if border.kill
			radius *= -1 # kill after crossing border

		hit = null

		# horizontal
		diff = pos[0] - radius - horizontal[0]
		if diff < 0
			pos[0] -= diff
			vel[0] *= -bounciness
			hit = 0
		else
			diff = pos[0] + radius - horizontal[1]
			if diff > 0
				pos[0] -= diff
				vel[0] *= -bounciness
				hit = 0

		# vertical
		diff = pos[1] - radius - vertical[0]
		if diff < 0
			pos[1] -= diff
			vel[1] *= -bounciness
			hit = 1
		else
			diff = pos[1] + radius - vertical[1]
			if diff > 0
				pos[1] -= diff
				vel[1] *= -bounciness
				hit = 1

		if hit?
			parent.pub('onBorder', hit)
			if border.kill
				parent.free()
	@

new Pool(Border)

module.exports = Border
