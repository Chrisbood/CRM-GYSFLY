const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Reverse step 3
html = html.replace(/onclick="openClientQuickView\(\$\{c\.id\}\)"/g, 'onclick="openClientProfileModal(${c.id})"');

// Reverse step 2 (remove quick view JS)
const jsStart = '// QUICK VIEW MODAL LOGIC';
const jsIdx = html.indexOf(jsStart);
if (jsIdx !== -1) {
    const endScript = '</script>\n</body>';
    const endIdx = html.indexOf(endScript, jsIdx);
    if (endIdx !== -1) {
        html = html.substring(0, jsIdx) + html.substring(endIdx);
    }
}

// Reverse step 1 (remove quick view HTML)
const htmlStart = '<!-- QUICK VIEW MODAL -->';
const htmlIdx = html.indexOf(htmlStart);
if (htmlIdx !== -1) {
    const htmlEnd = '</body>';
    const endIdx = html.indexOf(htmlEnd, htmlIdx);
    if (endIdx !== -1) {
        html = html.substring(0, htmlIdx) + html.substring(endIdx);
    }
}

fs.writeFileSync('index.html', html);
console.log('Reverted quick view changes.');
