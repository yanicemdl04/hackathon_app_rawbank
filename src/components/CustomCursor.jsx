import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function CustomCursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const rootRef = useRef(null)
  const mouseRef = useRef({ x: -100, y: -100 })
  const ringPosRef = useRef({ x: -100, y: -100 })
  const rafRef = useRef(null)

  useEffect(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    const root = rootRef.current
    if (!dot || !ring || !root) return

    const mq = window.matchMedia('(max-width: 767px)')
    const applyMobile = () => {
      root.classList.toggle('custom-cursor-root--hidden', mq.matches)
    }
    applyMobile()
    mq.addEventListener('change', applyMobile)

    const setDotL = gsap.quickSetter(dot, 'left', 'px')
    const setDotT = gsap.quickSetter(dot, 'top', 'px')
    const setRingL = gsap.quickSetter(ring, 'left', 'px')
    const setRingT = gsap.quickSetter(ring, 'top', 'px')

    const onMove = (e) => {
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
      setDotL(e.clientX)
      setDotT(e.clientY)
    }

    const loop = () => {
      if (!mq.matches) {
        const m = mouseRef.current
        const r = ringPosRef.current
        r.x += (m.x - r.x) * 0.15
        r.y += (m.y - r.y) * 0.15
        setRingL(r.x)
        setRingT(r.y)
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    const interactive = 'a, button'
    const onEnter = () => {
      gsap.to([dot, ring], {
        scale: 1.65,
        duration: 0.35,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }
    const onLeave = () => {
      gsap.to([dot, ring], {
        scale: 1,
        duration: 0.35,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }

    window.addEventListener('mousemove', onMove)
    document.querySelectorAll(interactive).forEach((el) => {
      el.addEventListener('mouseenter', onEnter)
      el.addEventListener('mouseleave', onLeave)
    })

    return () => {
      mq.removeEventListener('change', applyMobile)
      window.removeEventListener('mousemove', onMove)
      document.querySelectorAll(interactive).forEach((el) => {
        el.removeEventListener('mouseenter', onEnter)
        el.removeEventListener('mouseleave', onLeave)
      })
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      gsap.killTweensOf([dot, ring])
    }
  }, [])

  return (
    <div ref={rootRef} className="custom-cursor-root" aria-hidden="true">
      <div id="cursor" ref={dotRef} className="custom-cursor-dot" />
      <div id="cursor-ring" ref={ringRef} className="custom-cursor-ring" />
    </div>
  )
}
