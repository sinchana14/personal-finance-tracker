import { useEffect, useRef } from 'react'

/**
 * Custom cursor: a precise dot plus a lagging ring that grows over interactive
 * elements, a fading particle trail, and a click ripple. It also feeds --mx/--my
 * to the page so the ambient light follows the pointer. Only on fine pointers.
 */
export function CursorFX() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const root = document.documentElement

    let mx = innerWidth / 2
    let my = innerHeight / 2
    const onMoveVars = (e: PointerEvent) => {
      root.style.setProperty('--mx', `${e.clientX}px`)
      root.style.setProperty('--my', `${e.clientY}px`)
    }
    window.addEventListener('pointermove', onMoveVars, { passive: true })
    if (!fine) return () => window.removeEventListener('pointermove', onMoveVars)

    root.classList.add('fx-cursor')
    let rx = mx
    let ry = my
    let hover = false
    let down = false
    let visible = false
    const particles: { x: number; y: number; life: number; vx: number; vy: number; hue: number }[] = []
    const ripples: { x: number; y: number; t: number }[] = []

    const c = canvas.current!
    const ctx = c.getContext('2d')!
    const resize = () => {
      const dpr = Math.min(devicePixelRatio, 2)
      c.width = innerWidth * dpr
      c.height = innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const dx = e.clientX - mx
      const dy = e.clientY - my
      mx = e.clientX
      my = e.clientY
      if (!visible) {
        visible = true
        rx = mx
        ry = my
        dot.current!.style.opacity = ring.current!.style.opacity = '1'
      }
      const t = e.target as Element | null
      hover = !!t?.closest('a, button, [role="button"], input, select, textarea, label, [data-cursor="hover"]')
      if (!reduced && Math.hypot(dx, dy) > 2 && particles.length < 120) {
        particles.push({ x: mx, y: my, life: 1, vx: dx * 0.04 + (Math.random() - 0.5) * 0.6, vy: dy * 0.04 + (Math.random() - 0.5) * 0.6, hue: 250 + Math.random() * 110 })
      }
    }
    const onDown = () => {
      down = true
      if (!reduced) ripples.push({ x: mx, y: my, t: 0 })
    }
    const onUp = () => (down = false)
    const onLeave = () => {
      visible = false
      dot.current!.style.opacity = ring.current!.style.opacity = '0'
    }

    let raf = 0
    const loop = () => {
      rx += (mx - rx) * 0.18
      ry += (my - ry) * 0.18
      const scale = (hover ? 1.9 : 1) * (down ? 0.75 : 1)
      dot.current!.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%) scale(${hover ? 0.4 : 1})`
      ring.current!.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${scale})`
      ring.current!.dataset.hover = String(hover)

      ctx.clearRect(0, 0, innerWidth, innerHeight)
      ctx.globalCompositeOperation = 'lighter'
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.life -= 0.035
        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }
        ctx.beginPath()
        ctx.fillStyle = `hsla(${p.hue}, 90%, 70%, ${p.life * 0.55})`
        ctx.arc(p.x, p.y, 2.4 * p.life + 0.4, 0, Math.PI * 2)
        ctx.fill()
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i]
        r.t += 0.04
        if (r.t >= 1) {
          ripples.splice(i, 1)
          continue
        }
        ctx.beginPath()
        ctx.strokeStyle = `rgba(167, 139, 250, ${(1 - r.t) * 0.7})`
        ctx.lineWidth = 2
        ctx.arc(r.x, r.y, 8 + r.t * 46, 0, Math.PI * 2)
        ctx.stroke()
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    document.addEventListener('pointerleave', onLeave)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      root.classList.remove('fx-cursor')
      window.removeEventListener('pointermove', onMoveVars)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <>
      <canvas ref={canvas} className="pointer-events-none fixed inset-0 z-[9998] h-full w-full max-[767px]:hidden" aria-hidden />
      <div
        ref={ring}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-9 w-9 rounded-full border border-violet/70 opacity-0 mix-blend-screen transition-[opacity,background-color,border-color] duration-200 data-[hover=true]:border-mint/80 data-[hover=true]:bg-mint/10"
      />
      <div ref={dot} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[9999] h-2 w-2 rounded-full bg-white opacity-0 shadow-[0_0_12px_2px_rgba(167,139,250,0.9)]" />
    </>
  )
}
