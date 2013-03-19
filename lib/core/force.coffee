Component = require('./component')
Pool = require('./pool')
{Vec2} = require('./math')

cache = Vec2()

class Force extends Component

	tag: 'force'

	attributes:
		acc: Vec2()
		torque: 0

	constructor: ->
		@acc = Vec2()

	instantiate: (attributes) ->
		Vec2.copy(@acc, attributes.acc)
		{@torque} = attributes
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