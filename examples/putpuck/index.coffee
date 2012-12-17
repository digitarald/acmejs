'use strict'

{Vec2} = require('../../lib/core/math')
Engine = require('../../lib/core/engine')

Engine.init(document.getElementById('game-1'))

Renderer = require('../../lib/core/renderer')
Engine.renderer = new Renderer(Engine.element.getElementsByClassName('game-canvas')[0], Vec2(320, 480))

if (apps = navigator.mozApps)
	url = 'http://testno.de/sputflik/examples/putpuck/manifest.webapp'
	request = apps.getSelf()
	request.onsuccess = () ->
		if @result
			@result.launch()
		else
			apps.install(url)
	request.onerror = () ->
		apps.install(url)

# Game

Composite = require('../../lib/core/composite')
Component = require('../../lib/core/component')
Pool = require('../../lib/core/pool')
Color = require('../../lib/core/color')
Sprite = require('../../lib/core/sprite')
Transform = require('../../lib/core/transform')
Bounds = require('../../lib/core/bounds')
Border = require('../../lib/core/border')
Particle = require('../../lib/core/particle')
Collider = require('../../lib/core/collider')
Kinetic = require('../../lib/core/kinetic')

class Scene extends Composite

	type: 'scene'

	constructor: ->
		super()

		@player = 0
		# http://www.colourlovers.com/palette/1930/cheer_up_emo_kid
		# http://www.colourlovers.com/palette/373610/mellon_ball_surprise
		# http://www.colourlovers.com/palette/1473/Ocean_Five
		@colors = {
			0:
				high: Color(78, 205, 196),
			1:
				high: Color(255, 107, 107)
		}
		@colors[0].low = Color.lerp(@colors[0].high, Color.white, 0.15, false, Color())
		@colors[1].low = Color.lerp(@colors[1].high, Color.white, 0.15, false, Color())

		@inField1 = Field.Prefab.alloc(@,
			transform:
				pos: Vec2(0, 80)
			bounds:
				size: Vec2(320, 160)
			field:
				color: @colors[0].low
		)
		@inField2 = Field.Prefab.alloc(@,
			transform:
				pos: Vec2(0, 240)
			bounds:
				size: Vec2(320, 160)
			field:
				color: @colors[1].low
		)
		@outField1 = Field.Prefab.alloc(@,
			transform:
				pos: Vec2(0, 0)
			bounds:
				size: Vec2(320, 80)
			field:
				out: true
		)
		@outField2 = Field.Prefab.alloc(@,
			transform:
				pos: Vec2(0, 400)
			bounds:
				size: Vec2(320, 80)
			field:
				out: true
		)
		@setupPuck()
		@

	setupPuck: ->
		@player = if @player then 0 else 1
		radius = Math.rand(12, 25) | 0
		puck1 = Puck.Prefab.alloc(@,
			transform:
				pos: Vec2(160, if @player then 40 else 440)
			bounds:
				radius: radius
			kinetic:
				mass: radius
			puck:
				player: @player
				color: @colors[@player].high
		)
		puck1.player = @player
		puck1.sub(@, 'onFlip', 'setupPuck')
		@

class Puck extends Component

	type: 'puck'

	layer: 1

	presets:
		player: 0
		color: Color()

	constructor: ->
		@color = Color()
		@outlineColor = Color()

	reset: (presets) ->
		@player = presets.player
		Color.copy(@color, presets.color)

		Color.lerp(@color, Color.black, 0.8, false, @outlineColor)
		@outlineColor[3] = 0.3

		@kinetic.enable(false)
		@collider.enable(false)
		@state = 'ready'
		@treshold = 1
		@

	update: (dt) ->
		pos = @transform.pos
		input = Engine.input
		switch @state
			when 'ready'
				if input.touchState isnt 'began' or not @bounds.contains(input.pos)
					break
				@state = 'dragging'
			when 'dragging'
				if input.touchState is 'moved'
					delta = input.time - input.prevTime
					speed = Vec2.scal(
						Vec2.sub(input.pos, input.prevPos, Vec2.cache[0]),
						delta * 1000
					)
					if @avgSpeed
						Vec2.lerp(@avgSpeed, speed, 0.5) # delta * 10
					else
						@avgSpeed = Vec2(speed)
					Vec2.copy(@transform.pos, input.pos)
					break
				if input.touchState is 'ended'
					if not @avgSpeed or Vec2.len(@avgSpeed) < @treshold
						@state = 'ready'
						break

					@state = 'flipped'
					@kinetic.enable(true)
					@collider.enable(true)
					# @border.enable(true)
					Vec2.copy(@kinetic.vel, @avgSpeed)
					@parent.pub('onFlip', @)
					@avgSpeed = null
			when 'flipped'
				break
				vel = Vec2.len(@kinetic.vel)
				i = vel / 40 | 0
				while i--
					pos = Vec2.set(Vec2.cache[0], Math.rand(-1, 1), Math.rand(-1, 1))
					Vec2.norm(pos, null, @bounds.radius) # Math.rand(0, 1, Math.quadOut) *
					pointer = Vec2.copy(Vec2.cache[1], pos)
					Vec2.add(
						Vec2.norm(pos, null, @bounds.radius),
						@transform.pos
					)
					Vec2.scal(pointer, Math.rand(0, vel / 8))
					particle = Particle.alloc(@root, pos, pointer, Math.rand(0.01, 0.05), Math.rand(1, 3))
					particle.sprite = Puck.particleFlipSprite
				break
		@

	onKineticSleep: () ->
		@

	render: (ctx) ->
		ctx.save()
		pos = @transform.pos
		ctx.beginPath()
		ctx.arc(pos[0] | 0, pos[1] | 0, @bounds.radius | 0, 0, Math.TAU)
		ctx.closePath()
		ctx.fillStyle = Color.rgba(@color)
		ctx.fill()
		if @state is 'ready' or @kinetic.sleeping
			ctx.lineWidth = 4
			ctx.strokeStyle = Color.rgba(@outlineColor)
			ctx.stroke()
		ctx.restore()
		@

new Pool(Puck)

Particle.defaultComposite = null
Puck.particleFlipSprite = Particle.generateSprite(Color(199, 244, 100))
Puck.particleSmokeSprite = Particle.generateSprite(Color(128, 128, 128), 0.5)

Puck.Prefab = new Composite.Prefab(
	transform: null
	bounds:
		shape: 'circle'
		radius: 15
	kinetic:
		mass: 1
		drag: 0.994
		maxVel: 450
	collider: null
	border:
		bounciness: 0.6
	puck: null
)

class Field extends Component

	type: 'field'

	presets:
		color: Color.white
		out: false
		player: 0

	constructor: ->
		@color = Color()

	reset: (presets) ->
		@out = presets.out
		@player = presets.player
		Color.copy(@color, presets.color)
		targets = Puck.pool.roster
		@root.sub(@, 'onKineticSleep')
		@

	onKineticSleep: (kinetic) ->
		if @bounds.contains(kinetic.pos) and @out
			kinetic.parent.free()
		@

	render: (ctx) ->
		if @out
			return @
		ctx.fillStyle = Color.rgba(@color)
		ctx.fillRect(
			@transform.pos[0],
			@transform.pos[1],
			@bounds.size[0]
			@bounds.size[1]
		)
		@

new Pool(Field)

Field.Prefab = new Composite.Prefab(
	transform: null
	bounds:
		shape: 'rect'
	field: null
)


# Init

Engine.play(new Scene())
