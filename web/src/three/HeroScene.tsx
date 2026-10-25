import { Environment, Float, Lightformer, Sparkles } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

function Coin({ position, rotation, scale = 1, color = '#f5c451' }: { position: [number, number, number]; rotation: [number, number, number]; scale?: number; color?: string }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh castShadow>
        <cylinderGeometry args={[1, 1, 0.2, 72]} />
        <meshStandardMaterial color={color} metalness={1} roughness={0.22} />
      </mesh>
      {[0.11, -0.11].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.78, 0.045, 16, 72]} />
          <meshStandardMaterial color={color} metalness={1} roughness={0.12} />
        </mesh>
      ))}
    </group>
  )
}

/** Keeps the composition clear of the headline: right-aligned on wide canvases, raised on narrow ones. */
function Responsive({ children }: { children: React.ReactNode }) {
  const { viewport } = useThree()
  const wide = viewport.width > 5.5
  const s = Math.min(1, viewport.width / (wide ? 9 : 7.5))
  return (
    <group scale={s} position={wide ? [viewport.width * 0.14, viewport.height * 0.16, 0] : [0.3, viewport.height * 0.24, 0]}>
      {children}
    </group>
  )
}

function Rig() {
  const group = useRef<THREE.Group>(null)
  useFrame((state, dt) => {
    const g = group.current!
    // ease the whole scene toward the pointer
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, state.pointer.x * 0.45, 3, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -state.pointer.y * 0.3, 3, dt)
    g.position.x = THREE.MathUtils.damp(g.position.x, state.pointer.x * 0.25, 3, dt)
  })

  const coins = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        position: [Math.sin(i * 2.1) * 2.4, 0.4 + Math.cos(i * 1.7) * 1.2, -1 - (i % 3)] as [number, number, number],
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0] as [number, number, number],
        scale: 0.35 + (i % 3) * 0.12,
        color: i % 3 === 0 ? '#c4b5fd' : '#f5c451',
      })),
    [],
  )

  return (
    <group ref={group}>
      <Float speed={1.6} rotationIntensity={0.6} floatIntensity={1.2}>
        <group rotation={[0.4, 0, 0.15]}>
          {[0, 1, 2, 3].map((i) => (
            <Coin key={i} position={[0, -0.8 + i * 0.23, 0]} rotation={[0, i * 0.4, 0]} scale={1.05} />
          ))}
          <Coin position={[0.3, 0.55, 0.25]} rotation={[1.1, 0.2, -0.3]} scale={1.05} />
        </group>
      </Float>
      <Float speed={1.1} rotationIntensity={1.2} floatIntensity={0.8}>
        <mesh position={[1.9, 1.1, -0.6]}>
          <torusKnotGeometry args={[0.42, 0.14, 160, 24]} />
          <meshPhysicalMaterial color="#a78bfa" metalness={0.2} roughness={0.05} transmission={0.9} thickness={0.8} ior={1.4} clearcoat={1} />
        </mesh>
      </Float>
      <Float speed={1.3} rotationIntensity={1.5} floatIntensity={1}>
        <mesh position={[-2.1, -1.1, 0]}>
          <icosahedronGeometry args={[0.45, 0]} />
          <meshPhysicalMaterial color="#34d399" metalness={0.3} roughness={0.1} clearcoat={1} flatShading />
        </mesh>
      </Float>
      {coins.map((c, i) => (
        <Float key={i} speed={1 + (i % 3) * 0.4} rotationIntensity={2} floatIntensity={1.5}>
          <Coin {...c} />
        </Float>
      ))}
      <Sparkles count={70} scale={[9, 6, 4]} size={2.2} speed={0.35} color="#c4b5fd" />
    </group>
  )
}

export default function HeroScene() {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 6.5], fov: 42 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 5]} intensity={2.2} color="#fff4e0" />
      <pointLight position={[-4, -2, 3]} intensity={30} color="#7c3aed" />
      <Responsive>
        <Rig />
      </Responsive>
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} position={[0, 4, -6]} scale={[12, 3, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={2} position={[-6, 0, 0]} rotation-y={Math.PI / 2} scale={[8, 4, 1]} color="#a78bfa" />
        <Lightformer form="rect" intensity={2} position={[6, 0, 0]} rotation-y={-Math.PI / 2} scale={[8, 4, 1]} color="#34d399" />
        <Lightformer form="ring" intensity={2.5} position={[0, 0, 6]} scale={3} color="#fde68a" />
      </Environment>
    </Canvas>
  )
}
