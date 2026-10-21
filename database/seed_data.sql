-- =============================================================================
-- ATYÑE'Ẽ - Datos de Prueba Iniciales (Seed Data)
-- Compatible con PostgreSQL y MySQL
-- Sin ids explícitos: sobre tablas recién creadas salen 1, 2, 3... y las secuencias de PostgreSQL quedan al día
-- Universidad Nacional de Canindeyú (UNCAN) - Seminario III
-- =============================================================================

-- 1. ROLES
INSERT INTO roles (nombre, descripcion) VALUES
('Administrador', 'Acceso total a configuraciones, usuarios y reportes'),
('Agente de Soporte', 'Atención de consultas, respuesta a clientes y cambio de estados'),
('Supervisor', 'Monitoreo de métricas, reportes y reasignación de tickets');

-- 2. CANALES MULTICANAL
INSERT INTO canales (nombre, codigo, icono, color) VALUES
('WhatsApp', 'WHATSAPP', 'ph-whatsapp-logo', '#25D366'),
('Facebook Messenger', 'FACEBOOK', 'ph-facebook-logo', '#0084FF'),
('Instagram Direct', 'INSTAGRAM', 'ph-instagram-logo', '#E1306C'),
('Correo Electrónico', 'EMAIL', 'ph-envelope-simple', '#4A148C'),
('WebChat Directo', 'WEBCHAT', 'ph-chat-circle-dots', '#AEEA00');

-- 3. USUARIOS (Agentes del Sistema AtyÑe'ẽ) — contraseña de prueba de todos: admin123
INSERT INTO usuarios (nombre_completo, email, password_hash, rol_id, estado, avatar_url) VALUES
('Daiana Villasanti', 'daiana.villasanti@atynere.py', '$2y$10$rMZRuURuWavOFszTETffOeM0JJHGzk3aH5mN1rIA/uzu.41248UVi', 1, 'Activo', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'),
('Tatiana Silvero', 'tatiana.silvero@atynere.py', '$2y$10$rMZRuURuWavOFszTETffOeM0JJHGzk3aH5mN1rIA/uzu.41248UVi', 1, 'Activo', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'),
('Angel Heimann', 'angel.heimann@atynere.py', '$2y$10$rMZRuURuWavOFszTETffOeM0JJHGzk3aH5mN1rIA/uzu.41248UVi', 3, 'Activo', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
('Blas Sosa', 'blas.sosa@atynere.py', '$2y$10$rMZRuURuWavOFszTETffOeM0JJHGzk3aH5mN1rIA/uzu.41248UVi', 2, 'Ocupado', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150');

-- 4. CLIENTES
INSERT INTO clientes (nombre_completo, telefono, email, canal_preferido_id, estado, notas) VALUES
('Carlos Gómez', '+595 981 123 456', 'carlos.gomez@gmail.com', 1, 'Activo', 'Cliente recurrente de Saltos del Guairá'),
('María Rodríguez', '+595 971 654 321', 'maria.rodriguez@hotmail.com', 4, 'VIP', 'Prefiere respuestas detalladas por correo'),
('Juan Pérez', '+595 991 888 999', 'juan.perez@yahoo.com', 2, 'Activo', 'Consulta sobre horarios de atención'),
('Ana Benítez', '+595 983 555 777', 'ana.benitez@outlook.com', 3, 'Activo', 'Seguidora en Instagram');

-- 5. CONSULTAS / TICKETS
INSERT INTO consultas (codigo_ticket, cliente_id, canal_id, usuario_asignado_id, asunto, mensaje, prioridad, estado) VALUES
('TCK-1001', 1, 1, 1, 'Consulta sobre horarios y ubicación', 'Hola, quisiera saber los horarios de atención presencial en la sede de Saltos del Guairá.', 'Alta', 'Nuevo'),
('TCK-1002', 2, 4, 2, 'Solicitud de presupuesto de servicios', 'Buenas tardes, solicito cotización para el servicio de gestión de soporte técnico.', 'Urgente', 'En Proceso'),
('TCK-1003', 3, 2, 4, 'Duda sobre factura del mes', 'Hola, me llegó una factura con un concepto que no comprendo del todo.', 'Media', 'Pendiente'),
('TCK-1004', 4, 3, 2, 'Agradecimiento por buena atención', 'Muchas gracias por resolver mi consulta de ayer tan rápido.', 'Baja', 'Resuelto');

-- 6. HISTORIAL DE INTERACCIONES
INSERT INTO historial_interacciones (consulta_id, usuario_id, es_cliente, mensaje) VALUES
(1, NULL, TRUE, 'Hola, quisiera saber los horarios de atención presencial en la sede de Saltos del Guairá.'),
(2, NULL, TRUE, 'Buenas tardes, solicito cotización para el servicio de gestión de soporte técnico.'),
(2, 2, FALSE, 'Hola Sra. María, con gusto le preparamos la cotización. En breve se la enviamos por correo.'),
(3, NULL, TRUE, 'Hola, me llegó una factura con un concepto que no comprendo del todo.'),
(3, 4, FALSE, 'Estimado Juan, le tomamos la consulta para verificar con el área administrativa.');

-- 6b. HISTORIAL DE ESTADO: un registro de creación por cada ticket de prueba
INSERT INTO historial_estado (consulta_id, codigo_ticket, accion, estado, usuario_asignado_id, nota)
SELECT id, codigo_ticket, 'Creación', estado, usuario_asignado_id, 'Registro inicial (datos de prueba)' FROM consultas;

