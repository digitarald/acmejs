// initialize temp used in bezier calcs to avoid allocations
var tmpX = new Float32Array(64);
var tmpY = new Float32Array(64);

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
		result[0] = result[1] = 0;
		return;
	}

	var d1 = 1 - delta;

	for (var j = 0; j < count; j++) {
		var point = points[j];
		tmpX[j] = point[0];
		tmpY[j] = point[1];
	}

	for (var minusOne = count - 1; minusOne > 0; count--, minusOne--) {
		var plusOne = 1;
		for (var i = 0; i < minusOne; i++, plusOne++) {
			tmpX[i] = tmpX[i] * d1 + tmpX[plusOne] * delta;
			tmpY[i] = tmpY[i] * d1 + tmpY[plusOne] * delta;
		}
	}
	result[0] = tmpX[0];
	result[1] = tmpY[0];
}