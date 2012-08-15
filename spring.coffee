
class Spring

	constructor: ->
		@center = Vec2()

	alloc: (owner, centerX, centerY) ->
		owner.spring = @
		owner.pubsub.sub(@, 'free')
		@owner = owner
		Vec2.set(@center, centerX, centerY)

	free: ->
		@allocd = false
		@owner.pubsub.unsub(@)
		@owner = @owner.spring = null
		@


class Pool.Springs extends Pool

	instantiate: ->
		return new Spring()

	update: (dt) ->
		for spring in @roster
			if not spring.allocd
				continue

			center = spring.target?.pos or spring.center

			spring.update(dt)

		@

Spring.pool = new Pool.Springs(128)
