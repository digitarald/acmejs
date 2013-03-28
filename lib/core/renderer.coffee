Entity = require('./entity')
Bounds = require('./bounds')
{Vec2} = require('./math')
Color = require('./color')

class Renderer extends Entity

	constructor: (@element, size) ->
		@size = Vec2(size)
		@content = Vec2(size)

		@canvas = document.createElement('canvas')
		@element.appendChild(@canvas)
		@ctx = @canvas.getContext('2d')

		@browser = Vec2()
		@margin = Vec2()
		@pos = Vec2()
		@scale = 0
		@orientation = 'landscape'

		@buffer = false
		if @buffer
			@buf = document.createElement('canvas')
			@bufctx = @buf.getContext('2d')
			@buf.width = @content[0]
			@buf.height = @content[1]
		@canvas.width = @content[0]
		@canvas.height = @content[1]
		@element.style.width = @content[0] + 'px'
		@element.style.height = @content[1] + 'px'

		window.addEventListener('resize', @, false)

		document.addEventListener('fullscreenchange', @, false)
		document.addEventListener('mozfullscreenchange', @, false)
		document.addEventListener('webkitfullscreenchange', @, false)

		@reflow()
		@

	handleEvent: (evt) ->
		if ~evt.type.indexOf('fullscreenchange')
			@fullscreenChange()
		else
			@reflow()
		@

	reflow: ->
		browser = Vec2.set(@browser, window.innerWidth, window.innerHeight)
		scale = Math.min(@browser[0] / @content[0], @browser[1] / @content[1])
		# scale = Math.clamp((scale * 2 | 0) / 2, 0.5, 2)
		if scale isnt @scale
			@scale = scale
			Vec2.scal(@content, @scale, @size)

		Vec2.scal(Vec2.sub(browser, @size, @margin), 0.5)
		# TODO: Only works for scale >= 1
		rule = "translate(#{@margin[0]}px, #{@margin[1]}px) scale(#{@scale})"
		@element.style.transform = rule
		@element.style.webkitTransform = rule
		@

	save: ->
		ctx = if @buffer then @bufctx else @ctx
		if @color
			ctx.fillStyle = Color.rgba(@color)
			ctx.fillRect(0, 0, @content[0], @content[1])
		else
			ctx.clearRect(0, 0, @content[0], @content[1])
		# ctx.width = @size[0] | 0
		# ctx.save()
		# ctx.translate(@pos[0] | 0 , @pos[1] | 0)
		# ctx.scale(@scale, @scale)
		ctx

	restore: ->
		if @buffer
			# @bufctx.restore()
			@ctx.clearRect(0, 0, @content[0], @content[1])
			@ctx.drawImage(@buf, 0, 0)
		# else
		#	@ctx.restore()
		# @canvas.offsetTop # force draw
		@

	center: (pos) ->
		Vec2.set(
			@pos,
			pos[0] - @size[0] / 2,
			pos[0] - @size[1] / 2
		)
		@

	cull: (entity) ->
		if not (bounds = entity.bounds)
			return false # check point?
		if bounds.withinRect(@pos, @content)
			if bounds.culled
				bounds.culled = false
			return false
		if not bounds.culled
			bounds.culled = true
		return true

	isFullscreen: () ->
		doc = document
		return doc.fullscreen or doc.mozFullScreen or doc.webkitIsFullScreen

	requestFullscreen: () ->
		if not @isFullscreen()
			target = @element.parentNode
			if 'webkitRequestFullScreen' of target
				target.webkitRequestFullScreen()
			else if 'mozRequestFullScreen' of target
				target.mozRequestFullScreen()
		@

	fullscreenChange: () ->
		if @orientation
			@lockOrientation(@orientation)
		@

	lockOrientation: (format = @orientation) ->
		target = window.screen
		if 'lockOrientation' of target
			screen.lockOrientation(format)
		else if 'mozLockOrientation' of target
			screen.mozLockOrientation(format)
		@

module.exports = Renderer
