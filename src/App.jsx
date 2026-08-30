import { useEffect, useRef, useState } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAuth } from './lib/AuthContext'
import Home from './pages/Home'
import Solutions from './pages/Solutions'
import About from './pages/About'
import Contact from './pages/Contact'
import Cards from './pages/Cards'
import Business from './pages/Business'
import Info from './pages/Info'
import Login from './pages/Login'
import VerifyOtp from './pages/VerifyOtp'
import Transactions from './pages/Transactions'
import TransactionDetail from './pages/TransactionDetail'
import NewTransaction from './pages/NewTransaction'
import FrozenOverlay from './components/FrozenOverlay'
import NotificationBell from './components/NotificationBell'
import MapView from './pages/MapView'
import AIDashboard from './pages/AIDashboard'
import Disputes from './pages/Disputes'
import TravelDeclarations from './pages/TravelDeclarations'

gsap.registerPlugin(ScrollTrigger)

const LOGO = '/assets/images/logo-Rawbank-weight-size.png'

const NAV_LINKS = [
  { to: '/solutions', label: 'Solutions' },
  { to: '/a-propos', label: 'À propos' },
  { to: '/contact', label: 'Contact' },
  { to: '/carte', label: 'Carte' },
  { to: '/ia', label: 'IA' },
  { to: '/signalements', label: 'Signalements' },
  { to: '/voyages', label: 'Voyages' },
]

export default function App() {
  const initialized = useRef(false)
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    setMenuOpen(false)
    setTimeout(() => ScrollTrigger.refresh(), 200)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  useEffect(() => {
    const onMode = (e) => setDemoMode(e.detail === 'mock')
    window.addEventListener('rawbank:mode', onMode)
    return () => window.removeEventListener('rawbank:mode', onMode)
  }, [])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // ── CURSOR ──
    const cursor = document.getElementById('cursor')
    const ring = document.getElementById('cursor-ring')
    let mx = -100, my = -100, rx = -100, ry = -100
    const onMove = (e) => { mx = e.clientX; my = e.clientY; cursor.style.left = mx+'px'; cursor.style.top = my+'px' }
    document.addEventListener('mousemove', onMove)

    let ringRaf
    ;(function animRing() {
      rx += (mx - rx) * .13; ry += (my - ry) * .13
      ring.style.left = rx+'px'; ring.style.top = ry+'px'
      ringRaf = requestAnimationFrame(animRing)
    })()

    function attachCursorHovers() {
      document.querySelectorAll('a, button, select, input, textarea').forEach(el => {
        if (el._cursorBound) return
        el._cursorBound = true
        el.addEventListener('mouseenter', () => { cursor.style.transform='translate(-50%,-50%) scale(2.5)'; ring.style.width='54px'; ring.style.height='54px'; ring.style.borderColor='rgba(238,146,33,.7)' })
        el.addEventListener('mouseleave', () => { cursor.style.transform='translate(-50%,-50%) scale(1)'; ring.style.width='38px'; ring.style.height='38px'; ring.style.borderColor='rgba(238,146,33,.45)' })
      })
    }
    attachCursorHovers()
    const observer = new MutationObserver(() => attachCursorHovers())
    observer.observe(document.body, { childList: true, subtree: true })

    // ── NAVBAR SCROLL + PROGRESSION ──
    const onScroll = () => {
      const nb = document.getElementById('navbar')
      if (nb) nb.classList.toggle('scrolled', window.scrollY > 60)
      const bar = document.getElementById('scroll-progress')
      if (bar) {
        const h = document.documentElement.scrollHeight - window.innerHeight
        bar.style.transform = `scaleX(${h > 0 ? window.scrollY / h : 0})`
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // ── LOADER ──
    const tl = gsap.timeline()
    tl.to('#loader-sub', { autoAlpha: 1, y: 0, duration: .5, ease: 'power2.out' })
      .to('#loader-progress', { width: '100%', duration: 1.4, ease: 'power2.inOut' }, '-=.2')
      .to('#loader-left', { x: '-100%', duration: 1.05, ease: 'power2.inOut' }, '+=.15')
      .to('#loader-right', { x: '100%', duration: 1.05, ease: 'power2.inOut' }, '<')
      .to('#loader', { autoAlpha: 0, duration: .3, onComplete: () => {
        document.getElementById('loader').style.display = 'none'
        if (window._startCards) window._startCards()
        gsap.to('#navbar', { y: 0, autoAlpha: 1, duration: .8, ease: 'power3.out', delay: .2 })
        gsap.to('#hero-tag', { autoAlpha: 1, y: 0, duration: .6, delay: .5, ease: 'power2.out' })
        gsap.to('#hero-h1', { autoAlpha: 1, y: 0, duration: .9, delay: .7, ease: 'power3.out' })
        gsap.to('#hero-sub', { autoAlpha: 1, y: 0, duration: .7, delay: .95, ease: 'power2.out' })
        gsap.to('#hero-btns', { autoAlpha: 1, y: 0, duration: .6, delay: 1.1, ease: 'power2.out' })
        gsap.to('#hero-stats', { autoAlpha: 1, y: 0, duration: .6, delay: 1.25, ease: 'power2.out' })
        gsap.to('#gc-1', { autoAlpha: 1, x: 0, duration: .7, delay: 2.2, ease: 'power2.out' })
        gsap.to('#gc-2', { autoAlpha: 1, x: 0, duration: .7, delay: 2.5, ease: 'power2.out' })
        gsap.to('#gc-3', { autoAlpha: 1, x: 0, duration: .7, delay: 2.7, ease: 'power2.out' })
        gsap.to('#scroll-indicator', { autoAlpha: 1, duration: .8, delay: 3.2 })
        gsap.to('#scroll-line', { scaleY: .2, opacity: .2, duration: .9, repeat: -1, yoyo: true, ease: 'sine.inOut' })
      }})

    return () => {
      cancelAnimationFrame(ringRaf)
      document.removeEventListener('mousemove', onMove)
      window.removeEventListener('scroll', onScroll)
      observer.disconnect()
    }
  }, [])

  const isActive = (to) => location.pathname === to || (to !== '/' && location.pathname.startsWith(to + '/'))

  return (
    <>
      {/* CURSOR */}
      <div id="cursor"></div>
      <div id="cursor-ring"></div>

      {/* LOADER */}
      <div id="loader">
        <div id="loader-left"><div><div className="loader-word" style={{color:'#fff'}}>RAW</div></div></div>
        <div id="loader-right"><div>
          <div className="loader-word" style={{color:'var(--blue)'}}>BANK</div>
          <div className="loader-sub" id="loader-sub">La banque sans limites</div>
          <div className="loader-progress-wrap"><div className="loader-progress" id="loader-progress"></div></div>
        </div></div>
      </div>

      {/* NAV */}
      <nav id="navbar">
        <div id="scroll-progress"></div>
        <Link to="/" className="nav-logo">
          <img src={LOGO} alt="Rawbank" className="nav-brand-img" />
        </Link>
        <div className="nav-links">
          {NAV_LINKS.map(l => (
            <Link key={l.to} to={l.to} className={isActive(l.to) ? 'nav-active' : ''}>{l.label}</Link>
          ))}
        </div>
        <div className="nav-cta">
          {isAuthenticated ? (
            <>
              <NotificationBell />
              <Link to="/mes-transactions" className="btn-ghost nav-cta-desktop" style={{textDecoration:'none'}}>Transactions</Link>
              <button className="btn-ghost nav-cta-desktop" onClick={logout}>Déconnexion</button>
            </>
          ) : (
            <>
              <Link to="/connexion" className="btn-ghost nav-cta-desktop" style={{textDecoration:'none'}}>Connexion</Link>
              <Link to="/connexion" className="btn-primary nav-cta-desktop" style={{textDecoration:'none'}}>Ouvrir un compte</Link>
            </>
          )}
          <button
            className={`nav-burger ${menuOpen ? 'open' : ''}`}
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            onClick={() => setMenuOpen(o => !o)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      {/* MENU MOBILE */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-links">
          <Link to="/" style={{'--i': 0}} className={isActive('/') && location.pathname === '/' ? 'nav-active' : ''}>Accueil</Link>
          {NAV_LINKS.map((l, i) => (
            <Link key={l.to} to={l.to} style={{'--i': i + 1}} className={isActive(l.to) ? 'nav-active' : ''}>{l.label}</Link>
          ))}
          {isAuthenticated && (
            <Link to="/mes-transactions" style={{'--i': NAV_LINKS.length + 1}} className={isActive('/mes-transactions') ? 'nav-active' : ''}>Transactions</Link>
          )}
        </div>
        <div className="mobile-menu-cta">
          {isAuthenticated ? (
            <button className="btn-primary" onClick={() => { logout(); setMenuOpen(false) }}>Déconnexion</button>
          ) : (
            <Link to="/connexion" className="btn-primary" style={{textDecoration:'none'}}>Ouvrir un compte</Link>
          )}
        </div>
        <div className="mobile-menu-watermark">RAWBANK</div>
      </div>

      {/* ROUTES */}
      <main>
        <div className="route-fade" key={location.pathname}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/cartes" element={<Cards />} />
            <Route path="/entreprises" element={<Business />} />
            <Route path="/a-propos" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/infos/:slug" element={<Info />} />
            <Route path="/connexion" element={<Login />} />
            <Route path="/verification-otp" element={<VerifyOtp />} />
            <Route path="/mes-transactions" element={<Transactions />} />
            <Route path="/transactions/:id" element={<TransactionDetail />} />
            <Route path="/nouvelle-transaction" element={<NewTransaction />} />
            <Route path="/carte" element={<MapView />} />
            <Route path="/ia" element={<AIDashboard />} />
            <Route path="/signalements" element={<Disputes />} />
            <Route path="/voyages" element={<TravelDeclarations />} />
          </Routes>
        </div>
      </main>

      {/* FOOTER */}
      <footer>
        <div className="inner">
          <div className="footer-grid">
            <div>
              <Link to="/" className="nav-logo" style={{marginBottom:4,textDecoration:'none'}}>
                <img src={LOGO} alt="Rawbank" className="nav-brand-img" />
              </Link>
              <p className="footer-brand-desc">La première banque commerciale de la RDC, engagée dans l'inclusion financière et la croissance économique en Afrique depuis 2002.</p>
              <div className="footer-socials">
                <a className="social-btn" href="https://x.com/rawbanksa" target="_blank" rel="noreferrer" aria-label="X">𝕏</a>
                <a className="social-btn" href="https://www.linkedin.com/company/rawbank" target="_blank" rel="noreferrer" aria-label="LinkedIn">in</a>
                <a className="social-btn" href="https://www.facebook.com/rawbanksa" target="_blank" rel="noreferrer" aria-label="Facebook">f</a>
                <a className="social-btn" href="https://www.youtube.com/@rawbank" target="_blank" rel="noreferrer" aria-label="YouTube">▶</a>
              </div>
            </div>
            <div>
              <div className="footer-col-title">Produits</div>
              <ul className="footer-links">
                <li><Link to="/solutions">Compte personnel</Link></li>
                <li><Link to="/entreprises">Compte entreprise</Link></li>
                <li><Link to="/cartes">Cartes</Link></li>
                <li><Link to="/solutions">Crédits</Link></li>
                <li><Link to="/solutions">Placements</Link></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-title">Entreprise</div>
              <ul className="footer-links">
                <li><Link to="/a-propos">À propos</Link></li>
                <li><Link to="/infos/presse">Presse</Link></li>
                <li><Link to="/infos/carrieres">Carrières</Link></li>
                <li><Link to="/infos/partenaires">Partenaires</Link></li>
                <li><Link to="/infos/investisseurs">Investisseurs</Link></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-title">Support</div>
              <ul className="footer-links">
                <li><Link to="/contact">Centre d'aide</Link></li>
                <li><Link to="/contact">Nous contacter</Link></li>
                <li><Link to="/infos/securite">Sécurité</Link></li>
                <li><Link to="/infos/ussd">USSD *334#</Link></li>
                <li><Link to="/infos/agences">Agences</Link></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-title">Accès</div>
              <ul className="footer-links">
                <li><Link to="/infos/application-mobile">Application mobile</Link></li>
                <li><Link to="/connexion">Banque en ligne</Link></li>
                <li><Link to="/infos/api">Documentation API</Link></li>
                <li><Link to="/carte">Trouver un DAB</Link></li>
                <li><Link to="/infos/actualites">Actualités</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-copy">© 2024 Rawbank S.A. — Enregistrée en République Démocratique du Congo.</div>
            <div className="footer-legal">
              <Link to="/infos/confidentialite">Confidentialité</Link>
              <Link to="/infos/conditions">Conditions</Link>
              <Link to="/infos/cookies">Cookies</Link>
              <Link to="/infos/conformite">Conformité</Link>
            </div>
          </div>
          <div className="footer-watermark">RAWBANK</div>
        </div>
      </footer>

      {demoMode && (
        <div className="demo-pill" title="Backend injoignable — toutes les fonctionnalités sont simulées localement.">
          <span className="demo-pill-dot"></span> Mode démo
        </div>
      )}

      {user?.accountFrozen && <FrozenOverlay />}
    </>
  )
}
