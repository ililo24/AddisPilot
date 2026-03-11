import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AvatarProps {
  analyser: AnalyserNode | null;
  isSpeaking?: boolean;
}

// --- Color Palette ---
const SKIN = '#8B5E3C';
const SKIN_DARK = '#6B4226';
const HAIR = '#1a1a2e';
const DRESS_WHITE = '#F5F0E8';
const DRESS_TRIM = '#D4AF37';
const EYE_WHITE = '#F0EDE8';
const IRIS = '#2C1810';
const LIP_COLOR = '#7B3B3B';

// --- Reusable volume hook (supports real analyser + simulated speaking) ---
function useVolume(analyser: AnalyserNode | null, isSpeaking: boolean = false) {
  const dataArray = useRef(new Uint8Array(0));
  const smoothVolume = useRef(0);

  useEffect(() => {
    if (analyser) {
      dataArray.current = new Uint8Array(analyser.frequencyBinCount);
    }
  }, [analyser]);

  const getVolume = (elapsedTime: number) => {
    let raw = 0;

    if (analyser) {
      analyser.getByteFrequencyData(dataArray.current);
      let sum = 0;
      const len = Math.floor(dataArray.current.length / 2);
      for (let i = 0; i < len; i++) sum += dataArray.current[i];
      raw = sum / (len * 255);
    }

    // If no real audio data but speaking, simulate mouth movement
    if (raw < 0.01 && isSpeaking) {
      raw = 0.15 + Math.sin(elapsedTime * 12) * 0.1 + Math.sin(elapsedTime * 7.3) * 0.08;
    }

    smoothVolume.current = THREE.MathUtils.lerp(smoothVolume.current, raw, 0.15);
    return smoothVolume.current;
  };

  return getVolume;
}

// --- Head & Face ---
const Head = ({ analyser, isSpeaking = false }: { analyser: AnalyserNode | null; isSpeaking?: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftEyelidRef = useRef<THREE.Mesh>(null);
  const rightEyelidRef = useRef<THREE.Mesh>(null);
  const getVolume = useVolume(analyser, isSpeaking);
  const blinkTimer = useRef(0);

  const skinMat = useMemo(() => new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.7, metalness: 0.05 }), []);
  const skinDarkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: SKIN_DARK, roughness: 0.7, metalness: 0.05 }), []);
  const hairMat = useMemo(() => new THREE.MeshStandardMaterial({ color: HAIR, roughness: 0.9, metalness: 0.1 }), []);
  const eyeWhiteMat = useMemo(() => new THREE.MeshStandardMaterial({ color: EYE_WHITE, roughness: 0.3 }), []);
  const irisMat = useMemo(() => new THREE.MeshStandardMaterial({ color: IRIS, roughness: 0.4 }), []);
  const lipMat = useMemo(() => new THREE.MeshStandardMaterial({ color: LIP_COLOR, roughness: 0.5 }), []);
  const goldMat = useMemo(() => new THREE.MeshStandardMaterial({ color: DRESS_TRIM, roughness: 0.3, metalness: 0.8, emissive: DRESS_TRIM, emissiveIntensity: 0.15 }), []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const volume = getVolume(state.clock.elapsedTime);
    const t = state.clock.elapsedTime;

    // Idle head sway
    groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.06;
    groupRef.current.rotation.z = Math.sin(t * 0.3) * 0.02;

    // Mouth opens based on volume
    if (mouthRef.current) {
      const openAmount = THREE.MathUtils.lerp(0.02, 0.12, Math.min(volume * 3, 1));
      mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, 1 + openAmount * 8, 0.2);
      mouthRef.current.scale.x = THREE.MathUtils.lerp(mouthRef.current.scale.x, 1 - openAmount * 1.5, 0.2);
    }

    // Blink
    blinkTimer.current += state.clock.getDelta();
    let eyelidScale = 0.01; // open
    if (blinkTimer.current > 3.5 && blinkTimer.current < 3.7) {
      eyelidScale = 1.0; // closed
    } else if (blinkTimer.current > 3.7) {
      blinkTimer.current = 0;
    }

    if (leftEyelidRef.current) leftEyelidRef.current.scale.y = THREE.MathUtils.lerp(leftEyelidRef.current.scale.y, eyelidScale, 0.3);
    if (rightEyelidRef.current) rightEyelidRef.current.scale.y = THREE.MathUtils.lerp(rightEyelidRef.current.scale.y, eyelidScale, 0.3);
  });

  return (
    <group ref={groupRef} position={[0, 0.55, 0]}>
      {/* Head sphere - slightly elongated for African features */}
      <mesh material={skinMat}>
        <sphereGeometry args={[0.52, 32, 32]} />
      </mesh>

      {/* Jawline - slightly wider lower face */}
      <mesh position={[0, -0.18, 0.08]} material={skinMat}>
        <sphereGeometry args={[0.42, 24, 24]} />
      </mesh>

      {/* --- Hair: Ethiopian braided updo style --- */}
      {/* Main hair volume on top */}
      <mesh position={[0, 0.28, -0.05]} material={hairMat}>
        <sphereGeometry args={[0.48, 24, 24]} />
      </mesh>
      {/* Hair bun / updo */}
      <mesh position={[0, 0.55, -0.12]} material={hairMat}>
        <sphereGeometry args={[0.25, 20, 20]} />
      </mesh>
      {/* Side hair volume left */}
      <mesh position={[-0.38, 0.08, -0.12]} material={hairMat}>
        <sphereGeometry args={[0.22, 16, 16]} />
      </mesh>
      {/* Side hair volume right */}
      <mesh position={[0.38, 0.08, -0.12]} material={hairMat}>
        <sphereGeometry args={[0.22, 16, 16]} />
      </mesh>
      {/* Back hair */}
      <mesh position={[0, 0.0, -0.35]} material={hairMat}>
        <sphereGeometry args={[0.38, 20, 20]} />
      </mesh>

      {/* --- Crown / Headband (Ethiopian gold netela-inspired) --- */}
      <mesh position={[0, 0.2, 0.0]} rotation={[0.15, 0, 0]} material={goldMat}>
        <torusGeometry args={[0.5, 0.025, 8, 32]} />
      </mesh>
      {/* Central crown jewel */}
      <mesh position={[0, 0.32, 0.38]} material={goldMat}>
        <sphereGeometry args={[0.04, 12, 12]} />
      </mesh>
      {/* Crown jewel left */}
      <mesh position={[-0.18, 0.28, 0.36]} material={goldMat}>
        <sphereGeometry args={[0.025, 10, 10]} />
      </mesh>
      {/* Crown jewel right */}
      <mesh position={[0.18, 0.28, 0.36]} material={goldMat}>
        <sphereGeometry args={[0.025, 10, 10]} />
      </mesh>

      {/* --- Eyes --- */}
      {/* Left eye */}
      <group position={[-0.17, 0.06, 0.42]}>
        {/* Sclera */}
        <mesh material={eyeWhiteMat}>
          <sphereGeometry args={[0.08, 16, 16]} />
        </mesh>
        {/* Iris */}
        <mesh position={[0, 0, 0.05]} material={irisMat}>
          <sphereGeometry args={[0.05, 14, 14]} />
        </mesh>
        {/* Pupil */}
        <mesh position={[0, 0, 0.07]}>
          <sphereGeometry args={[0.025, 12, 12]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        {/* Eyelid */}
        <mesh ref={leftEyelidRef} position={[0, 0.04, 0.02]} material={skinMat}>
          <boxGeometry args={[0.18, 0.1, 0.1]} />
        </mesh>
      </group>

      {/* Right eye */}
      <group position={[0.17, 0.06, 0.42]}>
        <mesh material={eyeWhiteMat}>
          <sphereGeometry args={[0.08, 16, 16]} />
        </mesh>
        <mesh position={[0, 0, 0.05]} material={irisMat}>
          <sphereGeometry args={[0.05, 14, 14]} />
        </mesh>
        <mesh position={[0, 0, 0.07]}>
          <sphereGeometry args={[0.025, 12, 12]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        <mesh ref={rightEyelidRef} position={[0, 0.04, 0.02]} material={skinMat}>
          <boxGeometry args={[0.18, 0.1, 0.1]} />
        </mesh>
      </group>

      {/* --- Nose --- */}
      <mesh position={[0, -0.06, 0.48]} material={skinDarkMat}>
        <sphereGeometry args={[0.06, 12, 12]} />
      </mesh>
      {/* Nose bridge */}
      <mesh position={[0, 0.02, 0.46]} material={skinMat} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.06, 0.12, 0.06]} />
      </mesh>
      {/* Nostrils left */}
      <mesh position={[-0.04, -0.09, 0.47]} material={skinDarkMat}>
        <sphereGeometry args={[0.03, 10, 10]} />
      </mesh>
      {/* Nostrils right */}
      <mesh position={[0.04, -0.09, 0.47]} material={skinDarkMat}>
        <sphereGeometry args={[0.03, 10, 10]} />
      </mesh>

      {/* --- Mouth / Lips --- */}
      <mesh ref={mouthRef} position={[0, -0.2, 0.42]} material={lipMat}>
        <sphereGeometry args={[0.08, 16, 8]} />
      </mesh>
      {/* Upper lip */}
      <mesh position={[0, -0.17, 0.44]} material={lipMat} scale={[1.2, 0.5, 0.8]}>
        <sphereGeometry args={[0.06, 12, 8]} />
      </mesh>

      {/* --- Ears --- */}
      <mesh position={[-0.5, 0.02, 0.0]} material={skinMat}>
        <sphereGeometry args={[0.08, 10, 10]} />
      </mesh>
      <mesh position={[0.5, 0.02, 0.0]} material={skinMat}>
        <sphereGeometry args={[0.08, 10, 10]} />
      </mesh>

      {/* --- Earrings (gold) --- */}
      <mesh position={[-0.52, -0.1, 0.0]} material={goldMat}>
        <sphereGeometry args={[0.035, 8, 8]} />
      </mesh>
      <mesh position={[0.52, -0.1, 0.0]} material={goldMat}>
        <sphereGeometry args={[0.035, 8, 8]} />
      </mesh>

      {/* --- Eyebrows --- */}
      <mesh position={[-0.17, 0.17, 0.44]} rotation={[0, 0, 0.15]} material={hairMat}>
        <boxGeometry args={[0.14, 0.025, 0.04]} />
      </mesh>
      <mesh position={[0.17, 0.17, 0.44]} rotation={[0, 0, -0.15]} material={hairMat}>
        <boxGeometry args={[0.14, 0.025, 0.04]} />
      </mesh>
    </group>
  );
};

// --- Neck & Upper Body ---
const Body = () => {
  const dressMat = useMemo(() => new THREE.MeshStandardMaterial({ color: DRESS_WHITE, roughness: 0.6, metalness: 0.0 }), []);
  const skinMat = useMemo(() => new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.7, metalness: 0.05 }), []);
  const goldMat = useMemo(() => new THREE.MeshStandardMaterial({ color: DRESS_TRIM, roughness: 0.3, metalness: 0.8, emissive: DRESS_TRIM, emissiveIntensity: 0.15 }), []);
  const trimMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2D5016', roughness: 0.5 }), []);

  return (
    <group position={[0, -0.6, 0]}>
      {/* Neck */}
      <mesh position={[0, 0.55, 0]} material={skinMat}>
        <cylinderGeometry args={[0.14, 0.16, 0.35, 16]} />
      </mesh>

      {/* Necklace */}
      <mesh position={[0, 0.42, 0.05]} rotation={[0.2, 0, 0]} material={goldMat}>
        <torusGeometry args={[0.17, 0.015, 8, 24]} />
      </mesh>
      {/* Necklace pendant */}
      <mesh position={[0, 0.28, 0.15]} material={goldMat}>
        <octahedronGeometry args={[0.04, 0]} />
      </mesh>

      {/* Torso - Habesha Kemis (Ethiopian dress) */}
      <mesh position={[0, 0.05, 0]} material={dressMat}>
        <cylinderGeometry args={[0.28, 0.42, 0.75, 16]} />
      </mesh>

      {/* Dress neckline trim (green Ethiopian cross pattern) */}
      <mesh position={[0, 0.35, 0.1]} rotation={[0.4, 0, 0]} material={trimMat}>
        <torusGeometry args={[0.2, 0.02, 6, 20]} />
      </mesh>

      {/* Dress gold trim at bottom */}
      <mesh position={[0, -0.32, 0]} material={goldMat}>
        <torusGeometry args={[0.42, 0.015, 6, 24]} />
      </mesh>

      {/* --- Shoulders / Arms (simplified) --- */}
      {/* Left shoulder */}
      <mesh position={[-0.35, 0.3, 0]} material={dressMat}>
        <sphereGeometry args={[0.15, 12, 12]} />
      </mesh>
      {/* Left upper arm */}
      <mesh position={[-0.42, 0.1, 0]} rotation={[0, 0, 0.2]} material={dressMat}>
        <cylinderGeometry args={[0.08, 0.1, 0.35, 10]} />
      </mesh>

      {/* Right shoulder */}
      <mesh position={[0.35, 0.3, 0]} material={dressMat}>
        <sphereGeometry args={[0.15, 12, 12]} />
      </mesh>
      {/* Right upper arm */}
      <mesh position={[0.42, 0.1, 0]} rotation={[0, 0, -0.2]} material={dressMat}>
        <cylinderGeometry args={[0.08, 0.1, 0.35, 10]} />
      </mesh>

      {/* Netela / Shawl drape across left shoulder */}
      <mesh position={[-0.15, 0.25, 0.18]} rotation={[0.3, 0.5, -0.5]} material={dressMat} scale={[1.2, 0.15, 0.8]}>
        <boxGeometry args={[0.6, 0.5, 0.05]} />
      </mesh>
      {/* Shawl trim (green-gold Ethiopian pattern border) */}
      <mesh position={[-0.15, 0.18, 0.22]} rotation={[0.3, 0.5, -0.5]} material={trimMat} scale={[1.2, 0.04, 0.8]}>
        <boxGeometry args={[0.6, 0.5, 0.06]} />
      </mesh>
    </group>
  );
};

// --- Main Avatar Group (idle + speaking animation) ---
const Eleenjisaa = ({ analyser, isSpeaking = false }: { analyser: AnalyserNode | null; isSpeaking?: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const getVolume = useVolume(analyser, isSpeaking);

  useFrame((state) => {
    if (!groupRef.current) return;
    const volume = getVolume(state.clock.elapsedTime);
    const t = state.clock.elapsedTime;

    // Gentle breathing / floating
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.03;

    // Subtle lean when speaking
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      volume > 0.05 ? -0.03 : 0,
      0.05
    );
  });

  return (
    <group ref={groupRef}>
      <Head analyser={analyser} isSpeaking={isSpeaking} />
      <Body />
    </group>
  );
};

export const Avatar: React.FC<AvatarProps> = ({ analyser, isSpeaking = false }) => {
  return (
    <div className="w-full h-64 bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg overflow-hidden border border-slate-700 relative">
      <div className="absolute top-2 left-2 z-10 text-xs text-white/50 font-mono">
        E leenjisaa: {isSpeaking ? "SPEAKING" : analyser ? "ONLINE" : "STANDBY"}
      </div>
      <Canvas camera={{ position: [0, 0.2, 2.2], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 5]} intensity={1.0} color="#fff5ee" />
        <directionalLight position={[-3, 2, 2]} intensity={0.3} color="#b0c4de" />
        <pointLight position={[0, 1, 3]} intensity={0.4} color="#ffd700" distance={6} />
        <Eleenjisaa analyser={analyser} isSpeaking={isSpeaking} />
      </Canvas>
    </div>
  );
};
