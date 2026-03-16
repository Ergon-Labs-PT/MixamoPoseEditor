import * as THREE from 'three';

export function exportPose(bones) {
  const poseData = {
    format: 'mixamo-pose-editor',
    version: 1,
    timestamp: new Date().toISOString(),
    bones: {},
  };

  for (const bone of bones) {
    const rest = bone.userData.restRotation;
    const dx = bone.rotation.x - (rest ? rest.x : 0);
    const dy = bone.rotation.y - (rest ? rest.y : 0);
    const dz = bone.rotation.z - (rest ? rest.z : 0);
    poseData.bones[bone.name] = {
      rotation: [dx, dy, dz],
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
      const rest = bone.userData.restRotation;
      bone.rotation.set(
        data.rotation[0] + (rest ? rest.x : 0),
        data.rotation[1] + (rest ? rest.y : 0),
        data.rotation[2] + (rest ? rest.z : 0),
      );
      if (data.order) {
        bone.rotation.order = data.order;
      }
    }
  }
}

function stripPrefix(name) {
  return name.replace(/^mixamorig\d*:?/i, '');
}

export function exportPosePython(bones) {
  const lines = ['POSE = {'];
  const seen = new Set();

  for (const bone of bones) {
    const clean = stripPrefix(bone.name);
    if (seen.has(clean)) continue;
    seen.add(clean);

    const rest = bone.userData.restRotation;
    const rx = Math.round(THREE.MathUtils.radToDeg(bone.rotation.x - (rest ? rest.x : 0)));
    const ry = Math.round(THREE.MathUtils.radToDeg(bone.rotation.y - (rest ? rest.y : 0)));
    const rz = Math.round(THREE.MathUtils.radToDeg(bone.rotation.z - (rest ? rest.z : 0)));

    // Skip bones with no rotation
    if (rx === 0 && ry === 0 && rz === 0) continue;

    const key = `    "${clean}":`;
    const pad = ' '.repeat(Math.max(1, 20 - clean.length));
    lines.push(`${key}${pad}(${rx}, ${ry}, ${rz}),`);
  }

  lines.push('}');
  return lines.join('\n');
}

export function downloadPosePython(bones) {
  const content = exportPosePython(bones);
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pose-${Date.now()}.py`;
  a.click();
  URL.revokeObjectURL(url);
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
