
Composite = require('./composite')
Pool = require('./pool')
{Vec2} = require('./math')

# Polyfills
requestAnimationFrame = window.requestAnimationFrame or window.webkitRequestAnimationFrame or window.mozRequestAnimationFrame or window.oRequestAnimationFrame or window.msRequestAnimationFrame or (callback) -> setTimeout(callback, 20)

perf = window.performance or {}
perf.now = perf.now or perf.webkitNow or perf.msNow or perf.mozNow or Date.now

class Engine extends Composite

	type: 'engine'

	init: (@element) ->
		@time = 0.0
		@frame = 0
		@tail = 0.0
		@debug =
			step: false
			fps: true
			fpsLength: 0
			fpsSum: 0
			mspf: false
			mspfLength: 0
			mspfSum: 0
			stats: false
			profile: 0
		@timer =
			dt: 0
			lag: 0
			frame: 0
			update: 0
			fixedUpdate: 0
			render: 0

		# Configuration
		@fdt = 1 / 60
		@dtCap = 0.5
		@fdtCap = @fdt * 5
		@scale = 1
		@fps = 0
		@mspf = 0

		# Components
		Input = require('./input')
		Input.alloc(@)

		# Tick steup
		@tickBound = (now) =>
			@tick(now)

	play: (scene) ->
		@scene = scene
		@input.root = @scene
		# Debug
		if @debug.stats
			@startStats()
		if not @running
			@start()

	start: ->
		@running = true
		requestAnimationFrame(@tickBound)
		@

	tick: (now) ->
		# normalize high-resolution timer to seconds
		now = (if now and now < 1e12 then now else perf.now()) / 1000
		debug = @debug

		if @lastTime
			if (dt = now - @lastTime) > 0.5
				dt = @fdt
			else if dt > 0.01 # resize fires rfa
				if debug.fpsSum > 0.333
					@fps = debug.fpsLength / debug.fpsSum
					debug.fpsLength = 0
					debug.fpsSum = 0
				debug.fpsSum += dt
				debug.fpsLength++
			@dt = (dt *= @scale)
			@time += dt
			@frame++

			if debug._stats
				debug._stats.begin()
			if debug.mspf
				mspfStart = perf.now()
			if debug.profile and not debug.profileFrom
				debug.profileFrom = debug.profile
				console.profile("Frame #{debug.profileFrom}")

			@update(dt)

			if debug.profileFrom
				if not --debug.profile
					console.profileEnd("Frame #{debug.profileFrom}")
					debug.profileFrom = 0
			if debug.step
				debugger
			if debug.mspf
				if debug.mspfSum > 100
					@mspf = debug.mspfSum / debug.mspfLength
					debug.mspfLength = 0
					debug.mspfSum = 0
				debug.mspfSum += (perf.now() - mspfStart)
				debug.mspfLength++
			if debug._stats
				debug._stats.end()

		else
			@time = now

		@lastTime = now

		if @running
			requestAnimationFrame(@tickBound)
		@

	update: (dt) ->
		tail = Math.min(@tail + dt, @fdtCap * @scale)
		fdt = @fdt

		# if @input.keyState is 'began' and @input.key is 'debug'
		#	@debug = not @debug

		debug = @debug

		now = perf.now()

		# Update loops
		while tail > fdt
			tail -= fdt
			Pool.invoke('fixedUpdate', fdt)
			Pool.invoke('simulate', fdt)

		@tail = tail

		Pool.invoke('update', dt)
		Pool.invoke('lateUpdate', dt)

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
		@

	startStats: ->
		return if @debug._stats or not window.Stats
		@debug._stats = stats = new Stats()
		el = stats.domElement
		el.style.position = 'absolute'
		el.style.left = 0
		el.style.top = 0
		document.body.appendChild(el)
		@

engine = new Engine()

if 'console' of window
	window.mgame = console.m =
		pool: Pool.dump
		profile: (frames = 60) ->
			engine.debug.profile = frames
			null
		step: ->
			engine.debug.step = not engine.debug.step
			null

module.exports = engine
