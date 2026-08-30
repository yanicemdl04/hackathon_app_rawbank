# Rawbank — Application Anti-fraude Bancaire

Application web React de detection de fraude en temps reel pour Rawbank, la premiere banque commerciale de la Republique Democratique du Congo. Connectee a une API backend avec moteur IA pour l'analyse de chaque transaction.

---

## Apercu

L'application se compose de deux parties :

1. **Site vitrine** — Presentation de Rawbank avec scene 3D interactive (cartes bancaires GLB), animations GSAP, design liquid glass
2. **Plateforme anti-fraude** — Authentification 2FA, gestion des transactions, detection de fraude IA, carte interactive, notifications temps reel, signalements et declarations de voyage

### Technologies

| Categorie | Technologies |
|-----------|-------------|
| Framework | React 18 + Vite 6 |
| Routing | React Router DOM v7 |
| 3D | Three.js 0.160 + GLTFLoader |
| Animations | GSAP 3.12 + ScrollTrigger |
| Carte | Leaflet + React-Leaflet v4 |
| Graphiques | Recharts |
| Temps reel | Socket.IO Client |
| Notifications | Sonner (toasts) |
| State | React Context (AuthContext, NotificationContext) |

### API Backend

```
Base URL : https://bankfraud.loophole.site/bankapi/v1
Swagger  : https://bankfraud.loophole.site/bankapi/api-docs
Config   : https://bankfraud.loophole.site/bankapi/config
```

---

## Installation

```bash
# Cloner le projet
cd "Projets app/Hack3"

# Installer les dependances
npm install

# Lancer le serveur de developpement
npm run dev
```

L'application sera accessible sur `http://localhost:5173`.

### Build de production

```bash
npm run build
npm run preview
```

---

## Structure du projet

```
Hack3/
├── index.html                    # Point d'entree Vite
├── package.json
├── vite.config.js
├── README.md
│
├── public/
│   └── assets/
│       ├── card1.glb             # Modele 3D carte Rawbank (Blender)
│       ├── card2.glb             # Modele 3D carte Rawbank
│       ├── card3.glb             # Modele 3D carte Rawbank
│       └── images/
│           ├── logo-Rawbank-weight-size.png
│           ├── logo-Rawbank-min-size.jpeg
│           ├── man-leftside-in-yellow.jpg
│           └── two-best-leftside-in-yellow.jpg
│
├── assets/
│   ├── GUIDE_FRONTEND.md         # Documentation API v1
│   └── GUIDE_DEVELOPPEUR (2).md  # Documentation API v2 (avec voyages)
│
└── src/
    ├── main.jsx                  # Point d'entree React (BrowserRouter + Providers)
    ├── App.jsx                   # Layout principal (navbar, routes, footer, cursor, loader)
    ├── styles.css                # CSS complet (design system liquid glass)
    │
    ├── lib/                      # Couche metier
    │   ├── api.js                # Fetch wrapper + auto-decouverte /bankapi/config
    │   ├── AuthContext.jsx        # State auth (user, login, verifyOtp, logout)
    │   ├── NotificationContext.jsx # Notifications temps reel Socket.IO
    │   └── socket.js             # Singleton Socket.IO
    │
    ├── components/               # Composants partages
    │   ├── StatusBadge.jsx       # Badge colore par statut (OK/VERIFY/BLOCK/VERIFIED)
    │   ├── OtpModal.jsx          # Modal OTP 6 digits reutilisable
    │   ├── FrozenOverlay.jsx     # Overlay fullscreen compte gele
    │   ├── NotificationBell.jsx  # Cloche notifications + dropdown
    │   ├── CustomCursor.jsx      # Curseur custom (non utilise actuellement)
    │   ├── HeroSection.jsx       # (legacy)
    │   ├── Navbar.jsx            # (legacy)
    │   ├── LoadingScreen.jsx     # (legacy)
    │   ├── Footer.jsx            # (legacy)
    │   ├── StorySection.jsx      # (legacy)
    │   ├── NumbersSection.jsx    # (legacy)
    │   ├── ImageShowcase.jsx     # (legacy)
    │   ├── FeaturesSection.jsx   # (legacy)
    │   ├── BrandSection.jsx      # (legacy)
    │   └── CTASection.jsx        # (legacy)
    │
    └── pages/                    # Pages de l'application
        ├── Home.jsx              # Accueil (hero 3D, story, numbers, features, brand, CTA)
        ├── Solutions.jsx         # Solutions bancaires
        ├── Cards.jsx             # Cartes Visa (Classic/Gold/Platinum)
        ├── Business.jsx          # Solutions entreprises
        ├── About.jsx             # A propos + timeline
        ├── Contact.jsx           # Formulaire de contact
        ├── Login.jsx             # Connexion (telephone + email)
        ├── VerifyOtp.jsx         # Verification OTP 6 digits
        ├── Transactions.jsx      # Liste des transactions paginee
        ├── TransactionDetail.jsx # Detail transaction + tracabilite + signalement
        ├── NewTransaction.jsx    # Creation transaction + OTP si VERIFY
        ├── MapView.jsx           # Carte Leaflet + simulation localisation
        ├── AIDashboard.jsx       # Dashboard IA (stats, graphiques, retrain)
        ├── Disputes.jsx          # Liste signalements + workflow investigation
        └── TravelDeclarations.jsx # Declarations de voyage
```

---

## Routes de l'application

### Pages publiques

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Accueil avec scene 3D, animations, sections vitrine |
| `/solutions` | Solutions | Presentation des solutions bancaires |
| `/cartes` | Cards | Cartes Visa avec tarifs |
| `/business` | Business | Solutions entreprises et corporate |
| `/a-propos` | About | Histoire Rawbank, timeline, mission |
| `/contact` | Contact | Formulaire de contact |
| `/connexion` | Login | Formulaire de connexion (telephone + email) |
| `/verification-otp` | VerifyOtp | Saisie du code OTP 6 chiffres |

### Pages protegees (authentification requise)

| Route | Page | Description |
|-------|------|-------------|
| `/mes-transactions` | Transactions | Liste paginee des transactions avec filtres |
| `/transactions/:id` | TransactionDetail | Detail complet + tracabilite + signalement |
| `/nouvelle-transaction` | NewTransaction | Formulaire de creation + OTP si necessaire |
| `/carte` | MapView | Carte Leaflet + simulation de localisation |
| `/ia` | AIDashboard | Dashboard IA (KPIs, graphiques, retrain, health) |
| `/signalements` | Disputes | Liste et workflow des signalements de fraude |
| `/voyages` | TravelDeclarations | Declarations de voyage + historique |

---

## Fonctionnalites detaillees

### 1. Authentification 2FA

Flux en deux etapes :
1. L'utilisateur saisit son telephone + email → `POST /auth/login-or-register`
2. Un code OTP 6 chiffres est envoye par email → `POST /auth/verify-otp`
3. Profil utilisateur stocke dans `localStorage` via `AuthContext`

Gestion des erreurs : code incorrect (tentatives restantes), code expire (redirect login), trop de tentatives (countdown 15 minutes).

### 2. Scene 3D Hero

- Three.js avec WebGLRenderer, ACES Filmic tone mapping, SRGB color space
- 3 modeles GLB charges via GLTFLoader avec environment map PMREM
- 6 lumieres (key, fill, 2 rim, bottom gold, ambient)
- Rotation showcase lente (sin oscillation privilegiant la face)
- Parallax souris subtil
- Particules 3D en arriere-plan
- Anisotropic filtering sur toutes les textures

### 3. Transactions

- Liste paginee avec filtre par statut (OK, VERIFY, BLOCK, VERIFIED_BY_USER)
- Profil utilisateur avec barre de risque en haut
- Click → detail complet avec score, raisons, infos appareil/reseau/localisation
- Creation de transaction avec tous les champs (montant, type, canal, appareil, reseau, localisation)
- Si `requiresOtp: true` → modal OTP pour confirmer
- Auto-refresh via Socket.IO (`transaction:scored`, `transaction:verified`)

### 4. Dashboard IA

- 6 KPIs en glass cards (total, aujourd'hui, score moyen, taux blocage, faux positifs, temps reponse)
- Pie chart : repartition par statut
- Bar chart : distribution des scores de risque (10 buckets)
- Line chart : evolution sur 14 jours
- Infos modele (dernier retrain, feedback dispo)
- Badge sante IA (en ligne / simulateur)
- Bouton re-entrainement du modele
- Bouton seed demo (donnees de test)
- Auto-refresh via Socket.IO `ai:stats-updated`

### 5. Carte interactive

- Leaflet centree sur Kinshasa
- Marqueurs pour toutes les villes disponibles (Kinshasa, Paris, Dubai, Casablanca, Brazzaville)
- Marqueur utilisateur avec effet pulse anime
- Simulation de localisation via select + API
- Fly-to anime lors du changement

### 6. Notifications temps reel

Connexion Socket.IO permanente quand l'utilisateur est connecte. Evenements ecoutes :

| Evenement | Action |
|-----------|--------|
| `transaction:scored` | Toast + refresh liste transactions |
| `transaction:verified` | Toast succes + refresh |
| `premium:fraud-alert` | Toast urgent rouge |
| `dispute:opened` | Toast info |
| `dispute:updated` | Toast mise a jour |
| `account:frozen` | Toast + overlay fullscreen gel |
| `account:unfrozen` | Toast succes + retrait overlay |
| `ai:stats-updated` | Refresh KPIs dashboard IA |

Cloche dans la navbar avec badge compteur + dropdown des dernieres notifications.

### 7. Signalements de fraude

- Liste paginee avec filtre par statut
- Detail en modal avec workflow d'investigation
- Transitions : OPEN → INVESTIGATING → CONFIRMED/REJECTED → RESOLVED
- Bouton "Signaler une fraude" sur chaque detail de transaction
- Gel automatique du compte apres signalement

### 8. Declarations de voyage

- Formulaire : destination (select villes API), dates depart/retour
- Liste des voyages actifs avec bouton d'annulation
- Historique complet (actifs + termines)
- Evite le blocage des transactions a l'etranger

### 9. Tracabilite

Disponible dans le detail de chaque transaction :
- Adresse IP
- Empreinte appareil (device fingerprint)
- User Agent
- Appareils et IPs connus de l'utilisateur
- Signalements lies

---

## Design System

### Theme

Le site utilise un theme clair (fond `#FAFBFF`) avec un design system base sur :

- **Liquid glass** : `backdrop-filter: blur()`, bordures semi-transparentes, ombres internes
- **Couleurs** : Orange `#EE9221` (accent), Bleu `#1C3F71` (texte), Beige `#FFF1E0` (fond secondaire)
- **Typographie** : Playfair Display (titres), DM Sans (corps), DM Mono (code/tags)
- **Icones** : SVG inline avec style stroke

### Statuts de transaction

| Statut | Couleur | Signification |
|--------|---------|---------------|
| `OK` | Vert `#388E3C` | Approuvee |
| `VERIFY` | Orange `#EE9221` | A verifier (OTP possible) |
| `VERIFIED_BY_USER` | Bleu `#3b82f6` | Confirmee par OTP |
| `BLOCK` | Rouge `#e53e3e` | Bloquee |
| `FRAUD_CONFIRMED` | Rouge `#e53e3e` | Fraude confirmee |

---

## Variables d'environnement

Aucune variable d'environnement requise. L'URL de l'API est configuree dans `src/lib/api.js` et decouverte dynamiquement via `GET /bankapi/config`.

Pour changer l'API en local, modifier `CONFIG_URL` dans `src/lib/api.js` :

```js
const CONFIG_URL = 'http://localhost:3000/bankapi/config'
```

---

## Scripts

```bash
npm run dev      # Serveur de developpement (HMR)
npm run build    # Build de production
npm run preview  # Preview du build de production
```

---

## Equipe

Projet realise dans le cadre du Hackathon Rawbank 2026.

---

*Documentation API interactive : https://bankfraud.loophole.site/bankapi/api-docs*
