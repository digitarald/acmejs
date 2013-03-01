Component = require('./component')
Pool = require('./pool')
Color = require('./color')
{Vec2} = require('./math')

class Bounds extends Component

	type: 'bounds'

	presets:
		shape: 'rect'
		radius: 0
		size: Vec2()
		# align: Vec2.center

	constructor: () ->
		@size = Vec2()
		# @align = Vec2()

	reset: (presets) ->
		Vec2.copy(@size, presets.size)
		# Vec2.copy(@align, presets.align)
		@shape = presets.shape
		@radius = presets.radius
		@

	getTop: ->
		if @shape is 'circle'
			return @transform.pos[1] - @radius
		return @transform.pos[1]

	getBottom: ->
		if @shape is 'circle'
			return @transform.pos[1] + @radius
		return @transform.pos[1] + @size[1]

	# calculateAABB: ->
	#	Vec2.set(
	#		@topLeft,
	#		@pos[0] + @size[0] * 0.5 * (@align[0] + 1),
	#		@pos[1] + @size[1] * 0.5 * (@align[1] + 1)
	#	)
	#	Vec2.set(
	#		@bottomRight,
	#		@pos[0] + @size[0] * 0.5 * (@align[0] + 5),
	#		@pos[1] + @size[1] * 0.5 * (@align[1] + 5)
	#	)

	intersectLine: (p1, p2) ->
		null

	intersect: (bound) ->
		null

	contains: (point) ->
		pos = @transform.pos
		switch @shape
			when 'circle'
				return Bounds.circPoint(pos, @radius, point)
			when 'rect'
				return Bounds.rectPoint(pos, @size, point)
		return false

	withinRect: (pos, size) ->
		mypos = @transform.pos
		switch @shape
			when 'circle'
				return Bounds.rectCirc(pos, size, mypos, @radius)
			when 'rect'
				return Bounds.rectRect(pos, size, mypos, @size)
		return false

# http://www.openprocessing.org/user/54

Bounds.circPoint = (center, radius, point) ->
	return Vec2.distSq(point, center) <= radius * radius

Bounds.rectPoint = (pos, size, point) ->
	return (
		pos[0] - size[0] < point[0] and
		pos[1] < point[1] and
		pos[0] + size[0] > point[0] and
		pos[1] + size[1] > point[1]
	)

Bounds.rectCirc = (topLeft, size, center, radius) ->
	circleDistanceX = Math.abs(center[0] - topLeft[0] - size[0] / 2)
	circleDistanceY = Math.abs(center[1] - topLeft[1] - size[1] / 2)

	if circleDistanceX > (size[0] / 2 + radius) or circleDistanceY > (size[1] / 2 + radius)
		return false
	if circleDistanceX <= size[0] / 2 or circleDistanceY <= size[1] / 2
		return true

	cornerDistance = Math.pow(circleDistanceX - size[0] / 2, 2) + Math.pow(circleDistanceY - size[1] / 2, 2)
	return cornerDistance <= Math.pow(radius, 2)

Bounds.rectRect = (pos, size, pos2, size2) ->
	return not (
		pos[0] > pos2[0] + size2[0] or
		pos[0] + size[0] < pos2[0] or
		pos[1] > pos2[1] + size2[1] or
		pos[1] + size[1] < pos2[1]
	)

# http://seb.ly/2009/05/super-fast-trianglerectangle-intersection-test/

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

class BoundsDebug extends Component

	type: 'boundsDebug'

	presets:
		color: Color.white
		opacity: 0.5
		fill: false

	constructor: () ->
		@color = Vec2()

	reset: (presets) ->
		Vec2.copy(@color, presets.color)
		{@opacity, @fill} = presets
		@

	render: (ctx) ->
		bounds = @bounds
		ctx.save()
		if @fill
			ctx.fillStyle = Color.rgba(@color, @opacity * 0.5)
		ctx.strokeStyle = Color.rgba(@color, @opacity)
		ctx.lineWidth = 1
		@transform.applyMatrix(ctx)
		if bounds.shape is 'circle'
			ctx.beginPath()
			ctx.lineTo(0, bounds.radius)
			ctx.moveTo(0, 0)
			ctx.arc(0, 0, bounds.radius | 0, 0, Math.TAU)
			if @fill
				ctx.fill()
			ctx.stroke()
		else
			size = bounds.size
			ctx.strokeRect(
				- size[0] / 2 | 0,
				- size[1] / 2 | 0,
				size[0] | 0,
				size[1] | 0
			)
			if @fill
				ctx.fillRect(
					- size[0] / 2 | 0,
					- size[1] / 2 | 0,
					size[0] | 0,
					size[1] | 0
				)
		ctx.restore()
		@

new Pool(BoundsDebug)

Bounds.Debug = BoundsDebug

module.exports = Bounds
