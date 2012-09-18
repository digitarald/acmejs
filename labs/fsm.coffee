
# set -> validate from/to on whole path -> fire events in the whole path

class Fsm

	constructor: () ->
		@states = {}

	alloc: (parent) ->
		parent.sm = @
		parent.pubsub.sub(@, 'free')
		@parent = parent
		@

	free: ->
		@allocd = false
		@parent.pubsub.unsub(@)
		@parent = @parent.sm = null
		@

	start: (name) ->
		@state = name
		@

	add: (state) ->
		@states[@state.name] = @state
		@

	set: (toName) ->
		to = @states[toName]
		@

	get: (name) ->
		return @state


# Events: enter, exit
class Fsm.State

	from: {}
	children: {}

	constructor: (@fsm, @name, options = {}) ->
		@parent = options.parent or null
		for state in options.from or []
			@from[state] = true

		parent = @parent
		if parent
			@from[@name] = parent.children[@name] = true
