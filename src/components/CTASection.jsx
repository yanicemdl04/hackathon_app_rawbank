import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './RawbankSections.css'

gsap.registerPlugin(ScrollTrigger)

const lockSvg = {
  viewBox: '0 0 24 24',
  fill: 'none',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  stroke: 'currentColor',
  'aria-hidden': true,
}

function IconLock() {
  return (
    <svg {...lockSvg}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg {...lockSvg}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function IconGlobeTrust() {
  return (
    <svg {...lockSvg}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

export default function CTASection() {
  const sectionRef = useRef(null)
  const primaryBtnRef = useRef(null)
  const outlineBtnRef = useRef(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const primary = primaryBtnRef.current
    const outline = outlineBtnRef.current
    const removeListeners = []

    const ctx = gsap.context(() => {
      const box = section.querySelector('.cta-box')
      if (box) {
        gsap.fromTo(
          box,
          { autoAlpha: 0, y: 44, scale: 0.96 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 72%',
              once: true,
            },
          }
        )
      }

      if (primary) {
        const onEnter = () => {
          gsap.to(primary, {
            boxShadow:
              '0 0 28px rgba(238, 146, 33, 0.45), 0 0 48px rgba(238, 146, 33, 0.2)',
            duration: 0.35,
            ease: 'power2.out',
          })
        }
        const onLeave = () => {
          gsap.to(primary, {
            boxShadow: '0 0 0 rgba(238, 146, 33, 0)',
            duration: 0.4,
            ease: 'power2.inOut',
          })
        }
        primary.addEventListener('mouseenter', onEnter)
        primary.addEventListener('mouseleave', onLeave)
        removeListeners.push(() => {
          primary.removeEventListener('mouseenter', onEnter)
          primary.removeEventListener('mouseleave', onLeave)
        })
      }

      if (outline) {
        const onEnter = () => {
          gsap.to(outline, {
            boxShadow:
              '0 0 24px rgba(238, 146, 33, 0.25), inset 0 0 20px rgba(238, 146, 33, 0.06)',
            duration: 0.35,
            ease: 'power2.out',
          })
        }
        const onLeave = () => {
          gsap.to(outline, {
            boxShadow: '0 0 0 rgba(238, 146, 33, 0)',
            duration: 0.4,
            ease: 'power2.inOut',
          })
        }
        outline.addEventListener('mouseenter', onEnter)
        outline.addEventListener('mouseleave', onLeave)
        removeListeners.push(() => {
          outline.removeEventListener('mouseenter', onEnter)
          outline.removeEventListener('mouseleave', onLeave)
        })
      }
    }, section)

    return () => {
      removeListeners.forEach((fn) => fn())
      ctx.revert()
    }
  }, [])

  return (
    <section id="cta" ref={sectionRef} className="cta-section" aria-labelledby="cta-heading">
      <div className="cta-inner">
        <div className="cta-box">
          <p className="cta-tag">
            <span className="cta-tag-dot" aria-hidden="true" />
            Open in 3 Minutes
          </p>
          <h2 id="cta-heading" className="cta-title">
            Start your journey with <span>Rawbank</span> today.
          </h2>
          <p className="cta-sub">
            Open your account online in minutes. Prefer a human touch? Our advisors are ready when you
            are.
          </p>
          <div className="cta-actions">
            <a ref={primaryBtnRef} href="#open-account" className="cta-btn-primary">
              Open Free Account
            </a>
            <a ref={outlineBtnRef} href="#advisor" className="cta-btn-outline">
              Talk to an Advisor
            </a>
          </div>
          <div className="cta-trust">
            <div className="cta-trust-item cta-trust-item--lock">
              <IconLock />
              <span>End-to-end encryption</span>
            </div>
            <div className="cta-trust-item">
              <IconCheck />
              <span>Regulatory compliance</span>
            </div>
            <div className="cta-trust-item cta-trust-item--globe">
              <IconGlobeTrust />
              <span>Global footprint</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
