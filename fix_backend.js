const fs = require('fs');
const file = 'backend/src/routes/manage.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace('ORDER BY i.created_at DESC', 'ORDER BY pj.created_at DESC, i.milestone_order ASC');
content = content.replace('ORDER BY i.created_at DESC', 'ORDER BY pj.created_at DESC, i.milestone_order ASC');
fs.writeFileSync(file, content);
