
class Pool

	constructor: (@allocate, @instances = 0) ->
		@entities = []

		while @instances--
			@entities.push(@allocate())

	acquire: () ->
		for entity in @entities
			if not entity.acquired
				entity.acquire.apply(entity, arguments)
				return entity

		entity = @allocate()
		@entities.push(entity)
		entity.acquire.apply(entity, arguments)

		entity

	update: (delta) ->
		for entity in @entities when entity.acquired
			entity.update(delta)
		@

	draw: (context) ->
		for entity in @entities when entity.acquired
			context.save()
			entity.draw(context)
			context.restore()
		@
