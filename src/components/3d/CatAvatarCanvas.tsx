import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CatBlendshapeTargets, CoatStyle, EmotionState } from '../../types/avatar';
import { createProceduralCatRig, CatRigControls } from './ProceduralCatMesh';
import { Camera, RefreshCw, Upload, Sparkles, Volume2 } from 'lucide-react';
import { felineAudio } from '../../services/felineAudio';

interface Props {
  emotion: EmotionState;
  blendshapes: CatBlendshapeTargets;
  coatStyle: CoatStyle;
  onCoatChange: (coat: CoatStyle) => void;
  isSpeaking: boolean;
  showOverlayTelemetry?: boolean;
}

export const CatAvatarCanvas: React.FC<Props> = ({
  emotion,
  blendshapes,
  coatStyle,
  onCoatChange,
  isSpeaking,
  showOverlayTelemetry = false
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<CatRigControls | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [customModelLoaded, setCustomModelLoaded] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  // Blendshape ref to prevent stale closures in requestAnimationFrame
  const blendshapesRef = useRef(blendshapes);
  blendshapesRef.current = blendshapes;

  // React to coat changes
  useEffect(() => {
    if (rigRef.current && !customModelLoaded) {
      rigRef.current.setCoat(coatStyle);
    }
  }, [coatStyle, customModelLoaded]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0C0E14);
    scene.fog = new THREE.Fog(0x0C0E14, 8, 22);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 1.6, 4.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance'
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Studio Environment map using PMREMGenerator & RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 1.1, 0);
    controls.minDistance = 2.0;
    controls.maxDistance = 7.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controlsRef.current = controls;

    // 3-Point Studio Lighting Rig
    // Warm Key Light with soft shadows
    const keyLight = new THREE.DirectionalLight(0xFFF1D0, 2.2);
    keyLight.position.set(3, 4, 3);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    // Cool Sky / Ground Fill Light
    const fillLight = new THREE.HemisphereLight(0x7DD3FC, 0x1E293B, 1.2);
    scene.add(fillLight);

    // Back / Rim Light for silhouette separation
    const rimLight = new THREE.DirectionalLight(0xFBBF24, 1.5);
    rimLight.position.set(-3, 3, -3);
    scene.add(rimLight);

    // Ground Studio Pedestal Ring
    const ringGeo = new THREE.RingGeometry(1.9, 2.4, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x1E2433,
      side: THREE.DoubleSide
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.005;
    scene.add(ringMesh);

    // Procedural Cat Rig
    const catRig = createProceduralCatRig(coatStyle);
    scene.add(catRig.group);
    rigRef.current = catRig;

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Render Loop
    let frameId = 0;
    const clock = new THREE.Clock();

    function animate() {
      const delta = Math.min(clock.getDelta(), 0.1);
      controls.update();

      if (rigRef.current) {
        rigRef.current.update(delta, blendshapesRef.current);
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    }
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleResetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 1.6, 4.2);
      controlsRef.current.target.set(0, 1.1, 0);
      controlsRef.current.update();
    }
  };

  const handleMeowClick = () => {
    felineAudio.playMeow(emotion.type === 'curious' ? 1.2 : 1.0);
  };

  const handlePurrToggle = () => {
    if (emotion.purrIntensity > 0) {
      felineAudio.startPurr(emotion.purrIntensity);
    } else {
      felineAudio.stopPurr();
    }
  };

  // Custom 3D Model Uploader (.glb, .gltf)
  const handleModelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sceneRef.current) return;

    setModelLoading(true);
    setModelError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      const loader = new GLTFLoader();

      loader.parse(
        buffer,
        '',
        (gltf) => {
          if (!sceneRef.current) return;

          // Remove procedural cat mesh
          if (rigRef.current) {
            sceneRef.current.remove(rigRef.current.group);
          }

          // Scale & Center uploaded model
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2.0 / (maxDim || 1);
          model.scale.setScalar(scale);

          box.setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          model.position.x = -center.x;
          model.position.y = -box.min.y + 0.15;
          model.position.z = -center.z;

          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          sceneRef.current.add(model);
          setCustomModelLoaded(true);
          setModelLoading(false);
        },
        (err) => {
          setModelError('Failed to parse 3D file. Please ensure it is a valid .glb or .gltf model.');
          setModelLoading(false);
        }
      );
    };
    reader.onerror = () => {
      setModelError('Failed to read the file.');
      setModelLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="relative w-full h-full min-h-[200px] bg-[#0A0C10] overflow-hidden select-none">
      {/* WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left Spec / Emotion HUD (Only shown if showOverlayTelemetry is enabled) */}
      {showOverlayTelemetry && (
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
          <div className="flex items-center gap-2.5 px-3.5 py-2 bg-[#131722]/85 border border-[#232B3E] rounded-xl backdrop-blur-md shadow-lg pointer-events-auto">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-100 tracking-wide uppercase">
                {emotion.label}
              </span>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono tabular-nums">
                <span>Valence: {emotion.valence > 0 ? `+${emotion.valence.toFixed(2)}` : emotion.valence.toFixed(2)}</span>
                <span>·</span>
                <span>Arousal: {emotion.arousal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Real-time Feline Telemetry */}
          <div className="flex items-center gap-3 px-3 py-1.5 bg-[#131722]/75 border border-[#232B3E] rounded-lg text-[11px] text-slate-300 font-mono tabular-nums">
            <span>Pupils: {(emotion.pupilDilation * 100).toFixed(0)}%</span>
            <span>·</span>
            <span>Ears: {(emotion.earAlertness * 100).toFixed(0)}%</span>
            <span>·</span>
            <span>Purr: {(emotion.purrIntensity * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}

      {/* Top Right Quick Actions (Camera Reset, Sound Triggers, Model Upload) */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={handleMeowClick}
          title="Play inquisitive meow"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#131722]/85 hover:bg-[#1E2538] border border-[#232B3E] hover:border-amber-500/50 text-xs font-medium text-amber-300 rounded-lg transition-all shadow-md active:scale-95"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Meow</span>
        </button>

        <button
          onClick={handlePurrToggle}
          title="Toggle soothing purr resonance"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#131722]/85 hover:bg-[#1E2538] border border-[#232B3E] hover:border-emerald-500/50 text-xs font-medium text-emerald-300 rounded-lg transition-all shadow-md active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Purr</span>
        </button>

        <button
          onClick={handleResetCamera}
          title="Reset 3D camera view"
          className="p-2 bg-[#131722]/85 hover:bg-[#1E2538] border border-[#232B3E] text-slate-300 hover:text-white rounded-lg transition-all shadow-md active:scale-95"
        >
          <Camera className="w-3.5 h-3.5" />
        </button>

        <label
          htmlFor="model-upload-input"
          title="Upload custom .glb / .gltf 3D avatar"
          className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-[#131722]/85 hover:bg-[#1E2538] border border-[#232B3E] hover:border-blue-500/50 text-xs font-medium text-blue-300 rounded-lg transition-all shadow-md active:scale-95"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>{customModelLoaded ? 'Custom 3D' : 'Upload 3D'}</span>
        </label>
        <input
          id="model-upload-input"
          ref={fileInputRef}
          type="file"
          accept=".glb,.gltf"
          onChange={handleModelFileUpload}
          className="hidden"
        />
      </div>

      {/* Model Loading / Error Notice */}
      {modelLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 p-4 bg-[#131722] border border-[#232B3E] rounded-xl text-slate-200 text-sm">
            <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
            <span>Parsing 3D Avatar Model...</span>
          </div>
        </div>
      )}

      {modelError && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-lg shadow-lg">
          {modelError}
        </div>
      )}

      {/* Speaking Indicator Badge */}
      {isSpeaking && (
        <div className="absolute bottom-6 left-6 z-10 flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-300 text-xs font-medium">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>Speaking & Meowing</span>
        </div>
      )}
    </div>
  );
};
