
class Collider extends Component

	name: 'collider'

Collider.simulate = (dt) ->
	colliders = @roster
	i = colliders.length
	while i--
		collider1 = colliders[i]
		if not collider1.enabled
			continue

		j = i
		while j--
			collider2 = colliders[j]
			if not collider2.enabled
				continue

			parent1 = collider1.parent
			parent2 = collider2.parent
			radius1 = parent1.radius
			radius2 = parent2.radius
			pos1 = parent1.transform.pos
			pos2 = parent2.transform.pos

			radiusSum = radius1 + radius2
			diffSq = Vec2.distSq(pos1, pos2)

			if diffSq > radiusSum * radiusSum
				continue

			diff = Math.sqrt(diffSq) - radiusSum
			vel1 = parent1.kinetic.vel
			vel2 = parent2.kinetic.vel
			mass1 = parent1.kinetic.mass
			mass2 = parent2.kinetic.mass

			p = Vec2.norm(Vec2.sub(pos1, pos2, Vec2.cache[0]))
			if diff < 0
				Vec2.add(pos1, Vec2.scal(p, -diff * 2 * radius1 / radiusSum, Vec2.cache[1]))
				Vec2.add(pos2, Vec2.scal(p, diff * 2 * radius2 / radiusSum, Vec2.cache[1]))
			# TODO: should be added for corrected normal:
			# p = Vec2.norm(Vec2.sub(parent1.pos, parent2.pos, Vec2.cache[0]))

			# normal vector to collision direction
			n = Vec2.set(Vec2.cache[1], p[1], -p[0])

			vp1 = Vec2.dot(vel1, p) # velocity of P1 along collision direction
			vn1 = Vec2.dot(vel1, n) # velocity of P1 normal to collision direction
			vp2 = Vec2.dot(vel2, p) # velocity of P2 along collision direction
			vn2 = Vec2.dot(vel2, n) # velocity of P2 normal to collision

			# fully elastic collision (energy & momentum preserved)
			vp1After = (mass1 * vp1 + mass2 * (2 * vp2 - vp1)) / (mass1 + mass2)
			vp2After = (mass1 * (2 * vp1 - vp2) + mass2 * vp2) / (mass1 + mass2)

			Vec2.add(
				Vec2.scal(p, vp1After, Vec2.cache[2]),
				Vec2.scal(n, vn1, Vec2.cache[3]),
				vel1
			)
			Vec2.add(
				Vec2.scal(p, vp2After, Vec2.cache[2]),
				Vec2.scal(n, vn2, Vec2.cache[3]),
				vel2
			)

			parent1.pub('collide', parent2, n)
			parent2.pub('collide', parent1, n)
	@

new Pool(Collider)
