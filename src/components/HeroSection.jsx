import { useEffect, useRef, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const COLORS = {
  orange: 0xee9221,
  blue: 0x4a6a99,
  blue2: 0x3d5a80,
}

function prepareModel(root, targetSize) {
  const group = new THREE.Group()
  group.add(root)
  const box = new THREE.Box3().setFromObject(group)
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z) || 1
  const s = targetSize / maxDim
  group.scale.setScalar(s)
  box.setFromObject(group)
  const center = box.getCenter(new THREE.Vector3())
  group.position.sub(center)
  return group
}

function swapCard(parentGroup, fallbackMesh, preparedGroup) {
  preparedGroup.position.copy(fallbackMesh.position)
  preparedGroup.rotation.copy(fallbackMesh.rotation)
  parentGroup.remove(fallbackMesh)
  if (fallbackMesh.geometry) fallbackMesh.geometry.dispose()
  if (fallbackMesh.material) fallbackMesh.material.dispose()
  parentGroup.add(preparedGroup)
}

function createFallbackCard(colorHex) {
  const geo = new THREE.BoxGeometry(3.2, 2.02, 0.08)
  const mat = new THREE.MeshPhysicalMaterial({
    color: colorHex,
    metalness: 0.6,
    roughness: 0.25,
    clearcoat: 1,
    clearcoatRoughness: 0.15,
  })
  return new THREE.Mesh(geo, mat)
}

export default function HeroSection({ visible }) {
  const heroCanvasRef = useRef(null)
  const particlesCanvasRef = useRef(null)
  const threeCleanupRef = useRef(null)
  const particlesRafRef = useRef(null)
  const textInitialized = useRef(false)

  useLayoutEffect(() => {
    if (textInitialized.current) return
    textInitialized.current = true
    gsap.set(['#hero-tag', '#hero-h1', '#hero-sub', '#hero-btns', '#hero-stats'], {
      autoAlpha: 0,
      y: 28,
    })
    gsap.set('#scroll-indicator', { autoAlpha: 0 })
  }, [])

  useEffect(() => {
    if (!visible) return
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
    tl.to('#hero-tag', { autoAlpha: 1, y: 0, duration: 0.65 }, 0.5)
      .to('#hero-h1', { autoAlpha: 1, y: 0, duration: 0.75 }, 0.7)
      .to('#hero-sub', { autoAlpha: 1, y: 0, duration: 0.7 }, 0.95)
      .to('#hero-btns', { autoAlpha: 1, y: 0, duration: 0.65 }, 1.1)
      .to('#hero-stats', { autoAlpha: 1, y: 0, duration: 0.65 }, 1.25)
      .to('#scroll-indicator', { autoAlpha: 1, duration: 0.55 }, 2.5)
    return () => tl.kill()
  }, [visible])

  useEffect(() => {
    const canvas = particlesCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0

    const palette = ['#EE9221', '#4A6A99', '#FFBF00']
    const count = 55
    const particles = []

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      w = Math.max(1, rect.width)
      h = Math.max(1, rect.height)
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        color: palette[Math.floor(Math.random() * palette.length)],
        r: 1 + Math.random() * 2,
        a: 0.08 + Math.random() * 0.12,
      })
    }

    const tick = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x += w
        if (p.x > w) p.x -= w
        if (p.y < 0) p.y += h
        if (p.y > h) p.y -= h
        ctx.beginPath()
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.a
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      particlesRafRef.current = requestAnimationFrame(tick)
    }
    particlesRafRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('resize', resize)
      if (particlesRafRef.current) cancelAnimationFrame(particlesRafRef.current)
    }
  }, [])

  useEffect(() => {
    const canvas = heroCanvasRef.current
    if (!canvas) return

    const wrap = document.getElementById('hero-canvas-wrap')
    if (!wrap) return

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    if ('outputColorSpace' in renderer) {
      renderer.outputColorSpace = THREE.SRGBColorSpace
    }

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
    camera.position.set(0, 0.5, 11)

    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambient)
    const dir = new THREE.DirectionalLight(0xffffff, 2.5)
    dir.position.set(5, 8, 6)
    scene.add(dir)
    const plOrange = new THREE.PointLight(0xee9221, 3, 25)
    plOrange.position.set(-6, 3, 4)
    scene.add(plOrange)
    const plBlue = new THREE.PointLight(0x4a6a99, 1.8, 25)
    plBlue.position.set(6, -1, 3)
    scene.add(plBlue)
    const plGold = new THREE.PointLight(0xffbf00, 0.8, 20)
    plGold.position.set(0, -4, 5)
    scene.add(plGold)

    const basePlOrange = plOrange.position.clone()
    const basePlBlue = plBlue.position.clone()
    const basePlGold = plGold.position.clone()

    const card1Group = new THREE.Group()
    const card2Group = new THREE.Group()
    const card3Group = new THREE.Group()
    scene.add(card1Group, card2Group, card3Group)

    const fb1 = createFallbackCard(COLORS.orange)
    const fb2 = createFallbackCard(COLORS.blue)
    const fb3 = createFallbackCard(COLORS.blue2)
    card1Group.add(fb1)
    card2Group.add(fb2)
    card3Group.add(fb3)

    card1Group.position.set(0, 15, 0)
    card2Group.position.set(-4, 15, 0)
    card2Group.rotation.set(0.06, -0.22, -0.06)
    card3Group.position.set(4, 15, 0)
    card3Group.rotation.set(0.06, 0.22, 0.06)

    const cardGroups = [card1Group, card2Group, card3Group]
    const baseX = [0, -4, 4]
    const baseY = [15, 15, 15]
    const baseZ = [0, 0, 0]
    let entranceComplete = false
    const baseRot = cardGroups.map((g) => ({
      x: g.rotation.x,
      y: g.rotation.y,
      z: g.rotation.z,
    }))

    const particleCount = 120
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 4
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const pMat = new THREE.PointsMaterial({
      color: 0xee9221,
      size: 0.06,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      sizeAttenuation: true,
    })
    const points = new THREE.Points(pGeo, pMat)
    scene.add(points)

    const mouse = { x: 0, y: 0 }
    const onMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMove)

    const loader = new GLTFLoader()
    const loads = [
      { url: '/assets/card1.glb', parent: card1Group, fallback: fb1, size: 4.2 },
      { url: '/assets/card2.glb', parent: card2Group, fallback: fb2, size: 3.8 },
      { url: '/assets/card3.glb', parent: card3Group, fallback: fb3, size: 3.8 },
    ]

    loads.forEach(({ url, parent, fallback, size }) => {
      loader.load(
        url,
        (gltf) => {
          const prepared = prepareModel(gltf.scene, size)
          swapCard(parent, fallback, prepared)
        },
        undefined,
        () => {}
      )
    })

    let raf = 0
    const clock = new THREE.Clock()
    const startCards = () => {
      const tl = gsap.timeline({
        onComplete: () => {
          baseX[0] = 0
          baseY[0] = 0.15
          baseZ[0] = 0
          baseX[1] = -3.5
          baseY[1] = -0.2
          baseZ[1] = -0.6
          baseX[2] = 3.5
          baseY[2] = -0.2
          baseZ[2] = -0.6
          entranceComplete = true
        },
      })
      tl.to(
        card1Group.position,
        { x: 0, y: 0.15, z: 0, duration: 1.85, ease: 'power3.out' },
        0
      )
        .to(
          card2Group.position,
          { x: -3.5, y: -0.2, z: -0.6, duration: 1.85, ease: 'power3.out' },
          0
        )
        .to(
          card3Group.position,
          { x: 3.5, y: -0.2, z: -0.6, duration: 1.85, ease: 'power3.out' },
          0
        )
    }

    window._startCards = startCards

    const setSize = () => {
      const rect = wrap.getBoundingClientRect()
      const width = Math.max(1, rect.width)
      const height = Math.max(1, rect.height)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    setSize()
    const ro = new ResizeObserver(setSize)
    ro.observe(wrap)
    window.addEventListener('resize', setSize)

    const animate = () => {
      raf = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      cardGroups.forEach((g, i) => {
        if (entranceComplete) {
          const float = Math.sin(t * 0.9 + i * 0.7) * 0.06
          g.position.set(baseX[i], baseY[i] + float, baseZ[i])
        }
        g.rotation.x = baseRot[i].x + mouse.y * 0.07
        g.rotation.y = baseRot[i].y + mouse.x * 0.09
        g.rotation.z = baseRot[i].z
      })
      points.rotation.y = t * 0.04
      points.rotation.x = Math.sin(t * 0.15) * 0.05
      plOrange.position.set(
        basePlOrange.x + Math.sin(t * 0.35) * 0.35,
        basePlOrange.y + Math.cos(t * 0.28) * 0.2,
        basePlOrange.z
      )
      plBlue.position.set(
        basePlBlue.x + Math.cos(t * 0.31) * 0.28,
        basePlBlue.y,
        basePlBlue.z + Math.sin(t * 0.25) * 0.22
      )
      plGold.position.set(
        basePlGold.x + Math.sin(t * 0.22) * 0.18,
        basePlGold.y + Math.sin(t * 0.4) * 0.15,
        basePlGold.z
      )
      renderer.render(scene, camera)
    }
    animate()

    threeCleanupRef.current = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', setSize)
      ro.disconnect()
      cancelAnimationFrame(raf)
      if (window._startCards === startCards) delete window._startCards
      renderer.dispose()
      pGeo.dispose()
      pMat.dispose()
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          const m = obj.material
          if (Array.isArray(m)) m.forEach((x) => x.dispose())
          else m.dispose()
        }
      })
    }

    return () => {
      threeCleanupRef.current?.()
      threeCleanupRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => {
      if (typeof window._startCards === 'function') window._startCards()
    }, 400)
    return () => clearTimeout(t)
  }, [visible])

  const glass = {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
  }

  return (
    <section
      id="hero-section"
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: '#0A0E1A',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(5rem, 12vw, 8rem) 1.25rem 4rem',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 'min(72vw, 520px)',
            height: 'min(72vw, 520px)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(238,146,33,0.35) 0%, transparent 65%)',
            filter: 'blur(48px)',
            top: '-12%',
            right: '-8%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 'min(65vw, 480px)',
            height: 'min(65vw, 480px)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(74,106,153,0.32) 0%, transparent 68%)',
            filter: 'blur(56px)',
            bottom: '5%',
            left: '-10%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 'min(50vw, 360px)',
            height: 'min(50vw, 360px)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,191,0,0.18) 0%, transparent 70%)',
            filter: 'blur(40px)',
            top: '38%',
            left: '42%',
          }}
        />
      </div>

      <canvas
        id="particles-canvas"
        ref={particlesCanvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      <div
        id="hero"
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: 1120,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <div
          id="hero-canvas-wrap"
          style={{
            width: '100%',
            maxWidth: 900,
            height: 'min(42vh, 380px)',
            marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)',
            position: 'relative',
          }}
        >
          <canvas
            id="hero-canvas"
            ref={heroCanvasRef}
            style={{ display: 'block', width: '100%', height: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.1rem' }}>
          <div
            id="hero-tag"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 16px',
              borderRadius: 999,
              ...glass,
              color: 'rgba(255,255,255,0.88)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#EE9221',
                boxShadow: '0 0 12px rgba(238,146,33,0.85)',
                animation: 'heroPulse 2s ease-in-out infinite',
              }}
            />
            The Future of Banking
          </div>

          <style>{`@keyframes heroPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.65;transform:scale(0.92)}}`}</style>

          <h1
            id="hero-h1"
            style={{
              margin: 0,
              fontSize: 'clamp(2.25rem, 5.5vw, 3.75rem)',
              fontWeight: 700,
              lineHeight: 1.08,
              color: '#F4F6FB',
              letterSpacing: '-0.02em',
            }}
          >
            Banking <em style={{ color: '#EE9221', fontStyle: 'normal' }}>Beyond</em> Every Limit.
          </h1>

          <p
            id="hero-sub"
            style={{
              margin: 0,
              maxWidth: 520,
              fontSize: 'clamp(1rem, 2.2vw, 1.125rem)',
              lineHeight: 1.65,
              color: 'rgba(226,232,245,0.72)',
            }}
          >
            Rawbank allie innovation et sécurité pour votre argent. Cartes premium, épargne intelligente et
            accompagnement humain — tout depuis une expérience digne du futur.
          </p>

          <div
            id="hero-btns"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 14,
              justifyContent: 'center',
              marginTop: 6,
            }}
          >
            <a
              href="#contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '14px 28px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #EE9221 0%, #C96F12 100%)',
                color: '#0A0E1A',
                fontWeight: 700,
                fontSize: '0.95rem',
                textDecoration: 'none',
                boxShadow: '0 12px 40px rgba(238,146,33,0.35)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              Open Free Account
            </a>
            <a
              href="#demo"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 26px',
                borderRadius: 12,
                ...glass,
                color: 'rgba(255,255,255,0.92)',
                fontWeight: 600,
                fontSize: '0.95rem',
                textDecoration: 'none',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
                <path d="M10 8.5v7l6-3.5-6-3.5z" fill="currentColor" />
              </svg>
              Watch Demo
            </a>
          </div>

          <div
            id="hero-stats"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'clamp(1rem, 4vw, 2.5rem)',
              justifyContent: 'center',
              marginTop: 'clamp(1.25rem, 3vw, 2rem)',
              padding: '18px 28px',
              borderRadius: 16,
              ...glass,
            }}
          >
            {[
              ['2M+', 'Customers'],
              ['$8B', 'Assets'],
              ['25Y', 'Trust'],
            ].map(([n, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fff' }}>{n}</div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        id="scroll-indicator"
        style={{
          position: 'absolute',
          bottom: 28,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          color: 'rgba(255,255,255,0.4)',
          fontSize: '0.7rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
        }}
      >
        <span>Scroll</span>
        <svg width="22" height="32" viewBox="0 0 22 32" fill="none" aria-hidden style={{ opacity: 0.85 }}>
          <rect x="1" y="1" width="20" height="30" rx="10" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="11" cy="11" r="3" fill="currentColor" style={{ animation: 'heroScrollDot 1.8s ease-in-out infinite' }} />
        </svg>
        <style>{`@keyframes heroScrollDot{0%,100%{transform:translateY(0);opacity:0.9}50%{transform:translateY(8px);opacity:0.35}}`}</style>
      </div>
    </section>
  )
}
