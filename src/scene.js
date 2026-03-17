import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createScene(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x1a1a2e);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.01,
    100
  );
  camera.position.set(0, 1.5, 3);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(3, 5, 3);
  dirLight.castShadow = true;
  scene.add(dirLight);

  // Camera-attached fill light
  const cameraLight = new THREE.DirectionalLight(0xffffff, 0.3);
  camera.add(cameraLight);
  cameraLight.position.set(0, 0, 1);
  scene.add(camera);

  const hemiLight = new THREE.HemisphereLight(0x8888ff, 0x443322, 0.4);
  scene.add(hemiLight);

  // Ground grid
  const grid = new THREE.GridHelper(10, 20, 0x0f3460, 0x0a1a3a);
  scene.add(grid);

  // Orbit controls
  const orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.target.set(0, 1, 0);
  orbitControls.enableDamping = true;
  orbitControls.dampingFactor = 0.08;
  orbitControls.update();

  // Resize handler
  const onResize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);

  return { scene, camera, renderer, orbitControls, lights: { ambientLight, dirLight, cameraLight, hemiLight } };
}
