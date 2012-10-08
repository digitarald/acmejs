Component = require('./component')
Pool = require('./pool')
{Vec2} = require('./math')
Engine = require('./engine')

class Input extends Component

	type: 'input'

	constructor: () ->
		@pos = Vec2()
		@touchState = null # TODO: Better default value
		@axis - Vec2()
		@prevPos = Vec2()
		@queue = []

		@map =
			32: 'space'
			192: 'debug'

		@keyNames = []
		@keys = {}
		for code, key of @map
			if not ~@keyNames.indexOf(key)
				@keyNames.push(key)
				@keys[key] = null

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
		for type of @events
			document.addEventListener(type, @, false)

	handleEvent: (event) ->
		if event.metaKey
			return
		event.preventDefault()
		type = event.type
		if @throttled[type] and @queued is type
			@queue[@queue.length - 1] = event
		else
			@queued = type
			@queue.push(event)
		true

	keyStart: (event) ->
		if (key = @map[event.keyCode]) and not @keys[key]
			@keys[key] = 'began'
			Engine.pub('onKeyBegan', key)
		@

	keyEnd: (event) ->
		if key = @map[event.keyCode]
			@keys[key] = 'ended'
			Engine.pub('onKeyEnded', key)
		@

	startTouch: (event) ->
		@resolve(event)
		if not @touchState and not event.metaKey
			@touchState = 'began'
		@

	moveTouch: (event) ->
		@resolve(event)
		state = @touchState
		if state and state isnt 'ended' and state isnt 'moved'
			@touchState = 'moved'
		@

	endTouch: (event) ->
		@resolve(event)
		if @touchState and (not @hasTouch or not event.targetTouches.length)
			@touchState = 'ended'
		@

	resolve: (event) ->
		coords = if @hasTouch then event.targetTouches[0] else event
		if coords
			@prevTime = @time
			@time = event.timeStamp / 1000
			Vec2.copy(@prevPos, @pos)
			renderer = Engine.renderer
			Vec2.set(
				@pos,
				(coords.pageX - renderer.margin[0]) / renderer.scale | 0,
				(coords.pageY - renderer.margin[1]) / renderer.scale | 0
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

		keys = @keys
		for key in @keyNames
			switch keys[key]
				when 'began'
					keys[key] = 'pressed'
					Engine.pub('onKeyPressed', key)
					break
				when 'ended'
					keys[key] = null
					break

		event = @queue.shift()
		if event
			@[@events[event.type]](event)
		@queued = null
		@

pool = new Pool(Input)

module.exports = Input
