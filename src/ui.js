import * as THREE from 'three';
import { downloadPose, downloadPosePython, importPose } from './poseSerializer.js';

export function createUI(state, loadModelFn) {
  const boneTreeEl = document.getElementById('bone-tree');
  const boneControlsEl = document.getElementById('bone-controls');
  const actionsEl = document.getElementById('actions');
  const loadBtn = document.getElementById('load-fbx-btn');
  const fileInput = document.getElementById('fbx-file-input');

  // --- Load FBX button ---
  loadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      loadModelFn(evt.target.result);
    };
    reader.readAsArrayBuffer(file);
    fileInput.value = '';
  });

  // --- Bone Tree (grouped by body region) ---

  // Body region definitions — order within each group matters
  const BODY_GROUPS = [
    {
      label: 'Head',
      patterns: ['Head', 'HeadTop_End', 'Neck'],
    },
    {
      label: 'Torso',
      patterns: ['Hips', 'Spine', 'Spine1', 'Spine2'],
    },
    {
      label: 'Left Arm',
      patterns: ['LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand',
        'LeftHandThumb1', 'LeftHandThumb2', 'LeftHandThumb3', 'LeftHandThumb4',
        'LeftHandIndex1', 'LeftHandIndex2', 'LeftHandIndex3', 'LeftHandIndex4',
        'LeftHandMiddle1', 'LeftHandMiddle2', 'LeftHandMiddle3', 'LeftHandMiddle4',
        'LeftHandRing1', 'LeftHandRing2', 'LeftHandRing3', 'LeftHandRing4',
        'LeftHandPinky1', 'LeftHandPinky2', 'LeftHandPinky3', 'LeftHandPinky4'],
    },
    {
      label: 'Right Arm',
      patterns: ['RightShoulder', 'RightArm', 'RightForeArm', 'RightHand',
        'RightHandThumb1', 'RightHandThumb2', 'RightHandThumb3', 'RightHandThumb4',
        'RightHandIndex1', 'RightHandIndex2', 'RightHandIndex3', 'RightHandIndex4',
        'RightHandMiddle1', 'RightHandMiddle2', 'RightHandMiddle3', 'RightHandMiddle4',
        'RightHandRing1', 'RightHandRing2', 'RightHandRing3', 'RightHandRing4',
        'RightHandPinky1', 'RightHandPinky2', 'RightHandPinky3', 'RightHandPinky4'],
    },
    {
      label: 'Left Leg',
      patterns: ['LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase', 'LeftToe_End'],
    },
    {
      label: 'Right Leg',
      patterns: ['RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase', 'RightToe_End'],
    },
  ];

  // Friendly display names for bones
  const BONE_DISPLAY_NAMES = {
    Hips: 'Hips',
    Spine: 'Spine', Spine1: 'Spine 1', Spine2: 'Spine 2',
    Neck: 'Neck', Head: 'Head', HeadTop_End: 'Head Top',
    LeftShoulder: 'Shoulder', RightShoulder: 'Shoulder',
    LeftArm: 'Upper Arm', RightArm: 'Upper Arm',
    LeftForeArm: 'Forearm', RightForeArm: 'Forearm',
    LeftHand: 'Hand', RightHand: 'Hand',
    LeftUpLeg: 'Thigh', RightUpLeg: 'Thigh',
    LeftLeg: 'Shin', RightLeg: 'Shin',
    LeftFoot: 'Foot', RightFoot: 'Foot',
    LeftToeBase: 'Toe', RightToeBase: 'Toe',
    LeftToe_End: 'Toe Tip', RightToe_End: 'Toe Tip',
  };

  function cleanBoneName(name) {
    const stripped = name.replace(/^mixamorig\d*:?/i, '');
    if (BONE_DISPLAY_NAMES[stripped]) return BONE_DISPLAY_NAMES[stripped];
    // For finger bones, make them readable
    const fingerMatch = stripped.match(/^(Left|Right)Hand(Thumb|Index|Middle|Ring|Pinky)(\d)$/);
    if (fingerMatch) {
      return `${fingerMatch[2]} ${fingerMatch[3]}`;
    }
    return stripped;
  }

  function stripPrefix(name) {
    return name.replace(/^mixamorig\d*:?/i, '');
  }

  function buildBoneTree(bones) {
    boneTreeEl.innerHTML = '';
    if (!bones || bones.length === 0) {
      boneTreeEl.innerHTML = '<p style="color:#666;padding:8px;font-size:13px;">Load an FBX to see bones</p>';
      return;
    }

    // Deduplicate: keep only one bone per cleaned name (first found)
    const seen = new Set();
    const uniqueBones = [];
    for (const bone of bones) {
      const clean = stripPrefix(bone.name);
      if (!seen.has(clean)) {
        seen.add(clean);
        uniqueBones.push(bone);
      }
    }

    // Build a lookup from cleaned name → bone
    const boneByCleanName = new Map();
    for (const bone of uniqueBones) {
      boneByCleanName.set(stripPrefix(bone.name), bone);
    }

    // Track which bones are placed in groups
    const placed = new Set();

    for (const group of BODY_GROUPS) {
      const groupBones = [];
      for (const pattern of group.patterns) {
        const bone = boneByCleanName.get(pattern);
        if (bone) {
          groupBones.push(bone);
          placed.add(stripPrefix(bone.name));
        }
      }
      if (groupBones.length === 0) continue;

      const section = document.createElement('div');
      section.className = 'bone-group';

      const header = document.createElement('div');
      header.className = 'bone-group-header';
      const toggle = document.createElement('span');
      toggle.className = 'bone-toggle';
      toggle.textContent = '▼';
      const label = document.createElement('span');
      label.textContent = group.label;
      header.appendChild(toggle);
      header.appendChild(label);

      const list = document.createElement('ul');
      for (const bone of groupBones) {
        const li = document.createElement('li');
        const item = document.createElement('div');
        item.className = 'bone-item';
        item.dataset.boneName = bone.name;
        const nameSpan = document.createElement('span');
        nameSpan.className = 'bone-name';
        nameSpan.textContent = cleanBoneName(bone.name);
        item.appendChild(nameSpan);
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          state.setSelectedBone(bone);
        });
        li.appendChild(item);
        list.appendChild(li);
      }

      header.style.cursor = 'pointer';
      header.addEventListener('click', () => {
        const isHidden = list.style.display === 'none';
        list.style.display = isHidden ? '' : 'none';
        toggle.textContent = isHidden ? '▼' : '▶';
      });

      section.appendChild(header);
      section.appendChild(list);
      boneTreeEl.appendChild(section);
    }

    // Add any ungrouped bones in an "Other" section
    const ungrouped = uniqueBones.filter(b => !placed.has(stripPrefix(b.name)));
    if (ungrouped.length > 0) {
      const section = document.createElement('div');
      section.className = 'bone-group';
      const header = document.createElement('div');
      header.className = 'bone-group-header';
      const toggle = document.createElement('span');
      toggle.className = 'bone-toggle';
      toggle.textContent = '▶';
      const label = document.createElement('span');
      label.textContent = 'Other';
      header.appendChild(toggle);
      header.appendChild(label);

      const list = document.createElement('ul');
      list.style.display = 'none';
      for (const bone of ungrouped) {
        const li = document.createElement('li');
        const item = document.createElement('div');
        item.className = 'bone-item';
        item.dataset.boneName = bone.name;
        const nameSpan = document.createElement('span');
        nameSpan.className = 'bone-name';
        nameSpan.textContent = stripPrefix(bone.name);
        item.appendChild(nameSpan);
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          state.setSelectedBone(bone);
        });
        li.appendChild(item);
        list.appendChild(li);
      }

      header.style.cursor = 'pointer';
      header.addEventListener('click', () => {
        const isHidden = list.style.display === 'none';
        list.style.display = isHidden ? '' : 'none';
        toggle.textContent = isHidden ? '▼' : '▶';
      });

      section.appendChild(header);
      section.appendChild(list);
      boneTreeEl.appendChild(section);
    }
  }

  function highlightTreeItem(bone) {
    const items = boneTreeEl.querySelectorAll('.bone-item');
    items.forEach(item => item.classList.remove('selected'));
    if (bone) {
      const target = boneTreeEl.querySelector(`[data-bone-name="${CSS.escape(bone.name)}"]`);
      if (target) {
        target.classList.add('selected');
        target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }

  // --- Rotation Sliders ---
  function buildSliders() {
    boneControlsEl.innerHTML = '';
    const header = document.createElement('h3');
    header.textContent = 'Rotation';
    boneControlsEl.appendChild(header);

    if (!state.selectedBone) {
      const p = document.createElement('p');
      p.className = 'no-selection';
      p.textContent = 'Select a bone to edit';
      boneControlsEl.appendChild(p);
      return;
    }

    const axes = [
      { axis: 'x', label: 'X', color: 'x' },
      { axis: 'y', label: 'Y', color: 'y' },
      { axis: 'z', label: 'Z', color: 'z' },
    ];

    for (const { axis, label, color } of axes) {
      const group = document.createElement('div');
      group.className = 'slider-group';

      const labelEl = document.createElement('label');
      const axisSpan = document.createElement('span');
      axisSpan.className = `axis ${color}`;
      axisSpan.textContent = label;
      const valueSpan = document.createElement('span');
      valueSpan.className = 'value';

      const rest = state.selectedBone.userData.restRotation;
      const restRad = rest ? rest[axis] : 0;
      const currentDeg = THREE.MathUtils.radToDeg(state.selectedBone.rotation[axis] - restRad);
      valueSpan.textContent = `${currentDeg.toFixed(1)}°`;

      labelEl.appendChild(axisSpan);
      labelEl.appendChild(valueSpan);

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '-180';
      slider.max = '180';
      slider.step = '0.5';
      slider.value = currentDeg;
      slider.dataset.axis = axis;

      slider.addEventListener('input', () => {
        const deltaRad = THREE.MathUtils.degToRad(parseFloat(slider.value));
        state.selectedBone.rotation[axis] = restRad + deltaRad;
        valueSpan.textContent = `${parseFloat(slider.value).toFixed(1)}°`;
        state.notifyBoneRotated(state.selectedBone);
      });

      group.appendChild(labelEl);
      group.appendChild(slider);
      boneControlsEl.appendChild(group);
    }
  }

  function updateSliderValues() {
    if (!state.selectedBone) return;
    const rest = state.selectedBone.userData.restRotation;
    const sliders = boneControlsEl.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
      const axis = slider.dataset.axis;
      const restRad = rest ? rest[axis] : 0;
      const deg = THREE.MathUtils.radToDeg(state.selectedBone.rotation[axis] - restRad);
      slider.value = deg;
      const valueSpan = slider.parentElement.querySelector('.value');
      if (valueSpan) valueSpan.textContent = `${deg.toFixed(1)}°`;
    });
  }

  // --- Action Buttons ---
  function buildActions() {
    actionsEl.innerHTML = '';

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset Pose';
    resetBtn.addEventListener('click', () => state.resetPose());

    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'Export Pose (JSON)';
    exportBtn.addEventListener('click', () => {
      if (state.bones.length === 0) return;
      downloadPose(state.bones);
    });

    const importBtn = document.createElement('button');
    importBtn.textContent = 'Import Pose (JSON)';
    importBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const data = JSON.parse(evt.target.result);
            importPose(state.bones, data);
            state.emit('poseReset');
            if (state.selectedBone) {
              state.notifyBoneRotated(state.selectedBone);
            }
          } catch (err) {
            console.error('Failed to import pose:', err);
          }
        };
        reader.readAsText(file);
      });
      input.click();
    });

    actionsEl.appendChild(resetBtn);
    actionsEl.appendChild(exportBtn);
    const pythonBtn = document.createElement('button');
    pythonBtn.textContent = 'Export Python Dict';
    pythonBtn.addEventListener('click', () => {
      if (state.bones.length === 0) return;
      downloadPosePython(state.bones);
    });

    actionsEl.appendChild(importBtn);
    actionsEl.appendChild(pythonBtn);
  }

  // --- State Listeners ---
  state.on('modelLoaded', ({ bones }) => {
    buildBoneTree(bones);
    buildSliders();
    buildActions();
  });

  state.on('boneSelected', (bone) => {
    highlightTreeItem(bone);
    buildSliders();
  });

  state.on('boneRotated', () => {
    updateSliderValues();
  });

  state.on('poseReset', () => {
    updateSliderValues();
  });

  // Initial state
  buildBoneTree([]);
  buildSliders();
  buildActions();
}
