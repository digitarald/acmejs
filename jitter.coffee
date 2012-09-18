
class Jitter extends Component

	name: 'jitter'

	alloc: (parent, @factor = 0.8, @force = 1000) ->
		super(parent)

	fixedUpdate: (dt) ->
		if Math.randomBool(@factor)
			rand = Vec2.set(
				Vec2.cache[0],
				Math.randomFloat(-@force, @force),
				Math.randomFloat(-@force, @force)
			)
			Vec2.add(@parent.kinetic.acc, rand)

new Pool(Jitter)