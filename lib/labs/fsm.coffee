
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

	start: (type) ->
		@state = type
		@

	add: (state) ->
		@states[@state.type] = @state
		@

	set: (toName) ->
		to = @states[toName]
		@

	get: (type) ->
		return @state


# Events: enter, exit
class Fsm.State

	from: {}
	children: {}

	constructor: (@fsm, @type, options = {}) ->
		@parent = options.parent or null
		for state in options.from or []
			@from[state] = true

		parent = @parent
		if parent
			@from[@type] = parent.children[@type] = true
