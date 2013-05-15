/*
 * 2x3 Matrix
 *
 * https://github.com/toji/gl-matrix/blob/master/src/gl-matrix/mat2d.js
 *
 * @param {[type]} fromOrA [description]
 * @param {[type]} b       [description]
 * @param {[type]} c       [description]
 * @param {[type]} d       [description]
 * @param {[type]} tx      [description]
 * @param {[type]} ty      [description]
 */
var Mat2 = Mth.Mat2 = function(fromOrA, b, c, d, tx, ty) {
	if (b != null) {
		return new ARRAY_TYPE([fromOrA, b, c, d, tx, ty]);
	}
	if (fromOrA != null) {
		return new ARRAY_TYPE(fromOrA);
	}
	return new ARRAY_TYPE(Mat2.identity);
};

Mat2.identity = Mat2(1, 0, 0, 1, 0, 0);

Mat2.set = function(result, a, b, c, d, tx, ty) {
	result[0] = a || 0;
	result[1] = b || 0;
	result[2] = c || 0;
	result[3] = d || 0;
	result[4] = tx || 0;
	result[5] = ty || 0;
	return result;
};

Mat2.copy = function(result, b) {
	result.set(b);
	return result;
};

Mat2.valid = function(a) {
	return !(isNaN(a[0]) || isNaN(a[1]) || isNaN(a[2]) || isNaN(a[3]) || isNaN(a[4]) || isNaN(a[5]));
};

Mat2.toString = function(a) {
	return "[" + a[0] + ", " + a[1] + " | " + a[2] + ", " + a[3] + " | " + a[4] + ", " + a[5] + "]";
};

Mat2.mul = function(a, b, result) {
	result || (result = a);
	var aa = a[0];
	var ab = a[1];
	var ac = a[2];
	var ad = a[3];
	var atx = a[4];
	var aty = a[5];
	var ba = b[0];
	var bb = b[1];
	var bc = b[2];
	var bd = b[3];
	var btx = b[4];
	var bty = b[5];
	result[0] = aa * ba + ab * bc;
	result[1] = aa * bb + ab * bd;
	result[2] = ac * ba + ad * bc;
	result[3] = ac * bb + ad * bd;
	result[4] = ba * atx + bc * aty + btx;
	result[5] = bb * atx + bd * aty + bty;
	return result;
};

Mat2.rot = function(a, rad, result) {
	result || (result = a);
	var aa = a[0];
	var ab = a[1];
	var ac = a[2];
	var ad = a[3];
	var atx = a[4];
	var aty = a[5];
	var st = Mth.sin(rad);
	var ct = Mth.cos(rad);
	result[0] = aa * ct + ab * st;
	result[1] = -aa * st + ab * ct;
	result[2] = ac * ct + ad * st;
	result[3] = -ac * st + ct * ad;
	result[4] = ct * atx + st * aty;
	result[5] = ct * aty - st * atx;
	return result;
};

Mat2.scal = function(a, v, result) {
	result || (result = a);
	var vx = v[0];
	var vy = v[1];
	result[0] = a[0] * vx;
	result[1] = a[1] * vy;
	result[2] = a[2] * vx;
	result[3] = a[3] * vy;
	result[4] = a[4] * vx;
	result[5] = a[5] * vy;
	return result;
};

Mat2.trans = function(a, v, result) {
	result || (result = a);
	result[0] = a[0];
	result[1] = a[1];
	result[2] = a[2];
	result[3] = a[3];
	result[4] = a[4] + v[0];
	result[5] = a[5] + v[1];
	return result;
};

module.exports.Mat2 = Mat2;