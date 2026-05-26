
        // Global variables and state
        let currentView = 'dashboard';
        let clients = [];
        let tasks = [];
        let campaigns = [];
        let users = [];
        let currentUser = null;
        let clientFilter = 'all';
        let currentTransferClientId = null;
        let currentProfileClientId = null;
        let chartInstances = {};
        
        // Quota values
        const storageLimitGB = 50000; // $50,000 Dollars target

        function formatDollars(val) {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
        }

        // INITIALIZATION
        window.addEventListener('DOMContentLoaded', () => {
            // Load state from localStorage or populate default
            initDatabase();
            
            // Check session
            if(localStorage.getItem('gysfly_session') === 'active') {
                currentUser = JSON.parse(localStorage.getItem('gysfly_current_user'));
                if (currentUser) {
                    applyUserPermissions();
                } else {
                    localStorage.removeItem('gysfly_session');
                    location.reload();
                    return;
                }
                
                document.getElementById('login-screen').classList.add('hidden');
                document.getElementById('app-interface').classList.remove('hidden');
                renderUI();
                initCharts();
                updateCampaignStats();
                updateCampaignChart();
            }
        });

        // DATABASE SEEDING & SYNC
        function initDatabase() {
            // 1. Clientes (with Notes & Tags & File systems)
            if(!localStorage.getItem('gysfly_clients')) {
                const defaultClients = [
                    { 
                        id: 1, 
                        name: 'Christian Durán', 
                        email: 'christian@gysfly.com', 
                        phone: '+34 600 123 456', 
                        status: 'Viaje Activo', 
                        volume: 4850,
                        cost: 3395,
                        country: 'España',
                        postal_code: '28001',
                        destination: 'Bali',
                        tags: ['VIP', 'Playa', 'Business'],
                        notes: 'Viajero VIP preferente. Solicita villas frente al mar con piscina infinity y chofer privado en Bali. Vuelos emitidos en clase Business.',
                        files: [
                            { name: 'Itinerario_Bali_VIP_Duran.pdf', size: '2.4 MB', date: '12/05/2026' },
                            { name: 'Billete_Iberia_Business.pdf', size: '1.8 MB', date: '12/05/2026' }
                        ]
                    },
                    { 
                        id: 2, 
                        name: 'Laura Mendoza', 
                        email: 'laura@gysfly.com', 
                        phone: '+34 600 987 654', 
                        status: 'Reserva Confirmada', 
                        volume: 3200,
                        cost: 2240,
                        country: 'México',
                        postal_code: '11000',
                        destination: 'París',
                        tags: ['Luna de Miel', 'Europa'],
                        notes: 'Viaje de aniversario en suite de lujo con vistas a la Torre Eiffel. Confirmadas entradas exclusivas sin colas para el Museo del Louvre.',
                        files: [
                            { name: 'Voucher_Hotel_Le_Bristol.pdf', size: '890 KB', date: '15/05/2026' }
                        ]
                    },
                    { 
                        id: 3, 
                        name: 'Carlos Gómez', 
                        email: 'carlos@gysfly.com', 
                        phone: '+34 611 222 333', 
                        status: 'Cotización Pendiente', 
                        volume: 6700,
                        cost: 4690,
                        country: 'Colombia',
                        postal_code: '08002',
                        destination: 'Maldivas',
                        tags: ['Exótico', 'Alerta Visa'],
                        notes: 'Interesado en un resort Overwater Bungalow de 5 estrellas todo incluido en Maldivas. Alerta: Pendiente confirmar trámite de visado de escala en EE.UU.',
                        files: [
                            { name: 'Propuesta_Maldivas_Resort.pdf', size: '3.4 MB', date: '10/05/2026' }
                        ]
                    },
                    { 
                        id: 4, 
                        name: 'Sofía Reyes', 
                        email: 'sofia@gysfly.com', 
                        phone: '+34 622 444 555', 
                        status: 'Inactivo', 
                        volume: 0,
                        cost: 0,
                        country: 'Argentina',
                        postal_code: 'C1001',
                        destination: 'Tokio',
                        tags: ['Asia', 'Primavera'],
                        notes: 'Cliente potencial que cotizó viaje a Japón en temporada de cerezos en flor. Sin reservas activas de momento.',
                        files: []
                    }
                ];
                localStorage.setItem('gysfly_clients', JSON.stringify(defaultClients));
            }
            clients = JSON.parse(localStorage.getItem('gysfly_clients'));

            // 2. Tareas
            if(!localStorage.getItem('gysfly_tasks')) {
                const defaultTasks = [
                    { id: 1, title: 'Confirmar chófer en Bali para Christian D.', assignee: 'Christian Durán', due: 'Hoy', priority: 'hoy', done: false },
                    { id: 2, title: 'Revisar visado de escala urgente para Carlos Gómez', assignee: 'Carlos Gómez', due: 'Hoy', priority: 'hoy', done: false },
                    { id: 3, title: 'Enviar voucher de hotel Le Bristol a Laura M.', assignee: 'Laura Mendoza', due: 'Completado', priority: 'hoy', done: true },
                    { id: 4, title: 'Cotizar paquete aéreo a Tokio para Sofía Reyes', assignee: 'Sofía Reyes', due: 'Mañana', priority: 'inbox', done: false },
                    { id: 5, title: 'Generar itinerario personalizado para Carlos G.', assignee: 'Carlos Gómez', due: 'Hoy', priority: 'inbox', done: false }
                ];
                localStorage.setItem('gysfly_tasks', JSON.stringify(defaultTasks));
            }
            tasks = JSON.parse(localStorage.getItem('gysfly_tasks'));

            // 3. Campañas
            if(!localStorage.getItem('gysfly_campaigns')) {
                const defaultCampaigns = [
                    { id: 1, subject: 'Boletín Exclusivo: Escapadas de Lujo en Maldivas & Bali', segment: 'all', size: 1248, date: '17/05/2026', status: 'Enviado', openRate: 74 },
                    { id: 2, subject: 'Propuestas de Cotización de Verano 2026', segment: 'cotizacion', size: 532, date: '16/05/2026', status: 'Enviado', openRate: 88 }
                ];
                localStorage.setItem('gysfly_campaigns', JSON.stringify(defaultCampaigns));
            }
            campaigns = JSON.parse(localStorage.getItem('gysfly_campaigns'));

            // 4. Usuarios y Permisos (ACL)
            if(!localStorage.getItem('gysfly_users')) {
                const defaultUsers = [
                    {
                        name: 'Gerente Gysfly',
                        email: 'admin@gysfly.com',
                        password: 'admin123',
                        role: 'admin',
                        permissions: {
                            readClients: true,
                            writeClients: true,
                            deleteClients: true,
                            manageCampaigns: true,
                            accessSettings: true
                        }
                    },
                    {
                        name: 'Agente Junior',
                        email: 'agente@gysfly.com',
                        password: 'agente123',
                        role: 'agent',
                        permissions: {
                            readClients: true,
                            writeClients: true,
                            deleteClients: false,
                            manageCampaigns: true,
                            accessSettings: false
                        }
                    }
                ];
                localStorage.setItem('gysfly_users', JSON.stringify(defaultUsers));
            }
            users = JSON.parse(localStorage.getItem('gysfly_users'));
        }

        function saveDatabase() {
            localStorage.setItem('gysfly_clients', JSON.stringify(clients));
            localStorage.setItem('gysfly_tasks', JSON.stringify(tasks));
            localStorage.setItem('gysfly_campaigns', JSON.stringify(campaigns));
            localStorage.setItem('gysfly_users', JSON.stringify(users));
            if(currentUser) {
                localStorage.setItem('gysfly_current_user', JSON.stringify(currentUser));
            }
        }

        function resetDatabase() {
            const password = prompt("⚠️ ACCIÓN DE ALTO RIESGO\n\nEsta acción borrará todos los viajeros, campañas, planificadores diarios y usuarios registrados para restaurar la configuración original de fábrica.\n\nPor favor, introduce la clave de administrador ('admin123') para confirmar:");
            
            if (password === null) return; // Cancelado
            
            if (password === 'admin123') {
                localStorage.removeItem('gysfly_clients');
                localStorage.removeItem('gysfly_tasks');
                localStorage.removeItem('gysfly_campaigns');
                localStorage.removeItem('gysfly_users');
                localStorage.removeItem('gysfly_current_user');
                localStorage.removeItem('gysfly_session'); // Force login
                showNotification('Base de Datos', 'Base de datos restaurada al estado de fábrica. Inicia sesión nuevamente.', 'warning');
                setTimeout(() => {
                    location.reload();
                }, 1500);
            } else {
                showNotification('Acceso Denegado', 'La clave de autorización es incorrecta.', 'danger');
            }
        }

        // AUTH SYSTEM & MULTIUSER ACL ENGINE
        function handleLogin(event) {
            event.preventDefault();
            const emailVal = document.getElementById('email').value.trim().toLowerCase();
            const passVal = document.getElementById('password').value.trim();
            
            // Look up in dynamically seeded users database
            const matchedUser = users.find(u => u.email === emailVal);
            
            if (matchedUser) {
                if (matchedUser.password === passVal) {
                    currentUser = matchedUser;
                    localStorage.setItem('gysfly_session', 'active');
                    localStorage.setItem('gysfly_current_user', JSON.stringify(currentUser));
                    
                    // Beautiful fade transition
                    const loginScr = document.getElementById('login-screen');
                    loginScr.style.transition = 'opacity 0.5s ease-out';
                    loginScr.style.opacity = '0';
                    
                    setTimeout(() => {
                        loginScr.classList.add('hidden');
                        document.getElementById('app-interface').classList.remove('hidden');
                        loginScr.style.opacity = '1';
                        
                        showNotification('Sesión Autorizada', `¡Hola ${currentUser.name}! Consola de control lista para tu rol.`, 'success');
                        
                        // Apply Access Control and Render UI
                        applyUserPermissions();
                        renderUI();
                        initCharts();
                    }, 500);
                } else {
                    showNotification('Error de Acceso', 'La contraseña ingresada es incorrecta.', 'danger');
                }
            } else {
                showNotification('Error de Acceso', 'No existe ningún usuario registrado con ese correo.', 'danger');
            }
        }

        function handleLogout() {
            localStorage.removeItem('gysfly_session');
            localStorage.removeItem('gysfly_current_user');
            currentUser = null;
            
            // Switch internally to dashboard so they don't get stuck in settings view on next login
            currentView = 'dashboard';
            const views = ['dashboard', 'clientes', 'campanas', 'analiticas', 'inbox', 'hoy', 'ajustes'];
            views.forEach(v => {
                const element = document.getElementById(`view-${v}`);
                if (element) element.classList.add('hidden');
                const navBtn = document.getElementById(`nav-${v}`);
                if (navBtn) navBtn.classList.remove('active-nav');
            });
            document.getElementById('view-dashboard').classList.remove('hidden');
            document.getElementById('nav-dashboard').classList.add('active-nav');
            
            // Show login screen
            document.getElementById('app-interface').classList.add('hidden');
            document.getElementById('login-screen').classList.remove('hidden');
            
            showNotification('Sesión Cerrada', 'Has cerrado la consola administrativa de forma segura.', 'warning');
        }

        function applyUserPermissions() {
            if(!currentUser) return;
            
            // 1. Update Top Header Profile Info
            const nameEl = document.getElementById('header-user-name');
            const roleEl = document.getElementById('header-user-role');
            const avatarEl = document.getElementById('header-user-avatar');
            
            if(nameEl) nameEl.innerText = currentUser.name;
            if(roleEl) roleEl.innerText = currentUser.role === 'admin' ? 'Gerente / Admin' : 'Agente Gysfly';
            
            if(avatarEl) {
                // Get initials (up to 2 characters)
                const parts = currentUser.name.trim().split(/\s+/);
                const initials = parts.map(p => p[0]).join('').slice(0, 2).toUpperCase();
                avatarEl.innerText = initials || 'GF';
            }
            
            // 2. Navigation bar locks (ACL)
            const p = currentUser.permissions || {
                readClients: true,
                writeClients: true,
                deleteClients: false,
                manageCampaigns: true,
                accessSettings: false
            };
            
            const navClientes = document.getElementById('nav-clientes');
            const navCampanas = document.getElementById('nav-campanas');
            const navAjustes = document.getElementById('nav-ajustes');
            
            if(navClientes) {
                if(p.readClients) {
                    navClientes.classList.remove('hidden');
                } else {
                    navClientes.classList.add('hidden');
                    if(currentView === 'clientes') switchView('dashboard');
                }
            }
            
            if(navCampanas) {
                if(p.manageCampaigns) {
                    navCampanas.classList.remove('hidden');
                } else {
                    navCampanas.classList.add('hidden');
                    if(currentView === 'campanas') switchView('dashboard');
                }
            }
            
            if(navAjustes) {
                if(p.accessSettings) {
                    navAjustes.classList.remove('hidden');
                } else {
                    navAjustes.classList.add('hidden');
                    if(currentView === 'ajustes') switchView('dashboard');
                }
            }
            
            // 3. Import & Creation Permissions Lock in UI
            const importContainer = document.getElementById('import-excel-container');
            const floatingAddBtn = document.querySelector('button[onclick*="showMagicForm"]');
            
            if(importContainer) {
                if(p.writeClients) {
                    importContainer.style.opacity = '1';
                    importContainer.style.pointerEvents = 'auto';
                } else {
                    importContainer.style.opacity = '0.4';
                    importContainer.style.pointerEvents = 'none';
                }
            }
            
            if(floatingAddBtn) {
                if(p.writeClients) {
                    floatingAddBtn.classList.remove('hidden');
                } else {
                    floatingAddBtn.classList.add('hidden');
                }
            }
            
            // 4. Technical File Delete Button Lock
            const deleteProfileBtn = document.getElementById('profile-delete-btn');
            if(deleteProfileBtn) {
                if(p.deleteClients) {
                    deleteProfileBtn.classList.remove('hidden');
                } else {
                    deleteProfileBtn.classList.add('hidden');
                }
            }
            
            // Refresh settings lists if view is active
            if(currentView === 'ajustes') {
                renderUsersList();
            }
        }

        // PASSWORD CHANGE CONTROLLER
        function handlePasswordChange(event) {
            event.preventDefault();
            const currentVal = document.getElementById('pwd-current').value;
            const newVal = document.getElementById('pwd-new').value;
            const confirmVal = document.getElementById('pwd-confirm').value;
            
            if(!currentUser) return;
            
            if(currentUser.password !== currentVal) {
                showNotification('Clave Incorrecta', 'La contraseña actual ingresada es incorrecta.', 'danger');
                return;
            }
            
            if(newVal.length < 6) {
                showNotification('Clave Muy Corta', 'La nueva contraseña debe tener al menos 6 caracteres.', 'warning');
                return;
            }
            
            if(newVal !== confirmVal) {
                showNotification('Claves No Coinciden', 'La confirmación no coincide con la nueva contraseña.', 'danger');
                return;
            }
            
            // Update active user password
            currentUser.password = newVal;
            
            // Sync with users list
            const userIndex = users.findIndex(u => u.email === currentUser.email);
            if(userIndex !== -1) {
                users[userIndex].password = newVal;
            }
            
            saveDatabase();
            
            document.getElementById('pwd-current').value = '';
            document.getElementById('pwd-new').value = '';
            document.getElementById('pwd-confirm').value = '';
            
            showNotification('Seguridad Gysfly', '¡Tu contraseña ha sido actualizada correctamente!', 'success');
        }

        // USER CREATION & ACL MANAGEMENT
        function handleCreateUser(event) {
            event.preventDefault();
            const name = document.getElementById('usr-name').value.trim();
            const email = document.getElementById('usr-email').value.trim().toLowerCase();
            const password = document.getElementById('usr-password').value.trim();
            const role = document.getElementById('usr-role').value;
            
            // Check uniqueness
            if(users.some(u => u.email === email)) {
                showNotification('Usuario Existente', 'Ya existe un usuario registrado con este correo.', 'danger');
                return;
            }
            
            if(password.length < 6) {
                showNotification('Clave Muy Corta', 'La contraseña debe poseer mínimo 6 caracteres.', 'warning');
                return;
            }
            
            const newUser = {
                name,
                email,
                password,
                role,
                permissions: {
                    readClients: document.getElementById('perm-read').checked,
                    writeClients: document.getElementById('perm-write').checked,
                    deleteClients: document.getElementById('perm-delete').checked,
                    manageCampaigns: document.getElementById('perm-campaigns').checked,
                    accessSettings: document.getElementById('perm-settings').checked
                }
            };
            
            users.push(newUser);
            saveDatabase();
            
            // Reset fields
            document.getElementById('usr-name').value = '';
            document.getElementById('usr-email').value = '';
            document.getElementById('usr-password').value = '';
            document.getElementById('usr-role').value = 'agent';
            
            document.getElementById('perm-read').checked = true;
            document.getElementById('perm-write').checked = true;
            document.getElementById('perm-delete').checked = false;
            document.getElementById('perm-campaigns').checked = true;
            document.getElementById('perm-settings').checked = false;
            
            renderUsersList();
            showNotification('Personal Registrado', `El usuario "${name}" ha sido creado con sus permisos asignados.`, 'success');
        }

        function deleteUser(email) {
            if(!currentUser) return;
            
            if(currentUser.email === email) {
                showNotification('Acción Denegada', 'No puedes eliminar tu propio usuario en sesión activa.', 'warning');
                return;
            }
            
            if(email === 'admin@gysfly.com') {
                showNotification('Acción Denegada', 'No es posible eliminar el Administrador de fábrica original.', 'danger');
                return;
            }
            
            const confirmDel = confirm(`¿Estás seguro de que deseas eliminar permanentemente el acceso del usuario <${email}> del CRM?`);
            if(!confirmDel) return;
            
            users = users.filter(u => u.email !== email);
            saveDatabase();
            renderUsersList();
            showNotification('Acceso Retirado', 'El usuario ha sido eliminado de la base de datos.', 'success');
        }

        function renderUsersList() {
            const tbody = document.getElementById('settings-users-list');
            if(!tbody) return;
            
            tbody.innerHTML = '';
            
            users.forEach(u => {
                const roleBadge = u.role === 'admin' 
                    ? '<span class="bg-primary/20 text-primary border border-primary/20 font-bold px-2 py-0.5 rounded-full text-[9px]">Admin</span>' 
                    : '<span class="bg-warning/20 text-warning border border-warning/20 font-bold px-2 py-0.5 rounded-full text-[9px]">Agente</span>';
                
                // Construct beautiful permission pills
                const p = u.permissions;
                const pList = [];
                if(p.readClients) pList.push('Ver');
                if(p.writeClients) pList.push('Editar');
                if(p.deleteClients) pList.push('Borrar');
                if(p.manageCampaigns) pList.push('Correos');
                if(p.accessSettings) pList.push('Ajustes');
                
                const permsHtml = pList.length > 0 
                    ? pList.map(item => `<span class="bg-surface-container-low border border-glass-stroke text-on-surface-variant/80 px-1.5 py-0.5 rounded text-[8px] mr-1">${item}</span>`).join('')
                    : '<span class="text-danger text-[8px] italic font-semibold">Sin Permisos</span>';
                
                tbody.innerHTML += `
                    <tr class="hover:bg-white/5 transition-colors">
                        <td class="py-3 pr-2">
                            <p class="font-bold text-white text-xs">${u.name}</p>
                            <p class="text-[9px] text-on-surface-variant/60">${u.email}</p>
                        </td>
                        <td class="py-3">${roleBadge}</td>
                        <td class="py-3">${permsHtml}</td>
                        <td class="py-3 text-right">
                            <button onclick="deleteUser('${u.email}')" class="w-7 h-7 rounded-lg hover:bg-danger/20 text-on-surface-variant hover:text-danger flex items-center justify-center transition-all inline-flex align-middle" title="Eliminar Usuario">
                                <span class="material-symbols-outlined text-[16px]">person_remove</span>
                            </button>
                        </td>
                    </tr>
                `;
            });
        }

        // NAVIGATION SYSTEM (View Swapper)
        function switchView(viewName) {
            const views = ['dashboard', 'clientes', 'campanas', 'analiticas', 'inbox', 'hoy', 'ajustes'];
            views.forEach(v => {
                const element = document.getElementById(`view-${v}`);
                if (element) element.classList.add('hidden');
                
                const navBtn = document.getElementById(`nav-${v}`);
                if (navBtn) navBtn.classList.remove('active-nav');
            });
            
            currentView = viewName;
            const targetView = document.getElementById(`view-${viewName}`);
            if (targetView) targetView.classList.remove('hidden');
            
            const activeNavBtn = document.getElementById(`nav-${viewName}`);
            if (activeNavBtn) activeNavBtn.classList.add('active-nav');

            // Update title
            const titles = {
                dashboard: 'GYSFLY TRAVELS — Consola de Control de la Agencia',
                clientes: 'GYSFLY TRAVELS — Base de Datos e Importador de Viajeros',
                campanas: 'GYSFLY TRAVELS — Campañas Directas y Boletines',
                analiticas: 'GYSFLY TRAVELS — Consola de Analíticas de Viajeros',
                inbox: 'GYSFLY TRAVELS — Inbox de Solicitudes y Vouchers',
                hoy: 'GYSFLY TRAVELS — Tareas y Planificador Diario',
                ajustes: 'GYSFLY TRAVELS — Ajustes del Sistema y Respaldos'
            };
            document.getElementById('view-title').innerText = titles[viewName] || 'GYSFLY TRAVELS — Portal Administrativo';

            renderUI();
            if (viewName === 'analiticas') {
                applyAnalyticsFilters();
            } else if (viewName === 'dashboard') {
                updateCharts();
            } else if (viewName === 'ajustes') {
                renderUsersList();
            } else if (viewName === 'campanas') {
                updateCampaignStats();
                updateCampaignChart();
            }
        }

        // RENDER INTERACTION LAYER
        function renderUI() {
            // Calculate storage values
            const totalVol = clients.reduce((acc, c) => acc + c.volume, 0);
            const quotaRatioPercent = Math.round((totalVol / storageLimitGB) * 100);
            
            // Check critical limit alert: clients with "visa" or "alerta" in notes
            const criticalClients = clients.filter(c => c.notes && (c.notes.toLowerCase().includes('visa') || c.notes.toLowerCase().includes('alerta')));
            const criticalAlertBadge = document.getElementById('critical-storage-alert');
            if (criticalClients.length > 0) {
                criticalAlertBadge.classList.remove('hidden');
                criticalAlertBadge.classList.add('flex');
            } else {
                criticalAlertBadge.classList.add('hidden');
                criticalAlertBadge.classList.remove('flex');
            }

            // 1. Update stats cards counters
            document.getElementById('stat-total-clients').innerText = clients.length + ' Viajeros';
            document.getElementById('stat-total-volume').innerText = formatDollars(totalVol);
            document.getElementById('stat-storage-ratio').innerText = quotaRatioPercent + '% de la meta mensual';
            document.getElementById('stat-volume-bar').style.width = Math.min(100, quotaRatioPercent) + '%';
            document.getElementById('stat-total-campaigns').innerText = campaigns.length;
            
            // Stats limits for analytics view too
            const statTotalGbUsed = document.getElementById('stat-total-gb-used');
            if(statTotalGbUsed) statTotalGbUsed.innerText = clients.length + ' Viajeros';
            
            const totalCost = clients.reduce((acc, c) => acc + (c.cost !== undefined ? c.cost : Math.round(c.volume * 0.7)), 0);
            const totalProfit = totalVol - totalCost;
            const avgMargin = totalVol > 0 ? Math.round((totalProfit / totalVol) * 100) : 0;

            const costEl = document.getElementById('stat-total-cost-analytics');
            if(costEl) costEl.innerText = formatDollars(totalCost);
            
            const profitEl = document.getElementById('stat-total-profit-analytics');
            if(profitEl) profitEl.innerText = formatDollars(totalProfit);
            
            const marginEl = document.getElementById('stat-avg-margin-analytics');
            if(marginEl) marginEl.innerText = `${avgMargin}% Margen Promedio`;

            const statAvgGb = document.getElementById('stat-avg-gb-client');
            if(statAvgGb) statAvgGb.innerText = formatDollars(Math.round(totalVol / (clients.length || 1)));
            
            const statCriticalCount = document.getElementById('stat-critical-count');
            if(statCriticalCount) statCriticalCount.innerText = `${criticalClients.length} Reservas VIP`;

            const pendingTasksCount = tasks.filter(t => !t.done).length;
            const doneTasksCount = tasks.filter(t => t.done).length;
            const totalTasks = tasks.length || 1;
            const percentTasks = Math.round((doneTasksCount / totalTasks) * 100);
            
            document.getElementById('stat-pending-tasks').innerText = pendingTasksCount;
            document.getElementById('stat-tasks-percent').innerText = percentTasks + '%';
            
            // Adjust circular SVG indicator
            const circleOffset = 113 - (113 * percentTasks) / 100;
            document.getElementById('stat-tasks-circle').setAttribute('stroke-dashoffset', circleOffset);

            // Update sidebar badges
            const inboxBadge = tasks.filter(t => t.priority === 'inbox' && !t.done).length;
            const hoyBadge = tasks.filter(t => t.priority === 'hoy' && !t.done).length;
            
            document.getElementById('badge-inbox').innerText = inboxBadge;
            document.getElementById('badge-inbox').style.display = inboxBadge ? 'inline-block' : 'none';
            document.getElementById('badge-hoy').innerText = hoyBadge;
            document.getElementById('badge-hoy').style.display = hoyBadge ? 'inline-block' : 'none';

            // 2. Render Recent Customers (Dashboard Table)
            const recentClientsTbody = document.getElementById('dashboard-recent-clients');
            recentClientsTbody.innerHTML = '';
            
            // Sort by volume descending for dashboard overview
            const sortedClientsByVol = [...clients].sort((a,b) => b.volume - a.volume);
            
            sortedClientsByVol.slice(0, 4).forEach(c => {
                const badgeColor = getStatusBadgeClass(c.status);
                
                recentClientsTbody.innerHTML += `
                    <tr onclick="openClientProfileModal(${c.id})" class="hover:bg-surface-variant/10 transition-colors group cursor-pointer">
                        <td class="px-6 py-4 flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[12px]">${c.name.split(' ').map(n => n[0]).join('')}</div>
                            <span class="font-medium text-white group-hover:text-primary transition-colors">${c.name}</span>
                        </td>
                        <td class="px-6 py-4 text-on-surface-variant">${c.email}</td>
                        <td class="px-6 py-4 text-xs font-semibold text-primary">${c.destination || 'Bali'}</td>
                        <td class="px-6 py-4 font-bold text-white">${formatDollars(c.volume)}</td>
                        <td class="px-6 py-4"><span class="${badgeColor} text-[10px] font-bold px-2.5 py-1 rounded-full border">${c.status}</span></td>
                        <td class="px-6 py-4 text-right" onclick="event.stopPropagation()">
                            <div class="flex justify-end gap-1">
                                <button onclick="openEmailModal('${c.email}')" class="w-8 h-8 rounded-lg hover:bg-surface-container-low text-on-surface-variant hover:text-primary flex items-center justify-center transition-all" title="Enviar correo">
                                    <span class="material-symbols-outlined text-[18px]">mail</span>
                                </button>
                                <button onclick="openTransferModal(${c.id})" class="w-8 h-8 rounded-lg hover:bg-surface-container-low text-on-surface-variant hover:text-success flex items-center justify-center transition-all" title="Emitir Documento">
                                    <span class="material-symbols-outlined text-[18px]">cloud_sync</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            // 3. Render Things 3 quick todos on Dashboard
            const dashTasksList = document.getElementById('dashboard-tasks-list');
            dashTasksList.innerHTML = '';
            const dashTasks = tasks.filter(t => t.priority === 'hoy').slice(0, 4);
            dashTasks.forEach(t => {
                const doneClass = t.done ? 'line-through opacity-50' : '';
                dashTasksList.innerHTML += `
                    <div class="flex items-start gap-3 group cursor-pointer" onclick="toggleTaskDone(${t.id})">
                        <div class="w-5 h-5 rounded border-2 ${t.done ? 'border-primary bg-primary/20' : 'border-glass-stroke group-hover:border-primary'} mt-0.5 flex items-center justify-center transition-all">
                            <span class="material-symbols-outlined text-[14px] text-primary ${t.done ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}" style="font-variation-settings: 'FILL' 1;">check</span>
                        </div>
                        <div class="${doneClass}">
                            <p class="text-xs font-semibold text-white">${t.title}</p>
                            <p class="text-[10px] text-on-surface-variant/60">${t.due} • ${t.assignee}</p>
                        </div>
                    </div>
                `;
            });

            // 4. Render main database view
            renderClientsDatabase();

            // 5. Render Inbox & Today lists
            renderInboxView();
            renderTodayView();
            
            // Calculate campaign segment size
            calculateSegmentSize(document.getElementById('campaign-segment').value);
            renderCampaignsHistory();
        }

        // CLIENTS DATABASE VIEW ENGINE (Interactive CRUD & Profile clicks)
        function renderClientsDatabase() {
            const dbList = document.getElementById('db-clients-list');
            dbList.innerHTML = '';
            
            let filtered = clients;
            
            // Status filters
            if (clientFilter !== 'all') {
                filtered = clients.filter(c => c.status === clientFilter);
            }
            
            // Search (support search by name, email, country, destination, postal_code)
            const query = document.getElementById('client-search').value.toLowerCase().trim();
            if (query) {
                filtered = filtered.filter(c => 
                    c.name.toLowerCase().includes(query) || 
                    c.email.toLowerCase().includes(query) || 
                    (c.country && c.country.toLowerCase().includes(query)) ||
                    (c.destination && c.destination.toLowerCase().includes(query)) ||
                    (c.postal_code && c.postal_code.toLowerCase().includes(query)) ||
                    (c.notes && c.notes.toLowerCase().includes(query))
                );
            }

            if (filtered.length === 0) {
                document.getElementById('clients-empty').classList.remove('hidden');
                dbList.parentElement.classList.add('hidden');
            } else {
                document.getElementById('clients-empty').classList.add('hidden');
                dbList.parentElement.classList.remove('hidden');
                
                filtered.forEach(c => {
                    const badgeColor = getStatusBadgeClass(c.status);
                    
                    dbList.innerHTML += `
                        <tr onclick="openClientProfileModal(${c.id})" class="hover:bg-surface-variant/10 transition-colors cursor-pointer group">
                            <td class="px-6 py-4 flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-primary/25 text-primary flex items-center justify-center font-bold text-[12px]">${c.name.split(' ').map(n => n[0]).join('')}</div>
                                <div>
                                    <p class="font-semibold text-white text-xs group-hover:text-primary transition-colors">${c.name}</p>
                                    <p class="text-[9px] text-on-surface-variant/60">ID: GYS-${1000 + c.id}</p>
                                </div>
                            </td>
                            <td class="px-6 py-4 text-on-surface-variant">${c.email}<br><span class="text-[10px] opacity-60">${c.phone}</span></td>
                            <td class="px-6 py-4 text-on-surface-variant font-medium">${c.country || 'España'}<br><span class="text-[10px] opacity-60">${c.postal_code || '28001'}</span></td>
                            <td class="px-6 py-4 text-white font-bold text-xs">${c.destination || 'Bali'}</td>
                            <td class="px-6 py-4">
                                <div class="flex items-center gap-2">
                                    <span class="font-bold text-white">${formatDollars(c.volume)}</span>
                                    <span class="text-[9px] text-on-surface-variant/50">${c.files ? c.files.length : 0} Docs</span>
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                <span class="${badgeColor} text-[10px] font-bold px-2.5 py-1 rounded-full border">${c.status}</span>
                            </td>
                            <td class="px-6 py-4 text-right" onclick="event.stopPropagation()">
                                <div class="flex justify-end gap-1">
                                    <!-- Send Email -->
                                    <button onclick="openEmailModal('${c.email}')" class="w-8 h-8 rounded-lg hover:bg-surface-container-low text-on-surface-variant hover:text-primary flex items-center justify-center transition-all" title="Redactar correo">
                                        <span class="material-symbols-outlined text-[18px]">mail</span>
                                    </button>
                                    <!-- Simulate Traffic -->
                                    <button onclick="openTransferModal(${c.id})" class="w-8 h-8 rounded-lg hover:bg-surface-container-low text-on-surface-variant hover:text-success flex items-center justify-center transition-all" title="Emitir Documento">
                                        <span class="material-symbols-outlined text-[18px]">cloud_sync</span>
                                    </button>
                                    <!-- Delete client -->
                                    ${currentUser && currentUser.permissions.deleteClients ? `
                                    <button onclick="deleteClient(${c.id})" class="w-8 h-8 rounded-lg hover:bg-surface-container-low text-on-surface-variant hover:text-danger flex items-center justify-center transition-all" title="Eliminar Cliente">
                                        <span class="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                    ` : ''}
                                </div>
                            </td>
                        </tr>
                    `;
                });
            }
        }

        function filterClients() {
            renderClientsDatabase();
        }

        function setClientFilter(filterVal) {
            clientFilter = filterVal;
            
            const mapping = {
                'all': 'all',
                'Viaje Activo': 'viaje',
                'Reserva Confirmada': 'reserva',
                'Cotización Pendiente': 'cotizacion',
                'Inactivo': 'inactivo'
            };
            
            const activeKey = mapping[filterVal] || 'all';
            const keys = ['all', 'viaje', 'reserva', 'cotizacion', 'inactivo'];
            
            keys.forEach(k => {
                const btn = document.getElementById(`filter-btn-${k}`);
                if (btn) {
                    if (k === activeKey) {
                        btn.classList.add('bg-primary', 'text-white');
                        btn.classList.remove('bg-surface-container-low', 'text-on-surface-variant');
                    } else {
                        btn.classList.remove('bg-primary', 'text-white');
                        btn.classList.add('bg-surface-container-low', 'text-on-surface-variant');
                    }
                }
            });
            renderClientsDatabase();
        }

        function deleteClient(id) {
            if(confirm('¿Seguro que deseas eliminar este cliente de la base de datos de forma permanente?')) {
                clients = clients.filter(c => c.id !== id);
                saveDatabase();
                showNotification('Cliente Eliminado', 'Se ha purgado el registro de clientes.', 'danger');
                renderUI();
                updateCharts();
            }
        }

        // CLIENT PROFILE DETAILED MODAL (Ficha Técnica)
        function openClientProfileModal(id) {
            currentProfileClientId = id;
            const client = clients.find(c => c.id === id);
            if(client) {
                document.getElementById('profile-name').innerText = client.name;
                document.getElementById('profile-id').innerText = `ID: GYS-${1000 + client.id}`;
                document.getElementById('profile-email').innerText = client.email;
                document.getElementById('profile-email').onclick = () => { closeClientProfileModal(); openEmailModal(client.email); };
                document.getElementById('profile-phone').innerText = client.phone;
                document.getElementById('profile-demographics').innerText = `${client.country || 'España'} (${client.postal_code || '28001'})`;
                document.getElementById('profile-destination').innerText = client.destination || 'Bali';
                document.getElementById('profile-volume').innerText = formatDollars(client.volume);
                document.getElementById('profile-notes-textarea').value = client.notes || '';
                
                // Contabilidad del Viaje Bento population
                const volume = client.volume || 0;
                const cost = client.cost !== undefined ? client.cost : Math.round(volume * 0.7);
                const profit = volume - cost;
                const marginPercent = volume > 0 ? ((profit / volume) * 100).toFixed(0) : '0';

                document.getElementById('profile-financial-volume').innerText = formatDollars(volume);
                document.getElementById('profile-financial-cost').innerText = formatDollars(cost);
                document.getElementById('profile-financial-profit').innerText = formatDollars(profit);
                
                const marginEl = document.getElementById('profile-financial-margin');
                marginEl.innerText = `${marginPercent}% Margen`;
                if(profit >= 0) {
                    marginEl.className = 'text-[9px] px-1.5 py-0.5 rounded bg-success/20 text-success border border-success/25 font-bold';
                } else {
                    marginEl.className = 'text-[9px] px-1.5 py-0.5 rounded bg-danger/20 text-danger border border-danger/25 font-bold';
                }
                
                // Avatar letters
                document.getElementById('profile-avatar').innerText = client.name.split(' ').map(n => n[0]).join('');

                // Status
                const statusBadge = document.getElementById('profile-status');
                statusBadge.innerText = client.status;
                statusBadge.className = 'px-2 py-0.5 rounded-full text-[9px] font-bold ' + getStatusBadgeClass(client.status);
                
                // Footer buttons binding
                document.getElementById('profile-email-btn').onclick = () => { closeClientProfileModal(); openEmailModal(client.email); };
                document.getElementById('profile-traffic-btn').onclick = () => { closeClientProfileModal(); openTransferModal(client.id); };
                document.getElementById('profile-delete-btn').onclick = () => {
                    closeClientProfileModal();
                    deleteClient(client.id);
                };

                // Render File documents
                renderProfileFiles(client);

                document.getElementById('modal-client-profile').classList.remove('hidden');
                document.getElementById('modal-client-profile').classList.add('flex');
            }
        }

        function closeClientProfileModal() {
            document.getElementById('modal-client-profile').classList.add('hidden');
            document.getElementById('modal-client-profile').classList.remove('flex');
            currentProfileClientId = null;
        }

        function renderProfileFiles(client) {
            const list = document.getElementById('profile-files-list');
            list.innerHTML = '';
            
            const docs = client.files || [];
            document.getElementById('profile-files-count').innerText = docs.length + ' archivos';
            
            if (docs.length === 0) {
                list.innerHTML = `<p class="text-[10px] text-on-surface-variant/40 italic p-3 text-center">No hay documentos de cuota subidos para este cliente.</p>`;
                return;
            }

            docs.forEach((doc, idx) => {
                list.innerHTML += `
                    <div class="p-2 bg-surface-container-low/60 border border-glass-stroke rounded-xl flex items-center justify-between text-[11px]">
                        <div class="flex items-center gap-2 truncate">
                            <span class="material-symbols-outlined text-primary text-[16px]">draft</span>
                            <div class="truncate">
                                <p class="font-medium text-white truncate">${doc.name}</p>
                                <p class="text-[9px] text-on-surface-variant/50">${doc.date} • ${doc.size}</p>
                            </div>
                        </div>
                        <button onclick="downloadSimulatedFile(${client.id}, '${doc.name}')" class="text-primary hover:text-white p-1" title="Descargar archivo">
                            <span class="material-symbols-outlined text-[16px]">download</span>
                        </button>
                    </div>
                `;
            });
        }

        function saveProfileNotes() {
            const client = clients.find(c => c.id === currentProfileClientId);
            if(client) {
                const notesVal = document.getElementById('profile-notes-textarea').value.trim();
                client.notes = notesVal;
                saveDatabase();
                showNotification('Ficha Actualizada', 'Se guardaron las anotaciones del cliente.', 'success');
                renderUI();
            }
        }

        function triggerProfileDocumentUpload() {
            const client = clients.find(c => c.id === currentProfileClientId);
            if(!client) return;
            
            closeClientProfileModal();
            openTransferModal(client.id);
            startTransferSimulation('upload');
        }

        function downloadSimulatedFile(clientId, fileName) {
            const client = clients.find(c => c.id === clientId);
            if (!client) {
                showNotification('Error', 'Cliente no encontrado.', 'danger');
                return;
            }
            generateRealTravelDocument(client, fileName);
            showNotification('Emisión Éxito', `Se emitió ${fileName} correctamente.`, 'success');
        }

        function getAirportCode(destination) {
            if (!destination) return "DPS";
            const dest = destination.toLowerCase().trim();
            if (dest.includes("bali")) return "DPS";
            if (dest.includes("parís") || dest.includes("paris")) return "CDG";
            if (dest.includes("maldivas")) return "MLE";
            if (dest.includes("singapur")) return "SIN";
            if (dest.includes("roma")) return "FCO";
            if (dest.includes("tokio") || dest.includes("tokyo")) return "NRT";
            if (dest.includes("tailandia") || dest.includes("bangkok")) return "BKK";
            if (dest.includes("caribe") || dest.includes("cancún") || dest.includes("cancun")) return "CUN";
            return "DPS";
        }

        function generateRealTravelDocument(client, documentName) {
            const docWindow = window.open("", "_blank", "width=800,height=900");
            if (!docWindow) {
                showNotification('Permisos Requeridos', 'El navegador bloqueó la ventana emergente. Por favor, permite ventanas emergentes para emitir el PDF.', 'danger');
                return;
            }
            
            let title = "Documento de Viaje - Gysfly Travels";
            let badgeText = "GYSFLY TRAVELS";
            let isFlight = documentName.toLowerCase().includes("billete") || documentName.toLowerCase().includes("vuelo");
            let isHotel = documentName.toLowerCase().includes("voucher") || documentName.toLowerCase().includes("hotel");
            
            let contentHtml = "";
            const amount = client.volume ? `$${client.volume.toLocaleString('en-US')} USD` : "$3,500 USD";
            const localizer = "GYS-" + (100000 + client.id);
            const dateStr = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
            
            if (isFlight) {
                title = `Billete Aéreo VIP - ${client.name}`;
                badgeText = "CABINA BUSINESS CLASS";
                contentHtml = `
                    <div class="ticket-header">
                        <div>
                            <h1 class="brand">GYSFLY TRAVELS</h1>
                            <p class="brand-sub">Luxury Worldwide Flights</p>
                        </div>
                        <div class="ticket-badge">${badgeText}</div>
                    </div>
                    
                    <div class="ticket-body">
                        <div class="grid-3">
                            <div>
                                <span class="label">PASAJERO</span>
                                <p class="val">${client.name}</p>
                            </div>
                            <div>
                                <span class="label">NÚMERO DE VUELO</span>
                                <p class="val">GY-${100 + client.id}</p>
                            </div>
                            <div>
                                <span class="label">LOCALIZADOR</span>
                                <p class="val">${localizer}</p>
                            </div>
                        </div>
                        
                        <div class="route-block">
                            <div class="route-city">
                                <h3>MAD</h3>
                                <p>Madrid, España</p>
                            </div>
                            <div class="route-arrow">
                                <span class="material-symbols-outlined text-[32px] text-gold">flight_takeoff</span>
                                <div class="line"></div>
                            </div>
                            <div class="route-city text-right">
                                <h3>${getAirportCode(client.destination)}</h3>
                                <p>${client.destination}</p>
                            </div>
                        </div>
                        
                        <div class="grid-4 mt-6">
                            <div>
                                <span class="label">FECHA</span>
                                <p class="val">${dateStr}</p>
                            </div>
                            <div>
                                <span class="label">EMBARQUE</span>
                                <p class="val">08:45 AM</p>
                            </div>
                            <div>
                                <span class="label">ASIENTO</span>
                                <p class="val">${10 + client.id}A</p>
                            </div>
                            <div>
                                <span class="label">PUERTA</span>
                                <p class="val">B-${20 + client.id}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="ticket-footer">
                        <div class="barcode-container">
                            <div class="barcode"></div>
                            <span class="barcode-text">*${localizer}*</span>
                        </div>
                        <div class="legal-notice">
                            <p><strong>INFORMACIÓN DE EMBARQUE:</strong> Presentarse en el mostrador de Gysfly Travels 3 horas antes de la salida. La franquicia de equipaje de Business Class incluye 2 piezas de 32kg cada una y acceso gratuito a la sala Lounge VIP. Buen viaje.</p>
                        </div>
                    </div>
                `;
            } else if (isHotel) {
                title = `Voucher de Alojamiento VIP - ${client.name}`;
                badgeText = "BONO DE HOTEL EXCLUSIVO";
                contentHtml = `
                    <div class="ticket-header hotel-bg">
                        <div>
                            <h1 class="brand">GYSFLY TRAVELS</h1>
                            <p class="brand-sub">Luxury Resorts & Spas</p>
                        </div>
                        <div class="ticket-badge hotel-badge">${badgeText}</div>
                    </div>
                    
                    <div class="ticket-body">
                        <div class="grid-3">
                            <div>
                                <span class="label">TITULAR DE RESERVA</span>
                                <p class="val">${client.name}</p>
                            </div>
                            <div>
                                <span class="label">CÓDIGO DE RESERVA</span>
                                <p class="val">GYS-HOT-${300 + client.id}</p>
                            </div>
                            <div>
                                <span class="label">PRECIO VOUCHER</span>
                                <p class="val">${amount}</p>
                            </div>
                        </div>
                        
                        <div class="hotel-details-block">
                            <div class="flex items-center gap-3">
                                <span class="material-symbols-outlined text-[36px] text-gold" style="font-size:32px;">holiday_village</span>
                                <div>
                                    <h3 class="hotel-title">Luxury Water Villa Resort</h3>
                                    <p class="hotel-sub">${client.destination} — Ubicación Preferente Gysfly</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="grid-3 mt-6">
                            <div>
                                <span class="label">RÉGIMEN</span>
                                <p class="val">Todo Incluido Premium</p>
                            </div>
                            <div>
                                <span class="label">TIPO DE HABITACIÓN</span>
                                <p class="val">Villa sobre el Agua con Piscina Privada</p>
                            </div>
                            <div>
                                <span class="label">TRANSFER INCLUIDO</span>
                                <p class="val">Sí (Lancha Rápida VIP)</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="ticket-footer">
                        <div class="legal-notice" style="border-top: none; padding-top: 0;">
                            <p><strong>REGLAS DEL VOUCHER:</strong> Al llegar al establecimiento, presente este voucher impreso o en su dispositivo móvil junto con el pasaporte de los viajeros. La reserva incluye mayordomo las 24 horas y atenciones especiales Gysfly Platinum a la llegada.</p>
                        </div>
                    </div>
                `;
            } else {
                title = `Ficha Técnica de Viajero - ${client.name}`;
                badgeText = "FICHA TÉCNICA OFICIAL";
                contentHtml = `
                    <div class="ticket-header profile-bg">
                        <div>
                            <h1 class="brand">GYSFLY TRAVELS</h1>
                            <p class="brand-sub">Traveler Official Profile</p>
                        </div>
                        <div class="ticket-badge profile-badge">${badgeText}</div>
                    </div>
                    
                    <div class="ticket-body">
                        <div class="grid-3">
                            <div>
                                <span class="label">NOMBRE VIAJERO</span>
                                <p class="val">${client.name}</p>
                            </div>
                            <div>
                                <span class="label">TELÉFONO</span>
                                <p class="val">${client.phone}</p>
                            </div>
                            <div>
                                <span class="label">CORREO ELECTRÓNICO</span>
                                <p class="val">${client.email}</p>
                            </div>
                        </div>
                        
                        <div class="profile-info-block">
                            <h4 style="color: #ffffff; font-size: 13px; font-weight: bold; margin-bottom: 8px;">Detalles Generales del Cliente</h4>
                            <table class="profile-table">
                                <tr>
                                    <td><strong>País de Residencia:</strong></td>
                                    <td>${client.country || 'España'}</td>
                                    <td><strong>Código Postal:</strong></td>
                                    <td>${client.postal_code || '28001'}</td>
                                </tr>
                                <tr>
                                    <td><strong>Destino Favorito:</strong></td>
                                    <td>${client.destination || 'Bali'}</td>
                                    <td><strong>Estado del Viaje:</strong></td>
                                    <td>${client.status}</td>
                                </tr>
                                <tr>
                                    <td><strong>Gasto Acumulado:</strong></td>
                                    <td>${amount}</td>
                                    <td><strong>Costo de Proveedores:</strong></td>
                                    <td>$${(client.cost !== undefined ? client.cost : Math.round(client.volume * 0.7)).toLocaleString('en-US')} USD</td>
                                </tr>
                            </table>
                        </div>
                        
                        <div class="mt-6">
                            <span class="label">NOTAS DE LA AGENCIA</span>
                            <p class="val" style="font-weight: normal; font-size: 11px; color: #e2e8f0; line-height: 1.5; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); margin-top: 4px;">
                                ${client.notes || 'No se han registrado observaciones adicionales.'}
                            </p>
                        </div>
                    </div>
                    
                    <div class="ticket-footer">
                        <p style="font-size: 9px; color: rgba(255,255,255,0.4); text-align: center; width: 100%;">Gysfly Travels S.L. • Registro de Ficha técnica segura en local • Copia de seguridad encriptada</p>
                    </div>
                `;
            }
            
            // Write full HTML content to document preview popup window
            docWindow.document.write(`
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <title>${title}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Material+Symbols+Outlined&display=swap" rel="stylesheet">
                    <style>
                        * {
                            box-sizing: border-box;
                            margin: 0;
                            padding: 0;
                        }
                        body {
                            font-family: 'Outfit', sans-serif;
                            background-color: #0b0f17;
                            color: #ffffff;
                            padding: 40px 20px;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            min-height: 100vh;
                        }
                        .print-container {
                            background: linear-gradient(135deg, #131a26 0%, #0d131f 100%);
                            border: 1px solid rgba(197, 160, 89, 0.3);
                            border-radius: 24px;
                            width: 100%;
                            max-width: 700px;
                            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
                            overflow: hidden;
                            position: relative;
                        }
                        .controls {
                            display: flex;
                            gap: 12px;
                            margin-bottom: 24px;
                            width: 100%;
                            max-width: 700px;
                            justify-content: flex-end;
                        }
                        .btn {
                            padding: 10px 20px;
                            border-radius: 12px;
                            font-size: 12px;
                            font-weight: bold;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                            transition: all 0.2s;
                            border: none;
                        }
                        .btn-print {
                            background: linear-gradient(135deg, #c5a059 0%, #a37f37 100%);
                            color: #0b0f17;
                        }
                        .btn-print:hover {
                            opacity: 0.95;
                            transform: translateY(-1px);
                        }
                        .btn-close {
                            background: rgba(255, 255, 255, 0.08);
                            color: #ffffff;
                            border: 1px solid rgba(255, 255, 255, 0.12);
                        }
                        .btn-close:hover {
                            background: rgba(255, 255, 255, 0.15);
                        }
                        .ticket-header {
                            background: linear-gradient(90deg, #1a2333 0%, #151d2a 100%);
                            padding: 24px 32px;
                            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        }
                        .brand {
                            font-size: 22px;
                            font-weight: 700;
                            letter-spacing: 2px;
                            background: linear-gradient(135deg, #f5d085 0%, #c5a059 100%);
                            -webkit-background-clip: text;
                            -webkit-text-fill-color: transparent;
                        }
                        .brand-sub {
                            font-size: 9px;
                            text-transform: uppercase;
                            letter-spacing: 4px;
                            color: rgba(255, 255, 255, 0.4);
                            margin-top: 2px;
                        }
                        .ticket-badge {
                            font-size: 9px;
                            font-weight: 700;
                            letter-spacing: 1px;
                            padding: 6px 12px;
                            border-radius: 8px;
                            background: rgba(197, 160, 89, 0.15);
                            color: #f5d085;
                            border: 1px solid rgba(197, 160, 89, 0.3);
                        }
                        .hotel-bg {
                            background: linear-gradient(90deg, #0e271a 0%, #081d11 100%);
                        }
                        .hotel-badge {
                            background: rgba(16, 185, 129, 0.15);
                            color: #34d399;
                            border: 1px solid rgba(16, 185, 129, 0.3);
                        }
                        .profile-bg {
                            background: linear-gradient(90deg, #17253d 0%, #0f1a2e 100%);
                        }
                        .profile-badge {
                            background: rgba(59, 130, 246, 0.15);
                            color: #60a5fa;
                            border: 1px solid rgba(59, 130, 246, 0.3);
                        }
                        .ticket-body {
                            padding: 32px;
                        }
                        .grid-3 {
                            display: grid;
                            grid-template-columns: repeat(3, 1fr);
                            gap: 16px;
                        }
                        .grid-4 {
                            display: grid;
                            grid-template-columns: repeat(4, 1fr);
                            gap: 16px;
                        }
                        .label {
                            font-size: 8px;
                            text-transform: uppercase;
                            color: rgba(255, 255, 255, 0.4);
                            font-weight: 600;
                            letter-spacing: 1px;
                            display: block;
                        }
                        .val {
                            font-size: 13px;
                            font-weight: 600;
                            color: #ffffff;
                            margin-top: 4px;
                        }
                        .route-block {
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            margin-top: 28px;
                            padding: 20px;
                            background: rgba(255, 255, 255, 0.02);
                            border: 1px solid rgba(255, 255, 255, 0.04);
                            border-radius: 16px;
                        }
                        .route-city h3 {
                            font-size: 32px;
                            font-weight: 700;
                            letter-spacing: 1px;
                            color: #ffffff;
                        }
                        .route-city p {
                            font-size: 10px;
                            color: rgba(255, 255, 255, 0.5);
                            margin-top: 2px;
                        }
                        .route-arrow {
                            flex-grow: 1;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            position: relative;
                            margin: 0 20px;
                        }
                        .route-arrow .line {
                            height: 1px;
                            border-top: 1px dashed rgba(197, 160, 89, 0.4);
                            width: 100%;
                            position: absolute;
                            top: 50%;
                            z-index: 1;
                        }
                        .route-arrow span {
                            position: relative;
                            z-index: 2;
                            background: #111823;
                            padding: 0 8px;
                        }
                        .text-gold {
                            color: #f5d085;
                        }
                        .hotel-details-block {
                            margin-top: 28px;
                            padding: 20px;
                            background: rgba(16, 185, 129, 0.03);
                            border: 1px solid rgba(16, 185, 129, 0.08);
                            border-radius: 16px;
                        }
                        .hotel-title {
                            font-size: 18px;
                            font-weight: 700;
                            color: #ffffff;
                        }
                        .hotel-sub {
                            font-size: 11px;
                            color: rgba(255, 255, 255, 0.5);
                            margin-top: 2px;
                        }
                        .profile-info-block {
                            margin-top: 28px;
                            padding: 20px;
                            background: rgba(59, 130, 246, 0.03);
                            border: 1px solid rgba(59, 130, 246, 0.08);
                            border-radius: 16px;
                        }
                        .profile-table {
                            width: 100%;
                            border-collapse: collapse;
                            font-size: 11px;
                            color: rgba(255, 255, 255, 0.8);
                        }
                        .profile-table td {
                            padding: 6px 4px;
                        }
                        .ticket-footer {
                            background: rgba(0, 0, 0, 0.2);
                            padding: 24px 32px;
                            border-top: 1px solid rgba(255, 255, 255, 0.05);
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 16px;
                        }
                        .barcode-container {
                            text-align: center;
                        }
                        .barcode {
                            height: 45px;
                            width: 250px;
                            background: linear-gradient(90deg, 
                                #ffffff 0%, #ffffff 3%, 
                                #000000 3%, #000000 5%, 
                                #ffffff 5%, #ffffff 6%, 
                                #000000 6%, #000000 10%, 
                                #ffffff 10%, #ffffff 11%, 
                                #000000 11%, #000000 13%,
                                #ffffff 13%, #ffffff 16%,
                                #000000 16%, #000000 20%,
                                #ffffff 20%, #ffffff 23%,
                                #000000 23%, #000000 24%,
                                #ffffff 24%, #ffffff 28%,
                                #000000 28%, #000000 34%,
                                #ffffff 34%, #ffffff 37%,
                                #000000 37%, #000000 42%,
                                #ffffff 42%, #ffffff 45%,
                                #000000 45%, #000000 46%,
                                #ffffff 46%, #ffffff 50%,
                                #000000 50%, #000000 53%,
                                #ffffff 53%, #ffffff 55%,
                                #000000 55%, #000000 60%,
                                #ffffff 60%, #ffffff 63%,
                                #000000 63%, #000000 67%,
                                #ffffff 67%, #ffffff 69%,
                                #000000 69%, #000000 75%,
                                #ffffff 75%, #ffffff 78%,
                                #000000 78%, #000000 84%,
                                #ffffff 84%, #ffffff 87%,
                                #000000 87%, #000000 91%,
                                #ffffff 91%, #ffffff 94%,
                                #000000 94%, #000000 97%,
                                #ffffff 97%, #ffffff 100%
                            );
                            border-radius: 4px;
                        }
                        .barcode-text {
                            font-size: 9px;
                            color: rgba(255, 255, 255, 0.4);
                            letter-spacing: 4px;
                            margin-top: 6px;
                            display: block;
                        }
                        .legal-notice {
                            font-size: 9px;
                            color: rgba(255, 255, 255, 0.45);
                            text-align: justify;
                            line-height: 1.4;
                            border-top: 1px solid rgba(255, 255, 255, 0.05);
                            padding-top: 16px;
                        }
                        @media print {
                            body {
                                background-color: #ffffff !important;
                                color: #000000 !important;
                                padding: 0 !important;
                            }
                            .controls {
                                display: none !important;
                            }
                            .print-container {
                                border: none !important;
                                box-shadow: none !important;
                                max-width: 100% !important;
                                width: 100% !important;
                                background: #ffffff !important;
                                color: #000000 !important;
                            }
                            .ticket-header {
                                background: #f3f4f6 !important;
                                border-bottom: 2px solid #000000 !important;
                            }
                            .brand {
                                -webkit-text-fill-color: #000000 !important;
                                color: #000000 !important;
                            }
                            .brand-sub {
                                color: #4b5563 !important;
                            }
                            .ticket-badge {
                                background: #ffffff !important;
                                color: #000000 !important;
                                border: 1.5px solid #000000 !important;
                            }
                            .label {
                                color: #4b5563 !important;
                            }
                            .val {
                                color: #000000 !important;
                            }
                            .route-block {
                                background: #f9fafb !important;
                                border: 1px solid #e5e7eb !important;
                            }
                            .route-city h3, .route-city p {
                                color: #000000 !important;
                            }
                            .route-arrow span {
                                background: #ffffff !important;
                                color: #000000 !important;
                            }
                            .hotel-details-block {
                                background: #f9fafb !important;
                                border: 1px solid #e5e7eb !important;
                            }
                            .hotel-title, .hotel-sub {
                                color: #000000 !important;
                            }
                            .profile-info-block {
                                background: #f9fafb !important;
                                border: 1px solid #e5e7eb !important;
                            }
                            .profile-table {
                                color: #000000 !important;
                            }
                            .barcode {
                                background: #000000 !important;
                                filter: invert(0) !important;
                            }
                            .barcode-text {
                                color: #000000 !important;
                            }
                            .legal-notice {
                                color: #4b5563 !important;
                                border-top: 1px solid #e5e7eb !important;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="controls">
                        <button onclick="window.print()" class="btn btn-print">
                            <span class="material-symbols-outlined text-[14px]">print</span>
                            <span>Imprimir / Guardar PDF</span>
                        </button>
                        <button onclick="window.close()" class="btn btn-close">
                            <span class="material-symbols-outlined text-[14px]">close</span>
                            <span>Cerrar Vista</span>
                        </button>
                    </div>
                    
                    <div class="print-container">
                        ${contentHtml}
                    </div>
                    <script>
                        setTimeout(() => { window.print(); }, 450);
                    