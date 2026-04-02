/**
 * Script para exportar datos de Google Sheets a JSON
 * Para usar en la migración a Supabase
 *
 * INSTRUCCIONES:
 * 1. Abre tu hoja de cálculo de Google Sheets
 * 2. Ve a Extensiones > Apps Script
 * 3. Copia y pega este código
 * 4. Ejecuta la función exportDataForSupabase()
 * 5. El JSON aparecerá en los logs (Ver > Registros)
 * 6. Copia el JSON y guárdalo como scripts/data-export.json
 */

function exportDataForSupabase() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();

  // Primera fila son los headers
  const headers = data[0];

  // Mapeo de columnas de Google Sheets a Supabase
  const columnMapping = {
    'Nom': 'nom',
    'Dia': 'dia',
    'Mes': 'mes',
    'AnyNaixement': 'anyNaixement',
    'Telefon': 'telefon',
    'Telèfon': 'telefon',
    'Email': 'email',
    'Gènere': 'genere',
    'Genere': 'genere',
    'Viu': 'viu',
    'Pare ID': 'pareId',
    'Mare ID': 'mareId',
    'Parella ID': 'parellaId',
    'URL Foto': 'urlFoto',
    'Estat Relacio': 'estatRelacio',
    'estatRelacio': 'estatRelacio',
    'Lloc Naixement': 'llocNaixement',
    'Any Mort': 'anyMort'
  };

  const result = [];

  // Procesar cada fila (empezando desde la 2, índice 1)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    // Saltar filas sin nombre (vacías o de otras secciones)
    if (!row[0] || row[0].toString().trim() === '') {
      continue;
    }

    const persona = {};

    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      const value = row[j];

      // Obtener el nombre de campo mapeado
      const fieldName = columnMapping[header] || header.toLowerCase().replace(/\s+/g, '');

      // Solo incluir campos relevantes
      if (fieldName && [
        'nom', 'dia', 'mes', 'anyNaixement', 'telefon', 'email',
        'genere', 'viu', 'pareId', 'mareId', 'parellaId',
        'urlFoto', 'estatRelacio', 'llocNaixement', 'anyMort'
      ].includes(fieldName)) {

        // Convertir valores
        if (fieldName === 'dia' || fieldName === 'mes') {
          persona[fieldName] = parseInt(value) || 1;
        } else if (fieldName === 'anyNaixement' || fieldName === 'anyMort') {
          persona[fieldName] = value ? parseInt(value) : null;
        } else if (fieldName === 'pareId' || fieldName === 'mareId' || fieldName === 'parellaId') {
          persona[fieldName] = value ? parseInt(value) : null;
        } else if (fieldName === 'viu') {
          // Normalizar el campo viu
          const viuStr = String(value).toLowerCase().trim();
          persona[fieldName] = viuStr !== 'no' && viuStr !== 'false' && viuStr !== '0';
        } else if (fieldName === 'genere') {
          // Normalizar género a H/D
          const genereStr = String(value).toUpperCase().trim();
          if (genereStr === 'H' || genereStr === 'M' || genereStr === 'MASCULÍ' || genereStr === 'MASCULI' || genereStr === 'HOME') {
            persona[fieldName] = 'H';
          } else if (genereStr === 'D' || genereStr === 'F' || genereStr === 'FEMENÍ' || genereStr === 'FEMENI' || genereStr === 'DONA') {
            persona[fieldName] = 'D';
          } else {
            persona[fieldName] = null;
          }
        } else {
          // Texto normal
          persona[fieldName] = value ? String(value).trim() : null;
        }
      }
    }

    // Solo añadir si tiene nombre válido
    if (persona.nom && persona.nom.trim() !== '') {
      result.push(persona);
    }
  }

  // Mostrar resultado en los logs
  const jsonOutput = JSON.stringify(result, null, 2);
  console.log('='.repeat(50));
  console.log('DATOS EXPORTADOS PARA SUPABASE');
  console.log('Total de registros:', result.length);
  console.log('='.repeat(50));
  console.log(jsonOutput);
  console.log('='.repeat(50));
  console.log('Copia el JSON de arriba y guárdalo como scripts/data-export.json');

  // También mostrar en una alerta con preview
  SpreadsheetApp.getUi().alert(
    'Exportación completada',
    `Se han exportado ${result.length} registros.\n\nVe a Ver > Registros para copiar el JSON.`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );

  return result;
}

/**
 * Función auxiliar para verificar los datos antes de exportar
 */
function previewExport() {
  const result = exportDataForSupabase();

  // Mostrar primeros 5 registros
  console.log('='.repeat(50));
  console.log('PREVIEW (primeros 5 registros):');
  console.log('='.repeat(50));
  for (let i = 0; i < Math.min(5, result.length); i++) {
    console.log(`${i + 1}. ${result[i].nom} - ${result[i].dia}/${result[i].mes}`);
  }
}

/**
 * Función para contar registros sin exportar
 */
function countRecords() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();

  let count = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().trim() !== '') {
      count++;
    }
  }

  SpreadsheetApp.getUi().alert(
    'Recuento de registros',
    `Hay ${count} registros válidos para exportar.`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );

  return count;
}
