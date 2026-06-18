const fs = require('fs');
const file = 'frontend/src/pages/Manage.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace('appearance-none', '');
content = content.replace('appearance-none', '');
fs.writeFileSync(file, content);
