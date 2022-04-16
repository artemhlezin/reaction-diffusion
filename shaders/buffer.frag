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
  float diffusionA = 1.0;
  float diffusionB = 0.5;
  float feed = .0545;
  float kill = 0.062;
  float reactionTimeStep = 1.;

  vec4 laplacian =
      texture2D(prevBuffer, vUv + vec2(-pixelSize.x, 0.0)) * 0.2 +
      texture2D(prevBuffer, vUv + vec2(-pixelSize.x, -pixelSize.y)) * 0.05 +
      texture2D(prevBuffer, vUv + vec2(0.0, -pixelSize.y)) * 0.2 +
      texture2D(prevBuffer, vUv + vec2(pixelSize.x, -pixelSize.y)) * 0.05 +
      texture2D(prevBuffer, vUv + vec2(pixelSize.x, 0.0)) * 0.2 +
      texture2D(prevBuffer, vUv + vec2(pixelSize.x, pixelSize.y)) * 0.05 +
      texture2D(prevBuffer, vUv + vec2(0.0, pixelSize.y)) * 0.2 +
      texture2D(prevBuffer, vUv + vec2(-pixelSize.x, pixelSize.y)) * 0.05 +
      texture2D(prevBuffer, vUv) * -1.0;

  vec4 prevSim = texture2D(prevBuffer, vUv);
  float chemicalA = prevSim.r + ((diffusionA * laplacian.r) -
                                 (prevSim.r * prevSim.g * prevSim.g) +
                                 (feed * (1.0 - prevSim.r))) *
                                    reactionTimeStep;

  float chemicalB = prevSim.g + ((diffusionB * laplacian.g) +
                                 (prevSim.r * prevSim.g * prevSim.g) -
                                 (kill + feed) * prevSim.g) *
                                    reactionTimeStep;

  float src = step(length((vUv - emitter.position) * vec2(aspect, 1.0)),
                   emitter.radius) *
              emitter.intensity;

  gl_FragColor = vec4(chemicalA, mix(chemicalB, 0.5, src), 0.0, 1.0);
}
