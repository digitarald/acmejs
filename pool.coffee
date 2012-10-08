
require('./math')

class Pool

	@typedHooks: ['fixedUpdate', 'simulate', 'update', 'lateUpdate', 'render']

	@hookRegx: /^on[A-Z]/

	@hooks: {}

	@types: {}

	@defaults: {}

	@order:
		render: false

	toString: ->
		return "Pool {@type} [#{@roster.length}]"

	constructor: (@cls) ->
		@roster = []
		@subs = []
		@hooks = []
		@enabled = false
		@allocd = 0
		proto = cls.prototype
		@type = proto.type
		@dirty = false
		@extended = @type and @type isnt 'composite'
		Pool.types[@type] = @
		proto.pool = @
		cls.pool = @

		if @extended
			types = Pool.typedHooks
			keys = Object.keys(proto).concat(Object.keys(cls))

			# Discover new event hooks
			for fn in keys
				if Pool.hookRegx.test(fn)
					if not ~types.indexOf(fn)
						types.push(fn)
						Pool.hooks[fn] = []
					@subs.push(fn)
				# else if typeof keys[fn] isnt 'function'
				# 	# console.log(fn, keys[fn])
				# 	fn

			for fn in types
				if fn of cls
					@[fn] = cls[fn]
					Pool.hooks[fn].push(@)
				else if fn of proto
					@hooks.push(fn)

		# Semantic sugar
		cls.alloc = (parent, presets) =>
			return @alloc(parent, presets)

	preinstantiate: (i) ->
		while i--
			@instantiate()
		@

	instantiate: () ->
		cls = new @cls()
		@roster.push(cls)
		for hook in @hooks
			Pool.hooks[hook].push(cls)
		return cls

	alloc: (parent, presets) ->
		roster = @roster
		i = roster.length
		while i--
			if not roster[i].allocd
				entity = roster[i]
				break
		if not entity
			entity = @instantiate()
		@allocd++
		@enabled = true
		if fn of Pool.order
			Pool.order[fn] = true
		entity.uid = Math.uid()
		entity.enabled = true
		entity.allocd = true
		entity.parent = parent
		entity.root = parent.root or parent or entity
		entity.layer = (parent and parent.layer or -1) + 1 + (entity.layer or 0)

		if @extended
			if defaults = entity.presets
				# console.log('defaultKeys', defaultKeys)
				if presets and not presets._merged
					# for key in defaultKeys
					#	if key not of presets
					#		presets[key] = defaults[key]
					presets.__proto__ = defaults
					presets._merged = true # default once
			for topic in @subs
				parent.sub(entity, topic)
		entity.alloc(presets or defaults or null)
		return entity

	free: (entity) ->
		@enabled = (@allocd-- > 1)
		entity.enabled = false
		entity.allocd = false
		entity.uid = null
		entity.root = null
		entity.parent = null

for fn in Pool.typedHooks
	Pool.hooks[fn] = []

Pool.invoke = (fn, a0, a1, a2, a3) ->
	if (stack = @hooks[fn]) and (i = stack.length)
		if fn of Pool.order and Pool.order[fn]
			stack.sort(Pool.orderFn)
			Pool.order[fn] = false
		while i-- when stack[i].enabled
			stack[i][fn](a0, a1, a2, a3)
	@

Pool.orderFn = (a, b) ->
	return (b.layer - a.layer) or (a.uid < b.uid)

module.exports = Pool
