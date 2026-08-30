import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const IMG_LEFT = '/assets/images/man-leftside-in-yellow.jpg'
const IMG_RIGHT = '/assets/images/two-best-leftside-in-yellow.jpg'

export default function ImageShowcase() {
  const rootRef = useRef(null)
  const mask1Ref = useRef(null)
  const mask2Ref = useRef(null)
  const img1Ref = useRef(null)
  const img2Ref = useRef(null)
  const badge1Ref = useRef(null)
  const badge2Ref = useRef(null)

  const [err1, setErr1] = useState(false)
  const [err2, setErr2] = useState(false)

  const onImgError = (e) => {
    const img = e.currentTarget
    img.style.display = 'none'
    const wrap = img.closest('.showcase-img-wrap')
    if (wrap) wrap.classList.add('showcase-img-fallback')
  }

  const handleError1 = (e) => {
    setErr1(true)
    onImgError(e)
  }

  const handleError2 = (e) => {
    setErr2(true)
    onImgError(e)
  }

  useEffect(() => {
    const root = rootRef.current
    const m1 = mask1Ref.current
    const m2 = mask2Ref.current
    const i1 = img1Ref.current
    const i2 = img2Ref.current
    const b1 = badge1Ref.current
    const b2 = badge2Ref.current
    if (!root || !m1 || !m2) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: 'top 70%',
          toggleActions: 'play none none reverse',
        },
      })

      tl.fromTo(
        m1,
        { clipPath: 'inset(0 100% 0 0)' },
        { clipPath: 'inset(0 0% 0 0)', duration: 1.15, ease: 'power2.inOut' }
      )
        .fromTo(
          m2,
          { clipPath: 'inset(0 0 0 100%)' },
          { clipPath: 'inset(0 0 0 0%)', duration: 1.1, ease: 'power2.inOut' },
          '-=0.65'
        )
        .fromTo(
          [b1, b2],
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.12, ease: 'power2.out' },
          '-=0.35'
        )

      if (i1 && !err1) {
        gsap.fromTo(
          i1,
          { yPercent: 6 },
          {
            yPercent: -8,
            ease: 'none',
            scrollTrigger: {
              trigger: root,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          }
        )
      }
      if (i2 && !err2) {
        gsap.fromTo(
          i2,
          { yPercent: 4 },
          {
            yPercent: -10,
            ease: 'none',
            scrollTrigger: {
              trigger: root,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          }
        )
      }
    }, root)

    return () => ctx.revert()
  }, [err1, err2])

  return (
    <section id="showcase" ref={rootRef} className="showcase-section">
      <div className="showcase-header">
        <p className="showcase-tag">Built for Humanity</p>
        <h2 className="showcase-title">
          Real people. <em>Real ambitions.</em>
        </h2>
      </div>

      <div className="showcase-grid">
        <div className="showcase-cell">
          <div className="showcase-stack">
            <div
              ref={mask1Ref}
              className={`showcase-img-wrap showcase-img-wrap--left ${err1 ? 'showcase-img-fallback' : ''}`}
            >
              <img
                ref={img1Ref}
                className="showcase-img"
                src={IMG_LEFT}
                alt=""
                onError={handleError1}
              />
              <div className="showcase-overlay">
                <span className="showcase-overlay-title">Individual Banking</span>
              </div>
            </div>
            <span ref={badge1Ref} className="showcase-badge">
              4.9/5 App Rating
            </span>
          </div>
        </div>

        <div className="showcase-cell showcase-cell--offset">
          <div className="showcase-stack">
            <div
              ref={mask2Ref}
              className={`showcase-img-wrap showcase-img-wrap--right ${err2 ? 'showcase-img-fallback' : ''}`}
            >
              <img
                ref={img2Ref}
                className="showcase-img"
                src={IMG_RIGHT}
                alt=""
                onError={handleError2}
              />
              <div className="showcase-overlay">
                <span className="showcase-overlay-title">Business Banking</span>
              </div>
            </div>
            <span ref={badge2Ref} className="showcase-badge">
              50K+ Business Clients
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
