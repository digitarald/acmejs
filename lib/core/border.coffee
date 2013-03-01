Component = require('./component')
Pool = require('./pool')
{Vec2} = require('./math')
Engine = require('./engine')

class Border extends Component

	type: 'border'

	presets:
		mode: 'bounce'
		restitution: 1

	reset: (presets) ->
		{@mode, @restitution} = presets
		@

pos = Vec2()

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
		{parent, restitution, mode, kinetic} = border
		vel = null
		if kinetic
			if not kinetic.enabled or kinetic.sleeping
				continue
			vel = kinetic.vel

		mirror = mode is 'mirror'
		bounce = mode is 'bounce' and vel
		Vec2.copy(pos, parent.transform.pos)

		radius = parent.bounds.radius # FIXME
		if mirror
			radius *= -1 # kill after crossing border

		hit = 0

		# horizontal
		if (diff = pos[0] - radius - horizontal[0]) < 0
			if mirror
				pos[0] = horizontal[1] - radius
			else
				pos[0] -= diff
				if bounce
					vel[0] *= -restitution
			hit = -1
		else
			diff = pos[0] + radius - horizontal[1]
			if diff > 0
				if mirror
					pos[0] = radius
				else
					pos[0] -= diff
					if bounce
						vel[0] *= -restitution
				hit = -1

		# vertical
		if (diff = pos[1] - radius - vertical[0]) < 0
			if mirror
				pos[1] = vertical[1] - radius
			else
				pos[1] -= diff
				if bounce
					vel[1] *= -restitution
			hit = 1
		else
			diff = pos[1] + radius - vertical[1]
			if diff > 0
				if mirror
					pos[1] = radius
				else
					pos[1] -= diff
					if bounce
						vel[1] *= -restitution
				hit = 1

		# TODO: property!
		if hit?
			parent.transform.setTransform(pos)
			parent.pub('onBorder', hit)
			if border.mode is 'kill'
				parent.free()
	@

new Pool(Border)

module.exports = Border
