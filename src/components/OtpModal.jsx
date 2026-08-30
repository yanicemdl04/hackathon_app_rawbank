import { useState, useRef, useEffect, useCallback } from 'react'

export default function OtpModal({ visible, otpSentTo, onVerify, onClose, onResend, loading, error }) {
  const [digits, setDigits] = useState(['','','','','',''])
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()]
  const [countdown, setCountdown] = useState(60)

  useEffect(() => {
    if (visible) {
      setDigits(['','','','','',''])
      setCountdown(60)
      setTimeout(() => refs[0].current?.focus(), 100)
    }
  }, [visible])

  useEffect(() => {
    if (!visible || countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [visible, countdown])

  const handleChange = useCallback((idx, val) => {
    if (val.length > 1) val = val.slice(-1)
    if (val && !/^\d$/.test(val)) return
    const next = [...digits]
    next[idx] = val
    setDigits(next)
    if (val && idx < 5) refs[idx + 1].current?.focus()
    if (next.every(d => d !== '')) onVerify(next.join(''))
  }, [digits, onVerify])

  const handleKeyDown = useCallback((idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs[idx - 1].current?.focus()
    }
  }, [digits])

  const handlePaste = useCallback((e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      const next = text.split('')
      setDigits(next)
      refs[5].current?.focus()
      onVerify(text)
      e.preventDefault()
    }
  }, [onVerify])

  if (!visible) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-glass" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3 style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:'1.2rem',color:'var(--blue)',marginBottom:8}}>
          Vérification OTP
        </h3>
        <p style={{fontSize:'.85rem',color:'var(--blue-2)',marginBottom:24}}>
          Code envoyé à <strong>{otpSentTo}</strong>
        </p>
        <div className="otp-inputs" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="otp-digit"
              autoComplete="one-time-code"
            />
          ))}
        </div>
        {error && <p className="otp-error">{error}</p>}
        {loading && <p style={{fontSize:'.8rem',color:'var(--blue-2)',marginTop:12}}>Vérification...</p>}
        <p style={{fontSize:'.75rem',color:'var(--blue-2)',marginTop:20}}>
          {countdown > 0
            ? `Renvoyer le code dans ${countdown}s`
            : <button
                className="btn-ghost"
                style={{fontSize:'.75rem',padding:0,color:'var(--orange)'}}
                onClick={() => {
                  setDigits(['','','','','',''])
                  setCountdown(60)
                  refs[0].current?.focus()
                  onResend?.()
                }}
              >Renvoyer le code</button>
          }
        </p>
      </div>
    </div>
  )
}
