const fs = require('fs');
const http = require('http');

async function test() {
  console.log('1. Checking health...');
  const health = await fetch('http://localhost:8000/api/v1/health').then(r => r.json());
  console.log('Health:', health);

  console.log('2. Logging in...');
  const login = await fetch('http://localhost:8000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'researcher@jeevadrishti.ai', password: 'Password123!' })
  }).then(r => r.json());
  console.log('Login result:', login.access_token ? 'SUCCESS' : login);
  const token = login.access_token;

  console.log('3. Uploading cell.jpg...');
  const fileBytes = fs.readFileSync('f:/JeevaDrishti/cell.jpg');
  const blob = new Blob([fileBytes], { type: 'image/jpeg' });
  const formData = new FormData();
  formData.append('file', blob, 'cell.jpg');

  const uploadRes = await fetch('http://localhost:8000/api/v1/analysis/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  }).then(r => r.json());
  console.log('Upload res:', uploadRes);

  console.log('4. Creating analysis...');
  const createRes = await fetch('http://localhost:8000/api/v1/analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ file_id: uploadRes.file_id, dataset: 'Micro-OD', shots: 6 })
  }).then(r => r.json());
  console.log('Create res:', createRes);

  console.log('5. Running inference...');
  const runRes = await fetch(`http://localhost:8000/api/v1/analysis/${createRes.analysis_id}/run`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());
  console.log('Run res:', runRes);

  console.log('6. Getting results...');
  const resultsRes = await fetch(`http://localhost:8000/api/v1/analysis/${createRes.analysis_id}/results`, {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());
  console.log('Results res:', {
    status: resultsRes.status,
    detectionsCount: resultsRes.detections?.length,
    metrics: resultsRes.metrics,
    firstDetection: resultsRes.detections?.[0]
  });
}

test().catch(console.error);
