import * as THREE from 'three';
import { CatBlendshapeTargets, CoatStyle } from '../../types/avatar';

export interface CatRigControls {
  group: THREE.Group;
  update: (delta: number, targets: CatBlendshapeTargets) => void;
  setCoat: (style: CoatStyle) => void;
  getMouthMesh: () => THREE.Mesh | null;
}

// Procedural Fur Textures generated via HTML5 Canvas (zero external 404 images!)
function createFurTexture(style: CoatStyle): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  switch (style) {
    case 'jiji':
    default:
      // Jiji: Studio Ghibli velvety matte midnight black fur
      ctx.fillStyle = '#0D0E14';
      ctx.fillRect(0, 0, 512, 512);

      // Subtle soft atmospheric sheen across the coat
      const jijiGrad = ctx.createRadialGradient(256, 200, 30, 256, 200, 260);
      jijiGrad.addColorStop(0, '#1E202B');
      jijiGrad.addColorStop(0.6, '#0F1017');
      jijiGrad.addColorStop(1, '#08090D');
      ctx.fillStyle = jijiGrad;
      ctx.fillRect(0, 0, 512, 512);
      break;

    case 'tuxedo':
      ctx.fillStyle = '#14161D';
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = '#F8FAFC';
      // White chest bib and belly
      ctx.beginPath();
      ctx.ellipse(256, 380, 160, 130, 0, 0, Math.PI * 2);
      ctx.fill();
      // White muzzle blaze
      ctx.beginPath();
      ctx.moveTo(256, 160);
      ctx.lineTo(290, 260);
      ctx.lineTo(222, 260);
      ctx.closePath();
      ctx.fill();
      break;

    case 'calico':
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 512, 512);
      // Ginger patches
      ctx.fillStyle = '#D97706';
      ctx.beginPath();
      ctx.ellipse(160, 180, 90, 70, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(380, 360, 110, 80, -0.3, 0, Math.PI * 2);
      ctx.fill();
      // Dark slate patches
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.ellipse(340, 160, 70, 60, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(140, 390, 80, 70, 0.2, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'siamese':
      ctx.fillStyle = '#F3E8DC';
      ctx.fillRect(0, 0, 512, 512);
      // Dark chocolate face mask gradient
      const maskGrad = ctx.createRadialGradient(256, 210, 20, 256, 210, 180);
      maskGrad.addColorStop(0, '#362319');
      maskGrad.addColorStop(0.7, '#593B2B');
      maskGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = maskGrad;
      ctx.fillRect(0, 0, 512, 512);
      break;

    case 'black':
      ctx.fillStyle = '#111318';
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = '#232733';
      ctx.lineWidth = 2;
      for (let i = 0; i < 40; i++) {
        const y = Math.random() * 512;
        ctx.beginPath();
        ctx.moveTo(Math.random() * 512, y);
        ctx.lineTo(Math.random() * 512, y + 10);
        ctx.stroke();
      }
      break;

    case 'white':
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = '#EDF2F7';
      ctx.beginPath();
      ctx.ellipse(256, 300, 180, 120, 0, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'tabby':
      ctx.fillStyle = '#EA8A28';
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = '#B45309';
      for (let y = 30; y < 512; y += 45) {
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.bezierCurveTo(180, y - 20, 320, y + 25, 480, y - 10);
        ctx.bezierCurveTo(340, y + 15, 160, y + 5, 30, y);
        ctx.fill();
      }
      ctx.fillStyle = '#FEF3C7';
      ctx.beginPath();
      ctx.ellipse(256, 420, 130, 90, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createProceduralCatRig(initialCoat: CoatStyle = 'jiji'): CatRigControls {
  const root = new THREE.Group();
  root.name = 'JijiAvatarRig';

  const isJijiStyle = initialCoat === 'jiji' || initialCoat === 'black';

  // Shared Materials
  let furTexture = createFurTexture(initialCoat);
  const furMaterial = new THREE.MeshStandardMaterial({
    map: furTexture,
    roughness: 0.85,
    metalness: 0.02
  });

  // Jiji's iconic soft lavender-violet inner ear
  const innerEarMaterial = new THREE.MeshStandardMaterial({
    color: isJijiStyle ? 0xD8B4E2 : 0xF472B6,
    roughness: 0.45,
    metalness: 0.0
  });

  // Jiji's tiny black button nose
  const noseMaterial = new THREE.MeshStandardMaterial({
    color: isJijiStyle ? 0x14151C : 0xFB7185,
    roughness: 0.35,
    metalness: 0.05
  });

  // Glossy cornea with anime catchlight reflections
  const eyeCorneaMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xFFFFFF,
    roughness: 0.02,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05
  });

  // Jiji's anime eyes: white sclera base with large dark iris/pupils
  const scleraMaterial = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF
  });

  const irisMaterial = new THREE.MeshStandardMaterial({
    color: isJijiStyle ? 0x0E0F16 : 0x10B981,
    roughness: 0.2,
    metalness: 0.05
  });

  const pupilMaterial = new THREE.MeshBasicMaterial({
    color: 0x040406
  });

  const catchlightMaterial = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF
  });

  const whiskerMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    roughness: 0.1,
    metalness: 0.1
  });

  // Jiji's signature Crimson Red Ribbon / Collar
  const collarMaterial = new THREE.MeshStandardMaterial({
    color: 0xDC2626, // Vivid Crimson Red
    roughness: 0.35,
    metalness: 0.08
  });

  const ribbonBowMaterial = new THREE.MeshStandardMaterial({
    color: 0xEF4444, // Bright Red Ribbon Bow
    roughness: 0.4,
    metalness: 0.05
  });

  const cushionMaterial = new THREE.MeshStandardMaterial({
    color: 0x1A1D27, // Studio cushion
    roughness: 0.9,
    metalness: 0.05
  });

  // 1. Studio Cushion Base
  const cushionGeo = new THREE.CylinderGeometry(1.65, 1.75, 0.25, 32);
  const cushionMesh = new THREE.Mesh(cushionGeo, cushionMaterial);
  cushionMesh.position.y = 0.125;
  cushionMesh.receiveShadow = true;
  root.add(cushionMesh);

  // Soft Contact Shadow Plane directly under cushion
  const shadowGeo = new THREE.PlaneGeometry(3.6, 3.6);
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sctx = shadowCanvas.getContext('2d')!;
  const grad = sctx.createRadialGradient(64, 64, 10, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0,0,0,0.52)');
  grad.addColorStop(0.7, 'rgba(0,0,0,0.2)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 128, 128);
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false
  });
  const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.01;
  root.add(shadowPlane);

  // 2. Torso (Jiji's Slender, Lithe Ghibli Silhouette)
  const bodyGroup = new THREE.Group();
  bodyGroup.position.set(0, 0.78, -0.08);
  root.add(bodyGroup);

  // Slender anime body capsule
  const bodyGeo = new THREE.CapsuleGeometry(0.46, 0.72, 16, 24);
  const bodyMesh = new THREE.Mesh(bodyGeo, furMaterial);
  bodyMesh.rotation.x = 0.26; // Tilted slightly forward in graceful sitting posture
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  bodyGroup.add(bodyMesh);

  // Dainty Front Paws
  const pawGeo = new THREE.CapsuleGeometry(0.09, 0.36, 12, 16);
  const pawLeft = new THREE.Mesh(pawGeo, furMaterial);
  pawLeft.position.set(-0.21, -0.42, 0.32);
  pawLeft.rotation.x = -0.15;
  pawLeft.castShadow = true;
  bodyGroup.add(pawLeft);

  const pawRight = new THREE.Mesh(pawGeo, furMaterial);
  pawRight.position.set(0.21, -0.42, 0.32);
  pawRight.rotation.x = -0.15;
  pawRight.castShadow = true;
  bodyGroup.add(pawRight);

  // Jiji's Crimson Collar
  const collarGeo = new THREE.TorusGeometry(0.42, 0.045, 12, 32);
  const collarMesh = new THREE.Mesh(collarGeo, collarMaterial);
  collarMesh.rotation.x = Math.PI / 2 - 0.22;
  collarMesh.position.set(0, 0.42, 0.12);
  bodyGroup.add(collarMesh);

  // Jiji's Cute Red Ribbon Bow at the collar
  const bowGroup = new THREE.Group();
  bowGroup.position.set(0, 0.36, 0.52);
  bodyGroup.add(bowGroup);

  // Bow center knot
  const knotGeo = new THREE.SphereGeometry(0.05, 12, 12);
  const knotMesh = new THREE.Mesh(knotGeo, ribbonBowMaterial);
  bowGroup.add(knotMesh);

  // Left & Right Bow loops
  const loopGeo = new THREE.CylinderGeometry(0.06, 0.02, 0.14, 12);
  const loopLeft = new THREE.Mesh(loopGeo, ribbonBowMaterial);
  loopLeft.rotation.z = Math.PI / 3;
  loopLeft.position.set(-0.08, 0, 0);
  bowGroup.add(loopLeft);

  const loopRight = new THREE.Mesh(loopGeo, ribbonBowMaterial);
  loopRight.rotation.z = -Math.PI / 3;
  loopRight.position.set(0.08, 0, 0);
  bowGroup.add(loopRight);

  // 3. Head Group (Jiji's Expressive Anime Head)
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 1.48, 0.14);
  root.add(headPivot);

  const headGeo = new THREE.SphereGeometry(0.48, 24, 24);
  headGeo.scale(1.05, 0.98, 0.96);
  const headMesh = new THREE.Mesh(headGeo, furMaterial);
  headMesh.castShadow = true;
  headPivot.add(headMesh);

  // Dainty Snout / Cheeks
  const muzzleGeo = new THREE.SphereGeometry(0.18, 16, 16);
  muzzleGeo.scale(1.3, 0.8, 0.85);
  const muzzleMesh = new THREE.Mesh(muzzleGeo, furMaterial);
  muzzleMesh.position.set(0, -0.14, 0.38);
  headPivot.add(muzzleMesh);

  // Jiji's Tiny Black Button Nose
  const noseGeo = new THREE.ConeGeometry(0.05, 0.045, 3);
  noseGeo.rotateX(Math.PI);
  const noseMesh = new THREE.Mesh(noseGeo, noseMaterial);
  noseMesh.position.set(0, -0.09, 0.52);
  headPivot.add(noseMesh);

  // Functional Jaw & Mouth viseme
  const jawPivot = new THREE.Group();
  jawPivot.position.set(0, -0.20, 0.38);
  headPivot.add(jawPivot);

  const mouthGeo = new THREE.CylinderGeometry(0.07, 0.02, 0.07, 12);
  const mouthMesh = new THREE.Mesh(mouthGeo, innerEarMaterial);
  mouthMesh.rotation.x = Math.PI / 4;
  mouthMesh.scale.set(1, 0.1, 1);
  jawPivot.add(mouthMesh);

  // 4. Jiji's Signature Tall, Pointed Triangular Ears with Lavender-Pink Interior!
  // Notice: Jiji has tall, prominent, iconic pointed ears that stand tall
  const earGeo = new THREE.ConeGeometry(0.22, 0.52, 4);
  earGeo.scale(1.15, 1, 0.38);

  const innerEarGeo = new THREE.ConeGeometry(0.16, 0.42, 4);
  innerEarGeo.scale(1.05, 1, 0.28);

  // Left Ear
  const earLeftPivot = new THREE.Group();
  earLeftPivot.position.set(-0.32, 0.44, 0.04);
  earLeftPivot.rotation.z = 0.24;
  earLeftPivot.rotation.x = -0.12;
  headPivot.add(earLeftPivot);

  const earLeftMesh = new THREE.Mesh(earGeo, furMaterial);
  earLeftMesh.position.y = 0.25;
  earLeftPivot.add(earLeftMesh);

  const innerEarLeft = new THREE.Mesh(innerEarGeo, innerEarMaterial);
  innerEarLeft.position.set(0, 0.23, 0.04);
  earLeftPivot.add(innerEarLeft);

  // Right Ear
  const earRightPivot = new THREE.Group();
  earRightPivot.position.set(0.32, 0.44, 0.04);
  earRightPivot.rotation.z = -0.24;
  earRightPivot.rotation.x = -0.12;
  headPivot.add(earRightPivot);

  const earRightMesh = new THREE.Mesh(earGeo, furMaterial);
  earRightMesh.position.y = 0.25;
  earRightPivot.add(earRightMesh);

  const innerEarRight = new THREE.Mesh(innerEarGeo, innerEarMaterial);
  innerEarRight.position.set(0, 0.23, 0.04);
  earRightPivot.add(innerEarRight);

  // 5. Jiji's Iconic Anime Eyes (Large White Ovals with Big Dark Pupils & Specular Catchlights)
  const eyeRadius = 0.155;
  const eyeScleraGeo = new THREE.SphereGeometry(eyeRadius, 20, 20);
  eyeScleraGeo.scale(0.95, 1.15, 0.85); // oval anime eye shape
  const irisGeo = new THREE.CircleGeometry(0.115, 20);
  const pupilGeo = new THREE.CircleGeometry(0.085, 20);
  const catchlightGeo = new THREE.CircleGeometry(0.03, 12);

  // Left Eye
  const eyeLeftGroup = new THREE.Group();
  eyeLeftGroup.position.set(-0.21, 0.06, 0.42);
  eyeLeftGroup.rotation.y = -0.18;
  headPivot.add(eyeLeftGroup);

  const eyeLeftSclera = new THREE.Mesh(eyeScleraGeo, scleraMaterial);
  eyeLeftGroup.add(eyeLeftSclera);

  const irisLeft = new THREE.Mesh(irisGeo, irisMaterial);
  irisLeft.position.set(0, 0, eyeRadius * 0.95);
  eyeLeftGroup.add(irisLeft);

  const pupilLeft = new THREE.Mesh(pupilGeo, pupilMaterial);
  pupilLeft.position.set(0, 0, eyeRadius * 0.98);
  eyeLeftGroup.add(pupilLeft);

  // Anime White Specular Catchlight Highlight
  const catchlightLeft = new THREE.Mesh(catchlightGeo, catchlightMaterial);
  catchlightLeft.position.set(0.035, 0.035, eyeRadius * 1.01);
  eyeLeftGroup.add(catchlightLeft);

  // Left Upper Eyelid for Blinking / Sarcastic Squinting
  const eyelidGeo = new THREE.SphereGeometry(eyeRadius * 1.06, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
  eyelidGeo.scale(0.96, 1.16, 0.86);
  const eyelidLeft = new THREE.Mesh(eyelidGeo, furMaterial);
  eyelidLeft.rotation.x = -Math.PI * 0.5; // open
  eyeLeftGroup.add(eyelidLeft);

  // Right Eye
  const eyeRightGroup = new THREE.Group();
  eyeRightGroup.position.set(0.21, 0.06, 0.42);
  eyeRightGroup.rotation.y = 0.18;
  headPivot.add(eyeRightGroup);

  const eyeRightSclera = new THREE.Mesh(eyeScleraGeo, scleraMaterial);
  eyeRightGroup.add(eyeRightSclera);

  const irisRight = new THREE.Mesh(irisGeo, irisMaterial);
  irisRight.position.set(0, 0, eyeRadius * 0.95);
  eyeRightGroup.add(irisRight);

  const pupilRight = new THREE.Mesh(pupilGeo, pupilMaterial);
  pupilRight.position.set(0, 0, eyeRadius * 0.98);
  eyeRightGroup.add(pupilRight);

  // Anime White Specular Catchlight Highlight
  const catchlightRight = new THREE.Mesh(catchlightGeo, catchlightMaterial);
  catchlightRight.position.set(0.035, 0.035, eyeRadius * 1.01);
  eyeRightGroup.add(catchlightRight);

  const eyelidRight = new THREE.Mesh(eyelidGeo, furMaterial);
  eyelidRight.rotation.x = -Math.PI * 0.5; // open
  eyeRightGroup.add(eyelidRight);

  // 6. Jiji's Delicate White Whiskers (2 on each side, cleanly stylized)
  const whiskerGeo = new THREE.CylinderGeometry(0.004, 0.002, 0.42, 6);
  whiskerGeo.rotateZ(Math.PI / 2);

  const whiskerGroupLeft = new THREE.Group();
  whiskerGroupLeft.position.set(-0.22, -0.12, 0.42);
  headPivot.add(whiskerGroupLeft);

  const whiskerGroupRight = new THREE.Group();
  whiskerGroupRight.position.set(0.22, -0.12, 0.42);
  headPivot.add(whiskerGroupRight);

  for (let i = 0; i < 2; i++) {
    const angle = (i === 0 ? 0.08 : -0.1);
    const wLeft = new THREE.Mesh(whiskerGeo, whiskerMaterial);
    wLeft.position.set(-0.18, (i === 0 ? 0.02 : -0.02), 0);
    wLeft.rotation.z = angle;
    wLeft.rotation.y = -0.25;
    whiskerGroupLeft.add(wLeft);

    const wRight = new THREE.Mesh(whiskerGeo, whiskerMaterial);
    wRight.position.set(0.18, (i === 0 ? 0.02 : -0.02), 0);
    wRight.rotation.z = -angle;
    wRight.rotation.y = 0.25;
    whiskerGroupRight.add(wRight);
  }

  // 7. Jiji's Long, Slender, Articulated Black Tail
  const tailSegments: THREE.Group[] = [];
  const tailSegmentGeo = new THREE.CylinderGeometry(0.045, 0.065, 0.30, 12);
  tailSegmentGeo.translate(0, 0.15, 0);

  let currentParent: THREE.Group = bodyGroup;
  const tailRoot = new THREE.Group();
  tailRoot.position.set(0, -0.36, -0.42);
  tailRoot.rotation.x = -0.75;
  bodyGroup.add(tailRoot);
  currentParent = tailRoot;

  for (let i = 0; i < 6; i++) {
    const segGroup = new THREE.Group();
    if (i > 0) {
      segGroup.position.set(0, 0.28, 0);
    }
    const mesh = new THREE.Mesh(tailSegmentGeo, furMaterial);
    mesh.castShadow = true;
    segGroup.add(mesh);
    currentParent.add(segGroup);
    tailSegments.push(segGroup);
    currentParent = segGroup;
  }

  // Kinematics & Blendshape targets
  let clockTime = 0;
  let blinkTimer = 0;
  let nextBlink = 3.2;
  let currentPupilScaleX = 0.55;
  let currentPupilScaleY = 0.85;

  const update = (delta: number, targets: CatBlendshapeTargets) => {
    clockTime += delta;

    // 1. Natural Breathing Idle (Torso subtly expands and relaxes)
    const breathRate = targets.breathingRate || 1.0;
    const breathSin = Math.sin(clockTime * 2.2 * breathRate);
    bodyGroup.scale.set(
      1.0 + breathSin * 0.018,
      1.0 + breathSin * 0.025,
      1.0 + breathSin * 0.018
    );

    // Purr micro-vibration
    if (targets.purrVibration > 0.1) {
      const purrJitter = Math.sin(clockTime * 36) * targets.purrVibration * 0.003;
      bodyGroup.position.y = 0.78 + purrJitter;
    } else {
      bodyGroup.position.y = 0.78;
    }

    // 2. Head Pitch, Yaw, Roll Damping
    headPivot.rotation.x = THREE.MathUtils.damp(headPivot.rotation.x, targets.headTiltX, 4.5, delta);
    headPivot.rotation.y = THREE.MathUtils.damp(headPivot.rotation.y, targets.headTiltY, 4.5, delta);
    headPivot.rotation.z = THREE.MathUtils.damp(headPivot.rotation.z, targets.headTiltZ, 4.5, delta);

    // 3. Jiji's Tall Ear Kinematics (Twitch, Perking, Sassy Flattening)
    const baseEarZ = 0.24;
    const earAlertness = 1.0 - (targets.earFlatten || 0);

    const targetLeftZ = baseEarZ + targets.earLeftTwitch + (1 - earAlertness) * 0.35;
    const targetRightZ = -baseEarZ + targets.earRightTwitch - (1 - earAlertness) * 0.35;

    earLeftPivot.rotation.z = THREE.MathUtils.damp(earLeftPivot.rotation.z, targetLeftZ, 6.5, delta);
    earRightPivot.rotation.z = THREE.MathUtils.damp(earRightPivot.rotation.z, targetRightZ, 6.5, delta);

    // Periodic whimsical ear twitch
    if (Math.sin(clockTime * 1.9) > 0.95) {
      earLeftPivot.rotation.x = -0.12 + 0.18;
    } else {
      earLeftPivot.rotation.x = THREE.MathUtils.damp(earLeftPivot.rotation.x, -0.12, 8, delta);
    }

    // 4. Jiji's Big Anime Eyes & Blinking
    blinkTimer += delta;
    let isBlinking = false;
    if (blinkTimer > nextBlink) {
      isBlinking = true;
      if (blinkTimer > nextBlink + 0.14) {
        blinkTimer = 0;
        nextBlink = 2.4 + Math.random() * 3.8;
      }
    }

    // Eyelid angle
    const squintTarget = Math.max(targets.eyesSquint, isBlinking ? 1.0 : 0.0);
    const targetEyelidAngle = -Math.PI * 0.5 * (1.0 - squintTarget);

    eyelidLeft.rotation.x = THREE.MathUtils.damp(eyelidLeft.rotation.x, targetEyelidAngle, 12, delta);
    eyelidRight.rotation.x = THREE.MathUtils.damp(eyelidRight.rotation.x, targetEyelidAngle, 12, delta);

    // Pupil Dilation: Jiji's pupils range from inquisitive big ovals to shocked giant circles!
    const targetScaleX = THREE.MathUtils.lerp(0.3, 0.98, targets.pupilDilation);
    const targetScaleY = THREE.MathUtils.lerp(0.7, 0.98, targets.pupilDilation);
    currentPupilScaleX = THREE.MathUtils.damp(currentPupilScaleX, targetScaleX, 5, delta);
    currentPupilScaleY = THREE.MathUtils.damp(currentPupilScaleY, targetScaleY, 5, delta);
    pupilLeft.scale.set(currentPupilScaleX, currentPupilScaleY, 1);
    pupilRight.scale.set(currentPupilScaleX, currentPupilScaleY, 1);

    // 5. Mouth & Jaw Viseme
    const mouthOpen = targets.mouthOpen || 0.0;
    jawPivot.rotation.x = THREE.MathUtils.damp(jawPivot.rotation.x, mouthOpen * 0.45, 12, delta);
    mouthMesh.scale.y = THREE.MathUtils.damp(mouthMesh.scale.y, 0.1 + mouthOpen * 0.9, 12, delta);

    // 6. Whisker Twitches
    const whiskerTwitch = Math.sin(clockTime * 5) * 0.035 + targets.smile * 0.08;
    whiskerGroupLeft.rotation.y = -0.2 - whiskerTwitch;
    whiskerGroupRight.rotation.y = 0.2 + whiskerTwitch;

    // 7. Jiji's Slender Tail Physics (Graceful J-curve flick)
    const swishSpeed = targets.tailSwishSpeed || 1.0;
    const flickInt = targets.tailFlickIntensity || 0.3;
    const tailWave = Math.sin(clockTime * 2.4 * swishSpeed);

    tailRoot.rotation.z = THREE.MathUtils.damp(tailRoot.rotation.z, tailWave * 0.35 * flickInt, 4.5, delta);
    tailSegments.forEach((seg, idx) => {
      const phase = clockTime * 2.8 * swishSpeed - idx * 0.55;
      const targetCurveZ = Math.sin(phase) * (0.12 + idx * 0.09) * flickInt;
      // Curled tip characteristic of Jiji
      const tipCurl = idx >= 4 ? 0.25 : 0.0;
      const targetCurveX = (Math.cos(phase * 0.5) * 0.08) - 0.10 + tipCurl;
      seg.rotation.z = THREE.MathUtils.damp(seg.rotation.z, targetCurveZ, 6.5, delta);
      seg.rotation.x = THREE.MathUtils.damp(seg.rotation.x, targetCurveX, 6.5, delta);
    });
  };

  const setCoat = (style: CoatStyle) => {
    furTexture.dispose();
    furTexture = createFurTexture(style);
    furMaterial.map = furTexture;
    furMaterial.needsUpdate = true;

    if (style === 'jiji' || style === 'black') {
      innerEarMaterial.color.setHex(0xD8B4E2); // Jiji signature lavender pink
      noseMaterial.color.setHex(0x14151C);     // Tiny black button nose
      irisMaterial.color.setHex(0x0E0F16);     // Dark anime pupil
      collarMaterial.color.setHex(0xDC2626);   // Red ribbon collar
    } else {
      innerEarMaterial.color.setHex(0xF472B6);
      noseMaterial.color.setHex(0xFB7185);
      irisMaterial.color.setHex(0x10B981);     // Green eyes for tabby/calico
    }
  };

  return {
    group: root,
    update,
    setCoat,
    getMouthMesh: () => mouthMesh
  };
}
