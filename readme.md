# VICTORIA - Aniversaris Víctor Català 1971

App web para gestionar cumpleaños del grupo "Víctor Català 1971" con notificaciones automáticas por SMS y email.

## Tecnologías

- **Frontend:** HTML, CSS, JavaScript vanilla
- **Backend:** Google Apps Script (API REST)
- **Base de datos:** Google Sheets
- **SMS:** Twilio API
- **Hosting:** Netlify
- **Repositorio:** GitHub

## URLs

- **Producción:** https://victor-catala-19711971.netlify.app/
- **Repositorio:** https://github.com/rxampeny/VICTORIA
- **Google Sheet ID:** `19ixIeSMF93UQKOoJGu7o_lsBCAqnf4Eo7CAIwtKMMI0`
- **Google Sheet URL:** https://docs.google.com/spreadsheets/d/19ixIeSMF93UQKOoJGu7o_lsBCAqnf4Eo7CAIwtKMMI0/edit
- **API URL:** https://script.google.com/macros/s/AKfycbwMQGj6GooGyBlya6ySIFeK-5I-_EP0h15AZBrh3SaNEcIvRYDWghrYPaJeZUmiN2v7mg/exec

## Desarrollo Local

### Instalación
```bash
npm install
```

### Scripts Disponibles

```bash
# Deploy a producción
npm run deploy

# Deploy borrador (para testing)
npm run deploy:draft

# Ver estado de Netlify
npm run netlify:status

# Abrir dashboard de Netlify
npm run netlify:open
```

## Deploy

### Opción 1: Automático via GitHub
1. Haz push a la rama `main`
2. Netlify desplegará automáticamente (si está configurado)

```bash
git add .
git commit -m "Descripción del cambio"
git push origin main
```

### Opción 2: Manual via Netlify CLI
```bash
npm run deploy
```

### Opción 3: Dashboard de Netlify
1. Ve a [app.netlify.com](https://app.netlify.com)
2. Arrastra los archivos al dashboard

## Estructura del Proyecto

```
VICTORIA/
├── index.html              # App principal
├── chatgptbot.js          # Lógica del frontend
├── escola-victor-catala.png  # Logo
├── public/                # Archivos estáticos
│   ├── aniversaris.json
│   └── ...
├── .claude/commands/      # Comandos personalizados
├── Code.gs               # Google Apps Script (no en repo por seguridad)
└── package.json          # Dependencias y scripts
```

## Configuración Inicial de Netlify

Si es la primera vez que configuras el proyecto:

### Via Dashboard (Recomendado)
1. Ve a [app.netlify.com](https://app.netlify.com)
2. "Add new site" → "Import an existing project"
3. Conecta con GitHub
4. Selecciona `rxampeny/VICTORIA`
5. Configuración:
   - Build command: (vacío)
   - Publish directory: `.`
6. Deploy

### Via CLI
```bash
npx netlify init
# Selecciona: Create & configure a new project
# Sigue las instrucciones interactivas
```

## Seguridad

**Importante:** El archivo `Code.gs` contiene credenciales sensibles de Twilio y está excluido del repositorio via `.gitignore`. Mantenlo solo localmente y en Google Apps Script.

## Comandos de Claude Code

El proyecto incluye comandos personalizados en `.claude/commands/`:

- `/test` - Verificar que los comandos funcionan
- `/deploy` - Deploy completo a Netlify
- `/test-sheets` - Probar conexión con Google Sheets
- `/test-twilio` - Probar envío de SMS
- `/stats` - Estadísticas del proyecto
- `/backup` - Backup de datos

## Desarrollador

**Rafa** (rxampeny)
rafaxampeny@gmail.com

---

Hecho con Claude Code
