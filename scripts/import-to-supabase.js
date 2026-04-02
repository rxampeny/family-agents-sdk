/**
 * Importar datos de Google Sheets a Supabase
 * Los datos ya están descargados en data-export.json
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://bfforytzxicguykosnna.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Set SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.error('Get it from: Supabase Dashboard > Settings > API > service_role secret');
  process.exit(1);
}

async function importData() {
  // Read exported data
  const dataFile = path.join(__dirname, 'data-export.json');
  const raw = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  const personas = raw.data || raw;

  console.log(`Found ${personas.length} personas to import\n`);

  // We need to insert in two passes:
  // Pass 1: Insert all personas without relationship IDs
  // Pass 2: Update relationship IDs (pare_id, mare_id, parella_id)

  // Map from old rowNumber to new ID
  const rowToId = new Map();

  console.log('=== PASS 1: Inserting personas ===\n');

  for (const p of personas) {
    const record = {
      nom: p.nom,
      dia: p.dia || null,
      mes: p.mes || null,
      any_naixement: p.anyNaixement || null,
      telefon: p.telefon ? String(p.telefon) : null,
      email: p.email || null,
      genere: p.genere || null,
      viu: p.viu !== 'No',
      url_foto: p.urlFoto || null,
      estat_relacio: p.estatRelacio || null,
      lloc_naixement: p.llocNaixement || null,
      any_mort: p.anyMort || null
    };

    // Skip records without dia/mes (set defaults)
    if (!record.dia) record.dia = 1;
    if (!record.mes) record.mes = 1;

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/personas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(record)
      });

      if (!response.ok) {
        const err = await response.text();
        console.error(`  FAIL ${p.nom}: ${err}`);
        continue;
      }

      const result = await response.json();
      const newId = result[0].id;
      rowToId.set(p.rowNumber, newId);
      console.log(`  OK [${p.rowNumber} -> ${newId}] ${p.nom}`);
    } catch (error) {
      console.error(`  FAIL ${p.nom}: ${error.message}`);
    }
  }

  console.log(`\nInserted ${rowToId.size} personas\n`);

  // Pass 2: Update relationships
  console.log('=== PASS 2: Updating relationships ===\n');

  let relationsUpdated = 0;

  for (const p of personas) {
    const newId = rowToId.get(p.rowNumber);
    if (!newId) continue;

    const updates = {};
    if (p.pareId && rowToId.has(p.pareId)) {
      updates.pare_id = rowToId.get(p.pareId);
    }
    if (p.mareId && rowToId.has(p.mareId)) {
      updates.mare_id = rowToId.get(p.mareId);
    }
    if (p.parellaId && rowToId.has(p.parellaId)) {
      updates.parella_id = rowToId.get(p.parellaId);
    }

    if (Object.keys(updates).length === 0) continue;

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/personas?id=eq.${newId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const rels = Object.entries(updates).map(([k, v]) => `${k}=${v}`).join(', ');
        console.log(`  OK ${p.nom}: ${rels}`);
        relationsUpdated++;
      } else {
        const err = await response.text();
        console.error(`  FAIL ${p.nom}: ${err}`);
      }
    } catch (error) {
      console.error(`  FAIL ${p.nom}: ${error.message}`);
    }
  }

  console.log(`\nRelationships updated: ${relationsUpdated}`);
  console.log('\n=== MIGRATION COMPLETE ===');
}

importData().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
