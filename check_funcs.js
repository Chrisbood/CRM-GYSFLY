const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const funcsToCheck = [
"addItineraryDay",
"addPassengerToProfile",
"addServiceToProfile",
"closeClientProfileModal",
"closeEmailModal",
"closeMagicAddModal",
"closeSendingModal",
"closeTransferModal",
"deleteClient",
"deleteItineraryDay",
"deletePassengerFromProfile",
"deleteServiceFromProfile",
"deleteTask",
"deleteUser",
"downloadCSVTemplate",
"downloadSimulatedFile",
"exportToCSV",
"exportToJSON",
"handleLogout",
"markAllInboxRead",
"moveTask",
"openClientProfileModal",
"openEmailModal",
"openMagicAddModal",
"openTransferModal",
"pregenerateLuxuryItinerary",
"printItineraryProposal",
"printLuxuryB2CBrochure",
"resetDatabase",
"saveProfileNotes",
"setClientFilter",
"setDbView",
"setMagicModalType",
"shiftClientStage",
"showQuickToast",
"startTransferSimulation",
"switchProfileTab",
"switchView",
"toggleTaskDone",
"triggerCampaignSend",
"triggerImportFileInput",
"triggerProfileDocumentUpload"
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
console.log("Missing functions:", missing.length === 0 ? "None" : missing.join(", "));
