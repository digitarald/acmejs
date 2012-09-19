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
		if subs = @subs
			for topic of @subs
				@subs[topic].length = 0

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
		subs = @subs or (@subs = {})
		items = subs[topic] or (subs[topic] = [])
		items.push(scope, method)

		refs = scope.refPubs or (scope.refPubs = [])
		if refs.indexOf(@) isnt -1
			refs.push(@)
		@

	pub: (topic, a0, a1, a2, a3, a4, a5, a6, a7) ->
		if @subs and items = @subs[topic] and i = items.length
			while i -= 2 when scope = items[i]
				scope[items[i + 1] or topic](a0, a1, a2, a3, a4, a5, a6, a7)
		@

	unsub: (unscope, untopic) ->
		if subs = @subs
			for topic, items of subs when (i = items.length) and (not untopic or untopic is topic)
				length = i / 2
				while i -= 2
					if scope = items[i]
						if unscope and scope isnt unscope
							continue
						else
							items[i]	= null
				  length--
				if not length
					items.length = 0
		@

