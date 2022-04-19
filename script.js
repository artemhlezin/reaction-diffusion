import * as THREE from "three";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import GUI from "lil-gui";

const bufferVS = await fetch("shaders/buffer.vert").then((r) => r.text());
const bufferFS = await fetch("shaders/buffer.frag").then((r) => r.text());
const colorFS = await fetch("shaders/color.frag").then((r) => r.text());

/** @type {HTMLCanvasElement} */
const canvas = document.querySelector("#gpu-canvas");
let width = window.innerWidth;
let height = window.innerHeight;

const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(width, height);

let bufferRTA = new THREE.WebGLRenderTarget(width, height, {
  minFilter: THREE.NearestFilter,
  magFilter: THREE.NearestFilter,
  format: THREE.RGBAFormat,
  type: THREE.FloatType,
});
let bufferRTB = bufferRTA.clone();

const initData = new THREE.DataTexture(
  new Float32Array([1.0, 0.0, 0.0, 1.0]),
  1,
  1
);
initData.format = THREE.RGBAFormat;
initData.type = THREE.FloatType;
initData.needsUpdate = true;

const pointer = {
  position: new THREE.Vector2(0.0, 0.0),
  radius: 0.1,
  isDrawing: false,
};

const simParams = {
  dA: 1.0,
  dB: 0.5,
  feed: 0.055,
  kill: 0.062,
  timeStep: 1.0,
  iterations: 10,
};
const pixelSize = new THREE.Vector2(1.0 / width, 1.0 / height);

const bufferQuad = new FullScreenQuad(
  new THREE.ShaderMaterial({
    uniforms: {
      prevBuffer: { value: initData },
      emitter: { value: pointer },

      dA: { value: simParams.dA },
      dB: { value: simParams.dB },
      feed: { value: simParams.feed },
      kill: { value: simParams.kill },
      timeStep: { value: simParams.timeStep },
      aspect: { value: width / height },
      pixelSize: { value: pixelSize },
    },
    vertexShader: bufferVS,
    fragmentShader: bufferFS,
  })
);
const screen = new FullScreenQuad(
  new THREE.ShaderMaterial({
    uniforms: {
      map: { value: bufferRTA.texture },
    },
    vertexShader: bufferVS,
    fragmentShader: colorFS,
  })
);

const buttons = {
  clean: () => {
    bufferQuad.material.uniforms.prevBuffer.value = initData.texture;
  },
  howto: () => {
    window.open("https://mrob.com/pub/comp/xmorphia/", "_blank");
  },
};

const gui = new GUI();
const quadUniforms = bufferQuad.material.uniforms;

gui.add(simParams, "dA", 0, 1).onChange((v) => {
  quadUniforms.dA.value = v;
});
gui.add(simParams, "dB", 0, 1).onChange((v) => {
  quadUniforms.dB.value = v;
});
gui.add(simParams, "feed", 0.001, 0.1).onChange((v) => {
  quadUniforms.feed.value = v;
});
gui.add(simParams, "kill", 0.03, 0.07).onChange((v) => {
  quadUniforms.kill.value = v;
});
gui.add(simParams, "timeStep", 0, 1).onChange((v) => {
  quadUniforms.timeStep.value = v;
});
gui.add(simParams, "iterations", 0, 100, 1);
gui
  .add(pointer, "radius", 0, 0.5, 0.01)
  .name("emitter radius")
  .onChange((v) => {
    quadUniforms.emitter.value.radius = v;
  });
gui.add(buttons, "clean").name("Clean");
gui.add(buttons, "howto").name("How to choose parameters?");

function animate() {
  requestAnimationFrame(animate);

  for (let i = 0; i < simParams.iterations; i++) {
    renderer.setRenderTarget(bufferRTA);
    bufferQuad.render(renderer);

    renderer.setRenderTarget(null);

    let tmp = bufferRTA;
    bufferRTA = bufferRTB;
    bufferRTB = tmp;

    bufferQuad.material.uniforms.prevBuffer.value = bufferRTB.texture;
    bufferQuad.material.uniforms.emitter.value.isDrawing = pointer.isDrawing;
  }
  screen.render(renderer);
}

animate();

window.addEventListener("resize", () => {
  width = window.innerWidth;
  height = window.innerHeight;

  bufferQuad.material.uniforms.aspect.value = width / height;
  bufferQuad.material.uniforms.pixelSize.value = new THREE.Vector2(
    1.0 / width,
    1.0 / height
  );

  bufferRTB.setSize(width, height);
  bufferRTA.setSize(width, height);

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

window.addEventListener("pointermove", (event) => {
  if (pointer.isDrawing === true) {
    pointer.position.x = event.clientX / width;
    pointer.position.y = 1 - event.clientY / height;
  }
});

window.addEventListener("pointerdown", (event) => {
  pointer.position.x = event.clientX / width;
  pointer.position.y = 1 - event.clientY / height;
  pointer.isDrawing = true;
});

window.addEventListener("pointerup", (e) => {
  pointer.isDrawing = false;
});
