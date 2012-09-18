
class Effector extends Component

	name: 'effector'

	alloc: (parent, @radius = 100, @mass = @parent.mass) ->
		super(parent)
		@radiusSq = @radius * @radius
		@ease = Math.quadIn
		@

Effector.simulate = (dt) ->

	effectors = @roster
	i = effectors.length
	while i--
		effector1 = effectors[i]
		continue if not effector1.enabled

		avoidanceCount = imitationCount  = cohesionCount = 0

		j = effectors.length
		while j--
			effector2 = effectors[j]
			continue if not effector2.enabled or effector1 is effector2

			parent1 = effector1.parent
			parent2 = effector2.parent
			acc = parent1.acc

			diffSq = Vec2.distSq(parent1.pos, parent2.pos)

			# Avoidance : try to keep a minimum distance between others.
			if diffSq < effector1.radiusSq
				diff = Math.sqrt(diffSq)
				Vec2.add(
					acc,
					Vec2.scal(
						Vec2.sub(parent1.pos, parent2.pos, avoidance),
						2
					)
				)

		if cohesionCount
			if cohesionCount > 1
				Vec2.scal(cohesion, 1 / cohesionCount)
			Vec2.limit(
				Vec2.sub(cohesion, parent1.pos),
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
