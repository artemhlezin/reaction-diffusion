struct Emitter {
  vec2 position;
  float radius;
  float intensity;
};

uniform Emitter emitter;
uniform float aspect;
uniform sampler2D prevBuffer;
uniform vec2 pixelSize;

varying vec2 vUv;

void main() {
  float src = step(length((vUv - emitter.position) * vec2(aspect, 1.0)),
                   emitter.radius) *
              emitter.intensity;
  vec4 sim = texture2D(prevBuffer, vUv - vec2(5.0)*pixelSize) + src;

  gl_FragColor = sim * 0.9;
}
