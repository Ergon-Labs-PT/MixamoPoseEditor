import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

export function createBoneControls(camera, renderer, scene, orbitControls, jointMarkers, state) {
  const raycaster = new THREE.Raycaster();
  raycaster.params.Mesh = { threshold: 0.02 };
  const mouse = new THREE.Vector2();
  const mouseDown = new THREE.Vector2();

  // Transform controls for rotation gizmo
  const transformControls = new TransformControls(camera, renderer.domElement);
  transformControls.setMode('rotate');
  transformControls.setSpace('local');
  transformControls.setSize(0.6);
  scene.add(transformControls.getHelper());

  // Disable orbit controls while using gizmo
  transformControls.addEventListener('dragging-changed', (event) => {
    orbitControls.enabled = !event.value;
  });

  // Notify state when gizmo rotates a bone
  transformControls.addEventListener('objectChange', () => {
    if (state.selectedBone) {
      state.notifyBoneRotated(state.selectedBone);
    }
  });

  // Track mouse for click vs drag detection
  const DRAG_THRESHOLD = 5;

  renderer.domElement.addEventListener('pointerdown', (event) => {
    mouseDown.set(event.clientX, event.clientY);
  });

  renderer.domElement.addEventListener('pointerup', (event) => {
    const dx = event.clientX - mouseDown.x;
    const dy = event.clientY - mouseDown.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Only treat as click if mouse didn't move much
    if (dist > DRAG_THRESHOLD) return;

    // Normalize mouse coords relative to viewport
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(jointMarkers.markerGroup.children);

    if (intersects.length > 0) {
      const marker = intersects[0].object;
      const bone = jointMarkers.markerToBone.get(marker);
      if (bone) {
        selectBone(bone);
      }
    } else {
      // Click on empty space: deselect
      deselectBone();
    }
  });

  function selectBone(bone) {
    state.setSelectedBone(bone);
    transformControls.attach(bone);
  }

  function deselectBone() {
    state.setSelectedBone(null);
    transformControls.detach();
  }

  // Listen for external selection (e.g., from bone tree UI)
  state.on('boneSelected', (bone) => {
    if (bone) {
      transformControls.attach(bone);
    } else {
      transformControls.detach();
    }
  });

  return { selectBone, deselectBone, transformControls };
}
