# Sistema de Recordatorios de Cumpleaños

## Descripción

El sistema ahora incluye una funcionalidad de **recordatorios automáticos** que envía un email a todos los miembros de la familia el día antes de un cumpleaños, recordándoles quién cumple años mañana.

## Características

- ✅ Envía recordatorios **automáticamente** el día anterior al cumpleaños
- ✅ Notifica a **todos los miembros de la familia** con email
- ✅ Incluye información de personas **vivas y fallecidas** (marca a las fallecidas como "en memòria")
- ✅ Muestra la edad que cumplirán
- ✅ Solo envía a personas vivas (no envía recordatorios a personas fallecidas)
- ✅ SMS opcionales (desactivados por defecto para ahorrar costes)

## Cambios realizados en los mensajes

### Mensajes de cumpleaños (SMS y Email)

Los mensajes de felicitación han sido actualizados para reflejar el nuevo contexto familiar:

**Antes:**
- "Des de la Promoció Víctor Català 1971..."
- "Amb afecte de la Promoció Víctor Català 1971"

**Ahora:**
- "Des de la família..."
- "Amb afecte, la família"

### Email de recordatorio

El email de recordatorio incluye:
- Título: "📅 Recordatori d'Aniversari"
- Lista de personas que cumplen años mañana
- Emoji 🕊️ para personas fallecidas (con la nota "en memòria")
- Emoji 🎂 para personas vivas
- Edad que cumplirán

**Ejemplo de email:**

```
📅 Recordatori d'Aniversari

Hola! 👋

T'enviem aquest recordatori perquè demà fa anys:

🎂 Maria García
   15 gener (85 anys)

🕊️ Joan Martínez (en memòria)
   15 gener (habría cumplido 92 anys)

No oblidis enviar-los una felicitació! 🎉
```

## Configuración del Trigger Automático

Para que los recordatorios se envíen automáticamente cada día, debes configurar un **trigger** (disparador) en Google Apps Script.

### Pasos para configurar el trigger:

1. **Abrir Google Apps Script:**
   - Ve a tu Google Sheet de aniversarios
   - Menú: **Extensiones > Apps Script**

2. **Ir a la sección de Triggers:**
   - En el menú lateral izquierdo, haz clic en el icono del **reloj** ⏰ (Activadores/Triggers)

3. **Crear un nuevo trigger:**
   - Haz clic en **"+ Añadir activador"** (esquina inferior derecha)

4. **Configurar el trigger:**
   - **Elige la función que se ejecutará:** `sendBirthdayReminders`
   - **Elige qué tipo de implementación debe ejecutarse:** `Head`
   - **Selecciona el origen del evento:** `Basado en tiempo`
   - **Selecciona el tipo de activador basado en tiempo:** `Temporizador día`
   - **Selecciona la hora del día:** Elige una hora, por ejemplo **`20:00 - 21:00`** (8-9 PM)
     - *Recomendación: Elegir una hora por la tarde/noche para que la gente reciba el recordatorio la noche anterior*

5. **Guardar:**
   - Haz clic en **"Guardar"**
   - Si te pide autorización, acepta los permisos necesarios

### Verificación

Después de configurar el trigger:
- El sistema enviará recordatorios automáticamente cada día a la hora configurada
- Solo enviará si hay cumpleaños al día siguiente
- Puedes ver los logs en Apps Script: **Ver > Registros** después de que se ejecute

## Probar el sistema manualmente

### Probar recordatorios (sin enviar realmente)

Para probar si hay cumpleaños mañana y ver qué se enviaría:

1. Ve a Google Apps Script
2. Selecciona la función `testBirthdayReminders`
3. Haz clic en **"Ejecutar"**
4. Ve a **Ver > Registros** para ver qué encontró

### Enviar un recordatorio de prueba

Si quieres probar enviando un recordatorio real:

1. **IMPORTANTE:** Asegúrate de que haya un cumpleaños mañana en tu Sheet
2. Ejecuta manualmente la función `sendBirthdayReminders`
3. Verifica tu email para confirmar que llegó correctamente

## Activar/Desactivar SMS en recordatorios

Por defecto, los **SMS están desactivados** en los recordatorios para ahorrar costes (Twilio cobra por SMS).

### Para activar SMS en recordatorios:

1. Abre `Code.gs`
2. Busca la función `sendBirthdayReminders` (línea ~1384)
3. Busca el bloque comentado que dice:
   ```javascript
   // Enviar SMS si tiene (OPCIONAL - comentar si no quieres SMS)
   // const formattedPhone = formatPhoneSpain(member.telefon);
   // ...
   ```
4. **Descomenta** todo el bloque (quita los `//` del principio de cada línea)
5. Guarda el script
6. Despliega la nueva versión

**Nota:** Esto enviará SMS a TODOS los miembros con teléfono, lo cual puede generar costes significativos.

## Costes estimados

### Solo emails (configuración actual):
- **Coste:** ❌ GRATIS (Gmail gratis hasta 500 emails/día)
- **Alcance:** Todos los miembros con email

### Con SMS activados:
- **Coste:** Aproximadamente **€0.05-0.10 por SMS** (depende de Twilio)
- **Ejemplo:** Si tienes 20 miembros y hay 1 cumpleaños mañana:
  - 20 SMS × €0.07 = **€1.40 por recordatorio**
  - Con ~30 cumpleaños/año = **€42/año** solo en recordatorios

**Recomendación:** Mantener solo emails para recordatorios, y usar SMS solo para felicitaciones directas.

## Solución de problemas

### "No se envían recordatorios"

1. **Verificar que hay cumpleaños mañana:**
   - Ejecuta `testBirthdayReminders` y revisa los logs

2. **Verificar el trigger:**
   - Ve a Activadores (⏰) y verifica que existe y está activo
   - Verifica la hora configurada

3. **Verificar modo mantenimiento:**
   - El sistema NO enviará recordatorios si el modo mantenimiento está activo
   - Revisa la celda W2 del Sheet (debe estar vacía o "No")

### "Los recordatorios se envían a la hora incorrecta"

- Google Apps Script ejecuta los triggers en una ventana de 1 hora
- Si configuraste "20:00 - 21:00", se ejecutará en algún momento de esa hora
- No es posible una precisión exacta de minutos

### "Quiero cambiar el contenido del email/SMS"

1. Abre `Code.gs`
2. Busca las funciones:
   - `generateReminderEmail()` - para el HTML del email
   - `generateReminderSMS()` - para el texto del SMS
3. Modifica el contenido como desees
4. Guarda y despliega la nueva versión

## Preguntas frecuentes

**P: ¿Se envían recordatorios a las personas fallecidas?**
R: No. Solo se envían recordatorios a personas vivas (viu === 'Sí'). Pero el recordatorio SÍ menciona a las personas fallecidas que cumplen años.

**P: ¿Puedo desactivar los recordatorios temporalmente?**
R: Sí. Ve a Activadores (⏰) y elimina o pausa el trigger de `sendBirthdayReminders`.

**P: ¿Puedo cambiar a qué hora se envían?**
R: Sí. Ve a Activadores, edita el trigger existente y cambia la hora.

**P: ¿Se pueden enviar recordatorios con más días de antelación?**
R: Sí, pero requiere modificar el código. En la función `getTomorrowBirthdays()`, cambia:
```javascript
tomorrow.setDate(tomorrow.getDate() + 1);  // +1 = mañana
```
A:
```javascript
tomorrow.setDate(tomorrow.getDate() + 2);  // +2 = pasado mañana
tomorrow.setDate(tomorrow.getDate() + 7);  // +7 = en una semana
```

**P: ¿Los recordatorios cuentan como "email ya enviado" para las felicitaciones?**
R: No. Los recordatorios no registran logs en las columnas de felicitaciones. El día del cumpleaños, se seguirá enviando la felicitación normal a la persona.

## Resumen de funciones nuevas en Code.gs

- `getTomorrowBirthdays(sheet)` - Obtiene cumpleaños de mañana
- `getAllActiveMembers(sheet)` - Obtiene todos los miembros vivos con contacto
- `generateReminderSMS(tomorrowBirthdays)` - Genera mensaje SMS de recordatorio
- `generateReminderEmail(tomorrowBirthdays)` - Genera email HTML de recordatorio
- `sendBirthdayReminders()` - **Función principal** que envía recordatorios
- `testBirthdayReminders()` - Función de test para probar
