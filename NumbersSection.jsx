import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const numbers = [
  { val: '2M', suffix: '+', label: 'Active Customers', accent: '#EE9221' },
  { val: '$8B', suffix: '', label: 'Assets Under Management', accent: '#1C3F71' },
  { val: '500', suffix: '+', label: 'Branches & ATMs', accent: '#FFBF00' },
  { val: '25', suffix: 'Y', label: 'Years of Excellence', accent: '#4A6A99' },
]

export default function NumbersSection() {
  const rowRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        rowRef.current.children,
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: rowRef.current,
            start: 'top 80%',
          },
        }
      )
    })
    return () => ctx.revert()
  }, [])

  return (
    <section
      style={{
        padding: '80px 0',
        background: '#FFF1E0',
        borderTop: '1px solid rgba(238,146,33,.2)',
        borderBottom: '1px solid rgba(238,146,33,.15)',
      }}
    >
      <div
        ref={rowRef}
        className="max-w-5xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-8 items-center"
      >
        {numbers.map(({ val, suffix, label, accent }, i) => (
          <div key={label} className="text-center" style={{ opacity: 0 }}>
            <div
              className="font-display font-black leading-none mb-2"
              style={{
                fontSize: 'clamp(2.2rem, 3.5vw, 3rem)',
                color: '#1C3F71',
                letterSpacing: '-0.03em',
              }}
            >
              {val}
              <span style={{ color: accent }}>{suffix}</span>
            </div>
            <div
              className="text-xs uppercase tracking-[0.1em]"
              style={{ color: '#4A6A99' }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
