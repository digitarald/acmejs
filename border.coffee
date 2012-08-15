
class Border

	alloc: (owner) ->
		owner.border = @
		owner.pubsub.sub(@, 'free')
		@owner = owner
		@

	free: ->
		@allocd = false
		@owner.pubsub.unsub(@)
		@owner = @owner.border = null
		@

class Pool.Borders extends Pool

	instantiate: ->
		return new Border()

	update: (dt, engine) ->
		size = engine.renderer.size
		center = engine.renderer.center
		horizontal = Vec2.set(
			Vec2.cache[0],
			center[0] - size[0] / 2,
			center[0] + size[0] / 2
		)
		vertical = Vec2.set(
			Vec2.cache[1],
			center[1] - size[1] / 2,
			center[1] + size[1] / 2
		)

		for border in @roster when border.allocd
			pos = border.owner.pos
			vel = border.owner.vel
			radius = border.owner.radius

			# horizontal
			diff = pos[0] - radius - horizontal[0]
			if diff < 0
				pos[0] -= diff
				vel[0] *= -1
			else
				diff = pos[0] + radius - horizontal[1]
				if diff > 0
					pos[0] -= diff
					vel[0] *= -1

			# vertical
			diff = pos[1] - radius - vertical[0]
			if diff < 0
				pos[1] -= diff
				vel[1] *= -1
			else
				diff = pos[1] + radius - vertical[1]
				if diff > 0
					pos[1] -= diff
					vel[1] *= -1
		@


Pool.borders = new Pool.Borders()
