Component = require('./component')
Pool = require('./pool')
{Vec2} = require('./math')

# http://rocketmandevelopment.com/2010/06/11/steering-behaviors-seeking/
class Seek extends Component

	type: 'seek'

	presets:
		targets: null

	reset: (presets) ->
		{@targets} = presets
		@roster = Pool.types[@targets]
		@

	fixedUpdate: (dt) ->
		@

new Pool(Seek)

module.exports = Seek
