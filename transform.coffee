
class Transform extends Component

	name: 'transform'

	constructor: () ->
		super()
		@pos = Vec2()

	alloc: (parent, pos) ->
		super(parent)
		Vec2.copy(@pos, pos)
		@rotation = 0
		@

new Pool(Transform)
