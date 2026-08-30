import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function IconLightning() {
  return (
    <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="13 2 4 14 12 14 11 22 20 10 12 10 13 2" />
    </svg>
  )
}

function IconSmartphone() {
  return (
    <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <line x1="12" y1="17" x2="12" y2="17.01" />
    </svg>
  )
}

function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <path d="M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
  )
}

function IconCreditCard() {
  return (
    <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <line x1="6" y1="15" x2="10" y2="15" />
    </svg>
  )
}

const FEATURES = [
  { id: 'sf1', Icon: IconLock, title: 'Bank-Grade Security' },
  { id: 'sf2', Icon: IconLightning, title: 'Instant Transfers' },
  { id: 'sf3', Icon: IconSmartphone, title: 'Mobile First' },
  { id: 'sf4', Icon: IconGlobe, title: 'Pan-African Reach' },
]

export default function StorySection() {
  const rootRef = useRef(null)
  const parallaxRef = useRef(null)
  const cardFloatRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const cardEl = cardFloatRef.current
    if (!cardEl) return

    const tick = (t) => {
      const a = t * 0.00085
      const rx = Math.sin(a) * 5
      const ry = Math.cos(a * 0.78) * 4.5
      const ty = Math.sin(a * 1.15) * 6
      cardEl.style.transform = `perspective(1100px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(${ty}px)`
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const ctx = gsap.context(() => {
      gsap.to('.story-feature', {
        opacity: 1,
        x: 0,
        duration: 0.85,
        stagger: 0.14,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '#story',
          start: 'top 72%',
        },
      })

      const parallaxEl = parallaxRef.current
      if (parallaxEl) {
        gsap.fromTo(
          parallaxEl,
          { y: 0 },
          {
            y: -72,
            ease: 'none',
            scrollTrigger: {
              trigger: '#story',
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.2,
            },
          }
        )
      }
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <section id="story" ref={rootRef} className="story-section">
      <div className="story-inner">
        <div className="story-grid">
          <div className="story-col story-col--text">
            <p className="story-tag">Why Rawbank</p>
            <h2 className="story-title">
              Your card is your <em>superpower.</em>
            </h2>
            <p className="story-subtitle">
              A banking experience built for speed, security, and freedom — wherever you are across the continent.
            </p>
            <ul className="story-features">
              {FEATURES.map(({ id, Icon, title }) => (
                <li key={id} id={id} className="story-feature">
                  <div className="glass-icon glass-icon--story" aria-hidden>
                    <Icon />
                  </div>
                  <span className="story-feature-text">{title}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="story-col story-col--sticky">
            <div ref={parallaxRef} className="story-card-parallax">
              <div className="story-card-shadow" aria-hidden />
              <div ref={cardFloatRef} className="story-card-3d">
                <div className="story-premium-card">
                  <div className="story-card-chip" />
                  <div className="story-card-logo">RB</div>
                  <div className="story-card-number">4920 •••• •••• 8841</div>
                  <div className="story-card-row">
                    <div className="story-card-holder">
                      <span className="story-card-holder-label">Titulaire</span>
                      <span className="story-card-holder-name">Jean-Marc Kalumba</span>
                    </div>
                    <div className="story-card-network" aria-hidden>
                      <span className="story-card-network-circle story-card-network-circle--a" />
                      <span className="story-card-network-circle story-card-network-circle--b" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="story-stat-bar">
                <div className="glass-icon glass-icon--stat" aria-hidden>
                  <IconCreditCard />
                </div>
                <div className="story-stat-copy">
                  <span className="story-stat-value">1.2M+</span>
                  <span className="story-stat-label">Cards Issued &amp; Active</span>
                </div>
                <span className="story-stat-badge">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
