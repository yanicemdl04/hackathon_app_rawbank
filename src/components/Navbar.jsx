import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

const LINKS = [
  { href: '#solutions', label: 'Solutions' },
  { href: '#cards', label: 'Cards' },
  { href: '#business', label: 'Business' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
]

export default function Navbar({ visible }) {
  const navRef = useRef(null)
  const [logoFailed, setLogoFailed] = useState(false)

  useLayoutEffect(() => {
    const el = navRef.current
    if (!el) return
    if (!visible) {
      gsap.set(el, { y: -32, autoAlpha: 0 })
      return
    }
    gsap.fromTo(
      el,
      { y: -32, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.65, ease: 'power2.out' }
    )
  }, [visible])

  useEffect(() => {
    const el = navRef.current
    if (!el) return

    const onScroll = () => {
      el.classList.toggle('scrolled', window.scrollY > 60)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header id="navbar" ref={navRef} className="navbar">
      <a href="/" className="nav-logo">
        {!logoFailed ? (
          <img
            className="nav-brand-img"
            src="/assets/images/logo-Rawbank-weight-size.png"
            alt="Rawbank"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <>
            <span className="nav-logo-fallback-dot" aria-hidden="true" />
            <span className="nav-logo-fallback-text">Rawbank</span>
          </>
        )}
      </a>

      <nav className="nav-links" aria-label="Principal">
        {LINKS.map(({ href, label }) => (
          <a key={href} href={href}>
            {label}
          </a>
        ))}
      </nav>

      <div className="nav-cta">
        <a href="#sign-in" className="btn-ghost">
          Sign In
        </a>
        <a href="#open-account" className="btn-primary">
          Open Account
        </a>
      </div>
    </header>
  )
}
