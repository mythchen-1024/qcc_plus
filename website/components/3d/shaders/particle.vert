attribute float size;
attribute vec3 color;

varying vec3 vColor;

void main() {
  vColor = color;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  // 距离相机越远，粒子越小（透视效果）
  gl_PointSize = size * (300.0 / -mvPosition.z);

  gl_Position = projectionMatrix * mvPosition;
}
