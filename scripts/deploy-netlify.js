const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SITE_ID = 'f8bdfeef-92d4-4182-a9e4-51f47bd94d39';
const TOKEN = 'nfp_z3tTH9yUkxr5Co8N9jSHCVHq3u4Dfn5M1857';
const BASE = path.join(__dirname, '..');

// Collect all files to deploy
const filesToDeploy = ['index.html', 'supabase-client.js', 'netlify.toml'];
const publicDir = path.join(BASE, 'public');
if (fs.existsSync(publicDir)) {
  fs.readdirSync(publicDir).forEach(f => filesToDeploy.push('public/' + f));
}

const fileMap = {};
const fileData = {};

for (const file of filesToDeploy) {
  const fullPath = path.join(BASE, file);
  if (!fs.existsSync(fullPath)) continue;
  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) continue;
  const content = fs.readFileSync(fullPath);
  const hash = crypto.createHash('sha1').update(content).digest('hex');
  fileMap['/' + file] = hash;
  fileData['/' + file] = content;
}

async function deploy() {
  console.log('Creating deploy with ' + Object.keys(fileMap).length + ' files...');

  // Step 1: Create deploy
  const createRes = await fetch('https://api.netlify.com/api/v1/sites/' + SITE_ID + '/deploys', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ files: fileMap })
  });

  const deployInfo = await createRes.json();
  if (!createRes.ok) {
    console.error('Deploy creation failed:', JSON.stringify(deployInfo));
    process.exit(1);
  }

  const deployId = deployInfo.id;
  const required = deployInfo.required || [];
  console.log('Deploy ID: ' + deployId);
  console.log('Files to upload: ' + required.length);

  // Step 2: Upload required files
  for (const [filePath, content] of Object.entries(fileData)) {
    const hash = fileMap[filePath];
    if (!required.includes(hash)) continue;

    console.log('  Uploading ' + filePath + ' (' + content.length + ' bytes)');
    const uploadRes = await fetch('https://api.netlify.com/api/v1/deploys/' + deployId + '/files' + filePath, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'Content-Type': 'application/octet-stream'
      },
      body: content
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error('  FAIL: ' + err);
    }
  }

  console.log('\nDeploy complete!');
  console.log('URL: https://hola-familia.netlify.app');
}

deploy().catch(err => { console.error(err); process.exit(1); });
