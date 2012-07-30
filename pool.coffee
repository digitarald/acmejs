
class Pool

	constructor: (create, args, instances) ->

		@create = create
		@args = args or []
		@entities = []

		while instances--
			@entities.push(@create.apply(this, @args))

		@

	next: () ->

		for entity in @entities
			if not entity.awake
				entity.wakeup.apply(entity, arguments)
				return entity

		entity = @create.apply(this, @args)
		@entities.push(entity)
		entity.wakeup.apply(entity, arguments)

		entity

	update: (delta) ->

		for entity in @entities
			if entity.awake
				entity.update(delta)
		@

	draw: (context) ->

		for entity in @entities
			if entity.awake
				context.save()
				entity.draw(context)
				context.restore()
		@
