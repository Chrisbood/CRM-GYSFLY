


      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "background-base": "#040815",
              "surface-card": "#0A1128",
              "border-muted": "#1E293B",
              "glass-stroke": "rgba(255, 255, 255, 0.05)",
              "primary": "#0D9488", // Ocean Teal
              "primary-g": "#0284C7", // Sky Blue
              "success": "#10B981", // Palm Green
              "warning": "#F59E0B", // Sun Amber
              "danger": "#EF4444",
              "gold": "#D4AF37",    // Imperial Gold
              "gold-g": "#AA7C11",  // Satin Gold
              "on-surface": "#F1F5F9",
              "on-surface-variant": "#94A3B8",
              "surface-container-low": "#060D22"
            },
            fontFamily: {
              sans: ["Outfit", "sans-serif"]
            }
          }
        }
      }
    

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
            // Schema Auto-Upgrade Hook
            let needsUpgrade = false;
            if (localStorage.getItem('gysfly_clients')) {
                try {
                    const parsed = JSON.parse(localStorage.getItem('gysfly_clients'));
                    if (Array.isArray(parsed)) {
                        needsUpgrade = parsed.some(c => !c.passengers || !c.services || !c.start_date || !c.end_date);
                    } else {
                        needsUpgrade = true;
                    }
                } catch(e) {
                    needsUpgrade = true;
                }
            }
            if (needsUpgrade) {
                localStorage.removeItem('gysfly_clients');
            }

            // 1. Clientes (with Notes & Tags & File systems & Rooming & Services)
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
                        start_date: '2026-06-01',
                        end_date: '2026-06-10',
                        tags: ['VIP', 'Playa', 'Business'],
                        notes: 'Viajero VIP preferente. Solicita villas frente al mar con piscina infinity y chofer privado en Bali. Vuelos emitidos en clase Business.',
                        files: [
                            { name: 'Itinerario_Bali_VIP_Duran.pdf', size: '2.4 MB', date: '12/05/2026' },
                            { name: 'Billete_Iberia_Business.pdf', size: '1.8 MB', date: '12/05/2026' }
                        ],
                        passengers: [
                            { name: 'Christian Durán', type: 'Adulto', passport: 'SP123456', birthdate: '1988-04-12' }
                        ],
                        services: [
                            { id: 1, day: 1, type: 'Vuelo', supplier: 'Iberia', pnr: 'IB745A', cost: 1200, sale: 1500 },
                            { id: 2, day: 1, type: 'Traslado', supplier: 'Bali VIP Transfer', pnr: 'TR-BALI-01', cost: 150, sale: 250 },
                            { id: 3, day: 1, type: 'Hotel', supplier: 'Mandapa Ritz-Carlton', pnr: 'RC-99812', cost: 2045, sale: 3100 }
                        ],
                        itinerary: [
                            { day: 1, title: 'Llegada VIP a Seminyak', activity: 'Recibimiento en pista por escolta privada de Gysfly, traslado en Rolls-Royce Phantom a tu villa de lujo frente al mar en Seminyak. Cóctel de bienvenida de autor y cena privada.' },
                            { day: 2, title: 'Templos Ancestrales y Atardecer en Yate', activity: 'Visita privada guiada al Templo de Uluwatu sin colas. Por la tarde, crucero privado en yate de 50 pies para ver la puesta de sol con chef a bordo y degustación de mariscos.' },
                            { day: 3, title: 'Aventura en Ubud y Masaje Balinés', activity: 'Vuelo en helicóptero privado sobre los campos de arroz de Ubud. Masaje tradicional balinés de 4 manos de 120 minutos en el galardonado Spa Mandapa Ritz-Carlton.' }
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
                        start_date: '2026-07-15',
                        end_date: '2026-07-22',
                        tags: ['Luna de Miel', 'Europa'],
                        notes: 'Viaje de aniversario en suite de lujo con vistas a la Torre Eiffel. Confirmadas entradas exclusivas sin colas para el Museo del Louvre.',
                        files: [
                            { name: 'Voucher_Hotel_Le_Bristol.pdf', size: '890 KB', date: '15/05/2026' }
                        ],
                        passengers: [
                            { name: 'Laura Mendoza', type: 'Adulto', passport: 'MX987654', birthdate: '1991-09-20' },
                            { name: 'Santiago Mendoza', type: 'Adulto', passport: 'MX112233', birthdate: '1990-01-15' }
                        ],
                        services: [
                            { id: 1, day: 1, type: 'Hotel', supplier: 'Hotel Le Bristol Paris', pnr: 'LB-90082', cost: 1800, sale: 2500 },
                            { id: 2, day: 2, type: 'Actividad', supplier: 'Louvre VIP Tours', pnr: 'LVR-782', cost: 440, sale: 700 }
                        ],
                        itinerary: [
                            { day: 1, title: 'Noche Privada en el Louvre y Suite Ritz', activity: 'Llegada y check-in en la Suite Impériale del Hôtel Ritz París. Apertura especial del Museo del Louvre a puerta cerrada de noche exclusivamente para ti.' },
                            { day: 2, title: 'Helicóptero a Versalles y Alta Costura', activity: 'Sobrevuelo en helicóptero privado hacia el Palacio de Versalles con acceso exclusivo a los aposentos privados de María Antonieta. Sesión de compras privada en Chanel.' },
                            { day: 3, title: 'Cena de Gala en la Torre Eiffel', activity: 'Mesa presidencial exclusiva en el restaurante Le Jules Verne en la Torre Eiffel con menú degustación creado por chef Michelin y maridaje de añadas históricas.' }
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
                        start_date: '2026-09-05',
                        end_date: '2026-09-15',
                        tags: ['Exótico', 'Alerta Visa'],
                        notes: 'Interesado en un resort Overwater Bungalow de 5 estrellas todo incluido en Maldivas. Alerta: Pendiente confirmar trámite de visado de escala en EE.UU.',
                        files: [
                            { name: 'Propuesta_Maldivas_Resort.pdf', size: '3.4 MB', date: '10/05/2026' }
                        ],
                        passengers: [
                            { name: 'Carlos Gómez', type: 'Adulto', passport: 'CO555444', birthdate: '1985-11-30' }
                        ],
                        services: [
                            { id: 1, day: 1, type: 'Hotel', supplier: 'Soneva Jani Maldives', pnr: 'SJ-77621', cost: 3500, sale: 5000 },
                            { id: 2, day: 1, type: 'Vuelo', supplier: 'Qatar Airways', pnr: 'QR-8821', cost: 1190, sale: 1700 }
                        ],
                        itinerary: [
                            { day: 1, title: 'Hidroavión Privado y Villa sobre el Agua', activity: 'Vuelo privado en hidroavión a tu Resort de 6 estrellas Soneva Jani. Alojamiento en una Water Retreat Villa con tobogán privado directo al océano turquesa.' },
                            { day: 2, title: 'Picnic en Banco de Arena Privado', activity: 'Traslado en lancha rápida a un banco de arena deshabitado reservado exclusivamente para ti. Almuerzo gourmet con champán Dom Pérignon servido por tu mayordomo.' },
                            { day: 3, title: 'Buceo con Mantarrayas y Cena Submarina', activity: 'Inmersión privada de snorkel para nadar con mantarrayas gigantes de arrecife. Por la noche, cena degustación de 7 platos bajo el agua en el restaurante Ithaa.' }
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
                        start_date: '',
                        end_date: '',
                        tags: ['Asia', 'Primavera'],
                        notes: 'Cliente potencial que cotizó viaje a Japón en temporada de cerezos en flor. Sin reservas activas de momento.',
                        files: [],
                        passengers: [
                            { name: 'Sofía Reyes', type: 'Adulto', passport: 'AR888999', birthdate: '1995-07-04' }
                        ],
                        services: [],
                        itinerary: []
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
            if (activeDbView === 'kanban') {
                renderClientsKanban();
            } else {
                renderClientsDatabase();
            }

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
                    const companionCount = c.passengers ? c.passengers.length : 1;
                    
                    dbList.innerHTML += `
                        <tr onclick="openClientProfileModal(${c.id})" class="hover:bg-surface-variant/10 transition-colors cursor-pointer group border-b border-glass-stroke/30">
                            <!-- Cliente / Pax -->
                            <td class="px-6 py-4 flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-primary/25 text-primary flex items-center justify-center font-bold text-[12px] flex-shrink-0">
                                    ${c.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <div class="flex items-center gap-2">
                                        <p class="font-semibold text-white text-xs group-hover:text-primary transition-colors">${escapeHtml(c.name)}</p>
                                        <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold">${companionCount} Pax</span>
                                    </div>
                                    <p class="text-[9px] text-on-surface-variant/60">ID: GYS-${1000 + c.id}</p>
                                </div>
                            </td>
                            <!-- Contacto Directo -->
                            <td class="px-6 py-4 text-on-surface-variant">
                                ${escapeHtml(c.email)}<br>
                                <span class="text-[10px] opacity-75">${escapeHtml(c.phone)}</span><br>
                                <span class="text-[9px] opacity-40">${escapeHtml(c.country || 'España')} (${escapeHtml(c.postal_code || '28001')})</span>
                            </td>
                            <!-- Fechas de Viaje -->
                            <td class="px-6 py-4 text-on-surface-variant font-medium">
                                ${formatDateRange(c.start_date, c.end_date)}
                            </td>
                            <!-- Destino -->
                            <td class="px-6 py-4 text-white font-bold text-xs">
                                ${escapeHtml(c.destination || 'Bali')}
                            </td>
                            <!-- Rentabilidad / Margen -->
                            <td class="px-6 py-4">
                                <div class="flex flex-col text-[11px] max-w-[150px]">
                                    <div class="flex justify-between items-center gap-2">
                                        <span class="text-on-surface-variant/50">Venta:</span>
                                        <span class="font-bold text-white font-mono">${formatDollars(c.volume)}</span>
                                    </div>
                                    <div class="flex justify-between items-center gap-2">
                                        <span class="text-on-surface-variant/50">Costo:</span>
                                        <span class="text-on-surface-variant/80 font-mono">${formatDollars(c.cost || 0)}</span>
                                    </div>
                                    <div class="flex justify-between items-center gap-2 border-t border-glass-stroke/10 pt-0.5 mt-0.5">
                                        <span class="text-on-surface-variant/50">Margen:</span>
                                        <span class="font-bold font-mono ${c.volume - (c.cost || 0) >= 0 ? 'text-success' : 'text-danger'}">
                                            ${(c.volume > 0 ? ((c.volume - (c.cost || 0)) / c.volume * 100) : 0).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <!-- Estado -->
                            <td class="px-6 py-4">
                                <span class="${badgeColor} text-[10px] font-bold px-2.5 py-1 rounded-full border">${c.status}</span>
                            </td>
                            <!-- Acciones -->
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
            if (activeDbView === 'kanban') {
                renderClientsKanban();
            } else {
                renderClientsDatabase();
            }
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
            
            if (activeDbView === 'kanban') {
                renderClientsKanban();
            } else {
                renderClientsDatabase();
            }
        }

        let activeDbView = 'table';
        
        function setDbView(view) {
            activeDbView = view;
            const btnTable = document.getElementById('btn-db-view-table');
            const btnKanban = document.getElementById('btn-db-view-kanban');
            const tableContainer = document.getElementById('clients-table-container');
            const kanbanContainer = document.getElementById('clients-kanban-container');
            
            if (view === 'table') {
                btnTable.className = 'px-3.5 py-1.5 text-xs font-bold bg-primary text-white rounded-lg flex items-center gap-1.5 transition-all shadow-md';
                btnKanban.className = 'px-3.5 py-1.5 text-xs font-bold text-on-surface-variant hover:text-white rounded-lg flex items-center gap-1.5 transition-all';
                tableContainer.classList.remove('hidden');
                kanbanContainer.classList.add('hidden');
                renderClientsDatabase();
            } else {
                btnKanban.className = 'px-3.5 py-1.5 text-xs font-bold bg-primary text-white rounded-lg flex items-center gap-1.5 transition-all shadow-md';
                btnTable.className = 'px-3.5 py-1.5 text-xs font-bold text-on-surface-variant hover:text-white rounded-lg flex items-center gap-1.5 transition-all';
                tableContainer.classList.add('hidden');
                kanbanContainer.classList.remove('hidden');
                renderClientsKanban();
            }
        }
        
        function renderClientsKanban() {
            const container = document.getElementById('clients-kanban-container');
            container.innerHTML = '';
            
            const stages = [
                { key: 'Inactivo', label: 'Prospecto (Lead)' },
                { key: 'Cotización Pendiente', label: 'Propuesta de Viaje' },
                { key: 'Reserva Confirmada', label: 'Reserva Confirmada' },
                { key: 'Viaje Activo', label: 'De Viaje (On Trip)' },
                { key: 'Completado', label: 'Completado' }
            ];
            
            let filtered = clients;
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
            
            stages.forEach((stage, sIdx) => {
                const stageClients = filtered.filter(c => c.status === stage.key);
                const stageCount = stageClients.length;
                const stageVolume = stageClients.reduce((sum, c) => sum + (c.volume || 0), 0);
                
                let cardsHtml = '';
                if (stageCount === 0) {
                    cardsHtml = `
                        <div class="flex flex-col items-center justify-center p-6 border border-dashed border-glass-stroke/30 rounded-2xl text-center text-on-surface-variant/40 py-10">
                            <span class="material-symbols-outlined text-[20px] opacity-40">drag_indicator</span>
                            <p class="text-[10px] mt-1">Sin viajeros</p>
                        </div>
                    `;
                } else {
                    stageClients.forEach(c => {
                        const companionCount = c.passengers ? c.passengers.length : 1;
                        const dateText = formatDateRange(c.start_date, c.end_date);
                        
                        cardsHtml += `
                            <div class="glass-card hover:border-[#D4AF37]/40 p-4 rounded-xl space-y-3 transition-all duration-300 relative group cursor-pointer" onclick="openClientProfileModal(${c.id})">
                                <div class="flex justify-between items-center text-[9px]">
                                    <span class="text-on-surface-variant/60 font-mono">ID: GYS-${1000 + c.id}</span>
                                    <span class="px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded font-bold">${companionCount} Pax</span>
                                </div>
                                
                                <div>
                                    <h5 class="text-xs font-bold text-white group-hover:text-primary transition-colors truncate max-w-[170px]">${escapeHtml(c.name)}</h5>
                                    <p class="text-[10px] text-[#D4AF37] font-semibold mt-0.5 flex items-center gap-1">
                                        <span class="material-symbols-outlined text-[10px]">flight_takeoff</span>
                                        <span>${escapeHtml(c.destination || 'Bali')}</span>
                                    </p>
                                </div>
                                
                                <div class="text-[9px] text-on-surface-variant/70 space-y-1">
                                    <p class="flex items-center gap-1">
                                        <span class="material-symbols-outlined text-[9px]">calendar_month</span>
                                        <span>${dateText}</span>
                                    </p>
                                    <p class="flex items-center gap-1 font-bold text-white font-mono text-[10px] pt-1">
                                        <span class="material-symbols-outlined text-[10px] text-success">monetization_on</span>
                                        <span>${formatDollars(c.volume || 0)}</span>
                                    </p>
                                </div>
                                
                                <div class="flex gap-2 justify-end border-t border-glass-stroke/10 pt-2 mt-1" onclick="event.stopPropagation()">
                                    ${sIdx > 0 ? `
                                        <button onclick="shiftClientStage(${c.id}, -1)" class="w-6 h-6 rounded bg-surface-container-low hover:bg-primary/20 text-on-surface-variant hover:text-white flex items-center justify-center transition-all" title="Mover a: ${stages[sIdx-1].label}">
                                            <span class="material-symbols-outlined text-[14px]">arrow_back</span>
                                        </button>
                                    ` : `
                                        <div class="w-6 h-6"></div>
                                    `}
                                    ${sIdx < stages.length - 1 ? `
                                        <button onclick="shiftClientStage(${c.id}, 1)" class="w-6 h-6 rounded bg-surface-container-low hover:bg-primary/20 text-on-surface-variant hover:text-white flex items-center justify-center transition-all" title="Mover a: ${stages[sIdx+1].label}">
                                            <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                                        </button>
                                    ` : `
                                        <div class="w-6 h-6"></div>
                                    `}
                                </div>
                            </div>
                        `;
                    });
                }
                
                container.innerHTML += `
                    <div class="flex flex-col bg-surface-container-low/20 border border-glass-stroke/50 rounded-2xl p-4 min-w-[240px] max-w-[280px] flex-1">
                        <div class="flex flex-col border-b border-glass-stroke/40 pb-3 mb-4 flex-shrink-0">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-bold text-white uppercase tracking-wider">${stage.label}</span>
                                <span class="px-2 py-0.5 rounded bg-white/5 border border-glass-stroke text-[10px] font-bold text-white">${stageCount}</span>
                            </div>
                            <div class="flex items-center justify-between mt-1 text-[9px]">
                                <span class="text-on-surface-variant/50">Total acumulado:</span>
                                <span class="text-[#D4AF37] font-bold font-mono">${formatDollars(stageVolume)}</span>
                            </div>
                        </div>
                        
                        <div class="space-y-3 flex-1 overflow-y-auto max-h-[500px] custom-scrollbar pr-1">
                            ${cardsHtml}
                        </div>
                    </div>
                `;
            });
        }
        
        function shiftClientStage(clientId, direction) {
            const client = clients.find(c => c.id === clientId);
            if (!client) return;
            
            const stages = ['Inactivo', 'Cotización Pendiente', 'Reserva Confirmada', 'Viaje Activo', 'Completado'];
            const currentIdx = stages.indexOf(client.status);
            
            if (currentIdx !== -1) {
                const nextIdx = currentIdx + direction;
                if (nextIdx >= 0 && nextIdx < stages.length) {
                    client.status = stages[nextIdx];
                    saveDatabase();
                    showNotification('Fase Actualizada', `"${client.name}" se movió a "${stages[nextIdx]}".`, 'success');
                    
                    renderClientsDatabase();
                    if (activeDbView === 'kanban') {
                        renderClientsKanban();
                    }
                    updateCharts();
                }
            }
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
                // Initialize arrays if not present
                client.itinerary = client.itinerary || [];
                client.passengers = client.passengers || [];
                client.services = client.services || [];
                
                // Modal Header
                document.getElementById('profile-name-header').innerText = client.name;
                document.getElementById('profile-id').innerText = `ID: GYS-${1000 + client.id}`;
                document.getElementById('profile-email').innerText = client.email;
                document.getElementById('profile-email').onclick = () => { closeClientProfileModal(); openEmailModal(client.email); };
                document.getElementById('profile-phone').innerText = client.phone;
                document.getElementById('profile-demographics').innerText = `${client.country || 'España'} (${client.postal_code || '28001'})`;
                document.getElementById('profile-destination').innerText = client.destination || 'Bali';
                document.getElementById('profile-volume').innerText = formatDollars(client.volume);
                document.getElementById('profile-notes-textarea').value = client.notes || '';
                
                // Form Inputs population
                document.getElementById('profile-field-name').value = client.name || '';
                document.getElementById('profile-field-email').value = client.email || '';
                document.getElementById('profile-field-phone').value = client.phone || '';
                document.getElementById('profile-field-destination').value = client.destination || '';
                document.getElementById('profile-field-start').value = client.start_date || '';
                document.getElementById('profile-field-end').value = client.end_date || '';
                document.getElementById('profile-field-country').value = client.country || '';
                document.getElementById('profile-field-zip').value = client.postal_code || '';
                document.getElementById('profile-field-status').value = client.status || 'Inactivo';
                
                // Recalculate and populate Bento box contabilidad
                recalculateClientBudget(client.id);
                
                // Render Avatar letters
                document.getElementById('profile-avatar').innerText = client.name.split(' ').map(n => n[0]).join('');

                // Status badge
                const statusBadge = document.getElementById('profile-status');
                statusBadge.innerText = client.status === 'Inactivo' ? 'Prospecto (Lead)' : client.status === 'Cotización Pendiente' ? 'Propuesta de Viaje' : client.status === 'Reserva Confirmada' ? 'Reserva Confirmada' : client.status === 'Viaje Activo' ? 'De Viaje (On Trip)' : client.status;
                statusBadge.className = 'px-2 py-0.5 rounded-full text-[9px] font-bold ' + getStatusBadgeClass(client.status);
                
                // Footer buttons binding
                document.getElementById('profile-email-btn').onclick = () => { closeClientProfileModal(); openEmailModal(client.email); };
                document.getElementById('profile-traffic-btn').onclick = () => { closeClientProfileModal(); openTransferModal(client.id); };
                document.getElementById('profile-delete-btn').onclick = () => {
                    closeClientProfileModal();
                    deleteClient(client.id);
                };

                // Render lists
                renderProfilePassengers(client);
                renderProfileServices(client);
                renderProfileFiles(client);
                
                // Reset active tab to Services Builder (the primary operation)
                switchProfileTab('services');

                document.getElementById('modal-client-profile').classList.remove('hidden');
                document.getElementById('modal-client-profile').classList.add('flex');
            }
        }

        function closeClientProfileModal() {
            document.getElementById('modal-client-profile').classList.add('hidden');
            document.getElementById('modal-client-profile').classList.remove('flex');
            currentProfileClientId = null;
        }

        // Tab switching within the detailed profile modal
        function switchProfileTab(tabName) {
            const tabs = ['services', 'itinerary', 'proposal', 'docs'];
            
            tabs.forEach(t => {
                const btn = document.getElementById(`tab-btn-${t}`);
                const pane = document.getElementById(`profile-tab-${t}`);
                
                if (btn && pane) {
                    if (t === tabName) {
                        btn.className = "pb-2 text-xs font-bold text-white border-b-2 border-primary transition-all flex items-center gap-1.5 flex-shrink-0";
                        pane.classList.remove('hidden');
                    } else {
                        btn.className = "pb-2 text-xs font-bold text-on-surface-variant/60 hover:text-white border-b-2 border-transparent transition-all flex items-center gap-1.5 flex-shrink-0";
                        pane.classList.add('hidden');
                    }
                }
            });
            
            const client = clients.find(c => c.id === currentProfileClientId);
            if (client) {
                if (tabName === 'itinerary') {
                    client.itinerary = client.itinerary || [];
                    renderProfileItinerary(client);
                } else if (tabName === 'services') {
                    renderProfileServices(client);
                } else if (tabName === 'proposal') {
                    renderProposalPreview(client);
                } else if (tabName === 'docs') {
                    renderProfileFiles(client);
                }
            }
        }

        // --- COMPANION travelers (ROOMING LIST) CONTROLLER ---
        function renderProfilePassengers(client) {
            const list = document.getElementById('profile-passengers-list');
            list.innerHTML = '';
            
            const passengers = client.passengers || [];
            document.getElementById('profile-passengers-count').innerText = `${passengers.length} Pax`;
            
            if(passengers.length === 0) {
                list.innerHTML = `
                    <tr>
                        <td colspan="4" class="py-3 text-center text-on-surface-variant/40 italic">
                            Lista vacía
                        </td>
                    </tr>
                `;
                return;
            }
            
            passengers.forEach((p, idx) => {
                list.innerHTML += `
                    <tr class="border-b border-glass-stroke/10 text-[10px] text-white">
                        <td class="py-1.5 font-medium max-w-[120px] truncate">${escapeHtml(p.name)}</td>
                        <td class="py-1.5"><span class="px-1 py-0.5 rounded bg-white/5 border border-glass-stroke/40">${escapeHtml(p.type)}</span></td>
                        <td class="py-1.5 font-mono">${escapeHtml(p.passport || '-')}</td>
                        <td class="py-1.5 text-right">
                            <button onclick="deletePassengerFromProfile(${idx})" class="text-danger hover:text-white p-0.5" title="Eliminar acompañante">
                                <span class="material-symbols-outlined text-[13px]">close</span>
                            </button>
                        </td>
                    </tr>
                `;
            });
        }

        function addPassengerToProfile() {
            const client = clients.find(c => c.id === currentProfileClientId);
            if(client) {
                const nameInput = document.getElementById('new-passenger-name');
                const typeInput = document.getElementById('new-passenger-type');
                const passportInput = document.getElementById('new-passenger-passport');
                const birthdateInput = document.getElementById('new-passenger-birthdate');
                
                const name = nameInput.value.trim();
                const type = typeInput.value;
                const passport = passportInput.value.trim();
                const birthdate = birthdateInput.value;
                
                if(!name) {
                    showNotification('Dato requerido', 'Por favor introduce el nombre del pasajero.', 'warning');
                    return;
                }
                
                client.passengers = client.passengers || [];
                client.passengers.push({ name, type, passport, birthdate });
                
                saveDatabase();
                renderProfilePassengers(client);
                renderClientsDatabase();
                if (typeof renderClientsKanban === 'function' && !document.getElementById('clients-kanban-container').classList.contains('hidden')) {
                    renderClientsKanban();
                }
                
                // Clear fields
                nameInput.value = '';
                passportInput.value = '';
                birthdateInput.value = '';
                
                showNotification('Pasajero Agregado', 'Acompañante registrado en la Rooming List.', 'success');
            }
        }

        function deletePassengerFromProfile(idx) {
            const client = clients.find(c => c.id === currentProfileClientId);
            if(client && client.passengers) {
                client.passengers.splice(idx, 1);
                saveDatabase();
                renderProfilePassengers(client);
                renderClientsDatabase();
                if (typeof renderClientsKanban === 'function' && !document.getElementById('clients-kanban-container').classList.contains('hidden')) {
                    renderClientsKanban();
                }
                showNotification('Pasajero Quitado', 'Se ha retirado de la Rooming List.', 'warning');
            }
        }

        // --- TRAVEL DETAILS PROFILE AUTO-SAVE CONTROLLER ---
        function updateProfileField(field, value) {
            const client = clients.find(c => c.id === currentProfileClientId);
            if(client) {
                client[field] = value;
                
                // Dynamic UI updates inside modal
                if(field === 'status') {
                    const statusBadge = document.getElementById('profile-status');
                    if (statusBadge) {
                        statusBadge.innerText = value === 'Inactivo' ? 'Prospecto (Lead)' : value === 'Cotización Pendiente' ? 'Propuesta de Viaje' : value === 'Reserva Confirmada' ? 'Reserva Confirmada' : value === 'Viaje Activo' ? 'De Viaje (On Trip)' : value;
                        statusBadge.className = 'px-2 py-0.5 rounded-full text-[9px] font-bold ' + getStatusBadgeClass(value);
                    }
                }
                if(field === 'name') {
                    document.getElementById('profile-name-header').innerText = value;
                    document.getElementById('profile-avatar').innerText = value.split(' ').map(n => n[0]).join('');
                }
                if(field === 'email') {
                    document.getElementById('profile-email').innerText = value;
                }
                if(field === 'phone') {
                    document.getElementById('profile-phone').innerText = value;
                }
                if(field === 'country' || field === 'postal_code') {
                    const country = document.getElementById('profile-field-country').value || '';
                    const zip = document.getElementById('profile-field-zip').value || '';
                    document.getElementById('profile-demographics').innerText = `${country} (${zip})`;
                }
                if(field === 'destination') {
                    document.getElementById('profile-destination').innerText = value;
                }
                
                saveDatabase();
                
                // Re-render core views
                renderClientsDatabase();
                if (typeof renderClientsKanban === 'function' && !document.getElementById('clients-kanban-container').classList.contains('hidden')) {
                    renderClientsKanban();
                }
            }
        }

        // --- constructor DE servicios (SERVICES BUILDER) CONTROLLER ---
        function renderProfileServices(client) {
            const list = document.getElementById('profile-services-list');
            list.innerHTML = '';
            
            const services = client.services || [];
            
            if (services.length === 0) {
                list.innerHTML = `
                    <tr>
                        <td colspan="7" class="py-4 text-center text-on-surface-variant/40 italic">
                            Sin servicios registrados en el presupuesto. Registra uno abajo.
                        </td>
                    </tr>
                `;
                return;
            }
            
            const sorted = [...services].sort((a, b) => (a.day || 1) - (b.day || 1));
            
            sorted.forEach(s => {
                list.innerHTML += `
                    <tr class="border-b border-glass-stroke/10 text-[10px] text-white hover:bg-white/5 transition-colors">
                        <td class="py-2 pl-1">Día ${s.day || 1}</td>
                        <td class="py-2 font-medium">
                            <span class="px-1 py-0.5 rounded text-[8px] font-bold uppercase bg-primary/20 text-primary border border-primary/20">${escapeHtml(s.type)}</span>
                        </td>
                        <td class="py-2 truncate max-w-[100px]">${escapeHtml(s.supplier || '-')}</td>
                        <td class="py-2 font-mono text-[9px] truncate max-w-[80px]">${escapeHtml(s.pnr || '-')}</td>
                        <td class="py-2 text-right text-warning font-semibold pr-2">${formatDollars(s.cost || 0)}</td>
                        <td class="py-2 text-right text-success font-semibold pr-2">${formatDollars(s.sale || 0)}</td>
                        <td class="py-2 text-center">
                            <button onclick="deleteServiceFromProfile(${s.id})" class="text-danger hover:text-white p-0.5" title="Eliminar servicio">
                                <span class="material-symbols-outlined text-[13px]">delete</span>
                            </button>
                        </td>
                    </tr>
                `;
            });
        }

        function addServiceToProfile() {
            const client = clients.find(c => c.id === currentProfileClientId);
            if(client) {
                const dayInput = document.getElementById('new-service-day');
                const typeInput = document.getElementById('new-service-type');
                const supplierInput = document.getElementById('new-service-supplier');
                const pnrInput = document.getElementById('new-service-pnr');
                const costInput = document.getElementById('new-service-cost');
                const saleInput = document.getElementById('new-service-sale');
                
                const day = Number(dayInput.value || 1);
                const type = typeInput.value;
                const supplier = supplierInput.value.trim();
                const pnr = pnrInput.value.trim();
                const cost = Number(costInput.value || 0);
                const sale = Number(saleInput.value || 0);
                
                if(!supplier) {
                    showNotification('Dato requerido', 'Por favor introduce el proveedor del servicio.', 'warning');
                    return;
                }
                
                client.services = client.services || [];
                const nextId = client.services.length > 0 ? Math.max(...client.services.map(s => s.id || 0)) + 1 : 1;
                
                client.services.push({ id: nextId, day, type, supplier, pnr, cost, sale });
                
                recalculateClientBudget(client.id);
                renderProfileServices(client);
                
                // Reset form fields
                supplierInput.value = '';
                pnrInput.value = '';
                costInput.value = '0';
                saleInput.value = '0';
                
                showNotification('Servicio Agregado', 'Presupuesto y rentabilidad recalculados.', 'success');
            }
        }

        function deleteServiceFromProfile(serviceId) {
            const client = clients.find(c => c.id === currentProfileClientId);
            if(client && client.services) {
                client.services = client.services.filter(s => s.id !== serviceId);
                
                recalculateClientBudget(client.id);
                renderProfileServices(client);
                
                showNotification('Servicio Eliminado', 'Se ha retirado de la cotización.', 'warning');
            }
        }

        function recalculateClientBudget(clientId) {
            const client = clients.find(c => c.id === clientId);
            if(client) {
                client.services = client.services || [];
                let totalCost = 0;
                let totalSale = 0;
                client.services.forEach(s => {
                    totalCost += Number(s.cost || 0);
                    totalSale += Number(s.sale || 0);
                });
                
                // If services exist, update c.volume & c.cost to reflect services builder
                if (client.services.length > 0) {
                    client.volume = totalSale;
                    client.cost = totalCost;
                } else {
                    // Fallback to preserve seeded values or manual entry
                    client.cost = client.cost !== undefined ? client.cost : Math.round(client.volume * 0.7);
                    totalSale = client.volume || 0;
                    totalCost = client.cost;
                }
                
                const profit = totalSale - totalCost;
                const marginPercent = totalSale > 0 ? ((profit / totalSale) * 100).toFixed(0) : '0';
                
                saveDatabase();
                
                // Update Left Bento Box inside Modal in real-time
                if(currentProfileClientId === clientId) {
                    document.getElementById('profile-financial-volume').innerText = formatDollars(totalSale);
                    document.getElementById('profile-financial-cost').innerText = formatDollars(totalCost);
                    document.getElementById('profile-financial-profit').innerText = formatDollars(profit);
                    
                    const marginEl = document.getElementById('profile-financial-margin');
                    marginEl.innerText = `${marginPercent}% Margen`;
                    if(profit >= 0) {
                        marginEl.className = 'text-[9px] px-1.5 py-0.5 rounded bg-success/20 text-success border border-success/25 font-bold';
                    } else {
                        marginEl.className = 'text-[9px] px-1.5 py-0.5 rounded bg-danger/20 text-danger border border-danger/25 font-bold';
                    }
                    
                    document.getElementById('profile-volume').innerText = formatDollars(totalSale);
                }
                
                // Re-render core views
                renderClientsDatabase();
                if (typeof renderClientsKanban === 'function' && !document.getElementById('clients-kanban-container').classList.contains('hidden')) {
                    renderClientsKanban();
                }
            }
        }

        // --- B2C LUXURY PROPOSAL BROCHURE CONTROLLERS ---
        function renderProposalPreview(client) {
            const container = document.getElementById('brochure-preview-container');
            container.innerHTML = '';
            
            const passengers = client.passengers || [];
            const itinerary = client.itinerary || [];
            
            let itineraryHtml = '';
            if (itinerary.length === 0) {
                itineraryHtml = `
                    <div class="text-center py-6 text-[#D4AF37]/50 italic text-[11px]">
                        Itinerario no pre-generado todavía. Usa la pestaña "Itinerario de Lujo" para construirlo con la IA de Gysfly.
                    </div>
                `;
            } else {
                itinerary.forEach(day => {
                    itineraryHtml += `
                        <div class="border-l-2 border-[#D4AF37]/35 pl-4 pb-4 last:pb-0 relative">
                            <div class="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full bg-[#030712] border-2 border-[#D4AF37]"></div>
                            <h5 class="text-[11px] font-bold text-white uppercase tracking-wide">Día ${day.day}: ${escapeHtml(day.title)}</h5>
                            <p class="text-[10px] text-on-surface-variant/80 mt-1 leading-relaxed">${escapeHtml(day.activity)}</p>
                        </div>
                    `;
                });
            }
            
            let passengersHtml = '';
            if (passengers.length > 0) {
                passengersHtml = `
                    <div class="mt-4 pt-3 border-t border-glass-stroke/20">
                        <p class="text-[8px] text-[#D4AF37] font-bold uppercase tracking-wider mb-2">Compañeros de Viaje</p>
                        <div class="flex flex-wrap gap-2">
                            ${passengers.map(p => `
                                <span class="text-[9px] px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 rounded-full font-medium">${escapeHtml(p.name)} (${escapeHtml(p.type)})</span>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            
            const totalSale = client.volume || 0;
            
            container.innerHTML = `
                <div class="space-y-6 relative z-10 text-xs">
                    <!-- Luxury Watermark -->
                    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#D4AF37]/5 via-transparent to-transparent pointer-events-none"></div>
                    
                    <!-- Header Cover -->
                    <div class="text-center space-y-2 pb-5 border-b border-[#D4AF37]/20">
                        <span class="text-[10px] font-bold text-[#D4AF37] tracking-[0.25em] uppercase">Gysfly Travels Signature</span>
                        <h4 class="text-xl font-bold text-white tracking-wide uppercase">${escapeHtml(client.destination || 'Bali')}</h4>
                        <p class="text-[9px] text-[#D4AF37]/80 tracking-widest font-mono uppercase">
                            ${client.start_date ? formatDateFriendly(client.start_date) : '-'} ${client.end_date ? '• ' + formatDateFriendly(client.end_date) : ''}
                        </p>
                    </div>
                    
                    <!-- Welcome Letter -->
                    <div class="space-y-1">
                        <p class="text-[9px] text-on-surface-variant/50 uppercase tracking-wider">Diseñado exclusivamente para</p>
                        <p class="text-sm font-bold text-white">${escapeHtml(client.name)}</p>
                        <p class="text-[10px] text-on-surface-variant/80 leading-relaxed italic mt-2">
                            "Nos complace presentarle esta propuesta de viaje única y personalizada. Cada día ha sido curado prestando la máxima atención a los estándares internacionales de ultralujo para garantizar una experiencia sublime."
                        </p>
                    </div>
                    
                    <!-- Passenger summary -->
                    ${passengersHtml}
                    
                    <!-- Day-by-Day Timeline -->
                    <div class="space-y-4 pt-3 border-t border-glass-stroke/20">
                        <h5 class="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">Su Plan de Itinerario de Autor</h5>
                        <div class="space-y-4 mt-3">
                            ${itineraryHtml}
                        </div>
                    </div>
                    
                    <!-- Total Price Display (Luxury Catalog Style) -->
                    <div class="mt-6 p-4 bg-[#D4AF37]/5 border border-[#D4AF37]/35 rounded-2xl flex justify-between items-center">
                        <div>
                            <p class="text-[9px] text-[#D4AF37] font-bold uppercase tracking-wider">Tarifa del Paquete Exclusivo</p>
                            <p class="text-[8px] text-on-surface-variant/60">Servicios aéreos, hoteleros y traslados privados de lujo incluidos.</p>
                        </div>
                        <div class="text-right">
                            <p class="text-lg font-black text-white">${formatDollars(totalSale)}</p>
                            <p class="text-[8px] text-success uppercase font-semibold">Tarifa Garantizada</p>
                        </div>
                    </div>
                </div>
            `;
        }

        function formatDateFriendly(dateStr) {
            if(!dateStr) return '';
            const options = { day: 'numeric', month: 'short', year: 'numeric' };
            const date = new Date(dateStr + 'T00:00:00');
            return date.toLocaleDateString('es-ES', options);
        }

        function formatDateRange(start, end) {
            if(!start && !end) return '<span class="text-on-surface-variant/40 italic">Por definir</span>';
            if(!start) return formatDateFriendly(end);
            if(!end) return formatDateFriendly(start);
            
            const sDate = new Date(start + 'T00:00:00');
            const eDate = new Date(end + 'T00:00:00');
            
            const sDay = sDate.getDate();
            const sMonth = sDate.toLocaleDateString('es-ES', { month: 'short' });
            const sYear = sDate.getFullYear();
            
            const eDay = eDate.getDate();
            const eMonth = eDate.toLocaleDateString('es-ES', { month: 'short' });
            const eYear = eDate.getFullYear();
            
            if (sYear === eYear) {
                if (sMonth === eMonth) {
                    return `${sDay} - ${eDay} ${sMonth} ${sYear}`;
                }
                return `${sDay} ${sMonth} - ${eDay} ${eMonth} ${sYear}`;
            }
            return `${sDay} ${sMonth} ${sYear} - ${eDay} ${eMonth} ${eYear}`;
        }

        const itineraryPresets = {
            'bali': [
                { day: 1, title: 'Llegada VIP a Seminyak', activity: 'Recibimiento en pista por escolta privada de Gysfly, traslado en Rolls-Royce Phantom a tu villa de lujo frente al mar en Seminyak. Cóctel de bienvenida de autor y cena privada.' },
                { day: 2, title: 'Templos Ancestrales y Atardecer en Yate', activity: 'Visita privada guiada al Templo de Uluwatu sin colas. Por la tarde, crucero privado en yate de 50 pies para ver la puesta de sol con chef a bordo y degustación de mariscos.' },
                { day: 3, title: 'Aventura en Ubud y Masaje Balinés', activity: 'Vuelo en helicóptero privado sobre los campos de arroz de Ubud. Masaje tradicional balinés de 4 manos de 120 minutos en el galardonado Spa Mandapa Ritz-Carlton.' }
            ],
            'maldivas': [
                { day: 1, title: 'Hidroavión Privado y Villa sobre el Agua', activity: 'Vuelo privado en hidroavión a tu Resort de 6 estrellas Soneva Jani. Alojamiento en una Water Retreat Villa con tobogán privado directo al océano turquesa.' },
                { day: 2, title: 'Picnic en Banco de Arena Privado', activity: 'Traslado en lancha rápida a un banco de arena deshabitado reservado exclusivamente para ti. Almuerzo gourmet con champán Dom Pérignon servido por tu mayordomo.' },
                { day: 3, title: 'Buceo con Mantarrayas y Cena Submarina', activity: 'Inmersión privada de snorkel para nadar con mantarrayas gigantes de arrecife. Por la noche, cena degustación de 7 platos bajo el agua en el restaurante Ithaa.' }
            ],
            'parís': [
                { day: 1, title: 'Noche Privada en el Louvre y Suite Ritz', activity: 'Llegada y check-in en la Suite Impériale del Hôtel Ritz París. Apertura especial del Museo del Louvre a puerta cerrada de noche exclusivamente para ti.' },
                { day: 2, title: 'Helicóptero a Versalles y Alta Costura', activity: 'Sobrevuelo en helicóptero privado hacia el Palacio de Versalles con acceso exclusivo a los aposentos privados de María Antonieta. Sesión de compras privada en Chanel.' },
                { day: 3, title: 'Cena de Gala en la Torre Eiffel', activity: 'Mesa presidencial exclusiva en el restaurante Le Jules Verne en la Torre Eiffel con menú degustación creado por chef Michelin y maridaje de añadas históricas.' }
            ],
            'nueva york': [
                { day: 1, title: 'Ático en The Plaza y Broadway VIP', activity: 'Alojamiento en el ático de The Plaza Hotel. Limusina privada al Teatro Broadway para ver el show en asientos VIP de primera fila con acceso exclusivo al backstage.' },
                { day: 2, title: 'Vuelo en Helicóptero y Quinta Avenida', activity: 'Vuelo panorámico privado en helicóptero sobre Manhattan. Sesión de personal shopper exclusiva en las boutiques de lujo de la Quinta Avenida.' },
                { day: 3, title: 'Cena Privada 3 Estrellas Michelin', activity: 'Mesa del chef exclusiva en el restaurante de 3 estrellas Michelin Eleven Madison Park con menú personalizado.' }
            ]
        };

        function getGenericItinerary(dest) {
            return [
                { day: 1, title: `Llegada de Lujo a ${dest}`, activity: `Bienvenida premium con traslado VIP en transporte privado de alta gama a tu resort de cinco estrellas superior. Servicio de conserjería personalizada 24/7 disponible.` },
                { day: 2, title: 'Experiencia Exclusiva y Aventura de Autor', activity: 'Tour privado de día completo con guía experto local e itinerario hecho a medida. Acceso preferente sin esperas a las atracciones principales y almuerzo gourmet.' },
                { day: 3, title: 'Relajación de Élite y Cena de Gala', activity: 'Mañana libre para disfrutar de los servicios del exclusivo spa del hotel. Por la noche, cena gastronómica en restaurante galardonado con menú degustación y bodega selecta.' }
            ];
        }

        // Render the day-by-day list
        function renderProfileItinerary(client) {
            const list = document.getElementById('profile-itinerary-list');
            list.innerHTML = '';
            
            const itinerary = client.itinerary || [];
            
            if (itinerary.length === 0) {
                list.innerHTML = `
                    <div class="p-6 bg-surface-container-low/40 border border-glass-stroke/50 rounded-2xl text-center space-y-2 my-auto">
                        <span class="material-symbols-outlined text-on-surface-variant/40 text-[32px]">map</span>
                        <p class="text-xs text-white font-medium">Sin itinerario planificado</p>
                        <p class="text-[9px] text-on-surface-variant/60 max-w-sm mx-auto">Haz clic en "Pre-generar con IA Gysfly" para construir una propuesta instantánea basada en el destino favorito del cliente (${client.destination || 'Bali'}).</p>
                    </div>
                `;
                return;
            }

            itinerary.forEach((item, idx) => {
                const dayDiv = document.createElement('div');
                dayDiv.className = "p-3.5 bg-surface-container-low/55 border border-glass-stroke rounded-2xl space-y-2.5 relative";
                dayDiv.innerHTML = `
                    <div class="flex justify-between items-center gap-2">
                        <div class="flex items-center gap-2">
                            <span class="w-5 h-5 rounded bg-primary/20 border border-primary/35 text-primary text-[10px] font-bold flex items-center justify-center">D${item.day}</span>
                            <input type="text" value="${escapeHtml(item.title)}" onchange="updateItineraryDay(${client.id}, ${idx}, 'title', this.value)" class="bg-transparent border-b border-transparent focus:border-primary/50 text-[11px] font-bold text-white w-56 px-1 py-0.5 focus:outline-none" placeholder="Título del Día"/>
                        </div>
                        <button onclick="deleteItineraryDay(${client.id}, ${idx})" class="text-danger hover:text-white p-1 text-[11px]" title="Eliminar Día">
                            <span class="material-symbols-outlined text-[15px]">delete</span>
                        </button>
                    </div>
                    <textarea onchange="updateItineraryDay(${client.id}, ${idx}, 'activity', this.value)" class="w-full bg-black/20 border border-glass-stroke/60 focus:border-primary/50 rounded-xl p-2 text-[10px] text-on-surface-variant/90 focus:outline-none custom-scrollbar focus:ring-1 focus:ring-primary/20" rows="2" placeholder="Describe las actividades, hoteles, transfers o eventos privados...">${escapeHtml(item.activity)}</textarea>
                `;
                list.appendChild(dayDiv);
            });
        }

        function updateItineraryDay(clientId, idx, field, value) {
            const client = clients.find(c => c.id === clientId);
            if(client && client.itinerary && client.itinerary[idx]) {
                client.itinerary[idx][field] = value;
                saveDatabase();
            }
        }

        function deleteItineraryDay(clientId, idx) {
            const client = clients.find(c => c.id === clientId);
            if(client && client.itinerary) {
                client.itinerary.splice(idx, 1);
                // Re-index days
                client.itinerary.forEach((item, i) => {
                    item.day = i + 1;
                });
                saveDatabase();
                renderProfileItinerary(client);
                showNotification('Día Eliminado', 'Se quitó el día del itinerario.', 'warning');
            }
        }

        function addItineraryDay() {
            const client = clients.find(c => c.id === currentProfileClientId);
            if(client) {
                client.itinerary = client.itinerary || [];
                const nextDay = client.itinerary.length + 1;
                client.itinerary.push({
                    day: nextDay,
                    title: `Día ${nextDay}: Actividad Premium`,
                    activity: 'Detalles del plan de viaje exclusivo...'
                });
                saveDatabase();
                renderProfileItinerary(client);
                
                // Scroll to bottom
                const list = document.getElementById('profile-itinerary-list');
                setTimeout(() => list.scrollTop = list.scrollHeight, 50);
            }
        }

        function pregenerateLuxuryItinerary() {
            const client = clients.find(c => c.id === currentProfileClientId);
            if(client) {
                const dest = (client.destination || 'Bali').toLowerCase().trim();
                let preset = itineraryPresets[dest];
                if (!preset) {
                    // Try partial match
                    const keys = Object.keys(itineraryPresets);
                    const matchedKey = keys.find(k => dest.includes(k) || k.includes(dest));
                    if(matchedKey) {
                        preset = itineraryPresets[matchedKey];
                    }
                }
                
                // Deep copy preset or generate generic
                const rawPreset = preset || getGenericItinerary(client.destination || 'Bali');
                client.itinerary = JSON.parse(JSON.stringify(rawPreset));
                
                saveDatabase();
                renderProfileItinerary(client);
                showNotification('IA Gysfly', `¡Itinerario de lujo generado con éxito para ${client.destination || 'Bali'}!`, 'success');
            }
        }

        function escapeHtml(str) {
            return str
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        function printLuxuryB2CBrochure() {
            const client = clients.find(c => c.id === currentProfileClientId);
            if(!client) {
                showNotification('Error', 'Cliente no seleccionado.', 'danger');
                return;
            }
            
            const title = `Folleto Digital de Viaje Exclusivo — ${client.name}`;
            const destination = client.destination || 'Bali';
            
            // Build the day-by-day HTML (B2C: No internal costs or PNRs, only luxury design)
            let itineraryHtml = '';
            const itinerary = client.itinerary || [];
            if (itinerary.length === 0) {
                itineraryHtml = `
                    <div style="text-align: center; padding: 20px; color: rgba(212, 175, 55, 0.5); font-style: italic; font-size: 14px;">
                        Itinerario personalizado en preparación.
                    </div>
                `;
            } else {
                itinerary.forEach(item => {
                    itineraryHtml += `
                        <div class="itinerary-day-card">
                            <div class="day-header">
                                <span class="day-number">Día ${item.day}</span>
                                <h3 class="day-title">${escapeHtml(item.title)}</h3>
                            </div>
                            <p class="day-activity">${escapeHtml(item.activity)}</p>
                        </div>
                    `;
                });
            }

            let companionsHtml = '';
            const passengers = client.passengers || [];
            if (passengers.length > 0) {
                companionsHtml = `
                    <div class="companions-box">
                        <h4 class="companions-title">Compañeros de Viaje</h4>
                        <div class="companions-list">
                            ${passengers.map(p => `<span class="companion-tag">${escapeHtml(p.name)} (${escapeHtml(p.type)})</span>`).join(' ')}
                        </div>
                    </div>
                `;
            }

            const docWindow = window.open('', '_blank');
            if (!docWindow) {
                showNotification('Permisos Requeridos', 'El navegador bloqueó la ventana emergente. Por favor, permite ventanas emergentes para imprimir.', 'danger');
                return;
            }

            docWindow.document.write(`
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <title>${title}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;900&display=swap" rel="stylesheet">
                    <style>
                        * {
                            box-sizing: border-box;
                            margin: 0;
                            padding: 0;
                        }
                        body {
                            font-family: 'Outfit', sans-serif;
                            background-color: #030712;
                            color: #f3f4f6;
                            line-height: 1.6;
                            padding: 40px;
                            display: flex;
                            justify-content: center;
                        }
                        .luxury-brochure-container {
                            max-width: 800px;
                            width: 100%;
                            background-color: #0a0f1d;
                            border: 1px solid rgba(212, 175, 55, 0.3);
                            border-radius: 24px;
                            padding: 50px;
                            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                            position: relative;
                            overflow: hidden;
                        }
                        .luxury-brochure-container::before {
                            content: '';
                            position: absolute;
                            top: -100px;
                            right: -100px;
                            width: 300px;
                            height: 300px;
                            background: radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, transparent 70%);
                            pointer-events: none;
                        }
                        .brochure-header {
                            text-align: center;
                            border-bottom: 1px solid rgba(212, 175, 55, 0.2);
                            padding-bottom: 30px;
                            margin-bottom: 40px;
                        }
                        .brand-signature {
                            font-size: 11px;
                            font-weight: 700;
                            color: #D4AF37;
                            letter-spacing: 4px;
                            text-transform: uppercase;
                            margin-bottom: 10px;
                            display: block;
                        }
                        .brochure-destination {
                            font-size: 32px;
                            font-weight: 900;
                            color: #ffffff;
                            letter-spacing: 2px;
                            text-transform: uppercase;
                            margin-bottom: 10px;
                        }
                        .brochure-dates {
                            font-size: 12px;
                            color: rgba(212, 175, 55, 0.8);
                            font-family: monospace;
                            letter-spacing: 2px;
                            text-transform: uppercase;
                        }
                        .welcome-section {
                            margin-bottom: 40px;
                        }
                        .welcome-label {
                            font-size: 10px;
                            color: rgba(255, 255, 255, 0.4);
                            text-transform: uppercase;
                            letter-spacing: 2px;
                            margin-bottom: 4px;
                        }
                        .welcome-client {
                            font-size: 20px;
                            font-weight: 700;
                            color: #ffffff;
                            margin-bottom: 15px;
                        }
                        .welcome-text {
                            font-size: 13px;
                            color: rgba(255, 255, 255, 0.75);
                            font-style: italic;
                            line-height: 1.8;
                            border-left: 2px solid rgba(212, 175, 55, 0.5);
                            padding-left: 15px;
                        }
                        .companions-box {
                            background: rgba(255, 255, 255, 0.02);
                            border: 1px solid rgba(255, 255, 255, 0.05);
                            border-radius: 16px;
                            padding: 20px;
                            margin-bottom: 40px;
                        }
                        .companions-title {
                            font-size: 11px;
                            font-weight: 700;
                            color: #D4AF37;
                            text-transform: uppercase;
                            letter-spacing: 2px;
                            margin-bottom: 12px;
                        }
                        .companions-list {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 10px;
                        }
                        .companion-tag {
                            font-size: 12px;
                            padding: 5px 12px;
                            background: rgba(212, 175, 55, 0.1);
                            color: #D4AF37;
                            border: 1px solid rgba(212, 175, 55, 0.2);
                            border-radius: 30px;
                            font-weight: 500;
                        }
                        .itinerary-section {
                            margin-bottom: 45px;
                        }
                        .section-title {
                            font-size: 13px;
                            font-weight: 700;
                            color: #D4AF37;
                            text-transform: uppercase;
                            letter-spacing: 3px;
                            margin-bottom: 25px;
                            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                            padding-bottom: 8px;
                        }
                        .itinerary-day-card {
                            background: rgba(255, 255, 255, 0.02);
                            border: 1px solid rgba(255, 255, 255, 0.04);
                            border-radius: 16px;
                            padding: 25px;
                            margin-bottom: 20px;
                            position: relative;
                        }
                        .day-header {
                            display: flex;
                            align-items: center;
                            gap: 15px;
                            margin-bottom: 12px;
                        }
                        .day-number {
                            font-size: 11px;
                            font-weight: 700;
                            background: linear-gradient(135deg, #0F766E 0%, #D4AF37 100%);
                            color: #ffffff;
                            padding: 4px 10px;
                            border-radius: 8px;
                            letter-spacing: 1px;
                            text-transform: uppercase;
                        }
                        .day-title {
                            font-size: 16px;
                            font-weight: 700;
                            color: #ffffff;
                        }
                        .day-activity {
                            font-size: 13px;
                            color: rgba(255, 255, 255, 0.7);
                            line-height: 1.8;
                        }
                        .rate-card {
                            background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.03) 100%);
                            border: 1px solid rgba(212, 175, 55, 0.4);
                            border-radius: 20px;
                            padding: 30px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 40px;
                        }
                        .rate-info-title {
                            font-size: 12px;
                            font-weight: 700;
                            color: #D4AF37;
                            text-transform: uppercase;
                            letter-spacing: 2px;
                            margin-bottom: 4px;
                        }
                        .rate-info-sub {
                            font-size: 11px;
                            color: rgba(255, 255, 255, 0.5);
                        }
                        .rate-value-box {
                            text-align: right;
                        }
                        .rate-value {
                            font-size: 26px;
                            font-weight: 900;
                            color: #ffffff;
                            letter-spacing: 1px;
                        }
                        .rate-guarantee {
                            font-size: 10px;
                            color: #10B981;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        }
                        .brochure-footer {
                            text-align: center;
                            border-top: 1px solid rgba(255, 255, 255, 0.08);
                            padding-top: 30px;
                            margin-top: 50px;
                        }
                        .footer-brand {
                            font-size: 22px;
                            font-weight: 900;
                            letter-spacing: 3px;
                            color: #ffffff;
                            margin-bottom: 8px;
                        }
                        .footer-text {
                            font-size: 12px;
                            color: rgba(255, 255, 255, 0.5);
                            max-width: 500px;
                            margin: 0 auto 20px auto;
                        }
                        .footer-contact {
                            font-size: 11px;
                            font-weight: 600;
                            color: #D4AF37;
                            letter-spacing: 2px;
                        }
                        
                        @media print {
                            body {
                                background-color: #ffffff;
                                color: #111827;
                                padding: 0;
                            }
                            .luxury-brochure-container {
                                background-color: #ffffff;
                                border: none;
                                padding: 0;
                                box-shadow: none;
                            }
                            .luxury-brochure-container::before {
                                display: none;
                            }
                            .brochure-destination, .welcome-client, .day-title, .footer-brand {
                                color: #111827 !important;
                            }
                            .welcome-text {
                                color: #374151 !important;
                                border-left-color: #D4AF37 !important;
                            }
                            .itinerary-day-card {
                                background: #f9fafb !important;
                                border: 1px solid #e5e7eb !important;
                                page-break-inside: avoid;
                            }
                            .day-activity {
                                color: #4b5563 !important;
                            }
                            .rate-card {
                                background: #fdfbeb !important;
                                border: 1px solid #fef3c7 !important;
                                page-break-inside: avoid;
                            }
                            .rate-info-sub {
                                color: #6b7280 !important;
                            }
                            .rate-value {
                                color: #111827 !important;
                            }
                            .brochure-footer {
                                border-top-color: #e5e7eb !important;
                            }
                            .footer-text {
                                color: #6b7280 !important;
                            }
                            .no-print {
                                display: none;
                            }
                        }
                        
                        .no-print-bar {
                            position: fixed;
                            top: 0;
                            left: 0;
                            right: 0;
                            height: 50px;
                            background: rgba(10, 15, 29, 0.9);
                            backdrop-filter: blur(10px);
                            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 15px;
                            z-index: 1000;
                        }
                        .print-btn {
                            background: #D4AF37;
                            color: #030712;
                            border: none;
                            padding: 6px 16px;
                            border-radius: 8px;
                            font-family: inherit;
                            font-size: 12px;
                            font-weight: 700;
                            cursor: pointer;
                            transition: all 0.2s;
                        }
                        .print-btn:hover {
                            background: #e5c04f;
                            box-shadow: 0 0 10px rgba(212, 175, 55, 0.4);
                        }
                        .body-padding-top {
                            padding-top: 90px;
                        }
                    </style>
                </head>
                <body class="body-padding-top">
                    <div class="no-print-bar no-print">
                        <span style="font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.7); letter-spacing: 1px;">VISTA DE IMPRESIÓN DEL FOLLETO B2C DE LUJO</span>
                        <button class="print-btn" onclick="window.print()">IMPRIMIR FOLLETO</button>
                    </div>

                    <div class="luxury-brochure-container">
                        <div class="brochure-header">
                            <span class="brand-signature">Gysfly Travels Signature</span>
                            <h1 class="brochure-destination">${escapeHtml(destination)}</h1>
                            <p class="brochure-dates">
                                ${client.start_date ? formatDateFriendly(client.start_date) : '-'} ${client.end_date ? '• ' + formatDateFriendly(client.end_date) : ''}
                            </p>
                        </div>
                        
                        <div class="welcome-section">
                            <p class="welcome-label">Diseñado exclusivamente para</p>
                            <h2 class="welcome-client">${escapeHtml(client.name)}</h2>
                            <p class="welcome-text">
                                "Nos complace presentarle esta propuesta de viaje única y personalizada. Cada día ha sido curado prestando la máxima atención a los estándares internacionales de ultralujo para garantizar una experiencia sublime en destino."
                            </p>
                        </div>
                        
                        ${companionsHtml}
                        
                        <div class="itinerary-section">
                            <h2 class="section-title">Su Itinerario de Autor</h2>
                            <div class="itinerary-list">
                                ${itineraryHtml}
                            </div>
                        </div>
                        
                        <div class="rate-card">
                            <div>
                                <p class="rate-info-title">Tarifa del Paquete Exclusivo</p>
                                <p class="rate-info-sub">Servicios aéreos, hoteleros y traslados privados de lujo incluidos.</p>
                            </div>
                            <div class="rate-value-box">
                                <p class="rate-value">${formatDollars(client.volume || 0)}</p>
                                <p class="rate-guarantee">Tarifa Garantizada</p>
                            </div>
                        </div>

                        <div class="brochure-footer">
                            <div class="footer-brand">GYSFLY</div>
                            <p class="footer-text">En Gysfly Travels, cuidamos cada mínimo detalle técnico y estético para asegurar que su viaje sea una experiencia excepcional. Su agente Signature estará disponible en todo momento.</p>
                            <p class="footer-contact">signature@gysfly.com • +34 910 GYSFLY</p>
                        </div>
                    </div>
                </body>
                </html>
            `);
            docWindow.document.close();
        }

        function printItineraryProposal() {
            const client = clients.find(c => c.id === currentProfileClientId);
            if(!client || !client.itinerary || client.itinerary.length === 0) {
                showNotification('Sin Itinerario', 'Crea o pre-genera al menos un día de itinerario primero.', 'warning');
                return;
            }

            const title = `Propuesta de Viaje de Lujo — ${client.name}`;
            const destination = client.destination || 'Bali';
            
            // Build the day-by-day HTML
            let itineraryHtml = '';
            client.itinerary.forEach(item => {
                itineraryHtml += `
                    <div class="itinerary-day-card">
                        <div class="day-header">
                            <span class="day-number">Día ${item.day}</span>
                            <h3 class="day-title">${item.title}</h3>
                        </div>
                        <p class="day-activity">${item.activity}</p>
                    </div>
                `;
            });

            const contentHtml = `
                <div class="luxury-proposal-container">
                    <!-- Cover Page -->
                    <div class="proposal-cover">
                        <div>
                            <div class="proposal-logo">GYSFLY</div>
                            <div class="proposal-tagline">EXPERIENCIAS DE VIAJE DE ULTRALUJO</div>
                        </div>
                        
                        <div class="proposal-title-box">
                            <h1 class="proposal-main-title">PROPUESTA DE VIAJE EXCLUSIVA</h1>
                            <h2 class="proposal-subtitle">${destination.toUpperCase()}</h2>
                        </div>
                        
                        <div class="proposal-meta-grid">
                            <div class="meta-item">
                                <span class="meta-label">DISEÑADO EXCLUSIVAMENTE PARA</span>
                                <span class="meta-value">${client.name}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">PREPARADO POR</span>
                                <span class="meta-value">Gysfly Travels Signature</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">PRESUPUESTO PREFERENTE</span>
                                <span class="meta-value">${formatDollars(client.volume)}</span>
                            </div>
                        </div>
                        
                        <div class="proposal-quote">
                            "El viajar es la única adquisición que te hace más rico."
                        </div>
                    </div>
                    
                    <div class="page-break"></div>
                    
                    <!-- Itinerary Timeline Page -->
                    <div class="proposal-timeline-section">
                        <h2 class="section-title">SU ITINERARIO PERSONALIZADO</h2>
                        <div class="timeline-divider"></div>
                        
                        <div class="timeline-container">
                            ${itineraryHtml}
                        </div>
                    </div>
                    
                    <div class="page-break"></div>
                    
                    <!-- Back Cover -->
                    <div class="proposal-back-cover">
                        <h2 class="back-title">SU VIAJE COMIENZA AQUÍ</h2>
                        <p class="back-text">En Gysfly Travels, cuidamos cada mínimo detalle técnico y estético para asegurar que su experiencia sea verdaderamente inolvidable. Su agente asignado estará en contacto permanente para formalizar las reservas aéreas y hoteleras.</p>
                        
                        <div class="back-contact-box">
                            <p class="contact-agent">Gysfly Travels Signature Team</p>
                            <p class="contact-details">signature@gysfly.com • +34 910 GYSFLY</p>
                        </div>
                    </div>
                </div>
            `;

            const docWindow = window.open('', '_blank');
            if (!docWindow) {
                showNotification('Permisos Requeridos', 'El navegador bloqueó la ventana emergente. Por favor, permite ventanas emergentes para emitir el PDF.', 'danger');
                return;
            }

            docWindow.document.write(`
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <title>${title}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
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
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        .controls {
                            display: flex;
                            justify-content: center;
                            gap: 15px;
                            padding: 20px;
                            background: rgba(11, 15, 23, 0.9);
                            border-bottom: 1px solid rgba(255,255,255,0.08);
                            position: sticky;
                            top: 0;
                            z-index: 100;
                        }
                        .btn {
                            padding: 10px 20px;
                            border-radius: 12px;
                            font-size: 13px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            border: none;
                        }
                        .btn-print {
                            background: linear-gradient(135deg, #d4af37 0%, #aa820a 100%);
                            color: #000000;
                        }
                        .btn-print:hover {
                            opacity: 0.9;
                            box-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
                        }
                        .btn-close {
                            background: rgba(255,255,255,0.08);
                            color: #ffffff;
                            border: 1px solid rgba(255,255,255,0.12);
                        }
                        .btn-close:hover {
                            background: rgba(255,255,255,0.15);
                        }
                        
                        .print-container {
                            max-width: 800px;
                            margin: 40px auto;
                            background: #0d121f;
                            border: 1px solid rgba(255, 255, 255, 0.05);
                            border-radius: 24px;
                            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
                            overflow: hidden;
                        }

                        /* Luxury Proposal Styles */
                        .proposal-cover {
                            padding: 80px 60px;
                            min-height: 1000px;
                            display: flex;
                            flex-direction: column;
                            justify-content: space-between;
                            border-left: 5px solid #d4af37;
                            position: relative;
                        }
                        .proposal-logo {
                            font-size: 32px;
                            font-weight: 700;
                            letter-spacing: 5px;
                            color: #d4af37;
                        }
                        .proposal-tagline {
                            font-size: 11px;
                            font-weight: 600;
                            letter-spacing: 4px;
                            color: rgba(255,255,255,0.4);
                            margin-top: 10px;
                        }
                        .proposal-title-box {
                            margin: 120px 0;
                        }
                        .proposal-main-title {
                            font-size: 42px;
                            font-weight: 300;
                            letter-spacing: 6px;
                            color: #ffffff;
                            line-height: 1.2;
                        }
                        .proposal-subtitle {
                            font-size: 26px;
                            font-weight: 700;
                            letter-spacing: 8px;
                            color: #d4af37;
                            margin-top: 15px;
                        }
                        .proposal-meta-grid {
                            display: grid;
                            grid-template-columns: repeat(3, 1fr);
                            gap: 20px;
                            border-top: 1px solid rgba(255,255,255,0.08);
                            padding-top: 40px;
                        }
                        .meta-item {
                            display: flex;
                            flex-direction: column;
                            gap: 6px;
                        }
                        .meta-label {
                            font-size: 8px;
                            font-weight: 600;
                            letter-spacing: 1.5px;
                            color: rgba(255,255,255,0.4);
                        }
                        .meta-value {
                            font-size: 14px;
                            font-weight: 600;
                            color: #ffffff;
                        }
                        .proposal-quote {
                            font-style: italic;
                            font-size: 13px;
                            color: rgba(255,255,255,0.3);
                            margin-top: 60px;
                            text-align: right;
                        }

                        /* Timeline Styles */
                        .proposal-timeline-section {
                            padding: 60px;
                            min-height: 1000px;
                        }
                        .section-title {
                            font-size: 24px;
                            font-weight: 300;
                            letter-spacing: 4px;
                            color: #ffffff;
                        }
                        .timeline-divider {
                            width: 60px;
                            height: 2px;
                            background: #d4af37;
                            margin: 20px 0 40px 0;
                        }
                        .timeline-container {
                            display: flex;
                            flex-direction: column;
                            gap: 30px;
                        }
                        .itinerary-day-card {
                            background: rgba(255, 255, 255, 0.02);
                            border: 1px solid rgba(255, 255, 255, 0.04);
                            border-radius: 16px;
                            padding: 24px;
                        }
                        .day-header {
                            display: flex;
                            align-items: center;
                            gap: 15px;
                            margin-bottom: 12px;
                        }
                        .day-number {
                            background: rgba(212, 175, 55, 0.15);
                            border: 1px solid rgba(212, 175, 55, 0.3);
                            color: #d4af37;
                            padding: 4px 10px;
                            border-radius: 8px;
                            font-size: 11px;
                            font-weight: 700;
                        }
                        .day-title {
                            font-size: 16px;
                            font-weight: 600;
                            color: #ffffff;
                        }
                        .day-activity {
                            font-size: 13px;
                            color: rgba(255, 255, 255, 0.7);
                            line-height: 1.6;
                        }

                        /* Back Cover */
                        .proposal-back-cover {
                            padding: 80px 60px;
                            min-height: 1000px;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: center;
                            text-align: center;
                            background: radial-gradient(circle at center, #111827 0%, #0d121f 100%);
                        }
                        .back-title {
                            font-size: 28px;
                            font-weight: 300;
                            letter-spacing: 5px;
                            color: #d4af37;
                            margin-bottom: 20px;
                        }
                        .back-text {
                            font-size: 14px;
                            color: rgba(255,255,255,0.6);
                            max-width: 500px;
                            line-height: 1.7;
                            margin-bottom: 40px;
                        }
                        .back-contact-box {
                            border-top: 1px solid rgba(255,255,255,0.08);
                            padding-top: 20px;
                            width: 100%;
                            max-width: 300px;
                        }
                        .contact-agent {
                            font-size: 13px;
                            font-weight: 600;
                            color: #ffffff;
                        }
                        .contact-details {
                            font-size: 11px;
                            color: rgba(255,255,255,0.4);
                            margin-top: 5px;
                        }

                        .page-break {
                            page-break-after: always;
                            height: 0;
                        }

                        @media print {
                            body {
                                background: #ffffff !important;
                                color: #000000 !important;
                            }
                            .controls {
                                display: none !important;
                            }
                            .print-container {
                                max-width: 100%;
                                margin: 0;
                                border: none;
                                border-radius: 0;
                                box-shadow: none;
                                background: #ffffff !important;
                            }
                            .proposal-cover {
                                border-left: 8px solid #aa820a;
                                min-height: 100%;
                                page-break-after: always;
                                background: #ffffff !important;
                            }
                            .proposal-main-title {
                                color: #000000 !important;
                            }
                            .proposal-subtitle {
                                color: #aa820a !important;
                            }
                            .meta-value {
                                color: #000000 !important;
                            }
                            .meta-label {
                                color: rgba(0,0,0,0.6) !important;
                            }
                            .proposal-meta-grid {
                                border-top: 1px solid rgba(0,0,0,0.1) !important;
                            }
                            .proposal-quote {
                                color: rgba(0,0,0,0.5) !important;
                            }
                            .proposal-timeline-section {
                                min-height: 100%;
                                background: #ffffff !important;
                            }
                            .section-title {
                                color: #000000 !important;
                            }
                            .itinerary-day-card {
                                background: #fafafa !important;
                                border: 1px solid rgba(0,0,0,0.06) !important;
                            }
                            .day-title {
                                color: #000000 !important;
                            }
                            .day-activity {
                                color: rgba(0,0,0,0.8) !important;
                            }
                            .day-number {
                                background: rgba(170, 130, 10, 0.1) !important;
                                border: 1px solid rgba(170, 130, 10, 0.3) !important;
                                color: #aa820a !important;
                            }
                            .proposal-back-cover {
                                min-height: 100%;
                                background: #ffffff !important;
                            }
                            .back-title {
                                color: #aa820a !important;
                            }
                            .back-text {
                                color: rgba(0,0,0,0.7) !important;
                            }
                            .back-contact-box {
                                border-top: 1px solid rgba(0,0,0,0.1) !important;
                            }
                            .contact-agent {
                                color: #000000 !important;
                            }
                            .contact-details {
                                color: rgba(0,0,0,0.5) !important;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="controls">
                        <button onclick="window.print()" class="btn btn-print">Imprimir Propuesta / PDF</button>
                        <button onclick="window.close()" class="btn btn-close">Cerrar</button>
                    </div>
                    <div class="print-container">
                        ${contentHtml}
                    </div>
                    <script>
                        setTimeout(() => { window.print(); }, 500);
                    <\/script>
                </body>
                </html>
            `);
            docWindow.document.close();
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
                    <\/script>
                </body>
                </html>
            `);
            docWindow.document.close();
        }

        // IMPORT / EXCEL / CSV / DATA DRAG & DROP ENGINE
        function triggerImportFileInput() {
            document.getElementById('import-file-input').click();
        }

        function handleDragOver(e) {
            e.preventDefault();
            document.getElementById('dropzone').classList.add('dropzone-active');
        }

        function handleDragLeave(e) {
            e.preventDefault();
            document.getElementById('dropzone').classList.remove('dropzone-active');
        }

        function handleDrop(e) {
            e.preventDefault();
            document.getElementById('dropzone').classList.remove('dropzone-active');
            
            const file = e.dataTransfer.files[0];
            if (file) {
                processFileImport(file);
            }
        }

        function handleImportFile(event) {
            const file = event.target.files[0];
            if (file) {
                processFileImport(file);
            }
        }

        function processFileImport(file) {
            const reader = new FileReader();
            
            if (file.name.endsWith('.csv')) {
                reader.onload = function(e) {
                    try {
                        const csvText = e.target.result;
                        const importedData = parseCSV(csvText);
                        
                        if(importedData.length === 0) {
                            showNotification('Error de Lectura', 'El archivo CSV está vacío.', 'danger');
                            return;
                        }
                        
                        let count = 0;
                        importedData.forEach(row => {
                            if(row.nombre) {
                                const newId = clients.length ? Math.max(...clients.map(c => c.id)) + 1 : 1;
                                const tagsArr = row.etiquetas ? row.etiquetas.split(';').map(t => t.trim()) : ['Importado'];
                                const volume = parseInt(row.gasto_dolares) || parseInt(row.gasto_euros) || parseInt(row.datos_gb) || Math.floor(Math.random() * 4000) + 1000;
                                const cost = parseInt(row.costo_proveedores) || parseInt(row.costo) || Math.round(volume * 0.7);
                                
                                clients.unshift({
                                    id: newId,
                                    name: row.nombre,
                                    email: row.correo || `${row.nombre.toLowerCase().replace(/ /g, '')}@gysfly.com`,
                                    phone: row.telefono || '+34 600 000 000',
                                    status: row.estado || 'Cotización Pendiente',
                                    volume: volume,
                                    cost: cost,
                                    country: row.pais || 'España',
                                    postal_code: row.codigo_postal || '28001',
                                    destination: row.destino || 'Bali',
                                    tags: tagsArr,
                                    notes: row.notes || 'Viajero importado masivamente desde consola de Excel.',
                                    files: [
                                        { name: 'Import_Ficha_Excel.csv', size: '1.2 KB', date: new Date().toLocaleDateString('es-ES') }
                                    ],
                                    passengers: [
                                        { name: row.nombre, type: 'Adulto', passport: '', birthdate: '' }
                                    ],
                                    services: [],
                                    itinerary: []
                                });
                                count++;
                            }
                        });
                        
                        saveDatabase();
                        showNotification('Importación Completa', `Se cargaron ${count} viajeros con éxito a la base de datos.`, 'success');
                        renderUI();
                        updateCharts();
                        
                    } catch(err) {
                        showNotification('Error', 'Estructura CSV no válida.', 'danger');
                    }
                };
                reader.readAsText(file);
            } 
            else if (file.name.endsWith('.json')) {
                reader.onload = function(e) {
                    try {
                        const json = JSON.parse(e.target.result);
                        let count = 0;
                        
                        const items = Array.isArray(json) ? json : [json];
                        items.forEach(row => {
                            if(row.name || row.nombre) {
                                const newId = clients.length ? Math.max(...clients.map(c => c.id)) + 1 : 1;
                                const volume = parseInt(row.gasto_dolares) || parseInt(row.volume) || parseInt(row.gasto_euros) || parseInt(row.datos_gb) || 2500;
                                const cost = parseInt(row.cost) || parseInt(row.costo) || parseInt(row.costo_proveedores) || Math.round(volume * 0.7);
                                clients.unshift({
                                    id: newId,
                                    name: row.name || row.nombre,
                                    email: row.email || row.correo || 'correo@gysfly.com',
                                    phone: row.phone || row.telefono || '+34 600 000 000',
                                    status: row.status || row.estado || 'Cotización Pendiente',
                                    volume: volume,
                                    cost: cost,
                                    country: row.country || row.pais || 'España',
                                    postal_code: row.postal_code || row.codigo_postal || '28001',
                                    destination: row.destination || row.destino || 'Bali',
                                    tags: row.tags || row.etiquetas || ['Importado'],
                                    notes: row.notes || row.notas || 'Viajero importado desde JSON.',
                                    files: [],
                                    passengers: row.passengers || [
                                        { name: row.name || row.nombre, type: 'Adulto', passport: row.passport || '', birthdate: row.birthdate || '' }
                                    ],
                                    services: row.services || [],
                                    itinerary: row.itinerary || []
                                });
                                count++;
                            }
                        });
                        
                        saveDatabase();
                        showNotification('Importación Completa', `Se importaron ${count} viajeros desde JSON.`, 'success');
                        renderUI();
                        updateCharts();
                        
                    } catch(err) {
                        showNotification('Error', 'Formato JSON corrupto o inválido.', 'danger');
                    }
                };
                reader.readAsText(file);
            }
        }

        // ROBUST CLIENT-SIDE CSV PARSING
        function parseCSV(text) {
            const lines = text.split('\n');
            if (lines.length === 0) return [];
            
            // Detect headers
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
            const result = [];
            
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                // Parse commas respecting double quotes
                const row = [];
                let insideQuote = false;
                let currentVal = '';
                
                for(let charIdx = 0; charIdx < line.length; charIdx++) {
                    const char = line[charIdx];
                    if (char === '"') {
                        insideQuote = !insideQuote;
                    } else if (char === ',' && !insideQuote) {
                        row.push(currentVal.trim());
                        currentVal = '';
                    } else {
                        currentVal += char;
                    }
                }
                row.push(currentVal.trim());
                
                // Build object mapping headers to row index values
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = row[index] ? row[index].replace(/"/g, '') : '';
                });
                result.push(obj);
            }
            return result;
        }

        // DATABASE DOWNLOAD / EXPORT
        function exportToCSV() {
            // Excel-ready CSV headers for Gysfly Travels
            let csvContent = "Nombre,Correo,Telefono,Estado,Gasto_Dolares,Costo_Proveedores,Pais,Codigo_Postal,Destino,Etiquetas,Notas\n";
            
            clients.forEach(c => {
                const tagsStr = c.tags ? c.tags.join(';') : '';
                const notesClean = c.notes ? c.notes.replace(/"/g, '""').replace(/\n/g, ' ') : '';
                const countryVal = c.country || 'España';
                const zipVal = c.postal_code || '28001';
                const destVal = c.destination || 'Bali';
                const costVal = c.cost !== undefined ? c.cost : Math.round((c.volume || 0) * 0.7);
                
                csvContent += `"${c.name}","${c.email}","${c.phone}","${c.status}",${c.volume},${costVal},"${countryVal}","${zipVal}","${destVal}","${tagsStr}","${notesClean}"\n`;
            });
            
            triggerDownload(csvContent, 'CRM_Gysfly_Viajeros_Excel.csv', 'text/csv;charset=utf-8;');
            showNotification('Exportación Éxito', 'Base de datos de viajeros compatible con Excel descargada.', 'success');
        }

        function exportToJSON() {
            const jsonString = JSON.stringify(clients, null, 2);
            triggerDownload(jsonString, 'CRM_Gysfly_Viajeros.json', 'application/json;charset=utf-8;');
            showNotification('Exportación Éxito', 'Fichero JSON descargado correctamente.', 'success');
        }

        function downloadCSVTemplate() {
            const template = "Nombre,Correo,Telefono,Estado,Gasto_Dolares,Costo_Proveedores,Pais,Codigo_Postal,Destino,Etiquetas,Notas\n" +
                             "Christian Duran,christian@gysfly.com,+34 600 123 456,Viaje Activo,4850,3395,España,28001,Bali,VIP;Playa,Notas de prueba de Christian\n" +
                             "Laura Mendoza,laura@gysfly.com,+34 600 987 654,Reserva Confirmada,3200,2240,México,11000,París,Luna de Miel;Europa,Viaje de aniversario";
                              
            triggerDownload(template, 'Plantilla_Viajeros_Gysfly.csv', 'text/csv;charset=utf-8;');
            showNotification('Descarga Plantilla', 'Rellena las filas en Excel e impórtalas al sistema.', 'success');
        }

        function triggerDownload(content, fileName, mimeType) {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        function getStatusBadgeClass(status) {
            const s = String(status || '').trim();
            if (s === 'Viaje Activo' || s === 'De Viaje (On Trip)' || s === 'De Viaje') {
                return 'bg-sky-500/15 border-sky-500/30 text-sky-400';
            } else if (s === 'Reserva Confirmada') {
                return 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400';
            } else if (s === 'Cotización Pendiente' || s === 'Propuesta de Viaje' || s === 'Propuesta') {
                return 'bg-amber-500/15 border-amber-500/30 text-amber-400';
            } else if (s === 'Completado') {
                return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
            } else if (s === 'Inactivo' || s === 'Prospecto (Lead)' || s === 'Prospecto') {
                return 'bg-slate-500/15 border-slate-500/30 text-slate-400';
            }
            
            // Fallbacks
            switch (s) {
                case 'Carga Completada':
                    return 'bg-success/15 border-success/30 text-success';
                case 'Procesando Carga':
                    return 'bg-warning/15 border-warning/30 text-warning animate-pulse';
                case 'Descarga Pendiente':
                    return 'bg-primary/15 border-primary/30 text-primary';
                default:
                    return 'bg-slate-500/15 border-slate-500/30 text-slate-400';
            }
        }

        // GLOBAL SEARCH HEADER
        function handleGlobalSearch(query) {
            if(currentView !== 'clientes') {
                switchView('clientes');
            }
            document.getElementById('client-search').value = query;
            renderClientsDatabase();
        }

        // THINGS 3 SYSTEM VIEWS (Inbox & Today lists)
        function renderInboxView() {
            const list = document.getElementById('inbox-tasks-list');
            list.innerHTML = '';
            
            const inboxTasks = tasks.filter(t => t.priority === 'inbox');
            if(inboxTasks.length === 0) {
                list.innerHTML = `
                    <div class="flex flex-col items-center justify-center p-6 text-center text-on-surface-variant/50">
                        <span class="material-symbols-outlined text-[36px] mb-1">mark_email_read</span>
                        <p class="text-xs font-bold text-white">Bandeja de Tickets limpia</p>
                        <p class="text-[10px]">No hay tickets de soporte pendientes.</p>
                    </div>
                `;
                return;
            }

            inboxTasks.forEach(t => {
                const doneClass = t.done ? 'line-through opacity-40' : '';
                list.innerHTML += `
                    <div class="p-3 bg-surface-container-low/40 border border-glass-stroke rounded-xl flex items-center justify-between hover:border-primary/20 transition-all">
                        <div class="flex items-center gap-3 cursor-pointer" onclick="toggleTaskDone(${t.id})">
                            <div class="w-5 h-5 rounded border-2 ${t.done ? 'border-primary bg-primary/20' : 'border-glass-stroke'} flex items-center justify-center">
                                <span class="material-symbols-outlined text-[14px] text-primary ${t.done ? 'opacity-100' : 'opacity-0'}" style="font-variation-settings: 'FILL' 1;">check</span>
                            </div>
                            <div class="${doneClass}">
                                <p class="text-xs font-bold text-white">${t.title}</p>
                                <p class="text-[10px] text-on-surface-variant/60">Asignado: ${t.assignee}</p>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="moveTask(${t.id}, 'hoy')" class="px-2.5 py-1 bg-primary/10 border border-primary/20 hover:bg-primary hover:text-white rounded-lg text-[10px] font-bold transition-all" title="Mover a Hoy">
                                Mover a Hoy
                            </button>
                            <button onclick="deleteTask(${t.id})" class="text-on-surface-variant hover:text-danger p-1">
                                <span class="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                        </div>
                    </div>
                `;
            });
        }

        function renderTodayView() {
            const list = document.getElementById('today-tasks-list');
            list.innerHTML = '';
            
            const todayTasks = tasks.filter(t => t.priority === 'hoy');
            if(todayTasks.length === 0) {
                document.getElementById('today-empty').classList.remove('hidden');
                return;
            }
            document.getElementById('today-empty').classList.add('hidden');

            todayTasks.forEach(t => {
                const doneClass = t.done ? 'line-through opacity-40' : '';
                list.innerHTML += `
                    <div class="p-3.5 bg-surface-container-low/40 border border-glass-stroke rounded-xl flex items-center justify-between hover:border-warning/20 transition-all">
                        <div class="flex items-center gap-3 cursor-pointer" onclick="toggleTaskDone(${t.id})">
                            <div class="w-5 h-5 rounded border-2 ${t.done ? 'border-primary bg-primary/20' : 'border-glass-stroke'} flex items-center justify-center">
                                <span class="material-symbols-outlined text-[14px] text-primary ${t.done ? 'opacity-100' : 'opacity-0'}" style="font-variation-settings: 'FILL' 1;">check</span>
                            </div>
                            <div class="${doneClass}">
                                <p class="text-xs font-bold text-white">${t.title}</p>
                                <p class="text-[10px] text-on-surface-variant/60">Vence: ${t.due} • Cliente: ${t.assignee}</p>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="moveTask(${t.id}, 'inbox')" class="px-2.5 py-1 bg-surface-container-low border border-glass-stroke hover:text-white rounded-lg text-[10px] font-bold transition-all" title="Mover a Inbox">
                                Inbox
                            </button>
                            <button onclick="deleteTask(${t.id})" class="text-on-surface-variant hover:text-danger p-1">
                                <span class="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                        </div>
                    </div>
                `;
            });
        }

        function toggleTaskDone(id) {
            const task = tasks.find(t => t.id === id);
            if(task) {
                task.done = !task.done;
                saveDatabase();
                if(task.done) {
                    showNotification('Tarea Completada', `Has finalizado: "${task.title}"`, 'success');
                }
                renderUI();
            }
        }

        function moveTask(id, targetPriority) {
            const task = tasks.find(t => t.id === id);
            if(task) {
                task.priority = targetPriority;
                saveDatabase();
                showNotification('Planificación', `Se trasladó a ${targetPriority === 'hoy' ? 'Hoy' : 'Inbox'}.`, 'success');
                renderUI();
            }
        }

        function deleteTask(id) {
            tasks = tasks.filter(t => t.id !== id);
            saveDatabase();
            showNotification('Tarea Eliminada', 'Se borró la tarea del planificador.', 'danger');
            renderUI();
        }

        function markAllInboxRead() {
            tasks.filter(t => t.priority === 'inbox').forEach(t => t.done = true);
            saveDatabase();
            showNotification('Leído', 'Todos los tickets marcados como resueltos.', 'success');
            renderUI();
        }

        // QUICK HEADS-UP NOTIFICATIONS (TOASTS)
        function showNotification(title, text, type = 'success') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            
            const styles = {
                success: { name: 'check_circle', color: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
                warning: { name: 'warning', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
                danger: { name: 'error', color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/30' }
            };
            
            const st = styles[type] || styles.success;
            
            toast.className = `toast-notification glass-card p-0 rounded-2xl flex flex-col w-[340px] shadow-2xl border ${st.border} pointer-events-auto overflow-hidden transition-all duration-300`;
            
            toast.innerHTML = `
                <div class="flex items-start gap-3 p-4 relative overflow-hidden backdrop-blur-md">
                    <div class="absolute inset-0 ${st.bg} opacity-80"></div>
                    <div class="relative z-10 flex items-start gap-4 w-full">
                        <div class="w-10 h-10 rounded-full ${st.bg} border ${st.border} flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span class="material-symbols-outlined ${st.color} text-[22px]">${st.name}</span>
                        </div>
                        <div class="flex-1 pt-0.5">
                            <p class="text-[13px] font-bold text-white tracking-wide">${title}</p>
                            <p class="text-[11px] text-on-surface-variant/90 mt-1 leading-relaxed">${text}</p>
                        </div>
                        <button class="text-on-surface-variant/50 hover:text-white transition-colors close-toast-btn">
                            <span class="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    </div>
                </div>
            `;
            
            toast.querySelector('.close-toast-btn').onclick = () => {
                toast.style.transition = 'opacity 0.3s ease-in, transform 0.3s ease-in';
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(10px) scale(0.95)';
                setTimeout(() => toast.remove(), 300);
            };
            
            container.appendChild(toast);
            
            // Increased duration slightly for better readability of the new format
            setTimeout(() => {
                if(toast.parentElement) {
                    toast.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
                    toast.style.opacity = '0';
                    toast.style.transform = 'translateY(10px) scale(0.95)';
                    setTimeout(() => toast.remove(), 400);
                }
            }, 5000);
        }

        function showQuickToast(title, text) {
            showNotification(title, text, 'success');
        }

        // MAGIC ADD MODAL (FAB Control)
        let magicModalType = 'cliente';
        
        function openMagicAddModal(type = 'cliente') {
            const assigneeSelect = document.getElementById('task-assignee');
            assigneeSelect.innerHTML = '<option value="Sistema">Sistema (Gysfly Cloud)</option>';
            clients.forEach(c => {
                assigneeSelect.innerHTML += `<option value="${c.name}">${c.name}</option>`;
            });

            document.getElementById('modal-magic-add').classList.remove('hidden');
            document.getElementById('modal-magic-add').classList.add('flex');
            setMagicModalType(type);
            updateMagicFinancialPreview();
        }

        function closeMagicAddModal() {
            document.getElementById('modal-magic-add').classList.add('hidden');
            document.getElementById('modal-magic-add').classList.remove('flex');
            
            document.getElementById('magic-form-client').reset();
            document.getElementById('magic-form-tarea').reset();
        }

        function setMagicModalType(type) {
            magicModalType = type;
            const clientForm = document.getElementById('magic-form-client');
            const taskForm = document.getElementById('magic-form-tarea');
            const clientToggle = document.getElementById('toggle-add-client');
            const taskToggle = document.getElementById('toggle-add-tarea');
            
            if(type === 'cliente') {
                clientForm.classList.remove('hidden');
                taskForm.classList.add('hidden');
                clientToggle.classList.add('bg-primary', 'text-white');
                clientToggle.classList.remove('text-on-surface-variant');
                taskToggle.classList.remove('bg-primary', 'text-white');
                taskToggle.classList.add('text-on-surface-variant');
                document.getElementById('magic-modal-title').innerHTML = `
                    <span class="material-symbols-outlined text-primary">person_add</span>
                    <span>Registrar Cliente Gysfly</span>
                `;
            } else {
                clientForm.classList.add('hidden');
                taskForm.classList.remove('hidden');
                taskToggle.classList.add('bg-primary', 'text-white');
                taskToggle.classList.remove('text-on-surface-variant');
                clientToggle.classList.remove('bg-primary', 'text-white');
                clientToggle.classList.add('text-on-surface-variant');
                document.getElementById('magic-modal-title').innerHTML = `
                    <span class="material-symbols-outlined text-primary">checklist</span>
                    <span>Planificar Nueva Tarea</span>
                `;
            }
        }

        function updateMagicFinancialPreview() {
            const volInput = document.getElementById('client-initial-volume');
            const costInput = document.getElementById('client-initial-cost');
            const previewEl = document.getElementById('magic-financial-preview');
            
            if(!volInput || !costInput || !previewEl) return;
            
            const volume = parseInt(volInput.value) || 0;
            const cost = parseInt(costInput.value) || 0;
            const profit = volume - cost;
            const margin = volume > 0 ? ((profit / volume) * 100).toFixed(1) : '0.0';
            
            previewEl.innerText = `Ganancia: ${formatDollars(profit)} USD (${margin}% Margen)`;
            
            if(profit >= 0) {
                previewEl.className = 'text-xs font-bold text-success';
            } else {
                previewEl.className = 'text-xs font-bold text-danger';
            }
        }

        function handleCreateClient(event) {
            event.preventDefault();
            const name = document.getElementById('client-name').value.trim();
            const email = document.getElementById('client-email').value.trim();
            const phone = document.getElementById('client-phone').value.trim();
            const status = document.getElementById('client-status').value;
            const initialVolume = parseInt(document.getElementById('client-initial-volume').value) || 0;
            const initialCost = parseInt(document.getElementById('client-initial-cost').value) || 0;
            const country = document.getElementById('client-country').value.trim() || 'España';
            const postal_code = document.getElementById('client-postal').value.trim() || '28001';
            const destination = document.getElementById('client-destination').value.trim() || 'Bali';
            const tagsText = document.getElementById('client-tags').value;
            const notes = document.getElementById('client-notes').value.trim() || 'Ficha de viajero creada en el panel administrativo.';
            
            const tagsArr = tagsText ? tagsText.split(',').map(t => t.trim()) : ['Nuevo'];
            const newId = clients.length ? Math.max(...clients.map(c => c.id)) + 1 : 1;
            
            const newClient = { 
                id: newId, 
                name, 
                email, 
                phone, 
                status, 
                volume: initialVolume,
                cost: initialCost,
                country,
                postal_code,
                destination,
                tags: tagsArr,
                notes,
                files: [
                    { name: 'Ficha_Creado.pdf', size: '2 KB', date: new Date().toLocaleDateString('es-ES') }
                ],
                passengers: [
                    { name: name, type: 'Adulto', passport: '', birthdate: '' }
                ],
                services: [],
                itinerary: []
            };
            
            clients.unshift(newClient);
            saveDatabase();
            
            if(status === 'Cotización Pendiente') {
                tasks.push({
                    id: tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
                    title: `Preparar propuesta y cotización personalizada para ${name}`,
                    assignee: name,
                    due: 'Hoy',
                    priority: 'inbox',
                    done: false
                });
                saveDatabase();
            }
            
            showNotification('Cliente Creado', `Ficha de "${name}" almacenada.`, 'success');
            closeMagicAddModal();
            renderUI();
            updateCharts();
        }

        function handleCreateTask(event) {
            event.preventDefault();
            const title = document.getElementById('task-name').value.trim();
            const assignee = document.getElementById('task-assignee').value;
            const due = document.getElementById('task-due').value;
            const priority = document.getElementById('task-priority').value;
            
            const newId = tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
            const newTask = { id: newId, title, assignee, due, priority, done: false };
            
            tasks.push(newTask);
            saveDatabase();
            
            showNotification('Tarea Planificada', `Se añadió la tarea del gerente: "${title}"`, 'success');
            closeMagicAddModal();
            renderUI();
        }

        // EMAIL COMPOSER MODAL
        function openEmailModal(email) {
            document.getElementById('email-to').value = email;
            document.getElementById('email-subject').value = 'Servicio de Datos — CRM GYSFLY';
            document.getElementById('email-body').value = 'Estimado cliente, nos comunicamos desde la dirección gerencial de Gysfly para informarle que...';
            document.getElementById('modal-email').classList.remove('hidden');
            document.getElementById('modal-email').classList.add('flex');
        }

        function closeEmailModal() {
            document.getElementById('modal-email').classList.add('hidden');
            document.getElementById('modal-email').classList.remove('flex');
        }

        function handleSendDirectEmail(event) {
            event.preventDefault();
            const to = document.getElementById('email-to').value;
            
            showNotification('Enviando Correo', `Conectando con servidor de correo Gysfly...`, 'warning');
            
            setTimeout(() => {
                showNotification('Correo Enviado', `Correo gerencial enviado a ${to}.`, 'success');
                closeEmailModal();
            }, 1200);
        }

        // CARGA / DESCARGA INTERACTIVE SIMULATION ENGINE
        function openTransferModal(clientId) {
            currentTransferClientId = clientId;
            const client = clients.find(c => c.id === clientId);
            if(client) {
                document.getElementById('transfer-client-name').innerText = client.name;
                document.getElementById('transfer-client-volume').innerText = formatDollars(client.volume);
                document.getElementById('transfer-client-badge').innerText = client.status;
                
                const badge = document.getElementById('transfer-client-badge');
                badge.className = 'inline-block mt-1 px-2.5 py-0.5 font-bold text-[10px] rounded-full ' + getStatusBadgeClass(client.status);
                
                document.getElementById('transfer-progress-panel').classList.add('hidden');
                document.getElementById('transfer-success-panel').classList.add('hidden');
                document.getElementById('transfer-progress-bar').style.width = '0%';
                
                document.getElementById('modal-transfer').classList.remove('hidden');
                document.getElementById('modal-transfer').classList.add('flex');
            }
        }

        function closeTransferModal() {
            document.getElementById('modal-transfer').classList.add('hidden');
            document.getElementById('modal-transfer').classList.remove('flex');
            currentTransferClientId = null;
        }

        function startTransferSimulation(type = 'upload') {
            const client = clients.find(c => c.id === currentTransferClientId);
            if(!client) return;

            const progressPanel = document.getElementById('transfer-progress-panel');
            const progressBar = document.getElementById('transfer-progress-bar');
            const progressPercent = document.getElementById('transfer-progress-percent');
            const progressStatus = document.getElementById('transfer-progress-status');
            
            progressPanel.classList.remove('hidden');
            progressBar.style.width = '0%';
            progressPercent.innerText = '0%';
            progressStatus.innerText = type === 'upload' ? 'Inicializando emisión de billete aéreo...' : 'Generando bono de hotel premium...';
            
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.floor(Math.random() * 15) + 6;
                if(progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    
                    setTimeout(() => {
                        const addedDollars = Math.floor(Math.random() * 1500) + 500;
                        if(!client.files) client.files = [];
                        let newFileName = "";
                        
                        if(type === 'upload') {
                            client.volume += addedDollars;
                            client.status = 'Viaje Activo';
                            newFileName = `Billete_Aereo_Business_${Math.floor(Math.random()*900 + 100)}.pdf`;
                            client.files.push({
                                name: newFileName,
                                size: '1.4 MB',
                                date: new Date().toLocaleDateString('es-ES')
                            });
                            showNotification('Billete Emitido', `Se cargó el coste del vuelo de ${formatDollars(addedDollars)} a ${client.name}`, 'success');
                        } else {
                            client.volume += addedDollars;
                            client.status = 'Reserva Confirmada';
                            newFileName = `Voucher_Hotel_Resort_${Math.floor(Math.random()*900 + 100)}.pdf`;
                            client.files.push({
                                name: newFileName,
                                size: '890 KB',
                                date: new Date().toLocaleDateString('es-ES')
                            });
                            showNotification('Alojamiento Confirmado', `Bono de hotel de ${formatDollars(addedDollars)} vinculado a ${client.name}`, 'success');
                        }
                        
                        saveDatabase();
                        renderUI();
                        updateCharts();
                        
                        // If profile is open, refresh it
                        if(currentProfileClientId === client.id) {
                            openClientProfileModal(client.id);
                        }

                        // Hide progress panel and show success panel
                        progressPanel.classList.add('hidden');
                        
                        const successPanel = document.getElementById('transfer-success-panel');
                        const downloadBtn = document.getElementById('transfer-download-btn');
                        const downloadBtnText = document.getElementById('transfer-download-btn-text');
                        
                        downloadBtnText.innerText = type === 'upload' ? 'Ver e Imprimir Billete Aéreo' : 'Ver e Imprimir Bono de Hotel';
                        successPanel.classList.remove('hidden');
                        
                        downloadBtn.onclick = () => {
                            generateRealTravelDocument(client, newFileName);
                            closeTransferModal();
                        };
                    }, 500);
                }
                
                progressBar.style.width = progress + '%';
                progressPercent.innerText = progress + '%';
                
                if(progress > 25 && progress < 65) {
                    progressStatus.innerText = type === 'upload' ? 'Enlazando localizador con sistema Amadeus...' : 'Verificando cupos y tarifas con proveedor local...';
                } else if(progress >= 65 && progress < 90) {
                    progressStatus.innerText = 'Generando certificado de seguro de viaje internacional...';
                } else if(progress >= 90) {
                    progressStatus.innerText = 'Escribiendo reserva en el registro general de Gysfly Travels...';
                }
            }, 250);
        }

        // CAMPAIGNS MARKETING ENGINE
        const templates = {
            newsletter: {
                subject: 'Novedades de Destino: Explora el Sudeste Asiático con Gysfly Travels',
                body: 'Estimado viajero, nos complace presentarte nuestra guía exclusiva para recorrer Bali y Tailandia esta temporada. Hemos concertado alianzas con resorts de 5 estrellas en Ubud y Seminyak con tarifas preferenciales y transfers de lujo incluidos. Contacta con tu agente asignado para diseñar tu itinerario a medida.'
            },
            promo: {
                subject: 'Promo Exclusiva: Vuelo Business directo a Maldivas con Gysfly Travels',
                body: '¡Hola! Tenemos plazas exclusivas con un 20% de descuento en cabina Business para vuelos directos a Maldivas saliendo este próximo mes. Además, tu reserva incluye el acceso VIP a salas Lounge en aeropuertos de escala y traslados en hidroavión al resort. ¡Cupos muy limitados!'
            },
            update: {
                subject: 'Aviso Importante: Nuevos Requisitos de Visado para Viajeros',
                body: 'AVISO URGENTE PARA VIAJEROS: Te informamos que las autoridades migratorias internacionales han modificado los plazos de validación de visados y pasaportes. Te recomendamos revisar la vigencia de tu pasaporte (mínimo 6 meses) antes de tu fecha de salida. Ponte en contacto con nosotros para asesoramiento gratuito.'
            },
            blank: {
                subject: '',
                body: ''
            }
        };

        function loadTemplate(key) {
            const template = templates[key] || templates.blank;
            document.getElementById('campaign-subject').value = template.subject;
            document.getElementById('campaign-body').value = template.body;
            updateLivePreview();
        }

        function calculateSegmentSize(segment) {
            let count = 0;
            if(segment === 'all') {
                count = clients.length;
            } else {
                const statusMapping = {
                    activo: 'Viaje Activo',
                    confirmado: 'Reserva Confirmada',
                    cotizacion: 'Cotización Pendiente',
                    inactivo: 'Inactivo'
                };
                count = clients.filter(c => c.status === statusMapping[segment]).length;
            }
            
            // Multiply by simulated recipient base ratio
            const targetRecipients = count * 15;
            document.getElementById('campaign-segment-count').innerText = `Esta campaña se enviará a ${targetRecipients} viajeros en este segmento.`;
            updateLivePreview();
        }

        function updateLivePreview() {
            const subject = document.getElementById('campaign-subject').value;
            const body = document.getElementById('campaign-body').value;
            const segment = document.getElementById('campaign-segment').value;
            
            const segmentMapping = {
                all: 'Todos los viajeros (Gysfly DB)',
                activo: 'Solo viajeros con "Viaje Activo"',
                confirmado: 'Solo viajeros con "Reserva Confirmada"',
                cotizacion: 'Solo viajeros con "Cotización Pendiente"',
                inactivo: 'Solo viajeros "Inactivos"'
            };
            
            const toSegmentEl = document.getElementById('preview-to-segment');
            const subjectEl = document.getElementById('preview-subject');
            const bodyEl = document.getElementById('preview-body');
            
            if(toSegmentEl) toSegmentEl.innerText = segmentMapping[segment] || 'Todos';
            if(subjectEl) subjectEl.innerText = subject || '[Asunto Vacío]';
            if(bodyEl) bodyEl.innerText = body || 'Comienza a redactar tu correo en el editor de la izquierda...';
        }

        function triggerCampaignSend() {
            const subject = document.getElementById('campaign-subject').value.trim();
            const body = document.getElementById('campaign-body').value.trim();
            const segment = document.getElementById('campaign-segment').value;
            
            if(!subject || !body) {
                showNotification('Error', 'Debes incluir asunto y cuerpo de la campaña.', 'danger');
                return;
            }

            let filteredClients = [];
            if(segment === 'all') {
                filteredClients = clients;
            } else {
                const statusMapping = {
                    activo: 'Viaje Activo',
                    confirmado: 'Reserva Confirmada',
                    cotizacion: 'Cotización Pendiente',
                    inactivo: 'Inactivo'
                };
                filteredClients = clients.filter(c => c.status === statusMapping[segment]);
            }
            
            const recipientsCount = filteredClients.length * 15;
            if(recipientsCount === 0) {
                showNotification('Sin Destinatarios', 'No hay viajeros en el segmento seleccionado.', 'danger');
                return;
            }

            // Open SMTP sending modal
            const modal = document.getElementById('modal-campaign-send');
            if(modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
            
            const progressBar = document.getElementById('sending-progress-bar');
            const percentText = document.getElementById('sending-percent-text');
            const statusText = document.getElementById('sending-status-text');
            const consoleLog = document.getElementById('sending-console');
            const closeBtn = document.getElementById('close-sending-btn');
            
            if(progressBar) progressBar.style.width = '0%';
            if(percentText) percentText.innerText = '0%';
            if(statusText) statusText.innerText = 'Iniciando cola de envíos SMTP...';
            if(consoleLog) consoleLog.innerHTML = `<p class="text-on-surface-variant/40">[INFO] Inicializando despachador masivo GYSFLY Travels...</p>`;
            if(closeBtn) closeBtn.setAttribute('disabled', 'true');
            
            // Simulating steps
            const logSteps = [
                { time: 500, log: '[INFO] Conectando con servidor de correo Gysfly SMTP (smtp.gysfly.com:465)...', progress: 10, status: 'Conectando con servidor SMTP...' },
                { time: 1000, log: '[OK] Conexión establecida. Protocolo SSL/TLS activo (Certificado válido).', progress: 20, status: 'Estableciendo canal seguro...' },
                { time: 1500, log: '[INFO] Autenticando credenciales de la agencia (reservas@gysfly.com)...', progress: 30, status: 'Autenticando en servidor...' },
                { time: 2000, log: `[OK] Autenticación completada. Iniciando envío del lote para ${filteredClients.length} viajeros (${recipientsCount} destinatarios simulados).`, progress: 40, status: 'Transmitiendo lote de correos...' }
            ];
            
            // Generate steps for each individual traveler in the list
            let cumulativeTime = 2000;
            const timeStep = Math.max(150, Math.min(500, 2500 / (filteredClients.length || 1))); // dynamically scale timing
            
            filteredClients.forEach((client, idx) => {
                const progressVal = 40 + Math.floor(((idx + 1) / filteredClients.length) * 50);
                cumulativeTime += timeStep;
                logSteps.push({
                    time: cumulativeTime,
                    log: `[OK] [${new Date().toLocaleTimeString()}] Correo enviado con éxito a: ${client.name} &lt;${client.email}&gt;`,
                    progress: progressVal,
                    status: `Enviando a ${client.name}...`
                });
            });
            
            // Final compilation steps
            cumulativeTime += 300;
            logSteps.push({
                time: cumulativeTime,
                log: `[INFO] Cerrando sesión SMTP limpia. Transmisión exitosa.`,
                progress: 95,
                status: 'Finalizando despachos...'
            });
            
            cumulativeTime += 500;
            logSteps.push({
                time: cumulativeTime,
                log: `<span class="text-success font-bold">[OK] ¡Campaña masiva enviada! Total de correos entregados: ${recipientsCount} de forma simulada. Tasa SMTP: 100% de entrega.</span>`,
                progress: 100,
                status: 'Campaña despachada con éxito'
            });
            
            // Execute simulated timers
            logSteps.forEach(step => {
                setTimeout(() => {
                    if(progressBar) progressBar.style.width = `${step.progress}%`;
                    if(percentText) percentText.innerText = `${step.progress}%`;
                    if(statusText) statusText.innerText = step.status;
                    if(consoleLog) {
                        consoleLog.innerHTML += `<p class="leading-normal">${step.log}</p>`;
                        consoleLog.scrollTop = consoleLog.scrollHeight;
                    }
                    
                    if(step.progress === 100) {
                        if(closeBtn) closeBtn.removeAttribute('disabled');
                        
                        // Save in campaigns history list
                        const newCampaign = {
                            id: campaigns.length ? Math.max(...campaigns.map(c => c.id)) + 1 : 1,
                            subject,
                            segment,
                            size: recipientsCount,
                            date: new Date().toLocaleDateString('es-ES'),
                            status: 'Enviado',
                            openRate: Math.floor(Math.random() * 25) + 70 // High open rate for travel agency: 70% - 95%
                        };
                        
                        campaigns.unshift(newCampaign);
                        saveDatabase();
                        showNotification('Campaña Despachada', `Se han enviado ${recipientsCount} correos con éxito.`, 'success');
                        
                        // Update charts and statistics
                        renderUI();
                        updateCampaignStats();
                        updateCampaignChart();
                    }
                }, step.time);
            });
        }
        
        function closeSendingModal() {
            const modal = document.getElementById('modal-campaign-send');
            if(modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
            
            // Reset to defaults
            document.getElementById('campaign-template').value = 'newsletter';
            loadTemplate('newsletter');
        }

        function updateCampaignStats() {
            const totalSent = campaigns.length;
            const totalEmails = campaigns.reduce((acc, c) => acc + c.size, 0);
            const avgOpenRate = totalSent ? Math.round(campaigns.reduce((acc, c) => acc + c.openRate, 0) / totalSent) : 0;
            
            const totalSentEl = document.getElementById('camp-total-sent');
            const totalEmailsEl = document.getElementById('camp-total-emails');
            const avgOpenEl = document.getElementById('camp-avg-open');
            
            if (totalSentEl) totalSentEl.innerText = totalSent;
            if (totalEmailsEl) totalEmailsEl.innerText = totalEmails;
            if (avgOpenEl) avgOpenEl.innerText = `${avgOpenRate}%`;
        }

        function updateCampaignChart() {
            if(!chartInstances.campaignsChart) return;
            
            // Get latest 5 campaigns in reverse order (oldest to newest for reading chronologically)
            const recentCampaigns = [...campaigns].slice(0, 5).reverse();
            
            chartInstances.campaignsChart.data.labels = recentCampaigns.map(c => {
                // Shorten subject for display
                return c.subject.length > 20 ? c.subject.slice(0, 20) + '...' : c.subject;
            });
            chartInstances.campaignsChart.data.datasets[0].data = recentCampaigns.map(c => c.openRate);
            chartInstances.campaignsChart.update();
        }

        function renderCampaignsHistory() {
            const list = document.getElementById('campaigns-history-list');
            if(!list) return;
            list.innerHTML = '';

            campaigns.forEach(c => {
                list.innerHTML += `
                    <div class="p-4 bg-surface-container-low/40 border border-glass-stroke rounded-xl space-y-2">
                        <div class="flex justify-between items-start">
                            <span class="text-[10px] uppercase font-bold text-primary">${c.date}</span>
                            <span class="bg-success/15 text-success text-[9px] font-bold px-2 py-0.5 rounded-full border border-success/10">${c.status}</span>
                        </div>
                        <p class="text-xs font-bold text-white leading-snug">${c.subject}</p>
                        <div class="flex justify-between text-[10px] text-on-surface-variant/70 pt-1">
                            <p>Segmento: <span class="text-white">${c.segment === 'all' ? 'Todos' : c.segment.toUpperCase()}</span></p>
                            <p>Envíos: <span class="text-white">${c.size}</span></p>
                            <p>Tasa: <span class="text-success font-semibold">${c.openRate}%</span></p>
                        </div>
                    </div>
                `;
            });
        }

        // GRAPHICS AND CHARTS (CHART.JS IMPLEMENTATION)
        function initCharts() {
            const dashCanvas = document.getElementById('dashboardChart');
            if(!dashCanvas) return;

            // 1. Dashboard Traffic Chart
            const ctxDash = dashCanvas.getContext('2d');
            chartInstances.dashChart = new Chart(ctxDash, {
                type: 'line',
                data: {
                    labels: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'],
                    datasets: [
                        {
                            label: 'Facturación Estimada ($)',
                            data: [120, 210, 160, 310, 240, 342, 290],
                            borderColor: '#6366F1',
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 3,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        },
                        {
                            label: 'Gastos Operativos ($)',
                            data: [80, 150, 220, 110, 180, 210, 170],
                            borderColor: '#10B981',
                            backgroundColor: 'rgba(16, 185, 129, 0.05)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 3,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            labels: { color: '#e4e1ed', font: { family: 'Outfit', size: 10 } }
                        }
                    },
                    scales: {
                        y: {
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: '#9ca3af', font: { family: 'Outfit', size: 10 } }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#9ca3af', font: { family: 'Outfit', size: 10 } }
                        }
                    }
                }
            });

            // 2. Analytics Line Chart (Global History)
            const analLineCanvas = document.getElementById('analyticsLineChart');
            if(analLineCanvas) {
                const ctxAnalLine = analLineCanvas.getContext('2d');
                chartInstances.analLine = new Chart(ctxAnalLine, {
                    type: 'line',
                    data: {
                        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                        datasets: [
                            {
                                label: 'Reservas Emitidas ($)',
                                data: [340, 580, 720, 690, 890, 1040],
                                borderColor: '#8B5CF6',
                                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                fill: true,
                                tension: 0.4,
                                borderWidth: 3
                            },
                            {
                                label: 'Cotizaciones Aprobadas ($)',
                                data: [210, 390, 480, 540, 620, 740],
                                borderColor: '#10B981',
                                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                                fill: true,
                                tension: 0.4,
                                borderWidth: 3
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: true, labels: { color: '#e4e1ed', font: { family: 'Outfit' } } }
                        },
                        scales: {
                            y: {
                                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                                ticks: { color: '#9ca3af', font: { family: 'Outfit' } }
                            },
                            x: {
                                grid: { display: false },
                                ticks: { color: '#9ca3af', font: { family: 'Outfit' } }
                            }
                        }
                    }
                });
            }

            // 3. Analytics Doughnut Chart (Meta de Ventas Mensuales)
            const doughnutCanvas = document.getElementById('analyticsDoughnutChart');
            if(doughnutCanvas) {
                const ctxDoughnut = doughnutCanvas.getContext('2d');
                chartInstances.analDoughnut = new Chart(ctxDoughnut, {
                    type: 'doughnut',
                    data: {
                        labels: ['Facturación Realizada', 'Objetivo Restante'],
                        datasets: [{
                            data: [0, 50000],
                            backgroundColor: ['#6366F1', 'rgba(255, 255, 255, 0.05)'],
                            borderWidth: 2,
                            borderColor: '#060A13'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'bottom',
                                labels: { color: '#e4e1ed', font: { family: 'Outfit', size: 10 } }
                            }
                        }
                    }
                });
            }

            // 4. Analytics Bar Chart (Ranking de Clientes Premium)
            const barCanvas = document.getElementById('analyticsBarChart');
            if(barCanvas) {
                const ctxBar = barCanvas.getContext('2d');
                chartInstances.analBar = new Chart(ctxBar, {
                    type: 'bar',
                    data: {
                        labels: [],
                        datasets: [{
                            label: 'Inversión Reservada ($)',
                            data: [],
                            backgroundColor: 'rgba(139, 92, 246, 0.75)',
                            borderColor: '#8B5CF6',
                            borderWidth: 1.5,
                            borderRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            y: {
                                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                                ticks: { color: '#9ca3af', font: { family: 'Outfit' } }
                            },
                            x: {
                                grid: { display: false },
                                ticks: { color: '#9ca3af', font: { family: 'Outfit' } }
                            }
                        }
                    }
                });
            }

            // 5. Campaigns Performance Chart (Open rates)
            const campaignsCanvas = document.getElementById('campaignsChart');
            if(campaignsCanvas) {
                const ctxCamp = campaignsCanvas.getContext('2d');
                chartInstances.campaignsChart = new Chart(ctxCamp, {
                    type: 'bar',
                    data: {
                        labels: [],
                        datasets: [{
                            label: 'Tasa de Apertura (%)',
                            data: [],
                            backgroundColor: 'rgba(16, 185, 129, 0.35)',
                            borderColor: '#10B981',
                            borderWidth: 2,
                            borderRadius: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            y: {
                                min: 0,
                                max: 100,
                                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                                ticks: { color: '#9ca3af', font: { family: 'Outfit', size: 9 } }
                            },
                            x: {
                                grid: { display: false },
                                ticks: { color: '#9ca3af', font: { family: 'Outfit', size: 9 } }
                            }
                        }
                    }
                });
            }

            updateCharts();
            updateCampaignStats();
            updateCampaignChart();
        }

        function updateCharts() {
            updateChartsWithFilteredData(clients);
        }

        function updateChartsWithFilteredData(dataList) {
            if(!chartInstances.dashChart) return;
            
            const totalVol = dataList.reduce((acc, c) => acc + c.volume, 0);

            // 1. Update Top Bar Chart (Spending Ranking)
            if(chartInstances.analBar) {
                const topClients = [...dataList].sort((a, b) => b.volume - a.volume).slice(0, 5);
                chartInstances.analBar.data.labels = topClients.map(c => c.name);
                chartInstances.analBar.data.datasets[0].data = topClients.map(c => c.volume);
                chartInstances.analBar.data.datasets[0].label = 'Inversión Reservada ($)';
                chartInstances.analBar.update();
            }

            // 2. Update Doughnut Chart (Server saturation limit / meta mensual)
            if(chartInstances.analDoughnut) {
                const freeSpace = Math.max(0, storageLimitGB - totalVol);
                chartInstances.analDoughnut.data.labels = ['Facturación Realizada', 'Objetivo Mensual Restante'];
                chartInstances.analDoughnut.data.datasets[0].data = [totalVol, freeSpace];
                chartInstances.analDoughnut.update();
            }

            // 3. Update Dashboard Line Chart
            if(chartInstances.dashChart) {
                const modifier = dataList.length / 4;
                chartInstances.dashChart.data.datasets[0].data = [
                    Math.round(120 * modifier),
                    Math.round(210 * modifier),
                    Math.round(160 * modifier),
                    Math.round(310 * modifier),
                    Math.round(240 * modifier),
                    Math.round(342 * modifier),
                    Math.round(290 * modifier)
                ];
                chartInstances.dashChart.data.datasets[0].label = 'Facturación Estimada ($)';
                chartInstances.dashChart.data.datasets[1].data = [
                    Math.round(80 * modifier),
                    Math.round(150 * modifier),
                    Math.round(220 * modifier),
                    Math.round(110 * modifier),
                    Math.round(180 * modifier),
                    Math.round(210 * modifier),
                    Math.round(170 * modifier)
                ];
                chartInstances.dashChart.data.datasets[1].label = 'Gastos Operativos ($)';
                chartInstances.dashChart.update();
            }

            // 4. Update Analytics Line Chart
            if(chartInstances.analLine) {
                const modifier = dataList.length / 4;
                chartInstances.analLine.data.datasets[0].data = [
                    Math.round(340 * modifier),
                    Math.round(580 * modifier),
                    Math.round(720 * modifier),
                    Math.round(690 * modifier),
                    Math.round(890 * modifier),
                    Math.round(1040 * modifier)
                ];
                chartInstances.analLine.data.datasets[0].label = 'Reservas Emitidas ($)';
                chartInstances.analLine.data.datasets[1].data = [
                    Math.round(210 * modifier),
                    Math.round(390 * modifier),
                    Math.round(480 * modifier),
                    Math.round(540 * modifier),
                    Math.round(620 * modifier),
                    Math.round(740 * modifier)
                ];
                chartInstances.analLine.data.datasets[1].label = 'Cotizaciones Aprobadas ($)';
                chartInstances.analLine.update();
            }
        }

        function applyAnalyticsFilters() {
            const nameVal = document.getElementById('analytics-filter-name').value.toLowerCase().trim();
            const phoneVal = document.getElementById('analytics-filter-phone').value.toLowerCase().trim();
            const countryVal = document.getElementById('analytics-filter-country').value;
            const zipVal = document.getElementById('analytics-filter-zip').value.toLowerCase().trim();
            
            let filtered = clients;
            
            if(nameVal) {
                filtered = filtered.filter(c => c.name.toLowerCase().includes(nameVal));
            }
            if(phoneVal) {
                filtered = filtered.filter(c => c.phone.toLowerCase().includes(phoneVal));
            }
            if(countryVal !== 'all') {
                filtered = filtered.filter(c => c.country && c.country === countryVal);
            }
            if(zipVal) {
                filtered = filtered.filter(c => c.postal_code && c.postal_code.toLowerCase().includes(zipVal));
            }
            
            // Calculate stats
            const totalClients = filtered.length;
            const totalVol = filtered.reduce((acc, c) => acc + c.volume, 0);
            const totalCost = filtered.reduce((acc, c) => acc + (c.cost !== undefined ? c.cost : Math.round(c.volume * 0.7)), 0);
            const totalProfit = totalVol - totalCost;
            const avgMargin = totalVol > 0 ? Math.round((totalProfit / totalVol) * 100) : 0;
            const avgVol = totalClients ? Math.round(totalVol / totalClients) : 0;
            const vipClients = filtered.filter(c => c.volume >= 4000).length;
            
            // Render to DOM
            document.getElementById('stat-total-gb-used').innerText = `${totalClients} Viajeros`;
            document.getElementById('stat-total-revenue-analytics').innerText = formatDollars(totalVol);
            
            const costEl = document.getElementById('stat-total-cost-analytics');
            if(costEl) costEl.innerText = formatDollars(totalCost);
            
            const profitEl = document.getElementById('stat-total-profit-analytics');
            if(profitEl) profitEl.innerText = formatDollars(totalProfit);
            
            const marginEl = document.getElementById('stat-avg-margin-analytics');
            if(marginEl) marginEl.innerText = `${avgMargin}% Margen Promedio`;
            
            document.getElementById('stat-avg-gb-client').innerText = formatDollars(avgVol);
            document.getElementById('stat-critical-count').innerText = `${vipClients} Reservas VIP`;
            
            // Update charts based on filtered travelers
            updateChartsWithFilteredData(filtered);
        }
    