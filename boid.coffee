
class Boid extends Component

	name: 'boid'

	constructor: ->
		super()
		@mod = 1
		@cohesionMod = 0.5
		@avoidanceMod = 2
		@imitationMod = 1

	alloc: (parent, @perception = 200, aura) ->
		super(parent)
		@aura = aura or @parent.radius * 1.5

		@perceptionSq = @perception * @perception
		@auraSq = @aura * @aura
		@

Boid.fixedUpdate = (dt) ->
	cohesion = Vec2.cache[0]
	avoidance = Vec2.cache[1]
	imitation = Vec2.cache[2]
	cache = Vec2.cache[3]
	stretch = Vec2.cache[4]
	acc = Vec2.cache[4]

	limit = Kinetic.maxAcc / 3

	boids = @roster
	i = len = boids.length
	while i--
		boid1 = boids[i]
		if not boid1.enabled
			continue

		avoidanceCount = imitationCount  = cohesionCount = 0
		parent1 = boid1.parent
		pos1 = parent1.transform.pos
		vel = parent1.kinetic.vel
		Vec2.set(acc)

		j = len
		while j--
			boid2 = boids[j]
			if not boid2.enabled or boid1 is boid2
				continue

			parent2 = boid2.parent
			pos2 = parent2.transform.pos

			diffSq = Vec2.distSq(pos1, pos2)

			if diffSq < boid1.perceptionSq
				Vec2.sub(pos2, pos1, stretch)
				Vec2.scal(stretch, Math.sqrt(parent1.kinetic.mass / parent2.kinetic.mass))

				# diff = Math.sqrt(diffSq)
				# Vec2.scal(stretch, Math.quadInOut(diff / boid1.perception), cache)

				# Cohesion : try to approach other boids
				if not cohesionCount++
					Vec2.copy(cohesion, stretch)
				else
					Vec2.add(cohesion, stretch)

				# Imitation : try to move in the same way than other boids
				# fit = Vec2.scal(parent2.vel, Math.quadOut(diff / boid1.perceptionSq), cache)
				if not imitationCount++
					Vec2.copy(imitation, parent2.kinetic.vel)
				else
					Vec2.add(imitation, parent2.kinetic.vel)

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
			Vec2.add(parent1.kinetic.acc,
				Vec2.scal(
					cohesion,
					boid1.cohesionMod * mod
				)
			)
			# engine.renderer.debug.push(Vec2(pos1), Vec2(cohesion))

		if imitationCount and boid1.imitationMod
			if imitationCount > 1
				Vec2.scal(imitation, 1 / imitationCount)
			Vec2.add(acc,
				Vec2.scal(
					imitation,
					boid1.imitationMod * mod
				)
			)
			Vec2.add(
				parent1.kinetic.acc,
				Vec2.sub(acc, vel)
			)

		if avoidanceCount and boid1.avoidanceMod
			if avoidanceCount > 1
				Vec2.scal(avoidance, 1 / avoidanceCount)
			Vec2.sub(parent1.kinetic.acc,
				Vec2.scal(
					avoidance,
					boid1.avoidanceMod * mod
				)
			)

	@


Boid.explode = (scene) ->
	for comp in Boid.pool.roster when comp.enabled
		comp.parent.explode()
	@

new Pool(Boid)
