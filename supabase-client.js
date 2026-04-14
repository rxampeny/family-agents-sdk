// ============================================================
// CONFIGURACIÓ BACKEND
// ============================================================

// Google Apps Script URL (backend de dades)
const GAS_URL = 'https://script.google.com/macros/s/AKfycbyH_zxFyGjYs2oT-fvssGAnNNXavfZmWeoXW6coCOGoNxTOqHAqTjgNYz7chxG2Kang3g/exec';

// URL del backend de Railway (chat IA)
// Per trobar la URL: Railway dashboard → projecte → Service → Settings → Domains
const SUPABASE_URL = 'https://family-agents-sdk-production.up.railway.app';
const SUPABASE_ANON_KEY = ''; // Railway no usa Supabase auth key

// ============================================================
// CRUD via Google Apps Script
// ============================================================

async function fetchBirthdays() {
    const res = await fetch(GAS_URL);
    const json = await res.json();
    if (json.maintenance) {
        showMaintenanceMode(json.message);
        return [];
    }
    return json.data || [];
}

async function addBirthdayToSheet(data) {
    const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE', data })
    });
    return res.json();
}

async function addBirthdayToSheetForzado(data) {
    const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_FORCE', data })
    });
    return res.json();
}

async function updateBirthdayInSheet(oldData, newData) {
    const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE', oldData, newData })
    });
    const json = await res.json();
    return json.success;
}

async function deleteBirthdayFromSheet(data) {
    const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE', data })
    });
    const json = await res.json();
    return json.success;
}

// ============================================================
// ENVIAR EMAILS / SMS manuals
// ============================================================

async function sendBirthdayEmailsManually() {
    const btn = document.getElementById('sendEmailsBtn');
    if (btn) btn.disabled = true;
    try {
        const res = await fetch(GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'SEND_EMAILS' })
        });
        const json = await res.json();
        if (json.success) {
            showSyncMessage('✅ Emails enviats correctament', false);
        } else {
            showSyncMessage('⚠️ ' + (json.error || 'Error enviant emails'), true);
        }
    } catch (e) {
        showSyncMessage('⚠️ Error de connexió enviant emails', true);
    } finally {
        if (btn) btn.disabled = false;
    }
}

async function sendBirthdaySMSManually() {
    const btn = document.getElementById('sendSmsBtn');
    if (btn) btn.disabled = true;
    try {
        const res = await fetch(GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'SEND_SMS' })
        });
        const json = await res.json();
        if (json.success) {
            showSyncMessage('✅ SMS enviats correctament', false);
        } else {
            showSyncMessage('⚠️ ' + (json.error || 'Error enviant SMS'), true);
        }
    } catch (e) {
        showSyncMessage('⚠️ Error de connexió enviant SMS', true);
    } finally {
        if (btn) btn.disabled = false;
    }
}

// ============================================================
// UI HELPERS
// ============================================================

function showSyncMessage(msg, isError = false) {
    let toast = document.getElementById('syncToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'syncToast';
        toast.style.cssText = [
            'position: fixed',
            'bottom: 80px',
            'left: 50%',
            'transform: translateX(-50%)',
            'padding: 10px 20px',
            'border-radius: 20px',
            'font-size: 0.9rem',
            'z-index: 9999',
            'transition: opacity 0.5s',
            'color: white',
            'pointer-events: none'
        ].join(';');
        document.body.appendChild(toast);
    }
    toast.style.background = isError ? '#e74c3c' : '#27ae60';
    toast.style.opacity = '1';
    toast.textContent = msg;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

function showMaintenanceMode(msg) {
    showSyncMessage('🔧 ' + (msg || 'App en manteniment'), true);
}
