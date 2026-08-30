import { useState, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import LoadingScreen from './components/LoadingScreen'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import StorySection from './components/StorySection'
import NumbersSection from './components/NumbersSection'
import ImageShowcase from './components/ImageShowcase'
import FeaturesSection from './components/FeaturesSection'
import BrandSection from './components/BrandSection'
import CTASection from './components/CTASection'
import Footer from './components/Footer'

gsap.registerPlugin(ScrollTrigger)

export default function App() {
  const [loaded, setLoaded] = useState(false)

  const handleLoadComplete = () => {
    setLoaded(true)
    // Refresh ScrollTrigger after load
    setTimeout(() => {
      ScrollTrigger.refresh()
    }, 300)
  }

  return (
    <div className="relative">
      {/* Loading Screen */}
      {!loaded && <LoadingScreen onComplete={handleLoadComplete} />}

      {/* Main content */}
      <div style={{ visibility: loaded ? 'visible' : 'hidden' }}>
        <Navbar visible={loaded} />
        <main>
          <HeroSection visible={loaded} />
          <StorySection />
          <NumbersSection />
          <ImageShowcase />
          <FeaturesSection />
          <BrandSection />
          <CTASection />
        </main>
        <Footer />
      </div>

      {/* Custom cursor */}
      <CustomCursor />
    </div>
  )
}

function CustomCursor() {
  useEffect(() => {
    const cursor = document.createElement('div')
    cursor.id = 'custom-cursor'
    cursor.style.cssText = `
      position: fixed;
      width: 12px;
      height: 12px;
      background: #EE9221;
      border-radius: 50%;
      pointer-events: none;
      z-index: 99999;
      mix-blend-mode: multiply;
      transition: transform 0.15s ease, width 0.3s ease, height 0.3s ease, opacity 0.3s ease;
      transform: translate(-50%, -50%);
      top: -20px;
      left: -20px;
    `

    const cursorRing = document.createElement('div')
    cursorRing.style.cssText = `
      position: fixed;
      width: 36px;
      height: 36px;
      border: 1.5px solid rgba(238,146,33,0.5);
      border-radius: 50%;
      pointer-events: none;
      z-index: 99998;
      transform: translate(-50%, -50%);
      transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
      top: -20px;
      left: -20px;
    `

    document.body.appendChild(cursor)
    document.body.appendChild(cursorRing)

    let mouseX = -20, mouseY = -20
    let ringX = -20, ringY = -20

    const moveCursor = (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
      cursor.style.top = mouseY + 'px'
      cursor.style.left = mouseX + 'px'
    }

    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.12
      ringY += (mouseY - ringY) * 0.12
      cursorRing.style.top = ringY + 'px'
      cursorRing.style.left = ringX + 'px'
      requestAnimationFrame(animateRing)
    }
    animateRing()

    const handleMouseEnterLink = () => {
      cursor.style.transform = 'translate(-50%, -50%) scale(2.5)'
      cursorRing.style.transform = 'translate(-50%, -50%) scale(1.5)'
      cursorRing.style.borderColor = 'rgba(238,146,33,0.8)'
    }

    const handleMouseLeaveLink = () => {
      cursor.style.transform = 'translate(-50%, -50%) scale(1)'
      cursorRing.style.transform = 'translate(-50%, -50%) scale(1)'
      cursorRing.style.borderColor = 'rgba(238,146,33,0.5)'
    }

    window.addEventListener('mousemove', moveCursor)
    document.querySelectorAll('a, button').forEach((el) => {
      el.addEventListener('mouseenter', handleMouseEnterLink)
      el.addEventListener('mouseleave', handleMouseLeaveLink)
    })

    // Hide on mobile
    const isMobile = window.innerWidth < 768
    if (isMobile) {
      cursor.style.display = 'none'
      cursorRing.style.display = 'none'
    }

    return () => {
      window.removeEventListener('mousemove', moveCursor)
      cursor.remove()
      cursorRing.remove()
    }
  }, [])

  return null
}
