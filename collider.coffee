
class Collider

	acquire: (host) ->
		@acquired = true
		host.collider = @
		host.pubsub.sub('release', @)
		@host = host

	release: ->
		@acquired = false
		@host.pubsub.unsub(null, @)
		delete @host.collider
		delete @host
		@

	collide: (target) ->
		host1 = @host
		host2 = target.host
		radius1 = host1.radius
		radius2 = host2.radius

		radiusSum = radius1 + radius2
		diffSq = Vec2.distSq(host1.pos, host2.pos)

		if diffSq > radiusSum * radiusSum
			return false

		diff = Math.sqrt(diffSq) - radiusSum
		mass1 = host1.mass or radius1
		mass2 = host2.mass or radius2

		normal = Vec2.norm(Vec2.sub(host1.pos, host2.pos, Vec2.cache[0]))
		if diff < 0
			Vec2.add(host1.pos, Vec2.scal(normal, -diff * radius1 / radiusSum, Vec2.cache[1]))
			Vec2.add(host2.pos, Vec2.scal(normal, diff * radius2 / radiusSum, Vec2.cache[1]))

		# normal vector to collision direction
		n = Vec2.set(Vec2.cache[1], normal[1], -normal[0])

		vp1 = Vec2.dot(host1.vel, normal) # velocity of P1 along collision direction
		vn1 = Vec2.dot(host1.vel, n) # velocity of P1 normal to collision direction
		vp2 = Vec2.dot(host2.vel, normal) # velocity of P2 along collision direction
		vn2 = Vec2.dot(host2.vel, n) # velocity of P2 normal to collision

		# fully elastic collision (energy & momentum preserved)
		vp1After = (mass1 * vp1 + mass2 * (2 * vp2 - vp1)) / (mass1 + mass2)
		vp2After = (mass1 * (2 * vp1 - vp2) + mass2 * vp2) / (mass1 + mass2)

		Vec2.add(
			Vec2.scal(normal, vp1After, Vec2.cache[2]),
			Vec2.scal(n, vn1, Vec2.cache[3]),
			host1.vel
		)
		Vec2.add(
			Vec2.scal(normal, vp2After, Vec2.cache[2]),
			Vec2.scal(n, vn2, Vec2.cache[3]),
			host2.vel
		)

		# sum the masses
		# massSum = @mass + target.mass
		# dist = Math.sqrt(distSq)

		# # normalize the collision vector and get its tangential
		# collision = Vec2.sub(@host.pos, target.host.pos, Vec2.cache[0])
		# Vec2.scale(collision, 1 / dist) # .norm()
		# tangent = Vec2.set(Vec2.cache[1], collision[1], -collision[0])

		# # avoid double collisions by "un-deforming" balls (larger mass == less tx)
		# # this is susceptible to rounding errors, "jiggle" behavior and anti-gravity
		# # suspension of the object get into a strange state
		# move = Vec2.scale(collision, @radius + target.radius - dist, Vec2.cache[2])
		# Vec2.add(@host.pos, Vec2.scale(move, target.mass / massSum, Vec2.cache[3]))
		# Vec2.add(target.host.pos, Vec2.scale(move, -@mass / massSum, Vec2.cache[3]))

		# # this interaction is strange, as the CR describes more than just
		# # the ball's bounce properties, it describes the level of conservation
		# # observed in a collision and to be "true" needs to describe, rigidity,
		# # elasticity, level of energy lost to deformation or adhesion, and crazy
		# # values (such as cr > 1 or cr < 0) for stange edge cases obviously not
		# # handled here (see: http:#en.wikipedia.org/wiki/Coefficient_of_restitution)
		# # for now assume the ball with the least amount of elasticity describes the
		# # collision as a whole:
		# cr = Math.min(@elasticity, target.elasticity)

		# # cache the magnitude of the applicable component of the relevant velocity
		# v1 = Vec2.len(Vec2.scale(collision, Vec2.dot(@host.vel, collision), Vec2.cache[2]))
		# v2 = Vec2.len(Vec2.scale(collision, Vec2.dot(target.host.vel, collision), Vec2.cache[2]))

		# # maintain the unapplicatble component of the relevant velocity
		# # then apply the formula for inelastic collisions
		# Vec2.scale(
		#	tangent,
		#	Vec2.dot(@host.vel, tangent),
		#	@host.vel
		# )
		# Vec2.add(
		#	@host.vel,
		#	Vec2.scale(
		#		collision,
		#		(cr * target.mass * (v2 - v1) + @mass * v1 + target.mass * v2) / massSum
		#	)
		# )

		# # do this once for each object, since we are assuming collide will be called
		# # only once per "frame" and its also more effiecient for calculation cacheing
		# # purposes
		# Vec2.scale(
		#	tangent,
		#	Vec2.dot(target.host.vel, tangent),
		#	target.host.vel
		# )
		# Vec2.add(
		#	target.host.vel,
		#	Vec2.scale(
		#		collision,
		#		(cr * @mass * (v1 - v2) + target.mass * v2 + @mass * v1) / massSum
		#	)
		# )

		# if @host1.radius > @host2.radius
		#	@host1.radius--
		#	@host2.radius++
		# else
		#	@host2.radius--
		#	@host1.radius++

		# host1.pubsub.pub('collision', host1, host2, normal)
		# host2.pubsub.pub('collision', host1, host2, normal)

		# @host.age = target.host.age = 0

		return true

Collider.Gravity = 100

class ColliderPool extends Pool

	update: (delta) ->
		delta /= 1000

		entities = @entities
		i = entities.length
		while i--
			collider = entities[i]
			if not collider.acquired
				continue

			# collider.host.vel[1] += Collider.Gravity * delta

			j = i

			while j--
				collider2 = entities[j]
				if not collider2.acquired
					continue

				collider.collide(collider2)

		@


Collider.pool = new ColliderPool(->
	return new Collider()
, 512)
