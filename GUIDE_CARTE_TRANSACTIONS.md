# Guide detaille — Carte interactive & Transactions

Ce document explique en detail le fonctionnement de la **carte interactive** (page `/carte`) et du **systeme de transactions** (creation, liste, detail, OTP, signalement) dans l'application Rawbank.

---

## 1. Carte interactive (`/carte`)

### 1.1 Acces

- Route : `/carte`
- Accessible uniquement aux utilisateurs **connectes**
- Lien dans la navbar : "Carte" (visible apres connexion)

### 1.2 Ce que la carte affiche

La carte est construite avec **Leaflet** (bibliotheque open source) via **React-Leaflet**. Elle est centree sur Kinshasa par defaut (coordonnees -4.325, 15.322, zoom 4).

**Marqueurs bleus** — Localisations disponibles :
Chargeees depuis l'API `GET /bankapi/v1/locations`, chaque ville est representee par un marqueur standard bleu. En cliquant sur un marqueur, un popup affiche le nom de la ville, le pays et le code interne.

Villes disponibles actuellement :
| Code | Ville | Pays |
|------|-------|------|
| KINSHASA | Kinshasa | RDC |
| PARIS | Paris | France |
| DUBAI | Dubai | Emirats Arabes Unis |
| MOROCCO | Casablanca | Maroc |
| BRAZZAVILLE | Brazzaville | Republique du Congo |

**Marqueur orange pulse** — Position de l'utilisateur :
Apres simulation, un marqueur orange avec un effet de pulsation anime apparait a la position choisie. Son popup affiche "Votre position" + ville et pays.

### 1.3 Simulation de localisation

**Objectif :** Tester la detection de fraude geographique. Si un utilisateur est "situe" a Kinshasa et effectue une transaction depuis Paris, le systeme detecte un deplacement suspect et peut bloquer la transaction.

**Fonctionnement :**
1. L'utilisateur choisit une ville dans le menu deroulant
2. Il clique sur "Mettre a jour"
3. L'API `PUT /bankapi/v1/users/{id}/simulate-location` est appelee avec le `code` de la ville
4. La position de l'utilisateur est mise a jour en base de donnees
5. La carte fait un "fly-to" anime vers la nouvelle position
6. Un message de confirmation s'affiche en vert

**API utilisee :**
```
PUT /bankapi/v1/users/{id}/simulate-location
Body: { "location": "PARIS" }
Reponse: { id, latitude, longitude, pays, ville }
```

### 1.4 Legende

- Cercle bleu = localisation disponible dans le systeme
- Cercle orange avec halo pulsant = position actuelle de l'utilisateur

### 1.5 Cas d'usage pour la demo

1. Aller sur `/carte`
2. Simuler sa position a **Kinshasa**
3. Aller sur `/nouvelle-transaction`
4. Creer une transaction avec localisation **Paris** + cocher "Nouvelle localisation"
5. Observer le resultat : la transaction sera probablement **BLOCK** ou **VERIFY** car la distance est suspecte

---

## 2. Transactions

### 2.1 Liste des transactions (`/mes-transactions`)

**Acces :** Route protegee, necessite une connexion.

**Profil utilisateur :**
En haut de la page, une carte glass affiche :
- Nom de l'utilisateur
- Email et telephone
- Type de compte (ETUDIANT, CLASSIQUE, PREMIUM, BUSINESS) en badge vert
- Score de risque global avec barre de progression coloree (vert < 30, orange < 60, rouge >= 60)

**Tableau des transactions :**
Chaque ligne affiche :
| Colonne | Description |
|---------|-------------|
| # | Numero sequentiel (pas l'UUID) |
| Montant | Montant + devise (ex: 500 USD) |
| Type | TRANSFERT, RETRAIT, DEPOT ou PAIEMENT |
| Statut | Badge colore (voir ci-dessous) |
| Risque | Mini barre de progression + score numerique |
| Date | Date formatee en francais |

**Codes couleur des statuts :**
| Statut | Couleur | Signification |
|--------|---------|---------------|
| OK | Vert | Transaction approuvee, aucun risque |
| VERIFY | Orange | Suspecte, verification OTP requise |
| VERIFIED_BY_USER | Bleu | Confirmee par l'utilisateur via OTP |
| BLOCK | Rouge | Bloquee, fraude probable |
| FRAUD_CONFIRMED | Rouge | Fraude confirmee par un banquier |

**Filtre par statut :**
Un menu deroulant permet de filtrer les transactions par statut.

**Pagination :**
La liste est paginee par 15 elements. Boutons "Precedent" et "Suivant" avec indicateur "Page X / Y".

**Temps reel :**
La liste se rafraichit automatiquement via Socket.IO quand un evenement `transaction:scored` ou `transaction:verified` est recu.

**API utilisee :**
```
GET /bankapi/v1/transactions?page=1&pageSize=15&userId={id}&status={filtre}
```

### 2.2 Creation de transaction (`/nouvelle-transaction`)

**Objectif :** Soumettre une transaction pour qu'elle soit analysee par l'IA anti-fraude.

**Champs du formulaire :**

| Champ | Type | Description |
|-------|------|-------------|
| Montant | Nombre | Montant de la transaction (obligatoire, > 0) |
| Devise | Select | USD ou CDF |
| Type de transaction | Select | TRANSFERT, RETRAIT, DEPOT, PAIEMENT |
| Canal | Select | MOBILE, USSD, WEB, POS, GAB, AGENCE |
| Appareil | Select | ANDROID, IOS, WEB, FEATURE_PHONE |
| Reseau | Select | G2, G3, G4, WIFI |
| Localisation | Select + bouton | Ville parmi celles de l'API + bouton "Simuler ma position" |
| Nouvel appareil | Checkbox | L'utilisateur utilise un appareil inconnu |
| Nouvelle localisation | Checkbox | L'utilisateur est dans un lieu inhabituel |
| Internationale | Checkbox | La transaction traverse une frontiere |

**Champs envoyes automatiquement (pas visibles par l'utilisateur) :**
- `userId` : ID de l'utilisateur connecte
- `accountType` : type de compte de l'utilisateur
- `montantMoyenClient` : 150 (valeur par defaut)
- `nbTransactions1h`, `nbTransactions24h`, `ratioEcartMontant` : valeurs par defaut

**Bouton "Simuler ma position" :**
A cote du select de localisation, ce bouton appelle `PUT /users/{id}/simulate-location` avec la ville selectionnee. Cela permet de placer l'utilisateur dans une ville avant d'envoyer la transaction, pour tester les scenarios de fraude geographique.

**API utilisee :**
```
POST /bankapi/v1/transactions
Body: { userId, accountType, amount, devise, typeTransaction, canalTransaction, ... }
```

### 2.3 Resultat de l'analyse

Apres soumission, l'IA analyse la transaction et retourne :
- **Score de risque** (0-100) : affiche en gros au centre
- **Statut** : badge colore
- **Temps de reponse IA** : en millisecondes

**Si le statut est BLOCK ou VERIFY :**
Un panneau d'explication colore s'affiche avec :
- Un titre clair :
  - BLOCK : *"Votre transaction a ete bloquee pour les motifs suivants :"*
  - VERIFY : *"Votre transaction necessite une verification supplementaire :"*
- La liste des **reasons** renvoyees par le backend (ex: "Montant eleve vs moyenne client", "Nouvelle localisation", "Deplacement geographique suspect")
- Si `requiresManualReview` est vrai : mention qu'un agent bancaire examinera la transaction

**Si le statut est VERIFY avec OTP requis :**
Un modal de saisie OTP 6 chiffres s'affiche :
- Le code est envoye par email a l'adresse masquee (`otpSentTo`)
- L'utilisateur saisit le code → appel `POST /transactions/{id}/verify-otp`
- Succes → statut passe a VERIFIED_BY_USER
- 3 echecs → statut passe a BLOCK

**Si le statut est OK :**
Les reasons sont affichees en vert (si presentes).

**Boutons apres le resultat :**
- "Nouvelle transaction" : reinitialise le formulaire
- "Voir mes transactions" : navigue vers la liste
- "Voir le detail" : navigue vers la page de detail de la transaction creee

### 2.4 Detail d'une transaction (`/transactions/:id`)

**Acces :** Clic sur une ligne dans la liste, ou via le bouton "Voir le detail" apres creation.

**Informations affichees :**

**En-tete :**
- Numero de transaction (ex: #47)
- Montant et devise en gros
- Badge de statut

**Barre de risque :**
- Score 0-100 avec barre coloree et valeur numerique

**Panneau d'explication (reasons) :**
Meme design que dans le resultat de creation :
- Fond rouge pour BLOCK/FRAUD_CONFIRMED
- Fond orange pour VERIFY
- Fond vert pour OK
- Liste des motifs de l'IA
- Mention de revue manuelle si applicable

**Grille de details :**
| Champ | Exemple |
|-------|---------|
| Type | TRANSFERT |
| Canal | MOBILE |
| Appareil | ANDROID |
| Reseau | G4 |
| Ville origine | Kinshasa |
| Ville destination | Lubumbashi |
| Nouvel appareil | Oui / Non |
| Nouvelle localisation | Oui / Non |
| Tx en 1h | 2 |
| Tx en 24h | 8 |
| Temps IA | 42ms |
| Date | 27/03/2026 14:30 |

### 2.5 Tracabilite

Un bouton "Voir la tracabilite complete" charge les donnees d'investigation via `GET /transactions/{id}/trace` :

| Donnee | Description |
|--------|-------------|
| Adresse IP | IP d'origine de la transaction |
| Empreinte appareil | Fingerprint unique du device |
| User Agent | Navigateur / application utilisee |
| Appareils connus | Nombre de devices habituels de l'utilisateur |
| IPs connues | Nombre d'IPs habituelles |
| Signalements lies | Nombre de disputes associees |

### 2.6 Signalement de fraude

Un bouton rouge "Signaler une fraude" en bas du detail permet de :
1. Creer un signalement via `POST /bankapi/v1/disputes`
2. L'application est **automatiquement gelee** (plus aucune transaction possible)
3. Un overlay fullscreen s'affiche avec le message "Votre compte est gele"
4. L'utilisateur doit se rendre en agence bancaire

**API utilisee :**
```
POST /bankapi/v1/disputes
Body: { transactionId, userId, reason: "Transaction non autorisee", description: "..." }
Reponse: { dispute, accountFrozen: true, message: "..." }
```

---

## 3. Flux complet de demo (scenario type)

### Scenario 1 — Transaction normale

1. Se connecter (`/connexion` → OTP → `/mes-transactions`)
2. Aller sur `/carte` → simuler position **Kinshasa**
3. Aller sur `/nouvelle-transaction`
4. Montant: 50 USD, Type: PAIEMENT, Canal: MOBILE, Localisation: Kinshasa
5. Resultat attendu : **OK** (score bas, pas de risque)

### Scenario 2 — Transaction suspecte (OTP)

1. Simuler position **Kinshasa** sur `/carte`
2. Creer une transaction de 2000 USD avec "Nouvelle localisation" coche
3. Resultat attendu : **VERIFY** (montant eleve + nouvelle localisation)
4. Modal OTP s'affiche → saisir le code recu par email
5. Apres validation : statut → **VERIFIED_BY_USER**

### Scenario 3 — Fraude geographique (BLOCK)

1. Simuler position **Kinshasa** sur `/carte`
2. Creer une transaction avec localisation **Paris** + cocher "Nouvelle localisation" + "Internationale"
3. Resultat attendu : **BLOCK** (deplacement impossible Kinshasa → Paris)
4. Panneau rouge avec explication : "Deplacement geographique suspect"

### Scenario 4 — Declaration de voyage pour eviter le blocage

1. Aller sur `/voyages` → declarer un voyage vers **Paris** (dates couvrant aujourd'hui)
2. Simuler position **Kinshasa** sur `/carte`
3. Creer une transaction depuis Paris
4. Resultat attendu : **VERIFY** au lieu de BLOCK (la declaration de voyage reduit la severite)

---

## 4. Resume des API utilisees

| Ecran | Methode | Endpoint | Description |
|-------|---------|----------|-------------|
| Carte — localisations | GET | `/locations` | Liste des villes disponibles |
| Carte — simulation | PUT | `/users/{id}/simulate-location` | Deplace l'utilisateur |
| Liste transactions | GET | `/transactions?page=&pageSize=&status=&userId=` | Paginee + filtre |
| Detail transaction | GET | `/transactions/{id}` | Objet complet |
| Tracabilite | GET | `/transactions/{id}/trace` | IP, device, historique |
| Creer transaction | POST | `/transactions` | Analyse IA + score |
| Verifier OTP transaction | POST | `/transactions/{id}/verify-otp` | Confirmer une VERIFY |
| Signaler fraude | POST | `/disputes` | Cree un signalement + gele le compte |
| Simulation position (dans formulaire) | PUT | `/users/{id}/simulate-location` | Bouton "Simuler ma position" |

---

*Ce guide couvre les pages `/carte`, `/mes-transactions`, `/nouvelle-transaction` et `/transactions/:id` de l'application Rawbank.*
