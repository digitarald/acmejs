
Pool = require('./pool')

# Base class for all entities
class Composite

	# type: 'composite'

	constructor: ->
		@children = {}
		@components = {}

	toString: ->
		comps = Object.keys(@components).join(', ')
		return "Composite #{@name or ''}##{@uid} (#{comps}) [^ #{@parent}]"

	alloc: (presets) ->
		if @parent
			@parent.children[@uid] = @
		if presets
			for type of presets
				preset = presets[type]
				switch type
					when 'children'
						for child in preset
							Composite.alloc(@, child)
						break
					when 'name'
						@name = presets[type]
						break
					else
						if (pool = Pool.types[type])
							pool.alloc(@, preset)
						else
							throw new Error("Unknown preset key '#{type}', expected component. #{@}")
		@

	free: () ->
		if refSubs = @refSubs
			for ref in refSubs
				ref.unsub(@)
		@refSubs = @subs = null

		for key of @components
			@components[key].free()
		for key of @children
			@children[key].free()
		if @parent
			delete @parent.children[@uid]
		@pool.free(@)
		@

	enable: (state, deep) ->
		@enabled = state ?= not @state
		@parent.pub('on' + (if state then 'Enable' else 'Disable'), @)
		for key of @components
			@components[key].enable(state)
		if deep
			for key of @children
				@children[key].enable(state, true)
		@

	# Pubsub
	sub: (scope = @, topic, method) ->
		subs = @subs or= {}
		items = subs[topic] or= []
		items.push(scope, method)

		if scope isnt @
			refs = scope.refSubs or= []
			if not ~refs.indexOf(@)
				refs.push(@)
		@

	pub: (topic, a0, a1, a2, a3) ->
		if @subs and (items = @subs[topic]) and (i = items.length)
			while scope = items[i -= 2]
				scope[items[i + 1] or topic](a0, a1, a2, a3)
		@

	pubUp: (topic, a0, a1, a2, a3) ->
		comp = @
		while comp # and comp.enabled
			if comp.pub(topic, a0, a1, a2, a3) is false
				break
			comp = comp.parent
		@

	pubAll: (topic, a0, a1, a2, a3) ->
		Pool.call(topic, a0, a1, a2, a3)

	unsub: (unscope, untopic) ->
		if subs = @subs
			for topic, items of subs when (i = items.length) and (not untopic or untopic is topic)
				length = i / 2
				while (i -= 2) >= 0
					if scope = items[i]
						if unscope and scope isnt unscope
							continue
						else
							items[i]	= null
				  length--
				if not length
					items.length = 0
		@

new Pool(Composite)

class Composite.Prefab

	constructor: (@presets) ->
		# replace null with cachable objects
		for key of presets
			presets[key] = @presets[key] or {}

	alloc: (parent, presets) ->
		if (defaults = @presets) and presets
			for key of defaults
				value = defaults[key]
				if key not of presets
					presets[key] = value
				else
					subPresets = presets[key]
					if key is 'children' # TODO deep merge
						subPresets.unshift.apply(subPresets, value)
					else if typeof value is 'object'
						for subKey of value
							if subKey not of subPresets
								subPresets[subKey] = value[subKey]
					# FIXME: Relies on object order, use array!
					delete presets[key] # sort after defaults
					presets[key] = subPresets
		return Composite.alloc(parent, presets or defaults)

module.exports = Composite
