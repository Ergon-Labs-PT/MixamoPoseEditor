import { createScene } from './scene.js';
import { loadModel } from './modelLoader.js';
import { createJointMarkers } from './jointMarkers.js';
import { createBoneControls } from './boneControls.js';
import { createUI } from './ui.js';
import * as state from './state.js';
import './styles.css';

async function init() {
  const viewport = document.getElementById('viewport');

  // Scene setup
  const { scene, camera, renderer, orbitControls } = createScene(viewport);

  // Joint markers (listens for modelLoaded)
  const jointMarkers = createJointMarkers(scene, state);

  // Bone controls (raycasting + gizmo)
  createBoneControls(camera, renderer, scene, orbitControls, jointMarkers, state);

  // Load model helper
  const loadModelFromBuffer = (arrayBuffer) => {
    loadModel(arrayBuffer, scene, state).catch(err => {
      console.error('Failed to load model:', err);
    });
  };

  // UI panel
  createUI(state, loadModelFromBuffer);

  // Drag & drop FBX onto viewport
  viewport.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!viewport.querySelector('.drop-overlay')) {
      const overlay = document.createElement('div');
      overlay.className = 'drop-overlay';
      overlay.textContent = 'Drop FBX file here';
      viewport.appendChild(overlay);
    }
  });

  viewport.addEventListener('dragleave', (e) => {
    e.preventDefault();
    const overlay = viewport.querySelector('.drop-overlay');
    if (overlay) overlay.remove();
  });

  viewport.addEventListener('drop', (e) => {
    e.preventDefault();
    const overlay = viewport.querySelector('.drop-overlay');
    if (overlay) overlay.remove();

    const file = e.dataTransfer.files[0];
    if (file && file.name.toLowerCase().endsWith('.fbx')) {
      const reader = new FileReader();
      reader.onload = (evt) => loadModelFromBuffer(evt.target.result);
      reader.readAsArrayBuffer(file);
    }
  });

  // Render loop
  renderer.setAnimationLoop(() => {
    jointMarkers.updateMarkerPositions();
    orbitControls.update();
    renderer.render(scene, camera);
  });
}

init();
