const fs = require('fs');
const html = fs.readFileSync('/Users/christianduran/CRM GYSFLY/index.html', 'utf8');
let m; const scripts=[]; const r=/<script[^>]*>([\s\S]*?)<\/script>/gi;
while(m=r.exec(html)) { if (!m[1].includes('tailwind.config')) scripts.push(m[1]); }
const js = scripts.join("\n");

global.window = {
    addEventListener: function(evt, cb) {
        if (evt === 'DOMContentLoaded') {
            try { cb(); } catch(e) { console.error("DOMContentLoaded ERROR:", e); }
        }
    },
    location: { reload: function() {} }
};
global.document = {
    addEventListener: function() {},
    getElementById: function(id) { 
        return { 
            classList: { add: function(){}, remove: function(){} },
            getContext: function() { return {}; }
        };
    },
    querySelector: function() { return null; },
    createElement: function() { return { style: {} }; },
    body: { appendChild: function(){} }
};
global.localStorage = {
    getItem: function(k) { 
        if (k === 'gysfly_session') return 'active';
        if (k === 'gysfly_current_user') return JSON.stringify({role:'Admin'});
        return null; 
    },
    setItem: function() {},
    removeItem: function() {}
};
global.Chart = function() {};
global.Intl = { NumberFormat: function() { this.format = function(){return "0";} } };

try {
    eval(js);
    console.log("Eval completed without global execution errors.");
} catch(e) {
    console.error("GLOBAL EXECUTION ERROR:", e);
}
