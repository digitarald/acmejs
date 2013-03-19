Component = require('./component')
Pool = require('./pool')
{Vec2} = require('./math')
Engine = require('./engine')

class Border extends Component

	tag: 'border'

	attributes:
		mode: 'bounce'
		restitution: 1

	instantiate: (attributes) ->
		{@mode, @restitution} = attributes
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

	for border in @register when border.enabled
		{entity, restitution, mode, kinetic} = border
		vel = null
		if kinetic
			if not kinetic.enabled or kinetic.sleeping
				continue
			vel = kinetic.vel

		mirror = mode is 'mirror'
		bounce = mode is 'bounce' and vel
		Vec2.copy(pos, entity.transform.pos)

		radius = entity.bounds.radius # FIXME
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
		if hit
			entity.transform.setTransform(pos)
			entity.pub('onBorder', hit)
			if border.mode is 'kill'
				entity.destroy()
	@

new Pool(Border)

module.exports = Border
