struct Emitter {
  vec2 position;
  float radius;
  float intensity;
};

uniform float dA;
uniform float dB;
uniform float feed;
uniform float kill;
uniform float timeStep;

uniform Emitter emitter;
uniform float aspect;
uniform sampler2D prevBuffer;
uniform vec2 pixelSize;

varying vec2 vUv;

void main() {

  vec4 prevSim = texture2D(prevBuffer, vUv);

  vec4 laplacian = prevSim * -1.0;
  laplacian += texture2D(prevBuffer, vUv + pixelSize * vec2(-1.0, 0.0)) * 0.2;
  laplacian += texture2D(prevBuffer, vUv + pixelSize * vec2(-1.0, -1.0)) * 0.05;
  laplacian += texture2D(prevBuffer, vUv + pixelSize * vec2(0.0, -1.0)) * 0.2;
  laplacian += texture2D(prevBuffer, vUv + pixelSize * vec2(1.0, -1.0)) * 0.05;
  laplacian += texture2D(prevBuffer, vUv + pixelSize * vec2(1.0, 0.0)) * 0.2;
  laplacian += texture2D(prevBuffer, vUv + pixelSize * vec2(1.0, 1.0)) * 0.05;
  laplacian += texture2D(prevBuffer, vUv + pixelSize * vec2(0.0, 1.0)) * 0.2;
  laplacian += texture2D(prevBuffer, vUv + pixelSize * vec2(-1.0, 1.0)) * 0.05;

  float chemicalA =
      prevSim.r + ((dA * laplacian.r) - (prevSim.r * prevSim.g * prevSim.g) +
                   (feed * (1.0 - prevSim.r))) *
                      timeStep;

  float chemicalB =
      prevSim.g + ((dB * laplacian.g) + (prevSim.r * prevSim.g * prevSim.g) -
                   (kill + feed) * prevSim.g) *
                      timeStep;

  float src = step(length((vUv - emitter.position) * vec2(aspect, 1.0)),
                   emitter.radius) *
              emitter.intensity;

  gl_FragColor = vec4(chemicalA, mix(chemicalB, 0.5, src), 0.0, 1.0);
}
