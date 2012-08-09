
class Renderer

	constructor: (id) ->
		@canvas = document.getElementById(id)
		@context = @canvas.getContext('2d')
		@center = Vec2()

		@size = Vec2(@canvas.width, @canvas.height)

	clear: () ->
		dx = @size[0] / 2
		dy = @size[1] / 2
		@context.translate(-@center[0] + dx , -@center[1] + dy)
		@context.clearRect(-dx, -dy, @size[0], @size[1])
		@

	setCenter: (x, y) ->
		@center.set(Math.floor(x), Math.floor(y))
		@
