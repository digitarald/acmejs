Component = require('./component')
Pool = require('./pool')
{Vec2} = require('./math')

# http://rocketmandevelopment.com/2010/06/11/steering-behaviors-seeking/
class Seek extends Component

	tag: 'seek'

	attributes:
		targets: null

	instantiate: (attributes) ->
		{@targets} = attributes
		@register = Pool.byTag[@targets]
		@

	fixedUpdate: (dt) ->
		@

new Pool(Seek)

module.exports = Seek
