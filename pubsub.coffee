
class Pubsub

	constructor: ->
		@topics = []
		@scopes = []
		@methods = []

	acquire: (host) ->
		@acquired = true
		host.pubsub = @
		@host = host
		@

	release: ->
		@acquired = false
		delete @host.pubsub
		delete @host
		@topics.length = @methods.length = @scopes.length = 0
		@

	sub: (topic, scope, method) ->
		@topics.push(topic)
		@scopes.push(scope)
		@methods.push(method)
		@

	pub: (topic, a0, a1, a2, a3, a4, a5, a6, a7) ->
		topics = @topics
		scopes = @scopes
		i = topics.length

		while i--
			if scopes[i] and (not topics[i] or topics[i] is topic)
				scopes[i][@methods[i] or topic](a0, a1, a2, a3, a4, a5, a6, a7)
		@

	unsub: (topic, scope, method) ->
		scopes = @scopes
		topics = @topics
		methods = @methods
		last = before = i = scopes.length

		while i--
			if scopes[i] and (not topic or topics[i] is topic) and (not method or methods[i] is method)
				# topics[i] = scopes[i] = methods[i] = null
				 i isnt --last
					topics[i] = topics[last]
					scopes[i] = scopes[last]
					methods[i] = methods[last]

		if last isnt before
			topics.length = scopes.length = methods.length = last
		@


Pubsub.pool = new Pool(->
	return new Pubsub()
, 512)