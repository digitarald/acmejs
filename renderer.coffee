
class Renderer

	constructor: (@container, client) ->
		@container = @container
		@client = Vec2(client)

		@canvas = document.createElement('canvas')
		@container.appendChild(@canvas)
		@ctx = @canvas.getContext('2d')

		# @debug = []

		@browser = Vec2()
		@content = Vec2()
		@margin = Vec2()
		@pos = Vec2()
		@scale = 1

		@buf = document.createElement('canvas')
		@bufctx = @buf.getContext('2d')

		window.addEventListener('resize', @, false)
		window.addEventListener('orientationchange', @, false)

		@reflow()

	handleEvent: ->
		@reflow()
		@

	reflow: ->
		Vec2.set(@browser, window.innerWidth, window.innerHeight)
		Vec2.scal(Vec2.copy(@content, @client), @scale)
		Vec2.scal(
			Vec2.sub(@browser, @client, @margin),
			0.5
		)

		@buf.width = @canvas.width = @client[0]
		@buf.height = @canvas.height = @client[1]
		@container.style.left = @margin[0] + 'px'
		@container.style.top = @margin[1] + 'px'
		@container.style.width = @client[0] + 'px'
		@container.style.height = @client[1] + 'px'
		@

	save: ->
		dx = @client[0] / 2
		dy = @client[1] / 2
		@bufctx.save()
		@bufctx.translate(@pos[0] | 0 , @pos[1] | 0)
		@bufctx.clearRect(0, 0, @client[0], @client[1])
		@bufctx

	restore: ->

		# i = Math.min(@debug.length, 16)
		# if i
		#	@bufctx.strokeStyle = Color.rgba(Color.gray)
		#	@bufctx.lineWidth = 1
		#	@bufctx.beginPath()
		#	while i -= 2
		#		@bufctx.moveTo(@debug[i][0] | 0, @debug[i][1] | 0)
		#		@bufctx.lineTo(
		#			(@debug[i][0] + @debug[i + 1][0]) | 0,
		#			(@debug[i][1] + @debug[i + 1][1]) | 0
		#		)
		#	@bufctx.closePath()
		#	@bufctx.stroke()
		#	@debug.length = 0

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
