
class Border extends Component

	name: 'border'

Border.simulate = (dt, scene) ->
	size = Engine.renderer.client
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
		pos = parent.transform.pos
		vel = parent.kinetic.vel
		radius = parent.radius

		hit = false

		# horizontal
		diff = pos[0] - radius - horizontal[0]
		if diff < 0
			hit = true
			pos[0] -= diff
			vel[0] *= -1
		else
			diff = pos[0] + radius - horizontal[1]
			if diff > 0
				pos[0] -= diff
				vel[0] *= -1
				hit = true

		# vertical
		diff = pos[1] - radius - vertical[0]
		if diff < 0
			pos[1] -= diff
			vel[1] *= -1
			hit = true
		else
			diff = pos[1] + radius - vertical[1]
			if diff > 0
				pos[1] -= diff
				vel[1] *= -1
				hit = true

		if border.kill and hit
			parent.free()
	@


new Pool(Border).preinstantiate(128)
