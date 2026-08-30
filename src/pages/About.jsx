import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Link } from 'react-router-dom'

const MILESTONES = [
  { year: '2002', text: 'Création de Rawbank à Kinshasa' },
  { year: '2005', text: 'Lancement des services Visa' },
  { year: '2010', text: '100e agence ouverte' },
  { year: '2015', text: 'Première banque digitale du Congo' },
  { year: '2020', text: '1 million de clients atteint' },
  { year: '2024', text: '2 millions de clients, leader incontesté' },
]

const NUMBERS = [
  { value: '2M+', label: 'Clients' },
  { value: '$8B', label: 'Actifs' },
  { value: '500+', label: 'Agences' },
  { value: '25', label: 'Ans' },
]

export default function About() {
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
          <span className="section-tag">À Propos</span>
          <h1 className="section-h2" style={{fontSize:'clamp(2.2rem,4vw,3.8rem)',marginBottom:20}}>25 ans au service <em>du Congo.</em></h1>
          <p className="section-sub" style={{margin:'0 auto'}}>Depuis 2002, Rawbank est la première banque commerciale de la République Démocratique du Congo, engagée dans l'inclusion financière et la croissance économique.</p>
        </div>
      </section>

      {/* Notre Histoire */}
      <section style={{padding:'100px 0',background:'#F7F8FF'}}>
        <div className="section-inner reveal" style={{maxWidth:800}}>
          <span className="section-tag">Timeline</span>
          <h2 className="section-h2" style={{marginBottom:48}}>Notre <em>Histoire</em></h2>

          <div style={{display:'flex',flexDirection:'column',gap:0,position:'relative',paddingLeft:40}}>
            <div style={{position:'absolute',left:25,top:0,bottom:0,width:2,background:'rgba(238,146,33,.18)',borderRadius:1}} />
            {MILESTONES.map((m, i) => (
              <div key={m.year} className="story-feature" style={{opacity:1,transform:'none',margin:0,padding:'20px 0',position:'relative'}}>
                <div className="glass-icon" style={{position:'absolute',left:-40,width:52,height:52,zIndex:1}}>
                  <span style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:'.78rem',color:'var(--orange)'}}>{m.year}</span>
                </div>
                <div style={{paddingLeft:32}}>
                  <p className="feature-title" style={{marginBottom:0}}>{m.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Notre Mission */}
      <section style={{padding:'100px 0',background:'var(--beige)'}}>
        <div className="section-inner reveal" style={{textAlign:'center',maxWidth:800}}>
          <span className="section-tag">Mission</span>
          <h2 className="section-h2" style={{marginBottom:24}}>Notre <em>Mission</em></h2>
          <p className="section-sub" style={{margin:'0 auto',fontSize:'1.05rem',lineHeight:1.8,maxWidth:640}}>
            Rendre les services financiers accessibles à tous les Congolais, favoriser l'entrepreneuriat et contribuer au développement économique durable de la RDC.
          </p>
        </div>
      </section>

      {/* Chiffres */}
      <section style={{padding:'100px 0',background:'#F7F8FF'}}>
        <div className="section-inner reveal" style={{textAlign:'center'}}>
          <span className="section-tag">En chiffres</span>
          <h2 className="section-h2" style={{marginBottom:48}}>Rawbank <em>aujourd'hui</em></h2>
          <div className="numbers-row" style={{maxWidth:1100,margin:'0 auto'}}>
            {NUMBERS.map(n => (
              <div key={n.label} className="num-item" style={{opacity:1,transform:'none'}}>
                <div className="num-val">{n.value}</div>
                <div className="num-lbl">{n.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{padding:'100px 0',background:'var(--beige)'}}>
        <div className="section-inner reveal" style={{textAlign:'center'}}>
          <h2 className="section-h2">Envie d'en savoir <em>plus ?</em></h2>
          <p className="section-sub" style={{margin:'0 auto 40px'}}>Contactez-nous pour découvrir comment Rawbank peut vous accompagner.</p>
          <Link to="/contact" className="btn-primary" style={{display:'inline-block',textDecoration:'none',fontSize:'.85rem',padding:'14px 36px'}}>
            Nous contacter
          </Link>
        </div>
      </section>
    </>
  )
}
