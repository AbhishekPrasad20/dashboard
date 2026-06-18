const fs = require('fs');
const file = 'frontend/src/pages/Manage.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace('const selectClass = inputClass + \" [&>option]:bg-slate-900 [&>option]:text-dark-text\";', 'const selectClass = inputClass + \" focus:bg-dark-bg [&>option]:bg-dark-bg [&>option]:text-dark-text appearance-none\";');
fs.writeFileSync(file, content);
