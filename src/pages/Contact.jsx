import { useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { toast } from 'sonner'

const inputStyle = {
  background: 'rgba(255,255,255,.4)',
  border: '1px solid rgba(224,224,224,.5)',
  borderRadius: 12,
  padding: '12px 16px',
  width: '100%',
  fontFamily: "var(--font-body)",
  fontSize: '.85rem',
  color: 'var(--blue)',
  outline: 'none',
}

const INFO_ITEMS = [
  {
    label: 'Siège social',
    value: '3487, Boulevard du 30 Juin, Kinshasa, RDC',
    icon: (
      <svg viewBox="0 0 24 24" stroke="currentColor"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
    ),
  },
  {
    label: 'Téléphone',
    value: '+243 99 60 60 060',
    icon: (
      <svg viewBox="0 0 24 24" stroke="currentColor"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
    ),
  },
  {
    label: 'Email',
    value: 'info@rawbank.com',
    icon: (
      <svg viewBox="0 0 24 24" stroke="currentColor"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
    ),
  },
  {
    label: 'Horaires',
    value: 'Lun-Ven 8h00-16h00',
    icon: (
      <svg viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    ),
  },
]

export default function Contact() {
  const [sending, setSending] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const formEl = e.target
    const name = formEl.querySelector('input[type="text"]')?.value?.trim()
    setSending(true)
    setTimeout(() => {
      setSending(false)
      formEl.reset()
      toast.success(
        name ? `Merci ${name}, votre message a bien été envoyé !` : 'Votre message a bien été envoyé !',
        { description: 'Un conseiller Rawbank vous répondra sous 24h ouvrées.' }
      )
    }, 900)
  }

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
          <span className="section-tag">Contact</span>
          <h1 className="section-h2" style={{fontSize:'clamp(2.2rem,4vw,3.8rem)',marginBottom:20}}>Parlons de votre <em>avenir financier.</em></h1>
          <p className="section-sub" style={{margin:'0 auto'}}>Notre équipe est à votre disposition pour répondre à toutes vos questions.</p>
        </div>
      </section>

      {/* Contact Form + Info */}
      <section style={{padding:'100px 0',background:'#F7F8FF'}}>
        <div className="section-inner reveal">
          <div className="page-grid-2" style={{gap:48}}>

            {/* Form */}
            <div style={{
              background:'rgba(255,255,255,.5)',
              backdropFilter:'blur(20px)',
              WebkitBackdropFilter:'blur(20px)',
              border:'1px solid rgba(255,255,255,.6)',
              borderRadius:24,
              padding:40,
              boxShadow:'inset 0 1px 0 rgba(255,255,255,.8), 0 8px 40px rgba(0,0,0,.06)',
            }}>
              <h2 className="section-h2" style={{fontSize:'1.4rem',marginBottom:28}}>Envoyez-nous un <em>message</em></h2>
              <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:16}}>
                <input
                  type="text"
                  placeholder="Nom complet"
                  className="contact-input"
                  style={inputStyle}
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="contact-input"
                  style={inputStyle}
                />
                <input
                  type="tel"
                  placeholder="Téléphone"
                  className="contact-input"
                  style={inputStyle}
                />
                <select
                  className="contact-input"
                  style={{...inputStyle, appearance:'none'}}
                  defaultValue=""
                >
                  <option value="" disabled>Sujet</option>
                  <option value="particulier">Particulier</option>
                  <option value="entreprise">Entreprise</option>
                  <option value="carte">Carte</option>
                  <option value="autre">Autre</option>
                </select>
                <textarea
                  placeholder="Votre message..."
                  rows={5}
                  className="contact-input"
                  style={{...inputStyle, resize:'vertical'}}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={sending}
                  style={{alignSelf:'flex-start',fontSize:'.85rem',padding:'14px 36px',border:'none',cursor:'pointer',opacity:sending?.7:1}}
                >
                  {sending ? 'Envoi en cours...' : 'Envoyer le message'}
                </button>
              </form>
            </div>

            {/* Info */}
            <div style={{display:'flex',flexDirection:'column',gap:24,paddingTop:8}}>
              <h2 className="section-h2" style={{fontSize:'1.4rem',marginBottom:4}}>Nos <em>coordonnées</em></h2>
              {INFO_ITEMS.map(item => (
                <div key={item.label} className="story-feature" style={{opacity:1,transform:'none',margin:0}}>
                  <div className="glass-icon">{item.icon}</div>
                  <div>
                    <p className="feature-title" style={{marginBottom:2}}>{item.label}</p>
                    <p className="feature-desc">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>
    </>
  )
}
