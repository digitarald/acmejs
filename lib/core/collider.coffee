Component = require('./component')
Pool = require('./pool')
{Vec2} = require('./math')
Engine = require('./engine')

# FIXME: Circle Collider only
# http://gamedev.tutsplus.com/tutorials/implementation/when-worlds-collide-simulating-circle-circle-collisions/
# https://sites.google.com/site/t3hprogrammer/research/circle-circle-collision-tutorial#TOC-Dynamic-Circle-Circle-Collision
class Collider extends Component

	tag: 'collider'

	attributes:
		trigger: false
		include: null
		exclude: null

	instantiate: (attributes) ->
		{@trigger, @include, @exclude} = attributes
		@

Collider.simulate = (dt) ->
	colliders = @register
	i = colliders.length
	while i--
		collider1 = colliders[i]
		if not collider1.enabled
			continue

		j = i
		while j-- and collider1.enabled
			collider2 = colliders[j]
			kinetic1 = collider1.kinetic
			kinetic2 = collider2.kinetic
			entity1 = collider1.entity
			entity2 = collider2.entity
			if not collider2.enabled or (kinetic1.sleeping and kinetic2.sleeping) or (collider1.include and not collider2[collider1.include]) or (collider2.include and not collider1[collider2.include]) or (collider1.exclude and collider2[collider1.exclude]) or (collider2.exclude and collider1[collider2.exclude])
				continue

			radius1 = entity1.bounds.radius
			radius2 = entity2.bounds.radius
			pos1 = entity1.transform.pos
			pos2 = entity2.transform.pos

			radiusSum = radius1 + radius2
			diffSq = Vec2.distSq(pos1, pos2)

			if diffSq > radiusSum * radiusSum
				continue

			p = Vec2.norm(Vec2.sub(pos1, pos2, Vec2.cache[0]))
			diff = Math.sqrt(diffSq)

			if collider1.trigger or collider2.trigger
				# debugger
				entity1.pub('onTrigger', entity2, p, diff)
				entity2.pub('onTrigger', entity1, p, diff)
				continue

			diff -= radiusSum
			vel1 = kinetic1.vel
			vel2 = kinetic2.vel
			mass1 = kinetic1.mass or 1
			mass2 = kinetic2.mass or 1

			if diff < 0
				Vec2.add(pos1, Vec2.scal(p, -diff * 2 * radius1 / radiusSum, Vec2.cache[1]))
				Vec2.add(pos2, Vec2.scal(p, diff * 2 * radius2 / radiusSum, Vec2.cache[1]))
			# TODO: should be added for corrected normal:
			# p = Vec2.norm(Vec2.sub(entity1.pos, entity2.pos, Vec2.cache[0]))

			# normal vector to collision direction
			# n = Vec2.set(Vec2.cache[1], p[1], -p[0])
			n = Vec2.perp(p, Vec2.cache[1])

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
			# kinetic1.dirty = true
			Vec2.add(
				Vec2.scal(p, vp2After, Vec2.cache[2]),
				Vec2.scal(n, vn2, Vec2.cache[3]),
				vel2
			)
			# kinetic2.dirty = true

			entity1.pub('onCollide', entity2, n)
			entity2.pub('onCollide', entity1, n)
	@

new Pool(Collider)

module.exports = Collider
