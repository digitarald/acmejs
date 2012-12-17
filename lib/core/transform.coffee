Component = require('./component')
Pool = require('./pool')
{Vec2} = require('./math')

class Transform extends Component

	type: 'transform'

	presets:
		pos: Vec2()
		# angle: 0

	constructor: () ->
		@pos = Vec2()
		# @worldPos = Vec2()

	reset: (presets) ->
		Vec2.copy(@pos, presets.pos)
		# @worldAngle = @angle = presets.angle
		# @dirty = false
		@

	toWorld: () ->
		# composit = @parent
		# while composit = composit.parent …
		@worldPos.copy(@pos)
		@worldAngle = @angle
		@

	transform: (ctx) ->
		ctx.translate(@pos[0] | 0, @pos[1] | 0)
		# if @angle
		#	ctx.rotate(@angle)
		@

new Pool(Transform)

module.exports = Transform
