'use strict'

{Vec2} = require('../../lib/core/math')
Engine = require('../../lib/core/engine')

Engine.init(document.getElementById('game-1'))

Renderer = require('../../lib/core/renderer')
Engine.renderer = new Renderer(Engine.element.getElementsByClassName('game-canvas')[0], Vec2(960, 640))

# Game

Entity = require('../../lib/core/entity')
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

	tag: 'gameController'

	instantiate: ->
		@started = 0
		@

	update: (dt) ->
		input = Engine.input
		if input.touchState or input.keys.space
			factor = (@started += dt) + 1
			i = 100 * dt * factor | 0
			speed = SparkPrefab.attributes
			while i--
				# not using attribute object for GC/speed
				spark = SparkPrefab.alloc(@root)
				Vec2.scal(
					Vec2.set(
						spark.kinetic.vel,
						Math.rand(-speed, speed),
						Math.rand(-speed, speed)
					),
					factor
				)
				Vec2.variant(input.pos, 10, spark.transform.pos)
				spark.particle.radius = Math.rand(5, 25)
		else if @started
			@started = 0

		@

new Pool(GameController)

smokeSprite = Particle.generateSprite(Color(48, 48, 48), 1)

SparkPrefab = new Entity.Prefab(
	transform: null
	kinetic:
		mass: 0.1
		fast: true
		maxVel: 200
		maxAcc: 0
	particle:
		lifetime: 5
		# composite: 'lighter'
		fade: Math.quadIn
		shrink: null
		sprite: smokeSprite
	# boid: null
	jitter: null
)

# Init

Engine.gameScene = Entity.alloc(
	null,
	gameController: null
)

Engine.play(Engine.gameScene)
