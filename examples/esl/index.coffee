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
Container = require('../../lib/vendor/esl/container')
Esl = require('../../lib/vendor/esl/esl')

class GameController extends Component

	type: 'gameController'

	reset: ->
		@root.gravity = Vec2(0, 0)

		for i in [0..1]
			@spawnBox()
		@

	spawnBox: () ->
		Composite.alloc(@root,
			transform:
				pos: Vec2(Math.rand(25, 450), Math.rand(25, 265))
			eslContainer:
				child: ->
					circle = new Esl.Shape()
					circle.graphics.beginFill("red").drawCircle(0, 0, 40)
					return circle

		)
		@

	# update: ->
	#	input = Engine.input
	#	if input.touchState is 'began'
	#		Explosion.Prefab.alloc(@root,
	#			transform:
	#				pos: input.pos
	#		)
	#		@


new Pool(GameController)

# Init

Engine.gameScene = Composite.alloc(
	null,
	gameController: null
)

Engine.debug.stats = true

Engine.play(Engine.gameScene)
