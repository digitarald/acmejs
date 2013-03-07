Component = require('./component')
Pool = require('./pool')
{Vec2} = require('./math')

# http:# gamedev.tutsplus.com/tutorials/implementation/understanding-steering-behaviors-wander/
# http://wiki.unity3d.com/index.php/Wander#JavaScript_Version_Wander.js
# http://rocketmandevelopment.com/2010/06/16/steering-behaviors-wander/
class Wander extends Component

	type: 'wander'

	presets:
		distance: 50
		radius: 25
		change: 1
		angle: 0

	reset: (presets) ->
		{@distance, @radius, @change, @angle} = presets
		@

	center = Vec2()
	force = Vec2()
	acc = Vec2()

	fixedUpdate: (dt) ->
		# circle middle is the the velocity pushed out to the radius.
		Vec2.norm(@kinetic.vel, center, @distance)

		# force length, can be changed to get a different motion
		Vec2.rot(Vec2.set(force, @radius, 0), @angle)
		# change the angle randomly to make it wander
		@angle += Math.random() * @change - @change * 0.5

		# apply the force
		Vec2.add(center, force, acc)

		# then update
		@kinetic.applyImpulse(acc)
		@

new Pool(Wander)

module.exports = Wander
