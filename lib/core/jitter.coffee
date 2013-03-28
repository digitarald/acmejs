Component = require('./component')
Pool = require('./pool')
{Vec2} = require('./math')

cache = Vec2()

class Jitter extends Component

	tag: 'jitter'

	attributes:
		factor: 0.2
		force: 300

	instantiate: (attributes) ->
		{@factor, @force} = attributes
		@

	fixedUpdate: (dt) ->
		if Math.chance(@factor)
			@entity.kinetic.applyImpulse(Vec2.set(
				cache,
				Math.rand(-@force, @force),
				Math.rand(-@force, @force)
			))
		@

new Pool(Jitter)

module.exports = Jitter