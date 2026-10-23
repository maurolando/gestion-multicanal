const state = {
    currentView: 'login',
    user: null,
    selectedConsultaId: null,
    selectedClienteId: null,
    searchQueryClientes: '',
    searchQueryConsultas: '',
    searchQueryHistorial: '',
    filtroHistorialAccion: 'Todos',
    reportesDias: 30,
    canales: null, // de /api/canales
    usuarios: null, // de /api/usuarios (pantalla Usuarios)
    roles: null,
    searchQueryGlobal: '',
    clientes: [], // de la API; en modo demo, DEMO.clientes
    consultas: []
};

// Datos de ejemplo para el modo demo (sin API): no se muestran si hay base conectada
const DEMO = {
    clientes: [
        {
            id: 'CL-001',
            nombre: 'María López',
            empresa: 'Tech Solutions',
            contacto: 'm.lopez@tech.com',
            telefono: '+595 971 654321',
            canalPreferido: 'Email',
            estado: 'Activo',
            estadoBadge: 'status-resolved',
            fechaRegistro: '15/01/2026'
        },
        {
            id: 'CL-002',
            nombre: 'Carlos Ruiz',
            empresa: 'Particular',
            contacto: 'carlos.ruiz@gmail.com',
            telefono: '+595 981 123456',
            canalPreferido: 'WhatsApp',
            estado: 'Activo',
            estadoBadge: 'status-resolved',
            fechaRegistro: '20/02/2026'
        },
        {
            id: 'CL-003',
            nombre: 'Ana Giménez',
            empresa: 'Boutique Ana',
            contacto: 'contacto@boutique.com',
            telefono: '+595 983 555777',
            canalPreferido: 'Instagram',
            estado: 'Inactivo',
            estadoBadge: 'status-pending',
            fechaRegistro: '10/03/2026'
        },
        {
            id: 'CL-004',
            nombre: 'Juan Pérez',
            empresa: 'Comercial Pérez',
            contacto: 'juan.perez@yahoo.com',
            telefono: '+595 991 888999',
            canalPreferido: 'WhatsApp',
            estado: 'Activo',
            estadoBadge: 'status-resolved',
            fechaRegistro: '05/04/2026'
        }
    ],
    consultas: [
        {
            id: 'TK-8832',
            cliente: 'Carlos Ruiz',
            email: 'carlos.ruiz@gmail.com',
            asunto: 'Problema con facturación',
            mensaje: 'Hola equipo, no estoy pudiendo descargar mi última factura de la plataforma.',
            canal: 'Email',
            canalIcon: 'ph-envelope-simple',
            canalColor: '',
            estado: 'Pendiente',
            estadoBadge: 'status-pending',
            hora: '10:42 AM',
            mensajes: [
                { tipo: 'cliente', texto: 'Hola equipo,\n\nNo estoy pudiendo descargar mi última factura de la plataforma. Me sale un error 500 cada vez que intento. ¿Podrían enviármela por este medio o solucionar el problema?', hora: '10:42 AM' },
                { tipo: 'agente', texto: 'Hola Carlos, gracias por comunicarte.\nEstamos revisando el inconveniente con el portal de facturación. Mientras tanto, te adjunto la factura solicitada.', hora: '10:45 AM', adjunto: 'Factura_00392.pdf' }
            ]
        },
        {
            id: 'TK-8833',
            cliente: 'María López',
            email: 'm.lopez@tech.com',
            asunto: 'Consulta de stock',
            mensaje: '¿Tienen disponible el modelo XZ en color azul?',
            canal: 'WhatsApp',
            canalIcon: 'ph-whatsapp-logo',
            canalColor: '#25D366',
            estado: 'En Proceso',
            estadoBadge: 'status-process',
            hora: 'Ayer',
            mensajes: [
                { tipo: 'cliente', texto: '¿Tienen disponible el modelo XZ en color azul?', hora: 'Ayer' }
            ]
        },
        {
            id: 'TK-8834',
            cliente: 'Ana Giménez',
            email: 'contacto@boutique.com',
            asunto: 'Cambio de plan empresarial',
            mensaje: 'Deseamos actualizar nuestra suscripción al plan Premium a partir del próximo mes.',
            canal: 'Instagram',
            canalIcon: 'ph-instagram-logo',
            canalColor: '#E1306C',
            estado: 'Resuelto',
            estadoBadge: 'status-resolved',
            hora: 'Hace 2 horas',
            mensajes: [
                { tipo: 'cliente', texto: 'Deseamos actualizar nuestra suscripción al plan Premium a partir del próximo mes.', hora: 'Hace 2 horas' }
            ]
        }
    ]

};

// --- View Templates ---

const views = {
    login: () => `
        <div class="login-page">
            <div class="login-left">
                <div style="text-align: center; max-width: 400px;">
                    <div style="font-size: 4rem; color: var(--accent-lime); margin-bottom: 20px;">
                        <i class="ph ph-chats-teardrop"></i>
                    </div>
                    <h1 style="font-size: 2.5rem; margin-bottom: 16px;">AtyÑe’ẽ</h1>
                    <p style="font-size: 1.2rem; opacity: 0.8;">Tu comunicación, más simple.</p>
                    <div style="margin-top: 40px;">
                        <div aria-hidden="true" style="display: flex; justify-content: center; gap: 20px; font-size: 2.5rem; opacity: 0.85;">
                            <i class="ph ph-whatsapp-logo"></i><i class="ph ph-instagram-logo"></i><i class="ph ph-facebook-logo"></i><i class="ph ph-envelope-simple"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="login-right">
                <div style="max-width: 350px; width: 100%; margin: 0 auto;">
                    <h2 style="font-size: 1.8rem; color: var(--primary-dark); margin-bottom: 8px;">Bienvenido</h2>
                    <p style="color: var(--text-muted); margin-bottom: 32px;">Ingresa tus credenciales para acceder al sistema.</p>
                    
                    <form class="login-form" onsubmit="event.preventDefault(); iniciarSesion()">
                        <div class="form-group">
                            <label for="login-email">Usuario corporativo</label>
                            <input type="email" id="login-email" placeholder="ejemplo@atynere.py" autocomplete="username" required />
                        </div>
                        <div class="form-group">
                            <label for="login-password">Contraseña</label>
                            <input type="password" id="login-password" placeholder="••••••••" autocomplete="current-password" required />
                        </div>
                        <div style="text-align: right; margin-bottom: 24px;">
                            <a href="#" onclick="event.preventDefault(); showModal('¿Olvidaste tu contraseña?', '<p style=&quot;line-height:1.6;&quot;>Pedile a un administrador que te la restablezca. La recuperación por correo todavía no está disponible: el sistema no tiene un servidor de correo configurado.</p>')" style="font-size: 0.85rem; color: var(--primary-main); text-decoration: none; font-weight: 500;">¿Olvidaste tu contraseña?</a>
                        </div>
                        <button type="submit" class="btn btn-accent">Iniciar Sesión <i class="ph ph-arrow-right"></i></button>
                    </form>
                </div>
            </div>
        </div>
    `,
    
    dashboard: () => {
        const d = state.dashboard; // datos de /api/dashboard/stats; null en modo demo o mientras cargan
        const kpi = clave => d ? d.kpis[clave] : '—';
        const actividad = d ? d.actividad_reciente : [];
        return `
        <div class="page-header">
            <div>
                <h1 class="page-title">Dashboard Principal</h1>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">Resumen general de actividad y rendimiento.</p>
            </div>
            <button class="btn btn-primary" onclick="window.modals.descargarReporte()"><i class="ph ph-download-simple"></i> Descargar Reporte</button>
        </div>
        
        <div class="grid grid-cols-4 mb-4">
            <div class="card stat-card">
                <div class="stat-icon purple"><i class="ph ph-tray"></i></div>
                <div class="stat-details">
                    <h3>${kpi('consultas_recibidas')}</h3>
                    <p>Consultas Recibidas</p>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon" style="background: #FFF3CD; color: #856404;"><i class="ph ph-hourglass-high"></i></div>
                <div class="stat-details">
                    <h3>${kpi('consultas_pendientes')}</h3>
                    <p>Consultas Pendientes</p>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon lime"><i class="ph ph-check-circle"></i></div>
                <div class="stat-details">
                    <h3>${kpi('consultas_resueltas')}</h3>
                    <p>Consultas Resueltas</p>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon" style="background: rgba(74, 20, 140, 0.1); color: var(--primary-main);"><i class="ph ph-users"></i></div>
                <div class="stat-details">
                    <h3>${kpi('clientes_activos')}</h3>
                    <p>Clientes Activos</p>
                </div>
            </div>
        </div>
        
        <div class="grid grid-cols-2 mb-4">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Volumen de Consultas por Canal</h3>
                </div>
                <div style="height: 300px; display:flex; align-items:center; justify-content:center; background:#f9f9f9; border-radius: 8px;">
                    <canvas id="chartCanales"></canvas>
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Actividad Reciente</h3>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Canal</th>
                                <th>Estado</th>
                                <th>Tiempo</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${actividad.map(a => `
                            <tr>
                                <td><strong>${esc(a.cliente_nombre)}</strong></td>
                                <td><i class="ph ${esc(a.canal_icono)}" style="color:${esc(a.canal_color)}"></i> ${esc(a.canal_nombre)}</td>
                                <td><span class="status-badge ${badgeEstadoConsulta(a.estado)}">${esc(a.estado)}</span></td>
                                <td>${esc(a.tiempo)}</td>
                            </tr>`).join('')}
                            ${actividad.length ? '' : `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">${d ? 'Sin actividad todavía.' : 'Sin conexión a la API.'}</td></tr>`}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    },

    clientes: () => {
        const query = (state.searchQueryClientes || '').toLowerCase().trim();
        const clientesFiltrados = (state.clientes || []).filter(c => 
            c.nombre.toLowerCase().includes(query) ||
            c.empresa.toLowerCase().includes(query) ||
            c.contacto.toLowerCase().includes(query) ||
            c.telefono.toLowerCase().includes(query) ||
            c.id.toLowerCase().includes(query)
        );

        const rowsHTML = clientesFiltrados.length === 0 ? `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="ph ph-user-minus" style="font-size: 2.5rem; margin-bottom: 8px; color: var(--border-color);"></i>
                    <p style="font-weight: 600; color: var(--text-main);">No se encontraron clientes</p>
                    <p style="font-size: 0.85rem; margin-top: 4px;">Filtro actual: "${state.searchQueryClientes}". Haz clic en <strong>Nuevo</strong> para registrar uno.</p>
                </td>
            </tr>
        ` : clientesFiltrados.map(c => {
            const isSelected = state.selectedClienteId === c.id;
            const styleBg = isSelected ? 'background: rgba(74, 20, 140, 0.08); font-weight: 600;' : '';
            return `
                <tr onclick="seleccionarCliente('${c.id}')" style="cursor: pointer; transition: var(--transition); ${styleBg}">
                    <td><strong>#${c.id}</strong></td>
                    <td>${esc(c.nombre)}</td>
                    <td>${esc(c.empresa)}</td>
                    <td>
                        <div>${esc(c.contacto)}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted);">${esc(c.telefono)}</div>
                    </td>
                    <td><span class="status-badge ${c.estadoBadge}">${esc(c.estado)}</span></td>
                    <td>
                        <button class="icon-btn" onclick="event.stopPropagation(); seleccionarCliente('${c.id}'); abrirModalEditarCliente();" title="Modificar cliente"><i class="ph ph-pencil-simple"></i></button>
                        ${puede('eliminar') ? `<button class="icon-btn" onclick="event.stopPropagation(); seleccionarCliente('${c.id}'); confirmarEliminarCliente();" title="Eliminar cliente" style="color: #E1306C;"><i class="ph ph-trash"></i></button>` : ''}
                    </td>
                </tr>
            `;
        }).join('');

        return `
            <div class="page-header" style="flex-wrap: wrap; gap: 16px;">
                <div>
                    <h1 class="page-title">Gestión de Clientes</h1>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">Directorio y ABM (Alta, Baja y Modificación) de clientes.</p>
                </div>

                <!-- Botonera ADM Clientes -->
                <div class="adm-toolbar">
                    <button class="btn-adm btn-adm-new" onclick="abrirModalNuevoCliente()" title="Agregar nuevo cliente">
                        <i class="ph ph-plus-circle" style="font-size:1.1rem;"></i> Nuevo
                    </button>
                    <button class="btn-adm" onclick="abrirModalEditarCliente()" title="Modificar cliente seleccionado">
                        <i class="ph ph-pencil-simple" style="font-size:1.1rem;"></i> Modificar
                    </button>
                    ${puede('eliminar') ? `<button class="btn-adm btn-adm-delete" onclick="confirmarEliminarCliente()" title="Eliminar cliente seleccionado">
                        <i class="ph ph-trash" style="font-size:1.1rem;"></i> Eliminar
                    </button>` : ''}
                    <button class="btn-adm" onclick="cancelarClienteAccion()" title="Cancelar operación">
                        <i class="ph ph-x-circle" style="font-size:1.1rem;"></i> Cancelar
                    </button>
                    <button class="btn-adm" onclick="salirClienteAccion()" title="Salir al Dashboard">
                        <i class="ph ph-sign-out" style="font-size:1.1rem;"></i> Salir
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="search-bar" style="border: 1px solid var(--border-color); background: white; flex: 1; max-width: 450px;">
                        <i class="ph ph-magnifying-glass"></i>
                        <input type="text" id="input-search-clientes" value="${state.searchQueryClientes || ''}" oninput="filtrarClientes(this.value)" placeholder="Buscar por nombre, empresa, email o teléfono...">
                    </div>
                    <div class="flex gap-4">
                        <button class="btn" style="border: 1px solid var(--border-color);" onclick="window.modals.filtros()"><i class="ph ph-funnel"></i> Filtros</button>
                        <button class="btn" style="border: 1px solid var(--border-color);" onclick="window.modals.descargarReporte()"><i class="ph ph-export"></i> Exportar</button>
                    </div>
                </div>
                <div class="table-container mt-4">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre Completo</th>
                                <th>Empresa</th>
                                <th>Contacto principal</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHTML}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    consultas: () => {
        const query = (state.searchQueryConsultas || '').toLowerCase().trim();
        const todasConsultas = state.consultas || [];
        const consultasLista = todasConsultas.filter(ticket => 
            ticket.cliente.toLowerCase().includes(query) ||
            ticket.asunto.toLowerCase().includes(query) ||
            ticket.mensaje.toLowerCase().includes(query) ||
            ticket.id.toLowerCase().includes(query) ||
            (ticket.email && ticket.email.toLowerCase().includes(query))
        );
        const ticketActivo = consultasLista.find(c => c.id === state.selectedConsultaId) || consultasLista[0] || null;

        const ticketListHTML = consultasLista.length === 0 ? `
            <div style="padding: 40px 16px; text-align: center; color: var(--text-muted);">
                <i class="ph ph-tray" style="font-size: 3rem; margin-bottom: 12px; color: var(--border-color);"></i>
                <p style="font-weight: 600; font-size: 1rem; color: var(--text-main);">No hay consultas registradas</p>
                <p style="font-size: 0.85rem; margin-top: 4px;">Filtro: "${state.searchQueryConsultas}". Haz clic en <strong>Nuevo</strong> para crear una.</p>
            </div>
        ` : consultasLista.map(ticket => {
            const isSelected = ticketActivo && ticket.id === ticketActivo.id;
            const styleSelected = isSelected ? 'background: rgba(74, 20, 140, 0.06); border-left: 4px solid var(--primary-main); font-weight: 600;' : '';
            return `
                <div onclick="seleccionarConsulta('${ticket.id}')" style="padding: 16px; border-bottom: 1px solid var(--border-color); cursor: pointer; transition: var(--transition); ${styleSelected}">
                    <div class="flex" style="justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-weight: 600; font-size: 0.95rem;">${esc(ticket.cliente)}</span>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">${esc(ticket.hora)}</span>
                    </div>
                    <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 4px;">${esc(ticket.asunto)}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${esc(ticket.mensaje)}</div>
                    <div class="flex gap-4 mt-4">
                        <span class="status-badge ${ticket.estadoBadge}" style="font-size: 0.7rem; padding: 2px 8px;">${esc(ticket.estado)}</span>
                        ${ticket.prioridad === 'Alta' || ticket.prioridad === 'Urgente' ? `<span style="font-size: 0.7rem; font-weight: 600; color: ${ticket.prioridad === 'Urgente' ? '#E1306C' : '#D97706'}; display: flex; align-items: center; gap: 2px;"><i class="ph ph-warning"></i> ${ticket.prioridad}</span>` : ''}
                        <span style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
                            <i class="ph ${ticket.canalIcon}" style="${ticket.canalColor ? 'color:' + ticket.canalColor : ''}"></i> ${esc(ticket.canal)}
                        </span>
                    </div>
                </div>
            `;
        }).join('');

        const detalleHTML = !ticketActivo ? `
            <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--text-muted); padding: 40px;">
                <i class="ph ph-chats-teardrop" style="font-size:4rem; margin-bottom:16px; opacity:0.3; color: var(--primary-main);"></i>
                <h3 style="font-size: 1.2rem; color: var(--primary-dark);">Ninguna consulta seleccionada</h3>
                <p style="font-size:0.9rem; margin-top:4px;">Selecciona una consulta de la lista o crea una nueva con el botón <strong>Nuevo</strong>.</p>
            </div>
        ` : `
            <div style="padding: 16px 24px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                <div class="flex gap-4" style="align-items: center;">
                    <div class="avatar" style="width: 44px; height: 44px; font-size: 1.1rem; background: var(--primary-main); color: white;">
                        ${esc(ticketActivo.cliente.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase())}
                    </div>
                    <div>
                        <h3 style="font-size: 1.1rem; margin-bottom: 2px;">${esc(ticketActivo.cliente)}</h3>
                        <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 8px;">
                            <i class="ph ${ticketActivo.canalIcon}"></i> ${esc(ticketActivo.email)} | Ticket #${ticketActivo.id}${ticketActivo.agente ? ' | Agente: ' + esc(ticketActivo.agente) : ''}
                        </div>
                    </div>
                </div>
                <div class="flex gap-4">
                    ${puede('asignar') ? `<button class="btn" style="border: 1px solid var(--border-color);" onclick="window.modals.asignarCaso()"><i class="ph ph-user-plus"></i> Asignar</button>` : ''}
                    <button class="btn btn-primary" onclick="window.modals.marcarResuelto()"><i class="ph ph-check-circle"></i> Marcar Resuelto</button>
                </div>
            </div>
            
            <div style="flex: 1; padding: 24px; overflow-y: auto; background: var(--bg-light);">
                <div style="text-align: center; margin-bottom: 24px;">
                    <span style="font-size: 0.75rem; background: var(--border-color); padding: 4px 12px; border-radius: 12px; color: var(--text-muted);">${esc(ticketActivo.hora)}</span>
                </div>
                
                ${(ticketActivo.mensajes || []).map(m => m.tipo === 'cliente' ? `
                    <div style="display: flex; gap: 16px; margin-bottom: 24px;">
                        <div class="avatar" style="width: 36px; height: 36px; font-size: 0.9rem; flex-shrink: 0;">
                            ${esc(ticketActivo.cliente.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase())}
                        </div>
                        <div style="background: white; padding: 16px; border-radius: 0 12px 12px 12px; box-shadow: var(--shadow-sm); max-width: 80%;">
                            <p style="font-size: 0.95rem; line-height: 1.5; white-space: pre-wrap;">${enlazar(m.texto)}</p>
                        </div>
                    </div>
                ` : `
                    <div style="display: flex; gap: 16px; margin-bottom: 24px; flex-direction: row-reverse;">
                        <div class="avatar" style="width: 36px; height: 36px; font-size: 0.9rem; flex-shrink: 0; background: var(--accent-lime); color: var(--primary-dark);">A</div>
                        <div style="background: var(--primary-main); color: white; padding: 16px; border-radius: 12px 0 12px 12px; box-shadow: var(--shadow-sm); max-width: 80%;">
                            <p style="font-size: 0.95rem; line-height: 1.5; white-space: pre-wrap;">${enlazar(m.texto)}</p>
                            ${m.adjunto ? `
                                <div style="margin-top: 12px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px; display: flex; align-items: center; gap: 12px; cursor: pointer;">
                                    <i class="ph ph-file-pdf" style="font-size: 1.5rem; color: var(--accent-lime);"></i>
                                    <div>
                                        <div style="font-size: 0.85rem; font-weight: 600;">${esc(m.adjunto)}</div>
                                        <div style="font-size: 0.75rem; opacity: 0.8;">1.2 MB</div>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
                ${ticketActivo.solucion ? `
                    <div style="background: rgba(174, 234, 0, 0.15); border: 1px solid rgba(174, 234, 0, 0.6); padding: 16px; border-radius: 12px;">
                        <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 6px;"><i class="ph ph-check-circle"></i> Solución aplicada</div>
                        <p style="font-size: 0.95rem; line-height: 1.5; white-space: pre-wrap;">${esc(ticketActivo.solucion)}</p>
                    </div>
                ` : ''}
            </div>

            <div style="padding: 16px; border-top: 1px solid var(--border-color); background: white;">
                <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); display: flex; flex-direction: column;">
                    <textarea id="responder-input-txt" placeholder="Escribe tu respuesta..." style="border: none; padding: 16px; resize: none; outline: none; font-family: inherit; font-size: 0.95rem; min-height: 80px;"></textarea>
                    <div style="padding: 12px 16px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: var(--bg-light); border-radius: 0 0 var(--radius-md) var(--radius-md);">
                        <div class="flex gap-4">
                            <button class="icon-btn" onclick="window.modals.adjuntar()"><i class="ph ph-paperclip"></i></button>
                            <button class="icon-btn"><i class="ph ph-image"></i></button>
                            <button class="icon-btn"><i class="ph ph-smiley"></i></button>
                        </div>
                        <button class="btn btn-accent" onclick="enviarRespuestaChat()"><i class="ph ph-paper-plane-right"></i> Enviar</button>
                    </div>
                </div>
            </div>
        `;

        return `
            <div class="page-header" style="flex-wrap: wrap; gap: 16px;">
                <div>
                    <h1 class="page-title">Gestión de Consultas (Help Desk)</h1>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">Atiende, responde y administra tus tickets con la botonera ADM.</p>
                </div>

                <!-- Botonera ADM -->
                <div class="adm-toolbar">
                    <button class="btn-adm btn-adm-new" onclick="abrirModalNuevaConsulta()" title="Crear nueva consulta">
                        <i class="ph ph-plus-circle" style="font-size:1.1rem;"></i> Nuevo
                    </button>
                    <button class="btn-adm" onclick="abrirModalEditarConsulta()" title="Modificar consulta seleccionada">
                        <i class="ph ph-pencil-simple" style="font-size:1.1rem;"></i> Modificar
                    </button>
                    ${puede('eliminar') ? `<button class="btn-adm btn-adm-delete" onclick="confirmarEliminarConsulta()" title="Eliminar consulta seleccionada">
                        <i class="ph ph-trash" style="font-size:1.1rem;"></i> Eliminar
                    </button>` : ''}
                    <button class="btn-adm" onclick="cancelarConsultaAccion()" title="Cancelar operación">
                        <i class="ph ph-x-circle" style="font-size:1.1rem;"></i> Cancelar
                    </button>
                    <button class="btn-adm" onclick="salirConsultaAccion()" title="Salir al Dashboard">
                        <i class="ph ph-sign-out" style="font-size:1.1rem;"></i> Salir
                    </button>
                </div>
            </div>

            <div class="grid" style="grid-template-columns: 350px 1fr; gap: 24px; height: calc(100vh - 220px);">
                <!-- Lista de tickets -->
                <div class="card" style="padding: 0; display: flex; flex-direction: column; overflow: hidden;">
                    <div style="padding: 16px; border-bottom: 1px solid var(--border-color); background: var(--bg-light);">
                        <div class="search-bar" style="width: 100%; border: 1px solid var(--border-color); background: white;">
                            <i class="ph ph-magnifying-glass"></i>
                            <input type="text" id="input-search-consultas" value="${state.searchQueryConsultas || ''}" oninput="filtrarConsultas(this.value)" placeholder="Buscar ticket...">
                        </div>
                        <div class="flex gap-4 mt-4" style="font-size: 0.85rem; color: var(--text-muted);">
                            <span style="color: var(--primary-main); font-weight: 600; border-bottom: 2px solid var(--primary-main); padding-bottom: 4px; cursor: pointer;">
                                Consultas (${consultasLista.length})
                            </span>
                        </div>
                    </div>
                    <div style="overflow-y: auto; flex: 1;">
                        ${ticketListHTML}
                    </div>
                </div>

                <!-- Vista detallada chat -->
                <div class="card" style="padding: 0; display: flex; flex-direction: column;">
                    ${detalleHTML}
                </div>
            </div>
        `;
    },

    multicanal: () => {
        const canales = state.canales; // de /api/canales; null en modo demo o mientras cargan
        const tarjeta = c => `
            <div class="card" style="border-top: 4px solid ${esc(c.color)};${c.activo ? '' : ' opacity: 0.7;'}">
                <div class="flex" style="justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 40px; height: 40px; background: var(--bg-light); color: ${esc(c.color)}; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                            <i class="ph ${esc(c.icono)}"></i>
                        </div>
                        <div>
                            <h3 style="font-size: 1.1rem; font-weight: 600;">${esc(c.nombre)}</h3>
                            <span style="font-size: 0.8rem; color: var(--text-muted);">${esc(c.codigo)}</span>
                        </div>
                    </div>
                    <input type="checkbox" ${c.activo ? 'checked' : ''} onchange="cambiarActivoCanal(${c.id}, this.checked)" aria-label="${c.activo ? 'Desactivar' : 'Activar'} ${esc(c.nombre)}" title="${c.activo ? 'Desactivar' : 'Activar'} canal" style="width: 20px; height: 20px; accent-color: var(--accent-lime); cursor: pointer;">
                </div>
                <div style="margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 8px;">
                        <span style="color: var(--text-muted);">Estado:</span>
                        ${c.activo
                            ? '<span style="color: #25D366; font-weight: 600;"><i class="ph ph-check-circle"></i> Activo</span>'
                            : '<span style="color: var(--text-muted); font-weight: 600;"><i class="ph ph-prohibit"></i> Desactivado</span>'}
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 8px;">
                        <span style="color: var(--text-muted);">Consultas abiertas:</span>
                        <span style="font-weight: 500;">${c.consultas_activas}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                        <span style="color: var(--text-muted);">Consultas totales:</span>
                        <span style="font-weight: 500;">${c.total_consultas}</span>
                    </div>
                </div>
                <button class="btn" style="width: 100%; justify-content: center; border: 1px solid var(--border-color);" onclick="window.modals.configurarCanal(${c.id})">Configurar</button>
            </div>`;
        return `
        <div class="page-header">
            <div>
                <h1 class="page-title">Gestión Multicanal</h1>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">Activa y administra los canales por los que entran las consultas. Un canal desactivado no acepta consultas nuevas.</p>
            </div>
            <button class="btn btn-primary" onclick="window.modals.nuevoCanal()" ${canales ? '' : 'disabled'}><i class="ph ph-plugs"></i> Nuevo Canal</button>
        </div>

        ${canales
            ? `<div class="grid grid-cols-3">${canales.map(tarjeta).join('')}</div>`
            : `<p style="color: var(--text-muted);">${window.apiService.isOnline ? 'Cargando canales...' : 'Sin conexión a la API: los canales se administran con la base conectada.'}</p>`}
    `;
    },

    usuarios: () => {
        const usuarios = state.usuarios; // de /api/usuarios; null mientras carga o sin API
        const badge = { 'Activo': 'status-resolved', 'Ocupado': 'status-pending', 'Inactivo': 'status-new' };
        const fecha = f => f ? `${f.slice(8, 10)}/${f.slice(5, 7)}/${f.slice(0, 4)} ${f.slice(11, 16)}` : 'Nunca';
        const filas = (usuarios || []).map(u => `
                <tr>
                    <td><strong>${esc(u.nombre_completo)}</strong>${u.id === state.user.id ? ' <span style="color: var(--text-muted); font-size: 0.8rem;">(vos)</span>' : ''}</td>
                    <td>${esc(u.email)}</td>
                    <td>${esc(u.rol_nombre)}</td>
                    <td>
                        <span class="status-badge ${badge[u.estado] || ''}">${esc(u.estado)}</span>
                        ${u.bloqueado ? '<span class="status-badge" style="background: rgba(225,48,108,0.1); color: #E1306C;"><i class="ph ph-lock"></i> Bloqueado</span>' : ''}
                    </td>
                    <td style="font-size: 0.85rem; color: var(--text-muted);">${fecha(u.ultimo_acceso)}</td>
                    <td>
                        <button class="icon-btn" onclick="abrirModalUsuario(${u.id})" title="Modificar usuario" aria-label="Modificar ${esc(u.nombre_completo)}"><i class="ph ph-pencil-simple"></i></button>
                        ${u.bloqueado ? `<button class="icon-btn" onclick="guardarUsuario({ id: ${u.id}, desbloquear: true }, 'Cuenta desbloqueada.')" title="Desbloquear cuenta" aria-label="Desbloquear ${esc(u.nombre_completo)}"><i class="ph ph-lock-open"></i></button>` : ''}
                    </td>
                </tr>`).join('');
        return `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Usuarios y Roles</h1>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">Altas, roles, estado y contraseñas del personal. Para dar de baja a alguien, pasalo a Inactivo: su historial se conserva.</p>
                </div>
                <button class="btn btn-primary" onclick="abrirModalUsuario()" ${usuarios ? '' : 'disabled'}><i class="ph ph-user-plus"></i> Nuevo Usuario</button>
            </div>
            <div class="card">
                ${usuarios ? `
                <div class="table-container">
                    <table>
                        <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Último acceso</th><th>Acciones</th></tr></thead>
                        <tbody>${filas}</tbody>
                    </table>
                </div>` : `<p style="color: var(--text-muted);">${window.apiService.isOnline ? 'Cargando usuarios...' : 'Sin conexión a la API: los usuarios se administran con la base conectada.'}</p>`}
            </div>
        `;
    },

    reportes: () => {
        const r = state.reportes; // datos de /api/reportes/analitica; null en modo demo o mientras cargan
        const k = r ? r.kpis : {};
        const kpi = (titulo, valor, detalle, color = 'var(--primary-main)') => `
                <div style="padding: 16px; border-right: 1px solid var(--border-color);">
                    <div style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 8px;">${titulo}</div>
                    <div style="font-size: 2rem; font-weight: 700; color: ${color};">${valor}</div>
                    <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 4px;">${detalle}</div>
                </div>`;
        const sinDatos = r ? 'Sin datos' : '—';
        return `
        <div class="page-header">
            <div>
                <h1 class="page-title">Reportes y Estadísticas</h1>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">Analiza el rendimiento del equipo y los canales.</p>
            </div>
            <div class="flex gap-4">
                <select aria-label="Período del reporte" onchange="cambiarPeriodoReportes(this.value)" style="padding: 8px 16px; border: 1px solid var(--border-color); border-radius: var(--radius-full); outline: none; background: white;">
                    ${[[7, 'Últimos 7 días'], [30, 'Últimos 30 días'], [90, 'Últimos 90 días'], [0, 'Todo el período']].map(([v, t]) => `<option value="${v}" ${state.reportesDias === v ? 'selected' : ''}>${t}</option>`).join('')}
                </select>
                <button class="btn btn-accent" onclick="navigateTo('pdf')"><i class="ph ph-file-pdf"></i> Generar PDF</button>
            </div>
        </div>

        <div class="grid grid-cols-2 mb-4">
            <div class="card">
                <h3 class="card-title mb-4">Tiempo Promedio a la 1ra Respuesta por Canal</h3>
                <div style="height: 250px; display:flex; align-items:center; justify-content:center; background:#f9f9f9; border-radius: 8px;">
                    ${r && !r.tiempos_por_canal.labels.length ? '<span style="color: var(--text-muted);">Ninguna consulta respondida en el período.</span>' : '<canvas id="chartTiempos"></canvas>'}
                </div>
            </div>
            <div class="card">
                <h3 class="card-title mb-4">Resolución por Agente</h3>
                <div style="height: 250px; display:flex; align-items:center; justify-content:center; background:#f9f9f9; border-radius: 8px;">
                    <canvas id="chartAgentes"></canvas>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h3 class="card-title mb-4">Métricas KPIs${r ? ` <span style="font-weight: 400; font-size: 0.85rem; color: var(--text-muted);">· ${r.total_consultas} consultas en el período</span>` : ''}</h3>
            <div class="grid grid-cols-4">
                ${kpi('Satisfacción del Cliente (CSAT)', k.csat != null ? k.csat + '%' : sinDatos,
                    r ? `${k.encuestas_respondidas} de ${k.encuestas_enviadas} encuestas respondidas${k.nps != null ? ' · NPS ' + k.nps : ''}` : '')}
                ${kpi('Tiempo de 1ra Respuesta', k.tiempo_primera_respuesta_min != null ? k.tiempo_primera_respuesta_min + ' min' : sinDatos, 'Desde que entra la consulta hasta que responde un agente')}
                ${kpi('Tasa de Resolución', k.tasa_resolucion != null ? k.tasa_resolucion + '%' : sinDatos, r ? `${k.resueltas} de ${r.total_consultas} consultas resueltas` : '')}
                ${kpi('Tickets Escalados', k.tickets_escalados != null ? k.tickets_escalados + '%' : sinDatos, r ? `${k.escaladas} a cargo de un supervisor` : '', '#E1306C')}
            </div>
        </div>
    `;
    },

    historial: () => {
        const eventos = state.historial;
        const texto = (state.searchQueryHistorial || '').toLowerCase();
        const filtrados = (eventos || []).filter(e =>
            (state.filtroHistorialAccion === 'Todos' || e.accion === state.filtroHistorialAccion) &&
            (!texto || [e.codigo_ticket, e.nota, e.usuario_nombre, e.asignado_nombre].some(v => (v || '').toLowerCase().includes(texto)))
        );
        const colores = { 'Creación': 'var(--primary-light)', 'Cierre': 'var(--accent-lime)', 'Eliminación': '#E1306C', 'Asignación': 'var(--primary-main)', 'Canal desactivado': '#E1306C', 'Canal activado': 'var(--accent-lime)', 'Encuesta respondida': 'var(--accent-lime)' };
        // cambiado_en viene como "AAAA-MM-DD HH:MM:SS": se recorta sin pasar por Date para no correr la zona horaria
        const fecha = f => `${f.slice(8, 10)}/${f.slice(5, 7)}/${f.slice(0, 4)} ${f.slice(11, 16)}`;
        return `
        <div class="page-header">
            <div>
                <h1 class="page-title">Historial y Auditoría</h1>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">Registro de cada cambio en las consultas (altas, estados, asignaciones, cierres, encuestas y bajas), de los inicios y cierres de sesión, de los reportes PDF y de los canales.</p>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="flex gap-4">
                    <div class="search-bar" style="border: 1px solid var(--border-color); background: white;">
                        <i class="ph ph-magnifying-glass"></i>
                        <input type="text" id="input-search-historial" value="${esc(state.searchQueryHistorial)}" oninput="filtrarHistorial(this.value)" placeholder="Buscar ticket, usuario o detalle..." aria-label="Buscar en el historial">
                    </div>
                    <select onchange="state.filtroHistorialAccion = this.value; render();" aria-label="Filtrar por tipo de evento" style="padding: 8px 16px; border: 1px solid var(--border-color); border-radius: var(--radius-full); outline: none;">
                        ${['Todos', 'Creación', 'Cambio de estado', 'Asignación', 'Cierre', 'Edición', 'Eliminación', 'Encuesta enviada', 'Encuesta respondida', 'Inicio de sesión', 'Cierre de sesión', 'Exportación PDF', 'Canal creado', 'Canal activado', 'Canal desactivado', 'Edición de canal'].map(a => `<option value="${a}" ${state.filtroHistorialAccion === a ? 'selected' : ''}>${a === 'Todos' ? 'Todos los eventos' : a}</option>`).join('')}
                    </select>
                </div>
            </div>
            
            <div style="position: relative; margin-top: 32px; padding-left: 24px;">
                <div style="position: absolute; left: 31px; top: 0; bottom: 0; width: 2px; background: var(--border-color);"></div>
                ${filtrados.map(e => `
                <div style="position: relative; margin-bottom: 32px; display: flex; gap: 24px;">
                    <div style="width: 16px; height: 16px; border-radius: 50%; background: ${colores[e.accion] || 'var(--border-color)'}; border: 4px solid white; position: relative; z-index: 2; margin-top: 4px; flex-shrink: 0; box-shadow: 0 0 0 1px var(--border-color);"></div>
                    <div style="flex: 1;">
                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 4px;">${fecha(e.cambiado_en)} - <strong>${esc(e.usuario_nombre || 'Sistema')}</strong></div>
                        <div style="font-size: 1rem; font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            ${esc(e.accion)}${e.codigo_ticket ? ` · Ticket #${esc(e.codigo_ticket)}` : ''}
                            ${e.estado ? `<span class="status-badge ${badgeEstadoConsulta(e.estado)}">${esc(e.estado)}</span>` : ''}
                        </div>
                        ${e.nota || e.asignado_nombre ? `<div style="background: ${e.accion === 'Eliminación' ? 'rgba(225, 48, 108, 0.05)' : 'var(--bg-light)'}; padding: 12px; border-radius: 8px; font-size: 0.9rem; border: 1px solid var(--border-color); white-space: pre-wrap;">${esc(e.nota || '')}${e.asignado_nombre ? `${e.nota ? '\n' : ''}Responsable: ${esc(e.asignado_nombre)}` : ''}</div>` : ''}
                    </div>
                </div>`).join('')}
                ${filtrados.length ? '' : `<p style="color: var(--text-muted); padding: 0 0 24px 24px;">${!eventos ? 'Sin conexión a la API.' : eventos.length ? 'No hay eventos que coincidan.' : 'Todavía no hay eventos registrados.'}</p>`}
            </div>
        </div>
    `;
    },

    configuracion: () => `
        <div class="page-header">
            <div>
                <h1 class="page-title">Configuración del Sistema</h1>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">Ajustes generales, usuarios y seguridad.</p>
            </div>
            <button class="btn btn-primary" onclick="window.modals.guardarConfig()">Guardar Cambios</button>
        </div>

        <div class="grid" style="grid-template-columns: 250px 1fr; gap: 32px;">
            <div class="card" style="padding: 16px;">
                <div style="font-weight: 600; margin-bottom: 16px; padding: 0 8px; color: var(--primary-dark);">Menú</div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <div style="padding: 10px 16px; background: rgba(74, 20, 140, 0.1); color: var(--primary-main); border-radius: 8px; font-weight: 500; cursor: pointer;">Empresa y General</div>
                    <div onclick="navigateTo('usuarios')" style="padding: 10px 16px; color: var(--text-muted); border-radius: 8px; cursor: pointer; transition: all 0.2s;">Usuarios y Roles</div>
                    <div style="padding: 10px 16px; color: var(--text-muted); border-radius: 8px; cursor: pointer; transition: all 0.2s;">Seguridad</div>
                    <div style="padding: 10px 16px; color: var(--text-muted); border-radius: 8px; cursor: pointer; transition: all 0.2s;">Notificaciones</div>
                </div>
            </div>
            
            <div class="card">
                <h3 class="card-title mb-4">Información de la Empresa</h3>
                
                <div class="grid grid-cols-2 mb-4">
                    <div class="login-form">
                        <div class="form-group">
                            <label>Nombre de la Empresa</label>
                            <input type="text" value="AtyÑe’ẽ S.A.">
                        </div>
                    </div>
                    <div class="login-form">
                        <div class="form-group">
                            <label>RUC / ID Fiscal</label>
                            <input type="text" value="80012345-6">
                        </div>
                    </div>
                </div>
                
                <div class="login-form mb-4">
                    <div class="form-group">
                        <label>Dirección</label>
                        <input type="text" value="Av. Aviadores del Chaco 2050, Asunción">
                    </div>
                </div>

                <hr style="border: none; border-top: 1px solid var(--border-color); margin: 32px 0;">

                <h3 class="card-title mb-4">Personalización Visual</h3>
                
                <div class="flex gap-4 mb-4" style="align-items: center;">
                    <div style="width: 80px; height: 80px; background: var(--bg-light); border: 2px dashed var(--border-color); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: var(--text-muted); cursor: pointer;">
                        <i class="ph ph-image"></i>
                    </div>
                    <div>
                        <div style="font-weight: 600; margin-bottom: 4px;">Logotipo de la empresa</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">Recomendado: 512x512px, formato PNG transparente.</div>
                        <button class="btn" style="border: 1px solid var(--border-color); padding: 6px 12px; font-size: 0.8rem;" onclick="window.modals.adjuntar()">Subir imagen</button>
                    </div>
                </div>
            </div>
        </div>
    `,

    pdf: () => {
        const r = state.reportes; // los mismos datos que la vista Reportes; null en modo demo o mientras cargan
        const k = r ? r.kpis : {};
        const periodo = NOMBRE_PERIODO[state.reportesDias];
        const hoy = new Date().toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const min = v => v != null ? v + ' min' : '—';
        const pct = v => v != null ? v + '%' : '—';
        const tarjeta = (titulo, valor, color) => `
                        <div style="background: var(--bg-light); padding: 16px; border-radius: 8px; border-left: 4px solid ${color};">
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${titulo}</div>
                            <div style="font-size: 1.5rem; font-weight: 700;">${valor}</div>
                        </div>`;
        const th = (t, izq) => `<th style="padding: 12px; color: white; text-align: ${izq ? 'left' : 'center'}; font-size: 0.9rem;">${t}</th>`;
        const td = (t, izq) => `<td style="padding: 12px; text-align: ${izq ? 'left' : 'center'};">${t}</td>`;
        const tabla = (titulo, columnas, filas, vacio) => `
                <div style="margin-bottom: 40px;">
                    <h2 style="font-size: 1.2rem; color: var(--primary-main); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">${titulo}</h2>
                    ${filas.length ? `
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead><tr style="background: var(--primary-main); color: white;">${columnas.map((c, i) => th(c, i === 0)).join('')}</tr></thead>
                        <tbody>${filas.map(f => `<tr style="border-bottom: 1px solid var(--border-color);">${f.map((c, i) => td(c, i === 0)).join('')}</tr>`).join('')}</tbody>
                    </table>` : `<p style="color: var(--text-muted);">${vacio}</p>`}
                </div>`;
        return `
        <div class="pdf-barra no-print">
            <button class="btn" onclick="navigateTo('reportes')" style="border: 1px solid var(--border-color);"><i class="ph ph-arrow-left"></i> Volver a Reportes</button>
            <button class="btn btn-primary" onclick="imprimirReporte()" ${r ? '' : 'disabled'}><i class="ph ph-printer"></i> Imprimir / Guardar PDF</button>
        </div>
        <div class="pdf-fondo" style="background: #e5e5e5; padding: 40px; min-height: 100vh; display: flex; justify-content: center;">
            <div class="pdf-hoja" style="background: white; width: 210mm; min-height: 297mm; padding: 20mm; box-shadow: var(--shadow-lg); position: relative;">
                
                <!-- Encabezado PDF -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid var(--primary-main); padding-bottom: 20px; margin-bottom: 30px;">
                    <div>
                        <h1 style="font-size: 2rem; color: var(--primary-dark); margin-bottom: 8px;">AtyÑe’ẽ</h1>
                        <div style="font-size: 1rem; color: var(--text-muted);">Reporte Analítico de Gestión</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 600; margin-bottom: 4px;">Período: ${periodo}</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">Generado: ${hoy}${state.user ? ` por ${esc(state.user.nombre_completo)}` : ''}</div>
                    </div>
                </div>

                ${r ? `
                <!-- Resumen Ejecutivo -->
                <div style="margin-bottom: 40px;">
                    <h2 style="font-size: 1.2rem; color: var(--primary-main); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px;">Resumen Ejecutivo</h2>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
                        ${tarjeta('Total Consultas', r.total_consultas, 'var(--primary-main)')}
                        ${tarjeta('Tasa Resolución', pct(k.tasa_resolucion), 'var(--accent-lime)')}
                        ${tarjeta('Tiempo 1ra Respuesta', min(k.tiempo_primera_respuesta_min), '#25D366')}
                        ${tarjeta('Tickets Escalados', pct(k.tickets_escalados), '#E1306C')}
                    </div>
                </div>

                ${tabla('Rendimiento por Canal', ['Canal', 'Volumen', 'T. Medio 1ra Resp.'],
                    r.por_canal.map(c => [esc(c.canal), `${c.volumen} (${Math.round(c.volumen * 100 / r.total_consultas)}%)`, min(c.tiempo_primera_respuesta_min)]),
                    'No hay consultas en el período.')}

                ${tabla('Rendimiento por Agente', ['Agente', 'Atendidos', 'Resueltos'],
                    r.agentes.filter(a => a.total_atendidos).map(a => [esc(a.nombre_completo), a.total_atendidos, a.resueltos]),
                    'Ningún agente tiene consultas asignadas en el período.')}

                <p style="font-size: 0.9rem;"><strong>Satisfacción del cliente:</strong> ${k.csat != null
                    ? `CSAT ${k.csat}% · NPS ${k.nps} (${k.encuestas_respondidas} de ${k.encuestas_enviadas} encuestas respondidas)`
                    : `sin encuestas respondidas en el período${k.encuestas_enviadas ? ` (${k.encuestas_enviadas} enviadas)` : ''}`}.</p>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">CSAT: % de clientes que calificaron la atención con 4 o 5. NPS: % que nos recomendaría (9-10) menos % que no (0-6).</p>
                ` : `<p style="color: var(--text-muted);">${window.apiService.isOnline ? 'Cargando datos...' : 'Sin conexión a la API: no hay datos para el reporte.'}</p>`}
            </div>
        </div>
    `;
    },

    database: () => `
        <div class="page-header" style="flex-wrap: wrap; gap: 16px;">
            <div>
                <h1 class="page-title"><i class="ph ph-database" style="color: var(--accent-lime); margin-right: 8px;"></i> Base de Datos Relacional SQL</h1>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">
                    Arquitectura de datos para <strong>AtyÑe’ẽ</strong>. Scripts listos para desplegar en <strong>PostgreSQL</strong> y <strong>MySQL / MariaDB</strong>.
                </p>
            </div>
            <div class="flex gap-4">
                <button class="btn btn-primary" onclick="window.downloadSQLScript('schema_postgresql.sql')">
                    <i class="ph ph-download-simple"></i> PostgreSQL .sql
                </button>
                <button class="btn" style="border: 1px solid var(--border-color); background: white;" onclick="window.downloadSQLScript('schema_mysql.sql')">
                    <i class="ph ph-download-simple"></i> MySQL .sql
                </button>
            </div>
        </div>

        <!-- Badges de tecnología -->
        <div class="flex gap-4 mb-6" style="flex-wrap: wrap;">
            <span style="background: rgba(74, 20, 140, 0.1); color: var(--primary-main); font-weight: 600; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; display: flex; align-items: center; gap: 6px;">
                <i class="ph ph-check-circle-fill"></i> PostgreSQL 12+ (pgAdmin / Supabase)
            </span>
            <span style="background: rgba(37, 211, 102, 0.1); color: #1e7e34; font-weight: 600; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; display: flex; align-items: center; gap: 6px;">
                <i class="ph ph-check-circle-fill"></i> MySQL 8.0+ / MariaDB (Workbench / phpMyAdmin)
            </span>
            <span style="background: rgba(174, 234, 0, 0.2); color: var(--primary-dark); font-weight: 600; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; display: flex; align-items: center; gap: 6px;">
                <i class="ph ph-check-circle-fill"></i> Visual Studio C# EF Core Ready
            </span>
        </div>

        <!-- Pestañas de Vista -->
        <div class="card mb-6" style="padding: 16px; background: white;">
            <div class="flex gap-4" style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; font-size: 0.95rem; font-weight: 600;">
                <button class="btn db-tab-btn active-db-tab" id="db-tab-er" onclick="switchDbTab('er')">
                    <i class="ph ph-tree-structure"></i> Diagrama de Tablas E-R
                </button>
                <button class="btn db-tab-btn" id="db-tab-pg" onclick="switchDbTab('pg')">
                    <i class="ph ph-code"></i> Script PostgreSQL (.sql)
                </button>
                <button class="btn db-tab-btn" id="db-tab-my" onclick="switchDbTab('my')">
                    <i class="ph ph-code"></i> Script MySQL (.sql)
                </button>
                <button class="btn db-tab-btn" id="db-tab-seed" onclick="switchDbTab('seed')">
                    <i class="ph ph-database-plus"></i> Datos Semilla (seed.sql)
                </button>
                <button class="btn db-tab-btn" id="db-tab-guide" onclick="switchDbTab('guide')">
                    <i class="ph ph-book-open"></i> Guía Visual Studio
                </button>
            </div>

            <!-- Tab 1: Diagrama de Tablas E-R -->
            <div id="db-content-er" class="db-tab-content mt-4">
                <div class="grid grid-cols-3 gap-4">

                    <!-- Tabla Usuarios -->
                    <div style="border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; background: var(--bg-white);">
                        <div style="background: var(--primary-main); color: white; padding: 10px 14px; font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
                            <span><i class="ph ph-user-gear"></i> usuarios</span>
                            <span style="font-size: 0.75rem; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px;">7 Columnas</span>
                        </div>
                        <table style="width: 100%; font-size: 0.82rem; border-collapse: collapse;">
                            <tr style="border-bottom: 1px solid var(--border-color); background: var(--bg-light);">
                                <td style="padding: 6px 10px; font-weight: 700; color: #d97706;">🔑 id</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">INT (PK, Auto)</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 6px 10px;">nombre_completo</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">VARCHAR(120)</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 6px 10px;">email</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">VARCHAR(150) UNIQUE</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 6px 10px;">password_hash</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">VARCHAR(255)</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color); background: #f0fdf4;">
                                <td style="padding: 6px 10px; font-weight: 600; color: var(--primary-main);">🔗 rol_id</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">INT (FK -> roles.id)</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 6px 10px;">estado</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">ENUM('Activo','Inactivo')</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 10px;">created_at</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">TIMESTAMP</td>
                            </tr>
                        </table>
                    </div>

                    <!-- Tabla Clientes -->
                    <div style="border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; background: var(--bg-white);">
                        <div style="background: var(--primary-main); color: white; padding: 10px 14px; font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
                            <span><i class="ph ph-users-three"></i> clientes</span>
                            <span style="font-size: 0.75rem; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px;">7 Columnas</span>
                        </div>
                        <table style="width: 100%; font-size: 0.82rem; border-collapse: collapse;">
                            <tr style="border-bottom: 1px solid var(--border-color); background: var(--bg-light);">
                                <td style="padding: 6px 10px; font-weight: 700; color: #d97706;">🔑 id</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">INT (PK, Auto)</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 6px 10px;">nombre_completo</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">VARCHAR(150)</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 6px 10px;">telefono</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">VARCHAR(30) INDEX</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 6px 10px;">email</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">VARCHAR(150) INDEX</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color); background: #f0fdf4;">
                                <td style="padding: 6px 10px; font-weight: 600; color: var(--primary-main);">🔗 canal_preferido_id</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">INT (FK -> canales.id)</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 6px 10px;">estado</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">ENUM('Activo','VIP')</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 10px;">fecha_registro</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">TIMESTAMP</td>
                            </tr>
                        </table>
                    </div>

                    <!-- Tabla Consultas (Tickets) -->
                    <div style="border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; background: var(--bg-white);">
                        <div style="background: var(--accent-lime); color: var(--primary-dark); padding: 10px 14px; font-weight: 700; display: flex; justify-content: space-between; align-items: center;">
                            <span><i class="ph ph-ticket"></i> consultas (Tickets)</span>
                            <span style="font-size: 0.75rem; background: rgba(0,0,0,0.1); padding: 2px 8px; border-radius: 4px;">10 Columnas</span>
                        </div>
                        <table style="width: 100%; font-size: 0.82rem; border-collapse: collapse;">
                            <tr style="border-bottom: 1px solid var(--border-color); background: var(--bg-light);">
                                <td style="padding: 6px 10px; font-weight: 700; color: #d97706;">🔑 id</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">INT (PK, Auto)</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 6px 10px; font-weight: 600;">codigo_ticket</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">VARCHAR(20) UNIQUE</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color); background: #f0fdf4;">
                                <td style="padding: 6px 10px; font-weight: 600; color: var(--primary-main);">🔗 cliente_id</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">INT (FK -> clientes.id)</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color); background: #f0fdf4;">
                                <td style="padding: 6px 10px; font-weight: 600; color: var(--primary-main);">🔗 canal_id</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">INT (FK -> canales.id)</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color); background: #f0fdf4;">
                                <td style="padding: 6px 10px; font-weight: 600; color: var(--primary-main);">🔗 usuario_asignado_id</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">INT (FK -> usuarios.id)</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 6px 10px;">asunto</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">VARCHAR(200)</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 6px 10px;">prioridad</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">ENUM('Alta','Media','Baja')</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 6px 10px;">estado</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">ENUM('Nuevo','En Proceso'...)</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 10px;">fecha_creacion</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">TIMESTAMP</td>
                            </tr>
                        </table>
                    </div>

                    <!-- Tabla Canales -->
                    <div style="border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; background: var(--bg-white);">
                        <div style="background: var(--primary-dark); color: white; padding: 10px 14px; font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
                            <span><i class="ph ph-plugs-connected"></i> canales</span>
                            <span style="font-size: 0.75rem; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px;">6 Columnas</span>
                        </div>
                        <table style="width: 100%; font-size: 0.82rem; border-collapse: collapse;">
                            <tr style="border-bottom: 1px solid var(--border-color); background: var(--bg-light);">
                                <td style="padding: 6px 10px; font-weight: 700; color: #d97706;">🔑 id</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">INT (PK)</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 6px 10px;">nombre</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">WhatsApp, Email, etc.</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 6px 10px;">codigo</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">WHATSAPP, EMAIL, etc.</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 10px;">activo</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">BOOLEAN</td>
                            </tr>
                        </table>
                    </div>

                    <!-- Tabla Historial Interacciones -->
                    <div style="border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; background: var(--bg-white);">
                        <div style="background: var(--primary-dark); color: white; padding: 10px 14px; font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
                            <span><i class="ph ph-chats"></i> historial_interacciones</span>
                            <span style="font-size: 0.75rem; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px;">6 Columnas</span>
                        </div>
                        <table style="width: 100%; font-size: 0.82rem; border-collapse: collapse;">
                            <tr style="border-bottom: 1px solid var(--border-color); background: var(--bg-light);">
                                <td style="padding: 6px 10px; font-weight: 700; color: #d97706;">🔑 id</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">INT (PK)</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color); background: #f0fdf4;">
                                <td style="padding: 6px 10px; font-weight: 600; color: var(--primary-main);">🔗 consulta_id</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">INT (FK -> consultas.id)</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color); background: #f0fdf4;">
                                <td style="padding: 6px 10px; font-weight: 600; color: var(--primary-main);">🔗 usuario_id</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">INT (FK -> usuarios.id)</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 6px 10px;">es_cliente</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">BOOLEAN</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 10px;">mensaje</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">TEXT</td>
                            </tr>
                        </table>
                    </div>

                    <!-- Tabla Historial de Estado (RF-50, DCU007) -->
                    <div style="border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; background: var(--bg-white);">
                        <div style="background: var(--primary-dark); color: white; padding: 10px 14px; font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
                            <span><i class="ph ph-clock-counter-clockwise"></i> historial_estado</span>
                            <span style="font-size: 0.75rem; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px;">9 Columnas</span>
                        </div>
                        <table style="width: 100%; font-size: 0.82rem; border-collapse: collapse;">
                            <tr style="border-bottom: 1px solid var(--border-color); background: var(--bg-light);">
                                <td style="padding: 6px 10px; font-weight: 700; color: #d97706;">🔑 id</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">INT (PK)</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color); background: #f0fdf4;">
                                <td style="padding: 6px 10px; font-weight: 600; color: var(--primary-main);">🔗 consulta_id</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">INT (FK -> consultas.id)</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color); background: #f0fdf4;">
                                <td style="padding: 6px 10px; font-weight: 600; color: var(--primary-main);">🔗 usuario_id</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">INT (FK -> usuarios.id)</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 6px 10px;">codigo_ticket</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">VARCHAR(20) NULL</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 6px 10px;">accion</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">VARCHAR(30)</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 6px 10px;">cambiado_en</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">DATETIME</td>
                            </tr>
                        </table>
                    </div>

                    <!-- Tabla Encuesta de Satisfacción (RF-41) -->
                    <div style="border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; background: var(--bg-white);">
                        <div style="background: var(--primary-dark); color: white; padding: 10px 14px; font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
                            <span><i class="ph ph-smiley"></i> encuesta_satisfaccion</span>
                            <span style="font-size: 0.75rem; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px;">8 Columnas</span>
                        </div>
                        <table style="width: 100%; font-size: 0.82rem; border-collapse: collapse;">
                            <tr style="border-bottom: 1px solid var(--border-color); background: var(--bg-light);">
                                <td style="padding: 6px 10px; font-weight: 700; color: #d97706;">🔑 id</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">INT (PK)</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color); background: #f0fdf4;">
                                <td style="padding: 6px 10px; font-weight: 600; color: var(--primary-main);">🔗 consulta_id</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">INT (FK -> consultas.id)</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 6px 10px;">token</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">CHAR(32) UNIQUE</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 6px 10px;">csat</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">1 a 5</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 6px 10px;">nps</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">0 a 10</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 6px 10px;">respondido_en</td>
                                <td style="padding: 6px 10px; color: var(--text-muted);">DATETIME</td>
                            </tr>
                        </table>
                    </div>

                </div>
            </div>

            <!-- Tab 2: Script PostgreSQL -->
            <div id="db-content-pg" class="db-tab-content mt-4" style="display: none;">
                <div class="flex justify-between items-center mb-3">
                    <span style="font-size: 0.9rem; font-weight: 600; color: var(--primary-dark);">
                        <i class="ph ph-file-code"></i> schema_postgresql.sql
                    </span>
                    <button class="btn btn-accent" onclick="copySQLToClipboard('pg-code-block')">
                        <i class="ph ph-copy"></i> Copiar Código SQL
                    </button>
                </div>
                <pre id="pg-code-block" data-archivo="database/schema_postgresql.sql" style="background: #1E0B36; color: #AEEA00; padding: 20px; border-radius: 8px; font-family: monospace; font-size: 0.85rem; max-height: 450px; overflow-y: auto; white-space: pre-wrap;">Cargando database/schema_postgresql.sql...</pre>
            </div>

            <!-- Tab 3: Script MySQL -->
            <div id="db-content-my" class="db-tab-content mt-4" style="display: none;">
                <div class="flex justify-between items-center mb-3">
                    <span style="font-size: 0.9rem; font-weight: 600; color: var(--primary-dark);">
                        <i class="ph ph-file-code"></i> schema_mysql.sql
                    </span>
                    <button class="btn btn-accent" onclick="copySQLToClipboard('my-code-block')">
                        <i class="ph ph-copy"></i> Copiar Código SQL
                    </button>
                </div>
                <pre id="my-code-block" data-archivo="database/schema_mysql.sql" style="background: #1E0B36; color: #AEEA00; padding: 20px; border-radius: 8px; font-family: monospace; font-size: 0.85rem; max-height: 450px; overflow-y: auto; white-space: pre-wrap;">Cargando database/schema_mysql.sql...</pre>
            </div>

            <!-- Tab 4: Seed Data -->
            <div id="db-content-seed" class="db-tab-content mt-4" style="display: none;">
                <div class="flex justify-between items-center mb-3">
                    <span style="font-size: 0.9rem; font-weight: 600; color: var(--primary-dark);">
                        <i class="ph ph-database-plus"></i> seed_data.sql (Datos de Prueba)
                    </span>
                    <button class="btn btn-accent" onclick="copySQLToClipboard('seed-code-block')">
                        <i class="ph ph-copy"></i> Copiar Datos Semilla
                    </button>
                </div>
                <pre id="seed-code-block" data-archivo="database/seed_data.sql" style="background: #1E0B36; color: #AEEA00; padding: 20px; border-radius: 8px; font-family: monospace; font-size: 0.85rem; max-height: 450px; overflow-y: auto; white-space: pre-wrap;">Cargando database/seed_data.sql...</pre>
            </div>

            <!-- Tab 5: Guía Visual Studio -->
            <div id="db-content-guide" class="db-tab-content mt-4" style="display: none;">
                <div style="background: var(--bg-light); padding: 24px; border-radius: 8px; border-left: 4px solid var(--primary-main);">
                    <h3 style="font-size: 1.1rem; color: var(--primary-dark); margin-bottom: 12px;">
                        <i class="ph ph-brackets-angle"></i> Cómo migrar estas tablas a Visual Studio C# (Entity Framework Core)
                    </h3>
                    <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 16px;">
                        Para implementar esta base de datos en tu proyecto de Visual Studio en C#, puedes usar <strong>EF Core DB First (Scaffold-DbContext)</strong> o definir la clase <code>DbContext</code> con las siguientes entidades:
                    </p>
                    <div style="background: white; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 0.85rem; border: 1px solid var(--border-color); color: var(--primary-dark);">
                        public class Consulta {<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;public int Id { get; set; }<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;public string CodigoTicket { get; set; }<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;public int ClienteId { get; set; }<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;public Cliente Cliente { get; set; }<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;public int CanalId { get; set; }<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;public Canal Canal { get; set; }<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;public string Asunto { get; set; }<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;public string Estado { get; set; }<br>
                        }
                    </div>
                </div>
            </div>

        </div>
    `
};

// --- Main Layout Template ---

const layout = (content) => `
    <div class="app-container">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="sidebar-logo">
                    <i class="ph ph-chats-teardrop"></i>
                </div>
                <div>
                    <div class="sidebar-title">AtyÑe’ẽ</div>
                    <div class="sidebar-subtitle">Gestión Multicanal</div>
                </div>
            </div>
            <nav class="sidebar-nav">
                <a class="nav-item ${state.currentView === 'dashboard' ? 'active' : ''}" onclick="navigateTo('dashboard')">
                    <i class="ph ph-squares-four"></i> Dashboard
                </a>
                <a class="nav-item ${state.currentView === 'clientes' ? 'active' : ''}" onclick="navigateTo('clientes')">
                    <i class="ph ph-users"></i> Clientes
                </a>
                <a class="nav-item ${state.currentView === 'consultas' ? 'active' : ''}" onclick="navigateTo('consultas')">
                    <i class="ph ph-tray"></i> Bandeja (Consultas)
                </a>
                ${puede('multicanal') ? `
                <a class="nav-item ${state.currentView === 'multicanal' ? 'active' : ''}" onclick="navigateTo('multicanal')">
                    <i class="ph ph-plugs-connected"></i> Canales
                </a>
                ` : ''}
                ${puede('reportes') ? `
                <a class="nav-item ${state.currentView === 'reportes' ? 'active' : ''}" onclick="navigateTo('reportes')">
                    <i class="ph ph-chart-bar"></i> Reportes
                </a>
                ` : ''}
                ${puede('historial') ? `
                <a class="nav-item ${state.currentView === 'historial' ? 'active' : ''}" onclick="navigateTo('historial')">
                    <i class="ph ph-clock-counter-clockwise"></i> Historial
                </a>
                ` : ''}
                ${puede('usuarios') ? `
                <a class="nav-item ${state.currentView === 'usuarios' ? 'active' : ''}" onclick="navigateTo('usuarios')">
                    <i class="ph ph-user-gear"></i> Usuarios
                </a>
                ` : ''}
                ${puede('database') ? `
                <a class="nav-item ${state.currentView === 'database' ? 'active' : ''}" onclick="navigateTo('database')">
                    <i class="ph ph-database"></i> Base de Datos SQL
                </a>
                ` : ''}
                ${puede('configuracion') ? `
                <a class="nav-item ${state.currentView === 'configuracion' ? 'active' : ''}" onclick="navigateTo('configuracion')">
                    <i class="ph ph-gear"></i> Configuración
                </a>
                ` : ''}
            </nav>
            <div style="padding: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
                <a class="nav-item" onclick="cerrarSesion()" style="padding: 0;">
                    <i class="ph ph-sign-out"></i> Cerrar Sesión
                </a>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Topbar -->
            <header class="topbar">
                <div class="search-bar">
                    <i class="ph ph-magnifying-glass"></i>
                    <input type="text" id="input-search-global" value="${state.searchQueryGlobal || ''}" oninput="filtrarGlobal(this.value)" placeholder="Buscar clientes, consultas...">
                </div>
                <div class="topbar-actions">
                    ${(n => `<button class="icon-btn" onclick="navigateTo('consultas')" title="Consultas abiertas asignadas a vos" aria-label="${n ? n + (n === 1 ? ' consulta abierta asignada' : ' consultas abiertas asignadas') + ' a vos' : 'Sin consultas abiertas asignadas a vos'}">
                        <i class="ph ph-bell"></i>
                        ${n ? `<span class="badge">${n}</span>` : ''}
                    </button>`)(misConsultasAbiertas())}
                    <div class="user-profile">
                        <div class="avatar">${esc((state.user?.nombre_completo || '?').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase())}</div>
                        <div class="user-info">
                            <div class="name">${esc(state.user?.nombre_completo)}</div>
                            <div class="role">${esc(state.user?.rol_nombre)}</div>
                        </div>
                        ${state.user?.id ? `<button class="icon-btn" onclick="window.modals.cambiarClave()" title="Cambiar contraseña" aria-label="Cambiar contraseña" style="margin-left: 8px;"><i class="ph ph-key"></i></button>` : ''}
                    </div>
                </div>
            </header>

            <!-- Page Content -->
            <div class="page-content" id="page-content">
                ${content}
            </div>
        </main>
    </div>
`;

// --- Routing & Rendering ---

function render() {
    const app = document.getElementById('app');
    const viewContent = views[state.currentView]();
    
    if (state.currentView === 'login' || state.currentView === 'pdf') {
        app.innerHTML = viewContent;
    } else {
        app.innerHTML = layout(viewContent);
    }

    // Initialize Charts if needed (si se renderiza dos veces seguidas, crear los gráficos una sola vez)
    clearTimeout(render.chartTimer);
    render.chartTimer = setTimeout(() => {
        if (state.currentView === 'dashboard') initDashboardCharts();
        if (state.currentView === 'reportes') initReportesCharts();
        if (state.currentView === 'database') cargarScriptsSQL();
    }, 100);
}

window.navigateTo = (viewName) => {
    state.currentView = !state.user ? 'login' : puede(viewName) ? viewName : 'dashboard';
    render();
    if (state.currentView === 'dashboard') cargarDashboard();
    if (state.currentView === 'reportes') cargarReportes();
    if (state.currentView === 'historial') cargarHistorial();
    if (state.currentView === 'multicanal') cargarCanales();
    if (state.currentView === 'usuarios') cargarUsuarios();
};

// Íconos de Phosphor que se ofrecen al crear un canal
const ICONOS_CANAL = [
    ['ph-chat-circle-dots', 'Chat genérico'], ['ph-whatsapp-logo', 'WhatsApp'], ['ph-telegram-logo', 'Telegram'],
    ['ph-facebook-logo', 'Facebook'], ['ph-instagram-logo', 'Instagram'], ['ph-envelope-simple', 'Correo'],
    ['ph-phone', 'Teléfono'], ['ph-globe', 'Sitio web'], ['ph-tiktok-logo', 'TikTok'], ['ph-x-logo', 'X / Twitter']
];

async function cargarCanales() {
    const datos = await window.apiService.fetchCanales();
    if (!datos) return;
    state.canales = datos;
    if (state.currentView === 'multicanal') render();
}

// metodo: 'crearCanal' o 'actualizarCanal' de apiService
async function guardarCanal(metodo, datos, mensajeOk) {
    const res = await window.apiService[metodo](datos);
    if (!res || !res.success) {
        showToast('No se pudo guardar el canal' + (res && res.message ? ': ' + res.message : '.'));
    } else {
        showToast(mensajeOk);
    }
    await cargarCanales();
}

window.cambiarActivoCanal = function(id, activo) {
    const c = state.canales.find(x => x.id === id);
    guardarCanal('actualizarCanal', { id, activo }, 'Canal ' + c.nombre + (activo ? ' activado.' : ' desactivado.'));
};

const NOMBRE_PERIODO = { 7: 'Últimos 7 días', 30: 'Últimos 30 días', 90: 'Últimos 90 días', 0: 'Todo el período' };

window.imprimirReporte = function() {
    const periodo = NOMBRE_PERIODO[state.reportesDias];
    window.apiService.registrarEvento('Exportación PDF', 'Reporte analítico · ' + periodo);
    window.print();
};

// La vista Base de Datos muestra los scripts reales de database/, no una copia que se desactualiza
function cargarScriptsSQL() {
    document.querySelectorAll('pre[data-archivo]').forEach(async pre => {
        try {
            const res = await fetch(pre.dataset.archivo);
            pre.textContent = res.ok ? await res.text() : 'No se pudo cargar ' + pre.dataset.archivo + '.';
        } catch (e) {
            pre.textContent = 'No se pudo cargar ' + pre.dataset.archivo + ' (abrí la app desde http://localhost:8000).';
        }
    });
}

// Misma regla que Auth::validarPassword() en la API; acá solo para no cerrar el formulario con una clave que se va a rechazar
const REGLA_CLAVE = 'La contraseña debe tener al menos 8 caracteres, con letras, números y algún carácter especial.';
function claveSegura(c) {
    return c.length >= 8 && /\p{L}/u.test(c) && /\d/.test(c) && /[^\p{L}\d]/u.test(c);
}

async function cargarUsuarios() {
    const [usuarios, roles] = await Promise.all([window.apiService.fetchUsuarios(), window.apiService.fetchRoles()]);
    if (!usuarios || !roles) return;
    state.usuarios = usuarios;
    state.roles = roles;
    if (state.currentView === 'usuarios') render();
}

// datos: lo que va a PUT/POST /api/usuarios (con id es edición)
async function guardarUsuario(datos, mensajeOk) {
    const res = await window.apiService.guardarUsuario(datos);
    showToast(res && res.success ? mensajeOk : 'No se pudo guardar el usuario' + (res && res.message ? ': ' + res.message : '.'));
    await cargarUsuarios();
}

// Alta (sin id) o edición; en la edición, la contraseña es opcional y sirve para restablecerla
window.abrirModalUsuario = function(id) {
    const u = id ? state.usuarios.find(x => x.id === id) : null;
    const yo = u && u.id === state.user.id; // la API no deja quitarse el rol ni desactivarse a uno mismo
    const campoSelect = (idCampo, opciones, actual, deshabilitado) => `
        <select id="${idCampo}" ${deshabilitado ? 'disabled title="No podés cambiar tu propio rol o estado"' : ''} style="width:100%; padding:12px; border:1px solid var(--border-color); border-radius:8px; outline:none; background:var(--bg-white);">
            ${opciones.map(([v, t]) => `<option value="${esc(v)}" ${String(v) === String(actual) ? 'selected' : ''}>${esc(t)}</option>`).join('')}
        </select>`;
    showModal(u ? 'Modificar usuario' : 'Nuevo usuario', `
        <div class="login-form" style="display:flex; flex-direction:column; gap:16px;">
            <div class="form-group"><label for="u-nombre">Nombre completo *</label><input type="text" id="u-nombre" maxlength="120" value="${esc(u?.nombre_completo)}"></div>
            <div class="form-group"><label for="u-email">Correo *</label><input type="email" id="u-email" maxlength="150" value="${esc(u?.email)}"></div>
            <div class="form-group"><label for="u-rol">Rol</label>${campoSelect('u-rol', state.roles.map(r => [r.id, r.nombre]), u?.rol_id ?? state.roles.find(r => r.nombre === 'Agente de Soporte')?.id, yo)}</div>
            ${u ? `<div class="form-group"><label for="u-estado">Estado</label>${campoSelect('u-estado', [['Activo', 'Activo'], ['Ocupado', 'Ocupado'], ['Inactivo', 'Inactivo (no puede entrar)']], u.estado, yo)}</div>` : ''}
            <div class="form-group">
                <label for="u-clave">${u ? 'Nueva contraseña (dejala vacía para no cambiarla)' : 'Contraseña inicial *'}</label>
                <input type="password" id="u-clave" autocomplete="new-password" aria-describedby="u-clave-regla">
                <small id="u-clave-regla" style="color: var(--text-muted);">Al menos 8 caracteres, con letras, números y algún carácter especial. Pasásela a la persona para que la cambie al entrar.</small>
            </div>
        </div>
    `, u ? 'Guardar Cambios' : 'Crear Usuario', () => {
        const datos = {
            nombre_completo: document.getElementById('u-nombre').value.trim(),
            email: document.getElementById('u-email').value.trim(),
            rol_id: parseInt(document.getElementById('u-rol').value, 10)
        };
        const clave = document.getElementById('u-clave').value;
        if (!datos.nombre_completo || !datos.email || (!u && !clave)) { showToast('Completá los campos obligatorios.'); return false; }
        if (clave && !claveSegura(clave)) { showToast(REGLA_CLAVE); return false; }
        if (clave) datos.password = clave;
        if (u) {
            datos.id = u.id;
            datos.estado = document.getElementById('u-estado').value;
        }
        guardarUsuario(datos, u ? 'Usuario actualizado.' : 'Usuario ' + datos.nombre_completo + ' creado.');
    });
};

async function cargarReportes() {
    const datos = await window.apiService.fetchAnalitica(state.reportesDias);
    if (!datos) return;
    state.reportes = datos;
    if (state.currentView === 'reportes' || state.currentView === 'pdf') render();
}

window.cambiarPeriodoReportes = function(dias) {
    state.reportesDias = parseInt(dias, 10);
    cargarReportes();
};

async function cargarHistorial() {
    const datos = await window.apiService.fetchHistorial();
    if (!datos) return;
    state.historial = datos;
    if (state.currentView === 'historial') render();
}

window.filtrarHistorial = function(val) {
    state.searchQueryHistorial = val;
    render();
    const input = document.getElementById('input-search-historial');
    if (input) {
        input.focus();
        input.setSelectionRange(val.length, val.length);
    }
};

// Se pide cada vez que se entra al dashboard, así refleja los cambios hechos en otras pantallas
async function cargarDashboard() {
    if (!window.apiService.isOnline) await window.apiService.checkHealth();
    const datos = await window.apiService.fetchDashboard();
    if (!datos) return;
    state.dashboard = datos;
    if (state.currentView === 'dashboard') render();
}

// --- Sesión ---

window.iniciarSesion = async function() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!window.apiService.isOnline) await window.apiService.checkHealth();
    if (!window.apiService.isOnline) {
        // Sin API la app funciona solo en memoria; no hay contra qué validar
        state.user = { id: null, nombre_completo: 'Modo demo', rol_nombre: 'Sin conexión a la API' };
        state.clientes = structuredClone(DEMO.clientes);
        state.consultas = structuredClone(DEMO.consultas);
        state.selectedConsultaId = state.consultas[0].id;
        state.selectedClienteId = state.clientes[0].id;
        showToast('API no disponible: entrando en modo demo (los cambios no se guardan).');
        navigateTo('dashboard');
        return;
    }

    const res = await window.apiService.login(email, password);
    if (!res || !res.success) {
        showToast(res && res.message ? res.message : 'No se pudo iniciar sesión.');
        return;
    }
    state.user = res.data.user;
    try { sessionStorage.setItem('atynere_user', JSON.stringify(state.user)); } catch (e) {}
    navigateTo('dashboard');
    syncWithBackendIfAvailable(); // la API solo entrega datos con la sesión iniciada
};

window.cerrarSesion = function() {
    if (state.user && state.user.id) window.apiService.logout();
    state.user = null;
    try { sessionStorage.removeItem('atynere_user'); } catch (e) {}
    navigateTo('login');
};

// --- Charts Initialization ---

function initDashboardCharts() {
    const ctx = document.getElementById('chartCanales');
    const chart = state.dashboard && state.dashboard.chart_canales;
    if (ctx && chart) {
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: chart.labels,
                datasets: [{
                    data: chart.data,
                    backgroundColor: chart.colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
}

function initReportesCharts() {
    const r = state.reportes;
    if (!r) return;

    const ctx1 = document.getElementById('chartTiempos');
    if (ctx1) {
        new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: r.tiempos_por_canal.labels,
                datasets: [{
                    label: 'Minutos promedio',
                    data: r.tiempos_por_canal.data,
                    backgroundColor: r.tiempos_por_canal.colors,
                    borderRadius: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    const ctx2 = document.getElementById('chartAgentes');
    if (ctx2) {
        new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: r.agentes.map(a => a.nombre_completo),
                datasets: [
                    { label: 'Asignados', data: r.agentes.map(a => a.total_atendidos), backgroundColor: 'rgba(74, 20, 140, 0.25)', borderRadius: 4 },
                    { label: 'Resueltos', data: r.agentes.map(a => a.resueltos), backgroundColor: '#4A148C', borderRadius: 4 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
        });
    }
}

// --- Modals Logic ---

function showModal(title, contentHTML, confirmText = null, onConfirm = null) {
    let modalRoot = document.getElementById('modal-root');
    if (!modalRoot) {
        modalRoot = document.createElement('div');
        modalRoot.id = 'modal-root';
        document.body.appendChild(modalRoot);
    }
    
    window.currentModalCallback = onConfirm;
    
    let footerHTML = '';
    if (confirmText) {
        footerHTML = `
            <div class="modal-footer">
                <button class="btn" style="border: 1px solid var(--border-color);" onclick="closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="if(!window.currentModalCallback || window.currentModalCallback() !== false) { closeModal(); }">${confirmText}</button>
            </div>
        `;
    } else {
        footerHTML = `
            <div class="modal-footer">
                <button class="btn" style="border: 1px solid var(--border-color);" onclick="closeModal()">Cerrar</button>
            </div>
        `;
    }

    modalRoot.innerHTML = `
        <div class="modal-overlay" id="modal-overlay" onclick="if(event.target === this) closeModal()">
            <div class="modal-container">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="closeModal()"><i class="ph ph-x"></i></button>
                </div>
                <div class="modal-body">
                    ${contentHTML}
                </div>
                ${footerHTML}
            </div>
        </div>
    `;
    
    setTimeout(() => {
        document.getElementById('modal-overlay').classList.add('active');
    }, 10);
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            const root = document.getElementById('modal-root');
            if(root) root.innerHTML = '';
        }, 300);
    }
}

// Escapa texto antes de meterlo en HTML: los datos vienen de la base o de lo que escribe el usuario
// Texto escapado con las URLs convertidas en enlaces (ej. el de la encuesta en el chat)
function enlazar(texto) {
    return esc(texto).replace(/https?:\/\/[^\s<]+/g, u => `<a href="${u}" target="_blank" rel="noopener" style="color: inherit; text-decoration: underline; word-break: break-all;">${u}</a>`);
}

function esc(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function showToast(message, ms = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="ph ph-check-circle"></i> ${esc(message)}`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideInUp 0.3s ease reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, ms);
}

window.modals = {
    nuevoCliente: () => showModal('Nuevo Cliente', `
        <div class="login-form" style="display:flex; flex-direction:column; gap:16px;">
            <div class="form-group"><label>Nombre Completo *</label><input type="text" placeholder="Ej. Juan Pérez"></div>
            <div class="form-group"><label>Empresa</label><input type="text" placeholder="Opcional"></div>
            <div class="form-group"><label>Correo Electrónico *</label><input type="email" placeholder="juan@ejemplo.com"></div>
            <div class="form-group"><label>Teléfono *</label><input type="text" placeholder="+595 9..."></div>
        </div>
    `, 'Guardar Cliente', () => { showToast('Cliente guardado exitosamente'); }),

    editarCliente: () => showModal('Editar Cliente', `
        <div class="login-form" style="display:flex; flex-direction:column; gap:16px;">
            <div class="form-group"><label>Nombre Completo *</label><input type="text" value="María López"></div>
            <div class="form-group"><label>Estado</label>
                <select style="width:100%; padding:12px; border:1px solid var(--border-color); border-radius:8px; outline:none; background:var(--bg-white); color:var(--text-main);">
                    <option>Activo</option><option>Inactivo</option>
                </select>
            </div>
        </div>
    `, 'Actualizar Datos', () => { showToast('Cliente actualizado'); }),

    eliminar: () => showModal('Confirmar Eliminación', `
        <p>¿Estás seguro de que deseas eliminar este registro?</p>
        <p style="color:var(--text-muted); font-size:0.85rem; margin-top:8px;">Esta acción no se puede deshacer y los datos se perderán permanentemente.</p>
    `, 'Eliminar', () => { showToast('Registro eliminado exitosamente'); }),

    descargarReporte: () => showModal('Generar Reporte', `
        <p style="margin-bottom:16px;">Seleccione el formato para descargar el reporte analítico.</p>
        <div style="display:flex; flex-direction:column; gap:12px;">
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;"><input type="radio" name="fmt" checked> PDF Documento</label>
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;"><input type="radio" name="fmt"> Excel CSV</label>
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;"><input type="radio" name="fmt"> JSON (Backup)</label>
        </div>
    `, 'Descargar', () => { showToast('Descarga iniciada...'); }),

    asignarCaso: async () => {
        const consulta = state.consultas.find(c => c.id === state.selectedConsultaId);
        if (!consulta) { showToast('Selecciona una consulta para asignar.'); return; }
        const usuarios = await window.apiService.fetchUsuarios();
        if (!usuarios) { showToast('No se pudo cargar la lista de agentes: la API no está disponible.'); return; }

        showModal('Derivar Caso / Asignar', `
            <div class="login-form" style="display:flex; flex-direction:column; gap:16px;">
                <div class="form-group">
                    <label>Asignar a:</label>
                    <select id="asignar-usuario" style="width:100%; padding:12px; border:1px solid var(--border-color); border-radius:8px; outline:none; background:var(--bg-white); color:var(--text-main);">
                        ${usuarios.map(u => `<option value="${u.id}" ${u.id === consulta.usuarioId ? 'selected' : ''} ${u.estado === 'Inactivo' ? 'disabled' : ''}>${esc(u.nombre_completo)} (${esc(u.rol_nombre)}${u.estado !== 'Activo' ? ' · ' + esc(u.estado) : ''})</option>`).join('')}
                    </select>
                </div>
            </div>
        `, 'Transferir', async () => {
            const usuarioId = parseInt(document.getElementById('asignar-usuario').value, 10);
            const res = await window.apiService.actualizarConsulta({ id: consulta.dbId, usuario_asignado_id: usuarioId });
            if (!res || !res.success) {
                showToast('No se pudo asignar la consulta' + (res && res.message ? ': ' + res.message : '.'));
                return;
            }
            consulta.usuarioId = usuarioId;
            consulta.agente = usuarios.find(u => u.id === usuarioId).nombre_completo;
            if (usuarioId === state.user.id) { // asignársela a uno mismo no merece el aviso de "te asignaron"
                const clave = 'atynere_asignadas_' + state.user.id;
                try {
                    const conocidas = JSON.parse(localStorage.getItem(clave)) || [];
                    localStorage.setItem(clave, JSON.stringify([...conocidas, consulta.dbId]));
                } catch (e) {}
            }
            showToast('Consulta #' + consulta.id + ' asignada a ' + consulta.agente + '.');
            render();
        });
    },

    marcarResuelto: () => {
        const consulta = state.consultas.find(c => c.id === state.selectedConsultaId);
        if (!consulta) { showToast('Selecciona una consulta para cerrar.'); return; }

        showModal('Cerrar Caso', `
            <div class="login-form" style="display:flex; flex-direction:column; gap:16px;">
                <div style="background:rgba(225,48,108,0.1); color:#E1306C; padding:12px; border-radius:8px; font-size:0.85rem; border:1px solid rgba(225,48,108,0.2);">
                    <i class="ph ph-warning-circle"></i> Para cerrar la consulta, es obligatorio registrar la solución aplicada (RF-49).
                </div>
                <div class="form-group">
                    <label>Solución Aplicada *</label>
                    <textarea id="solucion-txt" rows="4" style="width:100%; padding:12px; border:1px solid var(--border-color); border-radius:8px; outline:none; font-family:inherit;" placeholder="Describe cómo se resolvió el problema del cliente...">${esc(consulta.solucion)}</textarea>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <input type="checkbox" id="encuesta" ${window.apiService.isOnline ? 'checked' : 'disabled'} style="width:16px; height:16px; accent-color:var(--primary-main);">
                    <label for="encuesta" style="font-size:0.85rem;">Enviar encuesta de satisfacción al cliente (RF-41)${window.apiService.isOnline ? '' : ' — requiere la API'}</label>
                </div>
            </div>
        `, 'Cerrar Consulta', () => {
            const solucion = document.getElementById('solucion-txt').value.trim();
            if (!solucion) {
                showToast('Registra la solución aplicada para poder cerrar la consulta.');
                return false; // deja la ventana abierta
            }
            cerrarConsulta(consulta, solucion, document.getElementById('encuesta').checked);
        });
    },

    cambiarClave: () => showModal('Cambiar contraseña', `
        <div class="login-form" style="display:flex; flex-direction:column; gap:16px;">
            <div class="form-group">
                <label for="clave-actual">Contraseña actual</label>
                <input type="password" id="clave-actual" autocomplete="current-password">
            </div>
            <div class="form-group">
                <label for="clave-nueva">Contraseña nueva</label>
                <input type="password" id="clave-nueva" autocomplete="new-password" aria-describedby="clave-regla">
                <small id="clave-regla" style="color: var(--text-muted);">Al menos 8 caracteres, con letras, números y algún carácter especial.</small>
            </div>
            <div class="form-group">
                <label for="clave-repetir">Repetir contraseña nueva</label>
                <input type="password" id="clave-repetir" autocomplete="new-password">
            </div>
        </div>
    `, 'Guardar', () => {
        const actual = document.getElementById('clave-actual').value;
        const nueva = document.getElementById('clave-nueva').value;
        if (!actual || !nueva) { showToast('Completá la contraseña actual y la nueva.'); return false; }
        if (nueva !== document.getElementById('clave-repetir').value) { showToast('Las contraseñas nuevas no coinciden.'); return false; }
        if (!claveSegura(nueva)) { showToast(REGLA_CLAVE); return false; }
        (async () => {
            const res = await window.apiService.cambiarClave(actual, nueva);
            showToast(res && res.success ? 'Contraseña actualizada.' : 'No se pudo cambiar la contraseña' + (res && res.message ? ': ' + res.message : '.'));
        })();
    }),

    nuevoCanal: () => showModal('Nuevo Canal', `
        <div class="login-form" style="display:flex; flex-direction:column; gap:16px;">
            <div class="form-group">
                <label for="canal-nombre">Nombre *</label>
                <input type="text" id="canal-nombre" maxlength="50" placeholder="Ej. Telegram">
            </div>
            <div class="form-group">
                <label for="canal-icono">Ícono</label>
                <select id="canal-icono" style="width:100%; padding:12px; border:1px solid var(--border-color); border-radius:8px; outline:none; background:var(--bg-white); color:var(--text-main);">
                    ${ICONOS_CANAL.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="canal-color">Color</label>
                <input type="color" id="canal-color" value="#4A148C" style="height:44px; padding:4px;">
            </div>
        </div>
    `, 'Crear Canal', () => {
        const nombre = document.getElementById('canal-nombre').value.trim();
        if (!nombre) { showToast('Escribí el nombre del canal.'); return false; }
        guardarCanal('crearCanal', {
            nombre,
            icono: document.getElementById('canal-icono').value,
            color: document.getElementById('canal-color').value
        }, 'Canal ' + nombre + ' creado.');
    }),

    configurarCanal: (id) => {
        const c = (state.canales || []).find(x => x.id === id);
        if (!c) return;
        showModal('Configurar ' + esc(c.nombre), `
        <div class="login-form" style="display:flex; flex-direction:column; gap:16px;">
            <div class="form-group">
                <label for="canal-color">Color</label>
                <input type="color" id="canal-color" value="${esc(c.color || '#4A148C')}" style="height:44px; padding:4px;">
            </div>
            <label style="display:flex; align-items:center; justify-content:space-between; padding:16px; background:var(--bg-light); border-radius:8px; border:1px solid var(--border-color); cursor:pointer;">
                <div>
                    <div style="font-size:0.95rem; font-weight:600;">Canal activo</div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">Si está desactivado no se pueden cargar consultas nuevas por este canal</div>
                </div>
                <input type="checkbox" id="canal-activo" ${c.activo ? 'checked' : ''} style="width:20px; height:20px; accent-color:var(--accent-lime);">
            </label>
        </div>
    `, 'Guardar Ajustes', () => {
            guardarCanal('actualizarCanal', {
                id,
                color: document.getElementById('canal-color').value,
                activo: document.getElementById('canal-activo').checked
            }, 'Canal ' + c.nombre + ' actualizado.');
        });
    },

    filtros: () => showModal('Filtros Avanzados', `
        <div class="login-form" style="display:flex; flex-direction:column; gap:16px;">
            <div class="form-group">
                <label>Rango de Fechas</label>
                <div style="display:flex; gap:8px;">
                    <input type="date" style="flex:1;">
                    <input type="date" style="flex:1;">
                </div>
            </div>
            <div class="form-group">
                <label>Estado</label>
                <select style="width:100%; padding:12px; border:1px solid var(--border-color); border-radius:8px; outline:none; background:var(--bg-white); color:var(--text-main);">
                    <option>Todos</option>
                    <option>Activos</option>
                    <option>Inactivos</option>
                </select>
            </div>
        </div>
    `, 'Aplicar Filtros', () => { showToast('Filtros aplicados'); }),
    
    adjuntar: () => showModal('Adjuntar Archivo', `
        <div style="border:2px dashed var(--border-color); border-radius:8px; padding:40px; text-align:center; cursor:pointer; background:var(--bg-light);">
            <i class="ph ph-upload-simple" style="font-size:3rem; color:var(--primary-main); margin-bottom:16px;"></i>
            <h4 style="margin-bottom:8px;">Haz clic o arrastra un archivo aquí</h4>
            <p style="color:var(--text-muted); font-size:0.85rem;">Formatos soportados: PDF, JPG, PNG, DOCX (Max. 10MB)</p>
        </div>
    `, 'Subir Archivo', () => { showToast('Archivo adjuntado al chat'); }),
    
    guardarConfig: () => showModal('Guardar Configuración', `
        <p>¿Estás seguro de que deseas aplicar los cambios en la configuración global del sistema?</p>
        <div style="background:rgba(255,193,7,0.1); color:#856404; padding:12px; border-radius:8px; font-size:0.85rem; border:1px solid rgba(255,193,7,0.2); margin-top:16px;">
            <i class="ph ph-info"></i> Algunos cambios podrían requerir que los usuarios reinicien su sesión.
        </div>
    `, 'Confirmar', () => { showToast('Configuración actualizada correctamente'); })
};

// --- ADM Consultas Logic ---

function seleccionarConsulta(id) {
    state.selectedConsultaId = id;
    render();
    cargarMensajesConsulta(state.consultas.find(c => c.id === id));
}

// Trae la conversación completa desde la base (la lista solo trae el primer mensaje)
async function cargarMensajesConsulta(consulta) {
    if (!consulta || !consulta.dbId || consulta.mensajesCargados || !window.apiService.isOnline) return;
    const detalle = await window.apiService.fetchConsultaDetalle(consulta.dbId);
    if (!detalle) return;
    consulta.mensajes = detalle.mensajes;
    consulta.solucion = detalle.solucion;
    consulta.mensajesCargados = true;
    if (state.selectedConsultaId === consulta.id) render();
}

async function cerrarConsulta(consulta, solucion, enviarEncuesta) {
    let encuesta = null;
    if (window.apiService.isOnline && consulta.dbId) {
        const res = await window.apiService.actualizarConsulta({ id: consulta.dbId, estado: 'Resuelto', solucion, enviar_encuesta: enviarEncuesta });
        if (!res || !res.success) {
            showToast('No se pudo cerrar la consulta' + (res && res.message ? ': ' + res.message : '.'));
            return;
        }
        encuesta = res.data.encuesta;
    }
    consulta.estado = 'Resuelto';
    consulta.estadoBadge = badgeEstadoConsulta('Resuelto');
    consulta.solucion = solucion;
    showToast('Consulta #' + consulta.id + ' marcada como resuelta.'
        + (encuesta ? ' Se envió la encuesta de satisfacción.' : enviarEncuesta && window.apiService.isOnline ? ' Este caso ya tenía encuesta.' : ''));
    if (encuesta) { // el enlace queda como mensaje en el chat: volver a traer la conversación
        consulta.mensajesCargados = false;
        await cargarMensajesConsulta(consulta);
    }
    render();
}

// Mismos permisos que $permisos en api/index.php; acá solo se ocultan pantallas y botones, la API es la que bloquea
const PERMISOS = {
    multicanal: ['Administrador'], database: ['Administrador'], configuracion: ['Administrador'], usuarios: ['Administrador'],
    reportes: ['Administrador', 'Supervisor'], pdf: ['Administrador', 'Supervisor'], historial: ['Administrador', 'Supervisor'],
    eliminar: ['Administrador'], asignar: ['Administrador', 'Supervisor']
};
function puede(clave) {
    const roles = PERMISOS[clave];
    return !roles || !state.user || !state.user.id || roles.includes(state.user.rol_nombre); // modo demo (sin id): todo visible
}

const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Urgente']; // mismos valores que el ENUM/CHECK de consultas.prioridad

// Mismo criterio que mapEstadoBadge() en ConsultasController.php
function badgeEstadoConsulta(estado) {
    return { 'Nuevo': 'status-new', 'En Proceso': 'status-process', 'Pendiente': 'status-pending', 'Resuelto': 'status-resolved', 'Cerrado': 'status-resolved' }[estado] || 'status-pending';
}

function abrirModalNuevaConsulta() {
    showModal('Nueva Consulta', `
        <div class="login-form" style="display:flex; flex-direction:column; gap:16px;">
            <div class="form-group">
                <label>Nombre del Cliente *</label>
                <input type="text" id="c-cliente" placeholder="Ej. Juan Pérez" required>
            </div>
            <div class="form-group">
                <label>Correo Electrónico / Contacto *</label>
                <input type="email" id="c-email" placeholder="cliente@correo.com" required>
            </div>
            <div class="form-group">
                <label>Canal de Entrada</label>
                <select id="c-canal" style="width:100%; padding:12px; border:1px solid var(--border-color); border-radius:8px; outline:none; background:var(--bg-white);">
                    ${state.canales
                        ? state.canales.filter(c => c.activo).map(c => `<option value="${c.id}">${esc(c.nombre)}</option>`).join('')
                        : '<option value="WhatsApp">WhatsApp</option><option value="Email">Email</option><option value="Instagram">Instagram</option>'}
                </select>
            </div>
            <div class="form-group">
                <label for="c-prioridad">Prioridad</label>
                <select id="c-prioridad" style="width:100%; padding:12px; border:1px solid var(--border-color); border-radius:8px; outline:none; background:var(--bg-white);">
                    ${PRIORIDADES.map(p => `<option value="${p}" ${p === 'Media' ? 'selected' : ''}>${p}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Asunto de la Consulta *</label>
                <input type="text" id="c-asunto" placeholder="Ej. Problema con pedido" required>
            </div>
            <div class="form-group">
                <label>Mensaje / Detalle</label>
                <textarea id="c-mensaje" rows="3" style="width:100%; padding:12px; border:1px solid var(--border-color); border-radius:8px; outline:none; font-family:inherit;" placeholder="Escriba los detalles de la consulta..."></textarea>
            </div>
        </div>
    `, 'Guardar Consulta', async () => {
        const cliente = document.getElementById('c-cliente')?.value || 'Cliente Nuevo';
        const email = document.getElementById('c-email')?.value || 'contacto@ejemplo.com';
        const canal = document.getElementById('c-canal')?.value || 'WhatsApp';
        const asunto = document.getElementById('c-asunto')?.value || 'Consulta General';
        const mensaje = document.getElementById('c-mensaje')?.value || 'Sin detalle adicional.';

        if (window.apiService.isOnline) {
            const res = await window.apiService.crearConsulta({ cliente_nombre: cliente, cliente_email: email, canal_id: parseInt(canal, 10), asunto, mensaje, prioridad: document.getElementById('c-prioridad').value });
            if (!res || !res.success) {
                showToast('No se pudo guardar la consulta en la base de datos' + (res && res.message ? ': ' + res.message : '.'));
                return;
            }
            // La API puede haber creado también el cliente: recargar ambas listas desde la base
            await syncWithBackendIfAvailable();
            seleccionarConsulta(res.data.codigo_ticket);
            showToast('Nueva consulta #' + res.data.codigo_ticket + ' creada correctamente.');
            return;
        }

        let canalIcon = 'ph-chats-teardrop';
        let canalColor = '';
        if (canal === 'WhatsApp') { canalIcon = 'ph-whatsapp-logo'; canalColor = '#25D366'; }
        else if (canal === 'Email') { canalIcon = 'ph-envelope-simple'; }
        else if (canal === 'Instagram') { canalIcon = 'ph-instagram-logo'; canalColor = '#E1306C'; }

        const newId = 'TK-' + Math.floor(1000 + Math.random() * 9000);
        const newTicket = {
            id: newId,
            cliente,
            email,
            asunto,
            mensaje,
            canal,
            canalIcon,
            canalColor,
            estado: 'Pendiente',
            estadoBadge: 'status-pending',
            hora: 'Hace un momento',
            mensajes: [
                { tipo: 'cliente', texto: mensaje, hora: 'Hace un momento' }
            ]
        };

        state.consultas.unshift(newTicket);
        state.selectedConsultaId = newId;
        showToast('Nueva consulta #' + newId + ' creada correctamente.');
        render();
    });
}

function abrirModalEditarConsulta() {
    const consulta = state.consultas.find(c => c.id === state.selectedConsultaId);
    if (!consulta) {
        showToast('Selecciona una consulta para modificar.');
        return;
    }
    
    showModal('Modificar Consulta #' + consulta.id, `
        <div class="login-form" style="display:flex; flex-direction:column; gap:16px;">
            <div class="form-group">
                <label>Cliente</label>
                <input type="text" value="${esc(consulta.cliente)}${consulta.email ? ' (' + esc(consulta.email) + ')' : ''}" disabled title="Los datos del cliente se modifican en la pantalla Clientes">
            </div>
            <div class="form-group">
                <label>Asunto</label>
                <input type="text" id="e-asunto" value="${esc(consulta.asunto)}">
            </div>
            <div class="form-group">
                <label>Estado del Ticket</label>
                <select id="e-estado" style="width:100%; padding:12px; border:1px solid var(--border-color); border-radius:8px; outline:none; background:var(--bg-white);">
                    <option value="Nuevo" ${consulta.estado === 'Nuevo' ? 'selected' : ''}>Nuevo</option>
                    <option value="Pendiente" ${consulta.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="En Proceso" ${consulta.estado === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
                    <option value="Resuelto" ${consulta.estado === 'Resuelto' ? 'selected' : ''}>Resuelto</option>
                </select>
            </div>
            <div class="form-group">
                <label for="e-prioridad">Prioridad</label>
                <select id="e-prioridad" style="width:100%; padding:12px; border:1px solid var(--border-color); border-radius:8px; outline:none; background:var(--bg-white);">
                    ${PRIORIDADES.map(p => `<option value="${p}" ${p === (consulta.prioridad || 'Media') ? 'selected' : ''}>${p}</option>`).join('')}
                </select>
            </div>
        </div>
    `, 'Guardar Cambios', async () => {
        const asunto = document.getElementById('e-asunto')?.value || consulta.asunto;
        const nuevoEstado = document.getElementById('e-estado')?.value || consulta.estado;
        const prioridad = document.getElementById('e-prioridad').value;

        if (window.apiService.isOnline && consulta.dbId) {
            const res = await window.apiService.actualizarConsulta({ id: consulta.dbId, asunto, estado: nuevoEstado, prioridad });
            if (!res || !res.success) {
                showToast('No se pudo actualizar la consulta en la base de datos' + (res && res.message ? ': ' + res.message : '.'));
                return;
            }
        }

        consulta.asunto = asunto;
        consulta.prioridad = prioridad;
        consulta.estado = nuevoEstado;
        consulta.estadoBadge = badgeEstadoConsulta(nuevoEstado);

        showToast('Consulta #' + consulta.id + ' actualizada.');
        render();
    });
}

function confirmarEliminarConsulta() {
    const consulta = state.consultas.find(c => c.id === state.selectedConsultaId);
    if (!consulta) {
        showToast('Selecciona una consulta para eliminar.');
        return;
    }

    showModal('Confirmar Eliminación de Consulta', `
        <div style="text-align:center; padding:10px 0;">
            <i class="ph ph-warning-diamond" style="font-size:3.5rem; color:#E1306C; margin-bottom:12px;"></i>
            <h4 style="font-size:1.1rem; margin-bottom:8px;">¿Eliminar la consulta <strong>#${consulta.id}</strong>?</h4>
            <p style="color:var(--text-muted); font-size:0.9rem;">Cliente: <strong>${esc(consulta.cliente)}</strong> (${esc(consulta.asunto)})</p>
            <p style="color:#E1306C; font-size:0.85rem; margin-top:12px; background:rgba(225,48,108,0.1); padding:8px; border-radius:6px;">
                Esta acción eliminará la consulta permanentemente de la lista de atención${consulta.dbId ? ', junto con todos sus mensajes' : ''}.
            </p>
        </div>
    `, 'Sí, Eliminar Ticket', async () => {
        if (window.apiService.isOnline && consulta.dbId) {
            const res = await window.apiService.eliminarConsulta(consulta.dbId);
            if (!res || !res.success) {
                showToast('No se pudo eliminar la consulta de la base de datos' + (res && res.message ? ': ' + res.message : '.'));
                return;
            }
        }
        const idEliminado = consulta.id;
        state.consultas = state.consultas.filter(c => c.id !== idEliminado);
        if (state.consultas.length > 0) {
            state.selectedConsultaId = state.consultas[0].id;
        } else {
            state.selectedConsultaId = null;
        }
        showToast('Consulta #' + idEliminado + ' eliminada permanentemente.');
        render();
    });
}

function cancelarConsultaAccion() {
    showToast('Operación cancelada.');
}

function salirConsultaAccion() {
    navigateTo('dashboard');
}

async function enviarRespuestaChat() {
    const txtInput = document.getElementById('responder-input-txt');
    const texto = txtInput ? txtInput.value.trim() : '';
    if (!texto) {
        showToast('Por favor escribe un mensaje antes de enviar.');
        return;
    }
    const consulta = state.consultas.find(c => c.id === state.selectedConsultaId);
    if (!consulta || enviarRespuestaChat.enviando) return; // RN-53: un doble clic no manda dos veces

    // Primero se guarda en la base; si falla, el texto queda en el cuadro y no se muestra como enviado
    if (window.apiService.isOnline && consulta.dbId) {
        enviarRespuestaChat.enviando = true;
        const res = await window.apiService.enviarMensaje(consulta.dbId, texto);
        enviarRespuestaChat.enviando = false;
        if (!res || !res.success) {
            showToast('No se pudo enviar la respuesta' + (res && res.message ? ': ' + res.message : '. Revisá la conexión y probá de nuevo.'));
            return;
        }
    }

    if (!consulta.mensajes) consulta.mensajes = [];
    consulta.mensajes.push({ tipo: 'agente', texto, hora: 'Ahora' });
    // Misma regla que addMensaje() en la API: solo un ticket Nuevo pasa a En Proceso al responder
    if (consulta.estado === 'Nuevo') {
        consulta.estado = 'En Proceso';
        consulta.estadoBadge = badgeEstadoConsulta('En Proceso');
    }
    showToast('Respuesta enviada al cliente.');
    render();
}


// --- ADM Clientes Logic & Functions ---

function seleccionarCliente(id) {
    state.selectedClienteId = id;
    render();
}

function abrirModalNuevoCliente() {
    showModal('Nuevo Cliente', `
        <div class="login-form" style="display:flex; flex-direction:column; gap:16px;">
            <div class="form-group">
                <label>Nombre Completo *</label>
                <input type="text" id="cl-nombre" placeholder="Ej. Pedro Benítez" required>
            </div>
            <div class="form-group">
                <label>Empresa / Organización</label>
                <input type="text" id="cl-empresa" placeholder="Ej. Comercial Benítez S.A.">
            </div>
            <div class="form-group">
                <label>Correo Electrónico / Contacto *</label>
                <input type="email" id="cl-email" placeholder="pedro@ejemplo.com" required>
            </div>
            <div class="form-group">
                <label>Teléfono de Contacto</label>
                <input type="text" id="cl-telefono" placeholder="+595 981 000 000">
            </div>
            <div class="form-group">
                <label>Estado del Cliente</label>
                <select id="cl-estado" style="width:100%; padding:12px; border:1px solid var(--border-color); border-radius:8px; outline:none; background:var(--bg-white);">
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="VIP">VIP</option>
                </select>
            </div>
        </div>
    `, 'Guardar Cliente', async () => {
        const nombre = document.getElementById('cl-nombre')?.value || 'Cliente Nuevo';
        const empresa = document.getElementById('cl-empresa')?.value || 'Particular';
        const contacto = document.getElementById('cl-email')?.value || 'contacto@ejemplo.com';
        const telefono = document.getElementById('cl-telefono')?.value || '+595 900 000000';
        const estado = document.getElementById('cl-estado')?.value || 'Activo';

        let newId = 'CL-00' + (state.clientes.length + 1);
        let dbId;
        if (window.apiService.isOnline) {
            const res = await window.apiService.crearCliente({ nombre_completo: nombre, email: contacto, telefono, estado, notas: empresa });
            if (!res || !res.success) {
                showToast('No se pudo guardar el cliente en la base de datos' + (res && res.message ? ': ' + res.message : '.'));
                return;
            }
            dbId = res.data.id;
            newId = 'CL-00' + dbId; // mismo formato que syncWithBackendIfAvailable
        }
        const estadoBadge = (estado === 'Activo' || estado === 'VIP') ? 'status-resolved' : 'status-pending';

        const newCliente = {
            id: newId,
            dbId,
            nombre,
            empresa,
            contacto,
            telefono,
            estado,
            estadoBadge,
            fechaRegistro: new Date().toLocaleDateString('es-ES')
        };

        state.clientes.unshift(newCliente);
        state.selectedClienteId = newId;
        showToast('Cliente #' + newId + ' registrado correctamente.');
        render();
    });
}

function abrirModalEditarCliente() {
    const cliente = state.clientes.find(c => c.id === state.selectedClienteId);
    if (!cliente) {
        showToast('Selecciona un cliente de la lista para modificar.');
        return;
    }

    showModal('Modificar Cliente #' + cliente.id, `
        <div class="login-form" style="display:flex; flex-direction:column; gap:16px;">
            <div class="form-group">
                <label>Nombre Completo</label>
                <input type="text" id="cl-e-nombre" value="${esc(cliente.nombre)}">
            </div>
            <div class="form-group">
                <label>Empresa</label>
                <input type="text" id="cl-e-empresa" value="${esc(cliente.empresa)}">
            </div>
            <div class="form-group">
                <label>Correo Electrónico</label>
                <input type="email" id="cl-e-email" value="${esc(cliente.contacto)}">
            </div>
            <div class="form-group">
                <label>Teléfono</label>
                <input type="text" id="cl-e-telefono" value="${esc(cliente.telefono)}">
            </div>
            <div class="form-group">
                <label>Estado</label>
                <select id="cl-e-estado" style="width:100%; padding:12px; border:1px solid var(--border-color); border-radius:8px; outline:none; background:var(--bg-white);">
                    <option value="Activo" ${cliente.estado === 'Activo' ? 'selected' : ''}>Activo</option>
                    <option value="Inactivo" ${cliente.estado === 'Inactivo' ? 'selected' : ''}>Inactivo</option>
                    <option value="VIP" ${cliente.estado === 'VIP' ? 'selected' : ''}>VIP</option>
                </select>
            </div>
        </div>
    `, 'Guardar Cambios', async () => {
        const nombre = document.getElementById('cl-e-nombre')?.value || cliente.nombre;
        const empresa = document.getElementById('cl-e-empresa')?.value || cliente.empresa;
        const contacto = document.getElementById('cl-e-email')?.value || cliente.contacto;
        const telefono = document.getElementById('cl-e-telefono')?.value || cliente.telefono;
        const nuevoEstado = document.getElementById('cl-e-estado')?.value || cliente.estado;

        if (window.apiService.isOnline && cliente.dbId) {
            const res = await window.apiService.actualizarCliente({ id: cliente.dbId, nombre_completo: nombre, email: contacto, telefono, estado: nuevoEstado, notas: empresa });
            if (!res || !res.success) {
                showToast('No se pudo actualizar el cliente en la base de datos' + (res && res.message ? ': ' + res.message : '.'));
                return;
            }
        }

        cliente.nombre = nombre;
        cliente.empresa = empresa;
        cliente.contacto = contacto;
        cliente.telefono = telefono;
        cliente.estado = nuevoEstado;
        cliente.estadoBadge = (nuevoEstado === 'Activo' || nuevoEstado === 'VIP') ? 'status-resolved' : 'status-pending';

        showToast('Cliente #' + cliente.id + ' actualizado.');
        render();
    });
}

function confirmarEliminarCliente() {
    const cliente = state.clientes.find(c => c.id === state.selectedClienteId);
    if (!cliente) {
        showToast('Selecciona un cliente para eliminar.');
        return;
    }

    showModal('Confirmar Eliminación de Cliente', `
        <div style="text-align:center; padding:10px 0;">
            <i class="ph ph-warning-diamond" style="font-size:3.5rem; color:#E1306C; margin-bottom:12px;"></i>
            <h4 style="font-size:1.1rem; margin-bottom:8px;">¿Eliminar al cliente <strong>${esc(cliente.nombre)}</strong> (#${cliente.id})?</h4>
            <p style="color:var(--text-muted); font-size:0.9rem;">Empresa: <strong>${esc(cliente.empresa)}</strong> (${esc(cliente.contacto)})</p>
            <p style="color:#E1306C; font-size:0.85rem; margin-top:12px; background:rgba(225,48,108,0.1); padding:8px; border-radius:6px;">
                Esta acción eliminará la ficha del cliente permanentemente${cliente.dbId ? ', junto con todas sus consultas y mensajes' : ''}.
            </p>
        </div>
    `, 'Sí, Eliminar Cliente', async () => {
        if (window.apiService.isOnline && cliente.dbId) {
            const res = await window.apiService.eliminarCliente(cliente.dbId);
            if (!res || !res.success) {
                showToast('No se pudo eliminar el cliente de la base de datos' + (res && res.message ? ': ' + res.message : '.'));
                return;
            }
            // la base borra sus consultas en cascada; reflejarlo en pantalla
            state.consultas = state.consultas.filter(co => co.clienteDbId !== cliente.dbId);
            if (!state.consultas.some(co => co.id === state.selectedConsultaId)) {
                state.selectedConsultaId = state.consultas[0]?.id ?? null;
            }
        }
        const idEliminado = cliente.id;
        state.clientes = state.clientes.filter(c => c.id !== idEliminado);
        if (state.clientes.length > 0) {
            state.selectedClienteId = state.clientes[0].id;
        } else {
            state.selectedClienteId = null;
        }
        showToast('Cliente #' + idEliminado + ' eliminado permanentemente.');
        render();
    });
}

function cancelarClienteAccion() {
    showToast('Operación cancelada.');
}

function salirClienteAccion() {
    navigateTo('dashboard');
}

// --- Dynamic Search Filter Functions ---

window.filtrarGlobal = function(val) {
    state.searchQueryGlobal = val;
    state.searchQueryClientes = val;
    state.searchQueryConsultas = val;
    state.searchQueryHistorial = val;
    render();
    const input = document.getElementById('input-search-global');
    if (input) {
        input.focus();
        input.setSelectionRange(val.length, val.length);
    }
};

window.filtrarClientes = function(val) {
    state.searchQueryClientes = val;
    render();
    const input = document.getElementById('input-search-clientes');
    if (input) {
        input.focus();
        input.setSelectionRange(val.length, val.length);
    }
};

window.filtrarConsultas = function(val) {
    state.searchQueryConsultas = val;
    render();
    const input = document.getElementById('input-search-consultas');
    if (input) {
        input.focus();
        input.setSelectionRange(val.length, val.length);
    }
};

// --- DB Tab & SQL Helper Functions ---

window.switchDbTab = function(tabName) {
    const tabs = ['er', 'pg', 'my', 'seed', 'guide'];
    tabs.forEach(t => {
        const btn = document.getElementById(`db-tab-${t}`);
        const content = document.getElementById(`db-content-${t}`);
        if (btn) btn.classList.remove('active-db-tab');
        if (content) content.style.display = 'none';
    });
    const activeBtn = document.getElementById(`db-tab-${tabName}`);
    const activeContent = document.getElementById(`db-content-${tabName}`);
    if (activeBtn) activeBtn.classList.add('active-db-tab');
    if (activeContent) activeContent.style.display = 'block';
};

window.copySQLToClipboard = function(elementId) {
    const codeElement = document.getElementById(elementId);
    if (codeElement) {
        const text = codeElement.innerText;
        navigator.clipboard.writeText(text).then(() => {
            showToast('Código SQL copiado al portapapeles correctamente.');
        }).catch(() => {
            showToast('Código SQL seleccionado (usa Ctrl+C para copiar).');
        });
    }
};

window.downloadSQLScript = function(filename) {
    showToast('Descargando script ' + filename + '...');
    const link = document.createElement('a');
    link.href = 'database/' + filename;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// --- Backend API Service (Integración con API REST PHP) ---
// Si la API contesta 401 (sesión vencida, o el servidor se reinició) se vuelve al login.
// El login no cuenta: ahí 401 es "contraseña incorrecta".
const fetchOriginal = window.fetch.bind(window);
window.fetch = async (url, opciones) => {
    const res = await fetchOriginal(url, opciones);
    if (res.status === 401 && !String(url).endsWith('/auth/login') && state.user) {
        state.user = null;
        try { sessionStorage.removeItem('atynere_user'); } catch (e) {}
        showToast('Tu sesión venció. Iniciá sesión de nuevo.');
        navigateTo('login');
    }
    return res;
};

window.apiService = {
    baseUrl: (function() {
        if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
            const path = window.location.pathname;
            const dir = path.substring(0, path.lastIndexOf('/'));
            return (dir ? dir : '') + '/api';
        }
        return 'http://localhost:8000/api';
    })(),
    isOnline: false,

    async checkHealth() {
        try {
            const res = await fetch(`${this.baseUrl}/status`, { method: 'GET' });
            if (res.ok) {
                const json = await res.json();
                this.isOnline = true;
                console.log('✅ Conectado a la API PHP AtyÑe’ẽ:', json);
                return true;
            }
        } catch (e) {
            console.log('ℹ️ API PHP en ' + this.baseUrl + ' no detectada. Operando en modo memoria local.');
        }
        this.isOnline = false;
        return false;
    },

    async fetchClientes() {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseUrl}/clientes`);
            const data = await res.json();
            return data.success ? data.data : null;
        } catch (e) { return null; }
    },

    async fetchConsultas() {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseUrl}/consultas`);
            const data = await res.json();
            return data.success ? data.data : null;
        } catch (e) { return null; }
    },

    async enviarMensaje(consultaId, texto) {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseUrl}/consultas/mensaje`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ consulta_id: consultaId, mensaje: texto, es_cliente: false })
            });
            return await res.json();
        } catch (e) { return null; }
    },

    async crearCliente(cliente) {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseUrl}/clientes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cliente)
            });
            return await res.json();
        } catch (e) { return null; }
    },

    async cambiarClave(actual, nueva) {
        try {
            const res = await fetch(`${this.baseUrl}/auth/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actual, nueva })
            });
            return await res.json();
        } catch (e) { return null; }
    },

    // Cierra la sesión en la API (queda en el historial); si falla, igual se sale en el navegador
    async logout() {
        if (!this.isOnline) return;
        try { await fetch(`${this.baseUrl}/auth/logout`, { method: 'POST', keepalive: true }); } catch (e) {}
    },

    async login(email, password) {
        try {
            const res = await fetch(`${this.baseUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            return await res.json();
        } catch (e) { return null; }
    },

    async fetchDashboard() {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseUrl}/dashboard/stats`);
            const data = await res.json();
            return data.success ? data.data : null;
        } catch (e) { return null; }
    },

    async fetchAnalitica(dias) {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseUrl}/reportes/analitica?dias=${encodeURIComponent(dias)}`);
            const data = await res.json();
            return data.success ? data.data : null;
        } catch (e) { return null; }
    },

    async fetchHistorial() {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseUrl}/historial`);
            const data = await res.json();
            return data.success ? data.data : null;
        } catch (e) { return null; }
    },

    async fetchRoles() {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseUrl}/roles`);
            const data = await res.json();
            return data.success ? data.data : null;
        } catch (e) { return null; }
    },

    async guardarUsuario(usuario) {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseUrl}/usuarios`, {
                method: usuario.id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(usuario)
            });
            return await res.json();
        } catch (e) { return null; }
    },

    async fetchUsuarios() {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseUrl}/usuarios`);
            const data = await res.json();
            return data.success ? data.data : null;
        } catch (e) { return null; }
    },

    async fetchConsultaDetalle(id) {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseUrl}/consultas/detalle?id=${encodeURIComponent(id)}`);
            const data = await res.json();
            return data.success ? data.data : null;
        } catch (e) { return null; }
    },

    async fetchCanales() {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseUrl}/canales`);
            const data = await res.json();
            return data.success ? data.data : null;
        } catch (e) { return null; }
    },

    async crearCanal(canal) {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseUrl}/canales`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(canal)
            });
            return await res.json();
        } catch (e) { return null; }
    },

    async actualizarCanal(canal) {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseUrl}/canales`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(canal)
            });
            return await res.json();
        } catch (e) { return null; }
    },

    // Eventos que solo conoce el navegador (exportación de PDF); si falla no se interrumpe al usuario
    async registrarEvento(accion, nota) {
        if (!this.isOnline || !state.user || !state.user.id) return;
        try {
            await fetch(`${this.baseUrl}/historial`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accion, nota }),
                keepalive: true
            });
        } catch (e) {}
    },

    async crearConsulta(consulta) {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseUrl}/consultas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(consulta)
            });
            return await res.json();
        } catch (e) { return null; }
    },

    async actualizarConsulta(consulta) {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseUrl}/consultas`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(consulta)
            });
            return await res.json();
        } catch (e) { return null; }
    },

    async eliminarConsulta(id) {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseUrl}/consultas?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
            return await res.json();
        } catch (e) { return null; }
    },

    async actualizarCliente(cliente) {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseUrl}/clientes`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cliente)
            });
            return await res.json();
        } catch (e) { return null; }
    },

    async eliminarCliente(id) {
        if (!this.isOnline) return null;
        try {
            const res = await fetch(`${this.baseUrl}/clientes?id=${encodeURIComponent(id)}`, {
                method: 'DELETE'
            });
            return await res.json();
        } catch (e) { return null; }
    }
};

// Sincronizar datos iniciales si el backend PHP está activo
async function syncWithBackendIfAvailable() {
    const isUp = await window.apiService.checkHealth();
    if (isUp) {
        cargarCanales(); // el formulario de Nueva Consulta ofrece los canales activos
        const remoteClientes = await window.apiService.fetchClientes();
        if (remoteClientes && remoteClientes.length > 0) {
            state.clientes = remoteClientes.map(c => ({
                id: 'CL-00' + c.id,
                dbId: c.id,
                nombre: c.nombre_completo,
                empresa: c.notas || 'Particular',
                contacto: c.email || c.telefono || 'Sin contacto',
                telefono: c.telefono || '',
                canalPreferido: c.canal_nombre || 'WhatsApp',
                estado: c.estado || 'Activo',
                estadoBadge: (c.estado === 'Activo' || c.estado === 'VIP') ? 'status-resolved' : 'status-pending',
                fechaRegistro: c.fecha_registro ? c.fecha_registro.split(' ')[0] : '15/01/2026'
            }));
        }

        const remoteConsultas = await window.apiService.fetchConsultas();
        if (remoteConsultas && remoteConsultas.length > 0) {
            state.consultas = remoteConsultas.map(co => ({
                id: co.codigo_ticket || ('TK-' + co.id),
                dbId: co.id,
                cliente: co.cliente_nombre || 'Cliente',
                clienteDbId: co.cliente_id,
                usuarioId: co.usuario_id,
                agente: co.agente_nombre,
                email: co.cliente_email || '',
                asunto: co.asunto,
                mensaje: co.mensaje,
                canal: co.canal_nombre || 'WhatsApp',
                canalIcon: co.canal_icono || 'ph-chats-teardrop',
                canalColor: co.canal_color || '',
                estado: co.estado,
                prioridad: co.prioridad || 'Media',
                estadoBadge: co.estadoBadge || 'status-pending',
                hora: co.hora || 'Reciente',
                mensajes: [
                    { tipo: 'cliente', texto: co.mensaje, hora: co.hora || 'Reciente' }
                ]
            }));
            if (state.consultas.length > 0) {
                // Al volver a sincronizar se queda en la consulta que estaba abierta
                const abierta = state.consultas.find(c => c.id === state.selectedConsultaId) || state.consultas[0];
                state.selectedConsultaId = abierta.id;
                cargarMensajesConsulta(abierta);
            }
        }
        render();
    }
}

// Init app: recuperar la sesión de esta pestaña si existe (se pierde al cerrarla)
try { state.user = JSON.parse(sessionStorage.getItem('atynere_user')); } catch (e) {}
if (state.user) state.currentView = 'dashboard';
render();
if (state.currentView === 'dashboard') cargarDashboard();
if (state.user) syncWithBackendIfAvailable();
else window.apiService.checkHealth(); // saber si hay API antes del login (si no, se entra en modo demo)

// Ojo para ver la contraseña: se agrega solo a cada campo de contraseña que aparezca (login, modales, usuarios)
function agregarOjos() {
    document.querySelectorAll('input[type="password"]:not([data-ojo])').forEach(input => {
        input.dataset.ojo = '1';
        const caja = document.createElement('span');
        caja.className = 'campo-clave';
        input.replaceWith(caja);
        caja.appendChild(input);
        const ojo = document.createElement('button');
        ojo.type = 'button'; // dentro de un form, que no lo envíe
        ojo.className = 'ojo-clave';
        ojo.setAttribute('aria-label', 'Mostrar contraseña');
        ojo.setAttribute('aria-pressed', 'false');
        ojo.innerHTML = '<i class="ph ph-eye"></i>';
        ojo.onclick = () => {
            const ver = input.type === 'password';
            input.type = ver ? 'text' : 'password';
            ojo.setAttribute('aria-label', ver ? 'Ocultar contraseña' : 'Mostrar contraseña');
            ojo.setAttribute('aria-pressed', String(ver));
            ojo.innerHTML = `<i class="ph ${ver ? 'ph-eye-slash' : 'ph-eye'}"></i>`;
            input.focus();
        };
        caja.appendChild(ojo);
    });
}
new MutationObserver(agregarOjos).observe(document.body, { childList: true, subtree: true });
agregarOjos();

// Lo que entra por Telegram y las asignaciones aparecen sin recargar: cada 15 s se trae la lista de consultas,
// se avisa si te asignaron alguna y, si cambió algo (nuevas, mensajes, estados, responsables), se vuelve a sincronizar.
const ESTADOS_CERRADOS = ['Resuelto', 'Cerrado', 'Cancelado'];
function misConsultasAbiertas() {
    if (!state.user || !state.user.id) return 0;
    return state.consultas.filter(c => c.usuarioId === state.user.id && !ESTADOS_CERRADOS.includes(c.estado)).length;
}

// Aviso de asignación: compara las consultas abiertas asignadas a este usuario con las que ya conocía.
// Las conocidas se guardan en el navegador, así el aviso aparece también al volver a entrar.
function revisarAsignaciones(lista) {
    const clave = 'atynere_asignadas_' + state.user.id;
    const mias = lista.filter(c => c.usuario_id === state.user.id && !ESTADOS_CERRADOS.includes(c.estado));
    let conocidas = null;
    try { conocidas = JSON.parse(localStorage.getItem(clave)); } catch (e) {}
    if (Array.isArray(conocidas)) { // la primera vez en este navegador solo se anotan, sin avisar
        const nuevas = mias.filter(c => !conocidas.includes(c.id));
        if (nuevas.length === 1) {
            showToast(`Te asignaron la consulta ${nuevas[0].codigo_ticket}: ${nuevas[0].asunto}`, 8000);
        } else if (nuevas.length > 1) {
            showToast(`Te asignaron ${nuevas.length} consultas nuevas: ${nuevas.map(c => c.codigo_ticket).join(', ')}`, 8000);
        }
    }
    try { localStorage.setItem(clave, JSON.stringify(mias.map(c => c.id))); } catch (e) {}
}

let firmaConsultas = null;
setInterval(async () => {
    if (!state.user || !state.user.id || !window.apiService.isOnline || document.hidden) return;
    const lista = await window.apiService.fetchConsultas();
    if (!lista) return;
    revisarAsignaciones(lista); // en cualquier pantalla
    // Volver a dibujar solo en Dashboard y Consultas, y nunca mientras se escribe o hay una ventana abierta
    if (!['dashboard', 'consultas'].includes(state.currentView)) return;
    const activo = document.activeElement;
    const escribiendo = activo && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activo.tagName);
    const respuesta = document.getElementById('responder-input-txt');
    if (escribiendo || (respuesta && respuesta.value.trim()) || document.getElementById('modal-overlay')) return;
    const firma = lista.map(c => `${c.id}:${c.total_mensajes}:${c.estado}:${c.usuario_id}`).join(',');
    if (firmaConsultas !== null && firma !== firmaConsultas) {
        await syncWithBackendIfAvailable();
        if (state.currentView === 'dashboard') cargarDashboard();
    }
    firmaConsultas = firma;
}, 15000);


