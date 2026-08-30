import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

gsap.registerPlugin(ScrollTrigger)

export default function Home() {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // ── PARTICLES ──
    const pCanvas = document.getElementById('particles-canvas')
    const pCtx = pCanvas.getContext('2d')
    let particles = []

    function resizeParticles() {
      pCanvas.width = pCanvas.offsetWidth
      pCanvas.height = pCanvas.offsetHeight
    }
    function createParticles() {
      particles = []
      const count = Math.floor(pCanvas.width / 20)
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * pCanvas.width,
          y: Math.random() * pCanvas.height,
          r: Math.random() * 2.5 + 1,
          dx: (Math.random() - .5) * .4,
          dy: (Math.random() - .5) * .4,
          color: i % 3 === 0 ? '#EE9221' : i % 3 === 1 ? '#1C3F71' : '#FFBF00',
          alpha: Math.random() * .3 + .08,
        })
      }
    }
    let partRaf
    function animParticles() {
      pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height)
      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy
        if (p.x < 0) p.x = pCanvas.width
        if (p.x > pCanvas.width) p.x = 0
        if (p.y < 0) p.y = pCanvas.height
        if (p.y > pCanvas.height) p.y = 0
        pCtx.beginPath()
        pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        pCtx.fillStyle = p.color
        pCtx.globalAlpha = p.alpha
        pCtx.fill()
      })
      pCtx.globalAlpha = 1
      partRaf = requestAnimationFrame(animParticles)
    }
    window.addEventListener('resize', () => { resizeParticles(); createParticles() })
    resizeParticles(); createParticles(); animParticles()

    // ── THREE.JS — PREMIUM RENDERING ──
    const canvas = document.getElementById('hero-canvas')
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    renderer.outputColorSpace = THREE.SRGBColorSpace

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
    camera.position.set(0, 0.4, 10)

    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5)
    keyLight.position.set(5, 8, 6)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.set(2048, 2048)
    keyLight.shadow.bias = -0.0001
    scene.add(keyLight)
    const fillLight = new THREE.DirectionalLight(0xfff5e6, 0.8)
    fillLight.position.set(-5, 3, 4)
    scene.add(fillLight)
    const rimOrange = new THREE.PointLight(0xEE9221, 2.5, 25)
    rimOrange.position.set(-6, 3, 4); scene.add(rimOrange)
    const rimBlue = new THREE.PointLight(0x4A6A99, 1.5, 25)
    rimBlue.position.set(6, -1, 3); scene.add(rimBlue)
    const bottomGold = new THREE.PointLight(0xFFBF00, 0.6, 20)
    bottomGold.position.set(0, -4, 5); scene.add(bottomGold)

    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    const envScene = new THREE.Scene()
    envScene.background = new THREE.Color(0xf8f6f0)
    const envLight1 = new THREE.DirectionalLight(0xffffff, 1)
    envLight1.position.set(1, 1, 1)
    envScene.add(envLight1)
    envScene.add(new THREE.AmbientLight(0xfff5e6, 0.5))
    const envMap = pmremGenerator.fromScene(envScene, 0.04).texture
    scene.environment = envMap
    pmremGenerator.dispose()

    function makeCard(color, roughness = 0.12) {
      const g = new THREE.BoxGeometry(3.4, 2.15, 0.08, 1, 1, 1)
      const m = new THREE.MeshPhysicalMaterial({
        color, metalness: 0.65, roughness,
        clearcoat: 1, clearcoatRoughness: 0.05,
        reflectivity: 1, envMapIntensity: 1.2,
      })
      const mesh = new THREE.Mesh(g, m)
      mesh.castShadow = true
      return mesh
    }

    let card1 = makeCard(0xEE9221, 0.1)
    let card2 = makeCard(0x1C3F71, 0.15)
    let card3 = makeCard(0x4A6A99, 0.13)

    card1.position.set(0, 15, 0)
    card1.rotation.set(0, 0, 0)
    card2.position.set(-4, 15, -0.5)
    card3.position.set(4, 15, -0.5)
    card2.rotation.set(0.06, -0.22, -0.06)
    card3.rotation.set(0.06, 0.22, 0.06)
    scene.add(card1, card2, card3)

    const gltfLoader = new GLTFLoader()
    const maxAniso = renderer.capabilities.getMaxAnisotropy()
    function prepareModel(model, targetSize) {
      model.traverse(ch => {
        if (ch.isMesh) {
          ch.castShadow = true; ch.receiveShadow = true
          if (ch.material) {
            ch.material.envMap = envMap
            ch.material.envMapIntensity = 1.3
            ch.material.needsUpdate = true
            if (ch.material.map) { ch.material.map.anisotropy = maxAniso; ch.material.map.needsUpdate = true }
            if (ch.material.normalMap) { ch.material.normalMap.anisotropy = maxAniso }
            if (ch.material.roughnessMap) { ch.material.roughnessMap.anisotropy = maxAniso }
            if (ch.material.metalnessMap) { ch.material.metalnessMap.anisotropy = maxAniso }
          }
        }
      })
      model.rotation.set(0, 0, 0)
      model.updateMatrixWorld(true)
      const box = new THREE.Box3().setFromObject(model)
      const sz = box.getSize(new THREE.Vector3())
      const s = targetSize / (Math.max(sz.x, sz.y, sz.z) || 1)
      model.scale.setScalar(s)
      const c2 = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3())
      model.position.sub(c2)
      const w = new THREE.Group(); w.add(model)
      return w
    }
    function swapCard(oldCard, newCard) {
      newCard.position.copy(oldCard.position)
      newCard.rotation.copy(oldCard.rotation)
      scene.remove(oldCard); scene.add(newCard)
      return newCard
    }
    gltfLoader.load('/assets/card1.glb', (g) => {
      const m = prepareModel(g.scene, 4.5)
      m.position.copy(card1.position)
      m.rotation.set(0, 0, 0)
      scene.remove(card1); scene.add(m); card1 = m
    }, undefined, () => {})
    gltfLoader.load('/assets/card2.glb', (g) => { card2 = swapCard(card2, prepareModel(g.scene, 3.8)) }, undefined, () => {})
    gltfLoader.load('/assets/card3.glb', (g) => { card3 = swapCard(card3, prepareModel(g.scene, 3.8)) }, undefined, () => {})

    const partCount = 100
    const partGeo = new THREE.BufferGeometry()
    const positions = new Float32Array(partCount * 3)
    for (let i = 0; i < partCount; i++) {
      positions[i*3] = (Math.random()-.5)*16
      positions[i*3+1] = (Math.random()-.5)*11
      positions[i*3+2] = (Math.random()-.5)*7
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const pts = new THREE.Points(partGeo, new THREE.PointsMaterial({ size: .06, color: 0xEE9221, transparent: true, opacity: .35 }))
    scene.add(pts)

    function resizeThree() {
      const w = canvas.parentElement.offsetWidth
      const h = canvas.parentElement.offsetHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    resizeThree()
    window.addEventListener('resize', resizeThree)

    let targetX = 0, targetY = 0
    document.addEventListener('mousemove', e => {
      targetX = (e.clientX / window.innerWidth - .5) * 2
      targetY = -(e.clientY / window.innerHeight - .5) * 2
    })

    function startCardAnim() {
      gsap.to(card1.position, { x: 0, y: 0.15, z: 0, duration: 1.6, ease: 'power3.out', delay: .15 })
      gsap.to(card1.rotation, { x: 0, y: 0, z: 0, duration: 1.6, ease: 'power3.out', delay: .15 })
      gsap.to(card2.position, { x: -3.5, y: -0.15, z: -0.5, duration: 1.7, ease: 'power3.out', delay: .5 })
      gsap.to(card3.position, { x: 3.5, y: -0.15, z: -0.5, duration: 1.7, ease: 'power3.out', delay: .7 })
    }

    const clock = new THREE.Clock()
    let currentX = 0, currentY = 0
    let threeRaf
    function animateThree() {
      threeRaf = requestAnimationFrame(animateThree)
      const t = clock.getElapsedTime()
      currentX += (targetX - currentX) * .035
      currentY += (targetY - currentY) * .035
      if (card1.position.y < 10) {
        card1.position.y += (Math.sin(t * .6) * .2 + .15 - card1.position.y) * .025
        card2.position.y += (Math.sin(t * .5 + 1) * .15 - .15 - card2.position.y) * .025
        card3.position.y += (Math.sin(t * .7 + 2) * .15 - .15 - card3.position.y) * .025
      }
      card1.rotation.y = Math.sin(t * .52) * .38 + currentX * .04
      card1.rotation.x = Math.sin(t * .35) * .08 + currentY * .02
      card2.rotation.y = Math.sin(t * .42 + 2.1) * .32 + currentX * .06 - .15
      card2.rotation.x = Math.sin(t * .3 + 1) * .07 + currentY * .03 + .04
      card3.rotation.y = Math.sin(t * .46 + 4.2) * .32 + currentX * .06 + .15
      card3.rotation.x = Math.sin(t * .33 + 3) * .07 + currentY * .03 + .04
      pts.rotation.y = t * .018
      pts.rotation.x = t * .008
      rimOrange.position.x = -6 + Math.sin(t * .4) * 1.5
      rimBlue.position.x = 6 + Math.cos(t * .35) * 1.5
      renderer.render(scene, camera)
    }
    animateThree()

    // Expose for the loader in App.jsx to call after its animation completes
    window._startCards = startCardAnim

    // If loader already finished (user navigated back), place cards at final position instantly
    const loaderEl = document.getElementById('loader')
    const loaderGone = !loaderEl || loaderEl.style.display === 'none' || loaderEl.style.visibility === 'hidden' || getComputedStyle(loaderEl).opacity === '0'
    if (loaderGone) {
      card1.position.set(0, 0.15, 0)
      card1.rotation.set(0, 0, 0)
      card2.position.set(-3.5, -0.15, -0.5)
      card3.position.set(3.5, -0.15, -0.5)

      gsap.set('#hero-tag', { autoAlpha: 1, y: 0 })
      gsap.set('#hero-h1', { autoAlpha: 1, y: 0 })
      gsap.set('#hero-sub', { autoAlpha: 1, y: 0 })
      gsap.set('#hero-btns', { autoAlpha: 1, y: 0 })
      gsap.set('#hero-stats', { autoAlpha: 1, y: 0 })
      gsap.set('#gc-1', { autoAlpha: 1, x: 0 })
      gsap.set('#gc-2', { autoAlpha: 1, x: 0 })
      gsap.set('#gc-3', { autoAlpha: 1, x: 0 })
      gsap.set('#scroll-indicator', { autoAlpha: 1 })
      gsap.to('#scroll-line', { scaleY: .2, opacity: .2, duration: .9, repeat: -1, yoyo: true, ease: 'sine.inOut' })
    }

    // ── SCROLL REVEALS ──
    document.querySelectorAll('.reveal').forEach(el => {
      gsap.to(el, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 80%', toggleActions: 'play none none reverse' } })
    })

    ;['sf1','sf2','sf3','sf4'].forEach((id, i) => {
      gsap.to(`#${id}`, { opacity: 1, x: 0, duration: .7, ease: 'power2.out', delay: i * .1, scrollTrigger: { trigger: `#${id}`, start: 'top 85%', toggleActions: 'play none none reverse' } })
    })

    gsap.to('#story-card', { y: 50, ease: 'none', scrollTrigger: { trigger: '#story', start: 'top bottom', end: 'bottom top', scrub: 1.8 } })

    ;['ni1','ni2','ni3','ni4'].forEach((id, i) => {
      gsap.to(`#${id}`, { opacity: 1, y: 0, duration: .7, delay: i * .12, ease: 'power2.out', scrollTrigger: { trigger: '#numbers', start: 'top 80%' } })
    })

    gsap.fromTo('#imgmask1', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.2, ease: 'power2.inOut', scrollTrigger: { trigger: '#imgcard1', start: 'top 75%' }, onComplete: () => { gsap.to('#ibadge1', { opacity: 1, y: 0, duration: .5, ease: 'back.out(1.4)' }) } })
    gsap.fromTo('#imgcard1 img', { scale: 1.15 }, { scale: 1, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: '#imgcard1', start: 'top 75%' } })
    gsap.fromTo('#imgmask2', { clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0%)', duration: 1.2, delay: .2, ease: 'power2.inOut', scrollTrigger: { trigger: '#imgcard2', start: 'top 75%' }, onComplete: () => { gsap.to('#ibadge2', { opacity: 1, y: 0, duration: .5, ease: 'back.out(1.4)' }) } })
    gsap.fromTo('#imgcard2 img', { scale: 1.15 }, { scale: 1, duration: 1.6, delay: .2, ease: 'power2.out', scrollTrigger: { trigger: '#imgcard2', start: 'top 75%' } })
    gsap.to('#imgcard1 img', { y: 50, ease: 'none', scrollTrigger: { trigger: '#imgcard1', start: 'top bottom', end: 'bottom top', scrub: 1 } })
    gsap.to('#imgcard2 img', { y: -40, ease: 'none', scrollTrigger: { trigger: '#imgcard2', start: 'top bottom', end: 'bottom top', scrub: 1 } })

    gsap.to('#feat-grid .feat-card', { opacity: 1, y: 0, duration: .7, stagger: .09, ease: 'power2.out', scrollTrigger: { trigger: '#feat-grid', start: 'top 75%' } })

    gsap.to('#lp1', { opacity: 1, scale: 1, duration: .8, ease: 'back.out(1.5)', scrollTrigger: { trigger: '#brand', start: 'top 75%' } })
    gsap.to('#lp2', { opacity: 1, scale: 1, duration: .8, delay: .18, ease: 'back.out(1.5)', scrollTrigger: { trigger: '#brand', start: 'top 75%' } })

    gsap.to('#cta-box', { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '#cta-box', start: 'top 78%' } })

    const ctaBtn = document.querySelector('.cta-btn-primary')
    if (ctaBtn) {
      ctaBtn.addEventListener('mouseenter', function() { this.style.boxShadow = '0 0 50px rgba(238,146,33,.7), 0 10px 30px rgba(238,146,33,.4)' })
      ctaBtn.addEventListener('mouseleave', function() { this.style.boxShadow = '0 4px 24px rgba(238,146,33,.4)' })
    }

    const onScrollBlobs = () => {
      const y = window.scrollY
      const blobs = document.querySelectorAll('.mesh-orb')
      if (blobs[0]) blobs[0].style.transform = `translateY(${y * .15}px)`
      if (blobs[1]) blobs[1].style.transform = `translateY(${-y * .1}px)`
    }
    window.addEventListener('scroll', onScrollBlobs, { passive: true })

    const storyCard = document.querySelector('.premium-card')
    let cardRaf
    if (storyCard) {
      let angle = 0
      ;(function floatCard() {
        angle += .015
        storyCard.style.transform = `rotateX(${Math.sin(angle * .7) * 3}deg) rotateY(${Math.cos(angle) * 5}deg) translateY(${Math.sin(angle) * 6}px)`
        cardRaf = requestAnimationFrame(floatCard)
      })()
    }

    document.querySelectorAll('.feat-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width - .5
        const y = (e.clientY - rect.top) / rect.height - .5
        card.style.transform = `translateY(-6px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`
        card.style.transition = 'box-shadow .3s, border-color .3s'
      })
      card.addEventListener('mouseleave', () => {
        card.style.transform = ''
        card.style.transition = 'transform .4s cubic-bezier(.4,0,.2,1), box-shadow .3s, border-color .3s'
      })
    })

    document.querySelectorAll('.logo-pill').forEach(p => {
      p.addEventListener('mouseenter', () => { p.style.transform = 'scale(1.04)'; p.style.background = 'rgba(255,255,255,.13)' })
      p.addEventListener('mouseleave', () => { p.style.transform = ''; p.style.background = '' })
    })

    return () => {
      initialized.current = false
      cancelAnimationFrame(partRaf)
      cancelAnimationFrame(threeRaf)
      cancelAnimationFrame(cardRaf)
      window.removeEventListener('scroll', onScrollBlobs)
      renderer.dispose()
    }
  }, [])

  return (
    <>
      {/* HERO */}
      <section id="hero-section" style={{position:'relative',overflow:'hidden',background:'#FAFBFF'}}>
        <div className="mesh-bg">
          <div className="mesh-orb" style={{width:700,height:700,background:'rgba(238,146,33,.12)',top:'-20%',right:'-10%'}}></div>
          <div className="mesh-orb" style={{width:500,height:500,background:'rgba(28,63,113,.08)',bottom:'-15%',left:'-10%'}}></div>
        </div>
        <canvas id="particles-canvas"></canvas>

        <div id="hero">
          <div id="hero-canvas-wrap">
            <div className="hero-glow"></div>
            <canvas id="hero-canvas"></canvas>
            <div className="hero-glass-card glass-card-success" id="gc-1" style={{bottom:40,right:20,minWidth:180}}>
              <div className="glass-card-label">Solde du portefeuille</div>
              <div className="glass-card-value">$24,850.00</div>
              <div className="glass-card-sub">▲ +2,4% ce mois</div>
            </div>
            <div className="hero-glass-card" id="gc-2" style={{top:40,left:0,minWidth:200,borderColor:'rgba(56,142,60,.3)'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:28,height:28,borderRadius:'50%',background:'rgba(56,142,60,.12)',backdropFilter:'blur(8px)',border:'1px solid rgba(56,142,60,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.75rem',color:'var(--green)'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <div className="glass-card-label" style={{color:'var(--green)',fontSize:'.6rem'}}>Transfert effectué</div>
                  <div style={{fontSize:'.75rem',color:'var(--blue-2)',marginTop:2}}>$1,200 → Sarah M.</div>
                </div>
              </div>
            </div>
            <div className="hero-glass-card" id="gc-3" style={{top:'50%',transform:'translateY(-50%)',left:-10,borderColor:'rgba(255,191,0,.3)'}}>
              <div className="glass-card-label">Objectif d'épargne</div>
              <div style={{marginTop:6,width:120,height:4,background:'rgba(224,224,224,.6)',borderRadius:2}}>
                <div style={{height:'100%',width:'72%',background:'var(--gold)',borderRadius:2}}></div>
              </div>
              <div style={{fontSize:'.65rem',color:'var(--blue-2)',marginTop:5}}>72% · $3,600 / $5,000</div>
            </div>
          </div>

          <div className="hero-content">
            <div className="hero-tag" id="hero-tag">
              <span className="hero-tag-dot"></span>
              L'Avenir de la Banque
            </div>
            <h1 className="hero-h1" id="hero-h1">
              La banque <em>au-delà</em> de toutes les limites.
            </h1>
            <p className="hero-sub" id="hero-sub">
              Découvrez la puissance d'outils financiers modernes conçus pour les particuliers
              et les entreprises à travers l'Afrique. Sécurisé, fluide, toujours avec vous.
            </p>
            <div className="hero-btns" id="hero-btns">
              <Link to="/connexion" className="btn-primary" style={{fontSize:'.85rem',padding:'13px 28px',textDecoration:'none'}}>Ouvrir un compte gratuit</Link>
              <Link to="/nouvelle-transaction" className="btn-outline" style={{textDecoration:'none'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--orange)" stroke="none"><polygon points="5,3 19,12 5,21"/></svg> Voir la démo
              </Link>
            </div>
            <div className="hero-stats" id="hero-stats">
              <div><div className="stat-val">2M+</div><div className="stat-lbl">Clients</div></div>
              <div style={{width:1,height:40,background:'rgba(224,224,224,.8)',alignSelf:'center'}}></div>
              <div><div className="stat-val">$8B</div><div className="stat-lbl">Actifs</div></div>
              <div style={{width:1,height:40,background:'rgba(224,224,224,.8)',alignSelf:'center'}}></div>
              <div><div className="stat-val">25A</div><div className="stat-lbl">Confiance</div></div>
            </div>
          </div>
        </div>

        <div id="scroll-indicator" style={{position:'absolute',bottom:32,left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:8,opacity:0}}>
          <span style={{fontFamily:"'SF Mono','Segoe UI Mono','Roboto Mono',monospace",fontSize:'.55rem',letterSpacing:'.2em',textTransform:'uppercase',color:'var(--blue-2)'}}>Défiler</span>
          <div id="scroll-line" style={{width:1,height:40,background:'rgba(238,146,33,.4)'}}></div>
        </div>
      </section>

      {/* STORY */}
      <section id="story">
        <div className="section-inner">
          <div className="story-text">
            <div className="reveal">
              <span className="section-tag">Pourquoi Rawbank</span>
              <h2 className="section-h2">Votre carte est votre<br/><em>super-pouvoir.</em></h2>
              <p className="section-sub">
                La carte Rawbank ne se contente pas de stocker votre argent — elle ouvre des portes,
                crée des opportunités et vous connecte à tout ce qui compte.
              </p>
            </div>
            <div className="story-feature" id="sf1">
              <div className="glass-icon"><svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
              <div><div className="feature-title">Sécurité bancaire</div><div className="feature-desc">Un chiffrement de niveau militaire protège chaque transaction, à chaque instant.</div></div>
            </div>
            <div className="story-feature" id="sf2">
              <div className="glass-icon"><svg viewBox="0 0 24 24"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
              <div><div className="feature-title">Transferts instantanés</div><div className="feature-desc">Envoyez de l'argent à travers le Congo et dans le monde entier en quelques secondes, pas en jours — 24h/24.</div></div>
            </div>
            <div className="story-feature" id="sf3">
              <div className="glass-icon"><svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg></div>
              <div><div className="feature-title">Mobile d'abord</div><div className="feature-desc">Toute la puissance bancaire dans votre poche. iOS et Android, toujours à jour.</div></div>
            </div>
            <div className="story-feature" id="sf4">
              <div className="glass-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></div>
              <div><div className="feature-title">Portée panafricaine</div><div className="feature-desc">Plus de 500 agences et distributeurs à travers la République Démocratique du Congo.</div></div>
            </div>
          </div>

          <div className="story-card-wrap reveal" id="story-card">
            <div className="premium-card">
              <div className="card-bg"></div><div className="card-shine"></div><div className="card-noise"></div>
              <div className="card-chip"></div>
              <div className="card-logo"><img src="/assets/images/logo-Rawbank-min-size.jpeg" alt="Rawbank" style={{width:'100%',height:'100%',objectFit:'contain'}} /></div>
              <div className="card-number">•••• •••• •••• 4821</div>
              <div className="card-holder">Jean-Marc Kalumba</div>
              <div className="card-expiry">12/28</div>
              <div className="card-network"><div className="card-circle"></div><div className="card-circle"></div></div>
            </div>
            <div className="card-shadow"></div>
            <div className="card-stat">
              <div className="card-stat-icon"><svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div>
              <div><div className="card-stat-val">1.2M+</div><div className="card-stat-lbl">Cartes émises et actives</div></div>
              <div style={{marginLeft:'auto'}}><div style={{fontSize:'.65rem',fontWeight:600,padding:'4px 10px',borderRadius:99,background:'rgba(56,142,60,.12)',color:'var(--green)'}}>Actif</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* NUMBERS */}
      <section id="numbers">
        <div className="numbers-row">
          <div className="num-item" id="ni1"><div className="num-val">2<span>M+</span></div><div className="num-lbl">Clients actifs</div></div>
          <div className="num-divider"></div>
          <div className="num-item" id="ni2"><div className="num-val"><span>$</span>8B</div><div className="num-lbl">Actifs sous gestion</div></div>
          <div className="num-divider"></div>
          <div className="num-item" id="ni3"><div className="num-val">500<span>+</span></div><div className="num-lbl">Agences et DAB</div></div>
          <div className="num-divider"></div>
          <div className="num-item" id="ni4"><div className="num-val">25<span>A</span></div><div className="num-lbl">Années d'excellence</div></div>
        </div>
      </section>

      {/* IMAGE SHOWCASE */}
      <section id="showcase">
        <div className="inner">
          <div className="showcase-header reveal">
            <span className="section-tag">Conçu pour l'humain</span>
            <h2 className="section-h2">Des vraies personnes.<br/><em>De vraies ambitions.</em></h2>
            <p className="section-sub" style={{margin:'0 auto'}}>
              Des épargnants individuels aux clients entreprises — Rawbank alimente les
              rêves financiers de millions de personnes à travers la RDC.
            </p>
          </div>
          <div className="showcase-grid">
            <div className="img-card" style={{aspectRatio:'4/5'}} id="imgcard1">
              <div className="img-mask" id="imgmask1">
                <img src="/assets/images/man-leftside-in-yellow.jpg" alt="Banque des particuliers"
                  onError={(e) => { e.target.style.display='none'; e.target.parentNode.parentNode.style.background='linear-gradient(135deg,#EE9221,#C07318)' }} />
              </div>
              <div className="img-overlay"><div className="img-title">Banque des particuliers</div><div className="img-sub">Des comptes personnels pour l'excellence au quotidien</div></div>
              <div className="img-badge" style={{top:24,right:24,opacity:0}} id="ibadge1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--gold)" stroke="none" style={{marginBottom:4}}><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
                <div className="img-badge-val">4.9/5</div><div className="img-badge-lbl">Note de l'app</div>
              </div>
            </div>
            <div className="img-card img2-offset" style={{aspectRatio:'4/5'}} id="imgcard2">
              <div className="img-mask" id="imgmask2">
                <img src="/assets/images/two-best-leftside-in-yellow.jpg" alt="Banque des entreprises"
                  onError={(e) => { e.target.style.display='none'; e.target.parentNode.parentNode.style.background='linear-gradient(135deg,#1C3F71,#4A6A99)' }} />
              </div>
              <div className="img-overlay" style={{background:'linear-gradient(to top,rgba(238,146,33,.7),transparent)'}}><div className="img-title">Banque des entreprises</div><div className="img-sub">Des solutions qui évoluent avec vous</div></div>
              <div className="img-badge" style={{bottom:100,left:24,opacity:0}} id="ibadge2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom:4}}><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/><path d="M9 18h6"/></svg>
                <div className="img-badge-val">50K+</div><div className="img-badge-lbl">Clients entreprises</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features">
        <div className="inner">
          <div className="features-header reveal">
            <span className="section-tag">Fonctionnalités premium</span>
            <h2 className="section-h2">Tout ce qu'il vous faut,<br/><em>rien de superflu.</em></h2>
            <p className="section-sub" style={{margin:'0 auto'}}>Une suite complète d'outils financiers conçue pour le monde moderne — puissante, intuitive et en constante amélioration.</p>
          </div>
          <div className="features-grid" id="feat-grid">
            <div className="feat-card" style={{'--accent':'#EE9221'}}>
              <div className="feat-icon"><svg viewBox="0 0 24 24" stroke="var(--orange)"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
              <div className="feat-title">Garantie zéro fraude</div>
              <div className="feat-desc">Détection de fraude alimentée par l'IA surveillant chaque transaction 24h/24 avec alertes instantanées et blocage automatique.</div>
              <div className="feat-stat"><span className="feat-stat-val" style={{color:'var(--orange)'}}>99.8%</span><span className="feat-stat-lbl">Taux de détection</span></div>
            </div>
            <div className="feat-card" style={{'--accent':'#1C3F71'}}>
              <div className="feat-icon"><svg viewBox="0 0 24 24" stroke="var(--blue)"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></div>
              <div className="feat-title">Transferts internationaux</div>
              <div className="feat-desc">Envoyez de l'argent à l'international avec des taux de change compétitifs. SWIFT, SEPA et mobile money couverts.</div>
              <div className="feat-stat"><span className="feat-stat-val" style={{color:'var(--blue)'}}>180+</span><span className="feat-stat-lbl">Pays</span></div>
            </div>
            <div className="feat-card" style={{'--accent':'#FFBF00'}}>
              <div className="feat-icon"><svg viewBox="0 0 24 24" stroke="var(--gold)"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></div>
              <div className="feat-title">Épargne intelligente</div>
              <div className="feat-desc">Plans d'épargne automatisés avec des comptes à haut rendement. Regardez votre argent fructifier intelligemment.</div>
              <div className="feat-stat"><span className="feat-stat-val" style={{color:'var(--gold)'}}>8.5%</span><span className="feat-stat-lbl">Rendement annuel</span></div>
            </div>
            <div className="feat-card" style={{'--accent':'#4A6A99'}}>
              <div className="feat-icon"><svg viewBox="0 0 24 24" stroke="var(--blue-2)"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg></div>
              <div className="feat-title">Suite entreprise</div>
              <div className="feat-desc">Outils complets pour PME et grandes entreprises : paie, facturation, accès multi-utilisateurs et API complète.</div>
              <div className="feat-stat"><span className="feat-stat-val" style={{color:'var(--blue-2)'}}>50K+</span><span className="feat-stat-lbl">Entreprises</span></div>
            </div>
            <div className="feat-card" style={{'--accent':'#388E3C'}}>
              <div className="feat-icon"><svg viewBox="0 0 24 24" stroke="var(--green)"><path d="M12 2a4 4 0 0 1 4 4c0 2-2 3-2 5h-4c0-2-2-3-2-5a4 4 0 0 1 4-4z"/><line x1="10" y1="14" x2="14" y2="14"/><line x1="10" y1="17" x2="14" y2="17"/><path d="M10 20h4"/></svg></div>
              <div className="feat-title">Conseiller financier IA</div>
              <div className="feat-desc">Des analyses personnalisées par l'apprentissage automatique — votre coach financier 24h/24, toujours en apprentissage.</div>
              <div className="feat-stat"><span className="feat-stat-val" style={{color:'var(--green)'}}>24/7</span><span className="feat-stat-lbl">Disponibilité</span></div>
            </div>
            <div className="feat-card" style={{'--accent':'#C07318'}}>
              <div className="feat-icon"><svg viewBox="0 0 24 24" stroke="var(--orange-dark)"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg></div>
              <div className="feat-title">Paie instantanée</div>
              <div className="feat-desc">Versement automatique des salaires en quelques secondes. Transferts en masse avec traçabilité complète.</div>
              <div className="feat-stat"><span className="feat-stat-val" style={{color:'var(--orange-dark)'}}>3s</span><span className="feat-stat-lbl">Temps de transfert</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* BRAND */}
      <section id="brand">
        <div className="inner">
          <div className="brand-header reveal">
            <span className="section-tag">La marque Rawbank</span>
            <h2 className="section-h2" style={{color:'#fff'}}>25 ans de confiance.<br/><span style={{color:'var(--orange)'}}>Une mission claire.</span></h2>
            <p className="section-sub" style={{color:'rgba(255,255,255,.6)'}}>
              Rawbank est le pilier financier de la RDC depuis 2002 —
              moteur de la croissance économique et de l'autonomisation des communautés à travers le pays.
            </p>
          </div>
          <div className="logos-row">
            <div className="logo-pill" id="lp1">
              <div className="logo-square"><img src="/assets/images/logo-Rawbank-min-size.jpeg" alt="Rawbank" style={{width:'100%',height:'100%',objectFit:'contain'}} /></div>
              <div><div className="logo-info-main">Rawbank</div><div className="logo-info-sub">Identité compacte</div></div>
            </div>
            <div className="brand-plus">+</div>
            <div className="logo-pill" id="lp2">
              <div className="logo-square"><img src="/assets/images/logo-Rawbank-min-size.jpeg" alt="Rawbank" style={{width:'100%',height:'100%',objectFit:'contain'}} /></div>
              <div><div className="logo-info-main">Marque visuelle</div><div className="logo-info-sub">Système d'identité complet</div></div>
            </div>
          </div>
          <div style={{textAlign:'center',marginBottom:24}}>
            <span style={{fontFamily:"'SF Mono','Segoe UI Mono','Roboto Mono',monospace",fontSize:'.6rem',letterSpacing:'.22em',textTransform:'uppercase',color:'rgba(255,255,255,.3)'}}>Partenaires de confiance</span>
          </div>
          <div className="partners">
            {['Visa','Mastercard','SWIFT','mPesa','Orange Money','Western Union','MoneyGram'].map(n => (
              <div className="partner-pill" key={n}>{n}</div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta">
        <div className="inner">
          <div className="cta-box" id="cta-box">
            <div className="cta-tag">
              <span style={{width:6,height:6,borderRadius:'50%',background:'var(--orange)',animation:'pulse 1.5s infinite',display:'inline-block'}}></span>
              Ouverture en 3 minutes
            </div>
            <h2 className="cta-h2">Commencez votre aventure<br/>avec <span>Rawbank</span> dès aujourd'hui.</h2>
            <p className="cta-sub">
              Rejoignez plus de 2 millions de Congolais qui font confiance à Rawbank pour leur avenir financier.
              Pas de paperasse, pas de files d'attente, pas de limites.
            </p>
            <div className="cta-btns">
              <Link to="/connexion" className="cta-btn-primary" style={{textDecoration:'none',display:'inline-block'}}>Ouvrir un compte gratuit →</Link>
              <Link to="/contact" className="cta-btn-outline" style={{textDecoration:'none',display:'inline-block'}}>Parler à un conseiller</Link>
            </div>
            <div className="cta-trust">
              <div className="trust-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Sécurisé</div>
              <div className="trust-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Régulé BCC</div>
              <div className="trust-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Licence RDC</div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
