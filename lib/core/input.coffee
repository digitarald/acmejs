Component = require('./component')
Pool = require('./pool')
{Vec2} = require('./math')
Engine = require('./engine')

class Input extends Component

	type: 'input'

	support:
		touch: 'ontouchstart' of window
		orientation: 'ondeviceorientation' of window

	constructor: () ->
		@pos = Vec2()
		@prevPos = Vec2()
		@touchState = null # TODO: Better default value
		# TODO: Add axis support
		# http://docs.unity3d.com/Documentation/ScriptReference/Input.GetAxis.html
		# http://www.w3.org/TR/gamepad/#widl-Gamepad-axes
		@axis = Vec2()
		@mouseAxis = Vec2()
		@queue = []
		@orientation = Vec2()
		@prevOrientation = Vec2()
		@baseOrientation = Vec2()

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
			mousemove: -1
			touchmove: -1
			deviceorientation: -1

		@events =
		# if @support.touch
			touchstart: 'startTouch'
			touchmove: 'moveTouch'
			touchend: 'endTouch'
			touchcancel: 'endTouch'
		# else
		#	mousedown: 'startTouch'
		#	mousemove: 'moveTouch'
		#	mouseup: 'endTouch'
		#	keydown: 'keyStart'
		#	keyup: 'keyEnd'

		for type of @events
			document.addEventListener(type, @, false)

		if @support.orientation
			@events.deviceorientation = 'deviceOrientation'
			window.addEventListener('deviceorientation', @, false)

	handleEvent: (event) ->
		if event.metaKey
			return
		type = event.type
		throttled = @throttled
		if throttled[type]?
			if throttled[type] >= 0
				@queue[throttled[type]] = event
				return @
			throttled[type] = @queue.length
		else
			event.preventDefault()
		@queue.push(event)
		@

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
		if @touchState and (not @support.touch or not event.targetTouches.length)
			@touchState = 'ended'
		@

	calibrateOrientation: () ->
		@baseOrientationTime = @orientationTime
		Vec2.copy(@baseOrientation, @orientation)
		Vec2.set(@orientation)
		@

	deviceOrientation: (event) ->
		Vec2.copy(@prevOrientation, @orientation)
		Vec2.sub(
			Vec2.set(@orientation, event.gamma | 0, event.beta | 0),
			@baseOrientation
		)
		@orientationTime = event.timeStamp / 1000
		# Engine.debug.warn = @orientation[0] + ', ' + @orientation[1]
		if not @baseOrientationTime
			@calibrateOrientation()
		@

	resolve: (event) ->
		coords = if @support.touch then event.targetTouches[0] else event
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
			if @queue.length
				console.log(@queue.map((evt) ->
					return event.type
				))
			if @throttled[event.type]?
				@throttled[event.type] = -1
			@[@events[event.type]](event)
		@queued = null
		@

pool = new Pool(Input)

module.exports = Input
