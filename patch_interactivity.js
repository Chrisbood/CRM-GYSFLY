const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add visual tap feedback (active:scale-95) to all buttons to make them feel "interactive"
html = html.replace(/class="([^"]*button[^"]*)"/g, (match, classes) => {
    if (!classes.includes('active:scale-95') && !classes.includes('active-glow')) {
        return `class="${classes} active:scale-95"`;
    }
    return match;
});

html = html.replace(/<button([^>]*)class="([^"]*)"/g, (match, prefix, classes) => {
    if (!classes.includes('active:scale-95') && !classes.includes('active-glow') && !classes.includes('transition-transform')) {
        return `<button${prefix}class="${classes} active:scale-[0.97] transition-transform"`;
    }
    return match;
});

// 2. Fix the "Exportar Datos" hover by adding an onclick fallback that just exports CSV immediately
// so it's guaranteed to work on touch screens
html = html.replace(
    '<button class="py-2 px-3.5 bg-surface-container-low hover:bg-surface-container-low/80 border border-glass-stroke text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm">',
    '<button onclick="exportToCSV()" class="py-2 px-3.5 bg-surface-container-low hover:bg-surface-container-low/80 border border-glass-stroke text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-[0.97]">'
);

// Write back
fs.writeFileSync('index.html', html);
console.log('Interactivity enhanced.');
