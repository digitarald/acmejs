
class Sprite

	constructor: (srcOrReflow, @size = Vec2()) ->
		@offsetDefault = Vec2()
		@buffer = document.createElement('canvas')
		@bufferCtx = @buffer.getContext('2d')
		@scale = -1

		switch typeof srcOrReflow
			when 'string'
				@img = img = new Image()
				img.onload = () =>
					if not img.onload
						return
					img.onload = null
					Vec2.set(@size, img.width, img.height)
					@refresh()

				img.src = srcOrReflow
				if img.onload and img.complete
					img.onload()
				break
			when 'function'
				@reflow = srcOrReflow
				@refresh()
				break

	draw: (ctx, to, crop = @size, offset = @offsetDefault) ->
		if @ready
			ctx.drawImage(@buffer,
				offset[0], offset[1],
				crop[0], crop[1],
				to[0] | 0, to[1] | 0,
				crop[0], crop[1]
			)
		@

	reflow: (ctx, scale) ->
		width = @img.width = @size[0] * scale | 0
		height = @img.height = @size[1] * scale | 0

		ctx.clearRect(0, 0, width, height)
		ctx.drawImage(@img, 0, 0, width, height)
		if scale isnt 1
			data = ctx.getImageData(0, 0, width, height).data
			for x in [0..width] by 1
				for y in [0..height] by 1
					i = (y * width + x) * 4
					ctx.fillStyle = "rgba(#{data[i]}, #{data[i+1]}, #{data[i+2]}, #{data[i+3] / 255})"
					ctx.fillRect(x * scale, y * scale , scale, scale)
		@

	refresh: (ctx, scale = 1) ->
		if @scale isnt scale
			@scale = scale
			@buffer.width = @size[0] * scale
			@buffer.height = @size[1] * scale
			@reflow(@bufferCtx, scale)
			@ready = true
		@
