import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Link } from 'react-router-dom'

const PME_FEATURES = [
  'Compte professionnel multi-devises',
  'Terminal de paiement électronique',
  'Crédit de trésorerie',
  'Gestion de paie automatisée',
]

const CORPORATE_FEATURES = [
  'Trade Finance & lettres de crédit',
  'Gestion de cash management',
  'Financements structurés',
  'Couverture de change',
]

const STATS = [
  { value: '50K+', label: 'entreprises clientes' },
  { value: '12 Mds$', label: 'de transactions' },
  { value: '180+', label: 'pays couverts' },
  { value: '24/7', label: 'support dédié' },
]

export default function Business() {
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
          <span className="section-tag">Business</span>
          <h1 className="section-h2" style={{fontSize:'clamp(2.2rem,4vw,3.8rem)',marginBottom:20}}>Propulsez votre <em>entreprise.</em></h1>
          <p className="section-sub" style={{margin:'0 auto'}}>Des solutions financières complètes pour les PME, grandes entreprises et institutions. Rawbank accompagne votre croissance.</p>
        </div>
      </section>

      {/* Solutions PME */}
      <section style={{padding:'100px 0',background:'#F7F8FF'}}>
        <div className="section-inner reveal">
          <div className="page-grid-2" style={{gap:60,alignItems:'center'}}>
            <div>
              <span className="section-tag">PME</span>
              <h2 className="section-h2">Solutions <em>PME</em></h2>
              <p className="section-sub" style={{marginBottom:32}}>Des outils financiers conçus pour accompagner la croissance de votre petite ou moyenne entreprise.</p>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {PME_FEATURES.map(f => (
                <div key={f} className="story-feature" style={{opacity:1,transform:'none',margin:0}}>
                  <div className="glass-icon">
                    <svg viewBox="0 0 24 24" stroke="currentColor"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <div>
                    <p className="feature-title">{f}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Corporate & Institutionnel */}
      <section style={{padding:'100px 0',background:'var(--beige)'}}>
        <div className="section-inner reveal">
          <div className="page-grid-2" style={{gap:60,alignItems:'center'}}>
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {CORPORATE_FEATURES.map(f => (
                <div key={f} className="story-feature" style={{opacity:1,transform:'none',margin:0}}>
                  <div className="glass-icon">
                    <svg viewBox="0 0 24 24" stroke="currentColor"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <div>
                    <p className="feature-title">{f}</p>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <span className="section-tag">Corporate</span>
              <h2 className="section-h2">Corporate &amp; <em>Institutionnel</em></h2>
              <p className="section-sub">Des solutions sur mesure pour les grandes entreprises et institutions financières opérant en RDC et à l'international.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Chiffres clés */}
      <section style={{padding:'100px 0',background:'#F7F8FF'}}>
        <div className="section-inner reveal" style={{textAlign:'center'}}>
          <span className="section-tag">Chiffres clés</span>
          <h2 className="section-h2" style={{marginBottom:48}}>La confiance de <em>milliers d'entreprises</em></h2>
          <div className="numbers-row" style={{maxWidth:1100,margin:'0 auto'}}>
            {STATS.map((s, i) => (
              <div key={s.label} className="num-item" style={{opacity:1,transform:'none'}}>
                <div className="num-val">{s.value}</div>
                <div className="num-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{padding:'100px 0',background:'var(--beige)'}}>
        <div className="section-inner reveal" style={{textAlign:'center'}}>
          <h2 className="section-h2">Contactez notre équipe <em>business</em></h2>
          <p className="section-sub" style={{margin:'0 auto 40px'}}>Un conseiller dédié vous accompagne dans toutes vos démarches professionnelles.</p>
          <Link to="/contact" className="btn-primary" style={{display:'inline-block',textDecoration:'none',fontSize:'.85rem',padding:'14px 36px'}}>
            Contactez notre équipe business
          </Link>
        </div>
      </section>
    </>
  )
}
