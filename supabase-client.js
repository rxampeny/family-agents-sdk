/**
 * Cliente Supabase para Aniversaris Familiars
 *
 * Este archivo reemplaza las llamadas a Google Apps Script
 * por llamadas al cliente de Supabase.
 *
 * CONFIGURACIÓN:
 * 1. Reemplaza SUPABASE_URL con tu URL de proyecto
 * 2. Reemplaza SUPABASE_ANON_KEY con tu clave anónima
 * 3. Incluye este archivo antes del código principal en index.html
 */

// ============================================
// CONFIGURACIÓN DE SUPABASE
// ============================================

const SUPABASE_URL = 'https://bfforytzxicguykosnna.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZm9yeXR6eGljZ3V5a29zbm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTI4MTksImV4cCI6MjA4NTI4ODgxOX0.ujygN5bitFkQqqlaU4Fj9_68sxrF_5cTzW4dKlqC48c';

// URL base para Edge Functions
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

// Variable para controlar sincronización
let isSyncing = false;

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

/**
 * Hacer una petición a una Edge Function de Supabase
 */
async function callEdgeFunction(functionName, data = null, method = 'POST') {
    const url = `${FUNCTIONS_URL}/${functionName}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY
        }
    };

    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    return await response.json();
}

/**
 * Hacer una petición directa a la API REST de Supabase
 */
async function supabaseRest(table, method = 'GET', data = null, filters = '') {
    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    if (filters) {
        url += `?${filters}`;
    }

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
            'Prefer': method === 'POST' ? 'return=representation' : undefined
        }
    };

    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Error ${response.status}: ${error}`);
    }

    return await response.json();
}

// ============================================
// MÓDULO DE API PARA SUPABASE
// ============================================

/**
 * Cargar todos los aniversarios desde Supabase
 * Reemplaza: fetchBirthdays() con Google Apps Script
 */
async function fetchBirthdays() {
    try {
        const result = await callEdgeFunction('get-personas', null, 'GET');

        // Verificar modo mantenimiento
        if (result.maintenance) {
            showMaintenanceMode(result.message);
            return null;
        }

        if (result.success && result.data) {
            return result.data;
        } else {
            console.error('Error al cargar datos:', result.error);
            return null;
        }
    } catch (error) {
        console.error('Error de red al cargar aniversarios:', error);
        return null;
    }
}

/**
 * Mostrar pantalla de mantenimiento
 */
function showMaintenanceMode(message) {
    document.body.innerHTML = `
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            text-align: center;
            padding: 20px;
        ">
            <div style="font-size: 5rem; margin-bottom: 20px;">🔧</div>
            <h1 style="font-size: 2.5rem; margin: 0 0 20px 0; font-weight: 600;">Manteniment</h1>
            <p style="font-size: 1.3rem; max-width: 600px; line-height: 1.6; opacity: 0.95;">
                ${message || 'En manteniment, disculpa les molèsties. En breu tornem'}
            </p>
            <button onclick="location.reload()" style="
                margin-top: 30px;
                padding: 12px 30px;
                font-size: 1rem;
                background: white;
                color: #667eea;
                border: none;
                border-radius: 25px;
                cursor: pointer;
                font-weight: 600;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                transition: transform 0.2s;
            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                🔄 Tornar a intentar
            </button>
        </div>
    `;
}

/**
 * Añadir un nuevo aniversario a Supabase
 * Reemplaza: addBirthdayToSheet()
 */
async function addBirthdayToSheet(birthday) {
    if (isSyncing) return { success: false, error: 'Sincronització en curs' };
    isSyncing = true;

    try {
        const result = await callEdgeFunction('create-persona', {
            data: birthday,
            force: false
        });

        isSyncing = false;

        if (result.success) {
            console.log('Aniversari afegit a Supabase');
        }
        return result;
    } catch (error) {
        isSyncing = false;
        console.error('Error de xarxa al afegir:', error);
        return { success: false, error: error.toString() };
    }
}

/**
 * Añadir un aniversario forzadamente (sin validación de duplicados)
 * Reemplaza: addBirthdayToSheetForzado()
 */
async function addBirthdayToSheetForzado(birthday) {
    if (isSyncing) return { success: false, error: 'Sincronització en curs' };
    isSyncing = true;

    try {
        const result = await callEdgeFunction('create-persona', {
            data: birthday,
            force: true  // Saltar validación de duplicados
        });

        isSyncing = false;

        if (result.success) {
            console.log('Aniversari afegit forçadament a Supabase');
        }
        return result;
    } catch (error) {
        isSyncing = false;
        console.error('Error de xarxa al afegir forçadament:', error);
        return { success: false, error: error.toString() };
    }
}

/**
 * Actualizar un aniversario existente en Supabase
 * Reemplaza: updateBirthdayInSheet()
 */
async function updateBirthdayInSheet(oldData, newData) {
    if (isSyncing) return false;
    isSyncing = true;

    try {
        const result = await callEdgeFunction('update-persona', {
            oldData: oldData,
            newData: newData
        });

        isSyncing = false;

        if (result.success) {
            console.log('Aniversari actualitzat a Supabase');
            return true;
        } else {
            console.error('Error al actualitzar:', result.error);
            return false;
        }
    } catch (error) {
        isSyncing = false;
        console.error('Error de xarxa al actualitzar:', error);
        return false;
    }
}

/**
 * Eliminar un aniversario de Supabase
 * Reemplaza: deleteBirthdayFromSheet()
 */
async function deleteBirthdayFromSheet(birthday) {
    if (isSyncing) return false;
    isSyncing = true;

    try {
        const result = await callEdgeFunction('delete-persona', {
            data: birthday
        });

        isSyncing = false;

        if (result.success) {
            console.log('Aniversari eliminat de Supabase');
            return true;
        } else {
            console.error('Error al eliminar:', result.error);
            return false;
        }
    } catch (error) {
        isSyncing = false;
        console.error('Error de xarxa al eliminar:', error);
        return false;
    }
}

/**
 * Enviar emails de cumpleaños manualmente
 * Reemplaza: sendBirthdayEmailsManually()
 */
async function sendBirthdayEmailsManually() {
    // Verificar si hay cumpleaños hoy
    const now = new Date();
    const cumpleHoy = dadesAniversaris.filter(d =>
        d.dia === now.getDate() && d.mes === (now.getMonth() + 1)
    );

    // Si no hay cumpleaños hoy
    if (cumpleHoy.length === 0) {
        alert('No hi ha aniversaris avui per enviar emails.');
        return;
    }

    // Verificar si tienen emails
    const sinEmail = cumpleHoy.filter(d => !d.email || d.email.trim() === '');
    const conEmail = cumpleHoy.filter(d => d.email && d.email.trim() !== '');

    if (conEmail.length === 0) {
        alert(`Avui és l'aniversari de:\n\n${cumpleHoy.map(d => `• ${d.nom}`).join('\n')}\n\nPerò cap d'ells té email registrat.\n\nSi us plau, afegeix els emails primer.`);
        return;
    }

    // Mostrar información de a quién se enviará
    let mensaje = '';
    if (conEmail.length > 0) {
        mensaje = `S'enviaran emails a:\n\n${conEmail.map(d => `✅ ${d.nom}`).join('\n')}`;
    }
    if (sinEmail.length > 0) {
        mensaje += `\n\n⚠️ Sense email (no s'enviarà):\n${sinEmail.map(d => `• ${d.nom}`).join('\n')}`;
    }
    mensaje += '\n\nVols continuar?';

    if (!confirm(mensaje)) {
        return;
    }

    const btn = document.getElementById('sendEmailsBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '⏳ Enviant...';

    try {
        const result = await callEdgeFunction('send-birthday-emails');

        if (result.success) {
            showSyncMessage(`✅ Emails enviats: ${result.sent || 0}`, false);
        } else {
            showSyncMessage('⚠️ Error: ' + (result.error || 'Error desconegut'), true);
        }

    } catch (error) {
        console.error('Error al enviar emails:', error);
        showSyncMessage('⚠️ Error de xarxa al enviar emails', true);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

/**
 * Enviar SMS de cumpleaños manualmente
 * Reemplaza: sendBirthdaySMSManually()
 */
async function sendBirthdaySMSManually() {
    // Verificar si hay cumpleaños hoy
    const now = new Date();
    const cumpleHoy = dadesAniversaris.filter(d =>
        d.dia === now.getDate() && d.mes === (now.getMonth() + 1)
    );

    // Si no hay cumpleaños hoy
    if (cumpleHoy.length === 0) {
        alert('No hi ha aniversaris avui per enviar SMS.');
        return;
    }

    // Verificar si tienen teléfono
    const sinTelefon = cumpleHoy.filter(d => !d.telefon || d.telefon.toString().trim() === '');
    const conTelefon = cumpleHoy.filter(d => d.telefon && d.telefon.toString().trim() !== '');

    if (conTelefon.length === 0) {
        alert(`Avui és l'aniversari de:\n\n${cumpleHoy.map(d => `• ${d.nom}`).join('\n')}\n\nPerò cap d'ells té telèfon registrat.\n\nSi us plau, afegeix els telèfons primer.`);
        return;
    }

    // Mostrar información de a quién se enviará
    let mensaje = '';
    if (conTelefon.length > 0) {
        mensaje = `S'enviaran SMS a:\n\n${conTelefon.map(d => `✅ ${d.nom} (${d.telefon})`).join('\n')}`;
    }
    if (sinTelefon.length > 0) {
        mensaje += `\n\n⚠️ Sense telèfon (no s'enviarà):\n${sinTelefon.map(d => `• ${d.nom}`).join('\n')}`;
    }
    mensaje += '\n\nVols continuar?';

    if (!confirm(mensaje)) {
        return;
    }

    const btn = document.getElementById('sendSmsBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '⏳ Enviant...';

    try {
        const result = await callEdgeFunction('send-birthday-sms');

        if (result.success) {
            showSyncMessage(`✅ SMS enviats: ${result.sent || 0}`, false);
        } else {
            showSyncMessage('⚠️ Error: ' + (result.error || 'Error desconegut'), true);
        }

    } catch (error) {
        console.error('Error al enviar SMS:', error);
        showSyncMessage('⚠️ Error de xarxa al enviar SMS', true);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

/**
 * Mostrar mensaje de sincronización
 */
function showSyncMessage(message, isError = false) {
    const existingMsg = document.getElementById('syncMessage');
    if (existingMsg) existingMsg.remove();

    const msgDiv = document.createElement('div');
    msgDiv.id = 'syncMessage';
    msgDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${isError ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)' : 'linear-gradient(135deg, #28a745 0%, #218838 100%)'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-size: 0.9rem;
        animation: slideIn 0.3s ease-out;
    `;
    msgDiv.textContent = message;
    document.body.appendChild(msgDiv);

    setTimeout(() => {
        msgDiv.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => msgDiv.remove(), 300);
    }, 3000);
}

// ============================================
// CHAT API (reemplaza Railway backend)
// ============================================

/**
 * Enviar mensaje al chat de IA
 * Reemplaza: llamadas al backend de Railway
 */
async function sendChatMessage(message, files = []) {
    try {
        const result = await callEdgeFunction('chat', {
            message: message,
            files: files
        });

        return {
            success: result.status === 'success',
            response: result.response,
            error: result.error
        };
    } catch (error) {
        console.error('Error al enviar mensaje al chat:', error);
        return {
            success: false,
            response: 'Error de connexió amb el servidor de chat.',
            error: error.toString()
        };
    }
}

// ============================================
// EXPORTAR FUNCIONES (para uso en index.html)
// ============================================

// Las funciones están disponibles globalmente al incluir este script
console.log('✅ Cliente Supabase cargado correctamente');
console.log(`   URL: ${SUPABASE_URL}`);
