'use strict'

{Vec2} = require('../../lib/core/math')
Engine = require('../../lib/core/engine')

Engine.init(document.getElementById('game-1'))

Renderer = require('../../lib/core/renderer')
Engine.renderer = new Renderer(Engine.element.getElementsByClassName('game-canvas')[0], Vec2(480, 320))

if (apps = navigator.mozApps)
	url = 'http://testno.de/sputflik/examples/rigid-device/manifest.webapp'
	request = apps.getSelf()
	request.onsuccess = () ->
		apps.install(url)
	request.onerror = () ->
		apps.install(url)

# Game

Entity = require('../../lib/core/entity')
Component = require('../../lib/core/component')
Pool = require('../../lib/core/pool')
Color = require('../../lib/core/color')
Sprite = require('../../lib/core/sprite')
Transform = require('../../lib/core/transform')
Bounds = require('../../lib/core/bounds')
Border = require('../../lib/core/border')
Boid = require('../../lib/core/boid')
Particle = require('../../lib/core/particle')
Collider = require('../../lib/core/collider')
Kinetic = require('../../lib/core/kinetic')

class GameController extends Component

	tag: 'gameController'

	instantiate: ->
		# http://www.colourlovers.com/palette/1930/cheer_up_emo_kid
		# http://www.colourlovers.com/palette/373610/mellon_ball_surprise
		# http://www.colourlovers.com/palette/1473/Ocean_Five
		@colors = [
			Color(0, 160, 176),
			Color(106, 74, 60),
			Color(204, 51, 63),
			Color(235, 104, 65),
			Color(237, 201, 81)
		]
		@root.gravity = Vec2(0, 500)
		@spawnBodies(25)

		# Engine.element.addEventListener('click', =>
		# 	Engine.renderer.requestFullscreen()
		# , false)

		if not Engine.input.support.orientation
			Engine.debug.warn = 'No devicemotion'
		@

	spawnBodies: (count) ->
		while count--
			color = Math.floor(Math.rand(0, @colors.length - 1))
			radius = Math.rand(5, 15)
			Body.Prefab.alloc(@root,
				transform:
					pos: Vec2(Math.rand(25, 295), Math.rand(25, 295))
				bounds:
					radius: radius
				kinetic:
					mass: radius
				body:
					color: @colors[color]
			)
		@

	update: (dt) ->
		input = Engine.input
		if input.support.orientation
			Vec2.scal(input.orientation, 100, @root.gravity)
		@

new Pool(GameController)


class Body extends Component

	tag: 'body'

	layer: 1

	attributes:
		color: Color()

	constructor: ->
		@color = Color()
		@stroke = Color(Color.white)

	instantiate: (attributes) ->
		@player = attributes.player
		Color.copy(@color, attributes.color)
		@

	render: (ctx) ->
		ctx.save()
		pos = @transform.pos
		ctx.fillStyle = Color.rgba(@color)
		ctx.strokeStyle = Color.rgba(@stroke)
		ctx.lineWidth = 1
		ctx.beginPath()
		ctx.arc(pos[0] | 0, pos[1] | 0, @bounds.radius | 0, 0, Math.TAU)
		ctx.stroke()
		ctx.fill()
		ctx.restore()
		@

new Pool(Body)

Body.Prefab = new Entity.Prefab(
	transform: null
	bounds:
		shape: 'circle'
		radius: 15
	kinetic:
		mass: 1
		drag: 0.998
		friction: 0.1
		maxVel: 200
	# collider: null
	# boid: null
	border:
		bounciness: 0.2
	body: null
)

# Init

Engine.gameScene = Entity.alloc(
	null,
	gameController: null
)

Engine.play(Engine.gameScene)
