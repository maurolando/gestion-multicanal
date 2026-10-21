# AtyÑe’ẽ - Documentación de la API REST en PHP

Backend RESTful modular en PHP nativo con **PDO** para el sistema **AtyÑe'ẽ (Gestión Multicanal)**. Compatible con **MySQL 8.0+** y **PostgreSQL 12+**.

---

## 1. Puesta en Marcha Rápida

### Opción 0: Con Podman, sin instalar PHP ni MySQL (Linux)
Desde la raíz del proyecto (`gestion-multicanal`):
```bash
./levantar.sh
```
Levanta MariaDB con el esquema y los datos de prueba, y la API en `http://localhost:8000/api`. Ver detalles en `database/README_DATABASE.md`, sección 0.

### Opción A: Con el servidor embebido de PHP (Recomendada para pruebas rápidas)
Desde la raíz del proyecto (`gestion-multicanal`), ejecuta en la terminal:
```bash
# Iniciar servidor en el puerto 8000
php -S localhost:8000
```
La API responderá de inmediato en: `http://localhost:8000/api`

### Opción B: Con XAMPP / WAMP / Laragon
1. Copia o mueve la carpeta `gestion-multicanal` a tu directorio `htdocs` (ejemplo: `C:\xampp\htdocs\gestion-multicanal`).
2. Asegúrate de iniciar **Apache** y **MySQL** desde el Panel de XAMPP.
3. La API estará disponible en: `http://localhost/gestion-multicanal/api`

---

## 2. Configuración de Base de Datos (`api/config/database.php`)

Por defecto viene configurado para **MySQL** en `localhost`:
```php
private static $driver = 'mysql'; // 'mysql' o 'pgsql'
private static $host = 'localhost';
private static $port = 3306;
private static $dbname = 'atynere_db';
private static $user = 'root';
private static $password = '';
```

### Para cambiar a PostgreSQL:
Cambia los parámetros en `api/config/database.php`:
```php
private static $driver = 'pgsql';
private static $port = 5432;
private static $user = 'postgres';
private static $password = 'tu_contraseña_de_postgres';
```
*(O define las variables de entorno `DB_DRIVER`, `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).*

---

## 3. Catálogo de Endpoints RESTful

### Estado y Salud
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/status` | Verifica el estado del servicio y conexión |

---

### Autenticación y Usuarios

**Todo exige sesión salvo `/api/status`, `/api/auth/login` y `/api/encuesta`** (si no, responde `401`). El login abre una sesión PHP con la cookie `ATYNERE_SID` (`HttpOnly`, `SameSite=Strict`), que el navegador manda sola. El usuario de cada acción (historial, respuestas del chat) sale de la sesión: la API ignora cualquier `usuario_id` del body. No hay CORS: el frontend se sirve desde el mismo origen que la API, así que la app hay que abrirla por `http://localhost:8000`, no como archivo.

Con curl: `curl -c cookies.txt -X POST .../api/auth/login -H 'Content-Type: application/json' -d '{...}'` y después `-b cookies.txt` en cada llamada.

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/auth/login` | Iniciar sesión (recibe `email` y `password`) |
| `POST` | `/api/auth/logout` | Cerrar sesión (queda en el historial) |
| `PUT` | `/api/auth/password` | Cambiar la contraseña propia: `{"actual": "...", "nueva": "..."}` (8+ caracteres, letras, números y un especial) |

El login bloquea la cuenta 15 minutos tras 5 contraseñas incorrectas seguidas (responde `423`). Todos los intentos quedan en el historial.

**Permisos por rol** (si no alcanza, responde `403`): eliminar clientes o consultas y crear o editar canales, solo Administrador; reportes e historial (y registrar el PDF), Administrador y Supervisor; asignar o reasignar una consulta, Administrador y Supervisor. Lo demás, cualquier usuario con sesión.
| `GET` | `/api/usuarios` | Listar usuarios (con `rol_id`, `estado` y `bloqueado`) |
| `POST` | `/api/usuarios` | **Administrador.** Alta: `{nombre_completo, email, rol_id, password}` |
| `PUT` | `/api/usuarios` | **Administrador.** `{id, nombre_completo?, email?, rol_id?, estado?, password?, desbloquear?}`. `password` la restablece y desbloquea. No deja quitarse el rol de Administrador ni desactivarse a uno mismo |
| `GET` | `/api/roles` | **Administrador.** Lista de roles |

#### Ejemplo de Login:
Los usuarios de `seed_data.sql` tienen todos la contraseña `admin123`.

```json
// POST /api/auth/login
{
  "email": "daiana.villasanti@atynere.py",
  "password": "admin123"
}
```

---

### Clientes
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/clientes` | Listar clientes (soporta `?q=termino` para buscar) |
| `GET` | `/api/clientes/detalle?id=1` | Detalle del cliente e historial de tickets |
| `POST` | `/api/clientes` | Registrar un nuevo cliente |
| `PUT` | `/api/clientes` | Actualizar cliente existente |
| `DELETE` | `/api/clientes?id=1` | Eliminar cliente |

#### Ejemplo de Creación de Cliente:
```json
// POST /api/clientes
{
  "nombre_completo": "Laura Benítez",
  "email": "laura.benitez@empresa.com",
  "telefono": "+595 981 777 888",
  "canal_preferido_id": 1,
  "estado": "Activo",
  "notas": "Cliente de Salto del Guairá"
}
```

---

### Consultas / Tickets y Mensajes (Chat Multicanal)
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/consultas` | Listar tickets (filtros: `?estado=Nuevo`, `?canal=1`, `?q=texto`) |
| `GET` | `/api/consultas/detalle?id=1` | Detalle del ticket con todo su historial de chat |
| `POST` | `/api/consultas` | Crear nueva consulta (genera código `TCK-XXXX`) |
| `PUT` | `/api/consultas` | Actualizar estado, prioridad, asunto o agente. Pasar a `Resuelto`/`Cerrado` exige `solucion` (RF-49); con `"enviar_encuesta": true` crea la encuesta (RF-41), deja el enlace en el chat y lo devuelve en `data.encuesta`. Quién hace el cambio queda en el historial |
| `POST` | `/api/consultas/mensaje` | Enviar mensaje en el chat del ticket |
| `GET` | `/api/encuesta?t=<token>` | **Pública.** Datos de la encuesta de satisfacción (ticket, asunto, si ya fue respondida) |
| `POST` | `/api/encuesta` | **Pública.** Respuesta del cliente, una sola vez: `{"t": "<token>", "csat": 1-5, "nps": 0-10, "comentario": "..."}` |
| `GET` | `/api/historial` | Últimos 200 eventos: cambios de las consultas, sesiones, PDF y canales |
| `POST` | `/api/historial` | Registrar una exportación de PDF (`{"accion": "Exportación PDF", "nota": "..."}`); los demás eventos los registra la API sola |
| `DELETE` | `/api/consultas?id=1` | Eliminar consulta |

#### Ejemplo de Enviar Mensaje en el Chat:
```json
// POST /api/consultas/mensaje
{
  "consulta_id": 1,
  "mensaje": "Estimado cliente, hemos procesado su solicitud con éxito.",
  "es_cliente": false
}
```

---

### Canales Multicanal
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/canales` | Lista canales con recuento de tickets activos |
| `POST` | `/api/canales` | Crear canal (`nombre`, `icono` opcional `ph-...`, `color` opcional `#RRGGBB`) |
| `PUT` | `/api/canales` | Activar/desactivar (`activo`) o cambiar `color` |

---

### Dashboard y Métricas
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/dashboard/stats` | KPIs (recibidas, pendientes, resueltas, datos para Chart.js) |
| `GET` | `/api/reportes/analitica` | Tiempo de 1ra respuesta, tasa de resolución, escalados y rendimiento por agente. `?dias=30` (0 = todo el período). Incluye CSAT (% de respuestas 4-5) y NPS de las encuestas respondidas; `null` si no hay ninguna |

---

## 4. Formato de Respuesta Estándar

Todas las respuestas retornan JSON estructurado:

```json
{
  "success": true,
  "status": 200,
  "message": "Operación exitosa",
  "data": { ... },
  "timestamp": "2026-09-18T19:50:00-03:00"
}
```
