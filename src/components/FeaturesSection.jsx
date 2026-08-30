import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './RawbankSections.css'

gsap.registerPlugin(ScrollTrigger)

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  stroke: 'currentColor',
  'aria-hidden': true,
}

function IconShield() {
  return (
    <svg {...svgProps}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function IconGlobe() {
  return (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function IconTrendingUp() {
  return (
    <svg {...svgProps}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}

function IconBriefcase() {
  return (
    <svg {...svgProps}>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  )
}

function IconLightbulb() {
  return (
    <svg {...svgProps}>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4 4 0 0 0 15 4a4 4 0 0 0-7.66 1" />
      <path d="M9 18a3 3 0 0 1-1-3V9a3 3 0 0 1 6 0v6a3 3 0 0 1-1 3" />
    </svg>
  )
}

function IconRefresh() {
  return (
    <svg {...svgProps}>
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
}

const FEATURES = [
  {
    icon: IconShield,
    iconClass: 'feat-icon--shield',
    title: 'Zero-Fraud Guarantee',
    description:
      'Real-time monitoring layers and adaptive models to protect every transaction you make.',
    stat: '99.8% Detection Rate',
  },
  {
    icon: IconGlobe,
    iconClass: 'feat-icon--globe',
    title: 'Global Transfers',
    description:
      'Send and receive funds worldwide with transparent pricing and clear tracking at every step.',
    stat: '180+ Countries',
  },
  {
    icon: IconTrendingUp,
    iconClass: 'feat-icon--trend',
    title: 'Smart Savings',
    description:
      'Intelligent savings plans that adapt to your goals and comfort with market exposure.',
    stat: '8.5% Annual Yield',
  },
  {
    icon: IconBriefcase,
    iconClass: 'feat-icon--briefcase',
    title: 'Business Suite',
    description:
      'Business accounts, team cards, and treasury tools to run your operations day to day.',
    stat: '50K+ Businesses',
  },
  {
    icon: IconLightbulb,
    iconClass: 'feat-icon--bulb',
    title: 'AI Financial Advisor',
    description:
      'Personalized guidance, budget alerts, and insights whenever you need a clear next step.',
    stat: '24/7 Availability',
  },
  {
    icon: IconRefresh,
    iconClass: 'feat-icon--refresh',
    title: 'Instant Payroll',
    description:
      'Accelerated salary runs with near-instant confirmation so your teams get paid on time.',
    stat: '3s Transfer Time',
  },
]

export default function FeaturesSection() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const cards = [...section.querySelectorAll('.feat-card')]
    const cleanups = []

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { autoAlpha: 0, y: 48, rotateX: -12 },
        {
          autoAlpha: 1,
          y: 0,
          rotateX: 0,
          duration: 0.85,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            once: true,
          },
        }
      )

      cards.forEach((card) => {
        gsap.set(card, { transformPerspective: 1000, transformStyle: 'preserve-3d' })

        const onMove = (e) => {
          const rect = card.getBoundingClientRect()
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top
          const cx = rect.width / 2
          const cy = rect.height / 2
          const rotateX = ((y - cy) / cy) * -10
          const rotateY = ((x - cx) / cx) * 10
          card.style.setProperty('--mx', `${(x / rect.width) * 100}%`)
          card.style.setProperty('--my', `${(y / rect.height) * 100}%`)
          gsap.to(card, {
            rotateX,
            rotateY,
            duration: 0.45,
            ease: 'power2.out',
            overwrite: 'auto',
          })
        }

        const onLeave = () => {
          card.style.removeProperty('--mx')
          card.style.removeProperty('--my')
          gsap.to(card, {
            rotateX: 0,
            rotateY: 0,
            duration: 0.65,
            ease: 'power2.out',
            overwrite: 'auto',
          })
        }

        card.addEventListener('mousemove', onMove)
        card.addEventListener('mouseleave', onLeave)
        cleanups.push(() => {
          card.removeEventListener('mousemove', onMove)
          card.removeEventListener('mouseleave', onLeave)
        })
      })
    }, section)

    return () => {
      cleanups.forEach((fn) => fn())
      ctx.revert()
    }
  }, [])

  return (
    <section id="features" ref={sectionRef} className="features-section" aria-labelledby="features-heading">
      <div className="features-inner">
        <p className="features-tag">Premium Features</p>
        <h2 id="features-heading" className="features-title">
          Everything you need, <em>nothing you don&apos;t.</em>
        </h2>

        <div className="features-grid">
          {FEATURES.map(({ icon: Icon, iconClass, title, description, stat }) => (
            <article key={title} className="feat-card">
              <div className={`feat-icon ${iconClass}`}>
                <Icon />
              </div>
              <h3 className="feat-card-title">{title}</h3>
              <p className="feat-card-desc">{description}</p>
              <p className="feat-card-stat">{stat}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
