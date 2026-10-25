import { useRef, type HTMLAttributes, type ReactNode } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Max rotation in degrees */
  max?: number
  /** Translate children toward the viewer for depth */
  depth?: boolean
}

/** Glass card that tilts in 3D toward the cursor, with a moving glare and glowing edge. */
export function TiltCard({ children, className = '', max = 8, depth = true, style, ...rest }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const frame = useRef(0)
  // Hold the tilt still while a button is pressed so clicks land where they started
  const pressed = useRef(false)

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || pressed.current) return
    const el = ref.current!
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty('--rx', `${(0.5 - py) * max}deg`)
      el.style.setProperty('--ry', `${(px - 0.5) * max}deg`)
      el.style.setProperty('--gx', `${px * 100}%`)
      el.style.setProperty('--gy', `${py * 100}%`)
      el.style.setProperty('--go', '1')
    })
  }
  const onLeave = () => {
    cancelAnimationFrame(frame.current)
    const el = ref.current!
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
    el.style.setProperty('--go', '0')
  }

  return (
    <div className="[perspective:1200px]" style={style}>
      <div
        {...rest}
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={() => {
          pressed.current = false
          onLeave()
        }}
        onPointerDown={() => (pressed.current = true)}
        onPointerUp={() => (pressed.current = false)}
        className={`glass glare glow-border relative rounded-3xl transition-transform duration-300 ease-out will-change-transform [transform-style:preserve-3d] [transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))] ${className}`}
      >
        <div className={depth ? '[transform:translateZ(28px)] [transform-style:preserve-3d] h-full' : 'h-full'}>{children}</div>
      </div>
    </div>
  )
}
