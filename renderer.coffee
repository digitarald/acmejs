
class Renderer

	constructor: (id) ->
		@canvas = document.getElementById(id)
		@context = @canvas.getContext('2d')

		@center = Vec2()
		@size = Vec2(@canvas.width, @canvas.height)

		@offscreen = document.createElement('canvas')
		@offscreen.width = @size[0]
		@offscreen.height = @size[1]
		@offcontext = @offscreen.getContext('2d')

	save: () ->
		dx = @size[0] / 2
		dy = @size[1] / 2
		@offcontext.save()
		@offcontext.translate(-@center[0] + dx , -@center[1] + dy)
		@offcontext.clearRect(-dx, -dy, @size[0], @size[1])
		@offcontext

	restore: () ->
		@offcontext.restore()
		@context.clearRect(0, 0, @size[0], @size[1])
		@context.drawImage(@offscreen, 0, 0)

	setCenter: (x, y) ->
		Vec2.set(@center, x | 0, y | 0)
		@
