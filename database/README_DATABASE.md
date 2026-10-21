# Guía de Instalación y Ejecución de Base de Datos - AtyÑe'ẽ

Esta carpeta contiene los scripts SQL completos para inicializar la base de datos del proyecto **"AtyÑe’ẽ - Sistema de Gestión Multicanal para Consultas de Clientes"** (Universidad Nacional de Canindeyú - UNCAN).

---

## Estructura de Archivos
- `schema_postgresql.sql`: Script de creación de tablas, relaciones, claves y triggers para **PostgreSQL**.
- `schema_mysql.sql`: Script de creación de tablas, relaciones y claves para **MySQL / MariaDB**.
- `seed_data.sql`: Script de inserción de datos iniciales de prueba (agentes, clientes, canales y tickets). Todos los usuarios tienen la contraseña `admin123`.
- `migracion_mysql.sql`: Solo para bases MySQL/MariaDB **creadas antes de octubre de 2026**. Agrega la columna `consultas.solucion`, la tabla `historial_estado`, las contraseñas de prueba hace opcional `historial_estado.codigo_ticket` (paso 4, para eventos que no son de un ticket) y crea la tabla `encuesta_satisfaccion` (paso 5). Se ejecuta una sola vez; una base nueva no la necesita.

---

## 0. Opción rápida en Linux: Podman y `levantar.sh`

Si tenés [Podman](https://podman.io/) instalado, no hace falta instalar MariaDB ni PHP. Desde la raíz del proyecto (`gestion-multicanal`):

```bash
./levantar.sh
```

El script:
- Crea un contenedor **MariaDB 11.8** (`atynere-db`, puerto `3306`). La primera vez carga `schema_mysql.sql` y `seed_data.sql`. Los datos quedan guardados en el volumen `atynere-data`, así que no se pierden al apagar.
- Levanta la **API PHP 8.3** (`atynere-api`) en `http://localhost:8000`, con el frontend en la raíz y la API en `/api`. La primera vez tarda unos 20 segundos porque instala `pdo_mysql`.

| Dato | Valor |
|---|---|
| Host / puerto | `127.0.0.1:3306` |
| Base de datos | `atynere_db` |
| Usuario / contraseña | `root` / `root` |

```bash
# Apagar
podman stop atynere-api atynere-db

# Borrar la base y volver a cargar el esquema y los datos de prueba
podman rm -f atynere-db && podman volume rm atynere-data && ./levantar.sh
```

> Si ya tenés otro MySQL/MariaDB usando el puerto 3306, apagalo antes o el contenedor no va a arrancar.

---

## 1. Instrucciones para PostgreSQL (pgAdmin 4 o terminal `psql`)

### Opción A: Usando pgAdmin 4 (Interfaz Gráfica)
1. Abre **pgAdmin 4** y conéctate a tu servidor PostgreSQL local o remoto.
2. Haz clic derecho sobre **Databases** -> **Create** -> **Database...**
3. Nombra la base de datos `atynere_db` y guarda.
4. Selecciona la base de datos `atynere_db`, haz clic en la herramienta **Query Tool** (icono de rayo/terminal).
5. Abre y ejecuta primero el contenido de `schema_postgresql.sql` (F5 o botón de Play).
6. Abre y ejecuta el contenido de `seed_data.sql` para cargar los datos de prueba.

### Opción B: Usando la terminal de PostgreSQL (`psql`)
```bash
# 1. Crear la base de datos
createdb -U postgres atynere_db

# 2. Ejecutar el esquema DDL
psql -U postgres -d atynere_db -f database/schema_postgresql.sql

# 3. Insertar datos de prueba
psql -U postgres -d atynere_db -f database/seed_data.sql
```

---

## 2. Instrucciones para MySQL / MariaDB (MySQL Workbench, XAMPP / phpMyAdmin, DBeaver)

### Opción A: Usando MySQL Workbench
1. Abre **MySQL Workbench** y abre una conexión a tu servidor local.
2. Ve a **File** -> **Open SQL Script...** y selecciona `schema_mysql.sql`.
3. Ejecuta todo el script con el icono del rayo ⚡.
4. Abre y ejecuta el archivo `seed_data.sql` para cargar los registros iniciales.

### Opción B: Usando XAMPP / phpMyAdmin
1. Inicia **Apache** y **MySQL** en el Panel de Control de XAMPP.
2. Ve en tu navegador a `http://localhost/phpmyadmin`.
3. Haz clic en la pestaña **Importar**.
4. Selecciona el archivo `schema_mysql.sql` y presiona **Continuar**.
5. Repite el proceso con el archivo `seed_data.sql`.

---

## 3. Conexión en Visual Studio (C# / ASP.NET Core MVC con Entity Framework Core)

Para migrar este diseño a tu proyecto de Visual Studio en C#:

### Para PostgreSQL (`Npgsql.EntityFrameworkCore.PostgreSQL`):
```csharp
// appsettings.json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Database=atynere_db;Username=postgres;Password=tu_contraseña"
}
```

### Para MySQL (`Pomelo.EntityFrameworkCore.MySql`):
```csharp
// appsettings.json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=atynere_db;Uid=root;Pwd=tu_contraseña;"
}
```
