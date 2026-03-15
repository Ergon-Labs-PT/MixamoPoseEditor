const listeners = {};

export let selectedBone = null;
export let model = null;
export let bones = [];
export let skeletonHelper = null;

export function on(event, callback) {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(callback);
}

export function off(event, callback) {
  if (!listeners[event]) return;
  listeners[event] = listeners[event].filter(cb => cb !== callback);
}

export function emit(event, data) {
  if (!listeners[event]) return;
  listeners[event].forEach(cb => cb(data));
}

export function setModel(newModel, newBones, newSkeletonHelper) {
  model = newModel;
  bones = newBones;
  skeletonHelper = newSkeletonHelper;
  emit('modelLoaded', { model, bones, skeletonHelper });
}

export function setSelectedBone(bone) {
  selectedBone = bone;
  emit('boneSelected', bone);
}

export function notifyBoneRotated(bone) {
  emit('boneRotated', bone);
}

export function resetPose() {
  for (const bone of bones) {
    bone.rotation.set(0, 0, 0);
  }
  emit('poseReset');
  if (selectedBone) {
    emit('boneRotated', selectedBone);
  }
}
