import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Link } from 'react-router-dom'

const TIERS = [
  {
    name: 'Visa Classic',
    desc: 'Votre compagnon bancaire du quotidien. Paiements en ligne, retraits DAB, sans contact.',
    price: '5$/mois',
    accent: '#1C3F71',
  },
  {
    name: 'Visa Gold',
    desc: 'Pour ceux qui veulent plus. Plafonds relevés, assurance voyage, accès lounges.',
    price: '15$/mois',
    accent: '#EE9221',
  },
  {
    name: 'Visa Platinum',
    desc: "L'excellence premium. Conciergerie 24/7, assurance complète, cashback 2%.",
    price: '35$/mois',
    accent: '#FFBF00',
  },
]

const ADVANTAGES = [
  {
    label: 'Paiements sans contact',
    icon: (
      <svg viewBox="0 0 24 24" stroke="currentColor"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
    ),
  },
  {
    label: 'Retrait dans +500 DAB',
    icon: (
      <svg viewBox="0 0 24 24" stroke="currentColor"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/><path d="M17 12h.01"/><path d="M7 12h.01"/></svg>
    ),
  },
  {
    label: 'Sécurité 3D Secure',
    icon: (
      <svg viewBox="0 0 24 24" stroke="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    ),
  },
  {
    label: 'Gestion via l\'app mobile',
    icon: (
      <svg viewBox="0 0 24 24" stroke="currentColor"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
    ),
  },
]

export default function Cards() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.registerPlugin(ScrollTrigger)
      document.querySelectorAll('.reveal').forEach(el => {
        gsap.to(el, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 80%' } })
      })
    })
    return () => ctx.revert()
  }, [])

  return (
    <>
      {/* Hero */}
      <section className="page-hero" style={{padding:'160px 40px 80px',position:'relative',overflow:'hidden',background:'#FAFBFF',textAlign:'center'}}>
        <div className="mesh-bg">
          <div className="mesh-orb" style={{width:600,height:600,background:'rgba(238,146,33,.1)',top:'-30%',right:'-15%'}}></div>
          <div className="mesh-orb" style={{width:400,height:400,background:'rgba(28,63,113,.06)',bottom:'-20%',left:'-10%'}}></div>
        </div>
        <div style={{position:'relative',zIndex:1,maxWidth:700,margin:'0 auto'}}>
          <span className="section-tag">Nos Cartes</span>
          <h1 className="section-h2" style={{fontSize:'clamp(2.2rem,4vw,3.8rem)',marginBottom:20}}>La carte qui vous <em>ressemble.</em></h1>
          <p className="section-sub" style={{margin:'0 auto'}}>Visa Classic, Visa Gold ou Visa Platinum — choisissez la carte qui correspond à votre style de vie et profitez d'avantages exclusifs.</p>
        </div>
      </section>

      {/* Card tiers */}
      <section style={{padding:'100px 0',background:'#F7F8FF'}}>
        <div className="section-inner reveal">
          <div className="features-grid">
            {TIERS.map(t => (
              <div key={t.name} className="feat-card" style={{'--accent':t.accent}}>
                <div className="feat-icon" style={{color:t.accent}}>
                  <svg viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                <h3 className="feat-title">{t.name}</h3>
                <p className="feat-desc">{t.desc}</p>
                <div className="feat-stat">
                  <span className="feat-stat-val" style={{color:t.accent}}>{t.price}</span>
                  <span className="feat-stat-lbl">frais mensuels</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section style={{padding:'100px 0',background:'var(--beige)'}}>
        <div className="section-inner reveal" style={{textAlign:'center'}}>
          <span className="section-tag">Avantages</span>
          <h2 className="section-h2" style={{marginBottom:48}}>Pourquoi choisir <em>nos cartes ?</em></h2>
          <div className="numbers-row" style={{maxWidth:1100,margin:'0 auto'}}>
            {ADVANTAGES.map(a => (
              <div key={a.label} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
                <div className="glass-icon">{a.icon}</div>
                <span style={{fontSize:'.88rem',fontWeight:600,color:'var(--blue)'}}>{a.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{padding:'100px 0',background:'#F7F8FF'}}>
        <div className="section-inner reveal" style={{textAlign:'center'}}>
          <h2 className="section-h2">Commandez votre <em>carte</em></h2>
          <p className="section-sub" style={{margin:'0 auto 40px'}}>Faites votre demande en ligne et recevez votre carte en agence sous 48h.</p>
          <Link to="/contact" className="btn-primary" style={{display:'inline-block',textDecoration:'none',fontSize:'.85rem',padding:'14px 36px'}}>
            Commandez votre carte
          </Link>
        </div>
      </section>
    </>
  )
}
