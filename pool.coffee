
class Pool

	constructor: (@preallocate = 0) ->
		@buffer = []

		i = @preallocate
		while i--
			@buffer.push(@allocate())

	acquire: () ->
		for entity in @buffer
			if not entity.acquired
				entity.acquire.apply(entity, arguments)
				return entity

		@buffer.push((entity = @allocate()))
		entity.acquire.apply(entity, arguments)
		return entity

	update: (delta) ->
		for entity in @buffer when entity.acquired
			entity.update(delta)
		@

	draw: (context) ->
		for entity in @buffer when entity.acquired
			context.save()
			entity.draw(context)
			context.restore()
		@
