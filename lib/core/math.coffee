# Math
#
# http://docs.unity3d.com/Documentation/ScriptReference/Mathf.html
# https://github.com/secretrobotron/gladius.math/
# https://github.com/toji/gl-matrix/tree/master/src/gl-matrix


Mth = Math # compression win
{sqrt, pow, abs, random, random, pow} = Mth

Mth.EPSILON = EPSILON = 0.001
Mth.TAU = Mth.PI * 2
Mth.PIRAD = 0.0174532925

Mth.UID = 1
Mth.uid = ->
	return Mth.UID++

Mth.clamp = (a, low, high) ->
	if a < low
		return low
	return if a > high then high else a

Mth.rand = (low, high, ease) ->
	return (ease or Mth.linear)(random()) * (high - low) + low

Mth.randArray = (array) ->
	return array[random() * array.length | 0]

Mth.chance = (chance) ->
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

Mth.linear = (t) ->
	return t

for transition, i in ['quad', 'cubic', 'quart', 'quint']
	Mth[transition + 'In'] = fn = powIn(i + 2)
	Mth[transition + 'Out'] = toOut(fn)
	Mth[transition + 'InOut'] = toInOut(fn)

Mth.TypedArray = typedArray = Float64Array or Float32Array or (arr) -> arr

# Vec2

Mth.Vec2 = Vec2 = (fromOrX, y) ->
	if y?
		return new typedArray([fromOrX, y])
	if fromOrX?
		return new typedArray(fromOrX)
	return new typedArray(Vec2.zero)

Vec2.zero = Vec2.center = Vec2(0, 0)
Vec2.cache = [Vec2(), Vec2(), Vec2(), Vec2(), Vec2()]
Vec2.topLeft = Vec2(-1, -1)
Vec2.topCenter = Vec2(0, -1)
Vec2.topRight = Vec2(1, -1)
Vec2.centerLeft = Vec2(-1, 0)
Vec2.centerRight = Vec2(1, 0)
Vec2.bottomLeft = Vec2(-1, 1)
Vec2.bottomCenter = Vec2(0, 1)
Vec2.bottomRight = Vec2(1, 1)

radCache = [Vec2(), Vec2()]

objCache = {x: 0, y: 0}
objVecCache = Vec2()

Vec2.set = (result, x, y) ->
	result[0] = x or 0
	result[1] = y or 0
	return result

Vec2.copy = (result, b) ->
	result[0] = b[0]
	result[1] = b[1]
	return result

Vec2.valid = (a) ->
	return not (isNaN(a[0]) or isNaN(a[1]))

Vec2.toString = (a) ->
	return "[#{a[0]}, #{a[1]}]"

Vec2.fromObj = (obj, a) ->
	a or= objVecCache
	a[0] = obj.x
	a[1] = obj.y
	return a

Vec2.toObj = (a, obj) ->
	obj or= objCache
	obj.x = a[0]
	obj.y = a[1]
	return obj

Vec2.eq = (a, b) ->
	return abs(a[0] - b[0]) < EPSILON and abs(a[1] - b[1]) < EPSILON

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

Vec2.norm = (a, result, scalar) ->
	result or= a
	x = a[0]
	y = a[1]
	len = (scalar or 1) / (sqrt(x * x + y * y) or 1)
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

Vec2.max = (a, b, axis) ->
	if axis?
		return if a[axis] > b[axis] then a else b
	return if Vec2.lenSq(a) > Vec2.lenSq(b) then a else b

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
		return Mth.atan2(a[1], a[0])
	return Mth.acos(Vec2.dot(
		Vec2.norm(a, radCache[0]),
		Vec2.norm(b, radCache[1])
	))

Vec2.rot = (a, theta, result) ->
	result or= a
	sinA = Mth.sin(theta)
	cosA = Mth.cos(theta)
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
		Mth.atan2(b[0] - a[0], b[1] - a[1]) - Mth.atan2(a[1], a[0]),
		result or a
	), null, len)

Vec2.variant = (a, delta, result) ->
	result or= a
	result[0] = a[0] + Math.rand(-delta, delta)
	result[1] = a[1] + Math.rand(-delta, delta)
	return result

module.exports.Vec2 = Vec2

# https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/mat2d.js

Mth.Mat2 = Mat2 = (fromOrA, b, c, d, tx, ty) ->
	if b?
		return new typedArray([fromOrA, b, c, d, tx, ty])
	if fromOrA?
		return new typedArray(fromOrA)
	return new typedArray(Mat2.identity)

Mat2.identity = Mat2(1, 0, 0, 1, 0, 0)

Mat2.set = (result, a, b, c, d, tx, ty) ->
	result[0] = a or 0
	result[1] = b or 0
	result[2] = c or 0
	result[3] = d or 0
	result[4] = tx or 0
	result[5] = ty or 0
	return result

Mat2.copy = (result, b) ->
	result[0] = b[0]
	result[1] = b[1]
	result[2] = b[2]
	result[3] = b[3]
	result[4] = b[4]
	result[5] = b[5]
	return result

Mat2.valid = (a) ->
	return not (isNaN(a[0]) or isNaN(a[1]) or isNaN(a[2]) or isNaN(a[3]) or isNaN(a[4]) or isNaN(a[5]))

Mat2.toString = (a) ->
	return "[#{a[0]}, #{a[1]} | #{a[2]}, #{a[3]} | #{a[4]}, #{a[5]}]"

Mat2.mul = (a, b, result) ->
	result or= a
	aa = a[0]
	ab = a[1]
	ac = a[2]
	ad = a[3]
	atx = a[4]
	aty = a[5]
	ba = b[0]
	bb = b[1]
	bc = b[2]
	bd = b[3]
	btx = b[4]
	bty = b[5]
	result[0] = aa * ba + ab * bc
	result[1] = aa * bb + ab * bd
	result[2] = ac * ba + ad * bc
	result[3] = ac * bb + ad * bd
	result[4] = ba * atx + bc * aty + btx
	result[5] = bb * atx + bd * aty + bty
	return result

Mat2.rot = (a, rad, result) ->
	result or= a
	aa = a[0]
	ab = a[1]
	ac = a[2]
	ad = a[3]
	atx = a[4]
	aty = a[5]
	st = Mth.sin(rad)
	ct = Mth.cos(rad)
	result[0] = aa * ct + ab * st
	result[1] = -aa * st + ab * ct
	result[2] = ac * ct + ad * st
	result[3] = -ac * st + ct * ad
	result[4] = ct * atx + st * aty
	result[5] = ct * aty - st * atx
	return result

Mat2.scal = (a, v, result) ->
	result or= a
	vx = v[0]
	vy = v[1]
	result[0] = a[0] * vx
	result[1] = a[1] * vy
	result[2] = a[2] * vx
	result[3] = a[3] * vy
	result[4] = a[4] * vx
	result[5] = a[5] * vy
	return result

Mat2.trans = (a, v, result) ->
	result or= a
	result[0] = a[0]
	result[1] = a[1]
	result[2] = a[2]
	result[3] = a[3]
	result[4] = a[4] + v[0]
	result[5] = a[5] + v[1]
	return result

module.exports.Mat2 = Mat2
