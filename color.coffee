
Color = (fromOrR, g, b, a) ->

	if typeof g isnt undefined
		return [
			fromOrR or 0,
			g or 0,
			b or 0,
			if typeof a is 'undefined' then 1 else a
		]

	if fromOrR isnt undefined
		return [fromOrR[0], fromOrR[1], fromOrR[2], fromOrR[3]]

	return [0, 0, 0, 1]

Color.cache = [Color(), Color(), Color(), Color()]
Color.white = Color(255, 255, 255)
Color.black = Color(0, 0, 0)
Color.gray = Color(127, 127, 127)

Color.set = (result, r, g, b, a) ->
	result[0] = r
	result[1] = g
	result[2] = b
	result[3] = a
	return result

Color.copy = (result, b) ->
	result[0] = b[0]
	result[1] = b[1]
	result[2] = b[2]
	result[3] = b[3]
	return result

Color.blend = (a, t, b, alpha, result) ->
	result = result or a

	result[0] = t * a[0] + (1 - t) * b[0]
	result[1] = t * a[1] + (1 - t) * b[1]
	result[2] = t * a[2] + (1 - t) * b[2]
	if alpha
	  result[3] = t * a[3] + (1 - t) * b[3]
	else
	  result[3] = a[3]

	return result

Color.rgba = (a) ->
	if a[3] > 0.9999
			return "rgb(#{a[0] | 0}, #{a[1] | 0}, #{a[2] | 0})"
		else
			return "rgba(#{a[0] | 0}, #{a[1] | 0}, #{a[2] | 0}, #{a[3]})"


Color.tint = (a, t, alpha, result) ->
	return Color.blend(a, t, Color.white, alpha, result)

Color.shade = (a, t, alpha, result) ->
	return Color.blend(a, t, Color.black, alpha, result)

Color.tone = (a, t, alpha, result) ->
	return Color.blend(a, t, Color.gray, alpha, result)
