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
        const dummyElement = { 
            classList: { add: function(){}, remove: function(){} },
            getContext: function() { return {}; },
            style: {},
            setAttribute: function() {},
            value: ''
        };
        dummyElement.parentElement = dummyElement;
        return dummyElement;
    },
    querySelector: function() { return null; },
    createElement: function() { return { style: {} }; },
    body: { appendChild: function(){} }
};
const mockStorage = {
    'gysfly_session': 'active',
    'gysfly_current_user': JSON.stringify({
        name: 'Gerente Gysfly',
        role: 'admin',
        permissions: {
            readClients: true,
            writeClients: true,
            deleteClients: true,
            manageCampaigns: true,
            accessSettings: true
        }
    })
};
global.localStorage = {
    getItem: function(k) { 
        return mockStorage[k] !== undefined ? mockStorage[k] : null; 
    },
    setItem: function(k, v) {
        mockStorage[k] = String(v);
    },
    removeItem: function(k) {
        delete mockStorage[k];
    }
};
global.Chart = function() {
    return {
        data: {
            labels: [],
            datasets: [
                { data: [], label: '' },
                { data: [], label: '' }
            ]
        },
        update: function() {}
    };
};
global.Intl = { NumberFormat: function() { this.format = function(){return "0";} } };

try {
    eval(js);
    console.log("Eval completed without global execution errors.");
} catch(e) {
    console.error("GLOBAL EXECUTION ERROR:", e);
}
