const fs = require('fs');
const file = 'frontend/src/pages/Manage.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace('className=\"bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1 text-xs text-dark-text focus:outline-none focus:border-primary-500/50 [&>option]:bg-slate-900\"', 'className=\"bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1 text-xs text-dark-text focus:outline-none focus:border-primary-500/50 focus:bg-dark-bg [&>option]:bg-dark-bg [&>option]:text-dark-text appearance-none\"');
fs.writeFileSync(file, content);
