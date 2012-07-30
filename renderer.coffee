
class Renderer

	constructor: (id) ->
		@canvas = document.getElementById(id)
		@context = @canvas.getContext('2d')
		@center = Vec2()

		@size = Vec2(@canvas.width, @canvas.height)

	clear: () ->
		@canvas.width = @size[0]
		@context.setTransform(1, 0, 0, 1, -@center[0] + @size[0] / 2 , -@center[1] + @size[1] / 2)
		@

	setCenter: (x, y) ->
		@center.set(Math.floor(x), Math.floor(y))
		@
