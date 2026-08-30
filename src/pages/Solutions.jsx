import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Link } from 'react-router-dom'

export default function Solutions() {
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
          <span className="section-tag">Nos Solutions</span>
          <h1 className="section-h2" style={{fontSize:'clamp(2.2rem,4vw,3.8rem)',marginBottom:20}}>Des solutions bancaires <em>sur mesure.</em></h1>
          <p className="section-sub" style={{margin:'0 auto'}}>Que vous soyez particulier, professionnel ou grande entreprise, Rawbank vous propose des solutions adaptées à chaque étape de votre vie.</p>
        </div>
      </section>

      {/* Solutions Grid */}
      <section style={{padding:'100px 0',background:'#F7F8FF'}}>
        <div className="section-inner reveal">
          <div className="features-grid cols-2">

            <div className="feat-card" style={{'--accent':'#EE9221'}}>
              <div className="feat-icon" style={{color:'var(--orange)'}}>
                <svg viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
                </svg>
              </div>
              <h3 className="feat-title">Comptes Courants</h3>
              <p className="feat-desc">Gérez votre argent au quotidien avec des comptes flexibles et accessibles. Frais transparents, accès mobile 24h/24.</p>
            </div>

            <div className="feat-card" style={{'--accent':'#388E3C'}}>
              <div className="feat-icon" style={{color:'var(--green)'}}>
                <svg viewBox="0 0 24 24" stroke="currentColor">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
              </div>
              <h3 className="feat-title">Épargne &amp; Placements</h3>
              <p className="feat-desc">Faites fructifier votre argent avec des taux attractifs. Épargne classique, à terme ou investissement, à vous de choisir.</p>
            </div>

            <div className="feat-card" style={{'--accent':'#1C3F71'}}>
              <div className="feat-icon" style={{color:'var(--blue)'}}>
                <svg viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <h3 className="feat-title">Crédits &amp; Financements</h3>
              <p className="feat-desc">Prêts personnels, immobiliers et professionnels adaptés à vos projets. Processus rapide et taux compétitifs.</p>
            </div>

            <div className="feat-card" style={{'--accent':'#EE9221'}}>
              <div className="feat-icon" style={{color:'var(--orange)'}}>
                <svg viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
              </div>
              <h3 className="feat-title">Services Digitaux</h3>
              <p className="feat-desc">Banque en ligne, application mobile, paiements sans contact, USSD *334#. La banque dans votre poche.</p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{padding:'100px 0',background:'var(--beige)'}}>
        <div className="section-inner reveal" style={{textAlign:'center'}}>
          <h2 className="section-h2">Prêt à <em>commencer ?</em></h2>
          <p className="section-sub" style={{margin:'0 auto 40px'}}>Ouvrez votre compte en quelques minutes et profitez de tous nos services.</p>
          <Link to="/contact" className="btn-primary" style={{display:'inline-block',textDecoration:'none',fontSize:'.85rem',padding:'14px 36px'}}>
            Nous contacter
          </Link>
        </div>
      </section>
    </>
  )
}
