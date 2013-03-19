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
Color = require('../../lib/core/color')
Sprite = require('../../lib/core/sprite')
Transform = require('../../lib/core/transform')
Border = require('../../lib/core/border')
Collider = require('../../lib/core/collider')
Kinetic = require('../../lib/core/kinetic')

class GameController extends Component

	tag: 'gameController'

	instantiate: ->
		Hero.Prefab.alloc(@root,
			transform:
				pos: Vec2(20, 160)
		)
		@cooldown = 0
		@

	postUpdate: (dt) ->
		if (@cooldown -= dt) > 0
			return @
		@cooldown = Math.rand(0.5, 1.5)
		enemy = Enemy.Prefab.alloc(@root,
			transform:
				pos: Vec2(550, Math.rand(50, 270))
		)
		enemy.kinetic.applyImpulse(Vec2(-500, 0))
		@

new Pool(GameController)

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

class Hero extends Component

	tag: 'hero'

	constructor: ->
		@aimNormal = Vec2()

	instantiate: ->
		@cooldown = 0
		@

	fixedUpdate: ->
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

	update: (dt) ->
		input = Engine.input
		Vec2.sub(input.pos, @transform.pos, @aimNormal)

		axis = input.axis
		spriteTween = @spriteTween
		if Vec2.len(axis) > 0
			spriteTween.goto('walkE').play()
		else if not spriteTween.paused
			spriteTween.pause().goto('walkE')

		if (@cooldown -= dt) < 0 and input.touchState
			angle = Vec2.rad(@aimNormal)
			vel = Vec2.rot(
				Vec2(400, 0),
				angle
			)
			projectile = Projectile.Prefab.alloc(@root,
				transform:
					pos: @transform.pos
				kinetic:
					vel: vel
			)
			# console.log(projectile.toString())
			@cooldown = 0.1
		@

new Pool(Hero)

Hero.sheet = new Sprite.Sheet(
	sprites: new Sprite.Asset('./assets/hero.png')
	size: Vec2(32, 32)
	speed: 0.15
	sequences: defaultSequence
)

Hero.Prefab = new Entity.Prefab(
	transform: null
	spriteTween:
		asset: Hero.sheet
		sequence: 'walkS'
	bounds:
		radius: 16
		shape: 'circle'
	border: null
	hero: null
)


class Damageable extends Component

	tag: 'damageable'

	attributes:
		health: 100
		current: 100

	instantiate: (attributes) ->
		{@health, @current} = attributes
		@

	hit: (source, amount) ->
		@entity.pub('onDamage', amount)
		if (@current -= amount) < 0
			@entity.pub('onDead')
			@entity.destroy()
		@

new Pool(Damageable)


class Enemy extends Component

	tag: 'enemy'

	instantiate: ->
		@

	update: ->
		if @transform.pos[0] < 25
			@transform.pos[0] = 550
		@

	onDamage: ->
		@kinetic.applyImpulse(Vec2(-10, 0))
		@

	onDead: ->
		@entity.destroy()
		@

new Pool(Enemy)

Enemy.sheet = new Sprite.Sheet(
	sprites: new Sprite.Asset('./assets/skeleton.png')
	size: Vec2(32, 32)
	speed: 0.15
	sequences: defaultSequence
)

Enemy.Prefab = new Entity.Prefab(
	transform: null
	bounds:
		radius: 14
		shape: 'circle'
	collider:
		trigger: true
	kinetic:
		mass: 1
		drag: 1
		friction: 0
	boundsDebug: null
	damageable: null
	spriteTween:
		asset: Enemy.sheet
		sequence: 'walkW'
)


class Projectile extends Component

	tag: 'projectile'


	constructor: ->
		@lastPos = Vec2()

	instantiate: ->
		Vec2.copy(@lastPos, @transform.pos)
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

	onTrigger: (entity) ->
		entity.damageable.hit(@entity, Math.rand(10, 15))
		@entity.destroy()
		@


new Pool(Projectile)

Projectile.Prefab = new Entity.Prefab(
	transform: null
	bounds:
		shape: 'circle'
		radius: 2
	kinetic:
		mass: 0.1
		drag: 1
		friction: 0
		maxVel: 0
		maxAcc: 0
	collider:
		include: 'damageable'
		trigger: true
	# boundsDebug: null
	border:
		mode: 'kill'
	projectile: null
)

# Init

Engine.gameScene = Entity.alloc(
	null,
	gameController: null
)

Engine.play(Engine.gameScene)
