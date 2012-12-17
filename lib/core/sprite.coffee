{Vec2} = require('./math')
Component = require('./component')
Pool = require('./pool')

class SpriteAsset

	constructor: (srcOrRepaint, size, @baseScale = 1) ->
		@size = Vec2(size)
		@bufferSize = Vec2(size)
		@defaultAlign = Vec2.center
		@defaultOffset = Vec2()
		@defaultScale = Vec2(1, 1)

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
				if img.onload and img.width and img.height # no luck with .complete :(
					img.onload()
				break
			when 'function'
				@repaint = srcOrRepaint
				@refresh()
				break

	draw: (ctx, align = @defaultAlign, size = @bufferSize, fromPos = @defaultOffset, scale = @defaultScale) ->
		if @ready
			# debugger
			ctx.drawImage(@buffer,
				fromPos[0] | 0, fromPos[1] | 0,
				size[0], size[1],
				size[0] / 2 * (align[0] + 1) | 0, size[1] / 2 * (align[1] + 1) | 0
				size[0] * scale[0], size[1] * scale[1]
			)
		@

	repaint: () ->
		size = @size
		@buffer.width = size[0]
		@buffer.height = size[1]
		@bufferCtx.drawImage(@img, 0, 0, size[0], size[1])
		@sample()
		@

	# Nearest-neighbour sampling
	sample: () ->
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

		# TODO: Add flip
		# https://github.com/CreateJS/EaselJS/blob/master/src/easeljs/utils/SpriteSheetUtils.js

class SpriteSheet

	constructor: (presets) ->
		sprites = presets.sprites or []
		@sprites = if Array.isArray(sprites) then sprites else [sprites]

		@frames = []
		if Array.isArray(presets.frames)
			for frame in presets.frames
				# TODO: Convert pos, size, align to Float32Array
				@frames.push(frame)

		@defaults = {}
		@defaults.speed ?= presets.speed or 0.2
		@defaults.size ?= presets.size or Vec2(1, 1)
		@defaults.align ?= presets.align or Vec2.center

		@sequences = {}
		sequences = presets.sequences or {}
		for id of sequences
			@addSequence(id, sequences[id])
		# console.log('SpriteSheet: ', @);

	addSequence: (id, sequence) ->
		# console.log('SpriteSheet.addSequence: %s', id);
		if Array.isArray(sequence)
			frames = []
			for frame in [sequence[0]..sequence[1]] by 1
				frames.push(frame)
			sequence =
				frames: frames
				next: sequence[2] or null
				speed: sequence[3] or @defaults.speed
				name: id
				sprite: sequence[4] or 0
		if sequence.next is true
			sequence.next = id
		if not sequence.speed
			sequence.speed = @defaults.speed
		@sequences[id] = sequence
		if not @defaultSequence
			@defaultSequence = id
		@

	prepare: () ->
		sprites = @sprites
		for sprite in sprites when not sprite.ready
			return false
		# console.log('SpriteSheet.draw: preparing!')
		if not @frames.length
			{size, align} = @defaults
			for sprite in sprites
				cols = sprite.size[0] / size[0] | 0
				rows = sprite.size[1] / size[1] | 0
				for y in [0..rows - 1] by 1
					for x in [0..cols - 1] by 1
						@frames.push(
							sprite: sprite
							pos: Vec2(x * size[0], y * size[1]),
							size: size,
							align: align or Vec2.center
						)
		# debugger
		@ready = true
		@

	draw: (ctx, frame) ->
		if not @ready and not @prepare()
			# console.log('SpriteSheet.draw: unprepared');
			return @
		frame = @frames[frame or 0]
		frame.sprite.draw(ctx, frame.align, frame.size, frame.pos)
		# debugger
		@


class SpriteTween extends Component

	type: 'spriteTween'

	presets:
		asset: null
		speed: null
		sequence: null
		offset: 0
		composite: null

	reset: (presets) ->
		{@asset, @composite} = presets
		@isSheet = @asset instanceof SpriteSheet
		if @isSheet
			@frame = 0
			{@sequence, @speed} = presets
			@speed ?= @asset.defaults.speed
			@dtime = presets.offset
			if not @sequence
				@sequence = @asset.defaultSequence
		@

	render: (ctx, dt) ->
		# TODO: align
		ctx.save()
		@parent.transform.transform(ctx)
		if @composite
			ctx.globalCompositeOperation = @composite
		# debugger
		if @isSheet
			if not @paused
				dtime = (@dtime += dt)
				@normalize()

			@asset.draw(ctx, @frame)
		else
			@asset.draw(ctx)
		ctx.restore()
		@

	normalize: () ->
		# console.log('SpriteTween.normalize');
		dtime = @dtime
		if @sequence
			sequence = @asset.sequences[@sequence]
			speed = sequence.speed
			frames = sequence.frames
			frameCount = frames.length
			if dtime >= (frameCount) * speed
				if sequence.next
					if sequence.next isnt @sequence
						return @goto(sequence.next)
				else
					@pause()
					return @
				dtime = dtime % (frameCount * speed)
			@frame = frames[dtime / speed | 0]
		else
			frames = @asset.frames
			frameCount = frames.length
			speed = @speed
			dtime = dtime % (frameCount * speed)
			@frame = dtime / speed | 0
		# debugger
		@

	pause: () ->
		@paused = true

	play: () ->
		@paused = false

	goto: (id) ->
		if isNaN(id)
			@dtime = 0
			if sequence = @asset.sequences[@sequence]
				@sequence = id
		else
			@sequence = null
			@frameIndex = id
		@normalize()


new Pool(SpriteTween)

module.exports.Asset = SpriteAsset
module.exports.Tween = SpriteTween
module.exports.Sheet = SpriteSheet
