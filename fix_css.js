const fs = require('fs');
let css = fs.readFileSync('frontend/src/index.css');
// Remove the weird UTF-16 bytes added by powershell
let fixed = css.toString('utf8').replace(/\x00/g, '').replace('s e l e c t   o p t i o n   {   b a c k g r o u n d - c o l o r :   # 0 a 0 f 1 e ;   c o l o r :   # f 1 f 5 f 9 ;   }', '');
// Ensure clean EOF
fixed = fixed.trim() + '\n\nselect option {\n  background-color: #0a0f1e;\n  color: #f1f5f9;\n}\n';
fs.writeFileSync('frontend/src/index.css', fixed, 'utf8');
