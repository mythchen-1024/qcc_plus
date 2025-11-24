varying vec3 vColor;

void main() {
  // 圆形粒子（不是方形）
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  if (dist > 0.5) discard;

  // 发光效果
  float glow = 1.0 - smoothstep(0.0, 0.5, dist);

  gl_FragColor = vec4(vColor, glow);
}
