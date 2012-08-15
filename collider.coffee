
class Collider

	alloc: (owner) ->
		owner.collider = @
		owner.pubsub.sub(@, 'free')
		@owner = owner

	free: ->
		@allocd = false
		@owner.pubsub.unsub(@)
		@owner = @owner.collider = null
		@

class Pool.Colliders extends Pool

	instantiate: ->
		return new Collider()

	update: (dt) ->
		dt /= 1000

		colliders = @roster
		i = colliders.length
		while i--
			collider1 = colliders[i]
			if not collider1.allocd
				continue

			j = i
			while j--
				collider2 = colliders[j]
				if not collider2.allocd
					continue

				owner1 = collider1.owner
				owner2 = collider2.owner
				radius1 = owner1.radius
				radius2 = owner2.radius

				radiusSum = radius1 + radius2
				diffSq = Vec2.distSq(owner1.pos, owner2.pos)

				if diffSq > radiusSum * radiusSum
					continue

				diff = Math.sqrt(diffSq) - radiusSum
				mass1 = owner1.mass or radius1
				mass2 = owner2.mass or radius2

				p = Vec2.norm(Vec2.sub(owner1.pos, owner2.pos, Vec2.cache[0]))
				if diff < 0
					Vec2.add(owner1.pos, Vec2.scal(p, -diff * 2 * radius1 / radiusSum, Vec2.cache[1]))
					Vec2.add(owner2.pos, Vec2.scal(p, diff * 2 * radius2 / radiusSum, Vec2.cache[1]))
				# TODO: should be added for corrected normal:
				# p = Vec2.norm(Vec2.sub(owner1.pos, owner2.pos, Vec2.cache[0]))

				# normal vector to collision direction
				n = Vec2.set(Vec2.cache[1], p[1], -p[0])

				vp1 = Vec2.dot(owner1.vel, p) # velocity of P1 along collision direction
				vn1 = Vec2.dot(owner1.vel, n) # velocity of P1 normal to collision direction
				vp2 = Vec2.dot(owner2.vel, p) # velocity of P2 along collision direction
				vn2 = Vec2.dot(owner2.vel, n) # velocity of P2 normal to collision

				# fully elastic collision (energy & momentum preserved)
				vp1After = (mass1 * vp1 + mass2 * (2 * vp2 - vp1)) / (mass1 + mass2)
				vp2After = (mass1 * (2 * vp1 - vp2) + mass2 * vp2) / (mass1 + mass2)

				Vec2.add(
					Vec2.scal(p, vp1After, Vec2.cache[2]),
					Vec2.scal(n, vn1, Vec2.cache[3]),
					owner1.vel
				)
				Vec2.add(
					Vec2.scal(p, vp2After, Vec2.cache[2]),
					Vec2.scal(n, vn2, Vec2.cache[3]),
					owner2.vel
				)

				if not owner2.pubsub
					debugger

				owner1.pubsub.pub('collide', owner2, n)
				owner2.pubsub.pub('collide', owner1, n)
		@


Collider.pool = new Pool.Colliders(128)
