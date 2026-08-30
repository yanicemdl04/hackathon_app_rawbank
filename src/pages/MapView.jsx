import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useAuth } from '../lib/AuthContext'
import { api } from '../lib/api'
import 'leaflet/dist/leaflet.css'

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
})

const userIcon = new L.DivIcon({
  className: 'user-marker-pulse',
  html: '<div class="pulse-ring"></div><div class="pulse-core"></div>',
  iconSize: [24, 24], iconAnchor: [12, 12],
})

function FlyTo({ center }) {
  const map = useMap()
  useEffect(() => { if (center) map.flyTo(center, 10, { duration: 1.5 }) }, [center, map])
  return null
}

export default function MapView() {
  const { user, isAuthenticated } = useAuth()
  const [locations, setLocations] = useState([])
  const [userLoc, setUserLoc] = useState(null)
  const [selectedCode, setSelectedCode] = useState('KINSHASA')
  const [loading, setLoading] = useState(false)
  const [flyTarget, setFlyTarget] = useState(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api.get('/locations').then(d => setLocations(d.locations || [])).catch(() => {})
  }, [])

  const simulateLocation = async () => {
    if (!user) return
    setLoading(true); setMsg('')
    try {
      const res = await api.put(`/users/${user.id}/simulate-location`, { location: selectedCode })
      setUserLoc({ lat: res.latitude, lng: res.longitude, ville: res.ville, pays: res.pays })
      setFlyTarget([res.latitude, res.longitude])
      setMsg(`Position mise à jour : ${res.ville}, ${res.pays}`)
    } catch (err) {
      setMsg(err.body?.message || 'Erreur de simulation')
    }
    setLoading(false)
  }

  return (
    <section className="app-page">
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <span className="section-tag">Localisations</span>
          <h2 className="section-h2">Carte des <em>transactions</em></h2>
          <p className="section-sub" style={{margin:'0 auto'}}>
            Visualisez les localisations disponibles et simulez votre position pour tester la detection de fraude geographique.
          </p>
        </div>

        <div className="map-glass-card">
          <div className="map-container">
            <MapContainer center={[-4.325, 15.322]} zoom={4} style={{width:'100%',height:'100%'}} scrollWheelZoom={true}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {locations.map(loc => (
                <Marker key={loc.code} position={[loc.latitude, loc.longitude]} icon={defaultIcon}>
                  <Popup>
                    <strong>{loc.ville}</strong><br/>{loc.pays}
                    <br/><span style={{fontSize:'.75rem',color:'#888'}}>{loc.code}</span>
                  </Popup>
                </Marker>
              ))}
              {userLoc && (
                <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon}>
                  <Popup><strong>Votre position</strong><br/>{userLoc.ville}, {userLoc.pays}</Popup>
                </Marker>
              )}
              <FlyTo center={flyTarget} />
            </MapContainer>
          </div>

          {isAuthenticated && (
            <div className="map-controls">
              <h4 style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:'1rem',color:'var(--blue)',marginBottom:12}}>
                Simuler ma position
              </h4>
              <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
                <div style={{flex:1,minWidth:180}}>
                  <label className="auth-label" style={{marginTop:0}}>Ville</label>
                  <select className="contact-select" value={selectedCode} onChange={e => setSelectedCode(e.target.value)}
                    style={{marginBottom:0}}>
                    {locations.map(l => <option key={l.code} value={l.code}>{l.ville}, {l.pays}</option>)}
                  </select>
                </div>
                <button onClick={simulateLocation} disabled={loading} className="btn-primary" style={{whiteSpace:'nowrap',height:42}}>
                  {loading ? 'Mise à jour...' : 'Mettre à jour'}
                </button>
              </div>
              {msg && <p style={{fontSize:'.82rem',color:'var(--green)',marginTop:10}}>{msg}</p>}
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={{display:'flex',gap:24,justifyContent:'center',marginTop:24,flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:6,fontSize:'.78rem',color:'var(--blue-2)'}}>
            <div style={{width:12,height:12,borderRadius:'50%',background:'var(--blue)'}}/>Localisation disponible
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6,fontSize:'.78rem',color:'var(--blue-2)'}}>
            <div style={{width:12,height:12,borderRadius:'50%',background:'var(--orange)',boxShadow:'0 0 8px var(--orange)'}}/>Votre position
          </div>
        </div>
      </div>
    </section>
  )
}
