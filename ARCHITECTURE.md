# Arquitectura del Proyecto: Aniversaris Familiars

## Diagrama General

```
                                    USUARIO
                                       │
                                       ▼
                    ┌──────────────────────────────────────┐
                    │           NETLIFY (Hosting)          │
                    │   https://family-aniversaris.app     │
                    │                                      │
                    │  ┌────────────────────────────────┐  │
                    │  │         index.html             │  │
                    │  │   (HTML + CSS + JavaScript)    │  │
                    │  │        ~224KB monolítico       │  │
                    │  └──────────────┬─────────────────┘  │
                    │                 │                    │
                    │  ┌──────────────┴─────────────────┐  │
                    │  │          public/               │  │
                    │  │   (imágenes, JSON, iconos)     │  │
                    │  └────────────────────────────────┘  │
                    └──────────────────┬───────────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
              ▼                        ▼                        ▼
┌─────────────────────────┐ ┌───────────────────┐ ┌─────────────────────────┐
│   GOOGLE APPS SCRIPT    │ │      RAILWAY      │ │      TWILIO API         │
│                         │ │                   │ │                         │
│  ┌───────────────────┐  │ │  ┌─────────────┐  │ │  Envío de SMS           │
│  │     Code.gs       │  │ │  │  main.py    │  │ │  (~0.07€/mensaje)       │
│  │    (~49KB)        │  │ │  │  (FastAPI)  │  │ └─────────────────────────┘
│  │                   │  │ │  └──────┬──────┘  │
│  │  - doGet()        │  │ │         │         │
│  │  - doPost()       │  │ │         ▼         │
│  │  - sendSMS()      │  │ │  ┌─────────────┐  │
│  │  - sendEmail()    │  │ │  │  Claude AI  │  │
│  │  - triggers       │  │ │  │  (Anthropic)│  │
│  └─────────┬─────────┘  │ │  └─────────────┘  │
│            │            │ │                   │
│            ▼            │ │   Chat Assistant  │
│  ┌───────────────────┐  │ │   "Gestor         │
│  │   GOOGLE SHEETS   │  │ │    Familiar"      │
│  │                   │  │ └───────────────────┘
│  │  Base de datos    │  │
│  │  con toda la      │  │
│  │  información      │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

## Estructura de Archivos Local

```
family2/
│
├── index.html              # FRONTEND PRINCIPAL (todo en uno)
│   ├── HTML (~líneas 1-5900)
│   ├── CSS inline (~líneas 22-800)
│   └── JavaScript (~líneas 5900-6200)
│
├── Code.gs                 # BACKEND Google Apps Script (copia local)
│   ├── doGet/doPost        # API endpoints
│   ├── CRUD personas       # Crear, leer, actualizar, borrar
│   ├── sendBirthdaySMS()   # Envío SMS via Twilio
│   ├── sendBirthdayEmail() # Envío emails via Gmail
│   └── Triggers diarios    # Recordatorios automáticos
│
├── backend/                # BACKEND Railway (Chat IA)
│   ├── main.py             # FastAPI server
│   ├── requirements.txt    # Dependencias Python
│   ├── Procfile            # Config Railway
│   └── railway.json        # Deploy config
│
├── public/                 # ASSETS ESTÁTICOS
│   ├── *.jpg, *.png        # Fotos de familia
│   ├── *.svg               # Iconos
│   └── *.json              # Datos de prueba
│
├── test-*.html             # Archivos de test
├── *.md                    # Documentación
├── netlify.toml            # Config Netlify
└── package.json            # Scripts npm (deploy)
```

## Flujos de Datos

### 1. Gestión de Cumpleaños (CRUD)
```
Usuario → index.html → fetch() → Google Apps Script → Google Sheets
                                        ↓
                              Respuesta JSON ← ← ←
```

### 2. Recordatorios Automáticos (Trigger diario 20:00-21:00)
```
Google Apps Script (trigger)
        ↓
Lee Google Sheets (cumpleaños de mañana)
        ↓
    ┌───┴───┐
    ▼       ▼
  Gmail   Twilio
(emails)  (SMS)
```

### 3. Chat Asistente IA
```
Usuario → Chat en index.html → Railway API → Claude AI
                                    ↓
                          Respuesta ← ← ←
```

## URLs y Endpoints

| Servicio | URL |
|----------|-----|
| **Frontend** | https://family-aniversaris.netlify.app |
| **Google Apps Script** | https://script.google.com/macros/s/AKfycby...3g/exec |
| **Railway Chat** | https://family-agents-sdk-production.up.railway.app/chat |
| **Google Sheet** | ID: 19ixIeSMF93UQKOoJGu7o_lsBCAqnf4Eo7CAIwtKMMI0 |

## Columnas Google Sheets (A-AJ)

| Col | Camp | Descripció |
|-----|------|------------|
| A | Nom | Nombre |
| B | Dia | Día nacimiento |
| C | Mes | Mes nacimiento |
| D | AnyNaixement | Año nacimiento |
| E | Telefon | Teléfono (+34...) |
| F | Email | Correo electrónico |
| G | Gènere | Masculí/Femení |
| H | Viu | Sí/No (vivo/fallecido) |
| I | Última modificació | Timestamp última modificación |
| J | Pare ID | ID del padre |
| K | Mare ID | ID de la madre |
| L | Parella ID | ID de la pareja |
| M | URL Foto | Enlace a foto |
| N | estatRelacio | Estado de la relación |
| O | Lloc Naixement | Lugar de nacimiento |
| P | Any Mort | Año de fallecimiento |
| Q-Y | Eliminados | Log de personas borradas (Nom, Dia, Mes, Any, Tel, Email, Gènere, Viu, Data) |
| Z | Manteniment | Flag modo mantenimiento (Z2) |
| AA-AE | Log Email | Historial emails (Email, Data, Estat, Error, Nom) |
| AF-AJ | Log SMS | Historial SMS (Telèfon, Data, Estat, Error, Nom) |

## Tecnologías Utilizadas

| Componente | Tecnología |
|------------|------------|
| Frontend | HTML5, CSS3, JavaScript vanilla |
| Gráficos | Chart.js |
| Backend API | Google Apps Script |
| Base de datos | Google Sheets |
| Chat IA | FastAPI + Claude AI (Anthropic) |
| SMS | Twilio API |
| Email | Gmail (via Apps Script) |
| Hosting Frontend | Netlify |
| Hosting Chat | Railway |

## Costes

| Servicio | Coste |
|----------|-------|
| Netlify (hosting) | Gratis |
| Railway (chat) | ~$5/mes (plan hobby) |
| Google Apps Script | Gratis |
| Google Sheets | Gratis |
| Gmail | Gratis (500 emails/día) |
| Twilio SMS | ~0.07€/mensaje |
