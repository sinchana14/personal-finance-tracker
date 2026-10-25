import { useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: Variant
  strength?: number
}

const styles: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-violet to-violet-deep text-white shadow-[0_10px_30px_-8px_rgba(124,58,237,0.8),inset_0_1px_0_rgba(255,255,255,0.3)] group-hover:shadow-[0_16px_40px_-8px_rgba(124,58,237,0.95),inset_0_1px_0_rgba(255,255,255,0.3)]',
  ghost: 'border border-white/10 bg-white/5 text-white/90 group-hover:bg-white/10',
  danger: 'border border-coral/30 bg-coral/10 text-coral group-hover:bg-coral/20',
}

/**
 * Button whose visible face is pulled toward the cursor while hovered.
 * The <button> itself never moves or scales, so the press and release of a
 * click always land on the same element and the click registers.
 */
export function MagneticButton({ children, className = '', variant = 'primary', strength = 0.3, ...rest }: Props) {
  const face = useRef<HTMLSpanElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  const onMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== 'mouse' || rest.disabled) return
    const r = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - (r.left + r.width / 2)
    const y = e.clientY - (r.top + r.height / 2)
    face.current!.style.translate = `${x * strength}px ${y * strength}px`
    label.current!.style.translate = `${x * strength * 0.5}px ${y * strength * 0.5}px`
  }
  const reset = () => {
    face.current!.style.translate = ''
    label.current!.style.translate = ''
  }

  return (
    <button
      onPointerMove={onMove}
      onPointerLeave={reset}
      className={`group relative inline-flex rounded-2xl font-display text-sm font-semibold disabled:opacity-50 ${className}`}
      {...rest}
    >
      <span
        ref={face}
        className={`pointer-events-none inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 transition-[translate,scale,box-shadow,background-color] duration-300 ease-out group-active:scale-95 ${styles[variant]}`}
      >
        <span ref={label} className="inline-flex items-center gap-2 transition-[translate] duration-300 ease-out">
          {children}
        </span>
      </span>
    </button>
  )
}
