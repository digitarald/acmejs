// Generated by CoffeeScript 1.3.3
var Color;

Color = function(fromOrR, g, b, a) {
  if (typeof g !== void 0) {
    return [fromOrR, g, b, a];
  }
  if (fromOrR !== void 0) {
    return [fromOrR[0], fromOrR[1], fromOrR[2], fromOrR[3]];
  }
  return [0, 0, 0, 1];
};

Color.cache = [Color(), Color(), Color(), Color(), Color()];

Color.white = Color(255, 255, 255, 1);

Color.black = Color(0, 0, 0, 1);

Color.gray = Color(127, 127, 127, 1);

Color.set = function(result, r, g, b, a) {
  result[0] = r;
  result[1] = g;
  result[2] = b;
  result[3] = a;
  return result;
};

Color.blend = function(a, t, b, alpha, result) {
  result = result || a;
  result[0] = t * a[0] + (1 - t) * b[0];
  result[1] = t * a[1] + (1 - t) * b[1];
  result[2] = t * a[2] + (1 - t) * b[2];
  if (alpha) {
    result[3] = t * a[3] + (1 - t) * b[3];
  } else {
    result[3] = a[3];
  }
  return result;
};

Color.rgba = function(a) {
  return "rgba(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
};

Color.tint = function(a, t, alpha, result) {
  return Color.blend(a, t, Color.white, alpha, result);
};

Color.shade = function(a, t, alpha, result) {
  return Color.blend(a, t, Color.black, alpha, result);
};

Color.tone = function(a, t, alpha, result) {
  return Color.blend(a, t, Color.gray, alpha, result);
};
