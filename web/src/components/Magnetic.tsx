import { useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: Variant
  strength?: number
}

const styles: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-violet to-violet-deep text-white shadow-[0_10px_30px_-8px_rgba(124,58,237,0.8),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_16px_40px_-8px_rgba(124,58,237,0.95),inset_0_1px_0_rgba(255,255,255,0.3)]',
  ghost: 'border border-white/10 bg-white/5 text-white/90 hover:bg-white/10',
  danger: 'border border-coral/30 bg-coral/10 text-coral hover:bg-coral/20',
}

/** Button that is pulled toward the cursor while hovered. */
export function MagneticButton({ children, className = '', variant = 'primary', strength = 0.3, ...rest }: Props) {
  const ref = useRef<HTMLButtonElement>(null)
  const inner = useRef<HTMLSpanElement>(null)

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || rest.disabled) return
    const r = ref.current!.getBoundingClientRect()
    const x = e.clientX - (r.left + r.width / 2)
    const y = e.clientY - (r.top + r.height / 2)
    ref.current!.style.transform = `translate(${x * strength}px, ${y * strength}px)`
    inner.current!.style.transform = `translate(${x * strength * 0.5}px, ${y * strength * 0.5}px)`
  }
  const reset = () => {
    ref.current!.style.transform = ''
    inner.current!.style.transform = ''
  }

  return (
    <button
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className={`relative inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-display text-sm font-semibold transition-[transform,box-shadow,background-color] duration-300 ease-out active:scale-95 disabled:opacity-50 ${styles[variant]} ${className}`}
      {...rest}
    >
      <span ref={inner} className="inline-flex items-center gap-2 transition-transform duration-300 ease-out">
        {children}
      </span>
    </button>
  )
}
