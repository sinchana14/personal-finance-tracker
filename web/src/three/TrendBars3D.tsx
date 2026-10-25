import { Html, RoundedBox } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { money } from '../lib/format'

interface Point {
  label: string
  income: number
  expense: number
}

function Bar({ x, h, color, delay, active }: { x: number; h: number; color: string; delay: number; active: boolean }) {
  const ref = useRef<THREE.Group>(null)
  const born = useRef<number | null>(null)
  useFrame((state, dt) => {
    if (born.current === null) born.current = state.clock.elapsedTime
    const t = Math.min(1, Math.max(0, (state.clock.elapsedTime - born.current - delay) / 0.9))
    const eased = 1 - Math.pow(1 - t, 3)
    const g = ref.current!
    g.scale.y = Math.max(0.001, eased)
    g.position.y = THREE.MathUtils.damp(g.position.y, active ? 0.12 : 0, 8, dt)
  })
  return (
    <group ref={ref} position={[x, 0, 0]}>
      <RoundedBox args={[0.34, Math.max(h, 0.04), 0.34]} radius={0.06} smoothness={4} position={[0, Math.max(h, 0.04) / 2, 0]}>
        <meshStandardMaterial color={color} metalness={0.35} roughness={0.25} emissive={color} emissiveIntensity={active ? 0.7 : 0.18} />
      </RoundedBox>
    </group>
  )
}

function Bars({ data }: { data: Point[] }) {
  const group = useRef<THREE.Group>(null)
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]))
  const H = 2.4
  const gap = 1.05
  const offset = ((data.length - 1) * gap) / 2

  useFrame((state, dt) => {
    const g = group.current!
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, -0.35 + state.pointer.x * 0.35, 3, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, 0.28 - state.pointer.y * 0.12, 3, dt)
  })

  return (
    <group ref={group} position={[0, -1.2, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
        <planeGeometry args={[data.length * gap + 1, 2.2]} />
        <meshStandardMaterial color="#17173a" transparent opacity={0.6} />
      </mesh>
      <gridHelper args={[data.length * gap + 1, data.length * 2, '#3b2f6b', '#221d45']} position={[0, 0.001, 0]} />
      {data.map((d, i) => {
        const x = i * gap - offset
        const active = hover === i
        return (
          <group key={d.label} onPointerOver={(e) => (e.stopPropagation(), setHover(i))} onPointerOut={() => setHover((h) => (h === i ? null : h))}>
            <mesh position={[x, H / 2, 0]} visible={false}>
              <boxGeometry args={[0.95, H + 0.4, 0.8]} />
            </mesh>
            <Bar x={x - 0.2} h={(d.income / max) * H} color="#34d399" delay={i * 0.08} active={active} />
            <Bar x={x + 0.2} h={(d.expense / max) * H} color="#fb7185" delay={i * 0.08 + 0.04} active={active} />
            <Html position={[x, -0.25, 0.5]} center distanceFactor={7} style={{ pointerEvents: 'none' }}>
              <span className={`font-display text-[13px] ${active ? 'text-white' : 'text-white/45'}`}>{d.label}</span>
            </Html>
            {active && (
              <Html position={[x, Math.max(d.income, d.expense) / max * H + 0.55, 0]} center distanceFactor={7} style={{ pointerEvents: 'none' }}>
                <div className="glass whitespace-nowrap rounded-xl px-3 py-2 text-[13px]">
                  <div className="text-mint">↑ {money(d.income, { compact: true })}</div>
                  <div className="text-coral">↓ {money(d.expense, { compact: true })}</div>
                </div>
              </Html>
            )}
          </group>
        )
      })}
    </group>
  )
}

export default function TrendBars3D({ data }: { data: Point[] }) {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 1.2, 6.2], fov: 40 }} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 6, 4]} intensity={2} />
      <pointLight position={[-4, 2, 2]} intensity={18} color="#7c3aed" />
      <Bars data={data} />
    </Canvas>
  )
}
