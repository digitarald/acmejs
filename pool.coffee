
class Pool

	constructor: (@preinstantiate = 0, @cls) ->
		@roster = []

		i = @preinstantiate
		while i--
			@roster.push(@instantiate())

	instantiate: () ->
		return new @cls()

	alloc: () ->
		for entity in @roster when not entity.allocd
			entity.allocd = true
			entity.alloc.apply(entity, arguments)
			return entity

		@roster.push((entity = @instantiate()))
		entity.allocd = true
		entity.alloc.apply(entity, arguments)
		return entity

	update: (dt, engine) ->
		for entity in @roster when entity.allocd
			entity.update(dt, engine)
		@

	draw: (context, engine) ->
		for entity in @roster when entity.allocd
			context.save()
			entity.draw(context, engine)
			context.restore()
		@
