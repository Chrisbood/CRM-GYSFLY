const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Create the Quick View Modal HTML
const quickViewModalHTML = `
    <!-- QUICK VIEW MODAL -->
    <div id="modal-quick-view" class="fixed inset-0 bg-background-base/90 backdrop-blur-sm z-[100] hidden items-center justify-center p-4 opacity-0 transition-opacity duration-300">
        <div class="bg-surface-card border border-glass-stroke rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col transform scale-95 transition-transform duration-300" id="quick-view-container">
            <!-- Header -->
            <div class="p-6 border-b border-glass-stroke/50 flex justify-between items-center relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent z-0"></div>
                <div class="relative z-10 flex items-center gap-4">
                    <div id="qv-avatar" class="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(13,148,136,0.4)]"></div>
                    <div>
                        <h3 id="qv-name" class="text-xl font-bold text-white leading-tight"></h3>
                        <p id="qv-email" class="text-xs text-on-surface-variant"></p>
                    </div>
                </div>
                <button onclick="closeQuickViewModal()" class="relative z-10 text-on-surface-variant hover:text-white transition-colors">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            
            <!-- Body -->
            <div class="p-6 space-y-6 flex-1">
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-surface-container-low/50 p-4 rounded-2xl border border-glass-stroke/50">
                        <p class="text-[10px] uppercase tracking-wider text-on-surface-variant font-medium mb-1">Destino</p>
                        <p id="qv-destination" class="text-sm font-bold text-white truncate"></p>
                    </div>
                    <div class="bg-surface-container-low/50 p-4 rounded-2xl border border-glass-stroke/50">
                        <p class="text-[10px] uppercase tracking-wider text-on-surface-variant font-medium mb-1">Presupuesto</p>
                        <p id="qv-budget" class="text-sm font-bold text-primary truncate"></p>
                    </div>
                </div>
                
                <div>
                    <p class="text-[10px] uppercase tracking-wider text-on-surface-variant font-medium mb-2">Estado Actual</p>
                    <div id="qv-status-container" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold">
                        <span id="qv-status-icon" class="material-symbols-outlined text-[16px]"></span>
                        <span id="qv-status-text"></span>
                    </div>
                </div>
                
                <div>
                    <p class="text-[10px] uppercase tracking-wider text-on-surface-variant font-medium mb-2">Notas Preliminares</p>
                    <p id="qv-notes" class="text-sm text-on-surface-variant/80 italic line-clamp-3 bg-surface-container-low/30 p-3 rounded-xl border border-glass-stroke/30"></p>
                </div>
            </div>
            
            <!-- Footer Actions -->
            <div class="p-5 border-t border-glass-stroke/50 bg-surface-container-low/20 flex gap-3">
                <button id="qv-btn-full" class="flex-1 py-3 bg-gradient-to-r from-primary to-primary-g text-white text-sm font-bold rounded-xl shadow-md active-glow transition-all flex justify-center items-center gap-2">
                    <span class="material-symbols-outlined text-[18px]">manage_accounts</span>
                    Ficha Completa
                </button>
                <button id="qv-btn-contact" class="px-5 py-3 bg-surface-container-low border border-glass-stroke text-white text-sm font-bold rounded-xl hover:bg-surface-variant/50 transition-all flex justify-center items-center" title="Contactar">
                    <span class="material-symbols-outlined text-[18px]">mail</span>
                </button>
            </div>
        </div>
    </div>
`;

// Insert the HTML just before closing body
html = html.replace('</body>', quickViewModalHTML + '\n</body>');

// 2. JS Functions for Quick View
const quickViewJS = `
        // QUICK VIEW MODAL LOGIC
        function openClientQuickView(id) {
            const client = clients.find(c => c.id === id);
            if(!client) return;
            
            // Populate
            document.getElementById('qv-avatar').innerText = client.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
            document.getElementById('qv-name').innerText = client.name;
            document.getElementById('qv-email').innerText = client.email || 'Sin correo';
            document.getElementById('qv-destination').innerText = client.destination || 'No especificado';
            document.getElementById('qv-budget').innerText = formatDollars(client.volume || 0);
            
            const badgeClass = getStatusBadgeClass(client.status);
            document.getElementById('qv-status-container').className = 'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ' + badgeClass;
            document.getElementById('qv-status-text').innerText = client.status;
            
            // Set an icon based on status
            let icon = 'trip_origin';
            if(client.status === 'Viaje Activo') icon = 'flight_takeoff';
            if(client.status === 'Reserva Confirmada') icon = 'check_circle';
            if(client.status === 'Inactivo') icon = 'person_off';
            document.getElementById('qv-status-icon').innerText = icon;
            
            document.getElementById('qv-notes').innerText = client.notes ? client.notes : 'No hay notas preliminares para este cliente.';
            
            // Buttons
            document.getElementById('qv-btn-full').onclick = () => {
                closeQuickViewModal();
                setTimeout(() => openClientProfileModal(id), 300);
            };
            document.getElementById('qv-btn-contact').onclick = () => {
                closeQuickViewModal();
                if(client.email) setTimeout(() => openEmailModal(client.email), 300);
            };
            
            // Show Modal with animation
            const modal = document.getElementById('modal-quick-view');
            const container = document.getElementById('quick-view-container');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            
            // Trigger reflow
            void modal.offsetWidth;
            
            modal.classList.remove('opacity-0');
            modal.classList.add('opacity-100');
            container.classList.remove('scale-95');
            container.classList.add('scale-100');
        }
        
        function closeQuickViewModal() {
            const modal = document.getElementById('modal-quick-view');
            const container = document.getElementById('quick-view-container');
            
            modal.classList.remove('opacity-100');
            modal.classList.add('opacity-0');
            container.classList.remove('scale-100');
            container.classList.add('scale-95');
            
            setTimeout(() => {
                modal.classList.remove('flex');
                modal.classList.add('hidden');
            }, 300);
        }
`;

// Insert the JS right before the closing script of index.html
html = html.replace('</script>\n</body>', quickViewJS + '\n</script>\n</body>');

// 3. Change onclick in Dashboard table
html = html.replace(/onclick="openClientProfileModal\(\$\{c\.id\}\)"/g, 'onclick="openClientQuickView(${c.id})"');

fs.writeFileSync('index.html', html);
console.log('Patched index.html with Quick View Modal successfully.');
