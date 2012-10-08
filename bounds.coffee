Component = require('./component')
Pool = require('./pool')
{Vec2} = require('./math')

class Bounds extends Component

	type: 'bounds'

	presets:
		shape: 'rect'
		radius: 0
		size: Vec2()

	constructor: () ->
		@topLeft = Vec2()
		@bottomRight = Vec2()
		@size = Vec2()

	reset: (presets) ->
		Vec2.copy(@size, presets.size)
		@shape = presets.shape
		@radius = presets.radius

		@epsilion = 0
		@

	intersectLine: (p1, p2) ->
		null

	intersect: (bound) ->
		null

	contains: (point) ->
		transform = @parent.transform
		e = @epsilion
		switch @shape
			when 'sphere'
				return Vec2.distSq(transform.pos, point) <= @radius * @radius
			when 'rect'
				return (
						transform.pos[0] < point[0] and
						transform.pos[1] < point[1] and
						transform.pos[0] + @size[0] > point[0] and
						transform.pos[1] + @size[1] > point[1]
					)
		return false


# http://www.openprocessing.org/user/54
# http://seb.ly/2009/05/super-fast-trianglerectangle-intersection-test/

Bounds.rectCircle = (topLeft, size, center, radius) ->
	circleDistanceX = abs(cx - rx - rw/2)
	circleDistanceY = abs(cy - ry - rh/2)

	if circleDistanceX > (rw/2 + cr) or circleDistanceY > (rh/2 + cr)
		return false
	if circleDistanceX <= rw/2 or circleDistanceY <= rh/2
		return true

	cornerDistance = Math.pow(circleDistanceX - rw/2, 2) + pow(circleDistanceY - rh/2, 2)
	return cornerDistance <= pow(cr, 2)

Bounds.rectRect = (@topLeft, @bottomRight, @topLeft2, @bottomRight2) ->
	return (left > otherRight or right < otherLeft or top > otherBottom or bottom < otherTop)

Bounds.lineRect = (point1, point2, @topLeft, @size) ->
  # Calculate m and c for the equation for the line (y = mx+c)
  m = (y2-y1) / (x2-x1)
  c = y1 -(m*x1)

  # If the line is going up from right to left then the top intersect point is on the left
  if (m > 0)
    topIntersection = (m*rx  + c)
    bottomIntersection = (m*(rx+rw)  + c)
  # Otherwise it's on the right
  else
    topIntersection = (m*(rx+rw)  + c)
    bottomIntersection = (m*rx  + c)

  # Work out the top and bottom extents for the triangle
  if(y1 < y2)
    topPoint = y1
    bottomPoint = y2
  else
    topPoint = y2
    bottomPoint = y1

  # Calculate the overlap between those two bounds
  topOverlap = topIntersection > topPoint ? topIntersection : topPoint
  botOverlap = bottomIntersection < bottomPoint ? bottomIntersection : bottomPoint

  return (topOverlap<botOverlap) && (!((botOverlap<ry) || (topOverlap>ry+rh)))

Bounds.lineCirc = (point1, point2, center, radius) ->
	dx = x2 - x1
	dy = y2 - y1
	a = dx * dx + dy * dy
	b = 2 * (dx * (x1 - cx) + dy * (y1 - cy))
	c = cx * cx + cy * cy
	c += x1 * x1 + y1 * y1
	c -= 2 * (cx * x1 + cy * y1)
	c -= cr * cr
	bb4ac = b * b - 4 * a * c

	# println(bb4ac)

	if (bb4ac < 0)  # Not intersecting
		return false

	mu = (-b + sqrt( b*b - 4*a*c )) / (2*a)
	ix1 = x1 + mu*(dx)
	iy1 = y1 + mu*(dy)
	mu = (-b - sqrt(b*b - 4*a*c )) / (2*a)
	ix2 = x1 + mu*(dx)
	iy2 = y1 + mu*(dy)

	# The intersection points
	# ellipse(ix1, iy1, 10, 10)
	# ellipse(ix2, iy2, 10, 10)

	# Figure out which point is closer to the circle
	if (dist(x1, y1, cx, cy) < dist(x2, y2, cx, cy))
		testX = x2
		testY = y2
	else
		testX = x1
		testY = y1

	if (dist(testX, testY, ix1, iy1) < dist(x1, y1, x2, y2) or dist(testX, testY, ix2, iy2) < dist(x1, y1, x2, y2))
		return true

	return false

new Pool(Bounds)

module.exports = Bounds
