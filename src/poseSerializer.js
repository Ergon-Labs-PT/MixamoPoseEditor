export function exportPose(bones) {
  const poseData = {
    format: 'mixamo-pose-editor',
    version: 1,
    timestamp: new Date().toISOString(),
    bones: {},
  };

  for (const bone of bones) {
    poseData.bones[bone.name] = {
      rotation: [bone.rotation.x, bone.rotation.y, bone.rotation.z],
      order: bone.rotation.order,
    };
  }

  return poseData;
}

export function importPose(bones, poseData) {
  if (!poseData || !poseData.bones) return;

  const boneMap = new Map();
  for (const bone of bones) {
    boneMap.set(bone.name, bone);
  }

  for (const [name, data] of Object.entries(poseData.bones)) {
    const bone = boneMap.get(name);
    if (bone && data.rotation) {
      bone.rotation.set(data.rotation[0], data.rotation[1], data.rotation[2]);
      if (data.order) {
        bone.rotation.order = data.order;
      }
    }
  }
}

export function downloadPose(bones) {
  const data = exportPose(bones);
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pose-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
