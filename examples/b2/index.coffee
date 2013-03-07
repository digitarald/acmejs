'use strict'

{Vec2} = require('../../lib/core/math')
Engine = require('../../lib/core/engine')

Engine.init(document.getElementById('game-1'))

Renderer = require('../../lib/core/renderer')
Engine.renderer = new Renderer(Engine.element.getElementsByClassName('game-canvas')[0], Vec2(480, 290))

# Game

Composite = require('../../lib/core/composite')
Component = require('../../lib/core/component')
Pool = require('../../lib/core/pool')
Color = require('../../lib/core/color')
require('../../lib/core/transform')
require('../../lib/core/border')
Body = require('../../lib/vendor/b2m/body')

class GameController extends Component

	type: 'gameController'

	reset: ->
		@root.gravity = Vec2(0, 10)

		# Border
		Composite.alloc(@root,
			transform:
				pos: Vec2(240, 283)
			bounds:
				shape: 'rect'
				size: Vec2(480, 15)
			b2Body:
				fixed: true
			boundsDebug: null
		)
		Composite.alloc(@root,
			transform:
				pos: Vec2(240, 7)
			bounds:
				shape: 'rect'
				size: Vec2(480, 15)
			b2Body:
				fixed: true
			boundsDebug: null
		)
		Composite.alloc(@root,
			transform:
				pos: Vec2(7, 160)
			bounds:
				shape: 'rect'
				size: Vec2(15, 320)
			b2Body:
				fixed: true
			boundsDebug: null
		)
		Composite.alloc(@root,
			transform:
				pos: Vec2(473, 160)
			bounds:
				shape: 'rect'
				size: Vec2(15, 320)
			b2Body:
				fixed: true
			boundsDebug: null
		)

		for i in [0..10]
			@spawnBox()
		@

	spawnBox: () ->
		size = Math.rand(5, 20)
		sphere = Math.chance(0.5)
		Box.Prefab.alloc(@root,
			transform:
				pos: Vec2(Math.rand(25, 450), Math.rand(25, 265))
			bounds:
				radius: size / 2
				size: Vec2(size, size)
				shape: if sphere then 'circle' else 'rect'
			b2Body:
				awake: false
		)
		@

	update: ->
		input = Engine.input
		if input.touchState is 'began'
			Explosion.Prefab.alloc(@root,
				transform:
					pos: input.pos
			)
			@


new Pool(GameController)


class Box extends Component

	type: 'box'

	onCollide: (other, impulse) ->
		# console.log(Vec2.toString(impulse), Vec2.len(impulse))
		@

new Pool(Box)

Box.Prefab = new Composite.Prefab(
	transform: null
	bounds:
		shape: 'circle'
		radius: 10
	box: null
	b2Body:
		restitution: 0.9
		density: 0.5
	border:
		mirror: true
	boundsDebug: null
)


class Explosion extends Component

	type: 'explosion'

	presets:
		lifetime: 0.25
		maxSize: 100
		color: Color.white

	constructor: ->
		@color = Color()

	reset: (presets) ->
		Color.copy(@color, presets.color)
		@lifetime = presets.lifetime
		@maxSize = presets.maxSize

		@impulse = 50000
		@pos = @transform.pos
		@age = 0
		@

	update: (dt) ->
		if not @age
			@explode()

		age = (@age += dt)
		if age >= @lifetime
			@parent.free()
		else
			@factor = Math.quadOut(age / @lifetime)
			@size = @factor * @maxSize
		@

	explode: ->
		{maxSize, impulse} = @
		pos = @transform.pos
		maxSizeSq = maxSize * maxSize
		for body in Body.pool.roster when body.enabled and not body.fixed
			pos2 = body.transform.pos
			distSq = Vec2.distSq(pos, pos2)
			if distSq < maxSizeSq
				factor = 1 - Math.sqrt(distSq) / maxSize
				body.applyForce(
					Vec2.norm(
						Vec2.sub(
							pos2, pos, Vec2.cache[0]
						),
						null,
						Math.quadIn(factor) * impulse
					)
				)

		return @
		for i in [0..10]
			Spark.Prefab.alloc(@root,
				transform:
					pos: pos
				b2Body:
					vel: Vec2(Math.rand(-100, 100), Math.rand(-100, 100))
			)
		@

	render: (ctx) ->
		ctx.save()
		pos = @pos

		circles = 10
		for i in [1..circles] by 1
			factor = Math.quadOut(i / circles)
			ctx.beginPath()
			ctx.arc(pos[0] | 0, pos[1] | 0, @size * factor | 0, 0, Math.TAU, true)
			ctx.closePath()

			@color[3] = factor * (1 - @factor)
			ctx.lineWidth = 10 * factor
			ctx.strokeStyle = Color.rgba(@color)
			ctx.stroke()

		ctx.restore()
		@

new Pool(Explosion)

Explosion.Prefab = new Composite.Prefab(
	transform: null
	explosion: null
)


class Spark extends Component

	type: 'spark'

	constructor: ->
		@lastPos = Vec2()

	reset: ->
		Vec2.copy(@lastPos, @transform.pos)
		@lifetime = 2.5
		@age = 0
		@

	update: (dt) ->
		age = (@age += dt)
		if age >= @lifetime
			@parent.free()
		@

	render: (ctx) ->
		pos = @transform.pos
		ctx.save()
		ctx.strokeStyle = Color.rgba(Color.white)
		ctx.beginPath();
		ctx.moveTo(@lastPos[0] | 0, @lastPos[1] | 0)
		ctx.lineTo(pos[0] | 0, pos[1] | 0)
		ctx.stroke()
		ctx.restore()
		Vec2.copy(@lastPos, pos)
		@

new Pool(Spark)

Spark.Prefab = new Composite.Prefab(
	transform: null
	bounds:
		shape: 'circle'
		radius: 0.1
	spark: null
	b2Body:
		restitution: 1
		density: 0.1
		friction: 0
	border:
		kill: true
)

# Init

Engine.gameScene = Composite.alloc(
	null,
	gameController: null
)

Engine.debug.stats = true

Engine.play(Engine.gameScene)