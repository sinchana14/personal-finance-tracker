import { Environment, Float, Lightformer, MeshDistortMaterial } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'

function Orb({ health }: { health: number }) {
  const mesh = useRef<THREE.Mesh>(null)
  const ring = useRef<THREE.Mesh>(null)
  const [hover, setHover] = useState(false)
  // health 0..1: coral -> amber -> mint
  const color =
    health < 0.5
      ? new THREE.Color().lerpColors(new THREE.Color('#fb7185'), new THREE.Color('#fbbf24'), health * 2)
      : new THREE.Color().lerpColors(new THREE.Color('#fbbf24'), new THREE.Color('#34d399'), (health - 0.5) * 2)

  useFrame((state, dt) => {
    const m = mesh.current!
    m.rotation.y += dt * 0.25
    m.rotation.x = THREE.MathUtils.damp(m.rotation.x, state.pointer.y * 0.5, 4, dt)
    m.rotation.z = THREE.MathUtils.damp(m.rotation.z, -state.pointer.x * 0.5, 4, dt)
    const s = THREE.MathUtils.damp(m.scale.x, hover ? 1.12 : 1, 6, dt)
    m.scale.setScalar(s)
    ring.current!.rotation.z += dt * 0.4
    ring.current!.rotation.x = THREE.MathUtils.damp(ring.current!.rotation.x, 1.2 + state.pointer.y * 0.3, 4, dt)
  })

  return (
    <Float speed={2} floatIntensity={0.6} rotationIntensity={0.2}>
      <mesh ref={mesh} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
        <icosahedronGeometry args={[1, 24]} />
        <MeshDistortMaterial color={color} distort={hover ? 0.45 : 0.3} speed={hover ? 4 : 2} metalness={0.4} roughness={0.15} />
      </mesh>
      <mesh ref={ring} rotation={[1.2, 0, 0]}>
        <torusGeometry args={[1.55, 0.025, 16, 120]} />
        <meshStandardMaterial color="#c4b5fd" emissive="#7c3aed" emissiveIntensity={1.4} />
      </mesh>
    </Float>
  )
}

export default function BalanceOrb({ health }: { health: number }) {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 4.2], fov: 45 }} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 3, 4]} intensity={2} />
      <pointLight position={[-3, -2, 2]} intensity={20} color="#7c3aed" />
      <Orb health={health} />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={2.5} position={[0, 3, -4]} scale={[8, 2, 1]} />
        <Lightformer form="ring" intensity={2} position={[3, 0, 3]} scale={2} color="#a78bfa" />
      </Environment>
    </Canvas>
  )
}
