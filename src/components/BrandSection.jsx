import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './RawbankSections.css'

gsap.registerPlugin(ScrollTrigger)

const PARTNERS = [
  'Visa',
  'Mastercard',
  'SWIFT',
  'mPesa',
  'Orange Money',
  'Western Union',
  'MoneyGram',
]

export default function BrandSection() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      const pills = section.querySelectorAll('.brand-pill')
      gsap.fromTo(
        pills,
        { scale: 0.6, autoAlpha: 0 },
        {
          scale: 1,
          autoAlpha: 1,
          duration: 0.85,
          stagger: 0.18,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            once: true,
          },
        }
      )
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section id="brand" ref={sectionRef} className="brand-section" aria-labelledby="brand-heading">
      <div className="brand-inner">
        <p className="brand-tag">The Rawbank Brand</p>
        <h2 id="brand-heading" className="brand-title">
          25 years of trust. <em>One clear mission.</em>
        </h2>

        <div className="brand-pills-row">
          <div className="brand-pill">
            <div className="brand-pill-logo" aria-hidden="true">
              RB
            </div>
            <div className="brand-pill-body">
              <p className="brand-pill-name">Rawbank Retail</p>
              <p className="brand-pill-meta">Everyday banking built for individuals and families.</p>
            </div>
          </div>

          <span className="brand-pill-sep" aria-hidden="true">
            +
          </span>

          <div className="brand-pill">
            <div className="brand-pill-logo" aria-hidden="true">
              RB
            </div>
            <div className="brand-pill-body">
              <p className="brand-pill-name">Rawbank Corporate</p>
              <p className="brand-pill-meta">Corporate banking and treasury for growing teams.</p>
            </div>
          </div>
        </div>

        <p className="brand-partners-label">Network and partners</p>
        <div className="brand-partners" role="list">
          {PARTNERS.map((name) => (
            <span key={name} className="brand-partner-chip" role="listitem">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
