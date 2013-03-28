'use strict'

{Vec2} = require('../../lib/core/math')
Engine = require('../../lib/core/engine')

Engine.init(document.getElementById('game-1'))

Renderer = require('../../lib/core/renderer')
Engine.renderer = new Renderer(Engine.element.getElementsByClassName('game-canvas')[0], Vec2(480, 290))

# Game

Entity = require('../../lib/core/entity')
Component = require('../../lib/core/component')
Pool = require('../../lib/core/pool')
Color = require('../../lib/core/color')
require('../../lib/core/transform')
require('../../lib/core/border')
Body = require('../../lib/vendor/b2/body')

class GameController extends Component

	tag: 'gameController'

	instantiate: ->
		@root.gravity = Vec2(0, 10)

		# Border
		Entity.alloc(@root,
			transform:
				pos: Vec2(240, 283)
			bounds:
				shape: 'rect'
				size: Vec2(480, 15)
			b2Body:
				fixed: true
			boundsDebug: null
		)
		Entity.alloc(@root,
			transform:
				pos: Vec2(240, 7)
			bounds:
				shape: 'rect'
				size: Vec2(480, 15)
			b2Body:
				fixed: true
			boundsDebug: null
		)
		Entity.alloc(@root,
			transform:
				pos: Vec2(7, 160)
			bounds:
				shape: 'rect'
				size: Vec2(15, 320)
			b2Body:
				fixed: true
			boundsDebug: null
		)
		Entity.alloc(@root,
			transform:
				pos: Vec2(473, 160)
			bounds:
				shape: 'rect'
				size: Vec2(15, 320)
			b2Body:
				fixed: true
			boundsDebug: null
		)

		@spawnBoxes()
		@

	spawnBox: () ->
		size = Math.rand(5, 25)
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

	spawnBoxes: ->
		for i in [0..10]
			@spawnBox()
		@

	update: ->
		input = Engine.input
		if input.touchState is 'began'
			Explosion.Prefab.alloc(@root,
				transform:
					pos: input.pos
			)
		if input.keys.space is 'began'
			@spawnBoxes()
			@


new Pool(GameController)


class Box extends Component

	tag: 'box'

	onCollide: (other, impulse) ->
		# console.log(Vec2.toString(impulse), Vec2.len(impulse))
		@

new Pool(Box)

Box.Prefab = new Entity.Prefab(
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

	tag: 'explosion'

	attributes:
		lifetime: 0.25
		maxSize: 100
		color: Color.white

	constructor: ->
		@color = Color()

	instantiate: (attributes) ->
		Color.copy(@color, attributes.color)
		@lifetime = attributes.lifetime
		@maxSize = attributes.maxSize

		@impulse = 50000
		@pos = @transform.pos
		@age = 0
		@

	update: (dt) ->
		if not @age
			@explode()

		age = (@age += dt)
		if age >= @lifetime
			@entity.destroy()
		else
			@factor = Math.quadOut(age / @lifetime)
			@size = @factor * @maxSize
		@

	explode: ->
		{maxSize, impulse} = @
		pos = @transform.pos
		maxSizeSq = maxSize * maxSize
		for body in Body.pool.register when body.enabled and not body.fixed
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
					velocity: Vec2(Math.rand(-100, 100), Math.rand(-100, 100))
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

Explosion.Prefab = new Entity.Prefab(
	transform: null
	explosion: null
)


class Spark extends Component

	tag: 'spark'

	constructor: ->
		@lastPos = Vec2()

	instantiate: ->
		Vec2.copy(@lastPos, @transform.pos)
		@lifetime = 2.5
		@age = 0
		@

	update: (dt) ->
		age = (@age += dt)
		if age >= @lifetime
			@entity.destroy()
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

Spark.Prefab = new Entity.Prefab(
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

Engine.gameScene = Entity.alloc(
	null,
	gameController: null
)

Engine.debug.stats = true

Engine.play(Engine.gameScene)
