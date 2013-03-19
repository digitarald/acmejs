Component = require('./component')
Pool = require('./pool')
{Vec2, Mat2} = require('./math')

class Transform extends Component

	tag: 'transform'

	attributes:
		pos: Vec2() # TODO: rename to translate
		angle: 0 # TODO: rename to rotate
		# scale: Vec2(1, 1)
		alpha: 1

	constructor: () ->
		@pos = Vec2()
		# @scale = Vec2()
		@matrix = Mat2()

	instantiate: (attributes) ->
		{@angle, @alpha} = attributes
		Vec2.copy(@pos, attributes.pos)
		# Vec2.copy(@scale, attributes.scale)
		@

	setTransform: (pos, angle, silent) ->
		if pos?
			Vec2.copy(@pos, pos)
		if angle?
			@angle = angle
		@dirty = true
		if not silent
			@entity.pub('onTransform', @pos, @angle)
		@

	applyMatrix: (ctx) ->
		# mat = Mat2.trans(Mat2.identity, @pos, @matrix)
		# ctx.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5])
		if Vec2.lenSq(@pos)
			ctx.translate(@pos[0] | 0, @pos[1] | 0)
		# if (x = @scale[0]) isnt 1 or (y = @scale[1]) isnt 1
		#	ctx.scale(x, y)
		if @angle
			ctx.rotate(@angle)
		@

new Pool(Transform)

module.exports = Transform
