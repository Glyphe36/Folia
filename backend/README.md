# Folia - Architecture Backend PHP & SQLite

Ce dossier contient l'ensemble du backend d'API REST propulsé par **PHP 8.2+** et une base de données relationnelle persistante **SQLite 3**.

---

## 🏗️ Architecture globale

```text
┌───────────────────────────┐         HTTP (JSON)         ┌───────────────────────────┐         PDO          ┌───────────────────────────┐
│   Frontend React / Vite   │ ──────────────────────────> │   Serveur REST PHP (3001) │ ───────────────────> │   SQLite 3 Database       │
│   (VITE_API_URL)          │ <────────────────────────── │   (backend/router.php)    │ <─────────────────── │   (database.sqlite)       │
└───────────────────────────┘                             └───────────────────────────┘                      └───────────────────────────┘
```

- **Frontend React / Vite :** Envoie toutes les requêtes de consultation et de modification vers l'adresse configurée (`VITE_API_URL=http://192.168.1.157:3001/api`).
- **Bascule intelligente :** Si l'IP distante est inaccessible (ex. en prévisualisation HTTPS sur le cloud), le frontend bascule automatiquement et de manière transparente sur le proxy local `/api`.
- **Backend PHP :** Gère le routage REST, la validation, le support complet des en-têtes CORS (avec requêtes prévol OPTIONS) et les transactions SQLite.
- **Base SQLite (`backend/database.sqlite`) :** Fichier local unique stockant l'intégralité des plantes, du journal des soins, des profils utilisateurs et des réglages de rappels.

---

## 🚀 Démarrage du serveur PHP

### Option 1 : Lancement indépendant
Pour démarrer uniquement le backend PHP sur le port 3001 :
```bash
php -S 0.0.0.0:3001 backend/router.php
```

### Option 2 : Via npm
```bash
npm run php:server
```

### Option 3 : Lancement Full-Stack intégré
La commande standard du projet lance simultanément Express (port 3000), Vite et le processus PHP SQLite (port 3001) :
```bash
npm run dev
```

---

## ⚙️ Configuration de connexion Frontend

Dans votre fichier `.env` ou variables d'environnement Vite :
```env
VITE_API_URL=http://192.168.1.157:3001/api
```

Vous pouvez également modifier l'URL de l'API directement depuis l'interface web dans l'onglet **Paramètres** de l'application.

---

## 📋 Endpoints de l'API REST

| Méthode | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Bilan de santé, version PHP, taille de la base et métriques |
| `GET` | `/api/plants` | Liste toutes les plantes triées par favoris puis par nom |
| `GET` | `/api/plants/{id}` | Détail d'une plante spécifique |
| `POST` | `/api/plants` | Crée une nouvelle plante dans SQLite |
| `PUT` | `/api/plants/{id}` | Met à jour les caractéristiques d'une plante |
| `DELETE` | `/api/plants/{id}` | Supprime une plante et ses soins associés |
| `PATCH`| `/api/plants/{id}/favorite` | Bascule le statut favori |
| `POST` | `/api/plants/{id}/water` | Enregistre un arrosage et met à jour la date de dernier arrosage |
| `POST` | `/api/plants/{id}/mist` | Enregistre une brumisation et met à jour la date |
| `POST` | `/api/plants/{id}/fertilize` | Enregistre une fertilisation |
| `GET` | `/api/logs` | Récupère l'historique des soins (filtre `?plantId=` supporté) |
| `POST` | `/api/logs` | Ajoute une entrée de soin |
| `DELETE`| `/api/logs/{id}` | Supprime une entrée de soin |
| `GET` | `/api/users` | Liste les profils d'utilisateurs |
| `POST` | `/api/users` | Ajoute un nouvel utilisateur |
| `DELETE`| `/api/users/{id}` | Supprime un profil |
| `GET` | `/api/preferences` | Récupère les préférences de rappels |
| `PUT` | `/api/preferences` | Enregistre les préférences de rappels |
| `GET` | `/api/checks/completed` | Liste les vérifications accomplies pour la date du jour |
| `POST` | `/api/checks/complete` | Valide une vérification quotidienne |
| `GET` | `/api/backup/export` | Exportation complète de la base en JSON |
| `POST` | `/api/backup/import` | Importation et écrasement transactionnel dans SQLite |
| `POST` | `/api/backup/reset` | Réinitialise la base avec les données botaniques initiales |

---

## 🗄️ Structure des tables SQLite

### Table `plants`
- `id` (TEXT PRIMARY KEY)
- `name` (TEXT NOT NULL)
- `nickname` (TEXT)
- `species` (TEXT NOT NULL)
- `location` (TEXT NOT NULL)
- `lightRequirement` (TEXT NOT NULL)
- `wateringFrequencyDays` (INTEGER NOT NULL)
- `mistingFrequencyDays` (INTEGER)
- `fertilizerFrequencyDays` (INTEGER)
- `lastWatered` (TEXT NOT NULL, format ISO)
- `lastMisted` (TEXT, format ISO)
- `lastFertilized` (TEXT, format ISO)
- `healthStatus` (TEXT NOT NULL)
- `potSizeCm` (REAL)
- `notes` (TEXT)
- `imageUrl` (TEXT NOT NULL)
- `addedDate` (TEXT NOT NULL)
- `favorite` (INTEGER DEFAULT 0)

### Table `care_logs`
- `id` (TEXT PRIMARY KEY)
- `plantId` (TEXT NOT NULL, FK vers plants)
- `plantName` (TEXT NOT NULL)
- `date` (TEXT NOT NULL, format ISO)
- `type` (TEXT NOT NULL : arrosage, brumisation, engrais, rempotage, etc.)
- `amountOrDetails` (TEXT)
- `performedBy` (TEXT NOT NULL)
- `notes` (TEXT)

### Table `users`
- `id` (TEXT PRIMARY KEY)
- `name` (TEXT NOT NULL)
- `role` (TEXT NOT NULL)
- `avatarBg` (TEXT NOT NULL)

### Table `preferences`
- `id` (TEXT PRIMARY KEY DEFAULT 'default')
- `enabled` (INTEGER NOT NULL)
- `reminderTime` (TEXT NOT NULL)
- `quietHoursStart` (TEXT NOT NULL)
- `quietHoursEnd` (TEXT NOT NULL)
- `selectedDays` (TEXT NOT NULL, JSON)
- `notifyWatering` (INTEGER NOT NULL)
- `notifyMisting` (INTEGER NOT NULL)
- `notifyFertilizer` (INTEGER NOT NULL)
- `soundAlerts` (INTEGER NOT NULL)
- `autoAdjustSeason` (INTEGER NOT NULL)

---

## 🔍 Consultation directe avec SQLite CLI

Pour inspecter la base directement en ligne de commande :
```bash
sqlite3 backend/database.sqlite
```

Commandes utiles :
```sql
.tables
SELECT id, name, location, lastWatered FROM plants;
SELECT date, plantName, type, performedBy FROM care_logs ORDER BY date DESC LIMIT 5;
```
