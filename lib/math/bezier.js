
// initialize temp arrays used in bezier calcs to avoid allocations
Vector._tmpBezierX = new Array(64);
Vector._tmpBezierY = new Array(64);

/**
 * Calculates the bezier path vector
 *
 * @param {Number[]} points
 * @param {Number[]} delta
 * @param {Number[]} result
 */
function calcPathBezier(points, delta, result) {
		var count = points.length;
		if (count <= 1) {
				result.x = result.y = 0;
				return;
		}

		var xs = Vector._tmpBezierX,
				ys = Vector._tmpBezierY,
				d1 = 1 - delta;

		for (var j = 0; j < count; j++) {
				var point = points[j];
				xs[j] = point.x;
				ys[j] = point.y;
		}

		var countMinusOne = count - 1;
		for (; countMinusOne > 0; count--, countMinusOne--) {
				var i = 0, iPlusOne = 1;
				for (; i < countMinusOne; i++, iPlusOne++) {
						xs[i] = xs[i] * d1 + xs[iPlusOne] * delta;
						ys[i] = ys[i] * d1 + ys[iPlusOne] * delta;
				}
		}
		result.x = xs[0];
		result.y = ys[0];
}