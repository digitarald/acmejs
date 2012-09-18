
class Pool

	@loops: ['fixedUpdate', 'simulate', 'update', 'lateUpdate', 'render']

	constructor: (@cls) ->
		@roster = []
		@name = cls.prototype.name

		@cls.pool = @

		for fn in Pool.loops
			if fn of cls
				@[fn] = cls[fn]
			else if fn of cls.prototype
				@[fn] = @forEach(fn)
			else
				continue
			Pool.stacks[fn].push(@)

		# Semantic sugar
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
		return (dt, scene) ->
			roster = @roster
			i = roster.length
			while i--
				if roster[i].enabled
					roster[i][fn](dt, scene)
			@

Pool.stacks = {}
for fn in Pool.loops
	Pool.stacks[fn] = []
