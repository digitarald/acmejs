
Mat = Math # compression win
Mat.epsilon = 0.001
{sqrt, pow, abs, random, epsilon} = Mat
Mat.TypedArray = typedArray = Float64Array or Float32Array or (arr) -> arr

Vec2 = (fromOrX, y) ->
	if y?
		return new typedArray([fromOrX, y])
	if fromOrX?
		return new typedArray(fromOrX)
	return new typedArray(Vec2.zero)

Vec2.zero = Vec2.center = Vec2(0, 0)
Vec2.cache = [Vec2(), Vec2(), Vec2(), Vec2(), Vec2()]
Vec2.topLeft = Vec2(1, -1)
Vec2.topCenter = Vec2(0, -1)
Vec2.topRight = Vec2(-1, -1)
Vec2.centerLeft = Vec2(1, 0)
Vec2.centerRight = Vec2(-1, 0)
Vec2.bottomLeft = Vec2(1, 1)
Vec2.bottomCenter = Vec2(0, 1)
Vec2.bottomRight = Vec2(-1, 1)

radCache = [Vec2(), Vec2()]

Vec2.set = (result, x, y) ->
	result[0] = x or 0
	result[1] = y or 0
	return result

Vec2.copy = (result, b) ->
	result[0] = b[0]
	result[1] = b[1]
	return result

Vec2.valid = (a) ->
	return not (isNaN(a[0]) or isNaN(a[0]))

Vec2.eq = (a, b) ->
	return abs(a[0] - b[0]) < epsilon and abs(a[1] - b[1]) < epsilon

Vec2.add = (a, b, result) ->
	result or= a
	result[0] = a[0] + b[0]
	result[1] = a[1] + b[1]
	return result

Vec2.sub = (a, b, result) ->
	result or= a
	result[0] = a[0] - b[0]
	result[1] = a[1] - b[1]
	return result

Vec2.mul = (a, b, result) ->
	result or= a
	result[0] = a[0] * b[0]
	result[1] = a[1] * b[1]
	return result

Vec2.scal = (a, scalar, result) ->
	result or= a
	result[0] = a[0] * scalar
	result[1] = a[1] * scalar
	return result

Vec2.norm = (a, result, scalar = 1) ->
	result or= a
	x = a[0]
	y = a[1]
	len = scalar / (sqrt(x * x + y * y) or 1)
	result[0] = x * len
	result[1] = y * len
	return result

Vec2.lenSq = (a) ->
	return a[0] * a[0] + a[1] * a[1]

Vec2.len = (a) ->
	return sqrt(a[0] * a[0] + a[1] * a[1])

Vec2.dot = (a, b) ->
	return a[0] * b[0] + a[1] * b[1]

Vec2.cross = (a, b) ->
	return a[0] * b[1] - a[1] * b[0]

Vec2.lerp = (a, b, scalar, result) ->
	result or= a
	result[0] = a[0] + scalar * (b[0] - a[0])
	result[1] = a[1] + scalar * (b[1] - a[1])
	return result

# http://www.cas.kth.se/CURE/doc-cure-2.2.1/html/toolbox_2src_2Math_2Vector2D_8hh-source.html
Vec2.perp = (a, result) ->
	result or= a
	x = a[0]
	result[0] = a[1]
	result[1] = -x
	return result

Vec2.dist = (a, b) ->
	x = b[0] - a[0]
	y = b[1] - a[1]
	return sqrt(x * x + y * y)

Vec2.distSq = (a, b) ->
	x = b[0] - a[0]
	y = b[1] - a[1]
	return x * x + y * y

Vec2.limit = (a, max, result) ->
	result or= a
	x = a[0]
	y = a[1]
	if (ratio = max / sqrt(x * x + y * y)) < 1
		result[0] = x * ratio
		result[1] = y * ratio
	else if result isnt a
		result[0] = x
		result[1] = y
	return result

Vec2.rad = (a, b) ->
	if not b
		return Mat.atan2(a[1], a[0])
	return Mat.acos(Vec2.dot(
		Vec2.norm(a, radCache[0]),
		Vec2.norm(b, radCache[1])
	))

Vec2.rot = (a, theta, result) ->
	result or= a
	sinA = Mat.sin(theta)
	cosA = Mat.cos(theta)
	x = a[0]
	y = a[1]
	result[0] = x * cosA - y * sinA
	result[1] = x * sinA + y * cosA
	return result

Vec2.rotAxis = (a, b, theta, result) ->
	return Vec2.add(
		Vec2.rot(
			Vec2.sub(a, b, result or a),
			theta
		),
		b
	)

Vec2.lookAt = (a, b, result) ->
	len = Vec2.len(a)
	return Vec2.norm(Vec2.rot(
		a,
		Mat.atan2(b[0] - a[0], b[1] - a[1]) - Mat.atan2(a[1], a[0]),
		result or a
	), null, len)


# Math

{random, pow} = Mat

Mat.TAU = Mat.PI * 2
# Mat.PIRAD = 0.0174532925

Mat.UID = 1
Mat.uid = ->
	return Mat.UID++

Mat.clamp = (a, low, high) ->
	if a < low
		return low
	return if a > high then high else a

Mat.rand = (low, high, ease) ->
	return low + (ease or Mat.linear)(random()) * (high - low + 1)

Mat.randArray = (array) ->
	return array[Math.floor(random() * array.length)]

Mat.chance = (chance) ->
	return random() <= chance

# Tweens

powIn = (strength = 2) ->
	# (t) -> return pow(1, strength - 1) * pow(t, strength)
	(t) -> return pow(t, strength)

toOut = (fn) ->
	(t) -> return 1 - fn(1 - t)

toInOut = (fn) ->
	(t) ->
		return (if t < 0.5 then fn(t * 2) else (2 - fn(2 * (1 - t)))) / 2

Mat.linear = (t) ->
	return t

for transition, i in ['quad', 'cubic', 'quart', 'quint']
	Mat[transition + 'In'] = fn = powIn(i + 2)
	Mat[transition + 'Out'] = toOut(fn)
	Mat[transition + 'InOut'] = toInOut(fn)

module.exports.Vec2 = Vec2
