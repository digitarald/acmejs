Component = require('./component')
Pool = require('./pool')
{Vec2} = require('./math')

# http://rocketmandevelopment.com/2010/06/11/steering-behaviors-seeking/
class Avoid extends Component

	tag: 'avoid'

	attributes:
		targets: null
		sight: 100

	instantiate: (attributes) ->
		{@targets, @sight} = attributes
		@register = Pool.byTag[@targets]
		@

	forward = Vec2()
	diff = Vec2()
	ray = Vec2()
	projection = Vec2()
	tmp = Vec2()

	# http://rocketmandevelopment.com/2010/07/13/steering-behaviors-obstacle-avoidance/
	# http://my.safaribooksonline.com/book/programming/game-programming/0596005555/flocking/ch04_sect1_003
	fixedUpdate: (dt) ->
		for target in @register when target.enabled
			Vec2.norm(@kinetic.velocity, u)


			Vec2.scal(u, @sight, v)
			Vec2.sub(target.pos, @transform.pos, a)
			Vec2.mul(Vec2.mul(a, u, p), u)
			Vec2.sub(p, a, b)
			if (Vec2.len(b) < target.bounds.radius) and (Vec2.len(p) < Vec2.len(v))
				# Impending collision...steer away
				w = Vec2.rot(a, Vec2.rad(@kinetic.velocity), w)
				Vec2.norm(w)
				if w[0] < 0
					m = 1
				if w[0] > 0
					m = -1
				Fs.x += m * _STEERINGFORCE * (_COLLISION_VISIBILITY_FACTOR * Units[i].fLength) / a.Magnitude()

			# # get the forward vector
			# Vec2.norm(@kinetic.velocity, forward)
			# # get the difference between the circle and the vehicle
			# Vec2.sub(target.transform.pos, @transform.pos, diff)
			# # get the dot product
			# dotProd = Vec2.dot(diff, forward)
			# # this will be used for projection
			# # much like in the <a href="http:# rocketmandevelopment.com/2010/05/19/separation-of-axis-theorem-for-collision-detection/">SAT</a>

			# # if this object is in front of the vehicle
			# if dotProd > 0
			#	# get the ray
			#	Vec2.scal(forward, checkLength, ray)
			#	# project the forward vector
			#	Vec2.scal(forward, dotProd, projection)
			#	# get the distance between the circle and vehicle
			#	dist = Vec2.len(Vec2.sub(projection, diff, tmp))

			#	if dist < target.bounds.radius + width && projection.length < ray.length
			#		# if the circle is in your path (radius+width to check the full size of the vehicle)
			#		# projection.length and ray.length make sure you are within the max distance
			#		# get the max force
			#		force = forward.cloneVector().multiply(maxSpeed);
			#		# rotate it away from the cirlce
			#		force.angle += diff.sign(velocity) * Math.PI / 2;
			#		# PI / 2 is 90 degrees, vector's angles are in radians
			#		# sign returns whether the vector is to the right or left of the other vector
			#		force.multiply(1 - projection.length / ray.length); # scale the force so that a far off object
			#		# doesn't drastically change the velocity
			#		velocity.add(force);# change the velocity
			#		velocity.multiply(projection.length / ray.length);# and scale again

		# then update
		@kinetic.applyImpulse(impulse)
		@

new Pool(Avoid)

module.exports = Avoid
