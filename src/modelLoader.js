import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export function loadModel(source, scene, state, fileType = 'fbx') {
  return new Promise((resolve, reject) => {
    const onLoad = (object) => {
      // Remove previous model if any
      if (state.model) {
        scene.remove(state.model);
        if (state.skeletonHelper) {
          scene.remove(state.skeletonHelper);
        }
      }

      // Scale from cm to meters (FBX uses cm, GLTF uses meters)
      if (fileType === 'fbx') {
        object.scale.setScalar(0.01);
      }

      // Find skinned mesh and skeleton, fix FBX material issues
      let skinnedMesh = null;
      object.traverse((child) => {
        if (child.isMesh || child.isSkinnedMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          // Remove vertex colors that override diffuse textures
          if (child.geometry.attributes.color) {
            child.geometry.deleteAttribute('color');
          }

          // Convert to unlit material — shows texture exactly as-is
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          const newMaterials = materials.map(mat => {
            if (!mat) return mat;
            const basic = new THREE.MeshBasicMaterial();
            if (mat.map) basic.map = mat.map;
            if (mat.color) basic.color = mat.color;
            basic.skinning = true;
            return basic;
          });
          child.material = newMaterials.length === 1 ? newMaterials[0] : newMaterials;

          if (child.isSkinnedMesh) {
            skinnedMesh = child;
          }
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

      // Check if the model is centered and on the ground
      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      const minY = box.min.y;
      const threshold = 0.01; // 1cm tolerance

      const offCenterX = Math.abs(center.x) > threshold;
      const offCenterZ = Math.abs(center.z) > threshold;
      const offGround = Math.abs(minY) > threshold;

      if (offCenterX || offCenterZ || offGround) {
        const issues = [];
        if (offCenterX || offCenterZ) issues.push('not centered');
        if (offGround) issues.push(`${Math.abs(minY).toFixed(2)}m ${minY > 0 ? 'above' : 'below'} ground`);

        if (confirm(`Model is ${issues.join(' and ')}. Fix position?`)) {
          if (offCenterX) object.position.x -= center.x;
          if (offCenterZ) object.position.z -= center.z;
          if (offGround) object.position.y -= minY;
          object.updateMatrixWorld(true);
        }
      }

      state.setModel(object, bones, skeletonHelper);

      resolve({ model: object, skeleton, bones, skeletonHelper });
    };

    if (fileType === 'glb' || fileType === 'gltf') {
      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);
      if (typeof source === 'string') {
        loader.load(source, (gltf) => onLoad(gltf.scene), undefined, reject);
      } else {
        loader.parse(source, '', (gltf) => onLoad(gltf.scene), reject);
      }
    } else {
      const loader = new FBXLoader();
      if (typeof source === 'string') {
        loader.load(source, onLoad, undefined, reject);
      } else {
        const object = loader.parse(source, '');
        onLoad(object);
      }
    }
  });
}

export function exportModelGLB(model) {
  const exporter = new GLTFExporter();
  return exporter.parseAsync(model, { binary: true }).then((glb) => {
    const blob = new Blob([glb], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `model-${Date.now()}.glb`;
    a.click();
    URL.revokeObjectURL(url);
  });
}
