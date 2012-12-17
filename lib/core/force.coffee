Component = require('./component')
Pool = require('./pool')
{Vec2} = require('./math')

class Force extends Component

	type: 'force'

	presets:
		force: Vec2()
		torque: 0

	constructor: ->
		@force = Vec2()

	reset: (presets) ->
		Vec2.copy(@force, presets.force)
		{@torque} = presets
		@age = 0
		@

	simulate: (dt) ->
		Vec2.add(@kinetic.acc, @force)
		@

new Pool(Force)

module.exports = Force