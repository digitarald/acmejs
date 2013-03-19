
Pool = require('./pool')

# Base class for all entities
class Entity

	# tag: 'entity'

	constructor: ->
		@children = {}
		@components = {}

	toString: ->
		comps = Object.keys(@components).join(', ')
		return "Entity #{@id or ''}##{@uid} (#{comps}) [^ #{@parent}]"

	alloc: (attributes) ->
		if @parent
			@parent.children[@uid] = @
		if attributes
			for key of attributes
				attribute = attributes[key]
				switch key
					when 'children'
						for child in attribute
							Entity.alloc(@, child)
						break
					when 'id'
						@id = attribute
						break
					else
						if (pool = Pool.byTag[key])
							pool.alloc(@, attribute)
						else
							throw new Error("Unknown attribute key '#{key}', expected component. #{@}")
		@

	destroy: () ->
		@pool.destroy(@)
		for key of @components
			@components[key].destroy()
		for key of @children
			@children[key].destroy()
		@

	free: () ->
		if (refSubs = @refSubs)
			for ref in refSubs
				ref.unsub(@)
			refSubs.length = 0
		if (subs = @subs)
			for topic of subs
				subs[topic].length = 0

		if @parent
			delete @parent.children[@uid]
		@pool.free(@)
		@

	match: (selector) ->
		components = @components
		if Array.isArray(selector)
			for tag in selector
				if components[tag]
					return true
		else if components[selector]
			return true
		return false

	enable: (state, deep) ->
		@enabled = state ?= not @state
		@parent.pub((if state then 'onEnable' else 'onDisable'), @)
		for key of @components
			@components[key].enable(state, true)
		if deep
			for key of @children
				@children[key].enable(state, true)
		@

	# Pubsub
	sub: (scope = @, topic, method) ->
		subs = (@subs or= {})
		items = (subs[topic] or= [])
		items.push(scope, method)

		if scope isnt @
			refs = (scope.refSubs or= [])
			# if not ~refs.indexOf(@)
			refs.push(@)
		@

	pub: (topic, a0, a1, a2, a3) ->
		if @subs and (items = @subs[topic]) and (i = items.length)
			while (scope = items[i -= 2]) when scope.enabled
				if scope[items[i + 1] or topic](a0, a1, a2, a3) is false
					return false
		@

	pubUp: (topic, a0, a1, a2, a3) ->
		entity = @
		while entity when entity.enabled
			if entity.pub(topic, a0, a1, a2, a3) is false
				return false
			entity = entity.entity
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
				if length is 0
					items.length = 0
		@

new Pool(Entity)

class Entity.Prefab

	constructor: (@attributes) ->
		@keys = Object.keys(attributes)
		# replace null with cachable objects
		for key of attributes when not attributes[key]
			attributes[key] = {}

	alloc: (parent, attributes) ->
		defaults = @attributes
		if attributes
			for key in @keys
				value = defaults[key]
				if not attributes[key]
					attributes[key] = value
				else
					subPresets = attributes[key]
					if key is 'children' # TODO deep merge
						subPresets.unshift.apply(subPresets, value)
					else if typeof value is 'object'
						for subKey of value
							if subKey not of subPresets
								subPresets[subKey] = value[subKey]
					# FIXME: Relies on object order, use array!
					delete attributes[key] # sort after defaults
					attributes[key] = subPresets
		return Entity.alloc(parent, attributes or defaults)

module.exports = Entity
