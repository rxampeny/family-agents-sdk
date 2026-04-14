// ============================================================
// CONFIGURACIÓ BACKEND
// ============================================================

// Google Apps Script URL (backend de dades)
const GAS_URL = 'https://script.google.com/macros/s/AKfycbyH_zxFyGjYs2oT-fvssGAnNNXavfZmWeoXW6coCOGoNxTOqHAqTjgNYz7chxG2Kang3g/exec';

// URL del backend de Railway (chat IA)
const SUPABASE_URL = 'https://family-agents-sdk-production.up.railway.app';
const SUPABASE_ANON_KEY = '';

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

async function gasPost(payload) {
    // GAS no suporta preflight CORS, cal usar 'text/plain' en lloc de 'application/json'
    const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
        redirect: 'follow'
    });
    return res.json();
}

async function addBirthdayToSheet(data) {
    return gasPost({ action: 'CREATE', data });
}

async function addBirthdayToSheetForzado(data) {
    return gasPost({ action: 'CREATE_FORCE', data });
}

async function updateBirthdayInSheet(oldData, newData) {
    const json = await gasPost({ action: 'UPDATE', oldData, newData });
    return json.success;
}

async function deleteBirthdayFromSheet(data) {
    const json = await gasPost({ action: 'DELETE', data });
    return json.success;
}

// ============================================================
// ENVIAR EMAILS / SMS manuals
// ============================================================

async function sendBirthdayEmailsManually() {
    const btn = document.getElementById('sendEmailsBtn');
    if (btn) btn.disabled = true;
    try {
        const json = await gasPost({ action: 'SEND_EMAILS' });
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
        const json = await gasPost({ action: 'SEND_SMS' });
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
