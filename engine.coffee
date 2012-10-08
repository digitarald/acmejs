
Composite = require('./composite')
Pool = require('./pool')
{Vec2} = require('./math')

class Engine extends Composite

	type: 'engine'

	init: (@element) ->
		@time = 0.0
		@frame = 0
		@tail = 0.0
		@debug = false

		# Configuration
		@fdt = 1 / 60
		@dtCap = 0.5
		@fdtCap = @fdt * 5
		@scale = 1
		@fps = 1/60

		Input = require('./input')

		# Components
		Input.alloc(@)

		# Tick steup
		@tickBound = (now) =>
			@tick(now)

		@element.addEventListener('dblclick', =>
			if 'webkitRequestFullScreen' of @element
				@element.webkitRequestFullScreen()
			else if 'mozRequestFullScreen' of @element
				@element.mozRequestFullScreen()
		, false)
		@

	start: ->
		requestAnimationFrame(@tickBound)
		@

	tick: (now) ->
		now = (if now and now > 1e4 then now else Date.now()) / 1000

		if @lastTime
			if (dt = now - @lastTime) > 0.5
				dt = @fdt
			else if dt
				@fps = @fps * 0.9 + 0.1 / dt
			@dt = (dt *= @scale)
			@time += dt
			@frame++

			@update(dt)

			if @debug
				debugger
		else
			@time = now

		@lastTime = now

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
			Pool.invoke('fixedUpdate', fdt, @scene)
			Pool.invoke('simulate', fdt, @scene)

		@tail = tail

		Pool.invoke('update', dt, @scene)
		Pool.invoke('lateUpdate', dt, @scene)
		# debugger

		# @pub('preRender', ctx, @scene)
		Pool.invoke('render', ctx, @scene)
		# @pub('postRender', ctx, @scene)

		# Stats
		ctx.fillStyle = 'black'
		ctx.strokeStyle = 'white'
		ctx.font = '11px sans-serif'
		ctx.lineWidth = 3
		ctx.strokeText(@fps | 0, 0, 11)
		ctx.fillText(@fps | 0, 0, 11)

		@renderer.restore()

requestAnimationFrame = (->
	window.requestAnimationFrame or window.webkitRequestAnimationFrame or window.mozRequestAnimationFrame or window.oRequestAnimationFrame or window.msRequestAnimationFrame or (callback) -> setTimeout(callback, 20)
)()

module.exports = new Engine()

# perf = performance
# perf.now = perf.now or perf.webkitNow or perf.msNow or perf.mozNow or Date.now.bind(Date)