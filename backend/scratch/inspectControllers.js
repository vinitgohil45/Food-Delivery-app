import fs from 'fs';
import path from 'path';

function searchInDir(dir, query) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        searchInDir(fullPath, query);
      }
    } else {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes(query.toLowerCase())) {
        console.log(`Match in: ${fullPath}`);
      }
    }
  }
}

console.log('Searching for "prepared" in backend...');
searchInDir('c:/Users/VINIT/OneDrive/Desktop/online/backend', 'prepared');

console.log('\nSearching for "waiting_for_driver" in backend...');
searchInDir('c:/Users/VINIT/OneDrive/Desktop/online/backend', 'waiting_for_driver');
