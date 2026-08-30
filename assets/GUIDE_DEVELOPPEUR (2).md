# Guide Developpeur — Application Anti-fraude Bancaire

Document complet a destination du developpeur **web (React + Vite)** et **mobile (React Native)**.
Contient toutes les API, les types TypeScript, les exemples de code et les bonnes pratiques.

---

## Table des matieres

1. [Contexte du projet](#1-contexte-du-projet)
2. [Architecture API](#2-architecture-api)
3. [Interfaces TypeScript](#3-interfaces-typescript)
4. [Configuration initiale](#4-configuration-initiale)
5. [API detaillee par ecran](#5-api-detaillee-par-ecran)
6. [Temps reel — Socket.IO](#6-temps-reel--socketio)
7. [Gestion des erreurs](#7-gestion-des-erreurs)
8. [Bonnes pratiques et conseils UX](#8-bonnes-pratiques-et-conseils-ux)
9. [Tableau de reference rapide](#9-tableau-de-reference-rapide)

---

## 1. Contexte du projet

L'application est un systeme bancaire de **detection de fraude en temps reel**. Le flux principal est le suivant :

```
Utilisateur (mobile/web)
    |
    | 1. Se connecte (telephone + email) puis valide le code OTP
    | 2. Effectue une transaction
    v
Backend Node.js (Express)
    |
    | 3. Envoie les donnees au moteur IA (Python ou simulateur integre)
    | 4. Calcule le score de risque (0-100)
    | 5. Determine le statut : OK / VERIFY / BLOCK / VERIFIED_BY_USER
    | 6. Persiste en base (PostgreSQL)
    v
Resultat retourne au client + diffuse en temps reel (Socket.IO)
    |
    v
Dashboard (web) : affiche les transactions, scores, alertes en live
Application mobile : recoit les notifications, simule la localisation
```

**Ce que fait le backend pour vous :**
- Gere l'authentification en deux etapes : telephone + email obligatoire, puis code OTP envoye par email (pas de mot de passe)
- Analyse chaque transaction via une IA et des regles metier
- Retourne un score de risque, un statut et des raisons textuelles
- Diffuse les resultats en temps reel via WebSocket
- Fournit une pagination, des filtres et un endpoint de re-entrainement IA

**Ce que vous devez faire :**
- Construire les ecrans (connexion, dashboard, detail, formulaire de transaction, etc.)
- Appeler les API REST documentees ci-dessous
- Ecouter les evenements Socket.IO pour les mises a jour en live

---

## 2. Architecture API

### Base URL

```
https://bankfraud.loophole.site/bankapi/v1
```

> En developpement local (si le backend tourne sur votre machine) :
> `http://localhost:3000/bankapi/v1`

### Versioning

Tous les endpoints metier sont sous `/bankapi/v1/`. Quand une v2 arrivera, les endpoints v1 resteront fonctionnels.

| Type | URL | Versionne |
|------|-----|-----------|
| Endpoints metier | `/bankapi/v1/...` | Oui |
| Auto-decouverte | `/bankapi/config` | Non |
| Documentation Swagger | `/bankapi/api-docs` | Non |

### Auto-decouverte

Au lieu de coder les URLs en dur, appelez une seule fois :

```
GET /bankapi/config
```

La reponse contient toutes les URLs dynamiquement. Si l'URL publique change (nouveau tunnel, deploiement), les endpoints retournes s'adaptent automatiquement.

### Headers requis

Toutes les requetes `POST` et `PUT` doivent inclure :

```
Content-Type: application/json
```

Le backend accepte les requetes de n'importe quelle origine (CORS ouvert).

---

## 3. Interfaces TypeScript

Copiez-collez ces types dans un fichier `types/api.ts` de votre projet. Ils correspondent exactement a ce que le backend envoie et recoit.

### Enums

```typescript
export type TypeCompte = "ETUDIANT" | "CLASSIQUE" | "PREMIUM" | "BUSINESS";

export type TransactionStatus = "OK" | "VERIFY" | "BLOCK" | "VERIFIED_BY_USER";

export type TypeTransaction = "TRANSFERT" | "RETRAIT" | "DEPOT" | "PAIEMENT";

export type CanalTransaction = "MOBILE" | "USSD" | "WEB" | "POS" | "GAB" | "AGENCE";

export type Devise = "CDF" | "USD";

export type TypeAppareil = "ANDROID" | "IOS" | "WEB" | "FEATURE_PHONE";

export type TypeReseau = "G2" | "G3" | "G4" | "WIFI";
```

### Utilisateur

```typescript
export interface User {
  id: string;
  name: string | null;
  email: string | null;
  phoneNumber: string;
  accountType: TypeCompte;
  riskScore: number;
}
```

### Transaction (objet complet retourne par le backend)

```typescript
export interface Transaction {
  id: string;
  numero?: number;
  userId: string;
  userName: string | null;
  accountType: TypeCompte;
  montantMoyenClient: number;
  typeTransaction: TypeTransaction;
  canalTransaction: CanalTransaction;
  amount: number;
  devise: Devise;
  paysDestination: string | null;
  villeOrigine: string | null;
  villeDestination: string | null;
  transactionInternationale: boolean;
  latitude: number;
  longitude: number;
  typeAppareil: TypeAppareil;
  typeReseau: TypeReseau;
  nouvelAppareil: boolean;
  nouvelleLocalisation: boolean;
  nbTransactions1h: number;
  nbTransactions24h: number;
  ratioEcartMontant: number;
  riskScore: number;
  aiResponseTimeMs: number;
  status: TransactionStatus;
  reasons: string[];
  requiresManualReview: boolean;
  timestamp: string;
  createdAt: string;
}
```

### Donnees a envoyer pour creer une transaction

```typescript
export interface TransactionCreateInput {
  userId: string;
  accountType: TypeCompte;
  montantMoyenClient: number;
  typeTransaction: TypeTransaction;
  canalTransaction: CanalTransaction;
  amount: number;
  devise: Devise;
  paysDestination?: string | null;
  villeOrigine?: string | null;
  villeDestination?: string | null;
  transactionInternationale: boolean;
  latitude: number;
  longitude: number;
  typeAppareil: TypeAppareil;
  typeReseau: TypeReseau;
  nouvelAppareil: boolean;
  nouvelleLocalisation: boolean;
  nbTransactions1h: number;
  nbTransactions24h: number;
  ratioEcartMontant: number;
  timestamp?: string;
}
```

### Resultat d'analyse apres creation

```typescript
export interface TransactionAnalyzeResult {
  transactionId: string;
  riskScore: number;
  aiResponseTimeMs: number;
  status: TransactionStatus;
  reasons: string[];
  requiresManualReview: boolean;
  /** Present quand le statut est VERIFY et qu'un OTP a ete envoye par email pour valider la transaction. */
  requiresOtp?: boolean;
  /** Email masque (ex: e***r@gmail.com) vers lequel l'OTP a ete envoye. */
  otpSentTo?: string;
}
```

### Localisation

```typescript
export interface LocationMeta {
  code: string;
  latitude: number;
  longitude: number;
  pays: string;
  ville: string;
}

export interface LocationUpdateResult {
  id: string;
  latitude: number;
  longitude: number;
  pays: string;
  ville: string;
}
```

### Pagination

```typescript
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    status: TransactionStatus | null;
    userId: string | null;
  };
}
```

### Evenement temps reel

```typescript
export interface TransactionScoredEvent {
  transactionId: string;
  userId: string;
  riskScore: number;
  status: TransactionStatus;
  reasons: string[];
  requiresManualReview: boolean;
}

export interface PremiumFraudAlertEvent {
  transactionId: string;
  userId: string;
  userName: string | null;
  email: string | null;
  amount: number;
  devise: string;
  riskScore: number;
  reasons: string[];
  requiresManualReview: boolean;
  timestamp: string;
}

/** Reponse de l'etape 1 de la connexion / inscription (OTP envoye par email). */
export interface OtpRequiredResponse {
  requiresOtp: true;
  userId: string;
  otpSentTo: string;
  message: string;
}

/** Body pour valider le code OTP apres login-or-register. */
export interface VerifyOtpInput {
  userId: string;
  code: string;
}

/** Evenement Socket.IO emis quand une transaction passe en VERIFIED_BY_USER apres validation OTP. */
export interface TransactionVerifiedEvent {
  transactionId: string;
  userId: string;
  previousStatus: string;
  newStatus: "VERIFIED_BY_USER";
}
```

### Configuration auto-decouverte

```typescript
export interface ApiConfig {
  apiBaseUrl: string;
  apiVersionedUrl: string;
  apiVersion: string;
  publicBaseUrl: string;
  apiPrefix: string;
  socketPath: string;
  socketUrl: string;
  docs: string;
  endpoints: {
    transactions: string;
    statuses: string;
    auth: string;
    seedDemo: string;
    locations: string;
    simulateLocation: string;
    mlRetrain: string;
    aiStats: string;
    aiTimeline: string;
    aiDistribution: string;
    aiModelInfo: string;
  };
}
```

### Statistiques et modele IA

```typescript
/** Statistiques globales de performance IA */
export interface AiGlobalStats {
  totalTransactions: number;
  byStatus: Record<TransactionStatus, number>;
  averageRiskScore: number;
  falsePositiveRate: number;
  blockRate: number;
  verifyRate: number;
  todayCount: number;
  last24hCount: number;
  aiResponseTime: {
    avgMs: number;
    minMs: number;
    maxMs: number;
  };
}

/** Point de donnees pour la timeline */
export interface AiTimelineEntry {
  date: string;
  total: number;
  ok: number;
  verify: number;
  block: number;
  verifiedByUser: number;
  avgRiskScore: number;
}

/** Reponse timeline */
export interface AiTimeline {
  period: "hour" | "day" | "week";
  data: AiTimelineEntry[];
}

/** Bucket de score pour l'histogramme */
export interface AiScoreBucket {
  min: number;
  max: number;
  label: string;
  count: number;
}

/** Distribution des scores */
export interface AiScoreDistribution {
  buckets: AiScoreBucket[];
}

/** Informations du modele IA */
export interface AiModelInfo {
  status: "active";
  lastRetrainAt: string | null;
  transactionsSinceRetrain: number;
  feedbackAvailable: {
    verifiedByUser: number;
    blocked: number;
    pendingVerify: number;
  };
}

/** Reponse du re-entrainement enrichi */
export interface RetrainResult {
  ok: boolean;
  message: string;
  feedbackSent: number;
  lastRetrainAt: string | null;
  mode: "remote";
  endpoint: string;
  upstream: unknown;
}

/** Evenement Socket.IO ai:stats-updated */
export interface AiStatsUpdatedEvent {
  totalTransactions: number;
  lastRiskScore: number;
  lastStatus: string;
  lastResponseTimeMs: number;
  todayCount: number;
  timestamp: string;
}

/** Resultat du health check du service IA */
export interface AiHealthCheck {
  aiService: {
    online: boolean;
    url: string | null;
    responseTimeMs: number | null;
    error: string | null;
    mode: "remote" | "simulated" | "fallback";
  };
  fallbackActive: boolean;
  message: string;
  instructions?: string[];
}
```

---

## 4. Configuration initiale

### 4.1 Installation des dependances

**React + Vite (web) :**

```bash
npm install socket.io-client
```

**React Native (mobile) :**

```bash
npm install socket.io-client
```

> `socket.io-client` fonctionne sur les deux plateformes sans configuration speciale.

### 4.2 Fichier `api.ts` — client API generique

Creez un fichier `src/api.ts` (ou `src/services/api.ts`) :

```typescript
const API_BASE = "https://bankfraud.loophole.site/bankapi/v1";

export async function api<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message ?? "Erreur serveur", body.issues);
  }

  return res.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public issues?: Array<{ code: string; path: string[]; message: string }>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
```

### 4.3 Hook `useApi` pour React / React Native

```typescript
import { useState, useCallback } from "react";
import { api, ApiError } from "./api";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const call = useCallback(async (endpoint: string, options?: RequestInit) => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await api<T>(endpoint, options);
      setState({ data, loading: false, error: null });
      return data;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Erreur reseau";
      setState({ data: null, loading: false, error: message });
      throw err;
    }
  }, []);

  return { ...state, call };
}
```

### 4.4 Variante React Native — gestion reseau

Sur mobile, le reseau peut couper a tout moment. Ajoutez un wrapper :

```typescript
import NetInfo from "@react-native-community/netinfo";
import { api } from "./api";

export async function apiMobile<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) {
    throw new Error("Pas de connexion internet");
  }
  return api<T>(endpoint, options);
}
```

---

## 5. API detaillee par ecran

### 5.1 Connexion / Inscription (2FA par email — OTP)

**Quand l'utiliser :** Ecran de connexion de l'application. Le flux est en **deux etapes** : l'utilisateur saisit telephone, **email (obligatoire)** et optionnellement son nom ; le serveur envoie un code OTP par email ; l'utilisateur saisit le code pour obtenir sa session (profil complet). Si le compte n'existe pas, il est cree a la premiere etape.

#### Etape 1 — Demander le code OTP

**Requete**

```
POST /bankapi/v1/auth/login-or-register
```

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `phoneNumber` | string | Oui | Numero au format international : `+243810000001` |
| `email` | string | **Oui** | Adresse email valide (OTP envoye a cette adresse) |
| `name` | string | Non | Nom de l'utilisateur (utilise surtout a la creation du compte) |

**Exemple de body :**

```json
{
  "phoneNumber": "+243810000001",
  "email": "jean.dupont@gmail.com",
  "name": "Jean Dupont"
}
```

**Reponse 200 (toujours OTP requis) :**

```json
{
  "requiresOtp": true,
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "otpSentTo": "j***t@gmail.com",
  "message": "Un code de verification a ete envoye a votre adresse email."
}
```

| Champ reponse | Type | Description |
|---------------|------|-------------|
| `requiresOtp` | `true` | Indique que l'etape 2 est obligatoire |
| `userId` | string (UUID) | **A conserver** pour l'appel `verify-otp` et les transactions |
| `otpSentTo` | string | Email masque affichable a l'utilisateur (ex: `e***r@gmail.com`) |
| `message` | string | Message informatif (peut etre affiche tel quel) |

#### Etape 2 — Valider le code OTP

**Requete**

```
POST /bankapi/v1/auth/verify-otp
```

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `userId` | string | Oui | UUID retourne a l'etape 1 |
| `code` | string | Oui | Code a 6 chiffres recu par email |

**Exemple de body :**

```json
{
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "code": "123456"
}
```

**Reponse 200 (succes) — profil utilisateur complet :**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Jean Dupont",
  "email": "jean.dupont@gmail.com",
  "phoneNumber": "+243810000001",
  "accountType": "CLASSIQUE",
  "riskScore": 15
}
```

| Champ reponse | Type | Description |
|---------------|------|-------------|
| `id` | string (UUID) | Identifiant unique. **A stocker pour tous les appels suivants** (equivalent a `userId`). |
| `name` | string ou null | Nom de l'utilisateur |
| `email` | string ou null | Email du compte |
| `phoneNumber` | string | Numero de telephone |
| `accountType` | TypeCompte | `ETUDIANT`, `CLASSIQUE`, `PREMIUM`, `BUSINESS` |
| `riskScore` | number (0-100) | Score de risque global de l'utilisateur |

**Erreurs courantes (verify-otp) :**

| Code HTTP | Signification |
|-----------|---------------|
| **400** | Code incorrect. Le corps peut inclure `remainingAttempts` (nombre de tentatives restantes avant blocage). |
| **410** | Code expire : demander un nouvel OTP via l'etape 1. |
| **429** | Compte ou flux temporairement bloque (trop d'echecs) : delai avant nouvel essai. |

**Exemple React — etape 1 puis etape 2 :**

```tsx
import { api, ApiError } from "../api";
import type { OtpRequiredResponse, User, VerifyOtpInput } from "../types/api";

async function requestLoginOtp(phoneNumber: string, email: string, name?: string) {
  return api<OtpRequiredResponse>("/auth/login-or-register", {
    method: "POST",
    body: JSON.stringify({ phoneNumber, email, name }),
  });
}

async function verifyLoginOtp(input: VerifyOtpInput) {
  const user = await api<User>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(input),
  });
  // Stocker user (context, zustand, localStorage, etc.)
  return user;
}
```

**Exemple React — formulaire de verification OTP (6 chiffres) :**

```tsx
import { useState, useRef, useCallback, FormEvent, type KeyboardEvent } from "react";
import { api, ApiError } from "../api";
import type { User } from "../types/api";

type Props = {
  userId: string;
  otpSentTo: string;
  onSuccess: (user: User) => void;
};

export function OtpVerificationForm({ userId, otpSentTo, onSuccess }: Props) {
  const [digits, setDigits] = useState<string[]>(() => Array(6).fill(""));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setDigitAt = useCallback((index: number, value: string) => {
    const d = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = d;
      return next;
    });
    if (d && index < 5) inputsRef.current[index + 1]?.focus();
  }, []);

  const onKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
    setDigits(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputsRef.current[focusIdx]?.focus();
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Saisissez les 6 chiffres du code.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await api<User>("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ userId, code }),
      });
      onSuccess(user);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 410) setError("Code expire. Demandez un nouveau code.");
        else if (err.status === 429) setError("Trop de tentatives. Reessayez plus tard.");
        else setError(err.message);
      } else setError("Erreur reseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p>Code envoye a {otpSentTo}</p>
      <div style={{ display: "flex", gap: 8 }} onPaste={onPaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputsRef.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            autoFocus={i === 0}
            onChange={(e) => setDigitAt(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            style={{ width: 40, textAlign: "center", fontSize: 20 }}
          />
        ))}
      </div>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Verification..." : "Valider"}
      </button>
    </form>
  );
}
```

**React Native — stocker l'utilisateur apres verify-otp :**

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User, VerifyOtpInput } from "../types/api";
import { api } from "../api";

async function verifyLoginOtpNative(input: VerifyOtpInput) {
  const user = await api<User>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(input),
  });
  await AsyncStorage.setItem("user", JSON.stringify(user));
  return user;
}
```

---

### 5.2 Dashboard — Liste des transactions (paginee + filtres)

**Quand l'utiliser :** Ecran principal du dashboard. Affiche un tableau/liste de toutes les transactions avec pagination et filtres optionnels.

**Requete**

```
GET /bankapi/v1/transactions
```

**Parametres query (tous optionnels) :**

| Parametre | Type | Defaut | Min | Max | Description |
|-----------|------|--------|-----|-----|-------------|
| `page` | number | 1 | 1 | - | Numero de la page (commence a 1) |
| `pageSize` | number | 20 | 1 | 100 | Nombre d'elements par page |
| `status` | string | - | - | - | Filtrer par statut : `OK`, `VERIFY`, `BLOCK` ou `VERIFIED_BY_USER` |
| `userId` | string | - | - | - | Filtrer par ID utilisateur |

**Exemples d'appels :**

```
GET /bankapi/v1/transactions?page=1&pageSize=20
GET /bankapi/v1/transactions?page=2&pageSize=10&status=BLOCK
GET /bankapi/v1/transactions?userId=a1b2c3d4-...&page=1&pageSize=50
```

**Reponse 200 :**

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
      "status": "VERIFY",
      "reasons": ["Montant eleve vs moyenne client", "Nouvelle localisation"],
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

| Champ item | Type | Description |
|------------|------|-------------|
| `numero` | number | Numero sequentiel d'affichage (1 = plus ancienne, N = plus recente). Utiliser pour l'affichage au lieu de l'UUID. |
| `userName` | string ou null | Nom de l'utilisateur rattache a la transaction |
| `id` | string (UUID) | Identifiant interne. Utiliser pour `GET /transactions/{id}`. |

| Champ pagination | Type | Description |
|------------------|------|-------------|
| `page` | number | Page actuelle |
| `pageSize` | number | Taille de la page |
| `total` | number | Nombre total de transactions (toutes pages) |
| `totalPages` | number | Nombre total de pages |
| `hasNext` | boolean | `true` s'il y a une page suivante |
| `hasPrev` | boolean | `true` s'il y a une page precedente |

**Exemple React — hook de liste paginee :**

```tsx
import { useState, useEffect } from "react";
import { api } from "../api";
import type { Transaction, TransactionStatus, PaginatedResponse } from "../types/api";

interface Filters {
  page: number;
  pageSize: number;
  status?: TransactionStatus;
  userId?: string;
}

function useTransactions(filters: Filters) {
  const [data, setData] = useState<PaginatedResponse<Transaction> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(filters.page));
    params.set("pageSize", String(filters.pageSize));
    if (filters.status) params.set("status", filters.status);
    if (filters.userId) params.set("userId", filters.userId);

    setLoading(true);
    api<PaginatedResponse<Transaction>>(`/transactions?${params}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [filters.page, filters.pageSize, filters.status, filters.userId]);

  return { data, loading };
}
```

**Exemple de composant Dashboard :**

```tsx
function TransactionDashboard() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | undefined>();
  const { data, loading } = useTransactions({ page, pageSize: 20, status: statusFilter });

  if (loading) return <p>Chargement...</p>;
  if (!data) return null;

  return (
    <div>
      {/* Filtre par statut */}
      <select onChange={(e) => { setStatusFilter(e.target.value as TransactionStatus || undefined); setPage(1); }}>
        <option value="">Tous les statuts</option>
        <option value="OK">OK</option>
        <option value="VERIFY">VERIFY</option>
        <option value="VERIFIED_BY_USER">VERIFIED_BY_USER</option>
        <option value="BLOCK">BLOCK</option>
      </select>

      {/* Liste */}
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Utilisateur</th>
            <th>Montant</th>
            <th>Type</th>
            <th>Score</th>
            <th>Statut</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((tx) => (
            <tr key={tx.id}>
              <td>{tx.numero}</td>
              <td>{tx.userName ?? "—"}</td>
              <td>{tx.amount} {tx.devise}</td>
              <td>{tx.typeTransaction}</td>
              <td>{tx.riskScore}</td>
              <td>{tx.status}</td>
              <td>{new Date(tx.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <button disabled={!data.pagination.hasPrev} onClick={() => setPage(page - 1)}>
        Precedent
      </button>
      <span>Page {data.pagination.page} / {data.pagination.totalPages}</span>
      <button disabled={!data.pagination.hasNext} onClick={() => setPage(page + 1)}>
        Suivant
      </button>
    </div>
  );
}
```

---

### 5.3 Detail d'une transaction

**Quand l'utiliser :** Quand l'utilisateur clique sur une transaction dans la liste pour voir tous les details.

**Requete**

```
GET /bankapi/v1/transactions/{id}
```

Remplacer `{id}` par l'UUID de la transaction.

**Reponse 200 :** Meme structure qu'un element de `items` dans la liste (voir `Transaction` dans les types).

**Reponse 404 :**

```json
{ "message": "Transaction not found" }
```

**Exemple React :**

```tsx
async function getTransaction(id: string): Promise<Transaction> {
  return api<Transaction>(`/transactions/${id}`);
}
```

---

### 5.4 Creer une transaction (formulaire ou simulation)

**Quand l'utiliser :** Formulaire de creation de transaction (ou simulation automatique). C'est l'endpoint principal qui declenche l'analyse anti-fraude par l'IA.

**Requete**

```
POST /bankapi/v1/transactions
```

**Champs du body :**

| Champ | Type | Obligatoire | Description | Valeurs possibles |
|-------|------|-------------|-------------|-------------------|
| `userId` | string | Oui | UUID de l'utilisateur connecte | - |
| `accountType` | string | Oui | Type de compte | `ETUDIANT`, `CLASSIQUE`, `PREMIUM`, `BUSINESS` |
| `montantMoyenClient` | number | Oui | Montant moyen habituel du client (dans la devise choisie) | > 0 |
| `typeTransaction` | string | Oui | Nature de l'operation | `TRANSFERT`, `RETRAIT`, `DEPOT`, `PAIEMENT` |
| `canalTransaction` | string | Oui | Canal utilise | `MOBILE`, `USSD`, `WEB`, `POS`, `GAB`, `AGENCE` |
| `amount` | number | Oui | Montant de la transaction | > 0 |
| `devise` | string | Oui | Devise | `CDF` (Franc congolais), `USD` (Dollar) |
| `paysDestination` | string | Non | Pays de destination | Texte libre |
| `villeOrigine` | string | Non | Ville d'origine | Texte libre |
| `villeDestination` | string | Non | Ville de destination | Texte libre |
| `transactionInternationale` | boolean | Oui | La transaction est-elle internationale ? | `true` / `false` |
| `latitude` | number | Oui | Latitude GPS de l'utilisateur | -90 a 90 |
| `longitude` | number | Oui | Longitude GPS de l'utilisateur | -180 a 180 |
| `typeAppareil` | string | Oui | Type d'appareil utilise | `ANDROID`, `IOS`, `WEB`, `FEATURE_PHONE` |
| `typeReseau` | string | Oui | Type de connexion reseau | `G2`, `G3`, `G4`, `WIFI` |
| `nouvelAppareil` | boolean | Oui | Est-ce un nouvel appareil pour ce compte ? | `true` / `false` |
| `nouvelleLocalisation` | boolean | Oui | Est-ce une nouvelle localisation ? | `true` / `false` |
| `nbTransactions1h` | number | Oui | Nombre de transactions de ce client dans la derniere heure | >= 0, entier |
| `nbTransactions24h` | number | Oui | Nombre de transactions de ce client dans les dernieres 24h | >= 0, entier |
| `ratioEcartMontant` | number | Oui | Ratio ecart entre le montant et la moyenne du client (ex: 1.5 = 50% au-dessus) | >= 0 |
| `timestamp` | string (ISO) | Non | Date/heure de la transaction (defaut = maintenant) | Format ISO 8601 |

**Exemple de body complet :**

```json
{
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
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

**Reponse 201 (succes) :**

Lorsque le statut est **`VERIFY`**, la reponse peut inclure **`requiresOtp: true`** et **`otpSentTo`** (email masque) : un code OTP est alors envoye par email ; l'utilisateur doit appeler `POST /transactions/{id}/verify-otp` pour confirmer la transaction (voir ci-dessous).

```json
{
  "transactionId": "uuid-de-la-transaction-creee",
  "riskScore": 55,
  "status": "VERIFY",
  "reasons": [
    "Montant superieur a la moyenne client",
    "Nouvelle localisation"
  ],
  "requiresManualReview": false,
  "requiresOtp": true,
  "otpSentTo": "j***t@gmail.com"
}
```

Exemple sans OTP (statut `OK` ou `VERIFY` sans envoi OTP selon regles metier) :

```json
{
  "transactionId": "uuid-de-la-transaction-creee",
  "riskScore": 12,
  "status": "OK",
  "reasons": [],
  "requiresManualReview": false
}
```

| Champ reponse | Type | Description |
|---------------|------|-------------|
| `transactionId` | string (UUID) | ID de la transaction creee. Peut servir pour naviguer vers le detail. |
| `riskScore` | number (0-100) | Score de risque calcule par l'IA. 0 = pas de risque, 100 = fraude certaine. |
| `status` | TransactionStatus | `OK` = approuvee, `VERIFY` = a verifier, `BLOCK` = bloquee, `VERIFIED_BY_USER` = confirmee par OTP utilisateur. |
| `reasons` | string[] | Liste des raisons qui ont contribue au score (en francais). |
| `requiresManualReview` | boolean | `true` si la transaction necessite une verification manuelle. |
| `requiresOtp` | boolean (optionnel) | `true` si un OTP transaction a ete envoye ; afficher l'ecran de saisie du code. |
| `otpSentTo` | string (optionnel) | Email masque vers lequel l'OTP a ete envoye. |

**Reponse 404 (utilisateur introuvable) :**

```json
{ "message": "Utilisateur introuvable. Connectez-vous d'abord." }
```

**Exemple React :**

```tsx
import { api } from "../api";
import type { TransactionCreateInput, TransactionAnalyzeResult } from "../types/api";

async function createTransaction(input: TransactionCreateInput) {
  return api<TransactionAnalyzeResult>("/transactions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
```

#### Verification OTP d'une transaction (statut VERIFY)

Quand la creation retourne `status: "VERIFY"` avec `requiresOtp: true`, l'utilisateur doit saisir le code recu par email. En cas de **3 echecs** consecutifs de verification, le statut de la transaction passe en **`BLOCK`**.

**Requete**

```
POST /bankapi/v1/transactions/{id}/verify-otp
```

Remplacer `{id}` par l'UUID de la transaction (`transactionId` de la reponse de creation).

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `userId` | string | Oui | UUID de l'utilisateur connecte (doit correspondre au proprietaire de la transaction) |
| `code` | string | Oui | Code OTP a 6 chiffres recu par email |

**Exemple de body :**

```json
{
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "code": "123456"
}
```

**Reponse 200 (succes) :** la transaction est mise a jour ; le statut devient **`VERIFIED_BY_USER`**. Le corps renvoye suit la meme forme qu'un `GET /transactions/{id}` (objet `Transaction` complet) ou un message de succes selon l'implementation — consulter la reponse reelle dans les outils de developpement.

**Erreurs :** memes principes que pour `auth/verify-otp` : **400** (code incorrect, tentatives restantes eventuelles), **410** (code expire), **429** ou blocage apres trop d'echecs menant au statut **BLOCK**.

**Exemple React :**

```tsx
import { api } from "../api";
import type { Transaction } from "../types/api";

async function verifyTransactionOtp(
  transactionId: string,
  userId: string,
  code: string,
): Promise<Transaction> {
  return api<Transaction>(`/transactions/${transactionId}/verify-otp`, {
    method: "POST",
    body: JSON.stringify({ userId, code }),
  });
}

// Apres createTransaction, si result.requiresOtp :
// await verifyTransactionOtp(result.transactionId, currentUser.id, codeFromForm);
```

**React Native — obtenir les coordonnees GPS automatiquement :**

```typescript
import * as Location from "expo-location";

async function getCurrentCoords() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    return { latitude: -4.325, longitude: 15.322 }; // Kinshasa par defaut
  }
  const loc = await Location.getCurrentPositionAsync({});
  return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
}
```

---

### 5.5 Gestion de la localisation

#### 5.5.1 Lister les localisations disponibles

**Quand l'utiliser :** Pour remplir un menu deroulant / picker permettant a l'utilisateur de choisir une ville pour la simulation de localisation.

**Requete**

```
GET /bankapi/v1/locations
```

Pas de parametres.

**Reponse 200 :**

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

| Champ | Type | Description |
|-------|------|-------------|
| `code` | string | Code unique de la ville. **C'est cette valeur qu'il faut envoyer pour simuler la localisation.** |
| `latitude` | number | Latitude GPS |
| `longitude` | number | Longitude GPS |
| `pays` | string | Nom du pays |
| `ville` | string | Nom de la ville (affichage) |

**Exemple React — Picker de localisation :**

```tsx
import { useState, useEffect } from "react";
import { api } from "../api";
import type { LocationMeta } from "../types/api";

function LocationPicker({ onSelect }: { onSelect: (code: string) => void }) {
  const [locations, setLocations] = useState<LocationMeta[]>([]);

  useEffect(() => {
    api<{ locations: LocationMeta[] }>("/locations").then((r) => setLocations(r.locations));
  }, []);

  return (
    <select onChange={(e) => onSelect(e.target.value)}>
      <option value="">Choisir une ville...</option>
      {locations.map((loc) => (
        <option key={loc.code} value={loc.code}>
          {loc.ville} ({loc.pays})
        </option>
      ))}
    </select>
  );
}
```

**React Native — Picker :**

```tsx
import { Picker } from "@react-native-picker/picker";

function LocationPickerNative({ locations, onSelect }) {
  return (
    <Picker onValueChange={onSelect}>
      <Picker.Item label="Choisir une ville..." value="" />
      {locations.map((loc) => (
        <Picker.Item key={loc.code} label={`${loc.ville} (${loc.pays})`} value={loc.code} />
      ))}
    </Picker>
  );
}
```

#### 5.5.2 Simuler la localisation d'un utilisateur

**Quand l'utiliser :** Quand l'utilisateur choisit une ville dans le picker et confirme. Cela met a jour ses coordonnees GPS cote serveur (utile pour les tests de fraude geographique).

**Requete**

```
PUT /bankapi/v1/users/{id}/simulate-location
```

Remplacer `{id}` par l'UUID de l'utilisateur.

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `location` | string | Oui | Le `code` d'une ville retournee par `GET /locations` (ex: `KINSHASA`, `PARIS`, etc.) |

**Exemple de body :**

```json
{
  "location": "PARIS"
}
```

**Reponse 200 :**

```json
{
  "id": "uuid-utilisateur",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "pays": "France",
  "ville": "Paris"
}
```

**Exemple React :**

```tsx
async function simulateLocation(userId: string, locationCode: string) {
  return api<LocationUpdateResult>(`/users/${userId}/simulate-location`, {
    method: "PUT",
    body: JSON.stringify({ location: locationCode }),
  });
}
```

---

### 5.6 Re-entrainement IA (bouton admin)

**Quand l'utiliser :** Bouton dans le dashboard admin pour declencher le re-entrainement du modele d'IA par algorithme de renforcement. L'appel est long (jusqu'a 2 minutes).

**Requete**

```
POST /bankapi/v1/ml/retrain
```

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `initiatedBy` | string | Non | Qui a declenche (ex: `"admin-dashboard"`) |
| `source` | string | Non | Source (ex: `"bouton_retrain"`) |

Le body est optionnel. Vous pouvez envoyer `{}`.

**Reponse 202 (succes) :**

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

Le bouton collecte automatiquement les donnees de feedback : les transactions `VERIFIED_BY_USER` sont etiquetees "NON-FRAUDE" (l'IA s'etait trompee) et les transactions `BLOCK` sont etiquetees "FRAUDE" (l'IA avait raison). `feedbackSent` indique le nombre de donnees envoyees au modele Python, et `lastRetrainAt` la date du dernier re-entrainement reussi.

**Reponse 500 (erreur) :**

```json
{ "message": "Internal server error" }
```

Cela signifie que le service IA n'est pas joignable.

**Exemple React — bouton avec spinner :**

```tsx
import { useState } from "react";
import { api } from "../api";

function RetrainButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleRetrain = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await api<{ ok: boolean; message: string }>("/ml/retrain", {
        method: "POST",
        body: JSON.stringify({ initiatedBy: "admin-dashboard", source: "bouton_retrain" }),
      });
      setResult(res.ok ? "Re-entrainement lance avec succes !" : "Echec");
    } catch {
      setResult("Erreur : service IA indisponible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleRetrain} disabled={loading}>
        {loading ? "Re-entrainement en cours..." : "Re-entrainer l'IA"}
      </button>
      {result && <p>{result}</p>}
    </div>
  );
}
```

---

### 5.7 Donnees de demonstration (seed)

**Quand l'utiliser :** Bouton admin pour peupler la base de donnees avec des utilisateurs et transactions fictifs. Utile pour les tests et la demo.

**Requete**

```
POST /bankapi/v1/users/seed-demo
```

Pas de body requis.

**Reponse 200 :**

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

**Exemple :**

```tsx
async function seedDemo() {
  return api<{ users: User[] }>("/users/seed-demo", { method: "POST" });
}
```

---

### 5.8 Liste des statuts disponibles

**Quand l'utiliser :** Pour remplir un select/filtre dans le dashboard sans coder les valeurs en dur.

**Requete**

```
GET /bankapi/v1/transactions/statuses
```

**Reponse 200 :**

```json
{
  "statuses": ["OK", "VERIFY", "BLOCK", "VERIFIED_BY_USER"]
}
```

---

### 5.9 Dashboard performances IA

Ces endpoints permettent de construire un dashboard complet de suivi des performances du modele de detection de fraude.

#### 5.9.1 Statistiques globales

**Quand l'utiliser :** Page d'accueil du dashboard IA. Affiche les KPI principaux.

**Requete**

```
GET /bankapi/v1/ai/stats
```

Pas de parametres.

**Reponse 200 :**

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

| Champ | Type | Description |
|-------|------|-------------|
| `totalTransactions` | number | Nombre total de transactions analysees |
| `byStatus` | object | Nombre de transactions par statut |
| `averageRiskScore` | number | Score de risque moyen (0-100) |
| `falsePositiveRate` | number | Taux de faux positifs : VERIFIED_BY_USER / (VERIFY + VERIFIED_BY_USER) |
| `blockRate` | number | Taux de blocage : BLOCK / total |
| `verifyRate` | number | Taux de verification : VERIFY / total |
| `todayCount` | number | Transactions analysees aujourd'hui |
| `last24hCount` | number | Transactions analysees dans les 24 dernieres heures |

**Exemple React — composant KPI :**

```tsx
import { useState, useEffect } from "react";
import { api } from "../api";
import type { AiGlobalStats } from "../types/api";

function AiKpiCards() {
  const [stats, setStats] = useState<AiGlobalStats | null>(null);

  useEffect(() => {
    api<AiGlobalStats>("/ai/stats").then(setStats);
  }, []);

  if (!stats) return <p>Chargement...</p>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
      <div className="kpi-card">
        <h3>Total</h3>
        <p>{stats.totalTransactions}</p>
      </div>
      <div className="kpi-card">
        <h3>Score moyen</h3>
        <p>{stats.averageRiskScore}/100</p>
      </div>
      <div className="kpi-card">
        <h3>Taux blocage</h3>
        <p>{(stats.blockRate * 100).toFixed(1)}%</p>
      </div>
      <div className="kpi-card">
        <h3>Faux positifs</h3>
        <p>{(stats.falsePositiveRate * 100).toFixed(1)}%</p>
      </div>
    </div>
  );
}
```

#### 5.9.2 Evolution temporelle (timeline)

**Quand l'utiliser :** Graphique lineaire montrant l'evolution des performances sur le temps.

**Requete**

```
GET /bankapi/v1/ai/stats/timeline?period=day&days=30
```

**Parametres query :**

| Parametre | Type | Defaut | Min | Max | Description |
|-----------|------|--------|-----|-----|-------------|
| `period` | string | `day` | - | - | Granularite : `hour`, `day`, `week` |
| `days` | number | 30 | 1 | 90 | Nombre de jours a remonter |

**Reponse 200 :**

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

**Exemple React avec Recharts (graphique lineaire) :**

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";
import { api } from "../api";
import type { AiTimeline } from "../types/api";

function AiTimelineChart() {
  const [timeline, setTimeline] = useState<AiTimeline | null>(null);

  useEffect(() => {
    api<AiTimeline>("/ai/stats/timeline?period=day&days=30").then(setTimeline);
  }, []);

  if (!timeline) return <p>Chargement...</p>;

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={timeline.data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString()} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="ok" stroke="#22c55e" name="OK" />
        <Line type="monotone" dataKey="verify" stroke="#f59e0b" name="VERIFY" />
        <Line type="monotone" dataKey="block" stroke="#ef4444" name="BLOCK" />
        <Line type="monotone" dataKey="verifiedByUser" stroke="#2563eb" name="VERIFIED" />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

#### 5.9.3 Distribution des scores de risque

**Quand l'utiliser :** Histogramme montrant la repartition des scores de risque.

**Requete**

```
GET /bankapi/v1/ai/stats/distribution
```

**Reponse 200 :**

```json
{
  "buckets": [
    { "min": 0, "max": 10, "label": "0-10", "count": 150 },
    { "min": 11, "max": 20, "label": "11-20", "count": 200 },
    { "min": 91, "max": 100, "label": "91-100", "count": 30 }
  ]
}
```

10 buckets de largeur 10, parfait pour un bar chart.

**Exemple React avec Recharts (histogramme) :**

```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";
import { api } from "../api";
import type { AiScoreDistribution } from "../types/api";

function ScoreDistributionChart() {
  const [distribution, setDistribution] = useState<AiScoreDistribution | null>(null);

  useEffect(() => {
    api<AiScoreDistribution>("/ai/stats/distribution").then(setDistribution);
  }, []);

  if (!distribution) return <p>Chargement...</p>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={distribution.buckets}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#6366f1" name="Transactions" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

#### 5.9.4 Informations du modele IA

**Quand l'utiliser :** Section "Statut du modele" du dashboard IA.

**Requete**

```
GET /bankapi/v1/ai/model-info
```

**Reponse 200 :**

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

| Champ | Type | Description |
|-------|------|-------------|
| `status` | string | Statut actuel du modele (`active`) |
| `lastRetrainAt` | string ou null | Date ISO du dernier re-entrainement (`null` si jamais fait) |
| `transactionsSinceRetrain` | number | Nombre de transactions analysees depuis le dernier retrain |
| `feedbackAvailable.verifiedByUser` | number | Transactions confirmees par OTP (feedback "non-fraude") |
| `feedbackAvailable.blocked` | number | Transactions bloquees (feedback "fraude") |
| `feedbackAvailable.pendingVerify` | number | Transactions en attente de verification |

**Exemple React :**

```tsx
import { useState, useEffect } from "react";
import { api } from "../api";
import type { AiModelInfo } from "../types/api";

function ModelInfoCard() {
  const [info, setInfo] = useState<AiModelInfo | null>(null);

  useEffect(() => {
    api<AiModelInfo>("/ai/model-info").then(setInfo);
  }, []);

  if (!info) return <p>Chargement...</p>;

  const totalFeedback = info.feedbackAvailable.verifiedByUser + info.feedbackAvailable.blocked;

  return (
    <div className="model-info-card">
      <h3>Modele IA — {info.status}</h3>
      <p>Dernier entrainement : {info.lastRetrainAt ? new Date(info.lastRetrainAt).toLocaleString() : "Jamais"}</p>
      <p>Transactions depuis : {info.transactionsSinceRetrain}</p>
      <p>Feedback disponible : {totalFeedback} ({info.feedbackAvailable.verifiedByUser} non-fraude, {info.feedbackAvailable.blocked} fraude)</p>
    </div>
  );
}
```

#### 5.9.5 Verifier si l'IA est en ligne (health check)

**Quand l'utiliser :** Indicateur en haut du dashboard pour montrer si le service IA Python est connecte ou non. Si hors ligne, afficher les instructions de depannage.

**Requete**

```
GET /bankapi/v1/ai/health
```

Pas de parametres.

**Reponse 200 — IA en ligne :**

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

**Reponse 200 — IA hors ligne :**

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

| Champ | Type | Description |
|-------|------|-------------|
| `aiService.online` | boolean | `true` si le service IA repond aux requetes |
| `aiService.url` | string ou null | URL du service IA configuree (null si non configure) |
| `aiService.responseTimeMs` | number ou null | Temps de reponse en millisecondes |
| `aiService.error` | string ou null | Message d'erreur si le service ne repond pas |
| `aiService.mode` | string | `remote` = IA distante seule, `simulated` = simulateur integre seul, `fallback` = IA distante + repli simulateur |
| `fallbackActive` | boolean | `true` si le backend utilise le simulateur integre (mode `simulated` ou `fallback`) |
| `message` | string | Message lisible decrivant l'etat du service |
| `instructions` | string[] ou absent | Instructions de depannage si le service est hors ligne |

**Exemple React — indicateur de statut IA :**

```tsx
import { useState, useEffect } from "react";
import { api } from "../api";
import type { AiHealthCheck } from "../types/api";

function AiStatusIndicator() {
  const [health, setHealth] = useState<AiHealthCheck | null>(null);

  useEffect(() => {
    api<AiHealthCheck>("/ai/health").then(setHealth);
    const interval = setInterval(() => {
      api<AiHealthCheck>("/ai/health").then(setHealth);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!health) return <span>Verification...</span>;

  const color = health.aiService.online
    ? "#22c55e"
    : health.fallbackActive
      ? "#f59e0b"
      : "#ef4444";

  const label = health.aiService.online
    ? "IA en ligne"
    : health.fallbackActive
      ? "IA hors ligne (simulateur actif)"
      : "IA hors ligne";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: color, display: "inline-block" }} />
        <span>{label}</span>
        {health.aiService.responseTimeMs != null && (
          <span style={{ fontSize: 12, color: "#6b7280" }}>{health.aiService.responseTimeMs}ms</span>
        )}
      </div>
      {health.instructions && (
        <details style={{ marginTop: 8 }}>
          <summary>Instructions de depannage</summary>
          <ol>
            {health.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}
```

---

## 6. Temps reel — Socket.IO

Le backend diffuse un evenement **a chaque transaction analysee** (`transaction:scored`), une **alerte client premium** le cas echeant (`premium:fraud-alert`), et un evenement lorsqu'une transaction est **confirmee par OTP** (`transaction:verified`). Le dashboard peut ecouter pour mettre a jour l'interface en live, sans rafraichir la page.

### 6.1 Installation

```bash
npm install socket.io-client
```

### 6.2 Hook `useSocket` pour React (web et React Native)

```typescript
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type {
  TransactionScoredEvent,
  PremiumFraudAlertEvent,
  TransactionVerifiedEvent,
  AiStatsUpdatedEvent,
} from "../types/api";

const SOCKET_URL = "https://bankfraud.loophole.site";

export function useSocket(
  onTransactionScored: (event: TransactionScoredEvent) => void,
  onPremiumFraudAlert?: (event: PremiumFraudAlertEvent) => void,
  onTransactionVerified?: (event: TransactionVerifiedEvent) => void,
  onAiStatsUpdated?: (event: AiStatsUpdatedEvent) => void,
) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("Socket.IO connecte:", socket.id);
    });

    socket.on("transaction:scored", onTransactionScored);

    if (onPremiumFraudAlert) {
      socket.on("premium:fraud-alert", onPremiumFraudAlert);
    }

    if (onTransactionVerified) {
      socket.on("transaction:verified", onTransactionVerified);
    }

    if (onAiStatsUpdated) {
      socket.on("ai:stats-updated", onAiStatsUpdated);
    }

    socket.on("disconnect", () => {
      console.log("Socket.IO deconnecte");
    });

    socketRef.current = socket;

    return () => {
      socket.off("transaction:scored", onTransactionScored);
      if (onPremiumFraudAlert) {
        socket.off("premium:fraud-alert", onPremiumFraudAlert);
      }
      if (onTransactionVerified) {
        socket.off("transaction:verified", onTransactionVerified);
      }
      if (onAiStatsUpdated) {
        socket.off("ai:stats-updated", onAiStatsUpdated);
      }
      socket.disconnect();
    };
  }, [onTransactionScored, onPremiumFraudAlert, onTransactionVerified, onAiStatsUpdated]);

  return socketRef;
}
```

### 6.3 Utilisation dans le Dashboard

```tsx
import { useState, useCallback } from "react";
import { useSocket } from "../hooks/useSocket";
import type { TransactionScoredEvent, Transaction, PaginatedResponse } from "../types/api";

function Dashboard() {
  const [transactions, setTransactions] = useState<PaginatedResponse<Transaction> | null>(null);

  const handleNewTransaction = useCallback((event: TransactionScoredEvent) => {
    // Option 1 : Rafraichir la liste
    // loadTransactions();

    // Option 2 : Ajouter en tete de liste (plus reactif)
    setTransactions((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: [
          { ...event, id: event.transactionId } as unknown as Transaction,
          ...prev.items,
        ].slice(0, prev.pagination.pageSize),
        pagination: { ...prev.pagination, total: prev.pagination.total + 1 },
      };
    });
  }, []);

  useSocket(handleNewTransaction);

  // ... rendu du tableau
}
```

### 6.4 Notes specifiques React Native

Socket.IO fonctionne de la meme maniere sur React Native. Points d'attention :

- **Reconnexion automatique** : Socket.IO se reconnecte automatiquement si la connexion est perdue (changement de reseau, veille, etc.). Pas besoin de gerer ca manuellement.
- **Background** : Sur iOS, les WebSockets sont coupes quand l'app passe en arriere-plan. La reconnexion se fera automatiquement au retour au premier plan.
- **URL** : Utilisez la meme URL que pour le web. Si vous testez sur un emulateur Android, `localhost` ne marchera pas ; utilisez l'IP de votre machine ou l'URL Loophole.

### 6.5 Evenement `transaction:scored` — detail du payload

Cet evenement est emis par le serveur a chaque creation de transaction reussie. **Il est broadcast a tous les clients connectes.**

```json
{
  "transactionId": "uuid-transaction",
  "userId": "uuid-utilisateur",
  "riskScore": 72,
  "status": "VERIFY",
  "reasons": ["Ratio ecart montant anormal", "Nouvelle localisation"],
  "requiresManualReview": true
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `transactionId` | string | ID de la transaction qui vient d'etre analysee |
| `userId` | string | ID de l'utilisateur concerne |
| `riskScore` | number | Score 0-100 |
| `status` | string | `OK`, `VERIFY`, `BLOCK` ou `VERIFIED_BY_USER` |
| `reasons` | string[] | Raisons du score |
| `requiresManualReview` | boolean | Necessite une revue manuelle ? |

### 6.6 Evenement `transaction:verified` — validation OTP transaction

Emis lorsqu'une transaction passe au statut **`VERIFIED_BY_USER`** apres une verification OTP reussie (`POST /transactions/{id}/verify-otp`). Utile pour mettre a jour le dashboard ou fermer un modal de saisie de code sans recharger la liste.

**Payload :**

```json
{
  "transactionId": "uuid-transaction",
  "userId": "uuid-utilisateur",
  "previousStatus": "VERIFY",
  "newStatus": "VERIFIED_BY_USER"
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `transactionId` | string | ID de la transaction confirmee |
| `userId` | string | ID du proprietaire de la transaction |
| `previousStatus` | string | Statut avant validation (souvent `VERIFY`) |
| `newStatus` | string | Toujours `VERIFIED_BY_USER` pour cet evenement |

**Exemple d'ecoute avec le hook `useSocket` :**

```tsx
import { useCallback, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import type { TransactionVerifiedEvent, Transaction, PaginatedResponse } from "../types/api";

function DashboardWithOtpFeedback() {
  const [list, setList] = useState<PaginatedResponse<Transaction> | null>(null);

  const onVerified = useCallback((event: TransactionVerifiedEvent) => {
    setList((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((tx) =>
          tx.id === event.transactionId
            ? { ...tx, status: "VERIFIED_BY_USER" as const }
            : tx,
        ),
      };
    });
  }, []);

  useSocket(
    () => { /* onTransactionScored */ },
    undefined,
    onVerified,
  );

  return null;
}
```

### 6.7 Evenement `premium:fraud-alert` — alerte fraude client premium

Cet evenement est emis par le serveur quand une transaction d'un client **PREMIUM** declenche une alerte fraude. Le blocage automatique est evite pour les clients premium : la transaction passe en `VERIFY` avec `requiresManualReview: true`, un email d'alerte est envoye automatiquement au client, et cet evenement est emis pour le dashboard des banquiers.

**Payload :**

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

| Champ | Type | Description |
|-------|------|-------------|
| `transactionId` | string | ID de la transaction concernee |
| `userId` | string | ID du client premium |
| `userName` | string / null | Nom du client |
| `email` | string / null | Email du client (un email lui a ete envoye si present) |
| `amount` | number | Montant de la transaction |
| `devise` | string | Devise (CDF ou USD) |
| `riskScore` | number | Score de risque 0-100 |
| `reasons` | string[] | Raisons de l'alerte |
| `requiresManualReview` | boolean | Toujours `true` pour cet evenement |
| `timestamp` | string | Date/heure de l'alerte (ISO 8601) |

**Exemple d'ecoute (dashboard banquier) :**

```tsx
import { useEffect, useState } from "react";
import type { PremiumFraudAlertEvent } from "../types/api";

function BankerDashboard() {
  const [alerts, setAlerts] = useState<PremiumFraudAlertEvent[]>([]);

  useEffect(() => {
    socket.on("premium:fraud-alert", (data: PremiumFraudAlertEvent) => {
      setAlerts((prev) => [data, ...prev]);
      // Afficher un toast / notification sonore
    });

    return () => { socket.off("premium:fraud-alert"); };
  }, []);

  return (
    <div>
      <h2>Alertes Premium</h2>
      {alerts.map((alert) => (
        <div key={alert.transactionId} className="alert-card">
          <strong>{alert.userName}</strong> — {alert.amount} {alert.devise}
          <span>Score: {alert.riskScore}/100</span>
          <ul>{alert.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
          {alert.email && <p>Email envoye a {alert.email}</p>}
        </div>
      ))}
    </div>
  );
}
```

### 6.8 Action optionnelle : rejoindre une salle utilisateur

Si vous voulez preparer du filtrage cote serveur (usage futur), vous pouvez rejoindre une salle par utilisateur :

```typescript
socket.emit("join_user", userId);
```

Actuellement le serveur broadcast a tout le monde. Filtrer cote client avec `event.userId === currentUserId` si necessaire.

### 6.9 Evenement `ai:stats-updated` — mise a jour dashboard IA

Emis apres **chaque** creation de transaction. Resume leger pour rafraichir les compteurs du dashboard IA en temps reel sans appeler `GET /ai/stats`.

**Payload :**

```json
{
  "totalTransactions": 1235,
  "lastRiskScore": 72,
  "lastStatus": "VERIFY",
  "todayCount": 46,
  "timestamp": "2026-03-27T14:30:00Z"
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `totalTransactions` | number | Nombre total de transactions |
| `lastRiskScore` | number | Score de risque de la derniere transaction |
| `lastStatus` | string | Statut de la derniere transaction |
| `todayCount` | number | Nombre de transactions aujourd'hui |
| `timestamp` | string | Horodatage (ISO 8601) |

**Exemple React avec le hook `useSocket` :**

```tsx
import { useCallback, useState, useEffect } from "react";
import { io } from "socket.io-client";
import type { AiStatsUpdatedEvent } from "../types/api";

const SOCKET_URL = "https://bankfraud.loophole.site";

function useAiLiveStats() {
  const [liveStats, setLiveStats] = useState<AiStatsUpdatedEvent | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, { path: "/socket.io" });
    socket.on("ai:stats-updated", (data: AiStatsUpdatedEvent) => {
      setLiveStats(data);
    });
    return () => { socket.disconnect(); };
  }, []);

  return liveStats;
}
```

---

## 7. Gestion des erreurs

Le backend renvoie des erreurs dans un format coherent. Voici les 3 cas possibles :

### 7.1 Erreur 400 — Validation (champs manquants ou invalides)

Se produit quand le body de la requete est incorrect (champ manquant, mauvais type, etc.).

```json
{
  "message": "Validation error",
  "issues": [
    {
      "code": "invalid_type",
      "path": ["amount"],
      "message": "Expected number, received string"
    },
    {
      "code": "too_small",
      "path": ["nbTransactions1h"],
      "message": "Number must be greater than or equal to 0"
    }
  ]
}
```

- `issues` est un tableau. Chaque entree a un `path` (le champ concerne) et un `message` (en anglais).
- Vous pouvez mapper `path[0]` vers le champ du formulaire pour afficher l'erreur au bon endroit.

### 7.2 Erreur 404 — Ressource introuvable

```json
{ "message": "Transaction not found" }
```

Ou pour un utilisateur :

```json
{ "message": "Utilisateur introuvable. Connectez-vous d'abord." }
```

### 7.3 Erreur 429 — Trop de requetes (rate limit)

Se produit quand vous envoyez trop de requetes en peu de temps. Le backend applique 3 niveaux de limitation :

| Scope | Limite | Fenetre |
|-------|--------|---------|
| Global (toutes les routes) | 100 requetes | 1 minute |
| Authentification (`/auth/*`, dont `verify-otp`) | 10 requetes | 1 minute |
| Re-entrainement IA (`/ml/*`) | 3 requetes | 10 minutes |

```json
{
  "message": "Trop de requetes. Veuillez patienter avant de reessayer.",
  "retryAfterSeconds": 42
}
```

Interface TypeScript :

```typescript
export interface RateLimitError {
  message: string;
  retryAfterSeconds: number;
}
```

**Exemple React — compte a rebours automatique :**

```tsx
import { useState, useEffect } from "react";

function useRetryCountdown(retryAfterSeconds: number | null) {
  const [seconds, setSeconds] = useState(retryAfterSeconds ?? 0);

  useEffect(() => {
    if (!retryAfterSeconds) return;
    setSeconds(retryAfterSeconds);
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { clearInterval(interval); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [retryAfterSeconds]);

  return seconds;
}

function RetryMessage({ seconds }: { seconds: number }) {
  if (seconds <= 0) return null;
  return <p>Trop de requetes. Reessayez dans {seconds}s...</p>;
}
```

### 7.4 Erreur 500 — Erreur serveur

```json
{ "message": "Internal server error" }
```

Le serveur a rencontre un probleme inattendu. Afficher un message generique a l'utilisateur.

### 7.5 Pattern React : gestion centralisee

La classe `ApiError` du fichier `api.ts` (section 4.2) capture deja les erreurs. Utilisez-la dans un composant :

```tsx
import { ApiError } from "../api";

function ErrorMessage({ error }: { error: unknown }) {
  if (!error) return null;

  if (error instanceof ApiError) {
    if (error.status === 429) {
      return <p>Trop de requetes. Veuillez patienter avant de reessayer.</p>;
    }
    if (error.status === 400 && error.issues) {
      return (
        <ul>
          {error.issues.map((issue, i) => (
            <li key={i}>{issue.path.join(".")} : {issue.message}</li>
          ))}
        </ul>
      );
    }
    return <p>Erreur : {error.message}</p>;
  }

  return <p>Erreur de connexion au serveur</p>;
}
```

---

## 8. Bonnes pratiques et conseils UX

### 8.1 Couleurs pour les statuts

| Statut | Couleur | Hex suggere | Signification |
|--------|---------|-------------|---------------|
| `OK` | Vert | `#22c55e` | Transaction approuvee, pas de risque |
| `VERIFY` | Orange | `#f59e0b` | Suspecte, a verifier manuellement (OTP possible) |
| `VERIFIED_BY_USER` | Bleu | `#2563eb` | Confirmee par l'utilisateur via OTP (transaction legitimement validee) |
| `BLOCK` | Rouge | `#ef4444` | Bloquee, fraude tres probable |

Exemple :

```tsx
const STATUS_COLORS: Record<TransactionStatus, string> = {
  OK: "#22c55e",
  VERIFY: "#f59e0b",
  VERIFIED_BY_USER: "#2563eb",
  BLOCK: "#ef4444",
};

function StatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <span style={{ backgroundColor: STATUS_COLORS[status], color: "white", padding: "4px 12px", borderRadius: 12 }}>
      {status}
    </span>
  );
}
```

### 8.2 Jauge du score de risque

Le `riskScore` va de **0** (aucun risque) a **100** (fraude certaine).

| Plage | Niveau | Couleur |
|-------|--------|---------|
| 0-33 | Faible | Vert |
| 34-66 | Moyen | Orange |
| 67-100 | Eleve | Rouge |

```tsx
function RiskGauge({ score }: { score: number }) {
  const color = score <= 33 ? "#22c55e" : score <= 66 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ width: "100%", backgroundColor: "#e5e7eb", borderRadius: 8, height: 8 }}>
      <div style={{ width: `${score}%`, backgroundColor: color, borderRadius: 8, height: 8 }} />
    </div>
  );
}
```

### 8.3 Tableau `reasons` — affichage

Le champ `reasons` est un tableau de textes en francais. Exemples de valeurs possibles :

- "Montant superieur a la moyenne client"
- "Nouvelle localisation"
- "Nouvel appareil"
- "Frequence de transactions elevee"
- "Transaction internationale"
- "Deplacement geographique suspect"

Affichez-les en liste, tooltip, ou puces sous la transaction.

### 8.4 `requiresManualReview`

Quand `requiresManualReview` est `true`, ajoutez un badge ou une icone (ex: icone oeil) pour signaler que la transaction doit etre examinee par un humain.

### 8.5 Rafraichissement automatique via Socket.IO

Ne faites pas de polling (appels repetes toutes les X secondes). Utilisez Socket.IO (section 6) pour recevoir les nouvelles transactions en temps reel et mettre a jour la liste.

### 8.6 Pagination

- Utilisez `pagination.hasNext` et `pagination.hasPrev` pour desactiver les boutons Suivant/Precedent.
- Affichez `Page X / Y` avec `pagination.page` et `pagination.totalPages`.
- Affichez le total : `pagination.total` transactions au total.

### 8.7 Spinner pour le re-entrainement

L'endpoint `/ml/retrain` peut prendre jusqu'a 2 minutes. Affichez un spinner et desactivez le bouton pendant l'appel.

### 8.8 Saisie OTP (connexion et transactions)

Pour une experience coherente entre l'ecran de connexion et la confirmation de transaction :

- **Six champs distincts** (un chiffre par case) plutot qu'un seul champ long : meilleure lisibilite et alignement avec le code recu par email.
- **Focus automatique** : apres saisie d'un chiffre, passer au champ suivant ; **Retour arriere** sur une case vide ramene au champ precedent.
- **Collage** : accepter le collage des 6 chiffres d'un coup pour remplir toutes les cases.
- **Compte a rebours** : afficher le temps restant avant expiration du code (aligne sur la duree cote serveur) ; proposer un lien « Renvoyer le code » uniquement si l'API le permet ou apres expiration (sinon message clair).
- Indiquer clairement l'email masque (`otpSentTo`) pour rassurer l'utilisateur sur la destination du code.

---

## 9. Tableau de reference rapide

| Ecran / Fonction | Methode | Endpoint | Description |
|-----------------|---------|----------|-------------|
| Connexion etape 1 | `POST` | `/bankapi/v1/auth/login-or-register` | Body `{ phoneNumber, email, name? }` — email obligatoire ; reponse OTP (`requiresOtp`, `userId`, `otpSentTo`) |
| Connexion etape 2 | `POST` | `/bankapi/v1/auth/verify-otp` | Body `{ userId, code }` — reponse : profil `User` complet ; erreurs 400 / 410 / 429 |
| Seed demo | `POST` | `/bankapi/v1/users/seed-demo` | Cree des utilisateurs et transactions de test |
| Liste statuts | `GET` | `/bankapi/v1/transactions/statuses` | Retourne `OK`, `VERIFY`, `BLOCK`, `VERIFIED_BY_USER` |
| Tableau transactions | `GET` | `/bankapi/v1/transactions?page=&pageSize=&status=&userId=` | Liste paginee avec filtres |
| Detail transaction | `GET` | `/bankapi/v1/transactions/{id}` | Tous les champs d'une transaction |
| Creer transaction | `POST` | `/bankapi/v1/transactions` | Analyse IA ; si `VERIFY` avec OTP : champs `requiresOtp`, `otpSentTo` |
| Verifier OTP transaction | `POST` | `/bankapi/v1/transactions/{id}/verify-otp` | Body `{ userId, code }` — succes : `VERIFIED_BY_USER` ; 3 echecs : `BLOCK` |
| Localisations dispo | `GET` | `/bankapi/v1/locations` | Liste des villes simulables (code, coords, pays) |
| Simuler position (test) | `PUT` | `/bankapi/v1/users/{id}/simulate-location` | Force les coordonnees GPS (demo/test fraude uniquement) |
| Declarer voyage | `POST` | `/bankapi/v1/users/{id}/declare-travel` | Body `{ destination, pays?, latitude, longitude, startDate, endDate }` |
| Voyages actifs | `GET` | `/bankapi/v1/users/{id}/travel/active` | Declarations en cours |
| Historique voyages | `GET` | `/bankapi/v1/users/{id}/travel` | Toutes les declarations |
| Annuler voyage | `POST` | `/bankapi/v1/users/{id}/travel/{declId}/cancel` | Annule une declaration |
| Re-entrainement IA | `POST` | `/bankapi/v1/ml/retrain` | Declenche le re-entrainement du modele |
| Auto-decouverte | `GET` | `/bankapi/config` | Toutes les URLs, version et config (non versionne) |
| Documentation | `GET` | `/bankapi/api-docs` | Interface Swagger interactive (non versionne) |
| Temps reel | Socket.IO | `wss://bankfraud.loophole.site/socket.io` | Evenement `transaction:scored` en push |
| Temps reel | Socket.IO | `wss://bankfraud.loophole.site/socket.io` | Evenement `transaction:verified` (passage en `VERIFIED_BY_USER`) |
| Alerte premium | Socket.IO | `wss://bankfraud.loophole.site/socket.io` | Evenement `premium:fraud-alert` (notification banquier + email auto) |
| Stats IA globales | `GET` | `/bankapi/v1/ai/stats` | Compteurs par statut, score moyen, taux faux positifs / blocage |
| Timeline IA | `GET` | `/bankapi/v1/ai/stats/timeline?period=&days=` | Evolution temporelle pour graphiques lineaires |
| Distribution scores | `GET` | `/bankapi/v1/ai/stats/distribution` | 10 buckets pour histogramme des scores |
| Infos modele IA | `GET` | `/bankapi/v1/ai/model-info` | Statut, dernier retrain, feedback disponible |
| Health check IA | `GET` | `/bankapi/v1/ai/health` | Verifie si l'IA Python est en ligne + instructions depannage |
| Stats IA live | Socket.IO | `wss://bankfraud.loophole.site/socket.io` | Evenement `ai:stats-updated` (compteurs legers en push) |
| Signaler fraude | `POST` | `/bankapi/v1/disputes` | Cree un signalement + gel automatique de l'app |
| Liste signalements | `GET` | `/bankapi/v1/disputes?page=&pageSize=&status=&userId=` | Liste paginee des signalements |
| Stats signalements | `GET` | `/bankapi/v1/disputes/stats` | Compteurs par statut |
| Detail signalement | `GET` | `/bankapi/v1/disputes/{id}` | Detail complet avec transaction et user |
| MAJ signalement | `PATCH` | `/bankapi/v1/disputes/{id}` | Workflow investigation (OPEN→INVESTIGATING→CONFIRMED/REJECTED→RESOLVED) |
| Tracabilite | `GET` | `/bankapi/v1/transactions/{id}/trace` | IP, device, geo, historique, signalements |
| Geler app | `POST` | `/bankapi/v1/users/{id}/freeze` | Body `{ reason }` — gele l'app |
| Degeler app | `POST` | `/bankapi/v1/users/{id}/unfreeze` | Degele l'app |
| Signalement ouvert | Socket.IO | `wss://bankfraud.loophole.site/socket.io` | Evenement `dispute:opened` |
| MAJ signalement | Socket.IO | `wss://bankfraud.loophole.site/socket.io` | Evenement `dispute:updated` |
| App gelee | Socket.IO | `wss://bankfraud.loophole.site/socket.io` | Evenement `account:frozen` |
| App degelee | Socket.IO | `wss://bankfraud.loophole.site/socket.io` | Evenement `account:unfrozen` |

---

## 10. Declaration de voyage & gestion de la localisation

### 10.1 Comment la position est geree

La position d'un utilisateur (`latitude`, `longitude`, `locationUpdatedAt`) en base sert de reference pour la detection de fraude geographique. Voici comment elle evolue :

| Evenement | Mise a jour position ? | Detail |
|-----------|:-----:|--------|
| Transaction OK | Oui | La position est mise a jour avec les coords de la transaction |
| Transaction VERIFIED_BY_USER | Oui | Mise a jour apres confirmation OTP |
| Transaction VERIFY (en attente) | Non | Pas de mise a jour tant que non confirmee |
| Transaction BLOCK | Non | Jamais de mise a jour |
| `simulate-location` (test) | Oui | Force la position (demo/test uniquement) |
| `declare-travel` | Non | Ne change pas la position, ajoute une zone de confiance |

### 10.2 La detection de fraude geographique

```
Position en base (Kinshasa) ←→ Position de la transaction (Paris)
Distance : 6 200 km | Temps ecoule : 90 min

Sans declaration de voyage → BLOCK (score 100)
Avec declaration couvrant Paris → VERIFY (score +10, OTP envoye)
```

### 11.3 POST /users/:id/declare-travel` — Declarer un voyage

```typescript
interface DeclareTravel {
  destination: string;     // "Paris"
  pays?: string;           // "France"
  latitude: number;        // 48.8566
  longitude: number;       // 2.3522
  startDate: string;       // ISO date "2026-04-01T00:00:00Z"
  endDate: string;         // ISO date "2026-04-15T00:00:00Z"  (max 90 jours)
}

interface TravelDeclaration {
  id: string;
  userId: string;
  destination: string;
  pays: string | null;
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt: string;
}
```

Exemple :

```typescript
const result = await fetch(`${API}/users/${userId}/declare-travel`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    destination: "Paris",
    pays: "France",
    latitude: 48.8566,
    longitude: 2.3522,
    startDate: "2026-04-01T00:00:00Z",
    endDate: "2026-04-15T00:00:00Z",
  }),
}).then(r => r.json());

// result.declaration.active === true
// result.message → "Voyage déclaré vers Paris..."
```

### 10.4 `GET /users/:id/travel/active` — Voyages en cours

```typescript
const { declarations } = await fetch(`${API}/users/${userId}/travel/active`).then(r => r.json());
// declarations = [ { id, destination: "Paris", startDate, endDate, active: true, ... } ]
```

### 10.5 `POST /users/:id/travel/:declarationId/cancel` — Annuler

```typescript
await fetch(`${API}/users/${userId}/travel/${declId}/cancel`, { method: "POST" });
```

### 10.6 `PUT /users/:id/simulate-location` — Test de fraude (demo)

Cet endpoint **force** la position d'un utilisateur en base. Il est utile pour **tester un scenario de fraude geographique** :

```typescript
// 1. Mettre l'utilisateur a Kinshasa
await fetch(`${API}/users/${userId}/simulate-location`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ location: "KINSHASA" }),
});

// 2. Envoyer une transaction depuis Paris (sans declaration de voyage)
// → BLOCK ! Fraude geographique detectee (6200 km en < 2h)
```

### 10.7 UX — Ecrans recommandes

**App mobile :**
- Ecran "Mes voyages" avec liste des declarations actives et passees
- Bouton "Declarer un voyage" avec formulaire (destination, dates, selection sur carte)
- Indicateur visuel si un voyage est actif
- Avant un voyage, rappeler a l'utilisateur de declarer pour eviter un blocage

---

## 11. Systeme de signalement de fraude & tracabilite

### 11.1 Concept

Un utilisateur peut signaler qu'une transaction n'a pas ete effectuee par lui. Le systeme :
1. **Cree un signalement** (dispute) en statut `OPEN`
2. **Gele automatiquement l'application** de l'utilisateur (plus aucune transaction possible)
3. **Emet des evenements Socket.IO** pour le dashboard banquier
4. Un banquier investigue, confirme ou rejette le signalement
5. Si confirme → la transaction passe en `FRAUD_CONFIRMED`
6. **Le remboursement/annulation ne se fait PAS via l'app** — le client doit se rendre en agence bancaire

### 11.2 TypeScript — Interfaces

```typescript
interface Dispute {
  id: string;
  transactionId: string;
  userId: string;
  reason: string;
  description: string | null;
  status: DisputeStatus;
  resolution: string | null;
  resolvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

type DisputeStatus = "OPEN" | "INVESTIGATING" | "CONFIRMED" | "REJECTED" | "RESOLVED";

interface DisputeCreatedResponse {
  dispute: Dispute;
  accountFrozen: boolean;
  message: string;
}

interface DisputeStats {
  total: number;
  byStatus: Record<DisputeStatus, number>;
}

interface TransactionTrace {
  transaction: {
    id: string;
    amount: number;
    devise: string;
    status: string;
    riskScore: number;
    aiResponseTimeMs: number;
    reasons: string[];
    timestamp: string;
  };
  trace: {
    ipAddress: string | null;
    deviceFingerprint: string | null;
    userAgent: string | null;
    location: {
      latitude: number;
      longitude: number;
      paysDestination: string | null;
      villeOrigine: string | null;
      villeDestination: string | null;
    };
    wasNewDevice: boolean;
    wasNewLocation: boolean;
    typeAppareil: string;
    typeReseau: string;
    transactionInternationale: boolean;
  };
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phoneNumber: string;
    typeCompte: string;
    accountFrozen: boolean;
  };
  disputes: { id: string; status: string; reason: string; createdAt: string }[];
  userHistory: {
    recentTransactions: object[];
    knownDevices: string[];
    knownIPs: string[];
  };
}
```

### 10.3 `POST /disputes` — Signaler une fraude

```typescript
const response = await fetch(`${API}/disputes`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    transactionId: "uuid-de-la-transaction",
    userId: "uuid-de-l-utilisateur",
    reason: "Transaction non autorisee",
    description: "Je n'ai pas effectue ce virement.",
  }),
});
const data: DisputeCreatedResponse = await response.json();
// data.accountFrozen === true
// → Afficher ecran de blocage + message d'aller en agence
```

### 11.4 PATCH /disputes/:id` — Workflow d'investigation

Transitions autorisees :
- `OPEN` → `INVESTIGATING` ou `REJECTED`
- `INVESTIGATING` → `CONFIRMED` ou `REJECTED`
- `CONFIRMED` → `RESOLVED`

```typescript
await fetch(`${API}/disputes/${disputeId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    status: "CONFIRMED",
    resolution: "Fraude confirmee apres investigation.",
    resolvedBy: "agent-uuid",
  }),
});
```

### 11.5 GET /transactions/:id/trace` — Tracabilite

```typescript
const trace = await fetch(`${API}/transactions/${txId}/trace`).then(r => r.json());
// trace.trace.ipAddress    → IP d'origine
// trace.trace.deviceFingerprint → empreinte appareil
// trace.trace.userAgent    → navigateur/app
// trace.userHistory.knownDevices → appareils habituels
// trace.userHistory.knownIPs    → IPs habituelles
```

### 11.6 Gel / degel d'application

```typescript
// Geler
await fetch(`${API}/users/${userId}/freeze`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ reason: "Fraude detectee" }),
});

// Degeler
await fetch(`${API}/users/${userId}/unfreeze`, { method: "POST" });
```

### 11.7 Socket.IO — Evenements signalements

```typescript
socket.on("dispute:opened", (data) => {
  // { disputeId, transactionId, userId, reason, timestamp }
  // Afficher notification dans le dashboard banquier
});

socket.on("dispute:updated", (data) => {
  // { disputeId, transactionId, userId, newStatus, resolution, timestamp }
  // Mettre a jour le statut dans la liste
});

socket.on("account:frozen", (data) => {
  // { userId, reason, timestamp }
  // Si c'est l'utilisateur courant → afficher ecran de blocage
});

socket.on("account:unfrozen", (data) => {
  // { userId, timestamp }
  // Si c'est l'utilisateur courant → retirer l'ecran de blocage
});
```

### 11.8 UX — Ecrans recommandes

**Cote utilisateur (app mobile) :**
- Bouton "Signaler une fraude" sur chaque transaction suspecte
- Ecran de blocage quand `accountFrozen: true` avec message clair : "Votre application a ete gelee. Rendez-vous en agence."
- Historique des signalements de l'utilisateur

**Cote banquier (dashboard web) :**
- Liste des signalements avec filtres par statut
- Vue detail avec tracabilite complete (IP, device, geo, historique)
- Boutons d'action : Investiguer, Confirmer, Rejeter, Resoudre
- Statistiques des signalements (camembert par statut)
- Notifications en temps reel pour les nouveaux signalements

### 11.9 Champ `deviceFingerprint` a la creation de transaction

Le champ `deviceFingerprint` est optionnel lors de la creation d'une transaction. Si votre app genere une empreinte d'appareil (via une librairie comme `fingerprintjs`), envoyez-la pour ameliorer la tracabilite :

```typescript
const result = await fetch(`${API}/transactions`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    // ... autres champs ...
    deviceFingerprint: "abc123def456...", // optionnel
  }),
});
```

L'`ipAddress` et le `userAgent` sont captures automatiquement cote serveur a partir de la requete HTTP.

---

*Document genere pour l'equipe de developpement frontend (web + mobile).*
*Documentation interactive Swagger : https://bankfraud.loophole.site/bankapi/api-docs*
