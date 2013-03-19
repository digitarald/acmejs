Component = require('./component')
Pool = require('./pool')
{Vec2} = require('./math')


class Effector extends Component

	tag: 'effector'

	alloc: (entity, @radius = 100, @mass = @entity.mass) ->
		super(entity)
		@radiusSq = @radius * @radius
		@ease = Math.quadIn
		@

Effector.simulate = (dt) ->

	effectors = @register
	i = effectors.length
	while i--
		effector1 = effectors[i]
		continue if not effector1.enabled

		avoidanceCount = imitationCount  = cohesionCount = 0

		j = effectors.length
		while j--
			effector2 = effectors[j]
			continue if not effector2.enabled or effector1 is effector2

			entity1 = effector1.entity
			entity2 = effector2.entity
			acc = entity1.acc

			diffSq = Vec2.distSq(entity1.pos, entity2.pos)

			# Avoidance : try to keep a minimum distance between others.
			if diffSq < effector1.radiusSq
				diff = Math.sqrt(diffSq)
				Vec2.add(
					acc,
					Vec2.scal(
						Vec2.sub(entity1.pos, entity2.pos, avoidance),
						2
					)
				)

		if cohesionCount
			if cohesionCount > 1
				Vec2.scal(cohesion, 1 / cohesionCount)
			Vec2.limit(
				Vec2.sub(cohesion, entity1.pos),
				limit
			)
			Vec2.add(acc, Vec2.scal(cohesion, effector1.cohesionMod))

		if imitationCount
			if imitationCount > 1
				Vec2.scal(imitation, 1 / imitationCount)
			Vec2.limit(imitation, limit)
			Vec2.add(acc, Vec2.scal(imitation, effector1.imitationMod))
	@

new Pool(Effector)

module.exports = Effector
