# Pendientes — AtyÑe'ẽ (gestión multicanal)

Última actualización: 20/10/2026 (noche)

## Cómo retomar

```bash
cd ~/dev/gestion-multicanal/gestion-multicanal
./levantar.sh          # MariaDB + API PHP en podman → http://localhost:8000
```

- Login: cualquier usuario de la base con contraseña `admin123`. Roles: `daiana.villasanti@` y `tatiana.silvero@` son Administradoras, `angel.heimann@` Supervisor y `blas.sosa@` Agente (todos `@atynere.py`).
- Si una cuenta queda bloqueada en pruebas, un Administrador la desbloquea desde Usuarios (candado abierto).
- La app hay que abrirla por `http://localhost:8000` (no como archivo): la sesión es una cookie del mismo origen. Reiniciar `levantar.sh` borra las sesiones y hay que volver a entrar.
- Base: `127.0.0.1:3306`, `atynere_db`, usuario `root` / `root`.
- Apagar: `podman stop atynere-api atynere-db`. Los datos quedan en el volumen `atynere-data`.

## Qué ya funciona contra la base

| Pantalla | Estado |
|---|---|
| Login / Cerrar sesión | Valida contra la API; la cabecera muestra el usuario real; la sesión dura lo que la pestaña |
| Dashboard | Tarjetas, gráfico por canal y actividad reciente desde `/api/dashboard/stats` |
| Clientes | Alta, modificación y baja (la baja borra también sus consultas, el aviso lo dice) |
| Consultas | Alta, modificación (asunto y estado), baja, conversación completa, respuestas con el usuario real |
| Asignar | Lista los usuarios reales; queda en el historial |
| Marcar Resuelto | Exige la solución (RF-49, también en la API); se muestra en el chat |
| Reportes | 1ra respuesta, tasa de resolución, escalados, gráficos por canal y por agente, filtro de período |
| Zona horaria | Todo en hora de Paraguay (UTC-3): PHP en `api/index.php`, la sesión de la base en `api/config/database.php`, el seed con `TZ` en `levantar.sh`. Horas en 24 h (`15:30`) |
| Generar PDF | Reporte del período elegido en Reportes (resumen, tabla por canal y por agente) con los datos de `/api/reportes/analitica`; se imprime o guarda con `window.print()` |
| Canales | Tarjetas desde `/api/canales` con consultas abiertas y totales; crear (`POST`), activar/desactivar y cambiar color. Nueva Consulta ofrece solo los canales activos y la API rechaza los desactivados |
| Sesión y API | Todo exige sesión salvo `/api/status` y el login: sesión PHP con cookie `HttpOnly` y `SameSite=Strict`. El usuario de cada acción sale de la sesión, no del navegador. Sin CORS (mismo origen). Si la sesión vence, la app vuelve al login |
| Encuesta (RF-41) | Al cerrar con la casilla marcada se crea la encuesta (tabla `encuesta_satisfaccion`) y el enlace queda como mensaje en el chat. El cliente la responde una vez en `encuesta.html?t=...`, sin login. CSAT y NPS en Reportes y en el PDF |
| Roles | Administrador: todo. Supervisor: reportes, PDF, historial y asignar casos. Agente: atiende (responder, estados, prioridad, cerrar). Eliminar es solo del Administrador (RN-52). La API lo controla (tabla `$permisos` en `api/index.php`) y la pantalla oculta lo que no corresponde |
| Login seguro | Bloqueo de 15 min tras 5 intentos fallidos (RF-10); todos los intentos, también los fallidos, quedan en el historial; cambio de contraseña (ícono de llave) con mínimo 8 caracteres, letras, números y un carácter especial |
| Prioridad | Se elige al crear, se cambia en Modificar (queda en el historial) y Alta/Urgente se marcan en la lista |
| Usuarios | Pantalla solo para Administrador: alta, edición (nombre, correo, rol, estado), restablecer contraseña y desbloquear. Sin baja: se pasa a Inactivo y su sesión se corta. Nadie puede quitarse a sí mismo el rol de Administrador ni desactivarse. Todo queda en el historial |
| Historial | Tabla `historial_estado`: altas, estados, asignaciones (RF-50), cierres, ediciones y bajas de consultas; inicios y cierres de sesión, exportaciones de PDF y altas, ediciones, activaciones y desactivaciones de canales (DCU007). Los eventos que no son de un ticket tienen `codigo_ticket` en NULL |

## Pendientes

Ya no quedan pendientes grandes; lo que sigue son mejoras menores.

### Lo que falta (no se puede resolver solo con código)
- **Recuperar contraseña por correo:** el documento lo pide, pero hace falta un servidor de correo. Hoy "¿Olvidaste tu contraseña?" dice que se la pidan a un administrador, que la restablece desde Usuarios.
- **Envío real de la encuesta y canales sin integración:** sin WhatsApp ni correo conectados, el enlace de la encuesta queda en el chat y el agente se lo pasa al cliente. Crear un canal solo lo da de alta en la base; no se puede borrar ni renombrar.
- **HTTPS:** al publicar, servir por HTTPS; la cookie se marca `Secure` sola en ese caso.

### Límites conocidos (decisiones, no errores)
- **Una encuesta por caso:** si un caso se reabre y se vuelve a cerrar, no se manda otra.
- **Diferencias con el documento:** `encuesta_satisfaccion` usa `id` INT y `consulta_id` en vez de CHAR(36) y `caso_id`, como el resto del esquema; `csat` y `nps` admiten NULL hasta que el cliente responde.
- **Cierre de sesión sin registrar:** si se cierra el navegador sin tocar "Cerrar Sesión", no queda registrado. El PDF se registra al tocar Imprimir, aunque después se cancele el diálogo.
- **Bloqueo y enumeración:** el mensaje de "cuenta bloqueada" revela que ese correo existe. Es el precio de bloquear por cuenta, como pide el documento.

## Notas para quien siga

- **Fechas viejas en UTC:** la base local se corrigió el 20/10 restando 3 h. Otra base creada antes de ese día tiene las fechas 3 h adelantadas; se corrige igual (`UPDATE tabla SET col = col - INTERVAL 3 HOUR` en cada columna DATETIME) o recreándola.

- **Bases creadas antes de estos cambios:** correr `database/migracion_mysql.sql` una vez. Si ya se había corrido antes del 20/10 a la noche, correr solo los pasos 4 (`codigo_ticket` opcional), 5 (tabla de la encuesta), 6 (borra `metricas_diarias`) y 7 (columnas del bloqueo de login). En PostgreSQL no hay migración: `ALTER TABLE historial_estado ALTER COLUMN codigo_ticket DROP NOT NULL;` el `CREATE TABLE encuesta_satisfaccion` de `schema_postgresql.sql` y `ALTER TABLE usuarios ADD COLUMN intentos_fallidos INT DEFAULT 0, ADD COLUMN bloqueado_hasta TIMESTAMP WITH TIME ZONE;`.
- **PostgreSQL:** el 20/10 se probó todo con PostgreSQL 16 (esquema, seed, cada endpoint y los mismos recorridos en navegador que con MariaDB). Para levantarlo sin tocar MariaDB, en el puerto 8001:
  ```bash
  podman run -d --rm --name atynere-pg --security-opt label=disable -p 5432:5432 -e TZ=America/Asuncion -e POSTGRES_PASSWORD=root -e POSTGRES_DB=atynere_db \
    -v ./database/schema_postgresql.sql:/docker-entrypoint-initdb.d/01_schema.sql:ro -v ./database/seed_data.sql:/docker-entrypoint-initdb.d/02_seed.sql:ro docker.io/library/postgres:16
  podman run -d --rm --name atynere-api-pg --security-opt label=disable --network host -e DB_DRIVER=pgsql -e DB_HOST=127.0.0.1 -e DB_PORT=5432 -e DB_USER=postgres -e DB_PASSWORD=root \
    -v .:/app:ro -w /app docker.io/library/php:8.3-cli sh -c "apt-get update -qq && apt-get install -y -qq libpq-dev && docker-php-ext-install pdo_pgsql && php -S 127.0.0.1:8001"
  ```
  Sin volumen: al apagarlo (`podman stop atynere-api-pg atynere-pg`) la base se pierde. La API tarda ~1 min en arrancar (instala `pdo_pgsql`).
- **Booleanos en PostgreSQL:** PDO devuelve `true`/`false` de verdad; no usar `fetchColumn()` para leer un booleano (un `false` se confunde con "no hay fila").
- **Pruebas en navegador:** no hay Chrome accesible para las herramientas (el de la máquina es Flatpak). Se usó Chromium de Playwright instalado en el scratchpad de la sesión.
- **SELinux:** `levantar.sh` usa `--security-opt label=disable`. Con `:Z` los dos contenedores se bloqueaban los archivos entre sí.
