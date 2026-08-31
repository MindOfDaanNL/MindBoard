# MindBoard 2.0 🧠

Uitgebreid projectbeheer met **accounts, rollen, organisaties, projecten en kanban-borden**.
Gebouwd op **Node.js + Express + MariaDB**, met een **PWA**-frontend (installeerbaar op telefoon en desktop) en packaging naar **Windows .exe** en **Android APK**.

---

## ✨ Features

### Accounts & beveiliging
- Registratie, inloggen met JWT + refresh tokens (httpOnly cookie)
- Wachtwoorden gehasht met bcrypt
- Globale rollen: `admin` (platformbeheer) en `user`
- **Rate-limiting** op inlog/registratie (brute-force bescherming)
- **Security headers** (CSP, X-Frame-Options, nosniff) en verzoek-logging
- Geen `X-Powered-By`, onbekende API-routes geven een JSON 404

### Organisaties & rollen
- Multi-tenant organisaties met eigen naam, slug en beschrijving
- Org-rollen: `owner`, `admin`, `member`, `viewer`
- Leden toevoegen per e-mail/gebruikersnaam, rollen aanpassen
- **Uitnodigingslinks** per e-mail (7 dagen geldig, deelbare link)

### Projecten & borden
- Projecten binnen een organisatie, met projectleden en rollen (beheerbaar in de UI)
- Meerdere kanban-borden per project, elk met eigen kolommen
- Borden/kolommen zelf beheren, met kleuren en **WIP-limieten**
- **Bordfilters**: zoeken, prioriteit en toegewezen persoon
- Taken met prioriteit (laag/middel/hoog/urgent), deadline, assignee, tags, beschrijving
- **Drag & drop** taken verplaatsen tussen kolommen
- **Checklists (subtaken)** per taak met voortgangsindicatie
- Comments per taak
- **Activiteitenlog** (wie deed wat, met paginering)
- **Notificaties** bij toewijzing en reacties (klikbaar, met ongelezen-teller)
- **Zoeken** over taken en projecten
- **CSV-export** van een project (Excel-compatibel)
- **Dark mode** 🌙

### Dashboard & beheer
- Persoonlijk dashboard: jouw taken, projecten, activiteit, notificaties
- **Admin-paneel**: gebruikers beheren, rollen wijzigen, accounts uitschakelen, platformstatistieken

### PWA & packaging
- Installable Progressive Web App (manifest + service worker + icons)
- Windows-exe via `npm run exe` (één bestand, geen installatie)
- Capacitor-skelet voor Android APK

---

## 🚀 Snel starten

### 1. Vereisten
- **Node.js ≥ 18** (voor de exe-packaging: Node 22)
- **MariaDB ≥ 10.6** lokaal of op afstand

### 2. Database aanmaken
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS mindboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p -e "CREATE USER IF NOT EXISTS 'mindboard'@'localhost' IDENTIFIED BY 'MindDev-MindBoard1998'; GRANT ALL ON mindboard.* TO 'mindboard'@'localhost'; FLUSH PRIVILEGES;"
```

### 3. Installeren
```bash
npm install
npm run db:init     # bouwt het schema (sql/schema.sql)
npm run seed        # maakt admin + demo account en voorbeelddata
```

### 4. Starten
```bash
npm start           # → http://localhost:3002
```

**Standaard accounts** (na seed):

| Rol | E-mail | Wachtwoord |
|-----|--------|-----------|
| Admin | `admin@mindboard.dev` | `admin12345` |
| Demo | `demo@mindboard.dev` | `demo12345` |

### Configuratie via `.env` (optioneel)

Kopieer `.env.example` naar `.env` en pas aan:

```env
PORT=3002
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=mindboard
DB_PASSWORD=MindDev-MindBoard1998
DB_NAME=mindboard
JWT_SECRET=verander-dit-in-een-lang-geheim
```

---

## 🗄 API-overzicht

| Methode | Pad | Omschrijving |
|---------|-----|--------------|
| POST | `/api/auth/register` | Account aanmaken |
| POST | `/api/auth/login` | Inloggen |
| POST | `/api/auth/refresh` | Nieuwe access token |
| POST | `/api/auth/logout` | Uitloggen |
| GET | `/api/auth/me` | Huidige gebruiker |
| GET | `/api/users/me/overview` | Dashboard-data |
| PATCH | `/api/users/me` | Profiel bijwerken |
| GET/POST | `/api/orgs` | Organisaties |
| GET/PATCH/DELETE | `/api/orgs/:orgId` | Org detail/bewerken/verwijderen |
| POST/PATCH/DELETE | `/api/orgs/:orgId/members[/:userId]` | Leden beheren |
| POST/GET/DELETE | `/api/orgs/:orgId/invitations[/:id]` | Uitnodigingen |
| POST | `/api/invitations/:token/accept` | Uitnodiging accepteren |
| GET/POST | `/api/projects` | Projecten |
| GET/PATCH/DELETE | `/api/projects/:projectId` | Project beheren |
| POST/PATCH/DELETE | `/api/projects/:projectId/members[/:userId]` | Projectleden |
| POST | `/api/projects/:projectId/boards` | Bord aanmaken |
| GET | `/api/boards/:boardId` | Bord + kolommen + taken |
| PATCH/DELETE | `/api/boards/:boardId` | Bord bewerken/verwijderen |
| POST | `/api/boards/:boardId/columns` | Kolom aanmaken |
| PATCH/DELETE | `/api/columns/:columnId` | Kolom bewerken/verwijderen |
| POST | `/api/boards/:boardId/tasks` | Taak aanmaken |
| GET/PATCH/DELETE | `/api/tasks/:taskId` | Taak detail/bewerken/verwijderen |
| POST | `/api/tasks/:taskId/move` | Taak verplaatsen |
| POST | `/api/tasks/:taskId/comments` | Reactie toevoegen |
| DELETE | `/api/comments/:commentId` | Reactie verwijderen |
| POST | `/api/tasks/:taskId/checklists` | Checklist (subtaak) aanmaken |
| POST | `/api/tasks/:taskId/checklists/:clId/items` | Checklist-item toevoegen |
| PATCH/DELETE | `/api/tasks/:taskId/items/:itemId` | Item afvinken/bewerken/verwijderen |
| DELETE | `/api/tasks/:taskId/checklists/:clId` | Checklist verwijderen |
| GET | `/api/notifications?page=&limit=` | Notificaties (met paginering) |
| GET | `/api/search?q=…` | Zoeken over taken/projecten |
| GET | `/api/activity?orgId=…&page=&limit=` | Activiteitenlog (met paginering) |
| GET | `/api/projects/:projectId/export` | CSV-export van het project |
| GET | `/api/admin/stats` | Platformstatistieken |
| GET | `/api/admin/users` | Alle gebruikers |

Alle routes behalve `/api/auth/login|register|refresh|health` vereisen een
`Authorization: Bearer <token>` header.

---

## 🖥 Windows .exe bouwen

Eén enkel uitvoerbaar bestand, **zonder installatie**:

```bash
npm run exe
```

- Gebruikt [`@yao-pkg/pkg`](https://github.com/yao-pkg/pkg) (Node 22)
- Eerste keer downloadt het de Node.js binary van GitHub
- Output: `Dev/build/MindBoard.exe`
- De exe heeft een bereikbare MariaDB nodig (via `.env` naast de exe of omgevingsvariabelen)

> De `Dev/` map is **gitignored** — hierin horen builds, downloads en ander
> lokaal materiaal dat niet op GitHub hoeft.

---

## 🤖 Android APK bouwen

De frontend is een **installable PWA**: open de webapp in Chrome op Android en
kiess "Installeren op apparaat" — geen build nodig.

Wil je een echte APK (Capacitor-wrap), volg dan:

```bash
cd capacitor
npm install
npx cap add android        # vereist Java + Android SDK
npm run cap:sync           # kopieert public/ naar www/ en synct
cd android && ./gradlew assembleDebug
# → APK: android/app/build/outputs/apk/app-debug.apk
```

Vul in `capacitor/www/config.js` de URL van je server in:

```js
window.MB_API_BASE = 'https://mindboard.mijndomein.nl/api';
```

---

## 📁 Projectstructuur

```
MindBoard/
├── server.js              # entrypoint
├── start.sh               # start/stop/log helper
├── src/
│   ├── app.js             # Express-app
│   ├── config.js          # configuratie (env)
│   ├── db.js              # MariaDB connection pool
│   ├── utils.js           # helpers (hashing, slugs, tokens)
│   ├── middleware/
│   │   ├── auth.js        # JWT-auth + admin-check
│   │   └── rbac.js        # rolcontroles, activiteit, notificaties
│   ├── routes/            # auth, users, orgs, invitations, projects,
│   │                      # boards, tasks, notifications, search, admin
│   └── seed.js            # demo-data
├── sql/schema.sql         # databaseschema
├── public/                # SPA + PWA (frontend)
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   ├── manifest.json      # PWA-manifest
│   ├── sw.js              # service worker
│   └── icons/
├── capacitor/             # Android-skelet (APK)
│   ├── capacitor.config.json
│   ├── sync.js            # public/ → www/
│   └── www/
├── scripts/
│   ├── init-db.js         # npm run db:init
│   ├── pack-exe.js        # npm run exe
│   └── gen-icons.js       # PWA-icons genereren
└── Dev/                   # gitignored: builds, downloads, tools
```

---

## 🔒 Rollenmatrix (kort)

| Handeling | viewer | member | admin | owner | platform admin |
|-----------|--------|--------|-------|-------|----------------|
| Bord bekijken | ✅ | ✅ | ✅ | ✅ | ✅ |
| Taak aanmaken/verplaatsen | ❌ | ✅ | ✅ | ✅ | ✅ |
| Project bewerken | ❌ | ❌ | ✅ | ✅ | ✅ |
| Project verwijderen | ❌ | ❌ | ✅ | ✅ | ✅ |
| Org bewerken | ❌ | ❌ | ✅ | ✅ | ✅ |
| Org verwijderen | ❌ | ❌ | ❌ | ✅ | ✅ |
| Gebruikers beheren (platform) | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🧪 Tests

Backend-integratietests (vereist een draaiende MariaDB):

```bash
npm test
```

Draait 16 tests tegen de echte database: auth, RBAC, organisaties, projecten,
borden, taken, checklists, zoeken, activiteitenlog en CSV-export. De tests
maken zelf tijdelijk data aan en ruimen die weer op.

De Dev-map bevat daarnaast losse frontend-testscripts (jsdom) die de SPA-views
en -interacties controleren.

## 📋 Logging

- `data/logs/access.log` — elk verzoek (methode, pad, status, duur, IP)
- `data/logs/error.log` — serverfouten met stacktraces
- `data/server.log` — startup-log van `./start.sh`

## 🛠 Ontwikkeling

```bash
npm run dev        # node --watch
./start.sh start   # achtergrond met pidfile + log
./start.sh log     # volg de log
```

MindBoard draait op poort **3002**; wijzig via `PORT` in `.env`.

---

Licentie: MIT