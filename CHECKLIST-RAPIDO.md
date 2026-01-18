# ✅ CHECKLIST RÁPIDO - Arreglar POST Requests

## 🎯 OBJETIVO
Hacer que los cambios desde la web se guarden en Google Sheets

---

## 📝 PASOS A SEGUIR (5 minutos)

### ✓ PASO 1: Abrir Google Apps Script
1. Abre Google Sheet: "Víctor Català 1971 - Aniversaris"
2. Menú → Extensiones → Apps Script
3. Debería abrirse una pestaña nueva con el editor

### ✓ PASO 2: Verificar el código
1. Lado izquierdo → Haz clic en `Code.gs`
2. ¿Ves este código al inicio?
   ```
   const SHEET_NAME = 'Aniversaris';

   function doGet(e) {
   ```
3. **SI NO**: Abre el archivo `Code.gs` de esta carpeta, copia TODO y pega en el editor
4. Guarda (Ctrl+S)

### ✓ PASO 3: Redesplegar (CRÍTICO)
1. Botón azul **"Deploy"** (arriba a la derecha)
2. **"Manage deployments"**
3. Icono **lápiz ✏️** al lado del deployment
4. **"Version"** → Selecciona **"New version"** ⚠️ IMPORTANTE
5. **"Who has access"** → **"Anyone"** ⚠️ IMPORTANTE
6. Botón **"Deploy"**
7. Espera el mensaje de confirmación
8. Cierra el modal

### ✓ PASO 4: Probar
1. Abre `test-google-sheets-api.html` en tu navegador
2. Haz clic en "➕ Probar CREATE"
3. **¿Sale ✅?** → ¡FUNCIONA!
4. **¿Sale ❌?** → Vuelve al Paso 3, verifica "New version" y "Anyone"

---

## 🚨 LO MÁS IMPORTANTE

### DOS cosas que DEBES hacer en el Paso 3:

1. **"New version"** ← Sin esto, el código antiguo sigue activo
2. **"Who has access" = "Anyone"** ← Sin esto, POST requests fallan

### Si olvidaste uno de estos, repite el Paso 3 correctamente

---

## ✅ CÓMO SABER SI FUNCIONÓ

### ✅ SEÑALES DE ÉXITO:
- `test-google-sheets-api.html` → Botón CREATE muestra ✅
- Aparece "TEST_API" al final de Google Sheets
- `index.html` → Al añadir aniversario dice "✅ Aniversari afegit a Google Sheets"

### ❌ SEÑALES DE QUE AÚN NO FUNCIONA:
- `test-google-sheets-api.html` → Botón CREATE muestra ❌ Error de red
- `index.html` → Dice "⚠️ Error al sincronitzar. Canvis guardats localment"
- Los cambios no aparecen en Google Sheets

---

## 🔄 SI SIGUE SIN FUNCIONAR

1. **Espera 1-2 minutos** y prueba de nuevo
2. **Abre ventana privada** (Ctrl+Shift+N) y prueba ahí
3. **Presiona F12** en el navegador → Pestaña "Console" → Mira los errores en rojo
4. **Repite el Paso 3** asegurándote de seleccionar "New version"

---

## 📞 NECESITAS AYUDA?

Abre el archivo `DIAGNOSTICO-POST-REQUESTS.md` para información detallada sobre cada error posible.

---

**Tiempo estimado:** 5 minutos
**Dificultad:** Fácil
**Requisito:** Seguir los pasos exactamente como están escritos
