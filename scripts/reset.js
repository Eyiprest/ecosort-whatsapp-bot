// Run: node scripts/reset.js
// Resets all data files to empty arrays (keeps auth session intact)
const fs = require('fs');
const path = require('path');

const dataFiles = ['users', 'collectors', 'buyers', 'pickups', 'listings', 'offers', 'transactions', 'certificates', 'notifications'];
const DATA_DIR = './data';

dataFiles.forEach(name => {
  const fp = path.join(DATA_DIR, `${name}.json`);
  fs.writeFileSync(fp, '[]', 'utf8');
  console.log(`✅ Reset: ${fp}`);
});

console.log('\n🗑️  All data files reset. Auth session preserved.');
console.log('🔄 Restart the bot: node server.js\n');
