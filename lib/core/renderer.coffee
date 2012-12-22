Composite = require('./composite')
Bounds = require('./bounds')
{Vec2} = require('./math')

class Renderer extends Composite

	constructor: (@element, client) ->
		@client = Vec2(client)
		@content = Vec2(client)

		@canvas = document.createElement('canvas')
		@element.appendChild(@canvas)
		@ctx = @canvas.getContext('2d')

		# @debug = []

		@browser = Vec2()
		@margin = Vec2()
		@pos = Vec2()
		@scale = 0
		@orientation = 'landscape'

		@buf = document.createElement('canvas')
		@bufctx = @buf.getContext('2d')

		window.addEventListener('resize', @, false)
		window.addEventListener('orientationchange', @, false)

		self = @
		# TODO: Refactor into handleEvent
		# @canvas.addEventListener('dblclick', =>
		#	self.requestFullscreen();
		# , false)
		# @lockOrientation()

		fullscreenChange = () ->
			self.fullscreenChange()
		document.addEventListener('fullscreenchange', fullscreenChange false)
		document.addEventListener('mozfullscreenchange', fullscreenChange, false)
		document.addEventListener('webkitfullscreenchange', fullscreenChange, false)

		@reflow()
		@

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

	handleEvent: ->
		@reflow()

	reflow: ->
		Vec2.set(@browser, window.innerWidth, window.innerHeight)
		scale = Math.min(@browser[0] / @content[0], @browser[1] / @content[1])
		scale = Math.clamp((scale * 2 | 0) / 2, 0.5, 3)
		if scale isnt @scale
			@scale = scale
			Vec2.scal(@content, @scale, @client)
			@buf.width = @canvas.width = @client[0]
			@buf.height = @canvas.height = @client[1]
		@alignContainer()

	alignContainer: () ->
		Vec2.scal(Vec2.sub(@browser, @client, @margin), 0.5)
		@element.style.left = @margin[0] + 'px'
		@element.style.top = @margin[1] + 'px'
		@element.style.width = @client[0] + 'px'
		@element.style.height = @client[1] + 'px'
		@

	save: ->
		@bufctx.save()
		@bufctx.translate(@pos[0] | 0 , @pos[1] | 0)
		@bufctx.clearRect(0, 0, @client[0], @client[1])
		@bufctx.scale(@scale, @scale)
		return @bufctx

	restore: ->
		@bufctx.restore()
		@ctx.clearRect(0, 0, @client[0], @client[1])
		@ctx.drawImage(@buf, 0, 0)
		@

	center: (pos) ->
		Vec2.set(
			@pos,
			pos[0] - @client[0] / 2,
			pos[0] - @client[1] / 2
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

module.exports = Renderer