'use strict'

{Vec2} = require('../../lib/core/math')
Engine = require('../../lib/core/engine')

Engine.init(document.getElementById('game-1'))

Renderer = require('../../lib/core/renderer')
Engine.renderer = new Renderer(Engine.element.getElementsByClassName('game-canvas')[0], Vec2(480, 320))

# Game

Entity = require('../../lib/core/entity')
Component = require('../../lib/core/component')
Pool = require('../../lib/core/pool')
Sprite = require('../../lib/core/sprite')
Transform = require('../../lib/core/transform')
Border = require('../../lib/core/border')
Collider = require('../../lib/core/collider')
Kinetic = require('../../lib/core/kinetic')

class GameController extends Component

	tag: 'gameController'

	instantiate: ->
		Magician.Prefab.alloc(@root,
			transform:
				pos: Vec2(240, 200)
		)
		@

	update: () ->
		input = Engine.input
		if input.keys.space is 'began'
			Explosion.Prefab.alloc(@root,
				transform:
					pos: input.pos
			)
			@

new Pool(GameController)


class Explosion extends Component

	tag: 'explosion'

	onSequenceEnd: () ->
		@entity.destroy()

new Pool(Explosion)

Explosion.sheetBlue = new Sprite.Sheet(
	sprites: new Sprite.Asset('./assets/explosion-blue.jpg')
	size: Vec2(120, 120)
	speed: 0.12
)
Explosion.sheetFire = new Sprite.Sheet(
	sprites: new Sprite.Asset('./assets/explosion-fire.png')
	size: Vec2(192, 192)
	speed: 0.05
)

Explosion.Prefab = new Entity.Prefab(
	transform: null
	spriteTween:
		asset: Explosion.sheetFire
		# entity: 'lighter'
	explosion: null
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


class Magician extends Component

	tag: 'magician'

	simulate: ->
		axis = Engine.input.axis
		pos = @transform.pos
		speed = 1
		if axis[1] < 0
			pos[1] -= speed
		else if axis[1] > 0
			pos[1] += speed
		if axis[0] < 0
			pos[0] -= speed
		else if axis[0] > 0
			pos[0] += speed
		@

	postUpdate: ->
		axis = Engine.input.axis
		spriteTween = @spriteTween
		if axis[1] < 0
			spriteTween.goto('walkN').play()
		else if axis[1] > 0
			spriteTween.goto('walkS').play()
		else if axis[0] < 0
			spriteTween.goto('walkW').play()
		else if axis[0] > 0
			spriteTween.goto('walkE').play()
		else if not spriteTween.paused
			spriteTween.pause()
		@

new Pool(Magician)

Magician.sheet = new Sprite.Sheet(
	sprites: new Sprite.Asset('./assets/magician.png')
	size: Vec2(32, 32)
	speed: 0.15
	sequences: defaultSequence
)

Magician.Prefab = new Entity.Prefab(
	transform: null
	spriteTween:
		asset: Magician.sheet
		sequence: 'walkS'
	bounds:
		radius: 15
		shape: 'circle'
	border: null
	magician: null
)


class Enemy extends Component

	tag: 'enemy'

new Pool(Enemy)

Enemy.sheet = new Sprite.Sheet(
	sprites: new Sprite.Asset('./assets/grinch.png')
	size: Vec2(32, 32)
	speed: 0.15
	sequences: defaultSequence
)

Enemy.Prefab = new Entity.Prefab(
	transform: null
	spriteTween:
		asset: Enemy.sheet
		sequence: 'walkS'
)

# Init

Engine.gameScene = Entity.alloc(
	null,
	gameController: null
)

Engine.play(Engine.gameScene)
