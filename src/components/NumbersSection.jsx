import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const ITEMS = [
  { id: 'ni1', value: '2M', suffix: '+', label: 'Active Customers', suffixOrange: true },
  { id: 'ni2', value: '$8B', suffix: '', label: 'Assets Under Management', suffixOrange: false },
  { id: 'ni3', value: '500', suffix: '+', label: 'Branches & ATMs', suffixOrange: false },
  { id: 'ni4', value: '25', suffix: 'Y', label: 'Years of Excellence', suffixOrange: false },
]

export default function NumbersSection() {
  const rootRef = useRef(null)
  const gridRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    const grid = gridRef.current
    if (!root || !grid) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        grid.querySelectorAll('.num-item'),
        { autoAlpha: 0, y: 40 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.14,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: grid,
            start: 'top 78%',
          },
        }
      )
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <section id="numbers" ref={rootRef} className="numbers-section">
      <div className="numbers-section-glow" aria-hidden />
      <div ref={gridRef} className="numbers-grid">
        {ITEMS.map(({ id, value, suffix, label, suffixOrange }) => (
          <article key={id} id={id} className="num-item liquid-glass-card">
            <div className="num-item-value">
              {value}
              {suffix ? (
                <span className={suffixOrange ? 'num-suffix num-suffix--orange' : 'num-suffix'}>{suffix}</span>
              ) : null}
            </div>
            <p className="num-item-label">{label}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
