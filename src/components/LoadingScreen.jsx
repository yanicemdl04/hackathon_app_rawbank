import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function LoadingScreen({ onComplete }) {
  const rootRef = useRef(null)
  const leftRef = useRef(null)
  const rightRef = useRef(null)
  const subRef = useRef(null)
  const progressRef = useRef(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useLayoutEffect(() => {
    const loader = rootRef.current
    const left = leftRef.current
    const right = rightRef.current
    const sub = subRef.current
    const bar = progressRef.current
    if (!loader || !left || !right || !sub || !bar) return

    gsap.set(sub, { autoAlpha: 0 })
    gsap.set(bar, { scaleX: 0, transformOrigin: 'left center' })
    gsap.set(left, { xPercent: 0 })
    gsap.set(right, { xPercent: 0 })

    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: () => {
        onCompleteRef.current?.()
      },
    })

    tl.to(sub, { autoAlpha: 1, duration: 0.55, ease: 'power2.out' })
      .to(bar, { scaleX: 1, duration: 1.35, ease: 'power2.inOut' }, '+=0.15')
      .to(left, { xPercent: -100, duration: 0.85, ease: 'power3.inOut' }, '+=0.2')
      .to(right, { xPercent: 100, duration: 0.85, ease: 'power3.inOut' }, '<')
      .to(loader, { autoAlpha: 0, duration: 0.45, ease: 'power2.inOut' }, '+=0.05')

    return () => {
      tl.kill()
    }
  }, [])

  return (
    <div id="loader" ref={rootRef} className="loading-screen">
      <div id="loader-left" ref={leftRef} className="loading-screen__panel loading-screen__panel--left">
        <span className="loader-word">RAW</span>
      </div>
      <div id="loader-right" ref={rightRef} className="loading-screen__panel loading-screen__panel--right">
        <span className="loader-word">BANK</span>
      </div>
      <p id="loader-sub" ref={subRef} className="loader-sub">
        Banking Beyond Limits
      </p>
      <div className="loader-progress-wrap">
        <div id="loader-progress" ref={progressRef} className="loader-progress" />
      </div>
    </div>
  )
}
