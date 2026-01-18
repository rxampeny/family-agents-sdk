# 🔍 DIAGNÓSTICO: POST Requests Fallando

## ❌ PROBLEMA ACTUAL

**Síntoma**: NetworkError al intentar hacer POST a Google Apps Script

```
TypeError: NetworkError when attempting to fetch resource
```

- ✅ **GET funciona**: Los datos se cargan desde Google Sheets → Web
- ❌ **POST falla**: Los cambios desde Web NO se guardan en Google Sheets

## 🎯 CAUSA MÁS PROBABLE

El Google Apps Script **NO está desplegado correctamente** o **no tiene permisos públicos**.

## 🛠️ SOLUCIÓN PASO A PASO

### PASO 1: Verificar el código en Google Apps Script

1. **Abre tu Google Sheet**: "Víctor Català 1971 - Aniversaris"
2. **Menú**: Extensiones > Apps Script
3. **Verifica** que veas un archivo llamado `Code.gs` en la lista de archivos (lado izquierdo)
4. **Haz clic en `Code.gs`** para abrirlo
5. **Verifica** que el código empiece con:
   ```javascript
   const SHEET_NAME = 'Aniversaris';

   function doGet(e) {
   ```

6. **Si el código NO está o es diferente**:
   - Abre el archivo `Code.gs` de esta carpeta
   - **Copia TODO el contenido**
   - **Pégalo** en el editor de Google Apps Script (reemplazar todo)
   - **Guarda** (Ctrl+S o icono 💾)

### PASO 2: Redesplegar con Nueva Versión (CRÍTICO)

Este es el paso más importante:

1. **En Google Apps Script**, haz clic en el botón azul **"Deploy"** (esquina superior derecha)
2. **Selecciona**: "Manage deployments"
3. **Verás** una lista con al menos 1 deployment
4. **Haz clic** en el icono de **lápiz** (✏️) al lado del deployment activo
5. **MUY IMPORTANTE**: En el campo "Version", haz clic y selecciona **"New version"**
   - Esto es CRÍTICO porque los cambios no se aplican hasta crear nueva versión
6. **Verifica** estos ajustes:
   - **Execute as**: Me (tu email)
   - **Who has access**: **Anyone** ← DEBE ser "Anyone", NO "Only myself"
7. **Haz clic** en "Deploy"
8. **Copia** la nueva URL que aparece (debería terminar en `/exec`)

### PASO 3: Actualizar URL en index.html (si cambió)

Si la URL cambió en el paso anterior:

1. **Abre** `index.html` en un editor de texto
2. **Busca** la línea (aproximadamente línea 1285):
   ```javascript
   const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/...';
   ```
3. **Reemplaza** con la nueva URL
4. **Guarda** el archivo

### PASO 4: Verificar que funciona

1. **Abre** `test-google-sheets-api.html` en tu navegador
2. **Haz clic** en "🔍 Probar GET" → Debería mostrar ✅
3. **Haz clic** en "➕ Probar CREATE" → **Ahora debería mostrar ✅**
4. **Abre Google Sheets** y verifica que aparezca "TEST_API" al final
5. **Haz clic** en "🗑️ Probar DELETE" → Debería eliminar "TEST_API"

## 🔧 PROBLEMAS COMUNES Y SOLUCIONES

### Problema 1: "Who has access" está en "Only myself"

**Solución**:
- Deploy > Manage deployments > ✏️ Edit
- Cambiar "Who has access" a **"Anyone"**
- **New version** ← No olvidar esto
- Deploy

### Problema 2: El código está desactualizado

**Solución**:
- Copiar todo el contenido de `Code.gs` (archivo de esta carpeta)
- Pegarlo en el editor de Google Apps Script
- Guardar
- Deploy > Manage deployments > ✏️ Edit > **New version** > Deploy

### Problema 3: Error "Script function not found: doPost"

**Solución**:
- Verificar que `Code.gs` contiene la función `doPost(e)`
- Guardar
- Deploy con **New version**

### Problema 4: Sigue sin funcionar después de redesplegar

**Opciones**:
1. **Espera 1-2 minutos** - Los despliegues pueden tardar en propagarse
2. **Intenta en ventana privada** del navegador (Ctrl+Shift+N en Chrome)
3. **Verifica la consola del navegador** (F12) para ver el error exacto

## 📋 CHECKLIST DE VERIFICACIÓN

Antes de decir que no funciona, verifica:

- [ ] ¿El archivo `Code.gs` está en Google Apps Script?
- [ ] ¿El código empieza con `const SHEET_NAME = 'Aniversaris';`?
- [ ] ¿Hiciste clic en "New version" al redesplegar?
- [ ] ¿"Who has access" está en "Anyone"?
- [ ] ¿La URL termina en `/exec` (no `/dev`)?
- [ ] ¿Esperaste 1-2 minutos después de redesplegar?
- [ ] ¿Probaste en ventana privada del navegador?

## 🎯 RESULTADO ESPERADO

Después de seguir estos pasos:

✅ **test-google-sheets-api.html** → Todos los tests (GET, CREATE, UPDATE, DELETE) deberían mostrar ✅

✅ **index.html** → Los cambios deberían mostrar:
- "✅ Aniversari afegit a Google Sheets" (al añadir)
- "✅ Aniversari actualitzat a Google Sheets" (al editar)
- "✅ Aniversari eliminat de Google Sheets" (al eliminar)

✅ **Google Sheets** → Los cambios desde la web deberían aparecer inmediatamente en la hoja

## 💡 INFORMACIÓN TÉCNICA

**Por qué falla POST pero funciona GET:**

- GET requests no requieren permisos especiales en Apps Script
- POST requests SÍ requieren que el script esté desplegado con "Anyone" access
- Si "Who has access" está en "Only myself", el POST falla con NetworkError
- Si no se crea "New version", los cambios en el código no se aplican

**Por qué necesitamos "New version":**

Google Apps Script mantiene versiones del código. El deployment activo usa una versión específica. Si modificas el código pero no creas una nueva versión y la despliegas, el deployment seguirá usando la versión antigua del código.

---

**¿Necesitas ayuda?** Abre el archivo `test-google-sheets-api.html` y presiona F12 para ver la consola. Los mensajes de error ahí te dirán exactamente qué está fallando.
