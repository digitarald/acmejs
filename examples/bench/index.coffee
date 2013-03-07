'use strict'

{Vec2} = require('../../lib/core/math')
Engine = require('../../lib/core/engine')

Engine.init(document.getElementById('game-1'))

Renderer = require('../../lib/core/renderer')
Engine.renderer = new Renderer(Engine.element.getElementsByClassName('game-canvas')[0], Vec2(960, 640))

# Game

Composite = require('../../lib/core/composite')
Component = require('../../lib/core/component')
Pool = require('../../lib/core/pool')
Color = require('../../lib/core/color')
Transform = require('../../lib/core/transform')
Border = require('../../lib/core/border')
Collider = require('../../lib/core/collider')
Kinetic = require('../../lib/core/kinetic')
Particle = require('../../lib/core/particle')
require('../../lib/core/jitter')
require('../../lib/core/wander')
require('../../lib/core/boid')

class GameController extends Component

	type: 'gameController'

	reset: ->
		@

	update: (dt) ->
		input = Engine.input
		if input.touchState or input.keys.space
			i = 150 * dt | 0
			speed = 100
			while i--
				# not using preset object for GC/speed
				spark = SparkPrefab.alloc(@root)
				Vec2.set(spark.kinetic.vel, Math.rand(-speed, speed), Math.rand(-speed, speed))
				Vec2.variant(input.pos, 25, spark.transform.pos)
				spark.particle.radius = Math.rand(5, 25)
			@
		@

new Pool(GameController)

smokeSprite = Particle.generateSprite(Color(128, 128, 128), 1)

SparkPrefab = new Composite.Prefab(
	transform: null
	kinetic:
		mass: 0.1
		fast: true
		maxVel: 100
		maxAcc: 0
	particle:
		lifetime: 10
		composite: 'lighter'
		fade: null
		sprite: smokeSprite
	# boid: null
	jitter: null
)

# Init

Engine.gameScene = Composite.alloc(
	null,
	gameController: null
)

Engine.play(Engine.gameScene)
