uniform sampler2D map;

varying vec2 vUv;

void main() {
  vec3 color = vec3(smoothstep(0.5, 0.6, texture2D(map, vUv).r));

  gl_FragColor = vec4(color, 1.0);
}
