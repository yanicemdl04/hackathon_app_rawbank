# Guide frontend — récupérer le message quand une transaction est bloquée ou signalée

Ce document explique **où** et **comment** lire les explications renvoyées par le backend après une analyse anti-fraude (statut `BLOCK`, `VERIFY`, etc.). À partager avec l’équipe **frontend**.

---

## 1. Principe

Le backend ne renvoie **pas** un champ unique nommé `message` pour expliquer le blocage.  
L’information lisible est dans le tableau **`reasons`** (liste de chaînes en français ou texte issu du ML).

Les noms de propriétés sont en **camelCase** : `riskScore`, `requiresManualReview`, `transactionId`, etc.

---

## 2. Après création d’une transaction — réponse HTTP

**Endpoint :** `POST {BASE}/bankapi/v1/transactions`  
**Succès :** statut **201** (même si la transaction est refusée : elle est enregistrée avec un statut métier).

### Corps JSON typique (extrait)

| Champ | Type | Description |
|--------|------|-------------|
| `transactionId` | `string` (UUID) | Identifiant de la transaction créée. |
| `status` | `string` | Ex. `OK`, `VERIFY`, `BLOCK`, `VERIFIED_BY_USER`, `FRAUD_CONFIRMED`. |
| `reasons` | `string[]` | **À afficher à l’utilisateur** : chaque entrée est une ligne d’explication. |
| `riskScore` | `number` | Score 0–100 (plus élevé = plus de risque selon le modèle / règles). |
| `requiresManualReview` | `boolean` | Indique une revue manuelle côté banque. |
| `aiResponseTimeMs` | `number` | Latence de l’analyse (optionnel pour l’UI). |
| `requiresOtp` | `boolean` | Présent seulement si `status === "VERIFY"` et email disponible — OTP transaction envoyé. |
| `otpSentTo` | `string` | Email masqué (ex. `j***@domain.com`) si OTP envoyé. |

### Exemple — transaction bloquée (`BLOCK`)

```json
{
  "transactionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "riskScore": 87,
  "aiResponseTimeMs": 42,
  "status": "BLOCK",
  "reasons": [
    "Montant élevé vs moyenne client",
    "Nouvelle localisation"
  ],
  "requiresManualReview": false
}
```

Les chaînes dans `reasons` **varient** selon les règles et le service ML (certaines lignes peuvent être plus techniques, ex. préfixe `Décision ML:`).

### Exemple minimal côté frontend (fetch)

```ts
const res = await fetch(`${API_BASE}/bankapi/v1/transactions`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

const data = await res.json();

if (!res.ok) {
  // Erreur HTTP (400, 404, 403…) — souvent { message: "..." }
  console.error(data.message);
  return;
}

// 201 : toujours lire status + reasons
const { status, reasons, riskScore, transactionId } = data;

if (status === "BLOCK") {
  // Afficher reasons (liste ou texte joint par des retours à la ligne)
  const texteUtilisateur = Array.isArray(reasons) ? reasons.join("\n") : "";
  // ... mise à jour UI (alerte, modal, etc.)
}
```

**Erreur fréquente :** ne lire que `status` et ignorer **`reasons`**, ou chercher un champ `message` à la place de `reasons`.

---

## 3. Temps réel — Socket.IO

Si l’app écoute les événements serveur, le même type d’information est poussé sur l’événement **`transaction:scored`**.

**Connexion :** même origine que l’API (voir `socketUrl` dans `GET /bankapi/config`), chemin `/socket.io`.

**Payload (exemple de forme) :**

```json
{
  "transactionId": "uuid",
  "userId": "uuid",
  "riskScore": 87,
  "status": "BLOCK",
  "reasons": ["Montant élevé vs moyenne client", "Nouvelle localisation"],
  "requiresManualReview": false
}
```

Côté client : filtrer par `userId` si plusieurs clients sont connectés au même namespace, puis mettre à jour l’UI avec **`payload.reasons`** comme pour la réponse HTTP.

---

## 4. Détail d’une transaction plus tard (écran historique)

**Endpoint :** `GET {BASE}/bankapi/v1/transactions/:id`

La ressource transaction inclut aussi **`reasons`** (stocké en JSON en base). Utiliser le même affichage que pour le `POST` (liste de chaînes).

---

## 5. Reformulation « grand public » (optionnel, côté frontend)

Le backend expose des **raisons brutes** (règles + éventuellement texte ML). Pour un ton plus « utilisateur lambda », le frontend peut :

- afficher un **titre fixe** du type : *« Votre transaction n’a pas pu être validée pour les motifs suivants : »* puis la liste `reasons` ;
- ou mapper certaines sous-chaînes connues vers des textes plus courts (maintenance côté front).

Une phrase unique **prête à l’emploi** pourrait être ajoutée plus tard par le backend ou l’équipe data (`userSummary`) ; ce n’est **pas** exposé aujourd’hui.

---

## 6. Rappel des bases URL

| Environnement | `BASE` (exemple) |
|---------------|------------------|
| Local | `http://localhost:3000` |
| Tunnel Loophole | `https://bankfraud.loophole.site` |
| Production | URL Render (ou autre) |

Préfixe API versionnée : **`/bankapi/v1`**.

Documentation interactive : **`{BASE}/bankapi/api-docs`**.

---

## 7. Check-list rapide pour le dev frontend

- [ ] Après `POST /transactions`, parser le **201** et lire **`reasons`** + **`status`**.
- [ ] Afficher `reasons` pour `BLOCK` et `VERIFY` (et si besoin pour les autres statuts).
- [ ] Ne pas supposer un champ `message` sur le succès 201 (sauf erreurs HTTP avec `{ message }`).
- [ ] Si usage Socket.IO, gérer **`transaction:scored`** et **`reasons`** dans le payload.
- [ ] Pour le détail : **`GET /transactions/:id`** → champ **`reasons`**.

---

*Document aligné sur le backend du dépôt (`transactions.controller.ts`, événements dans `backend/src/realtime/emit.ts`).*
