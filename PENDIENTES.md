# Pendientes — AtyÑe'ẽ (gestión multicanal)

Última actualización: 22/10/2026

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

**En una Mac (sin Homebrew ni contraseña de administrador):** `./levantar-mac.sh`, o doble clic en "Iniciar AtyÑe'ẽ" del Escritorio. La primera vez descarga PHP 8.3 y MySQL 8.4 (unos 250 MB) en `~/atynere-entorno` y carga los datos de prueba; después arranca en segundos y abre el navegador. Se apaga con Ctrl+C o cerrando la ventana. `--reiniciar` vuelve a los datos de prueba. Probado el 20/10 en la Mac Intel de Daiana (macOS 14.7) con todos los recorridos en navegador. Homebrew ya no soporta Mac Intel, por eso se usan binarios sueltos.

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
| Telegram | Lo que un cliente le escribe al bot entra como consulta del canal Telegram (o se suma a su consulta abierta); lo que el agente responde le llega por Telegram, y si no sale, la app avisa y no lo guarda. La encuesta también se le manda. La pantalla busca novedades cada 15 s (en Dashboard y Consultas, sin pisar lo que se está escribiendo). Detalle abajo |
| Historial | Tabla `historial_estado`: altas, estados, asignaciones (RF-50), cierres, ediciones y bajas de consultas; inicios y cierres de sesión, exportaciones de PDF y altas, ediciones, activaciones y desactivaciones de canales (DCU007). Los eventos que no son de un ticket tienen `codigo_ticket` en NULL |

## Pendientes

Ya no quedan pendientes grandes; lo que sigue son mejoras menores.

### Lo que falta (no se puede resolver solo con código)
- **Recuperar contraseña por correo:** el documento lo pide, pero hace falta un servidor de correo. Hoy "¿Olvidaste tu contraseña?" dice que se la pidan a un administrador, que la restablece desde Usuarios.
- **Envío real de la encuesta y canales sin integración:** salvo Telegram, los canales no están conectados: el enlace de la encuesta queda en el chat y el agente se lo pasa al cliente. Crear un canal solo lo da de alta en la base; no se puede borrar ni renombrar.
- **Enlace de la encuesta por Telegram:** se arma con la dirección desde la que se usa la app. Con la app en `localhost` el cliente recibe un enlace que no puede abrir; sirve recién con la app publicada.
- **HTTPS:** al publicar, servir por HTTPS; la cookie se marca `Secure` sola en ese caso.

### Límites conocidos (decisiones, no errores)
- **Una encuesta por caso:** si un caso se reabre y se vuelve a cerrar, no se manda otra.
- **Diferencias con el documento:** `encuesta_satisfaccion` usa `id` INT y `consulta_id` en vez de CHAR(36) y `caso_id`, como el resto del esquema; `csat` y `nps` admiten NULL hasta que el cliente responde.
- **Cierre de sesión sin registrar:** si se cierra el navegador sin tocar "Cerrar Sesión", no queda registrado. El PDF se registra al tocar Imprimir, aunque después se cancele el diálogo.
- **Bloqueo y enumeración:** el mensaje de "cuenta bloqueada" revela que ese correo existe. Es el precio de bloquear por cuenta, como pide el documento.

## En la nube (Render + Supabase, plan gratis)

Publicada el 22/10 en **https://atynere.onrender.com**, con una copia de la base local de ese día. Proyecto de Supabase `atynere` (us-east-1). Las tablas tienen RLS activado sin políticas: la API automática de Supabase no las expone, y la app entra como dueña, así que no la afecta. **Las contraseñas de la nube no son `admin123`:** se cambiaron al publicar y están en `~/.atynere-claves-nube.txt` en la máquina de Mauro. Datos de conexión en `~/.atynere-supabase.txt`.

- **App:** Render despliega el `Dockerfile` desde GitHub (`render.yaml`). `servidor.php` publica solo la página, `app.js`, `style.css`, `encuesta.html` y la API; `PENDIENTES.md`, los `.sql` y los scripts dan 404.
- **Base:** PostgreSQL de Supabase por el *session pooler* (puerto 5432, usuario `postgres.<ref>`). El *transaction pooler* (6543) no sirve: la app usa sentencias preparadas.
- **Variables en Render:** `DB_DRIVER=pgsql`, `DB_HOST`, `DB_PORT=5432`, `DB_NAME=postgres`, `DB_USER`, `DB_PASSWORD`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` (la misma que se usa en `setWebhook`; copia local en `~/.atynere-telegram-webhook-secret`).
- **Telegram en la nube:** por webhook (`POST /api/telegram/webhook`, protegido con `TELEGRAM_WEBHOOK_SECRET`), registrado una vez con `setWebhook` (url + `secret_token`). Mientras el bot tenga webhook, el receptor local (`levantar.sh`, `levantar-mac.sh`) avisa que lo atiende la nube y no se lo quita.
- **Límites del plan gratis:** Render duerme la app a los 15 min sin uso; la primera visita tarda alrededor de un minuto, y el primer mensaje de Telegram después de dormir llega con ese retraso (Telegram reintenta solo). Al dormir se pierden las sesiones: hay que volver a entrar. Supabase pausa el proyecto tras ~7 días sin uso; se reactiva desde su panel.

## Telegram

**Activarlo:** crear el bot hablándole a @BotFather en Telegram (`/newbot`); da un token como `123456:ABC...`. Guardarlo en `~/.atynere-telegram-token` (fuera del proyecto: el servidor web publica la carpeta del proyecto) o pasarlo como `TELEGRAM_BOT_TOKEN=... ./levantar.sh`. `levantar.sh` y `levantar-mac.sh` arrancan el receptor solos si hay token. No hace falta HTTPS ni dirección pública: `api/telegram-polling.php` le pregunta a Telegram por mensajes nuevos (long polling), así que anda en una notebook.

**Cómo funciona:** el cliente se reconoce por su chat (`clientes.telegram_chat_id`); la primera vez se crea con el nombre de su perfil de Telegram. Si tiene una consulta de Telegram sin cerrar, el mensaje se suma a esa; si no, se abre una nueva (asunto = el comienzo del mensaje, prioridad Media, sin asignar). Desactivar el canal Telegram en Canales hace que el bot conteste que no se está atendiendo por ahí. Código: `api/controllers/TelegramController.php`.

**Límites:** solo texto (a fotos, audios o stickers el bot contesta que por ahora solo lee texto); solo chats privados con el bot, no grupos; un solo bot por instalación. Probado el 22/10 con el bot real @atynere_bot: entra la consulta, la respuesta del agente le llega al cliente y la encuesta también. Con un token inválido la respuesta da 502 y no se guarda. Con un hosting que no deje correr procesos de fondo haría falta un webhook en lugar del receptor.

**Bases creadas antes del 22/10:** correr el paso 8 de `database/migracion_mysql.sql`. En PostgreSQL: `ALTER TABLE clientes ADD COLUMN telegram_chat_id VARCHAR(30) UNIQUE; INSERT INTO canales (nombre, codigo, icono, color) VALUES ('Telegram', 'TELEGRAM', 'ph-telegram-logo', '#229ED9');`. La base local de esta máquina ya se migró el 22/10.

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
