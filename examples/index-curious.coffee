
{Vec2} = require('./lib/math')
Engine = require('./lib/engine')

Engine.init(document.getElementById('game-1'))

Renderer = require('./lib/renderer')
Engine.renderer = new Renderer(Engine.element.getElementsByClassName('game-canvas')[0], Vec2(480, 320))


# Game

Entity = require('./lib/entity')
Component = require('./lib/component')
Pool = require('./lib/pool')
Color = require('./lib/color')
Sprite = require('./lib/sprite')
Transform = require('./lib/transform')
Bounds = require('./lib/bounds')
Kinetic = require('./lib/kinetic')
Collider = require('./lib/collider')
Particle = require('./lib/particle')

class MenuController extends Component

	tag: 'menuController'

new Pool(MenuController)

Engine.menuScene = Entity.alloc(
	null,
	menuController: null
)

# Game AI Manager
# TODO: Retype

class GameController extends Component

	tag: 'gameController'

	instantiate: ->
		@baseCharge = 1
		@charge = 1
		@nextCharge = @baseCharge

		Earth.Prefab.alloc(@root,
			transform:
				pos: Vec2(240, 160)
		)
		@

	update: (dt) ->
		@charge += dt / @nextCharge
		if @charge < 1
			return
		@charge = 0
		@nextCharge = @baseCharge * Math.rand(1, 1.2)

		pos = Vec2(Math.rand(-150, 0), Math.rand(-150, 0))
		radius = Math.rand(3, 7)
		comet = Comet.Prefab.alloc(@entity,
			transform:
				pos: pos
			bounds:
				radius: radius
			kinetic:
				mass: radius
				drag: 1
				friction: 0
		)
		vel = comet.kinetic.vel
		Vec2.add(vel, Vec2(Math.rand(0.8, 1.2), Math.rand(0.9, 1.1)))
		Vec2.scal(vel, Math.rand(30, 40))

new Pool(GameController)


# Earth

class Earth extends Component

	tag: 'earth'

	constructor: () ->
		@normal = Vec2()

	instantiate: () ->
		@gravityRadius = 200
		@state = @hovered = null
		@

	fixedUpdate: (dt) ->
		pos = @transform.pos
		gravityRadiusSq = @gravityRadius * @gravityRadius

		for kinetic in Kinetic.pool.register when kinetic.enabled and not kinetic.fixed and kinetic.mass
			pos2 = kinetic.entity.transform.pos
			distSq = Vec2.distSq(pos, pos2)
			if distSq < gravityRadiusSq
				factor = 1 - Math.sqrt(distSq) / @gravityRadius
				kinetic.applyForce(
					Vec2.norm(
						Vec2.sub(
							pos, pos2, Vec2.cache[0]
						),
						null,
						Math.quadIn(factor) * 750 / kinetic.mass
					)
				)

	update: (dt) ->
		input = Engine.input
		Vec2.sub(input.pos, @transform.pos, @normal)
		switch @state
			when null
				dist = Vec2.len(@normal)
				if dist > @bounds.radius
					if @hovered
						@hovered = false
					break
				if not @hovered
					@hovered = true
				if input.touchState isnt 'began'
					break
				@state = 'active'
			when 'active'
				@angle = Vec2.rad(@normal)
				if input.touchState is 'ended'
					Weapon.Prefab.alloc(@root,
						transform:
							pos: Vec2.add(
								Vec2.rot(
									Vec2.set(Vec2.cache[0], @bounds.radius * 1.2, 0),
									@angle
								),
								@transform.pos
							)
							angle: @angle
					)
					@state = null
		@

	render: (ctx) ->
		if not @state and not @hovered
			return @
		ctx.save()
		@transform.transform(ctx)

		if @hovered
			ctx.beginPath()
			ctx.arc(0, 0, @bounds.radius, 0, Math.TAU, true)
			ctx.closePath()
			ctx.lineWidth = 1
			ctx.strokeStyle = Color.rgba(Color.white)
			ctx.stroke()

		if @state is 'active'
			arc = Math.TAU / 8 / 2
			lowArc = Math.TAU / 45
			angle = @angle
			ctx.beginPath()
			ctx.arc(0, 0, @bounds.radius + 2, angle - lowArc, angle + lowArc)
			ctx.arc(0, 0, @bounds.radius * 3, angle + arc, angle - arc, true)
			ctx.closePath()
			ctx.lineWidth = 1
			ctx.strokeStyle = Color.rgba(Color.white)
			ctx.stroke()

		ctx.restore()
		@

Earth.sprite = new Sprite.Asset('assets/globe.gif', Vec2(11, 11), 5)

new Pool(Earth)

Earth.Prefab = new Entity.Prefab(
	transform: null
	bounds:
		radius: 25
	collider:
		trigger: true
	spriteTween:
		asset: Earth.sprite
	earth: null
)

# Comet

class Comet extends Component

	tag: 'comet'

	constructor: () ->
		@normal = Vec2()
		@lifetime = 10

	instantiate: (attributes) ->
		@kinetic.maxVel = 100
		@age = 0

		@target = Earth.pool.register[0].transform

		@color = Color(156, 156, 156)

		center = @bounds.radius | 0
		# asset = new Sprite.Asset((ctx) ->
		#	ctx.beginPath()
		#	ctx.arc(center, center, center, 0, Math.TAU)
		#	ctx.closePath()
		#	ctx.fillStyle = Color.rgba(Color(156, 156, 156))
		#	ctx.fill()
		# , Vec2(center * 2, center * 2))
		# Sprite.Tween.alloc(@entity,
		#	asset: asset
		# )
		@

	update: (dt) ->
		if (@bounds.radius -= dt / 2) < 2 or (@age += dt) > @lifetime
			@explode()
			return

		@kinetic.mass = @bounds.radius

		if @bounds.culled
			return
		pos = Vec2.cache[0]
		i = @bounds.radius * dt * 25 | 0
		while i--
			Vec2.set(pos, Math.rand(-1, 1), Math.rand(-1, 1))
			Vec2.norm(pos, null, Math.rand(0, 1, Math.quadOut) * @bounds.radius)
			pointer = Vec2.copy(Vec2.cache[1], pos)
			Vec2.add(
				Vec2.norm(pos, null, @bounds.radius),
				@transform.pos
			)
			particle = Entity.alloc(@root,
					transform:
						pos: pos
					kinetic:
						vel: Vec2.scal(pointer, Math.rand(-0.5, -4))
					particle:
						radius: Math.rand(2.5, 5)
						lifetime: Math.rand(0.02, 0.1)
						sprite: Comet.particleTrail
				)
		@

	render: (ctx) ->
		if Engine.renderer.cull(@)
			return @
		ctx.beginPath()
		ctx.arc(@transform.pos[0], @transform.pos[1], @bounds.radius, 0, Math.TAU)
		ctx.closePath()
		ctx.fillStyle = Color.rgba(@color)
		ctx.fill()
		@

	onTrigger: (entity2, p, diff) ->
		if entity2.earth
			@explode()
		@

	explode: () ->
		if @bounds.culled
			@entity.destroy()
			return
		i = @bounds.radius * 4 | 0
		while i--
			pos = Vec2.set(Vec2.cache[0], Math.rand(-1, 1), Math.rand(-1, 1))
			Vec2.norm(pos, null, Math.rand(0, 1, Math.quadOut) * @bounds.radius)
			pointer = Vec2.copy(Vec2.cache[1], pos)
			Vec2.add(
				Vec2.norm(pos, null, @bounds.radius),
				@transform.pos
			)
			radius = Math.rand(2, 10)
			particle = Particle.Prefab.alloc(@root,
					transform:
						pos: pos
					kinetic:
						vel: Vec2.scal(pointer, Math.rand(1, 5))
					particle:
						radius: radius
						lifetime: Math.rand(0.01, 0.04)
						sprite: Comet.particleTrail
				)
		@entity.destroy()
		@

Comet.particleTrail = Particle.generateSprite(Color(192, 192, 192), 0.2)
Comet.particleFire1 = Particle.generateSprite(Color(252, 238, 51), 0.9)
Comet.particleFire2 = Particle.generateSprite(Color(243, 18, 14), 0.9)

new Pool(Comet)

Comet.Prefab = new Entity.Prefab(
	transform: null
	collider:
		trigger: true
	kinetic: null
	comet: null
)


# Weapon

class Weapon extends Component

	tag: 'weapon'

	constructor: () ->
		@normal = Vec2()
		@lockedNorm = Vec2()

	instantiate: (attributes) ->
		@state = null
		@arc = Math.TAU / 8
		@targets = Comet
		@range = 100
		@orbit = @bounds.radius * 1.2
		@colorAmmo = Color(255, 0, 0)
		@

	update: (dt) ->
		input = Engine.input
		normal = Vec2.cache[0]
		pos = @transform.pos

		if @transform.angle isnt @angle
			Vec2.rot(Vec2.set(pos, @orbit, 0), @angle)
			Vec2.copy(@normal, pos)
			Vec2.add(pos, @entity.transform.pos)
			@transform.angle = @angle

		rangeSq = @range * @range

		switch @state
			when null
				if Vec2.distSq(input.pos, pos) < @rangeSq
					rad = Vec2.rad(Vec2.sub(input.pos, pos, normal), @normal)
					if rad < @arc / 2
						console.log('locked')
						@locked = input.pos
						@state = 'locked'
						debugger
				break
			when 'locked'
				Vec2.sub(input.pos, pos, @lockedNorm)
				@lockedRad = Vec2.rad(@lockedNorm, @normal)
				if Vec2.lenSq(@lockedNorm) > @rangeSq or @lockedRad > @arc / 2
					@state = @locked = null
				particle = Entity.alloc(@root,
					transform:
						pos: pos
					particle:
						radius: 1
					kinetic:
						vel: @lockedNorm
				)
				# Vec2.scal(particle.vel, 100)
				break
		@

	render: (ctx) ->
		ctx.save()
		ctx.translate(@transform.pos[0], @transform.pos[1])
		ctx.rotate(@transform.angle)
		ctx.fillStyle = Color.rgba(Color.white)
		ctx.fillRect(-2.5, -2.5, 5, 5)
		ctx.restore()

		switch @state
			when 'locked'
				ctx.save()
				ctx.beginPath()
				ctx.arc(@locked[0], @locked[1], 3, 0, Math.TAU, true)
				ctx.closePath()
				ctx.lineWidth = 1
				ctx.strokeStyle = Color.rgba(@colorAmmo)
				ctx.stroke()
				ctx.restore()
				break
		@

	intercept: (target, targetVel) ->
		pos = @transform.pos
		vel = @transform.maxVel
		tmp = Vec2.sub(target, pos, Vec2.cache[0])
		a = vel * vel - Vec2.dot(targetVel, targetVel)
		b = -2 * Vec2.dot(targetVel, tmp)
		c = -Vec2.dot(tmp, tmp)
		d = (b + Math.sqrt(b * b - 4 * a * c)) / (2 * a)
		interception = Vec2.mul(Vec2.add(Vec2.set(tmp, d, d), target), targetVel)
		return Vec2.scal(
			Vec2.sub(interception, pos, Vec2()),
			vel / Math.sqrt(Vec2.dot(dist, dist))
		)


new Pool(Weapon)

Weapon.Prefab = new Entity.Prefab(
	transform: null
	bounds:
		shape: 'circle'
	weapon: null
)

Engine.gameScene = Entity.alloc(
	null,
	gameController: null
)

# Init

Engine.play(Engine.gameScene)
