# Guide d'integration Frontend — API Anti-fraude

Document a destination du developpeur frontend (dashboard).
Les endpoints metier utilisent le prefixe `/bankapi/v1`.
La config et la documentation restent sous `/bankapi` (non versionnees).

---

## 1. URL de base

```
https://bankfraud.loophole.site/bankapi/v1
```

Swagger UI (documentation interactive, testable dans le navigateur) :

```
https://bankfraud.loophole.site/bankapi/api-docs
```

Auto-decouverte (non versionnee) :

```
https://bankfraud.loophole.site/bankapi/config
```

---

## 2. Initialisation : auto-decouverte

Au demarrage de l'application frontend, un seul appel suffit pour recuperer toutes les URLs dynamiquement.

**Requete**

```
GET /bankapi/config
```

**Reponse 200**

```json
{
  "apiBaseUrl": "https://bankfraud.loophole.site/bankapi",
  "apiVersionedUrl": "https://bankfraud.loophole.site/bankapi/v1",
  "apiVersion": "v1",
  "publicBaseUrl": "https://bankfraud.loophole.site",
  "apiPrefix": "/bankapi",
  "socketPath": "/socket.io",
  "socketUrl": "https://bankfraud.loophole.site",
  "docs": "https://bankfraud.loophole.site/bankapi/api-docs",
  "endpoints": {
    "transactions": "https://bankfraud.loophole.site/bankapi/v1/transactions",
    "statuses": "https://bankfraud.loophole.site/bankapi/v1/transactions/statuses",
    "auth": "https://bankfraud.loophole.site/bankapi/v1/auth/login-or-register",
    "seedDemo": "https://bankfraud.loophole.site/bankapi/v1/users/seed-demo",
    "locations": "https://bankfraud.loophole.site/bankapi/v1/locations",
    "simulateLocation": "https://bankfraud.loophole.site/bankapi/v1/users/:id/simulate-location",
    "mlRetrain": "https://bankfraud.loophole.site/bankapi/v1/ml/retrain",
    "aiStats": "https://bankfraud.loophole.site/bankapi/v1/ai/stats",
    "aiTimeline": "https://bankfraud.loophole.site/bankapi/v1/ai/stats/timeline",
    "aiDistribution": "https://bankfraud.loophole.site/bankapi/v1/ai/stats/distribution",
    "aiModelInfo": "https://bankfraud.loophole.site/bankapi/v1/ai/model-info"
  }
}
```

Exemple JavaScript :

```javascript
const BASE = "https://bankfraud.loophole.site/bankapi";
// ou dynamiquement :
const { apiVersionedUrl } = await fetch(`${BASE}/config`).then(r => r.json());
```

---

## 3. Valeurs d'enum (pour les selects, filtres, formulaires)

### accountType (TypeCompte)

| Valeur | Signification |
|--------|---------------|
| `ETUDIANT` | Etudiant / faible activite |
| `CLASSIQUE` | Salarie / profil standard |
| `PREMIUM` | VIP (hauts fonctionnaires, grandes fortunes) |
| `BUSINESS` | Entreprise / commercant, gros volumes |

### TransactionStatus

| Valeur | Signification | Couleur suggeree |
|--------|---------------|-----------------|
| `OK` | Transaction normale, approuvee | Vert |
| `VERIFY` | Suspecte, necessite une verification | Orange |
| `VERIFIED_BY_USER` | Verifiee par l'utilisateur via OTP | Bleu |
| `BLOCK` | Bloquee, fraude probable | Rouge |

### typeTransaction

`TRANSFERT`, `RETRAIT`, `DEPOT`, `PAIEMENT`

### canalTransaction

`MOBILE`, `USSD`, `WEB`, `POS`, `GAB`, `AGENCE`

### devise

`CDF` (Franc congolais), `USD` (Dollar americain)

### typeAppareil

`ANDROID`, `IOS`, `WEB`, `FEATURE_PHONE`

### typeReseau

`G2`, `G3`, `G4`, `WIFI`

---

## 4. API par ecran

---

### 4.1 Authentification (ecran connexion) — flux 2FA par email

La connexion se fait en **deux etapes** : d'abord login/register (envoi d'un code OTP par email), puis verification du code pour recuperer le profil.

#### Etape 1 : login ou inscription

**Requete**

```
POST /bankapi/v1/auth/login-or-register
Content-Type: application/json
```

```json
{
  "phoneNumber": "+243810000001",
  "email": "jean.dupont@example.com",
  "name": "Jean Dupont"
}
```

- `phoneNumber` : obligatoire, format international `+XXXXXXXXXXX`
- `email` : **obligatoire**. L'OTP est envoye a cette adresse ; sert aussi aux notifications de securite (ex. alertes fraude pour clients PREMIUM).
- `name` : optionnel (utilise seulement a la creation)

**Reponse 200** — ce n'est **plus** le profil utilisateur. Le backend indique qu'un code a ete envoye :

```json
{
  "requiresOtp": true,
  "userId": "uuid-utilisateur",
  "otpSentTo": "e***r@gmail.com",
  "message": "Code de vérification envoyé par email"
}
```

- Conserver `userId` pour l'etape suivante.
- `otpSentTo` : email masque a afficher a l'utilisateur (« code envoye a … »).

#### Etape 2 : verifier le code OTP

**Requete**

```
POST /bankapi/v1/auth/verify-otp
Content-Type: application/json
```

```json
{
  "userId": "uuid-utilisateur",
  "code": "123456"
}
```

**Reponse 200** — profil complet (meme forme qu'avant pour le stockage cote app) :

```json
{
  "id": "uuid-utilisateur",
  "name": "Jean Dupont",
  "email": "jean.dupont@example.com",
  "phoneNumber": "+243810000001",
  "accountType": "CLASSIQUE",
  "riskScore": 15
}
```

- Stocker `id` pour tous les appels suivants.
- `accountType` : type de compte de l'utilisateur.
- `riskScore` : score de risque actuel (0-100).

**Reponse 400** — code incorrect :

```json
{
  "message": "Code incorrect.",
  "remainingAttempts": 2
}
```

**Reponse 410** — code expire (relancer une connexion pour un nouvel OTP) :

```json
{
  "message": "Code expiré. Veuillez vous reconnecter pour recevoir un nouveau code."
}
```

**Reponse 429** — trop d'echecs (blocage temporaire) :

```json
{
  "message": "Trop de tentatives échouées. Veuillez patienter 15 minutes.",
  "retryAfterSeconds": 900
}
```

Utiliser `remainingAttempts` / `retryAfterSeconds` pour l'UX (messages, compte a rebours).

---

### 4.2 Charger les donnees de demo (bouton admin)

**Requete**

```
POST /bankapi/v1/users/seed-demo
```

Pas de body requis.

**Reponse 200**

```json
{
  "users": [
    {
      "id": "uuid-1",
      "name": "Etudiant RDC",
      "phoneNumber": "+243810000001",
      "accountType": "ETUDIANT",
      "riskScore": 15
    },
    {
      "id": "uuid-2",
      "name": "Commercant Kinshasa",
      "phoneNumber": "+243810000002",
      "accountType": "CLASSIQUE",
      "riskScore": 20
    }
  ]
}
```

---

### 4.3 Liste des statuts (pour alimenter un filtre / select)

**Requete**

```
GET /bankapi/v1/transactions/statuses
```

**Reponse 200**

```json
{
  "statuses": ["OK", "VERIFY", "VERIFIED_BY_USER", "BLOCK"]
}
```

---

### 4.4 Liste des transactions (tableau principal, pagine)

**Requete**

```
GET /bankapi/v1/transactions?page=1&pageSize=20
GET /bankapi/v1/transactions?page=2&pageSize=10&status=BLOCK
GET /bankapi/v1/transactions?userId=uuid-utilisateur&page=1&pageSize=50
```

Parametres query (tous optionnels) :

| Parametre | Type | Defaut | Description |
|-----------|------|--------|-------------|
| `page` | int | 1 | Numero de page (commence a 1) |
| `pageSize` | int | 20 | Nombre d'elements par page (max 100) |
| `status` | string | - | Filtrer par statut : `OK`, `VERIFY`, `VERIFIED_BY_USER` ou `BLOCK` |
| `userId` | string | - | Filtrer par utilisateur |

**Reponse 200**

```json
{
  "items": [
    {
      "id": "uuid-transaction",
      "numero": 47,
      "userId": "uuid-utilisateur",
      "userName": "Jean Dupont",
      "accountType": "CLASSIQUE",
      "amount": 200,
      "devise": "USD",
      "typeTransaction": "TRANSFERT",
      "canalTransaction": "MOBILE",
      "riskScore": 45,
      "aiResponseTimeMs": 127,
      "status": "VERIFY",
      "reasons": ["Montant élevé vs moyenne client", "Nouvelle localisation"],
      "requiresManualReview": false,
      "timestamp": "2026-03-27T10:00:00.000Z",
      "montantMoyenClient": 100,
      "transactionInternationale": false,
      "latitude": -4.32,
      "longitude": 15.31,
      "typeAppareil": "ANDROID",
      "typeReseau": "G4",
      "nouvelAppareil": false,
      "nouvelleLocalisation": true,
      "nbTransactions1h": 2,
      "nbTransactions24h": 8,
      "ratioEcartMontant": 1.8,
      "paysDestination": "Republique Democratique du Congo",
      "villeOrigine": "Kinshasa",
      "villeDestination": "Kinshasa"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 47,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "status": null,
    "userId": null
  }
}
```

**Champs importants pour le dashboard :**
- `numero` : numero sequentiel d'affichage (1 = plus ancienne transaction, N = plus recente). Utiliser pour l'affichage a la place de l'UUID.
- `userName` : nom de l'utilisateur rattache (ou `null` si pas de nom)
- `riskScore` (0-100) : jauge ou barre de progression coloree
- `status` : badge colore (vert / orange / bleu pour `VERIFIED_BY_USER` / rouge)
- `reasons` : tableau de textes a afficher en tooltip ou liste
- `requiresManualReview` : icone ou badge "Revue manuelle"
- `pagination.hasNext` / `hasPrev` : activer/desactiver boutons Suivant/Precedent
- `id` : UUID interne, a utiliser pour naviguer vers le detail (`GET /transactions/{id}`)

---

### 4.5 Detail d'une transaction

**Requete**

```
GET /bankapi/v1/transactions/{id}
```

**Reponse 200** : meme structure qu'un element de `items` ci-dessus.

**Reponse 404**

```json
{ "message": "Transaction not found" }
```

---

### 4.6 Creer une transaction (formulaire ou simulation)

**Requete**

```
POST /bankapi/v1/transactions
Content-Type: application/json
```

```json
{
  "userId": "uuid-utilisateur",
  "accountType": "CLASSIQUE",
  "montantMoyenClient": 150,
  "typeTransaction": "TRANSFERT",
  "canalTransaction": "MOBILE",
  "amount": 500,
  "devise": "USD",
  "paysDestination": "Republique Democratique du Congo",
  "villeOrigine": "Kinshasa",
  "villeDestination": "Lubumbashi",
  "transactionInternationale": false,
  "latitude": -4.32,
  "longitude": 15.31,
  "typeAppareil": "ANDROID",
  "typeReseau": "G4",
  "nouvelAppareil": false,
  "nouvelleLocalisation": true,
  "nbTransactions1h": 2,
  "nbTransactions24h": 5,
  "ratioEcartMontant": 1.8
}
```

Tous les champs sont obligatoires sauf `paysDestination`, `villeOrigine`, `villeDestination`, `timestamp`.

**Reponse 201**

Si le statut est `OK` ou `BLOCK`, la reponse ressemble a l'exemple ci-dessous (sans OTP).

Si le statut est `VERIFY`, la reponse inclut en plus **`requiresOtp: true`** et **`otpSentTo`** (email masque) : l'utilisateur recoit un **OTP par email** pour confirmer la transaction.

```json
{
  "transactionId": "uuid-de-la-transaction-creee",
  "riskScore": 55,
  "aiResponseTimeMs": 127,
  "status": "VERIFY",
  "reasons": [
    "Montant supérieur à la moyenne client",
    "Nouvelle localisation"
  ],
  "requiresManualReview": false,
  "requiresOtp": true,
  "otpSentTo": "e***r@gmail.com"
}
```

Pour les cas sans verification OTP, omettre `requiresOtp` / `otpSentTo` ou les considerer absents.

**Reponse 404** (userId inconnu a la creation)

```json
{ "message": "Utilisateur introuvable. Connectez-vous d'abord." }
```

#### Confirmer une transaction en VERIFY (OTP transaction)

**Requete**

```
POST /bankapi/v1/transactions/{id}/verify-otp
Content-Type: application/json
```

Remplacer `{id}` par le `transactionId` retourne a la creation. Body :

```json
{
  "userId": "uuid-utilisateur",
  "code": "123456"
}
```

**Reponse 200** — transaction validee par l'utilisateur :

```json
{
  "transactionId": "uuid-de-la-transaction-creee",
  "status": "VERIFIED_BY_USER",
  "message": "Transaction vérifiée avec succès."
}
```

**Reponse 400** — code incorrect :

```json
{
  "message": "Code incorrect.",
  "remainingAttempts": 2
}
```

**Reponse 403** — 3 echecs : transaction bloquee :

```json
{
  "message": "Transaction bloquée après 3 tentatives échouées.",
  "status": "BLOCK"
}
```

**Reponse 410** — code expire :

```json
{
  "message": "Code expiré. Veuillez recréer la transaction."
}
```

---

### 4.7 Lister les localisations disponibles

**Requete**

```
GET /bankapi/v1/locations
```

**Reponse 200**

```json
{
  "locations": [
    { "code": "KINSHASA", "latitude": -4.325, "longitude": 15.322, "pays": "RDC", "ville": "Kinshasa" },
    { "code": "PARIS", "latitude": 48.8566, "longitude": 2.3522, "pays": "France", "ville": "Paris" },
    { "code": "DUBAI", "latitude": 25.2048, "longitude": 55.2708, "pays": "Emirats Arabes Unis", "ville": "Dubai" },
    { "code": "MOROCCO", "latitude": 33.5731, "longitude": -7.5898, "pays": "Maroc", "ville": "Casablanca" },
    { "code": "BRAZZAVILLE", "latitude": -4.2634, "longitude": 15.2429, "pays": "Republique du Congo", "ville": "Brazzaville" }
  ]
}
```

Utiliser le champ `code` comme valeur a envoyer dans simulate-location.

---

### 4.8 Simuler la localisation d'un utilisateur

**Requete**

```
PUT /bankapi/v1/users/{id}/simulate-location
Content-Type: application/json
```

```json
{
  "location": "KINSHASA"
}
```

Le champ `location` correspond au `code` retourne par `GET /locations`.

**Reponse 200**

```json
{
  "id": "uuid-utilisateur",
  "latitude": -4.325,
  "longitude": 15.322,
  "pays": "RDC",
  "ville": "Kinshasa"
}
```

---

### 4.9 Re-entrainement IA (bouton admin)

Bouton dans le dashboard pour declencher le reentrainement du modele par renforcement.

**Requete**

```
POST /bankapi/v1/ml/retrain
Content-Type: application/json
```

```json
{
  "initiatedBy": "admin-dashboard",
  "source": "bouton_retrain"
}
```

Le body est optionnel (on peut envoyer `{}`).

**Reponse 202 (succes)**

```json
{
  "ok": true,
  "message": "Re-entrainement déclenché avec 234 données de feedback",
  "feedbackSent": 234,
  "lastRetrainAt": "2026-03-27T14:00:00Z",
  "mode": "remote",
  "endpoint": "http://127.0.0.1:19090/retrain",
  "upstream": { "status": "training_started" }
}
```

Le bouton de re-entrainement collecte automatiquement les donnees de feedback :
- Transactions `VERIFIED_BY_USER` → etiquetees "NON-FRAUDE" (l'IA s'est trompee)
- Transactions `BLOCK` → etiquetees "FRAUDE" (l'IA avait raison)

Ces donnees sont envoyees au modele Python pour ameliorer la detection. `feedbackSent` indique le nombre de donnees envoyees, `lastRetrainAt` la date du dernier re-entrainement reussi.

**Reponse 500 (erreur)** : le service ML n'est pas joignable ou n'a pas de route `/retrain`.

```json
{ "message": "Internal server error" }
```

Conseil UX : afficher un spinner pendant l'appel (peut durer jusqu'a 2 min), puis un toast succes/erreur.

---

### 4.10 Dashboard performances IA

Ces endpoints fournissent les donnees necessaires pour construire un dashboard de suivi des performances du modele IA.

#### 4.10.1 Statistiques globales

**Requete**

```
GET /bankapi/v1/ai/stats
```

**Reponse 200**

```json
{
  "totalTransactions": 1234,
  "byStatus": {
    "OK": 800,
    "VERIFY": 200,
    "BLOCK": 150,
    "VERIFIED_BY_USER": 84
  },
  "averageRiskScore": 42.5,
  "falsePositiveRate": 0.42,
  "blockRate": 0.12,
  "verifyRate": 0.16,
  "todayCount": 45,
  "last24hCount": 120,
  "aiResponseTime": {
    "avgMs": 85,
    "minMs": 12,
    "maxMs": 340
  }
}
```

Champs importants :
- `byStatus` : nombre de transactions par statut — ideal pour un graphique circulaire
- `averageRiskScore` : score moyen de risque (0-100) — afficher dans une jauge
- `falsePositiveRate` : ratio des VERIFIED_BY_USER / (VERIFY + VERIFIED_BY_USER) — l'IA s'est trompee
- `blockRate` / `verifyRate` : proportion des transactions bloquees / en verification
- `todayCount` / `last24hCount` : compteurs temps reel pour les KPI
- `aiResponseTime` : temps de reponse de l'IA (moyenne, min, max en ms) — afficher dans le dashboard

#### 4.10.2 Evolution temporelle (timeline)

**Requete**

```
GET /bankapi/v1/ai/stats/timeline?period=day&days=30
```

Parametres query :

| Parametre | Type | Defaut | Description |
|-----------|------|--------|-------------|
| `period` | string | `day` | Granularite : `hour`, `day`, `week` |
| `days` | int | 30 | Nombre de jours a remonter (max 90) |

**Reponse 200**

```json
{
  "period": "day",
  "data": [
    {
      "date": "2026-03-27T00:00:00.000Z",
      "total": 45,
      "ok": 30,
      "verify": 10,
      "block": 3,
      "verifiedByUser": 2,
      "avgRiskScore": 38.5
    }
  ]
}
```

Ideal pour un graphique lineaire (line chart) avec une courbe par statut et le score moyen.

#### 4.10.3 Distribution des scores de risque

**Requete**

```
GET /bankapi/v1/ai/stats/distribution
```

**Reponse 200**

```json
{
  "buckets": [
    { "min": 0, "max": 10, "label": "0-10", "count": 150 },
    { "min": 11, "max": 20, "label": "11-20", "count": 200 },
    { "min": 91, "max": 100, "label": "91-100", "count": 30 }
  ]
}
```

10 buckets de largeur 10. Ideal pour un histogramme (bar chart).

#### 4.10.4 Informations du modele IA

**Requete**

```
GET /bankapi/v1/ai/model-info
```

**Reponse 200**

```json
{
  "status": "active",
  "lastRetrainAt": "2026-03-27T10:00:00Z",
  "transactionsSinceRetrain": 234,
  "feedbackAvailable": {
    "verifiedByUser": 84,
    "blocked": 150,
    "pendingVerify": 16
  }
}
```

- `lastRetrainAt` : date du dernier re-entrainement (null si jamais fait)
- `transactionsSinceRetrain` : nombre de transactions analysees depuis le dernier retrain
- `feedbackAvailable` : donnees de feedback disponibles pour le prochain re-entrainement

#### 4.10.5 Verifier si l'IA est en ligne (health check)

**Requete**

```
GET /bankapi/v1/ai/health
```

**Reponse 200 — IA en ligne**

```json
{
  "aiService": {
    "online": true,
    "url": "http://127.0.0.1:19090",
    "responseTimeMs": 45,
    "error": null,
    "mode": "fallback"
  },
  "fallbackActive": true,
  "message": "Le service IA est en ligne et opérationnel."
}
```

**Reponse 200 — IA hors ligne**

```json
{
  "aiService": {
    "online": false,
    "url": "http://127.0.0.1:19090",
    "responseTimeMs": 5001,
    "error": "The operation was aborted",
    "mode": "fallback"
  },
  "fallbackActive": true,
  "message": "Le service IA est hors ligne. Le simulateur de secours est actif.",
  "instructions": [
    "1. Vérifier que le service Python est lancé sur http://127.0.0.1:19090",
    "2. Depuis le dossier du modèle Python, exécuter : python app.py",
    "3. Vérifier que le port est correct et qu'aucun pare-feu ne bloque la connexion",
    "4. Tester manuellement : curl -X POST http://127.0.0.1:19090/predict -H \"Content-Type: application/json\" -d \"{}\"",
    "Note : ML_FALLBACK_SIMULATED=true est activé — le backend utilise le simulateur intégré en attendant."
  ]
}
```

Champs importants :
- `aiService.online` : `true` si le service IA Python repond, `false` sinon
- `aiService.mode` : `remote` (IA distante seule), `simulated` (simulateur uniquement), `fallback` (IA distante + repli simulateur)
- `fallbackActive` : `true` si le simulateur integre est utilise (permet au systeme de continuer a fonctionner meme sans IA)
- `instructions` : present uniquement si l'IA est hors ligne — afficher dans le dashboard pour guider l'admin
- `message` : message lisible a afficher dans un badge ou une banniere

Conseil UX : Afficher un indicateur colore (vert = en ligne, orange = simulateur, rouge = hors ligne sans fallback) avec le temps de reponse. Si `instructions` est present, afficher un panneau d'aide depliable.

---

## 5. Temps reel (Socket.IO)

Le backend diffuse un evenement a **chaque transaction analysee**. Le dashboard peut l'ecouter pour mettre a jour le tableau en live sans refresh.

### Connexion

```javascript
import { io } from "socket.io-client";

const socket = io("https://bankfraud.loophole.site", {
  path: "/socket.io",
});
```

### Evenement : `transaction:scored`

Emis par le serveur apres chaque `POST /bankapi/v1/transactions`.

```javascript
socket.on("transaction:scored", (data) => {
  console.log(data);
  // Mettre a jour le tableau, afficher une notification, etc.
});
```

Payload recu :

```json
{
  "transactionId": "uuid-transaction",
  "userId": "uuid-utilisateur",
  "riskScore": 72,
  "status": "VERIFY",
  "reasons": ["Ratio écart montant anormal", "Nouvelle localisation"],
  "requiresManualReview": true
}
```

### Evenement : `transaction:verified`

Emis quand l'utilisateur confirme une transaction en statut `VERIFY` via **OTP** (`POST .../transactions/{id}/verify-otp`).

```javascript
socket.on("transaction:verified", (data) => {
  console.log(data);
  // Mettre a jour la ligne du tableau (statut VERIFIED_BY_USER), toast, etc.
});
```

Payload recu :

```json
{
  "transactionId": "uuid-transaction",
  "userId": "uuid-utilisateur",
  "previousStatus": "VERIFY",
  "newStatus": "VERIFIED_BY_USER"
}
```

### Evenement : `premium:fraud-alert` (dashboard banquier)

Emis par le serveur quand une transaction d'un client **PREMIUM** declenche une alerte fraude (le blocage automatique est evite, mais une revue manuelle est requise). Un email est aussi envoye automatiquement au client.

```javascript
socket.on("premium:fraud-alert", (data) => {
  console.log("Alerte premium:", data);
  // Afficher une notification/toast dans le dashboard banquier
});
```

Payload recu :

```json
{
  "transactionId": "uuid-transaction",
  "userId": "uuid-utilisateur",
  "userName": "Client VIP Rawbank",
  "email": "vip.rawbank@example.com",
  "amount": 5000,
  "devise": "USD",
  "riskScore": 82,
  "reasons": ["Montant tres eleve", "Nouvelle localisation", "Client VIP / entreprise: blocage auto evite"],
  "requiresManualReview": true,
  "timestamp": "2026-03-27T14:30:00.000Z"
}
```

**Comportement cote serveur :**
- Le blocage automatique est evite pour les clients PREMIUM
- La transaction passe en statut `VERIFY` avec `requiresManualReview: true`
- Un email d'alerte est envoye au client (si email renseigne)
- L'evenement `premium:fraud-alert` est emis via Socket.IO

**Conseil UX :** Afficher une notification en temps reel (toast, badge, cloche) dans le dashboard des banquiers avec les details de l'alerte. Permettre au banquier de cliquer pour voir le detail de la transaction.

### Evenement : `ai:stats-updated` (dashboard IA)

Emis par le serveur apres **chaque** creation de transaction. Resume leger pour mettre a jour les compteurs du dashboard IA en temps reel sans appeler `GET /ai/stats`.

```javascript
socket.on("ai:stats-updated", (data) => {
  console.log("Stats IA mises a jour:", data);
  // Mettre a jour les KPI du dashboard IA
});
```

Payload recu :

```json
{
  "totalTransactions": 1235,
  "lastRiskScore": 72,
  "lastStatus": "VERIFY",
  "lastResponseTimeMs": 127,
  "todayCount": 46,
  "timestamp": "2026-03-27T14:30:00Z"
}
```

### Action optionnelle : rejoindre une salle utilisateur

```javascript
socket.emit("join_user", "uuid-utilisateur");
```

---

## 6. Gestion des erreurs

Toutes les API renvoient des erreurs dans un format coherent :

**400 — Validation (champs manquants ou invalides)**

```json
{
  "message": "Validation error",
  "issues": [
    {
      "code": "invalid_type",
      "path": ["amount"],
      "message": "Expected number, received string"
    }
  ]
}
```

**404 — Ressource introuvable**

```json
{ "message": "Transaction not found" }
```

**429 — Trop de requetes (rate limit)**

Se produit quand vous envoyez trop de requetes en peu de temps. Limites :
- Global : 100 req/min par IP
- Authentification : 10 req/min par IP
- Re-entrainement IA : 3 req/10 min par IP

```json
{
  "message": "Trop de requetes. Veuillez patienter avant de reessayer.",
  "retryAfterSeconds": 42
}
```

Utiliser `retryAfterSeconds` pour afficher un compte a rebours ou desactiver le bouton temporairement.

**500 — Erreur serveur**

```json
{ "message": "Internal server error" }
```

---

## 7. Resume rapide — tableau de reference

| Ecran / Fonction | Methode | Endpoint | Ce que ca retourne |
|-----------------|---------|----------|-------------------|
| Connexion (etape 1) | POST | `/bankapi/v1/auth/login-or-register` | `requiresOtp`, `userId`, `otpSentTo`, message (pas le profil) |
| Verifier OTP connexion | POST | `/bankapi/v1/auth/verify-otp` | Profil utilisateur (id, nom, email, tel, accountType, riskScore) |
| Seed demo | POST | `/bankapi/v1/users/seed-demo` | Liste d'utilisateurs crees |
| Liste statuts | GET | `/bankapi/v1/transactions/statuses` | `["OK", "VERIFY", "VERIFIED_BY_USER", "BLOCK"]` |
| Tableau transactions | GET | `/bankapi/v1/transactions?page=&pageSize=&status=&userId=` | Items pagines + pagination + filtres |
| Detail transaction | GET | `/bankapi/v1/transactions/{id}` | Transaction complete |
| Creer transaction | POST | `/bankapi/v1/transactions` | Score, statut, raisons, transactionId ; si VERIFY : + `requiresOtp`, `otpSentTo` |
| OTP transaction (VERIFY) | POST | `/bankapi/v1/transactions/{id}/verify-otp` | `transactionId`, `status` (ex. VERIFIED_BY_USER), message ; erreurs 400/403/410 |
| Localisations dispo | GET | `/bankapi/v1/locations` | Liste des villes simulables (code, coords, pays) |
| Simuler position | PUT | `/bankapi/v1/users/{id}/simulate-location` | Coordonnees mises a jour |
| Re-entrainement IA | POST | `/bankapi/v1/ml/retrain` | Confirmation + infos du declenchement |
| Auto-decouverte | GET | `/bankapi/config` | Toutes les URLs, version et config |
| Temps reel | Socket.IO | `wss://bankfraud.loophole.site/socket.io` | Evenement `transaction:scored` en push |
| Transaction verifiee OTP | Socket.IO | `wss://bankfraud.loophole.site/socket.io` | Evenement `transaction:verified` |
| Alerte premium | Socket.IO | `wss://bankfraud.loophole.site/socket.io` | Evenement `premium:fraud-alert` (notification banquier) |
| Stats IA globales | GET | `/bankapi/v1/ai/stats` | Compteurs par statut, score moyen, taux |
| Timeline IA | GET | `/bankapi/v1/ai/stats/timeline?period=&days=` | Evolution temporelle pour graphiques |
| Distribution scores | GET | `/bankapi/v1/ai/stats/distribution` | 10 buckets pour histogramme |
| Infos modele IA | GET | `/bankapi/v1/ai/model-info` | Statut, dernier retrain, feedback dispo |
| Health check IA | GET | `/bankapi/v1/ai/health` | Verifie si l'IA Python est en ligne + instructions depannage |
| Stats IA live | Socket.IO | `wss://bankfraud.loophole.site/socket.io` | Evenement `ai:stats-updated` |

---

## 8. Exemple complet JavaScript (fetch)

```javascript
const API = "https://bankfraud.loophole.site/bankapi/v1";

// 1. Connexion (2FA) — etape 1 : demande OTP
const loginStep = await fetch(`${API}/auth/login-or-register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    phoneNumber: "+243810000001",
    email: "jean.dupont@example.com",
    name: "Jean Dupont",
  }),
}).then(r => r.json());

console.log("OTP envoye vers:", loginStep.otpSentTo);

// etape 2 : verifier le code (a saisir dans l'UI)
const user = await fetch(`${API}/auth/verify-otp`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userId: loginStep.userId, code: "123456" }),
}).then(r => r.json());

console.log("Utilisateur:", user.id, user.accountType, user.email);

// 2. Liste paginee, filtree par BLOCK
const blocked = await fetch(`${API}/transactions?page=1&pageSize=10&status=BLOCK`)
  .then(r => r.json());

console.log("Bloquees:", blocked.pagination.total);
blocked.items.forEach(tx => console.log(tx.id, tx.riskScore, tx.reasons));

// 3. Creer une transaction
const result = await fetch(`${API}/transactions`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId: user.id,
    accountType: "CLASSIQUE",
    montantMoyenClient: 150,
    typeTransaction: "TRANSFERT",
    canalTransaction: "MOBILE",
    amount: 500,
    devise: "USD",
    transactionInternationale: false,
    latitude: -4.32,
    longitude: 15.31,
    typeAppareil: "ANDROID",
    typeReseau: "G4",
    nouvelAppareil: false,
    nouvelleLocalisation: true,
    nbTransactions1h: 2,
    nbTransactions24h: 5,
    ratioEcartMontant: 1.8,
  }),
}).then(r => r.json());

console.log("Score:", result.riskScore, "Statut:", result.status);

// 4. Re-entrainement IA (bouton)
const retrain = await fetch(`${API}/ml/retrain`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ initiatedBy: "dashboard", source: "bouton" }),
}).then(r => r.json());

console.log("Retrain:", retrain.message, retrain.ok);

// 5. Signaler une fraude
const dispute = await fetch(`${API}/disputes`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    transactionId: "uuid-transaction",
    userId: "uuid-utilisateur",
    reason: "Transaction non autorisée",
    description: "Je n'ai pas effectué ce virement de 500 USD.",
  }),
}).then(r => r.json());

console.log("Signalement:", dispute.dispute.id, "Gelé:", dispute.accountFrozen);

// 6. Traçabilité d'une transaction
const trace = await fetch(`${API}/transactions/${txId}/trace`).then(r => r.json());
console.log("IP:", trace.trace.ipAddress, "Device:", trace.trace.deviceFingerprint);
```

---

## 12. Système de signalement de fraude (Disputes)

### Workflow complet

```
Utilisateur signale → OPEN → (Banquier) INVESTIGATING → CONFIRMED / REJECTED
                                                          ↓
                                                  FRAUD_CONFIRMED (transaction)
                                                  → RESOLVED (dossier clôturé)
```

**Note importante :** Le remboursement/annulation ne peut pas se faire via l'application. Le client doit se rendre directement en agence bancaire.

### Endpoints

| Méthode | URL | Description |
|---------|-----|-------------|
| `POST` | `/disputes` | Signaler une fraude (gèle l'app automatiquement) |
| `GET` | `/disputes` | Lister les signalements (paginé, filtrable) |
| `GET` | `/disputes/stats` | Statistiques des signalements par statut |
| `GET` | `/disputes/:id` | Détail complet d'un signalement |
| `PATCH` | `/disputes/:id` | Mettre à jour le statut (workflow d'investigation) |
| `GET` | `/transactions/:id/trace` | Traçabilité complète d'une transaction |
| `POST` | `/users/:id/freeze` | Geler l'application d'un utilisateur |
| `POST` | `/users/:id/unfreeze` | Dégeler l'application d'un utilisateur |

### `POST /disputes` — Signaler une fraude

**Body :**
```json
{
  "transactionId": "uuid",
  "userId": "uuid",
  "reason": "Transaction non autorisée",
  "description": "Détails optionnels..."
}
```

**Réponse 201 :**
```json
{
  "dispute": {
    "id": "uuid",
    "transactionId": "...",
    "userId": "...",
    "reason": "Transaction non autorisée",
    "status": "OPEN",
    "createdAt": "..."
  },
  "accountFrozen": true,
  "message": "Signalement enregistré. Votre application a été gelée par mesure de sécurité. Veuillez vous rendre en agence bancaire pour le suivi."
}
```

### `GET /disputes` — Liste paginée

**Query params :** `page`, `pageSize`, `status` (OPEN/INVESTIGATING/CONFIRMED/REJECTED/RESOLVED), `userId`

### `PATCH /disputes/:id` — Workflow d'investigation

**Transitions autorisées :**
- `OPEN` → `INVESTIGATING` ou `REJECTED`
- `INVESTIGATING` → `CONFIRMED` ou `REJECTED`
- `CONFIRMED` → `RESOLVED`

**Body :**
```json
{
  "status": "CONFIRMED",
  "resolution": "Fraude confirmée. Client dirigé vers l'agence pour remboursement.",
  "resolvedBy": "agent-uuid"
}
```

### `GET /transactions/:id/trace` — Traçabilité complète

Retourne toutes les données d'investigation :
```json
{
  "transaction": { "id": "...", "amount": 500, "status": "BLOCK", "riskScore": 87, "..." },
  "trace": {
    "ipAddress": "192.168.1.1",
    "deviceFingerprint": "abc123...",
    "userAgent": "Mozilla/5.0 ...",
    "location": { "latitude": -4.32, "longitude": 15.31, "villeOrigine": "Kinshasa" },
    "wasNewDevice": true,
    "wasNewLocation": true,
    "typeAppareil": "ANDROID",
    "typeReseau": "G4",
    "transactionInternationale": false
  },
  "user": { "id": "...", "name": "...", "accountFrozen": true },
  "disputes": [{ "id": "...", "status": "OPEN", "reason": "..." }],
  "userHistory": {
    "recentTransactions": [ "..." ],
    "knownDevices": ["fingerprint1", "fingerprint2"],
    "knownIPs": ["192.168.1.1", "10.0.0.5"]
  }
}
```

### `POST /users/:id/freeze` — Geler l'application

**Body :** `{ "reason": "Activité suspecte détectée" }`

### `POST /users/:id/unfreeze` — Dégeler l'application

**Pas de body requis.**

### Événements Socket.IO — Signalements

| Événement | Quand | Payload |
|-----------|-------|---------|
| `dispute:opened` | Nouveau signalement | `{ disputeId, transactionId, userId, reason, timestamp }` |
| `dispute:updated` | Changement de statut | `{ disputeId, transactionId, userId, newStatus, resolution, timestamp }` |
| `account:frozen` | Application gelée | `{ userId, reason, timestamp }` |
| `account:unfrozen` | Application dégelée | `{ userId, timestamp }` |

### Comportement — Application gelée

Quand `accountFrozen: true` sur un utilisateur :
- **Toute tentative de transaction sera refusée (403)** avec le message : *"Votre application est gelée suite à un signalement de fraude. Veuillez vous rendre en agence bancaire."*
- Le frontend doit afficher un écran de blocage clair
- Le dégel se fait automatiquement quand tous les signalements sont résolus/rejetés, ou manuellement par un banquier

### Nouveau statut de transaction

`FRAUD_CONFIRMED` — utilisé quand un signalement est confirmé par un banquier (CONFIRMED). La transaction est alors marquée comme frauduleuse de manière définitive.

---

*Document genere pour l'equipe frontend. Swagger interactif : https://bankfraud.loophole.site/bankapi/api-docs*
