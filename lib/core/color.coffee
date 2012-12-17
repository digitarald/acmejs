require('./math')

typedArray = Math.TypedArray

Color = (fromOrR, g, b, a) ->
	if g?
		return new typedArray([
			fromOrR,
			g,
			b,
			a ? 1
		])
	if fromOrR?
		return new typedArray([
			fromOrR[0],
			fromOrR[1],
			fromOrR[2],
			fromOrR[3] ? 1
		])
	return new typedArray(Color.black)

Color.white = Color(255, 255, 255)
Color.black = Color(0, 0, 0)
Color.cache = [Color(), Color(), Color(), Color()]

Color.set = (result, r, g, b, a) ->
	result[0] = r or 0
	result[1] = g or 0
	result[2] = b or 0
	result[3] = a or 0
	return result

Color.copy = (result, b) ->
	result[0] = b[0]
	result[1] = b[1]
	result[2] = b[2]
	result[3] = b[3]
	return result

Color.lerp = (a, b, t, alpha, result) ->
	result or= a
	result[0] = t * a[0] + (1 - t) * b[0]
	result[1] = t * a[1] + (1 - t) * b[1]
	result[2] = t * a[2] + (1 - t) * b[2]
	if alpha > 0.05
	  result[3] = t * a[3] + (1 - t) * b[3]
	else
	  result[3] = a[3]
	return result

Color.rgba = (a) ->
	if a[3] > 0.98
			return "rgb(#{a[0] | 0}, #{a[1] | 0}, #{a[2] | 0})"
		else
			return "rgba(#{a[0] | 0}, #{a[1] | 0}, #{a[2] | 0}, #{a[3]})"

module.exports = Color