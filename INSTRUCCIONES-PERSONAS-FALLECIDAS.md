# Instrucciones: Añadir soporte para personas fallecidas

## ¿Qué se ha modificado?

Se ha añadido una nueva funcionalidad que permite registrar personas fallecidas en la aplicación. Estas personas aparecerán en el calendario normalmente, pero **NO** recibirán SMS ni emails automáticos en su cumpleaños.

## Paso 1: Actualizar el Google Sheet

Debes añadir una nueva columna "Viu" en tu Google Sheet de aniversarios.

### Instrucciones detalladas:

1. Abre tu Google Sheet de aniversarios:
   https://docs.google.com/spreadsheets/d/19ixIeSMF93UQKOoJGu7o_lsBCAqnf4Eo7CAIwtKMMI0/edit

2. **Inserta una nueva columna H:**
   - Haz clic con el botón derecho en la columna H (la que actualmente tiene "Última modificació")
   - Selecciona "Insertar 1 columna a la izquierda"
   - Esto creará una nueva columna H vacía

3. **Añade el encabezado en la celda H1:**
   - Escribe: `Viu`

4. **Rellena la columna H para todas las personas existentes:**
   - Para personas que están vivas: escribe `Sí`
   - Para personas fallecidas: escribe `No`

   **IMPORTANTE:** Todas las filas deben tener un valor en esta columna. Si una fila está vacía, se asumirá que la persona está viva (valor por defecto: "Sí").

5. **Verifica la nueva estructura:**
   Tu Sheet ahora debería tener esta estructura:
   - Columna A: Nom
   - Columna B: Dia
   - Columna C: Mes
   - Columna D: Any Naixement
   - Columna E: Telèfon
   - Columna F: Email
   - Columna G: Gènere
   - **Columna H: Viu** (NUEVA)
   - **Columna I: Última modificació** (movida desde H)
   - Columnas J en adelante: Logs de eliminados, emails y SMS (movidas automáticamente)

## Paso 2: Actualizar el Google Apps Script

Debes reemplazar completamente el código del Google Apps Script con la nueva versión que incluye el soporte para el campo "Viu".

### Instrucciones:

1. Abre el Editor de Apps Script desde tu Google Sheet:
   - En el Sheet, ve a **Extensiones > Apps Script**

2. En el editor, selecciona TODO el código actual y bórralo

3. Copia TODO el contenido del archivo `Code.gs` del proyecto

4. Pega el código en el editor de Apps Script

5. Guarda el proyecto (Ctrl+S o Cmd+S)

6. **Despliega una nueva versión:**
   - Haz clic en "Desplegar" > "Gestionar implementaciones"
   - Haz clic en el icono de lápiz (editar) junto a la implementación activa
   - Cambia "Nueva descripción" a algo como "Versión con soporte para personas fallecidas"
   - Haz clic en "Desplegar"

## Paso 3: Probar la funcionalidad

1. Recarga la página de la aplicación web (Ctrl+F5 o Cmd+Shift+R para forzar recarga)

2. Verifica que puedes ver y editar el nuevo campo "Estat" en el formulario:
   - Abre el formulario para añadir un nuevo aniversario
   - Deberías ver un campo "Estat" con opciones:
     - **Viu** (por defecto)
     - **En memòria**

3. Prueba añadir una persona fallecida:
   - Rellena el formulario
   - Selecciona "En memòria" en el campo "Estat"
   - Guarda

4. Verifica que las personas fallecidas NO reciben notificaciones:
   - Si hoy es el cumpleaños de una persona marcada como "No" en el Sheet, verifica que NO se le envíe SMS/email automáticamente

## Cómo usar la funcionalidad

### Añadir una persona fallecida:

1. Haz clic en el botón "+ Afegir Aniversari"
2. Rellena todos los campos como normalmente
3. En el campo **"Estat"**, selecciona **"En memòria"**
4. Guarda

### Convertir una persona viva a fallecida:

1. Busca a la persona en el calendario
2. Haz clic en su nombre para ver los detalles
3. Haz clic en "✏️ Editar"
4. Cambia el campo **"Estat"** de "Viu" a **"En memòria"**
5. Guarda los cambios

### Qué ocurre con las personas fallecidas:

- ✅ **SÍ aparecen** en el calendario
- ✅ **SÍ aparecen** en las listas de cumpleaños
- ✅ **SÍ puedes** ver sus detalles
- ❌ **NO reciben** SMS automáticos en su cumpleaños
- ❌ **NO reciben** emails automáticos en su cumpleaños

## Solución de problemas

### "La columna H no existe" o errores similares:

- Verifica que has insertado la columna H correctamente
- Asegúrate de que la columna H tiene el encabezado "Viu"
- Verifica que la columna I ahora tiene "Última modificació"

### "No veo el campo Estat en el formulario":

- Recarga la página con Ctrl+F5 (Windows) o Cmd+Shift+R (Mac)
- Verifica que has actualizado el archivo index.html

### "Las personas fallecidas siguen recibiendo SMS/emails":

- Verifica que el valor en la columna H es exactamente "No" (no "NO", "no", ni otros)
- Verifica que has actualizado el Code.gs en Apps Script
- Verifica que has desplegado la nueva versión del script

### "Error al guardar nuevos aniversarios":

- Verifica que has actualizado TANTO el Code.gs COMO el index.html
- Verifica que todos los cambios se han guardado correctamente

## Preguntas frecuentes

**P: ¿Puedo cambiar una persona de "En memòria" de vuelta a "Viu"?**
R: Sí, simplemente edita la persona y cambia el campo "Estat" a "Viu".

**P: ¿Se eliminarán las personas fallecidas del calendario?**
R: No, seguirán apareciendo en el calendario normalmente. Solo no recibirán notificaciones automáticas.

**P: ¿Qué pasa con las personas que añadí antes de esta actualización?**
R: Debes rellenar manualmente la columna H para todas las personas existentes. Si dejas alguna fila vacía, se asumirá que la persona está viva ("Sí").

**P: ¿Puedo usar otros valores además de "Sí" y "No"?**
R: No, el sistema solo reconoce "Sí" para personas vivas. Cualquier otro valor (incluyendo "No", vacío, etc.) se tratará como persona viva por seguridad. Usa exactamente "No" para personas fallecidas.

**P: ¿Los logs de eliminados y SMS/emails se han perdido?**
R: No, solo se han movido una columna a la derecha. Todos los datos se preservan.

## Contacto

Si tienes problemas con la implementación, revisa que:
1. Has seguido todos los pasos en orden
2. Has guardado y desplegado todos los cambios
3. Has recargado la página web completamente

Si los problemas persisten, revisa el archivo CLAUDE.md para información de contacto del desarrollador.
