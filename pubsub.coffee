# Pubsub
# pattern: Observer and Delegate
class Pubsub

	constructor: ->
		@topics = []
		@scopes = []
		@methods = []

	empty: ->

	alloc: (owner) ->
		owner.pubsub = @
		@owner = owner
		@length = 0
		@

	free: ->
		@allocd = false
		@owner = @owner.pubsub = null
		@topics.length = @methods.length = @scopes.length = 0
		@

	sub: (scope, topic, method) ->
		@scopes.push(scope)
		@topics.push(topic)
		@methods.push(method)
		@

	pub: (topic, a0, a1, a2, a3, a4, a5, a6, a7) ->
		topics = @topics
		empty = @empty
		for scope, i in @scopes
			if scope and (not topics[i] or topics[i] is topic)
				if scope[@methods[i] or topic](a0, a1, a2, a3, a4, a5, a6, a7) is false
					return false
		return true

	unsub: (unscope, topic, method) ->
		scopes = @scopes
		topics = @topics
		methods = @methods
		for scope, i in scopes
			if scope and (not unscope or scope is unscope) and (not topic or topics[i] is topic) and (not method or methods[i] is method)
				topics[i] = scopes[i] = methods[i] = null
		@

class Pool.Pubsubs extends Pool

	instantiate: ->
		return new Pubsub()

Pubsub.pool = new Pool.Pubsubs(128)
