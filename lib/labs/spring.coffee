
class Spring extends Component

	constructor: ->
		@pos = Vec2()

	alloc: (parent, pos) ->
		super(parent)
		Vec2.copy(@pos, pos)


new Pool(Spring)
