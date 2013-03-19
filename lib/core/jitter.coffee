Component = require('./component')
Pool = require('./pool')
{Vec2} = require('./math')

class Jitter extends Component

	tag: 'jitter'

	attributes:
		factor: 0.8
		force: 1000

	instantiate: (attributes) ->
		{@factor, @force} = attributes
		@

	fixedUpdate: (dt) ->
		if Math.chance(@factor)
			rand = Vec2.set(
				Vec2.cache[0],
				Math.rand(-@force, @force),
				Math.rand(-@force, @force)
			)
			Vec2.add(@entity.kinetic.acc, rand)

new Pool(Jitter)

module.exports = Jitter