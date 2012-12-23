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
		@queue = []
		@locks = {}
		@pos = Vec2()
		@prevPos = Vec2()
		@touchState = null # TODO: Better default value
		# TODO: Add axis support
		# http://docs.unity3d.com/Documentation/ScriptReference/Input.GetAxis.html
		# http://www.w3.org/TR/gamepad/#widl-Gamepad-axes
		@axis = Vec2()
		@mouseAxis = Vec2()
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
			deviceorientation: -1

		@events =
		if @support.touch
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

		# if @support.orientation
		#	@events.deviceorientation = 'deviceOrientation'
		#	window.addEventListener('deviceorientation', @, false)

	handleEvent: (event) ->
		if event.metaKey
			return
		type = event.type
		# if @throttled[type]?
		#	throttled = @throttled
		#	console.log(throttled[type])
		#	if throttled[type] >= 0
		#		@queue[throttled[type]] = event
		#		console.log(type)
		#		return @
		#	throttled[type] = @queue.length
		# else
		#	event.preventDefault()
		@queue.push(event)
		@

	keyStart: (event) ->
		if (key = @map[event.keyCode]) and not @keys[key]
			# if not @lock('key-' + key)
			#	return false
			@keys[key] = 'began'
			Engine.pub('onKeyBegan', key)
		@

	keyEnd: (event) ->
		if key = @map[event.keyCode]
			# if not @lock('key-' + key)
			#	return false
			@keys[key] = 'ended'
			Engine.pub('onKeyEnded', key)
		@

	startTouch: (event) ->
		if not @lock('touch')
			return false
		@resolve(event)
		if not @touchState and not event.metaKey
			@touchState = 'began'
			Engine.pub('onTouchBegan')
		@

	moveTouch: (event) ->
		state = @touchState
		if (state is 'began' or state is 'ended') and not @lock('touch')
			return false
		@resolve(event)
		if state and state isnt 'ended' and state isnt 'moved'
			@touchState = 'moved'
		@

	endTouch: (event) ->
		if not @lock('touch')
			return false
		@resolve(event)
		if @touchState and (not @support.touch or not event.targetTouches.length)
			Engine.pub('onTouchEnded')
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

	lock: (key) ->
		if @locks[key] is @frame
			return false
		@locks[key] = @frame
		return true

	lateUpdate: (dt, scene) ->
		switch @touchState
			when 'began'
				@touchState = 'stationary'
				# Engine.pub('onTouchStationary')
				break
			when 'ended'
				@touchState = null
				break

		keys = @keys
		for key in @keyNames
			switch keys[key]
				when 'began'
					keys[key] = 'pressed'
					# Engine.pub('onKeyPressed', key)
					break
				when 'ended'
					keys[key] = null
					break
		@frame = Engine.frame

		queue = @queue
		# if queue.length
		#	console.log(queue.map((event) -> event.type))
		while (event = queue[0])
			type = event.type
			if not @[@events[type]](event)
				break
			queue.shift()
		# if queue.length
		#	console.log(queue.length)
		@

pool = new Pool(Input)

module.exports = Input
