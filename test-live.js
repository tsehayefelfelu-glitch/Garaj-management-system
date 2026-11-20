const https = require('https');

https.get('https://garaj-management-system-production.up.railway.app/backup', (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Data length:', data.length);
    console.log('Has "Database Backups & Disaster Recovery":', data.includes('Database Backups & Disaster Recovery'));
    console.log('Has "Database Backup":', data.includes('Database Backup'));
    const match = data.match(/buildId":"([^"]+)"/);
    console.log('Build ID:', match ? match[1] : 'none');
  });
}).on('error', err => console.error(err));
