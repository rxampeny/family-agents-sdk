/**
 * Script de Migración: Google Sheets → Supabase
 *
 * Este script importa los datos exportados de Google Sheets a Supabase.
 *
 * PASOS:
 * 1. Exportar datos de Google Sheets:
 *    - Abrir la hoja de cálculo
 *    - Ejecutar en Apps Script: exportDataAsJSON()
 *    - Guardar el JSON resultante como 'data-export.json' en este directorio
 *
 * 2. Configurar variables de entorno:
 *    - SUPABASE_URL=https://tu-proyecto.supabase.co
 *    - SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
 *
 * 3. Ejecutar: node scripts/migrate-to-supabase.js
 */

const fs = require('fs');
const path = require('path');

// Configuración
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Configura las variables de entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Función para hacer peticiones a Supabase
async function supabaseRequest(table, method, data = null) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': 'return=representation'
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error ${response.status}: ${error}`);
  }

  return response.json();
}

// Convertir datos del formato Google Sheets al formato Supabase
function convertPersona(row) {
  return {
    nom: row.nom || row.Nom || '',
    dia: parseInt(row.dia || row.Dia) || 1,
    mes: parseInt(row.mes || row.Mes) || 1,
    any_naixement: row.anyNaixement || row.AnyNaixement ? parseInt(row.anyNaixement || row.AnyNaixement) : null,
    telefon: row.telefon || row.Telefon || null,
    email: row.email || row.Email || null,
    genere: row.genere || row.Genere || null,
    viu: (row.viu || row.Viu) !== 'No',
    url_foto: row.urlFoto || row.URLFoto || null,
    estat_relacio: row.estatRelacio || row.EstatRelacio || null,
    lloc_naixement: row.llocNaixement || row.LlocNaixement || null,
    any_mort: row.anyMort || row.AnyMort ? parseInt(row.anyMort || row.AnyMort) : null
  };
}

async function migrate() {
  console.log('='.repeat(50));
  console.log('Migración de Google Sheets a Supabase');
  console.log('='.repeat(50));

  // Leer archivo de datos
  const dataFile = path.join(__dirname, 'data-export.json');

  if (!fs.existsSync(dataFile)) {
    console.error(`\nError: No se encuentra el archivo ${dataFile}`);
    console.log('\nPasos para exportar datos de Google Sheets:');
    console.log('1. Abre Google Apps Script (desde la hoja de cálculo)');
    console.log('2. Añade esta función y ejecútala:');
    console.log(`
function exportDataAsJSON() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const result = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue; // Saltar filas vacías

    const row = {};
    for (let j = 0; j < headers.length; j++) {
      if (headers[j]) {
        row[headers[j]] = data[i][j];
      }
    }
    result.push(row);
  }

  console.log(JSON.stringify(result, null, 2));
  return result;
}
    `);
    console.log('\n3. Copia el resultado y guárdalo como scripts/data-export.json');
    process.exit(1);
  }

  // Leer y parsear datos
  let rawData;
  try {
    const fileContent = fs.readFileSync(dataFile, 'utf8');
    rawData = JSON.parse(fileContent);
    console.log(`\n✓ Leídos ${rawData.length} registros del archivo`);
  } catch (error) {
    console.error(`Error al leer ${dataFile}:`, error.message);
    process.exit(1);
  }

  // Filtrar solo personas válidas (con nombre)
  const validData = rawData.filter(row => row.nom || row.Nom);
  console.log(`✓ ${validData.length} registros válidos para importar`);

  // Convertir datos
  const personas = validData.map(convertPersona);

  // Primera pasada: insertar todas las personas sin relaciones
  console.log('\n📥 Fase 1: Insertando personas...');

  const insertedPersonas = [];
  const nameToId = new Map();

  for (const persona of personas) {
    try {
      // Insertar sin relaciones primero
      const personaWithoutRelations = { ...persona };
      delete personaWithoutRelations.pare_id;
      delete personaWithoutRelations.mare_id;
      delete personaWithoutRelations.parella_id;

      const result = await supabaseRequest('personas', 'POST', personaWithoutRelations);
      insertedPersonas.push(result[0]);
      nameToId.set(persona.nom.toLowerCase(), result[0].id);
      console.log(`  ✓ ${persona.nom}`);
    } catch (error) {
      console.error(`  ✗ Error al insertar ${persona.nom}:`, error.message);
    }
  }

  console.log(`\n✓ Insertadas ${insertedPersonas.length} personas`);

  // Segunda pasada: actualizar relaciones familiares
  // (Esto requiere que el archivo de datos incluya los IDs de las relaciones)
  console.log('\n📥 Fase 2: Actualizando relaciones familiares...');
  console.log('  ⚠ Las relaciones (pare_id, mare_id, parella_id) deben configurarse manualmente');
  console.log('    o actualizarse con un script adicional si los datos incluyen esta información.');

  console.log('\n' + '='.repeat(50));
  console.log('✅ Migración completada');
  console.log('='.repeat(50));
  console.log('\nSiguientes pasos:');
  console.log('1. Verificar los datos en el dashboard de Supabase');
  console.log('2. Configurar las relaciones familiares manualmente si es necesario');
  console.log('3. Actualizar el frontend para usar Supabase');
  console.log('4. Configurar los cron jobs para envío de notificaciones');
}

// Ejecutar migración
migrate().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
