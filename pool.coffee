
class Pool

	@methodNames: ['fixedUpdate', 'simulate', 'update', 'lateUpdate', 'render']

	@methodRegx: /^(?:on|did)[A-Z]/

	@byMethod: {}

	constructor: (@cls) ->
		@roster = []
		proto = cls.prototype
		@name = proto.name
		@cls.pool = @

		names = Pool.methodNames
		for fn in Object.keys(proto).concat(Object.keys(cls))
			if Pool.methodRegx.test(fn) and names.indexOf(fn) is -1
				names.push(fn)

		for fn in names
			if fn of cls
				@[fn] = cls[fn]
			else if fn of cls.prototype
				@[fn] = @forEach(fn)
			else
				continue
			Pool.byMethod[fn].push(@)

		# Semantic su1gar
		cls.alloc = =>
			return @.alloc.apply(@, arguments)

	toString: ->
		return 'Pool ' + @name + '[' + @roster.length + ']'

	preinstantiate: (i) ->
		while i--
			@roster.push(@instantiate())
		@

	instantiate: () ->
		return new @cls()

	alloc: () ->
		roster = @roster
		i = roster.length
		while i--
			if not roster[i].enabled
				entity = roster[i]
				break

		if not entity
			roster.push((entity = @instantiate()))

		entity.enabled = entity.allocd = true
		entity.alloc.apply(entity, arguments)
		return entity

	forEach: (fn) ->
		return (a0, a1, a2, a3, a4, a5, a6, a7) ->
			roster = @roster
			i = roster.length
			while i-- when roster[i].enabled
				roster[i][fn](a0, a1, a2, a3)
			@

for fn in Pool.methodNames
	Pool.byMethod[fn] = []

Pool.call = (fn, a0, a1, a2, a3) ->
	stack = @byMethod[fn]
	i = stack.length
	while i--
		stack[i][fn](a0, a1, a2, a3)


