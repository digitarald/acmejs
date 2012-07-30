
Vec2 = (fromOrX, y) ->

	if typeof y isnt 'undefined'
		return [fromOrX, y]

	if typeof fromOrX isnt 'undefined'
		return [fromOrX[0], fromOrX[1]]

	return [0, 0]

# if 'Float32Array' of window
#	Vec2Wrappped = Vec2
#	Vec2 = (fromOrX, y) ->
#		return new Float32Array(Vec2Wrappped(fromOrX, y))

Vec2.cache = [Vec2(), Vec2(), Vec2(), Vec2(), Vec2()]
Vec2.angleCache = [Vec2(), Vec2()]

Vec2.EPSILON = 0.00001

Vec2.set = (a, x, y) ->
	a[0] = x
	a[1] = y
	return a

Vec2.eq = (a, b) ->
	e = Vec2.EPSILON

	d1 = Math.abs(a[0] - b[0])
	d2 = Math.abs(a[1] - b[1])
	return d1 < e and d2 < e

Vec2.add = (a, b, result) ->
	result = result or a

	result[0] = a[0] + b[0]
	result[1] = a[1] + b[1]
	return result

Vec2.sub = (a, b, result) ->
	result = result or a

	result[0] = a[0] - b[0]
	result[1] = a[1] - b[1]
	return result

Vec2.mul = (a, b, result) ->
	result = result or a

	result[0] = a[0] * b[0]
	result[1] = a[1] * b[1]
	return result

Vec2.sca = (a, scl, result) ->
	result = result or a

	result[0] = a[0] * scl
	result[1] = a[1] * scl
	return result

Vec2.neg = (a, result) ->
	result = result or a

	result[0] = -a[0]
	result[1] = -a[1]
	return result

Vec2.norm = (a, result) ->
	result = result or a

	x = a[0]
	y = a[1]
	len = Math.sqrt(x * x + y * y)

	len = 1 / len
	result[0] = x * len
	result[1] = y * len
	return result

Vec2.len = (a) ->
	x = a[0]
	y = a[1]
	return Math.sqrt(x * x + y * y)

Vec2.dot = (a, b) ->
	return a[0] * b[0] + a[1] * b[1]

Vec2.cross = (a, b) ->
	return a[0] * b[1] - a[1] * b[0]

Vec2.dist = (a, b) ->
	x = b[0] - a[0]
	y = b[1] - a[1]
	return Math.sqrt(x * x + y * y)

Vec2.angle = (a, b) ->
	if not b
		return Math.atan2(a[0], a[1])

	return Math.acos(Vec2.dot(
		Vec2.norm(a, Vec2.angleCache[0]),
		Vec2.norm(b, Vec2.angleCache[1])
	))

Vec2.clamp = (a, low, high, result) ->
	result = result or a

	result[0] = Math.clamp(a[0], low[0], high[0])
	result[1] = Math.clamp(a[1], low[1], high[1])
	return result

Math.TAU = Math.PI * 2

Math.clamp = (a, low, high) ->
	if a < low
		return low
	return if a > high then high else a
