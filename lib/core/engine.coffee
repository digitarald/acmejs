
Entity = require('./entity')
Pool = require('./pool')
{Vec2} = require('./math')

# Polyfills
requestAnimationFrame = window.requestAnimationFrame or window.webkitRequestAnimationFrame or window.mozRequestAnimationFrame or window.oRequestAnimationFrame or window.msRequestAnimationFrame or (callback) -> setTimeout(callback, 20)

perf = window.performance or {}
perf.now = perf.now or perf.webkitNow or perf.msNow or perf.mozNow or Date.now

class Engine extends Entity

	tag: 'engine'

	init: (@element) ->
		@time = 0.0
		@lastTime = 0.0
		@frame = 0
		@tail = 0.0
		@debug =
			profile: 0
			step: false
			time: true
		@samples =
			dt: 0
			lag: 0
			tick: 0
			fixedUpdate: 0
			update: 0
			render: 0

		# Configuration
		@fdt = 1 / 30
		@dtMin = 1 / 60
		@dtCap = 0.5
		@fdtCap = @fdt * 5
		@scale = 1

		# Components
		Console = require('./console')
		Console.alloc(@)

		Input = require('./input')
		Input.alloc(@)

		# Tick steup
		@tickBound = (now) =>
			@tick(now)

	play: (scene) ->
		@scene = scene
		# @input.root = @scene
		@start()

	start: ->
		if not @running
			@running = true
			requestAnimationFrame(@tickBound)
		@

	tick: (time) ->
		# normalize high-resolution timer to seconds
		@time = time = (if time and time < 1e12 then time else perf.now()) / 1000

		{debug, samples, fdt} = @

		if @lastTime
			if (dt = time - @lastTime) > @dtCap
				dt = @dtMin
			else if dt > 0.01 # resize fires rfa?
				samples.dt = dt
				if (lag = time - samples.next) > 0
					samples.lag = lag * 1000

			@dt = (dt *= @scale)
			@frame++

			if debug.profile and not debug.profileFrom
				debug.profileFrom = debug.profile
				console.profile("Frame #{debug.profileFrom}")

			pingTick = ping = perf.now()

			# Update loops
			tail = Math.min(@tail + dt, @fdtCap * @scale)
			while tail > fdt
				tail -= fdt
				Pool.invoke('fixedUpdate', fdt)
				Pool.invoke('simulate', fdt)
			@tail = tail

			pong = perf.now()
			samples.fixedUpdate = pong - ping
			ping = pong

			Pool.invoke('update', dt)
			Pool.free()
			Pool.invoke('postUpdate', dt)

			pong = perf.now()
			samples.update = pong - ping
			ping = pong

			Pool.invoke('preRender', dt)
			ctx = @renderer.save()
			Pool.invoke('render', ctx, dt)

			# Canvas Stats
			# stats = ""
			# if @debug.mspf and @mspf > 1
			#	stats += Math.round(@mspf) + "\n"

			# if @debug.fps and @fps < 55
			#	stats += Math.round(@fps) + "\n"

			# if stats
			#	ctx.fillStyle = 'black'
			#	ctx.strokeStyle = 'white'
			#	ctx.lineWidth = 2
			#	ctx.strokeText(stats, 2, 11)
			#	ctx.fillText(stats, 2, 11)

			@renderer.restore()

			pong = perf.now()
			samples.render = pong - ping
			samples.tick = pong - pingTick

			if debug.step
				debugger
			if debug.profileFrom
				if not --debug.profile
					console.profileEnd("Frame #{debug.profileFrom}")
					debug.profileFrom = 0

		@lastTime = time
		samples.next = Math.max(time + 1 / 60, perf.now() / 1000)

		@pub('onTimeEnd', samples)

		if @pauseNext
			@pub('onPause')
			@paused = true
			@tickBound(samples.next * 1000)
		else if @running
			requestAnimationFrame(@tickBound)
		@

engine = new Engine()

if 'console' of window
	console.m =
		pool: (flush) ->
			Pool.dump(flush)
			null
		profile: (frames = 60) ->
			engine.debug.profile = frames
			null
		step: ->
			engine.debug.step = not engine.debug.step
			null

module.exports = engine
