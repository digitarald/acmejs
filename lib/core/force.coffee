Component = require('./component')
Pool = require('./pool')
{Vec2} = require('./math')

cache = Vec2()

class Force extends Component

	type: 'force'

	presets:
		acc: Vec2()
		torque: 0

	constructor: ->
		@acc = Vec2()

	reset: (presets) ->
		Vec2.copy(@acc, presets.acc)
		{@torque} = presets
		@age = 0
		@

	add: (acc) ->
		Vec2.add(@acc, acc)
		@

	simulate: (dt) ->
		Vec2.add(@kinetic.acc, @acc)
		@

new Pool(Force)

module.exports = Force