import * as THREE from "three";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";

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

const pointer = new THREE.Vector2(0.5, 0.5);
const emitter = { position: pointer, radius: 0.1, intensity: 1.0 };
const pixelSize = new THREE.Vector2(1.0 / width, 1.0 / height);

const bufferQuad = new FullScreenQuad(
  new THREE.ShaderMaterial({
    uniforms: {
      prevBuffer: { value: initData },
      emitter: { value: emitter },

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

function animate() {
  requestAnimationFrame(animate);

  for (let i = 0; i < 10; i++) {
    renderer.setRenderTarget(bufferRTA);
    bufferQuad.render(renderer);

    renderer.setRenderTarget(null);

    let tmp = bufferRTA;
    bufferRTA = bufferRTB;
    bufferRTB = tmp;

    bufferQuad.material.uniforms.prevBuffer.value = bufferRTB.texture;
    bufferQuad.material.uniforms.emitter.value.position = pointer;
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
  pointer.x = event.clientX / width;
  pointer.y = 1 - event.clientY / height;
});
