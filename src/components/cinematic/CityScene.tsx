"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

/* ──────────────────────────────────────────────────────────────
   Shader: dark facade with glowing window grid
─────────────────────────────────────────────────────────────── */
const buildingVS = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vSeed;
  attribute float aSeed;

  #include <fog_pars_vertex>

  void main() {
    vUv = uv;
    vSeed = aSeed;
    vec4 mvPosition = instanceMatrix * vec4(position, 1.0);
    vWorldPos = (modelMatrix * mvPosition).xyz;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * mvPosition;

    #include <fog_vertex>
  }
`;

const buildingFS = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vSeed;
  uniform float uTime;
  uniform vec3 uWindowColorA;
  uniform vec3 uWindowColorB;

  #include <fog_pars_fragment>

  float hash(vec2 p) {
    p = fract(p * vec2(443.897, 441.423));
    p += dot(p, p + 19.19);
    return fract(p.x * p.y);
  }

  void main() {
    vec2 grid = vec2(8.0, 18.0);
    vec2 cell = floor(vUv * grid);
    vec2 frc  = fract(vUv * grid);

    vec2 windowSize = vec2(0.55, 0.7);
    vec2 m = step(0.5 - windowSize * 0.5, frc) * step(frc, 0.5 + windowSize * 0.5);
    float windowMask = m.x * m.y;

    float r = hash(cell + vSeed * 13.37);
    float lit = step(0.42, r);
    float flicker = 0.85 + 0.15 * sin(uTime * (1.5 + r * 4.0) + r * 10.0);
    float dim = mix(0.35, 1.0, hash(cell + 7.0));
    float wval = windowMask * lit * flicker * dim;

    float coolMask = step(0.85, hash(cell + 22.7));
    vec3 windowCol = mix(uWindowColorA, uWindowColorB, coolMask);

    vec3 facade = vec3(0.015, 0.018, 0.03);

    vec3 col = facade + windowCol * wval * 1.4;

    gl_FragColor = vec4(col, 1.0);

    #include <fog_fragment>
  }
`;

/* ──────────────────────────────────────────────────────────────
   BuildingField
─────────────────────────────────────────────────────────────── */
function BuildingField({
  count = 90,
  spread = [80, 6, 30] as [number, number, number],
  origin = [0, 0, -25] as [number, number, number],
  heightRange = [3, 16] as [number, number],
  widthRange = [1.0, 2.4] as [number, number],
  windowColorA = "#FFB36A",
  windowColorB = "#7CDFFF",
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matRef  = useRef<THREE.ShaderMaterial>(null);

  const { positions, scales, seeds } = useMemo(() => {
    const p: { px: number; py: number; pz: number }[] = [];
    const s: { sx: number; sy: number; sz: number }[] = [];
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const px = (Math.random() - 0.5) * spread[0];
      const pz = (Math.random() - 0.5) * spread[2] + origin[2];
      const sx = widthRange[0] + Math.random() * (widthRange[1] - widthRange[0]);
      const sy = heightRange[0] + Math.random() * (heightRange[1] - heightRange[0]);
      const sz = widthRange[0] + Math.random() * (widthRange[1] - widthRange[0]);
      const py = origin[1] + sy / 2;
      p.push({ px, py, pz });
      s.push({ sx, sy, sz });
      seeds[i] = Math.random();
    }
    return { positions: p, scales: s, seeds };
  }, [count, spread, origin, heightRange, widthRange]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      m.makeScale(scales[i].sx, scales[i].sy, scales[i].sz);
      m.setPosition(positions[i].px, positions[i].py, positions[i].pz);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;

    const geom = mesh.geometry as THREE.InstancedBufferGeometry & THREE.BoxGeometry;
    geom.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 1));
  }, [count, positions, scales, seeds]);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uWindowColorA: { value: new THREE.Color(windowColorA) },
    uWindowColorB: { value: new THREE.Color(windowColorB) },
  }), [windowColorA, windowColorB]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={buildingVS}
        fragmentShader={buildingFS}
        uniforms={uniforms}
        fog
        toneMapped
      />
    </instancedMesh>
  );
}

/* ──────────────────────────────────────────────────────────────
   FloatingDrones
─────────────────────────────────────────────────────────────── */
function FloatingDrones({ count = 18 }: { count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 70,
      y: 4 + Math.random() * 14,
      z: -10 - Math.random() * 30,
      speed: 0.15 + Math.random() * 0.4,
      offset: Math.random() * 1000,
      size: 0.04 + Math.random() * 0.06,
      hue: Math.random() > 0.6 ? new THREE.Color("#9B82FD") : new THREE.Color("#FF6F91"),
    }));
  }, [count]);

  useEffect(() => {
    if (!ref.current) return;
    for (let i = 0; i < count; i++) {
      ref.current.setColorAt(i, data[i].hue);
    }
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [count, data]);

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const d = data[i];
      const x = d.x + Math.sin(t * d.speed + d.offset) * 6;
      const y = d.y + Math.cos(t * d.speed * 0.7 + d.offset) * 0.8;
      const s = d.size * (0.85 + Math.sin(t * 3 + d.offset) * 0.15);
      m.makeScale(s, s, s);
      m.setPosition(x, y, d.z);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

/* ──────────────────────────────────────────────────────────────
   CarLightTrails — instanced glowing streaks moving across street
─────────────────────────────────────────────────────────────── */
function CarLightTrails({ count = 36, z = -8, y = 0.05 }: { count?: number; z?: number; y?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);

  const data = useMemo(() => {
    return Array.from({ length: count }, () => {
      const dir = Math.random() > 0.5 ? 1 : -1;
      return {
        dir,
        speed: 8 + Math.random() * 14,
        x: (Math.random() - 0.5) * 80,
        z: z + (Math.random() - 0.5) * 1.6,
        warm: Math.random() > 0.5,
      };
    });
  }, [count, z]);

  useEffect(() => {
    if (!ref.current) return;
    for (let i = 0; i < count; i++) {
      ref.current.setColorAt(
        i,
        new THREE.Color(data[i].warm ? "#FFC080" : "#FF5060"),
      );
    }
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [count, data]);

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const d = data[i];
      let x = d.x + d.dir * d.speed * t;
      x = ((x + 60) % 120) - 60;
      m.makeScale(2.2 * d.dir, 0.04, 0.04);
      m.setPosition(x, y, d.z);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

/* ──────────────────────────────────────────────────────────────
   HoloGrid — animated holographic floor
─────────────────────────────────────────────────────────────── */
const gridVS = /* glsl */ `
  varying vec2 vUv;
  varying float vDist;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vDist = length(wp.xz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const gridFS = /* glsl */ `
  varying vec2 vUv;
  varying float vDist;
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  float gridLine(vec2 uv, float scale, float thickness) {
    vec2 g = abs(fract(uv * scale - 0.5) - 0.5) / fwidth(uv * scale);
    float l = min(g.x, g.y);
    return 1.0 - smoothstep(0.0, thickness, l);
  }

  void main() {
    vec2 uv = vUv;
    uv.y -= uTime * 0.06;

    float major = gridLine(uv, 18.0, 1.2);
    float minor = gridLine(uv, 90.0, 1.0) * 0.25;
    float lines = major + minor;

    float fade = 1.0 - smoothstep(0.0, 60.0, vDist);
    float center = 1.0 - smoothstep(0.0, 12.0, vDist);

    vec3 col = mix(uColorB, uColorA, center);
    float a = lines * fade * 0.55;

    if (a < 0.005) discard;
    gl_FragColor = vec4(col * lines, a);
  }
`;

function HoloGrid() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColorA: { value: new THREE.Color("#9B82FD") },
    uColorB: { value: new THREE.Color("#1E2440") },
  }), []);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -10]}>
      <planeGeometry args={[200, 140]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={gridVS}
        fragmentShader={gridFS}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

/* ──────────────────────────────────────────────────────────────
   Helicopter — blinking nav-light point in the sky
─────────────────────────────────────────────────────────────── */
function Helicopter() {
  const groupRef = useRef<THREE.Group>(null);
  const redRef = useRef<THREE.Mesh>(null);
  const greenRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.position.x = Math.sin(t * 0.08) * 30;
      groupRef.current.position.y = 16 + Math.cos(t * 0.05) * 1.5;
      groupRef.current.position.z = -45 + Math.sin(t * 0.04) * 2;
    }
    const blink = Math.sin(t * 4.0) > 0 ? 1 : 0.05;
    if (redRef.current) (redRef.current.material as THREE.MeshBasicMaterial).opacity = blink;
    if (greenRef.current) (greenRef.current.material as THREE.MeshBasicMaterial).opacity = 1 - blink;
  });

  return (
    <group ref={groupRef}>
      <mesh ref={redRef}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color="#FF2040" transparent opacity={1} toneMapped={false} />
      </mesh>
      <mesh ref={greenRef} position={[0.4, 0, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshBasicMaterial color="#22FFA0" transparent opacity={1} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ──────────────────────────────────────────────────────────────
   GroundFog
─────────────────────────────────────────────────────────────── */
function GroundFog() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -10]}>
      <planeGeometry args={[200, 100]} />
      <meshBasicMaterial color="#06060d" transparent opacity={0.85} depthWrite={false} />
    </mesh>
  );
}

/* ──────────────────────────────────────────────────────────────
   Camera dolly + mouse parallax + scroll dolly
─────────────────────────────────────────────────────────────── */
function CameraRig() {
  const { camera, mouse } = useThree();
  const target = useRef({ x: 0, y: 4.2 });
  const scrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scrollY.current = Math.min(1, window.scrollY / max);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useFrame((state, delta) => {
    const tx = mouse.x * 1.4;
    const ty = 4.2 + mouse.y * 0.7;
    const k = Math.min(1, delta * 2.5);
    target.current.x += (tx - target.current.x) * k;
    target.current.y += (ty - target.current.y) * k;

    const t = state.clock.elapsedTime;
    const scrollPush = scrollY.current * 6;

    camera.position.x = target.current.x + Math.sin(t * 0.05) * 0.3;
    camera.position.y = target.current.y + scrollY.current * 1.2;
    camera.position.z = 14 - scrollPush + Math.sin(t * 0.03) * 0.2;
    camera.lookAt(0, 6 - scrollY.current * 1.5, -25 - scrollPush);
  });

  return null;
}

/* ──────────────────────────────────────────────────────────────
   Scene
─────────────────────────────────────────────────────────────── */
function Scene() {
  return (
    <>
      <fog attach="fog" args={["#070713", 18, 75]} />
      <color attach="background" args={["#050509"]} />

      <Stars radius={120} depth={40} count={1200} factor={3.2} saturation={0} fade speed={0.4} />

      {/* Ambient gradient via large back plane */}
      <mesh position={[0, 12, -70]}>
        <planeGeometry args={[260, 90]} />
        <meshBasicMaterial color="#0d0a25" transparent opacity={0.6} depthWrite={false} />
      </mesh>

      <BuildingField
        count={70}
        spread={[120, 0, 18]}
        origin={[0, 0, -42]}
        heightRange={[4, 14]}
        widthRange={[1.4, 2.6]}
        windowColorA="#FF9F5A"
        windowColorB="#7CC4FF"
      />
      <BuildingField
        count={55}
        spread={[80, 0, 16]}
        origin={[0, 0, -26]}
        heightRange={[5, 18]}
        widthRange={[1.6, 3.0]}
        windowColorA="#FFB36A"
        windowColorB="#7CDFFF"
      />
      <BuildingField
        count={28}
        spread={[60, 0, 12]}
        origin={[0, 0, -14]}
        heightRange={[6, 22]}
        widthRange={[1.8, 3.4]}
        windowColorA="#FFC97A"
        windowColorB="#9B82FD"
      />

      <FloatingDrones count={18} />
      <Helicopter />

      <GroundFog />
      <HoloGrid />

      <CarLightTrails count={26} z={-7.5} y={0.06} />
      <CarLightTrails count={22} z={-18} y={0.06} />

      <CameraRig />

      <EffectComposer>
        <Bloom intensity={0.95} luminanceThreshold={0.22} luminanceSmoothing={0.7} mipmapBlur />
        <ChromaticAberration
          offset={[0.0008, 0.0008]}
          radialModulation={false}
          modulationOffset={0}
          blendFunction={BlendFunction.NORMAL}
        />
        <Vignette eskil={false} offset={0.22} darkness={0.9} />
      </EffectComposer>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   Public component
─────────────────────────────────────────────────────────────── */
export default function CityScene() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <Canvas
        camera={{ position: [0, 4.2, 14], fov: 38, near: 0.1, far: 200 }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: false,
          stencil: false,
        }}
        dpr={[1, 1.6]}
        flat
      >
        <Scene />
      </Canvas>
    </div>
  );
}
