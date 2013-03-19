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
Color.gray = Color(128, 128, 128)
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
	result[0] = (1 - t) * a[0] + t * b[0]
	result[1] = (1 - t) * a[1] + t * b[1]
	result[2] = (1 - t) * a[2] + t * b[2]
	if alpha > 0.05
	  result[3] = (1 - t) * a[3] + t * b[3]
	else
	  result[3] = a[3]
	return result

Color.lerpList = (result, list, t) ->
	last = list.length - 1
	t = Math.clamp(t * last, 0, last)
	start = t | 0
	sub = t - start
	if sub < 0.02
		return Color.copy(result, list[start])
	if sub > 0.98
		return Color.copy(result, list[start + 1])
	return Color.lerp(list[start], list[start + 1], sub, null, result)

Color.variant = (a, t, result) ->
	t = Math.rand(-t, t)
	return Color.lerp(a, (if t > 0 then Color.white else Color.black), t, false, result)

Color.rgba = (a, alpha) ->
	alpha or= a[3]
	if alpha > 0.98
			return "rgb(#{a[0] | 0}, #{a[1] | 0}, #{a[2] | 0})"
		else
			return "rgba(#{a[0] | 0}, #{a[1] | 0}, #{a[2] | 0}, #{alpha})"

module.exports = Color