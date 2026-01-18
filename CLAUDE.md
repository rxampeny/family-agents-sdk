# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Aniversaris familiars

Birthday management web app for family with automatic SMS and email notifications.

## Architecture Overview

**Frontend-only static app** hosted on Netlify that connects to a Google Apps Script backend:

- **Frontend:** Single-page app in `index.html` (contains all HTML, CSS, and JavaScript inline)
- **Backend:** Google Apps Script (`Code.gs` - not in repo due to credentials)
- **Database:** Google Sheets as data store
- **APIs:** Twilio (SMS), Gmail (email notifications)
- **Language:** Interface is in Catalan

### Key Files

- `index.html` - Main app (3400+ lines, contains entire frontend)
- `Code.gs` - Google Apps Script backend (excluded from git, stored only in Google Apps Script editor)
- `chatgptbot.js` - Unused Express/OpenAI chatbot (legacy file, not deployed)
- `public/` - Static assets (JSON data snapshots, icons)
- `test-*.html` - Test utilities for API connectivity

### Data Flow

```
index.html (user interface)
    ↓ fetch()
Google Apps Script API (AKfycbyH_zxFy...)
    ↓
Google Sheet (19ixIeSMF93UQKOoJ...)
    ↓ triggers
Code.gs functions → Twilio SMS / Gmail
```

## Google Sheets Structure

**Sheet ID:** `19ixIeSMF93UQKOoJGu7o_lsBCAqnf4Eo7CAIwtKMMI0`

Columns (A-AJ):

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
| Q | Eliminados - Nom | Log borrados: Nombre |
| R | Eliminados - Dia | Log borrados: Día |
| S | Eliminados - Mes | Log borrados: Mes |
| T | Eliminados - AnyNaixement | Log borrados: Año |
| U | Eliminados - Telèfon | Log borrados: Teléfono |
| V | Eliminados - Email | Log borrados: Email |
| W | Eliminados - Gènere | Log borrados: Género |
| X | Eliminados - Viu | Log borrados: Vivo |
| Y | Eliminados - Data | Log borrados: Fecha borrado |
| Z | Manteniment | Flag modo mantenimiento (Z2) |
| AA | Log - Email | Log emails: Destinatario |
| AB | Log - Data | Log emails: Fecha |
| AC | Log - Estat | Log emails: Estado |
| AD | Log - Error | Log emails: Error |
| AE | Log - Nom | Log emails: Nombre |
| AF | SMS - Telèfon | Log SMS: Teléfono |
| AG | SMS - Data | Log SMS: Fecha |
| AH | SMS - Estat | Log SMS: Estado |
| AI | SMS - Error | Log SMS: Error |
| AJ | SMS - Nom | Log SMS: Nombre |

## API Endpoints

**Google Apps Script URL:**
```
https://script.google.com/macros/s/AKfycbyH_zxFyGjYs2oT-fvssGAnNNXavfZmWeoXW6coCOGoNxTOqHAqTjgNYz7chxG2Kang3g/exec
```

**Methods:**
- GET `?action=getAllBirthdays` - Fetch all birthdays
- POST `{action: 'add', ...}` - Add new person
- POST `{action: 'update', ...}` - Update existing person
- POST `{action: 'delete', ...}` - Soft delete person
- POST `{action: 'sendBirthday', ...}` - Manual birthday greeting
- POST `{action: 'testTwilio'}` - Test Twilio SMS
- POST `{action: 'testEmail'}` - Test email

## Key Features

### 1. Birthday Management
- Add/edit/delete people with birthdays
- Supports deceased people (marked with `Viu: "No"`)
- Deceased people appear in calendar but don't receive notifications

### 2. Automatic Reminders
- Daily trigger (configured in Google Apps Script) checks for tomorrow's birthdays
- Sends reminder emails to ALL family members the day before
- SMS optional (disabled by default to save costs)
- Only sends to living people (`Viu: "Sí"`)

### 3. Birthday Greetings
- Manual sending via UI or automatic triggers
- SMS via Twilio (costs ~€0.07 per message)
- Email via Gmail (free up to 500/day)
- Tracks sent messages in Sheet columns

### 4. Statistics Dashboard
- Birthday distribution by month (Chart.js)
- Gender distribution
- Age statistics
- Deceased people marked with 🕊️ icon

## Development Commands

```bash
# Install dependencies
npm install

# Deploy to production
npm run deploy

# Deploy draft (testing)
npm run deploy:draft

# Check Netlify status
npm run netlify:status

# Open Netlify dashboard
npm run netlify:open
```

## Deployment

**Production URL:** https://family-aniversaris.netlify.app/
**Repository:** https://github.com/rxampeny/family

### Method 1: Automatic (GitHub)
Push to `master` branch triggers Netlify auto-deploy (if configured).

### Method 2: Manual via CLI
```bash
npm run deploy
```

### Method 3: Netlify Dashboard
Drag files to [app.netlify.com](https://app.netlify.com)

## Important Implementation Notes

### Working with index.html
- **Monolithic file:** All HTML, CSS, and JavaScript in one 116KB file
- **Line 1470:** Google Apps Script URL constant
- **Inline styles:** CSS starts at line ~22
- **JavaScript:** Starts after HTML (~line 1000+)
- When editing, search for function names or section comments

### Google Apps Script (Code.gs)
- **Location:** Google Apps Script editor (Extensions > Apps Script from Sheet)
- **Not in repo:** Contains Twilio credentials (Account SID, Auth Token)
- **Key functions:**
  - `doGet(e)` - Handle GET requests
  - `doPost(e)` - Handle POST requests
  - `sendBirthdayReminders()` - Daily reminder trigger
  - `getTomorrowBirthdays()` - Check next day's birthdays
  - `sendBirthdaySMS()` / `sendBirthdayEmail()` - Send greetings

### Testing Changes
1. Test locally by opening `index.html` in browser
2. API calls will hit production Google Apps Script
3. Test with `test-google-sheets-api.html` for API connectivity
4. Use `test-simple.html` for minimal testing

### Automatic Reminder Setup
Configure in Google Apps Script:
1. Open Apps Script editor (from Sheet)
2. Click Triggers (⏰ icon)
3. Add trigger:
   - Function: `sendBirthdayReminders`
   - Event: Time-driven
   - Type: Day timer
   - Time: 20:00-21:00 (8-9 PM)

## Security Considerations

- `Code.gs` excluded from repo (contains Twilio credentials)
- No authentication on frontend (family-only app)
- Google Apps Script URL is public but actions are logged
- Phone numbers and emails are sensitive data

## Cost Management

- **SMS:** ~€0.07 per message via Twilio
- **Email:** Free (Gmail quota: 500/day)
- **Hosting:** Free (Netlify)
- **Recommendation:** Use email for reminders, SMS only for direct birthday greetings

## Common Modifications

### Update greeting messages
Edit `Code.gs` functions:
- `generateBirthdayEmail()` - Email template
- `generateBirthdaySMS()` - SMS text
- `generateReminderEmail()` - Reminder email
- `generateReminderSMS()` - Reminder SMS

### Add new person fields
1. Add column to Google Sheet
2. Update `Code.gs` data parsing
3. Update `index.html` form and table rendering

### Change UI styling
All CSS is inline in `index.html` starting ~line 22. Look for the `<style>` tag.

## Troubleshooting

### "Error de connexió amb el servidor"
- Check Google Apps Script URL is correct (line 1470 in index.html)
- Verify Code.gs is deployed (Deploy > New deployment in Apps Script)
- Check browser console for CORS or network errors

### Reminders not sending
- Verify trigger exists in Apps Script (⏰ Triggers)
- Check tomorrow actually has birthdays (`testBirthdayReminders()`)
- Check maintenance mode is off (cell Z2 in Sheet)

### SMS not working
- Verify Twilio credentials in Code.gs
- Check phone format (Spain format: +34...)
- Test with `testTwilio` action via API

## File Versions

Note: Multiple documentation files exist from development iterations:
- `INSTRUCCIONES-RECORDATORIOS.md` - Reminder system setup guide
- `INSTRUCCIONES-PERSONAS-FALLECIDAS.md` - Deceased people feature
- `PROYECTO-COMPLETADO.md` - Project completion summary
- These are reference docs, not build artifacts
