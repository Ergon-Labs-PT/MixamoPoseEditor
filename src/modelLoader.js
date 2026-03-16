import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export function loadModel(source, scene, state) {
  return new Promise((resolve, reject) => {
    const loader = new FBXLoader();

    const onLoad = (object) => {
      // Remove previous model if any
      if (state.model) {
        scene.remove(state.model);
        if (state.skeletonHelper) {
          scene.remove(state.skeletonHelper);
        }
      }

      // Scale from cm to meters
      object.scale.setScalar(0.01);

      // Find skinned mesh and skeleton
      let skinnedMesh = null;
      object.traverse((child) => {
        if (child.isSkinnedMesh) {
          skinnedMesh = child;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      if (!skinnedMesh) {
        // Fallback: look for any mesh with a skeleton
        object.traverse((child) => {
          if (child.isMesh && child.skeleton) {
            skinnedMesh = child;
          }
        });
      }

      // Collect ALL bones from the hierarchy, deduplicating by name
      // (FBX files may contain multiple bone objects with the same name)
      const bones = [];
      const seenNames = new Set();
      object.traverse((child) => {
        if (child.isBone && !seenNames.has(child.name)) {
          seenNames.add(child.name);
          // Store the original rest-pose rotation so we can reset and export deltas
          child.userData.restRotation = child.rotation.clone();
          bones.push(child);
        }
      });
      const skeleton = skinnedMesh ? skinnedMesh.skeleton : null;

      // Add skeleton helper for bone visualization
      const skeletonHelper = new THREE.SkeletonHelper(object);
      skeletonHelper.material.linewidth = 2;
      scene.add(skeletonHelper);

      scene.add(object);

      // Force world matrix update so bone positions are correct immediately
      object.updateMatrixWorld(true);

      state.setModel(object, bones, skeletonHelper);

      resolve({ model: object, skeleton, bones, skeletonHelper });
    };

    if (typeof source === 'string') {
      loader.load(source, onLoad, undefined, reject);
    } else {
      // source is an ArrayBuffer from FileReader
      const object = loader.parse(source, '');
      onLoad(object);
    }
  });
}
