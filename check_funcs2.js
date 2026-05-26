const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const funcsToCheck = [
"handlePasswordChange",
"handleCreateUser",
"handleCreateClient",
"handleCreateTask",
"handleSendDirectEmail"
];

let m; const scripts=[]; const r=/<script[^>]*>([\s\S]*?)<\/script>/gi;
while(m=r.exec(html)) { scripts.push(m[1]); }
const js = scripts.join("\n");

const missing = [];
for (const f of funcsToCheck) {
    if (!js.includes('function ' + f) && !js.includes(f + ' =') && !js.includes(f + ' = function')) {
        missing.push(f);
    }
}
console.log("Missing form handlers:", missing.length === 0 ? "None" : missing.join(", "));
