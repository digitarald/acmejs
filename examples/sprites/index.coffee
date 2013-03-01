'use strict'

{Vec2} = require('../../lib/core/math')
Engine = require('../../lib/core/engine')

Engine.init(document.getElementById('game-1'))

Renderer = require('../../lib/core/renderer')
Engine.renderer = new Renderer(Engine.element.getElementsByClassName('game-canvas')[0], Vec2(480, 320))

# Game

Composite = require('../../lib/core/composite')
Component = require('../../lib/core/component')
Pool = require('../../lib/core/pool')
Sprite = require('../../lib/core/sprite')
Transform = require('../../lib/core/transform')
Border = require('../../lib/core/border')
Collider = require('../../lib/core/collider')
Kinetic = require('../../lib/core/kinetic')

class GameController extends Component

	type: 'gameController'

	reset: ->
		# for i in [0..200]
		#	@spawnExplosion()

		AgentPrefab.alloc(@root,
			transform:
				pos: Vec2(240, 200)
		)
		@

	update: () ->
		input = Engine.input
		if input.keys.space
			# console.log(Date.now() / 1000 - input.prevTime)
			Explosion.Prefab.alloc(@root,
				transform:
					pos: input.pos
				spriteTween:
					offset: Math.rand(0, 1)
			)
			@

	spawnExplosion: () ->
		Explosion.Prefab.alloc(@root,
			transform:
				pos: Vec2(Math.rand(25, 450), Math.rand(25, 295))
			spriteTween:
				offset: Math.rand(0, 1)
		)
		@

new Pool(GameController)

explisionSheet = new Sprite.Sheet(
	sprites: new Sprite.Asset('../shared/mini-explosion.png')
	size: Vec2(20, 20)
	speed: 0.05
)


class Explosion extends Component

	type: 'explosion'

	onSequenceEnd: () ->
		@parent.free()

new Pool(Explosion)

Explosion.Prefab = new Composite.Prefab(
	transform: null
	spriteTween:
		asset: explisionSheet
	bounds:
		shape: 'circle'
		radius: 15
	explosion: null
)

agentSheet = new Sprite.Sheet(
	sprites: [
		new Sprite.Asset('../shared/char_walk.png')
		new Sprite.Asset('../shared/char_shoot.png')
		new Sprite.Asset('../shared/char_hurt.png')
	]
	size: Vec2(64, 64)
	speed: 0.09
	align: Vec2.bottomCenter
	sequences:
		walkN: [1, 8, 'walkW', null]
		walkW: [10, 17, 'walkS', null]
		walkS: [19, 26, 'walkE', null]
		walkE: [28, 35, 'shootW', null]
		shootW: [36, 37, 'shootS', 0.3]
		shootS: [39, 40, 'shootN', 0.3]
		shootN: [42, 43, 'hurt', 0.3]
		hurt: [45, 50, null, 0.15]
)

AgentPrefab = new Composite.Prefab(
	transform: null
	spriteTween:
		asset: agentSheet
		sequence: 'walkN'
)

# Init

Engine.gameScene = Composite.alloc(
	null,
	gameController: null
)

Engine.debug.stats = true

Engine.play(Engine.gameScene)
