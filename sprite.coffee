
class Sprite

	constructor: (image) ->
		if context = image.getContext('2d')
			@context = context

	draw: (dt) ->
		color = Color(255, 255, 255)
		@grad = context.createRadialGradient(0, 0, 0, 150)
		@grad.addColorStop(0, Color.rgba(color))
		color[3] -= 0.36
		@grad.addColorStop(0.5, Color.rgba(color))
		color[3] -= 0.02
		@grad.addColorStop(0.8, Color.rgba(color))
		color[3] -= 0.1
		@grad.addColorStop(0.9, Color.rgba(color))
		color[3] -= 0
		@grad.addColorStop(1, Color.rgba(color))