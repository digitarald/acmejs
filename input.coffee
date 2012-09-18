
class Input extends Component

	name: 'input'

	constructor: () ->
		@pos = Vec2()
		@prevPos = Vec2()
		@queue = []

		@map =
			32: 'space'
			192: 'debug'

		@throttled =
			mousemove: true
			touchmove: true

		@hasTouch = 'ontouchstart' of window
		@events =
			if @hasTouch
				touchstart: 'startTouch'
				touchmove: 'moveTouch'
				touchend: 'endTouch'
				touchcancel: 'endTouch'
			else
				mousedown: 'startTouch'
				mousemove: 'moveTouch'
				mouseup: 'endTouch'
				keydown: 'keyStart'
				keyup: 'keyEnd'

		for name of @events
			document.addEventListener(name, @, false)

	handleEvent: (event) ->
		type = event.type
		if type of @throttled and @queued is type
			@queue[@queue.length - 1] = event
		else
			@queued = type
			@queue.push(event)

	keyStart: (event) ->
		if not event.metaKey
			code = event.keyCode
			if not @keyState and code of @map
				@keyState = 'began'
				@key = @map[code]
			return false
		@

	keyEnd: (event) ->
		if @keyState
			@keyState = 'ended'
		@

	startTouch: (event) ->
		@resolve(event)
		if not @touchState and not event.metaKey
			@touchState = 'began'
			return false
		@

	moveTouch: (event) ->
		@resolve(event)
		state = @touchState
		if state and state isnt 'ended' and state isnt 'moved'
			@touchState = 'moved'
		@

	endTouch: (event) ->
		if @touchState and (not @hasTouch or not event.targetTouches.length)
			@touchState = 'ended'
		@

	resolve: (event) ->
		@prevTime = @time
		@time = event.timeStamp / 1000
		coords = if @hasTouch then event.targetTouches[0] else event
		if coords
			Vec2.copy(@prevPos, @pos)
			Vec2.set(
				@pos,
				coords.pageX - Engine.renderer.margin[0],
				coords.pageY - Engine.renderer.margin[1]
			)
		@

	lateUpdate: (dt, scene) ->
		switch @touchState
			when 'began'
				@touchState = 'stationary'
				break
			when 'ended'
				@touchState = null
				break

		switch @keyState
			when 'began'
				@keyState = 'pressed'
				break
			when 'ended'
				@keyState = null
				break


		event = @queue.shift()
		if event
			@[@events[event.type]](event)
		@queued = null
		@

new Pool(Input)
