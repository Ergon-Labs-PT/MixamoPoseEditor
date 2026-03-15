import * as THREE from 'three';

const MARKER_COLOR = 0x00ccff;
const SELECTED_COLOR = 0xffcc00;
const MARKER_RADIUS = 0.018;
const SELECTED_SCALE = 1.4;

export function createJointMarkers(scene, state) {
  const markerGroup = new THREE.Group();
  markerGroup.name = 'jointMarkers';
  scene.add(markerGroup);

  const boneToMarker = new Map();
  const markerToBone = new Map();
  let currentHighlight = null;

  const geometry = new THREE.SphereGeometry(MARKER_RADIUS, 12, 12);
  const material = new THREE.MeshBasicMaterial({
    color: MARKER_COLOR,
    depthTest: false,
    transparent: true,
    opacity: 0.85,
  });

  const tempVec = new THREE.Vector3();

  function buildMarkers(bones) {
    // Clear existing
    clearMarkers();

    for (const bone of bones) {
      const marker = new THREE.Mesh(geometry, material.clone());
      marker.renderOrder = 999;
      markerGroup.add(marker);
      boneToMarker.set(bone, marker);
      markerToBone.set(marker, bone);
    }
  }

  function clearMarkers() {
    for (const marker of markerGroup.children.slice()) {
      markerGroup.remove(marker);
    }
    boneToMarker.clear();
    markerToBone.clear();
    currentHighlight = null;
  }

  function updateMarkerPositions() {
    // Ensure world matrices are up-to-date before reading positions
    if (state.model) {
      state.model.updateMatrixWorld(true);
    }
    for (const [bone, marker] of boneToMarker) {
      bone.getWorldPosition(tempVec);
      marker.position.copy(tempVec);
    }
  }

  function highlightMarker(bone) {
    // Reset previous
    if (currentHighlight) {
      currentHighlight.material.color.setHex(MARKER_COLOR);
      currentHighlight.scale.setScalar(1);
    }

    if (bone && boneToMarker.has(bone)) {
      const marker = boneToMarker.get(bone);
      marker.material.color.setHex(SELECTED_COLOR);
      marker.scale.setScalar(SELECTED_SCALE);
      currentHighlight = marker;
    } else {
      currentHighlight = null;
    }
  }

  // Listen for state events
  state.on('modelLoaded', ({ bones }) => {
    buildMarkers(bones);
  });

  state.on('boneSelected', (bone) => {
    highlightMarker(bone);
  });

  return {
    markerGroup,
    boneToMarker,
    markerToBone,
    updateMarkerPositions,
    highlightMarker,
  };
}
