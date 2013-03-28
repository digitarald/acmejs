Component = require('./component')
Pool = require('./pool')
{Vec2} = require('./math')
Kinetic = require('./kinetic')

class Boid extends Component

	tag: 'boid'

	attributes:
		perception: 100
		aura: 25

	constructor: ->
		@mod = 2
		@cohesionMod = 1
		@avoidanceMod = 2
		@imitationMod = 1

	instantiate: (attributes) ->
		{@perception, @aura} = attributes
		if not @aura and @bounds
			@aura = @bounds.radius * 1.5
		@perceptionSq = @perception * @perception
		@auraSq = @aura * @aura
		@

cohesion = Vec2()
avoidance = Vec2()
imitation = Vec2()
stretch = Vec2()
impulse = Vec2()

Boid.fixedUpdate = (dt) ->
	boids = @register
	i = len = boids.length
	while i--
		boid1 = boids[i]
		if not boid1.enabled
			continue

		avoidanceCount = imitationCount  = cohesionCount = 0
		entity1 = boid1.entity
		pos1 = entity1.transform.pos
		vel = entity1.kinetic.velocity
		Vec2.set(impulse)

		j = len
		while j--
			boid2 = boids[j]
			if not boid2.enabled or boid1 is boid2
				continue

			entity2 = boid2.entity
			pos2 = entity2.transform.pos

			diffSq = Vec2.distSq(pos1, pos2)

			if diffSq < boid1.perceptionSq and diffSq
				Vec2.sub(pos2, pos1, stretch)
				Vec2.scal(stretch, Math.sqrt(entity1.kinetic.mass / entity2.kinetic.mass))

				# diff = Math.sqrt(diffSq)
				# Vec2.scal(stretch, Math.quadInOut(diff / boid1.perception), cache)

				# Cohesion : try to approach other boids
				if not cohesionCount++
					Vec2.copy(cohesion, stretch)
				else
					Vec2.add(cohesion, stretch)

				# Imitation : try to move in the same way than other boids
				# fit = Vec2.scal(entity2.velocity, Math.quadOut(diff / boid1.perceptionSq), cache)
				if not imitationCount++
					Vec2.copy(imitation, entity2.kinetic.velocity)
				else
					Vec2.add(imitation, entity2.kinetic.velocity)

				# Avoidance : try to keep a minimum distance between others.
				if diffSq < boid1.auraSq
					if not avoidanceCount++
						Vec2.copy(avoidance, stretch)
					else
						Vec2.add(avoidance, stretch)

		mod = boid1.mod

		if cohesionCount and boid1.cohesionMod
			if cohesionCount > 1
				Vec2.scal(cohesion, 1 / cohesionCount)
			Vec2.add(
				entity1.kinetic.force,
				Vec2.scal(
					cohesion,
					boid1.cohesionMod * mod
				)
			)

		if imitationCount and boid1.imitationMod
			if imitationCount > 1
				Vec2.scal(imitation, 1 / imitationCount)
			Vec2.add(impulse,
				Vec2.scal(
					imitation,
					boid1.imitationMod * mod
				)
			)
			Vec2.add(
				entity1.kinetic.force,
				Vec2.sub(impulse, vel)
			)

		if avoidanceCount and boid1.avoidanceMod
			if avoidanceCount > 1
				Vec2.scal(avoidance, 1 / avoidanceCount)
			Vec2.sub(entity1.kinetic.force,
				Vec2.scal(
					avoidance,
					boid1.avoidanceMod * mod
				)
			)

	@


Boid.explode = () ->
	for comp in Boid.pool.register when comp.enabled
		comp.entity.explode()
	@

new Pool(Boid)

module.exports = Boid
