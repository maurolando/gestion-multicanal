-- =============================================================================
-- ATYÑE'Ẽ - Sistema de Gestión Multicanal para Consultas de Clientes
-- Script de Creación de Base de Datos - PostgreSQL 12+
-- Universidad Nacional de Canindeyú (UNCAN) - Seminario III
-- Autores: Daiana Soledad Villasanti Romero & Tatiana Jaqueline Silvero Pico
-- =============================================================================

-- 1. Se usa el esquema public: la API y seed_data.sql no fijan search_path

-- 2. Eliminar tablas si existen (para reinicialización limpia)
DROP TABLE IF EXISTS encuesta_satisfaccion CASCADE;
DROP TABLE IF EXISTS historial_estado CASCADE;
DROP TABLE IF EXISTS historial_interacciones CASCADE;
DROP TABLE IF EXISTS consultas CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS canales CASCADE;

-- 3. Tabla: ROLES
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla: USUARIOS (Agentes y Administradores)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol_id INT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    estado VARCHAR(20) DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo', 'Ocupado')),
    avatar_url VARCHAR(255),
    ultimo_acceso TIMESTAMP WITH TIME ZONE,
    intentos_fallidos INT DEFAULT 0, -- logins fallidos seguidos (RF-10)
    bloqueado_hasta TIMESTAMP WITH TIME ZONE, -- tras 5 fallidos, bloqueo temporal (RNF)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla: CANALES MULTICANAL
CREATE TABLE canales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE, -- WhatsApp, Facebook, Instagram, Email, WebChat
    codigo VARCHAR(20) NOT NULL UNIQUE, -- WHATSAPP, FACEBOOK, INSTAGRAM, EMAIL, WEBCHAT
    icono VARCHAR(50),
    color VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabla: CLIENTES
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    telefono VARCHAR(30),
    email VARCHAR(150),
    canal_preferido_id INT REFERENCES canales(id) ON DELETE SET NULL,
    estado VARCHAR(20) DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo', 'VIP')),
    notas TEXT,
    telegram_chat_id VARCHAR(30) UNIQUE, -- chat con el bot si escribió por Telegram; ahí se le responde
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabla: CONSULTAS (Tickets)
CREATE TABLE consultas (
    id SERIAL PRIMARY KEY,
    codigo_ticket VARCHAR(20) NOT NULL UNIQUE, -- Ej: TCK-1001
    cliente_id INT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    canal_id INT NOT NULL REFERENCES canales(id) ON DELETE RESTRICT,
    usuario_asignado_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    asunto VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    prioridad VARCHAR(20) DEFAULT 'Media' CHECK (prioridad IN ('Alta', 'Media', 'Baja', 'Urgente')),
    estado VARCHAR(20) DEFAULT 'Nuevo' CHECK (estado IN ('Nuevo', 'En Proceso', 'Pendiente', 'Resuelto', 'Cerrado', 'Cancelado')),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP WITH TIME ZONE,
    solucion TEXT -- solución aplicada al cerrar (RF-49)
);

-- 8. Tabla: HISTORIAL DE INTERACCIONES (Mensajes y Conversaciones)
CREATE TABLE historial_interacciones (
    id SERIAL PRIMARY KEY,
    consulta_id INT NOT NULL REFERENCES consultas(id) ON DELETE CASCADE,
    usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL, -- NULL si fue respuesta del cliente
    es_cliente BOOLEAN DEFAULT FALSE,
    mensaje TEXT NOT NULL,
    adjunto_url VARCHAR(255),
    fecha_interaccion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8b. Tabla: HISTORIAL DE ESTADO (log de auditoría del ciclo de vida de cada ticket, RF-50)
-- consulta_id queda en NULL si se borra el ticket; codigo_ticket conserva a qué ticket se refería
CREATE TABLE historial_estado (
    id SERIAL PRIMARY KEY,
    consulta_id INT REFERENCES consultas(id) ON DELETE SET NULL,
    codigo_ticket VARCHAR(20), -- NULL en eventos que no son de un ticket (sesiones, PDF, canales)
    accion VARCHAR(30) NOT NULL, -- Creación, Cambio de estado, Asignación, Cierre, Edición, Eliminación
    estado VARCHAR(20), -- estado del ticket después del cambio
    usuario_asignado_id INT REFERENCES usuarios(id) ON DELETE SET NULL, -- responsable después del cambio
    usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL, -- quién hizo el cambio
    nota TEXT,
    cambiado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: ENCUESTA_SATISFACCION (RF-41)
-- Se crea al cerrar un caso; el cliente la responde una vez desde encuesta.html?t=<token>.
-- csat y nps quedan en NULL hasta que responde (el documento los marca NN, pero al enviarla todavía no existen).
CREATE TABLE encuesta_satisfaccion (
    id SERIAL PRIMARY KEY,
    consulta_id INT NOT NULL UNIQUE REFERENCES consultas(id) ON DELETE CASCADE, -- una encuesta por caso
    token CHAR(32) NOT NULL UNIQUE, -- enlace de la encuesta; aleatorio para que no se pueda adivinar
    csat SMALLINT CHECK (csat BETWEEN 1 AND 5),
    nps SMALLINT CHECK (nps BETWEEN 0 AND 10),
    comentario TEXT,
    enviado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    respondido_en TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- INDICES PARA OPTIMIZACIÓN DE BUSQUEDAS
-- =============================================================================
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_clientes_telefono ON clientes(telefono);
CREATE INDEX idx_consultas_codigo ON consultas(codigo_ticket);
CREATE INDEX idx_consultas_estado ON consultas(estado);
CREATE INDEX idx_consultas_prioridad ON consultas(prioridad);
CREATE INDEX idx_consultas_cliente ON consultas(cliente_id);
CREATE INDEX idx_consultas_usuario ON consultas(usuario_asignado_id);
CREATE INDEX idx_interacciones_consulta ON historial_interacciones(consulta_id);
CREATE INDEX idx_hestado_cambiado ON historial_estado(cambiado_en);

-- =============================================================================
-- TRIGGER PARA ACTUALIZAR AUTOMÁTICAMENTE EL CAMPO updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_modtime BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_clientes_modtime BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
-- consultas no tiene updated_at: su columna equivalente es fecha_actualizacion (como ON UPDATE en MySQL)
CREATE OR REPLACE FUNCTION update_fecha_actualizacion_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_consultas_modtime BEFORE UPDATE ON consultas FOR EACH ROW EXECUTE PROCEDURE update_fecha_actualizacion_column();
