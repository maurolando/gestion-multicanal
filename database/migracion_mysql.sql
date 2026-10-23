-- =============================================================================
-- Migración para bases MySQL/MariaDB creadas con la versión anterior de schema_mysql.sql
-- Ejecutar UNA sola vez sobre atynere_db. Una base nueva no la necesita: el esquema ya trae todo.
-- =============================================================================
USE atynere_db;

-- 1. Solución aplicada al cerrar una consulta (RF-49)
ALTER TABLE consultas ADD COLUMN solucion TEXT NULL AFTER fecha_cierre;

-- 2. Historial de estado: log de auditoría de cada ticket (RF-50)
CREATE TABLE historial_estado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consulta_id INT,
    codigo_ticket VARCHAR(20), -- NULL en eventos que no son de un ticket (sesiones, PDF, canales)
    accion VARCHAR(30) NOT NULL,
    estado VARCHAR(20),
    usuario_asignado_id INT,
    usuario_id INT,
    nota TEXT,
    cambiado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hestado_consultas FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE SET NULL,
    CONSTRAINT fk_hestado_asignado FOREIGN KEY (usuario_asignado_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_hestado_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_hestado_cambiado ON historial_estado(cambiado_en);

-- Un registro de creación para cada ticket que ya existía
INSERT INTO historial_estado (consulta_id, codigo_ticket, accion, estado, usuario_asignado_id, nota, cambiado_en)
SELECT id, codigo_ticket, 'Creación', estado, usuario_asignado_id, 'Registro inicial (tickets anteriores al historial)', fecha_creacion
FROM consultas;

-- 3. Contraseña de prueba "admin123" para los usuarios de seed_data.sql
--    (el login ya no acepta contraseñas sin verificar el hash)
UPDATE usuarios SET password_hash = '$2y$10$rMZRuURuWavOFszTETffOeM0JJHGzk3aH5mN1rIA/uzu.41248UVi'
WHERE email IN ('daiana.villasanti@atynere.py', 'tatiana.silvero@atynere.py', 'angel.heimann@atynere.py', 'blas.sosa@atynere.py');

-- 4. Historial de eventos que no son de un ticket: inicios y cierres de sesión, PDF, canales (DCU007)
--    Si ya corriste los pasos anteriores en otro momento, ejecutá solo esta línea (se puede repetir sin problema).
ALTER TABLE historial_estado MODIFY codigo_ticket VARCHAR(20) NULL;

-- 5. Encuesta de satisfacción (RF-41). Si ya corriste los pasos anteriores, ejecutá solo este bloque.
-- Se crea al cerrar un caso; el cliente la responde una vez desde encuesta.html?t=<token>.
-- csat y nps quedan en NULL hasta que responde (el documento los marca NN, pero al enviarla todavía no existen).
CREATE TABLE IF NOT EXISTS encuesta_satisfaccion (
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

-- 6. metricas_diarias ya no se usa (Reportes calcula todo en el momento). Opcional; se puede repetir.
DROP TABLE IF EXISTS metricas_diarias;

-- 7. Bloqueo por intentos fallidos de login (RF-10). Si ya corriste los pasos anteriores, ejecutá solo este bloque, una vez
--    (MySQL 8 no acepta ADD COLUMN IF NOT EXISTS; si ya existen las columnas, da error y no cambia nada).
ALTER TABLE usuarios ADD COLUMN intentos_fallidos INT DEFAULT 0 AFTER ultimo_acceso;
ALTER TABLE usuarios ADD COLUMN bloqueado_hasta DATETIME AFTER intentos_fallidos;

-- 8. Canal Telegram. Si ya corriste los pasos anteriores, ejecutá solo este bloque, una vez.
ALTER TABLE clientes ADD COLUMN telegram_chat_id VARCHAR(30) UNIQUE AFTER notas;
INSERT INTO canales (nombre, codigo, icono, color) VALUES ('Telegram', 'TELEGRAM', 'ph-telegram-logo', '#229ED9');

-- 9. Notificaciones de la campanita (qué leyó cada usuario). Si ya corriste los pasos anteriores, ejecutá solo esta línea, una vez.
ALTER TABLE usuarios ADD COLUMN notif_leidas_hasta INT DEFAULT 0 AFTER bloqueado_hasta;
