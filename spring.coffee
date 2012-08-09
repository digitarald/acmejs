
class Spring

	constructor: ->
		@center = Vec2()

	acquire: (host, centerX, centerY) ->
		@acquired = true
		host.spring = @
		host.pubsub.sub('release', @)
		@host = host
		Vec2.set(@center, centerX, centerY)

	release: ->
		@acquired = false
		@host.pubsub.unsub(null, @)
		delete @host.spring
		delete @host
		@

	update: (target) ->


class SpringPool extends Pool

	update: (delta) ->
		for spring in @entities
			if not spring.acquired
				continue

			center = spring.target?.pos or spring.center

			spring.update(delta)

		@


Spring.pool = new SpringPool(->
	return new Spring()
, 128)
