# RecipeHub

RecipeHub es una aplicación web para consultar y gestionar recetas de cocina. Permite explorar un catálogo, buscar recetas, aplicar filtros y consultar sus ingredientes y pasos de preparación. También incluye formularios para crear, editar y eliminar recetas.

Desarrollé este proyecto como parte de mi portafolio para practicar el desarrollo frontend con Angular y la creación de una API REST conectada a una base de datos relacional con Node.js, Express y MySQL.

**Demostración:** [Ver RecipeHub](https://recipehub-ddb79.web.app/)

**Repositorio:** [GitHub](https://github.com/juanbecerrap/RecipeHub)

> **Importante:** la demostración pública funciona en modo de solo lectura. Puedes explorar las recetas y consultar sus detalles, pero no crear, editar ni eliminar registros. Estas funciones están disponibles al ejecutar el proyecto localmente. La primera visita a la demostración puede tardar cerca de un minuto debido a las condiciones de los servicios gratuitos.

## Capturas de pantalla

### Catálogo de recetas

![Catálogo de RecipeHub](docs/capturas/catalogo.png)

### Detalle de una receta

![Detalle de una receta](docs/capturas/detalle.png)

### Formulario de recetas

![Formulario de RecipeHub](docs/capturas/formulario.png)

### Confirmación de eliminación

![Confirmación de eliminación](docs/capturas/confirmacion.png)

### Vista móvil

![RecipeHub en dispositivos móviles](docs/capturas/movil.png)

## Funcionalidades

- Catálogo de recetas con imágenes, categorías, tiempo de preparación y dificultad.
- Búsqueda por nombre, sin distinguir mayúsculas ni tildes.
- Filtros por categoría y dificultad que se pueden combinar.
- Vista de detalle con descripción, ingredientes, cantidades, porciones y pasos de preparación.
- Creación, edición y eliminación de recetas.
- Validación de formularios tanto en el frontend como en el backend.
- Mensajes de error y confirmación para las operaciones.
- Estados de carga, error y catálogo vacío.
- Diseño adaptable a dispositivos móviles, tabletas y computadores.
- Modo de solo lectura para proteger los datos de la demostración pública.

## Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| Angular | Interfaz y navegación del frontend |
| TypeScript | Desarrollo del frontend |
| Node.js | Entorno de ejecución del servidor |
| Express | API REST |
| MySQL | Almacenamiento de recetas, categorías e ingredientes |
| mysql2 | Conexión entre Node.js y MySQL |
| Vitest | Pruebas del frontend |
| Node.js Test Runner | Pruebas del backend |
| CSS | Estilos y diseño responsive |
| Git y GitHub | Control de versiones y repositorio |
| Firebase Hosting | Publicación del frontend |
| Render | Despliegue del backend |
| Aiven for MySQL | Base de datos de la demostración |

## Cómo está organizado

El proyecto está dividido en tres partes: frontend, backend y base de datos.

- **Frontend:** aplicación Angular que muestra las recetas y se comunica con el servidor mediante peticiones HTTP.
- **Backend:** API REST desarrollada con Express que valida los datos y ejecuta las operaciones sobre MySQL.
- **Base de datos:** almacena las recetas, las categorías y los ingredientes mediante tablas relacionadas.

La estructura principal del proyecto es la siguiente:

```text
RecipeHub/
├── backend/
│   ├── requests/
│   ├── src/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── app.js
│   │   ├── config.js
│   │   └── db.js
│   ├── test/
│   └── .env.example
├── database/
│   ├── schema.sql
│   └── seed.sql
├── docs/
│   └── capturas/
├── frontend/
│   ├── public/
│   │   └── images/
│   └── src/
│       └── app/
└── README.md
```

## Base de datos

MySQL almacena la información en cuatro tablas principales:

- `categories`: categorías disponibles para clasificar las recetas.
- `recipes`: título, descripción, imagen, tiempo de preparación, dificultad, porciones e instrucciones.
- `ingredients`: ingredientes utilizados en las recetas.
- `recipe_ingredients`: relaciona las recetas con sus ingredientes y guarda las cantidades y unidades correspondientes.

Esta estructura permite relacionar los datos mediante claves foráneas y consultas SQL, sin guardar los ingredientes como un bloque JSON.

Los archivos `database/schema.sql` y `database/seed.sql` contienen, respectivamente, la estructura de las tablas y los datos iniciales de ejemplo.

## API REST

El backend expone una API que devuelve respuestas en formato JSON.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Comprueba el estado de la API y la base de datos |
| GET | `/api/categories` | Consulta las categorías |
| GET | `/api/recipes` | Obtiene las recetas |
| GET | `/api/recipes/:id` | Consulta una receta con sus ingredientes |
| POST | `/api/recipes` | Crea una receta |
| PUT | `/api/recipes/:id` | Actualiza una receta |
| DELETE | `/api/recipes/:id` | Elimina una receta |

La ruta del catálogo acepta los siguientes parámetros opcionales:

- `search`: búsqueda por nombre.
- `category`: filtro por categoría.
- `difficulty`: filtro por dificultad.

Por ejemplo:

```text
GET /api/recipes?search=pasta&difficulty=easy
```

La API también valida los datos recibidos, controla los errores y limita las peticiones. En el modo de solo lectura, las operaciones de escritura son rechazadas por el servidor.

## Instalación y ejecución local

Los siguientes pasos están pensados para Windows y el Símbolo del sistema (CMD).

### Requisitos previos

Instala las siguientes herramientas:

- [Node.js 24 LTS](https://nodejs.org/)
- [MySQL Community Server 8.4 LTS](https://dev.mysql.com/downloads/mysql/)
- [Git](https://git-scm.com/)

Comprueba que estén disponibles desde CMD:

```cmd
node -v
npm -v
mysql --version
git --version
```

### 1. Descargar el proyecto

Abre CMD y ejecuta:

```cmd
git clone https://github.com/juanbecerrap/RecipeHub.git
cd RecipeHub
```

### 2. Crear la base de datos

Inicia sesión en MySQL con un usuario administrador:

```cmd
mysql -u root -p
```

Crea la base de datos y un usuario para la aplicación. Sustituye `CAMBIA_ESTA_CLAVE` por una contraseña propia.

```sql
CREATE DATABASE recipehub
CHARACTER SET utf8mb4
COLLATE utf8mb4_0900_ai_ci;

CREATE USER 'recipehub_app'@'localhost'
IDENTIFIED BY 'CAMBIA_ESTA_CLAVE';

GRANT SELECT, INSERT, UPDATE, DELETE
ON recipehub.*
TO 'recipehub_app'@'localhost';

EXIT;
```

Desde la carpeta raíz del proyecto, importa la estructura y los datos de ejemplo:

```cmd
mysql -u root -p < database\schema.sql
mysql -u root -p --default-character-set=utf8mb4 < database\seed.sql
```

Para comprobar que las recetas y sus ingredientes están relacionados, puedes ejecutar:

```cmd
mysql -u root -p recipehub -e "SELECT r.title, c.name AS categoria, COUNT(ri.ingredient_id) AS ingredientes FROM recipes r JOIN categories c ON c.id = r.category_id LEFT JOIN recipe_ingredients ri ON ri.recipe_id = r.id GROUP BY r.id, r.title, c.name ORDER BY r.id;"
```

La consulta debe mostrar las recetas de ejemplo, sus categorías y el número de ingredientes asociados.

### 3. Configurar y ejecutar el backend

En CMD, desde la carpeta raíz del proyecto:

```cmd
cd backend
copy .env.example .env
notepad .env
```

Edita el archivo `.env` e introduce la contraseña que asignaste a `recipehub_app` en `DB_PASSWORD`. Para trabajar localmente, utiliza los valores de conexión indicados en el apartado de variables de entorno.

Instala las dependencias e inicia el servidor:

```cmd
npm ci
npm run dev
```

La API debe quedar disponible en:

```text
http://localhost:3000
```

Para comprobar la conexión, abre esta dirección en el navegador:

[http://localhost:3000/api/health](http://localhost:3000/api/health)

La respuesta debe indicar que la API y la base de datos están disponibles.

### 4. Ejecutar el frontend

Abre otra ventana de CMD y accede a la carpeta del proyecto:

```cmd
cd RecipeHub\frontend
npm ci
npm start
```

Abre la aplicación en:

[http://localhost:4200](http://localhost:4200)

Mantén abiertas las dos ventanas de CMD mientras trabajas: una para el backend y otra para el frontend.

## Variables de entorno

El backend utiliza el archivo `backend/.env` para configurar la conexión a MySQL y otros parámetros del servidor. La plantilla se encuentra en `backend/.env.example`.

| Variable | Valor local de ejemplo | Descripción |
|---|---|---|
| `NODE_ENV` | `development` | Entorno de ejecución |
| `PORT` | `3000` | Puerto de la API |
| `DB_HOST` | `127.0.0.1` | Servidor MySQL |
| `DB_PORT` | `3306` | Puerto de MySQL |
| `DB_USER` | `recipehub_app` | Usuario de la aplicación |
| `DB_PASSWORD` | Tu contraseña | Contraseña del usuario de MySQL |
| `DB_NAME` | `recipehub` | Nombre de la base de datos |
| `DB_SSL` | `false` | Activa TLS para conexiones remotas |
| `DB_SSL_CA` | Vacío en local | Certificado CA para conexiones remotas que lo requieran |
| `DB_CONNECTION_LIMIT` | `10` | Máximo de conexiones del pool |
| `TRUST_PROXY` | `0` | Número de proxies de confianza |
| `CORS_ORIGINS` | `http://localhost:4200` | Orígenes autorizados |
| `READ_ONLY_DEMO` | `false` | Desactiva las operaciones de escritura cuando está activado |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Ventana del límite de peticiones, en milisegundos |
| `RATE_LIMIT_MAX` | `100` | Máximo de peticiones generales por IP durante la ventana |
| `WRITE_RATE_LIMIT_MAX` | `20` | Máximo de operaciones de escritura por IP durante la ventana |

No compartas tu archivo `.env` ni subas contraseñas o certificados privados al repositorio. La dirección de la API utilizada por el frontend se configura en `frontend/src/environments/`.

## Pruebas

Para ejecutar las pruebas del backend:

```cmd
cd backend
npm test
```

Para ejecutar las pruebas del frontend:

```cmd
cd frontend
npm test -- --no-watch
```

La versión documentada del proyecto cuenta con pruebas para la validación de recetas en el backend y para los servicios, validadores, componentes, formularios, rutas y modo de solo lectura del frontend.

## Despliegue

La demostración pública está distribuida entre tres servicios:

| Parte | Servicio |
|---|---|
| Frontend Angular | [Firebase Hosting](https://firebase.google.com/docs/hosting) |
| API REST | [Render](https://render.com/) |
| Base de datos MySQL | [Aiven](https://aiven.io/) |

Se eligieron servicios con opciones gratuitas para publicar el proyecto sin incorporar un sistema de pagos propio.

La demostración pública tiene algunas limitaciones:

- Render puede suspender la API después de un periodo sin actividad. La primera petición posterior puede tardar en responder.
- La base de datos gratuita de Aiven puede tener restricciones de disponibilidad y uso.
- Firebase Hosting tiene límites de uso asociados a su plan gratuito.
- Las condiciones de los planes pueden cambiar, por lo que conviene revisarlas antes de desplegar una nueva instancia.

Para desplegar una copia propia, hay que configurar las variables de entorno en cada servicio, cargar el esquema y los datos iniciales en MySQL, configurar los orígenes permitidos en CORS y actualizar la dirección de la API del frontend.

En la demostración pública se utiliza `READ_ONLY_DEMO=true` para impedir que visitantes sin autenticación modifiquen los datos.

## Seguridad

Durante el desarrollo se tuvieron en cuenta las siguientes medidas:

- Validación de los datos recibidos en el servidor.
- Consultas SQL parametrizadas para reducir el riesgo de inyección SQL.
- Usuario de MySQL con permisos limitados a las operaciones necesarias.
- Configuración de CORS para aceptar peticiones únicamente desde los orígenes autorizados.
- Cabeceras de seguridad mediante Helmet.
- Límites de peticiones para reducir el uso abusivo de la API.
- Manejo centralizado de errores.
- Variables sensibles fuera del repositorio.
- Modo de solo lectura para la demostración pública.

RecipeHub no tiene autenticación ni cuentas de usuario. Por ese motivo, no se habilitan las operaciones de escritura en la versión pública. Para usar el CRUD completo, se recomienda ejecutar la aplicación localmente.

## Limitaciones conocidas

- No incluye autenticación ni roles.
- No permite subir imágenes desde los formularios; las nuevas imágenes deben añadirse manualmente al proyecto.
- No tiene paginación en el catálogo.
- Los pasos de preparación no se pueden reordenar desde el formulario.
- Los ingredientes que dejan de utilizarse pueden permanecer en la base de datos.
- Las pruebas del backend se centran en la validación de recetas; el resto de la API requiere pruebas adicionales.
- La disponibilidad de la demostración depende de los servicios gratuitos utilizados.

## Posibles mejoras

Algunas mejoras que podrían incorporarse en futuras versiones son:

- Añadir paginación al catálogo.
- Permitir ordenar los pasos de preparación.
- Incorporar carga de imágenes.
- Añadir pruebas de integración para la API.
- Eliminar ingredientes que ya no estén asociados a ninguna receta.
- Implementar autenticación y permisos si el proyecto evoluciona hacia una aplicación multiusuario.

## Créditos

Las fotografías de las recetas y los recursos gráficos utilizados en la aplicación fueron preparados para este proyecto.

## Autor

**Juan Angel Becerra Padilla**

- [GitHub](https://github.com/juanbecerrap)
- [LinkedIn](https://www.linkedin.com/in/juanbecerrap/)

