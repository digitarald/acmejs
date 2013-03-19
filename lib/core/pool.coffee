
require('./math')

class Pool

	@typedHooks: ['fixedUpdate', 'simulate', 'update', 'postUpdate', 'preRender', 'render']

	@regxHook: /^on[A-Z]/

	@regxGetter: /^get[A-Z]/

	@hooks: {}

	@byTag: {}

	@defaults: {}

	@order:
		render: false

	toString: ->
		return "Pool {@tag} [#{@allocd} / #{@register.length}]"

	constructor: (@cls) ->
		proto = cls.prototype
		proto.pool = @
		cls.pool = @
		@register = []
		@subs = []
		@hooks = []
		@enabled = false
		@allocd = 0

		@tag = proto.tag
		if @tag
			Pool.byTag[@tag] = @
		@isComponent = @tag and @tag isnt 'entity'
		@light = (not @isComponent) or proto.light or false
		@layer = proto.layer or cls.layer or 0

		if @isComponent
			if not @light
				types = Pool.typedHooks
				keys = Object.keys(proto).concat(Object.keys(cls))

				# Discover new event hooks
				for fn in keys
					if Pool.regxHook.test(fn)
						if not ~types.indexOf(fn)
							types.push(fn)
							Pool.hooks[fn] = []
						@subs.push(fn)
					else if Pool.regxGetter.test(fn)
						key = fn.substr(3, 1).toLowerCase() + fn.substr(4)
						Pool.defineGetter(proto, key, fn)

				for fn in types
					if fn of cls
						@[fn] = cls[fn]
						Pool.hooks[fn].push(@)
					else if fn of proto
						@hooks.push(fn)

		# Semantic sugar
		cls.alloc = (parent, attributes) =>
			return @alloc(parent, attributes)

	preinstantiate: (i) ->
		while i--
			@instantiate()
		@

	instantiate: () ->
		cls = new @cls()
		@register.push(cls)
		for hook in @hooks
			Pool.hooks[hook].push(cls)
		return cls

	alloc: (parent, attributes) ->
		# Find or create an entity
		register = @register
		i = register.length
		while i--
			if not register[i].allocd
				entity = register[i]
				break
		if not entity
			entity = @instantiate()
		@allocd++
		@enabled = true

		# Set up entity
		entity.uid = uid = Math.uid()
		entity.enabled = true
		entity.allocd = true
		entity.parent = parent or null
		entity.root = parent and parent.root or parent or entity

		# Extra treatment for components, giving them their attributes
		if @isComponent
			# Set order flag if hooks are ordered
			for hook in @hooks
				if Pool.order[hook]?
					Pool.order[hook] = true

			entity.layer = (parent and parent.layer or 0) + @layer + 2 - 1 / uid
			if (defaults = entity.attributes)
				if attributes and not attributes._merged
					if attributes.__proto__
						attributes.__proto__ = defaults
					else
						for key of defaults when not key of attributes
							attributes[key] = defaults[key]
					attributes._merged = true # default once
			for topic in @subs
				parent.sub(entity, topic)
		entity.alloc(attributes or defaults or null)
		return entity

	destroy: (entity) ->
		entity.enabled = false
		Pool.hooks.free.push(entity)
		@

	free: (entity) ->
		entity.allocd = false
		entity.uid = null
		entity.root = null
		entity.parent = null
		@enabled = (@allocd-- > 1)
		@

	invoke: (fn, a0, a1, a2, a3) ->
		stack = @register
		i = @register.length
		while i-- when stack[i].enabled
			stack[i][fn](a0, a1, a2, a3)
		@

Pool.hooks.free = []
for fn in Pool.typedHooks
	Pool.hooks[fn] = []

Pool.dump = (flush) ->
	for tag, pool of Pool.byTag
		console.log("%s: %d/%d allocd", tag, pool.allocd, pool.register.length)
	if flush
		Pool.flush()
	null

Pool.defineGetter = (proto, key, fn) ->
	Object.defineProperty(proto, key,
		get: proto[fn]
		enumerable: true
		configurable: true
	)
	proto

Pool.free = () ->
	stack = @hooks.free
	for item in stack
		item.free()
	stack.length = 0
	@

Pool.flush = () ->
	for tag, pool of Pool.byTag
		register = pool.register
		i = register.length
		freed = 0
		while i-- when not register[i].allocd
			register.splice(i, 1)
			freed++
		console.log("%s: %d/%d flushed", tag, freed, pool.register.length)
	@

Pool.invoke = (fn, a0, a1, a2, a3) ->
	if (stack = @hooks[fn]) and (i = stack.length)
		if Pool.order[fn]
			stack.sort(Pool.orderFn)
			Pool.order[fn] = false
		while i-- when stack[i].enabled
			stack[i][fn](a0, a1, a2, a3)
	@

Pool.orderFn = (a, b) ->
	return b.layer - a.layer

module.exports = Pool
