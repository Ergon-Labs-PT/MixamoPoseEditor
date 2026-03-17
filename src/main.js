import * as THREE from 'three';
import { createScene } from './scene.js';
import { loadModel, exportModelGLB } from './modelLoader.js';
import { createJointMarkers } from './jointMarkers.js';
import { createBoneControls } from './boneControls.js';
import { createUI } from './ui.js';
import * as state from './state.js';
import './styles.css';

async function init() {
  const viewport = document.getElementById('viewport');

  // Scene setup
  const { scene, camera, renderer, orbitControls, lights } = createScene(viewport);

  // Joint markers (listens for modelLoaded)
  const jointMarkers = createJointMarkers(scene, state);

  // Bone controls (raycasting + gizmo)
  createBoneControls(camera, renderer, scene, orbitControls, jointMarkers, state);

  // Load model helper
  const loadModelFromBuffer = (arrayBuffer, fileType = 'fbx') => {
    loadModel(arrayBuffer, scene, state, fileType).catch(err => {
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
      overlay.textContent = 'Drop FBX/GLB file here';
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
    if (file) {
      const ext = file.name.toLowerCase().split('.').pop();
      if (['fbx', 'glb', 'gltf'].includes(ext)) {
        const reader = new FileReader();
        reader.onload = (evt) => loadModelFromBuffer(evt.target.result, ext);
        reader.readAsArrayBuffer(file);
      }
    }
  });

  // Toggle helpers checkbox
  const toggleHelpers = document.getElementById('toggle-helpers');
  toggleHelpers.addEventListener('change', () => {
    const visible = toggleHelpers.checked;
    jointMarkers.markerGroup.visible = visible;
    if (state.skeletonHelper) {
      state.skeletonHelper.visible = visible;
    }
  });

  // Remove unused light slider for now
  const lightSliderContainer = document.querySelector('.light-slider');
  if (lightSliderContainer) lightSliderContainer.style.display = 'none';

  // Keep skeleton helper visibility in sync when a new model loads
  state.on('modelLoaded', () => {
    if (state.skeletonHelper) {
      state.skeletonHelper.visible = toggleHelpers.checked;
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
