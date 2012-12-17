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
		for i in [0..1]
			@spawnExplosion()

		MagicianPrefab.alloc(@root,
			transform:
				pos: Vec2(240, 200)
		)
		@

	spawnExplosion: () ->
		ExplosionPrefab.alloc(@root,
			transform:
				pos: Vec2(Math.rand(25, 450), Math.rand(25, 295))
			spriteTween:
				offset: Math.rand(0, 1)
		)
		@

new Pool(GameController)

explisionSheetBlue = new Sprite.Sheet(
	sprites: new Sprite.Asset('./assets/explosion-blue.jpg')
	size: Vec2(120, 120)
	speed: 0.12
)
explisionSheetFire = new Sprite.Sheet(
	sprites: new Sprite.Asset('./assets/explosion-fire.png')
	size: Vec2(192, 192)
	speed: 0.05
)

ExplosionPrefab = new Composite.Prefab(
	transform: null
	spriteTween:
		asset: explisionSheetFire
		composite: 'lighter'
)

defaultSequence =
	walkS:
		frames: [0, 1, 2, 1]
		next: 'walkS'
	walkW:
		frames: [3, 4, 5, 4]
		next: 'walkW'
	walkN:
		frames: [9, 10, 11, 10]
		next: 'walkN'
	walkE:
		frames: [6, 7, 8, 7]
		next: 'walkE'

magicianSheet = new Sprite.Sheet(
	sprites: new Sprite.Asset('./assets/magician.png')
	size: Vec2(32, 32)
	speed: 0.15
	sequences: defaultSequence
)
grinchSheet = new Sprite.Sheet(
	sprites: new Sprite.Asset('./assets/grinch.png')
	size: Vec2(32, 32)
	speed: 0.15
	sequences: defaultSequence
)

MagicianPrefab = new Composite.Prefab(
	transform: null
	spriteTween:
		asset: magicianSheet
		sequence: 'walkS'
)
EnemyPrefab = new Composite.Prefab(
	transform: null
	spriteTween:
		asset: grinchSheet
		sequence: 'walkS'
)

# Init

Engine.gameScene = Composite.alloc(
	null,
	gameController: null
)

Engine.debug.fps = true

Engine.play(Engine.gameScene)
