Component = require('./component')
Pool = require('./pool')
{Vec2} = require('./math')

class Jitter extends Component

	type: 'jitter'

	presets:
		factor: 0.8
		force: 1000

	reset: (presets) ->
		{@factor, @force} = presets
		@

	fixedUpdate: (dt) ->
		if Math.chance(@factor)
			rand = Vec2.set(
				Vec2.cache[0],
				Math.rand(-@force, @force),
				Math.rand(-@force, @force)
			)
			Vec2.add(@parent.kinetic.acc, rand)

new Pool(Jitter)

module.exports = Jitter