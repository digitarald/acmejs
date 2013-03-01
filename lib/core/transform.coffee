Component = require('./component')
Pool = require('./pool')
{Vec2} = require('./math')

class Transform extends Component

	type: 'transform'

	presets:
		pos: Vec2()
		angle: 0

	constructor: () ->
		@pos = Vec2()

	reset: (presets) ->
		Vec2.copy(@pos, presets.pos)
		@worldAngle = @angle = presets.angle
		@

	setTransform: (pos, angle, silent) ->
		if pos?
			Vec2.copy(@pos, pos)
		if angle?
			@angle = angle
		@dirty = true
		if not silent
			@parent.pub('onTransform', @pos, @angle)
		@

	toWorld: () ->
		# composit = @parent
		# while composit = composit.parent …
		@worldPos.copy(@pos)
		@worldAngle = @angle
		@

	applyMatrix: (ctx) ->
		ctx.translate(@pos[0] | 0, @pos[1] | 0)
		if @angle
			ctx.rotate(@angle)
		@

new Pool(Transform)

module.exports = Transform
