# CLAUDE.md — Aniversaris Familiars

Guia tècnica per a Claude Code. Actualitzada: 2026-04-14.

## Stack tecnològic

| Capa | Tecnologia | URL / Ubicació |
|------|-----------|----------------|
| Frontend | HTML/CSS/JS (Netlify) | https://family-aniversaris.netlify.app/ |
| Dades CRUD | Google Apps Script → Google Sheets | veure URL a baix |
| Chat IA | FastAPI + GPT-4o (Railway) | https://family-agents-sdk-production.up.railway.app |
| Repositori | GitHub | https://github.com/rxampeny/family-agents-sdk |
| Desplegament frontend | Netlify auto-deploy en push a `master` | — |

**NO s'usa Supabase.** El fitxer `backend-client.js` és el connector al GAS + Railway (nom heretat de migració inacabada).

---

## Arquitectura

```
index.html (Netlify)
  ├── backend-client.js ──→ Google Apps Script ──→ Google Sheets
  │                               │ triggers automàtics
  │                             Twilio SMS / Gmail
  └── Chat "Assistència Familiar" ──→ Railway FastAPI ──→ GPT-4o
```

---

## URLs importants

| Recurs | URL |
|--------|-----|
| App producció | https://family-aniversaris.netlify.app/ |
| Repo GitHub | https://github.com/rxampeny/family-agents-sdk |
| Railway backend | https://family-agents-sdk-production.up.railway.app |
| Google Apps Script | https://script.google.com/macros/s/AKfycbyH_zxFyGjYs2oT-fvssGAnNNXavfZmWeoXW6coCOGoNxTOqHAqTjgNYz7chxG2Kang3g/exec |
| Google Sheet | https://docs.google.com/spreadsheets/d/19ixIeSMF93UQKOoJGu7o_lsBCAqnf4Eo7CAIwtKMMI0/edit |
| Railway dashboard | https://railway.com/project/351f2ae7-2859-4591-83cc-d681d46dcc95 |

---

## Fitxers clau

### Frontend (Netlify)
- **`index.html`** (~6000 línies) — app completa monolítica (HTML + CSS + JS tot inline)
- **`backend-client.js`** — connector al backend. Defineix `GAS_URL`, `SUPABASE_URL` (Railway), i implementa totes les funcions CRUD + emails/SMS
- **`netlify.toml`** — redirects SPA (/* → /index.html)
- **`test-google-sheets-api.html`** — eina de test per verificar connexió amb GAS

### Backend dades (Google Apps Script)
- **`Aniversaris.gs`** — **NO és al repo**, viu a l'editor Apps Script del Google Sheet (conté credencials Twilio). Accedir: Extensions > Apps Script des del Sheet.

### Backend chat (Railway)
- **`backend/main.py`** — FastAPI + OpenAI Agents SDK (gpt-4o, respon en català)
- **`backend/requirements.txt`** — dependències Python
- **`backend/Procfile`** — `web: uvicorn main:app --host 0.0.0.0 --port $PORT`
- **`backend/railway.json`** — configuració Railway (NIXPACKS)

---

## API Google Apps Script

**URL:** `https://script.google.com/macros/s/AKfycbyH_.../exec`

> **IMPORTANT CORS:** Sempre usar `Content-Type: 'text/plain'` (no `application/json`) per evitar el preflight OPTIONS que GAS no suporta.

| Mètode | Body | Acció |
|--------|------|-------|
| GET | — | Llegir tots els aniversaris |
| POST | `{action: 'CREATE', data: {...}}` | Afegir persona |
| POST | `{action: 'CREATE_FORCE', data: {...}}` | Afegir sense validar duplicats |
| POST | `{action: 'UPDATE', oldData: {...}, newData: {...}}` | Actualitzar |
| POST | `{action: 'DELETE', data: {...}}` | Eliminar |
| POST | `{action: 'SEND_EMAILS'}` | Enviar emails manualment |
| POST | `{action: 'SEND_SMS'}` | Enviar SMS manualment |

Resposta GET: `{ success: true, data: [...], count: N }`
Resposta POST: `{ success: true/false, error?: '...' }`
Mode manteniment: `{ maintenance: true, message: '...' }`

## API Railway (chat)

**URL:** `https://family-agents-sdk-production.up.railway.app`

| Mètode | Endpoint | Descripció |
|--------|----------|------------|
| POST | `/chat` | Enviar missatge al chat familiar |
| GET | `/health` | Health check (pot trigar si estava dormint) |
| GET | `/` | Status |

---

## Estructura Google Sheets

**Sheet ID:** `19ixIeSMF93UQKOoJGu7o_lsBCAqnf4Eo7CAIwtKMMI0` · **Full:** `Aniversaris`

| Col | Camp | Descripció |
|-----|------|------------|
| A | Nom | Nom complet |
| B | Dia | Dia de naixement |
| C | Mes | Mes de naixement |
| D | AnyNaixement | Any de naixement |
| E | Telefon | Telèfon (+34...) |
| F | Email | Correu electrònic |
| G | Gènere | Masculí/Femení |
| H | Viu | Sí/No (viu/difunt) — `No` = icona 🕊️, sense notificacions |
| I | Última modificació | Timestamp últim canvi |
| J | Pare ID | rowNumber del pare |
| K | Mare ID | rowNumber de la mare |
| L | Parella ID | rowNumber de la parella |
| M | URL Foto | Foto de la persona |
| N | estatRelacio | Estat de la relació |
| O | Lloc Naixement | Lloc de naixement |
| P | Any Mort | Any de defunció |
| Q-Y | Eliminados - ... | Log de persones eliminades |
| Z | Manteniment | Z2 = "SI" activa mode manteniment |
| AA-AE | Log - Email | Log d'emails enviats |
| AF-AJ | Log - SMS | Log de SMS enviats |

---

## Desplegament

### Frontend (Netlify) — auto-deploy via GitHub
```bash
git add .
git commit -m "descripció del canvi"
git push origin master
# Netlify fa l'auto-deploy (~1-2 min)
```

### Backend chat (Railway)
Railway fa l'auto-deploy automàticament quan `backend/` canvia al push.
Si el servei dorm (sleeping), es desperta sol amb la primera petició (~30s).

### Backend dades (Google Apps Script)
1. Obrir Google Sheet → Extensions > Apps Script
2. Editar `Aniversaris.gs` (CRUD + emails + SMS + triggers)
3. Desplegar: Deploy > Manage deployments > Edit > **Save new version**
4. Verificar: "Execute as: Me", "Who has access: Anyone"

---

## Funcionalitats

- **CRUD aniversaris** — afegir, editar, eliminar persones
- **Calendari interactiu** — swipe entre mesos
- **Notificacions automàtiques** — emails i SMS el dia de l'aniversari (trigger GAS a les 8h)
- **Recordatoris** — email + SMS el dia anterior (trigger GAS a les 20h)
- **Persones difuntes** — icona 🕊️, no reben notificacions
- **Estadístiques** — distribució per mes, gènere, edats (Chart.js)
- **Arbre genealògic** — visualització amb D3.js
- **Chat IA "Assistència Familiar"** — GPT-4o, respon en català sobre l'arbre familiar

---

## Troubleshooting

### Botons "Enviar emails" / "Enviar SMS" → "Error de connexió"
- Verificar que `backend-client.js` usa `Content-Type: 'text/plain'` a `gasPost()`
- Obrir F12 > Network, buscar la petició fallida per veure l'error real
- Comprovar que el GAS està desplegat i accessible

### Chat no respon
- Primera petició pot trigar ~30s si Railway estava dormint
- Health check: https://family-agents-sdk-production.up.railway.app/health
- Verificar `SUPABASE_URL` a `backend-client.js`

### Dades no sincronitzen / CRUD no funciona
- Si la web mostra dades velles: és el caché localStorage (funciona sense connexió)
- Mode manteniment actiu? Verificar cel·la Z2 del Sheet (ha de ser buit o "NO")
- GAS no desplegat? Redesplegar: Deploy > Manage deployments > Edit > Save new version

### "X is not defined" a la consola
- Si les funcions `fetchBirthdays`, `sendBirthdayEmailsManually`, etc. no estan definides: `backend-client.js` no s'ha carregat correctament
- Verificar que el fitxer existeix al deploy (deploy-manifest.json)

---

## Seguretat
- `Aniversaris.gs` **NO** al repo (conté credencials Twilio: SID, Token, telèfon)
- No hi ha autenticació al frontend (app familiar privada, accés per contrasenya simple)
- La URL del GAS és pública però les accions queden registrades al Sheet
