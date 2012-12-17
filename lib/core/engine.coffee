
Composite = require('./composite')
Pool = require('./pool')
{Vec2} = require('./math')

class Engine extends Composite

	type: 'engine'

	init: (@element) ->
		@time = 0.0
		@frame = 0
		@tail = 0.0
		@debug =
			step: false
			fps: false
			fpsLength: 0
			fpsSum: 0
			fpsNext: 0

		# Configuration
		@fdt = 1 / 60
		@dtCap = 0.5
		@fdtCap = @fdt * 5
		@scale = 1
		@fps = 0

		# Components
		Input = require('./input')
		Input.alloc(@)

		# Tick steup
		@tickBound = (now) =>
			@tick(now)

	play: (scene) ->
		@scene = scene
		@input.root = @scene
		if not @running
			@start()

	start: ->
		@running = true
		requestAnimationFrame(@tickBound)
		@

	tick: (now) ->
		now = (if now and now > 1e12 then now else Date.now()) / 1000

		if @lastTime
			if (dt = now - @lastTime) > 0.5
				dt = @fdt
			else if dt > 0.01 # resize fires rfa
				if @debug.fpsSum > 0.333
					@fps = @debug.fpsLength / @debug.fpsSum
					@debug.fpsLength = 1
					@debug.fpsSum = dt
				else
					@debug.fpsSum += dt
					@debug.fpsLength++
			@dt = (dt *= @scale)
			@time += dt
			@frame++

			@update(dt)

			if @debug.step
				debugger
		else
			@time = now

		@lastTime = now

		if @running
			requestAnimationFrame(@tickBound)
		@

	update: (dt) ->
		ctx = @renderer.save()

		tail = Math.min(@tail + dt, @fdtCap * @scale)
		fdt = @fdt

		# if @input.keyState is 'began' and @input.key is 'debug'
		#	@debug = not @debug

		# Update loops
		while tail > fdt
			tail -= fdt
			Pool.invoke('fixedUpdate', fdt)
			Pool.invoke('simulate', fdt)

		@tail = tail

		Pool.invoke('update', dt)
		Pool.invoke('lateUpdate', dt)
		# debugger

		# @pub('preRender', ctx, @scene)
		Pool.invoke('render', ctx, dt)
		# @pub('postRender', ctx, @scene)

		# Stats
		if @debug.fps
			fps = Math.round(@fps)
			ctx.fillStyle = 'black'
			ctx.strokeStyle = 'white'
			ctx.font = 'bold 11px sans-serif'
			ctx.lineWidth = 2
			ctx.strokeText(fps | 0, 1, 11)
			ctx.fillText(fps | 0, 1, 11)


		# Warn
		if @debug.warn
			ctx.fillStyle = 'red'
			ctx.strokeStyle = 'white'
			ctx.font = 'bold 11px sans-serif'
			ctx.lineWidth = 2
			ctx.strokeText(fps | 0, 1, 11)
			ctx.fillText(fps | 0, 1, 11)

		@renderer.restore()

requestAnimationFrame = (->
	window.requestAnimationFrame or window.webkitRequestAnimationFrame or window.mozRequestAnimationFrame or window.oRequestAnimationFrame or window.msRequestAnimationFrame or (callback) -> setTimeout(callback, 20)
)()

module.exports = new Engine()

# perf = performance
# perf.now = perf.now or perf.webkitNow or perf.msNow or perf.mozNow or Date.now.bind(Date)