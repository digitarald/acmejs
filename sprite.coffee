{Vec2} = require('./math')
Component = require('./component')
Pool = require('./pool')

class SpriteAsset

	constructor: (srcOrRepaint, size, @baseScale = 1) ->
		@size = Vec2(size)
		@bufferSize = Vec2(size)
		@defaultOffset = Vec2()
		@defaultMargin = Vec2()

		@buffer = document.createElement('canvas')
		@bufferCtx = @buffer.getContext('2d')
		@scale = 1

		switch typeof srcOrRepaint
			when 'string'
				@img = img = new Image()
				img.onload = () =>
					if not img.onload
						return
					img.onload = null
					Vec2.set(@size, img.width, img.height)
					@refresh()

				img.src = srcOrRepaint
				if img.onload and img.complete
					img.onload()
				break
			when 'function'
				@repaint = srcOrRepaint
				@refresh()
				break

	draw: (ctx, pos = @defaultOffset, crop = @bufferSize, offset = @defaultMargin) ->
		if @ready
			ctx.drawImage(@buffer,
				offset[0] | 0, offset[1] | 0,
				crop[0], crop[1],
				pos[0] | 0, pos[1] | 0,
				crop[0], crop[1]
			)
		@

	repaint: () ->
		size = @size
		@buffer.width = size[0]
		@buffer.height = size[1]
		@bufferCtx.drawImage(@img, 0, 0, size[0], size[1])
		@sample()
		@

	sample: () ->
		console.log('sample')
		{scale, size, bufferCtx} = @
		data = bufferCtx.getImageData(0, 0, size[0], size[1]).data
		@buffer.width = @bufferSize[0]
		@buffer.height = @bufferSize[1]

		for x in [0..size[0]] by 1
			for y in [0..size[1]] by 1
				i = (y * size[0] + x) * 4
				bufferCtx.fillStyle = "rgba(#{data[i]}, #{data[i+1]}, #{data[i+2]}, #{data[i+3] / 255})"
				bufferCtx.fillRect(x * scale, y * scale , scale, scale)
		@

	refresh: (scale) ->
		scale = (scale or 1) * @baseScale
		if not @ready or @scale isnt scale
			@scale = scale
			@buffer.width = @bufferSize[0] = @size[0] * scale | 0
			@buffer.height = @bufferSize[1] = @size[1] * scale | 0
			Vec2.scal(@bufferSize, -0.5, @defaultOffset)
			@repaint(@bufferCtx, scale)
			@ready = true
		@

class SpriteTween extends Component

	type: 'spriteTween'

	presets:
		align: Vec2.center

	reset: (presets) ->
		{@align, @asset} = presets
		@

	render: (ctx) ->
		if not @asset.ready
			return @
		ctx.save()
		@parent.transform.transform(ctx)
		@asset.draw(ctx)
		ctx.restore()
		@

new Pool(SpriteTween)

module.exports.Asset = SpriteAsset
module.exports.Tween = SpriteTween
