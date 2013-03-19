
class Spring extends Component

	constructor: ->
		@pos = Vec2()

	alloc: (entity, pos) ->
		super(entity)
		Vec2.copy(@pos, pos)


new Pool(Spring)
