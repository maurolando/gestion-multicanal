-- =============================================================================
-- ATYÑE'Ẽ - Sistema de Gestión Multicanal para Consultas de Clientes
-- Script de Creación de Base de Datos - MySQL 8.0+ / MariaDB 10.4+
-- Universidad Nacional de Canindeyú (UNCAN) - Seminario III
-- Autores: Daiana Soledad Villasanti Romero & Tatiana Jaqueline Silvero Pico
-- =============================================================================

CREATE DATABASE IF NOT EXISTS atynere_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE atynere_db;

-- Desactivar restricciones de claves foráneas temporalmente para limpieza
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS encuesta_satisfaccion;
DROP TABLE IF EXISTS historial_estado;
DROP TABLE IF EXISTS historial_interacciones;
DROP TABLE IF EXISTS consultas;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS canales;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Tabla: ROLES
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla: USUARIOS (Agentes y Administradores)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol_id INT NOT NULL,
    estado ENUM('Activo', 'Inactivo', 'Ocupado') DEFAULT 'Activo',
    avatar_url VARCHAR(255),
    ultimo_acceso DATETIME,
    intentos_fallidos INT DEFAULT 0, -- logins fallidos seguidos (RF-10)
    bloqueado_hasta DATETIME, -- tras 5 fallidos, bloqueo temporal (RNF)
    notif_leidas_hasta INT DEFAULT 0, -- id de historial_estado hasta el que leyó sus notificaciones (campanita)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuarios_roles FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla: CANALES MULTICANAL
CREATE TABLE canales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE, -- WhatsApp, Facebook, Instagram, Email, WebChat
    codigo VARCHAR(20) NOT NULL UNIQUE, -- WHATSAPP, FACEBOOK, INSTAGRAM, EMAIL, WEBCHAT
    icono VARCHAR(50),
    color VARCHAR(20),
    activo TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabla: CLIENTES
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    telefono VARCHAR(30),
    email VARCHAR(150),
    canal_preferido_id INT,
    estado ENUM('Activo', 'Inactivo', 'VIP') DEFAULT 'Activo',
    notas TEXT,
    telegram_chat_id VARCHAR(30) UNIQUE, -- chat con el bot si escribió por Telegram; ahí se le responde
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_clientes_canales FOREIGN KEY (canal_preferido_id) REFERENCES canales(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabla: CONSULTAS (Tickets)
CREATE TABLE consultas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_ticket VARCHAR(20) NOT NULL UNIQUE, -- Ej: TCK-1001
    cliente_id INT NOT NULL,
    canal_id INT NOT NULL,
    usuario_asignado_id INT,
    asunto VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    prioridad ENUM('Alta', 'Media', 'Baja', 'Urgente') DEFAULT 'Media',
    estado ENUM('Nuevo', 'En Proceso', 'Pendiente', 'Resuelto', 'Cerrado', 'Cancelado') DEFAULT 'Nuevo',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    fecha_cierre DATETIME,
    solucion TEXT, -- solución aplicada al cerrar (RF-49)
    CONSTRAINT fk_consultas_clientes FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_consultas_canales FOREIGN KEY (canal_id) REFERENCES canales(id) ON DELETE RESTRICT,
    CONSTRAINT fk_consultas_usuarios FOREIGN KEY (usuario_asignado_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabla: HISTORIAL DE INTERACCIONES (Mensajes y Conversaciones)
CREATE TABLE historial_interacciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consulta_id INT NOT NULL,
    usuario_id INT, -- NULL si fue respuesta del cliente
    es_cliente TINYINT(1) DEFAULT 0,
    mensaje TEXT NOT NULL,
    adjunto_url VARCHAR(255),
    fecha_interaccion DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_interacciones_consultas FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE CASCADE,
    CONSTRAINT fk_interacciones_usuarios FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6b. Tabla: HISTORIAL DE ESTADO (log de auditoría del ciclo de vida de cada ticket, RF-50)
-- consulta_id queda en NULL si se borra el ticket; codigo_ticket conserva a qué ticket se refería
CREATE TABLE historial_estado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consulta_id INT,
    codigo_ticket VARCHAR(20), -- NULL en eventos que no son de un ticket (sesiones, PDF, canales)
    accion VARCHAR(30) NOT NULL, -- Creación, Cambio de estado, Asignación, Cierre, Edición, Eliminación
    estado VARCHAR(20), -- estado del ticket después del cambio
    usuario_asignado_id INT, -- responsable del ticket después del cambio
    usuario_id INT, -- quién hizo el cambio
    nota TEXT,
    cambiado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hestado_consultas FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE SET NULL,
    CONSTRAINT fk_hestado_asignado FOREIGN KEY (usuario_asignado_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_hestado_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: ENCUESTA_SATISFACCION (RF-41)
-- Se crea al cerrar un caso; el cliente la responde una vez desde encuesta.html?t=<token>.
-- csat y nps quedan en NULL hasta que responde (el documento los marca NN, pero al enviarla todavía no existen).
CREATE TABLE encuesta_satisfaccion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consulta_id INT NOT NULL UNIQUE, -- una encuesta por caso
    token CHAR(32) NOT NULL UNIQUE, -- enlace de la encuesta; aleatorio para que no se pueda adivinar
    csat TINYINT, -- satisfacción de 1 a 5
    nps TINYINT, -- recomendación de 0 a 10
    comentario TEXT,
    enviado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    respondido_en DATETIME,
    CONSTRAINT fk_encuesta_consultas FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
