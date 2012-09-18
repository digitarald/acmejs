# Base class for all entities
class Composite

	name: 'composite'

	constructor: ->
		@uid = Math.uid()
		@children = {}
		@components = {}

	toString: ->
		return "Composite #{@name}##{@uid}"

	alloc: (@parent) ->
		@scene = parent.scene or parent
		@enabled = true
		@

	free: () ->
		@enabled = @allocd = false
		if @scopes
			@scopes.length = @topics.length = @methods.length = 0

		for key of @components
			@components[key].free()
		for key of @children
			@children[key].free()

		if @parent
			delete @parent.children[@uid]
		@scene = @parent = null
		@

	enable: ->
		@pub('enable', @)
		@enabled = true

	disable: ->
		@pub('disable', @)
		@enabled = false

	# Pubsub
	sub: (scope, topic, method) ->
		if not @scopes
			@topics = []
			@scopes = []
			@methods = []
		@scopes.push(scope)
		@topics.push(topic)
		@methods.push(method)
		@

	pub: (topic, a0, a1, a2, a3, a4, a5, a6, a7) ->
		if (scopes = @scopes)
			topics = @topics
			for scope, i in scopes
				if scope and (not topics[i] or topics[i] is topic)
					scope[@methods[i] or topic](a0, a1, a2, a3, a4, a5, a6, a7)
		@

	unsub: (unscope, topic, method) ->
		if (scopes = @scopes)
			topics = @topics
			methods = @methods
			for scope, i in scopes
				if scope and (not unscope or scope is unscope) and (not topic or topics[i] is topic) and (not method or methods[i] is method)
					topics[i] = scopes[i] = methods[i] = null
		@

