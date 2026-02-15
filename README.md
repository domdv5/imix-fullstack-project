# Prueba Técnica - Desarrollador/a Full Stack (Imix)

Servicio que **recibe solicitudes**, las guarda en MongoDB, **simula enriquecimiento con IA**, Muestra el historial de las mismas y devuelve el resultado vía API. Frontend en Angular para enviar la solicitud, ver estado y respuesta.

**Stack:** Angular + NestJS + MongoDB (Docker).

**Documentación:** Este README incluye la descripción arquitectónica, decisiones técnicas (Parte 1 y restricciones técnicas) y las respuestas de criterio técnico (Parte 4).

---

## Cómo ejecutar

### Requisitos

- Node.js 18+
- Docker y Docker Compose
- Angular CLI: `npm i -g @angular/cli`
- Nest CLI: `npm i -g @nestjs/cli`

Abra el proyecto en un editor de código (por ejemplo, Visual Studio Code), luego acceda a la terminal integrada y ejecute el siguiente comando.

### 1. MongoDB (Terminal 1)

```bash
docker-compose up -d
```

### 2. Backend (Terminal 2)

```bash
cd backend
npm install
```

Crea un archivo `.env` basándote en `.env.example`:

```env
MONGODB_URI=mongodb://localhost:27017/prueba_db
```

Luego ejecuta:

```bash
npm run start:dev
```

API: `http://localhost:3000`

### 3. Frontend (Terminal 3)

```bash
cd frontend
npm install
ng serve
```

App: `http://localhost:4200`

---

## API

**POST /solicitudes**

- **Body:** `{ "texto": "string" }` (contenido de la solicitud)
- **Flujo:** Guarda en MongoDB → simula llamada a IA → devuelve resultado enriquecido
- **Respuesta:** `{ "id", "texto", "textoEnriquecido", "createdAt" }`

---

## Arquitectura y restricciones técnicas

Respuestas a las preguntas de diseño del enunciado, agrupadas por tema.

---

### 1. Esquema de capas y protección de la información

Se propone organizar la solución en capas con responsabilidades claras: orden, seguridad y mantenibilidad.

| Capa | Responsabilidad |
|------|------------------|
| **Presentación** | UI (Angular): interacción usuario, envío de solicitudes, visualización de resultados. Sin lógica de negocio ni información sensible. |
| **API (Controllers)** | Entrada al sistema: recibe peticiones, valida datos, controla acceso. No expone datos sensibles; solo información validada. |
| **Servicios (lógica de negocio)** | Orquesta flujo: persistencia, servicios externos (IA), reglas de negocio. Decide qué información devuelve. |
| **Persistencia (MongoDB)** | Solo almacenamiento y recuperación. Sin lógica de negocio ni seguridad; acceso únicamente desde servicios. |

---

### 2. Recuperación de datos del usuario

Se propone obtener información del usuario inicialmente durante autenticación, validando identidad y recuperando datos principales.

En el token JWT se incluyen únicamente identificadores mínimos necesarios (id, rol), evitando información sensible o voluminosa.

Al inicio de cada solicitud, el backend usa este token para cargar datos desde cache (Redis) o base de datos. Esta información se almacena en contexto de petición y se reutiliza durante todo el ciclo del request, evitando consultas repetidas.

De esta forma, datos del usuario se consultan una sola vez por solicitud y pueden reutilizarse en diferentes etapas, mejorando rendimiento y manteniendo seguridad. Este enfoque equilibra eficiencia, escalabilidad y protección de información.

---

### 3. Responsabilidad de seguridad (quién valida al usuario)

Se propone manejar seguridad en una capa previa a la lógica de negocio, mediante middlewares y guards en el backend.

Estos componentes validan token, verifican permisos y autorizan la solicitud ANTES de llegar a controllers y servicios.

De esta forma, la capa de servicios no tiene conocimiento del usuario ni de mecanismos de autenticación, enfocándose únicamente en procesamiento de información.

---

### 4. Interfaz web y móvil con distinto look & feel

En caso de requerir dos aplicaciones (web y móvil) con funcionalidades similares pero estilos distintos, se propone un backend único para ambas plataformas.

Este backend expone una API REST con contratos de datos estables (API Contract), permitiendo que todos los clientes consuman información de la misma forma. Esto es especialmente adecuado para aplicaciones cuya estructura no cambia frecuentemente.

Para evitar que cambios en API afecten todas las apps, se implementa versionado (/api/v1, /api/v2), permitiendo modificaciones para una plataforma sin afectar otras.

En escenarios donde la aplicación evoluciona constantemente o necesidades de web y móvil son muy diferentes, se puede implementar Backend for Frontend (BFF), adaptando respuestas por cliente, distribuyendo carga, evitando un único punto central difícil de mantener.

Este enfoque garantiza experiencia consistente entre plataformas, manteniendo simplicidad, escalabilidad y facilidad de mantenimiento.

---

### 5. Manejo de sesión

Se propone basarse en autenticación mediante JSON Web Tokens (JWT), siguiendo enfoque stateless donde servidor no mantiene estado de sesión en memoria.

Una vez autenticado, usuario recibe token firmado con información necesaria para identificación. Este token se envía en cada solicitud al backend via header Authorization.

Validación ocurre mediante guards en NestJS antes de acceder a lógica de negocio.

Para garantizar seguridad, tokens tienen tiempo de expiración limitado. Se implementa mecanismo de refresh token que permite renovar sesión sin requerir nuevo login.

Refresh tokens almacenados de forma segura (cookies HttpOnly o BD) se utilizan únicamente para generar nuevos tokens de acceso.

---

### 6. Protección de información sensible sin consultar la BD en cada request

Se propone mantener información sensible únicamente en backend, nunca exponerla directamente al frontend.

Cliente envía token JWT con identificadores básicos. Con este token, backend recupera datos necesarios desde cache (Redis) o base de datos si no están en cache.

Esta información se almacena en contexto de solicitud y se utiliza durante procesamiento, evitando consultas repetidas a BD.

Además, respuestas de API se filtran para devolver únicamente datos que la interfaz necesita, garantizando que información confidencial no sea expuesta.

---

### 7. Integración con Single Sign-On (SSO)

Se propone implementar un proveedor de identidad centralizado como Keycloak, encargado de gestionar autenticación de usuarios, credenciales y sesiones.

Aplicaciones web y móvil redirigen usuario a Keycloak para iniciar sesión. Una vez autenticado, Keycloak valida credenciales y emite token JWT firmado con información del usuario y sus roles.

Este token es utilizado para acceder al backend, donde es validado mediante guards, sin necesidad de manejar contraseñas o procesos de login propios.

De esta forma, se centraliza seguridad, se evita duplicar credenciales y se garantiza experiencia de autenticación unificada entre aplicaciones.

---

## Parte 1 – Diseño (decisiones tomadas)

### ¿Cómo diseñarías la arquitectura de este servicio?

**Arquitectura implementada:**

- **Componentes:** 
  - Frontend Angular
  - API REST (NestJS) sin autenticación/autorización en la versión actual
  - Servicios (lógica de negocio integrada)
  - MongoDB (con Mongoose ODM)
  - Mock de IA (`AiMockService`) integrado en el servicio

- **Flujo real:**
  - Cliente envía `POST /solicitudes` con `{ texto }`
  - Controller valida con DTO (class-validator: `@IsString()`, `@IsNotEmpty()`, `@MaxLength(5000)`)
  - Service persiste en MongoDB y llama a `AiMockService.enriquecer()`
  - `AiMockService` simula delay (800ms) y retorna texto enriquecido
  - Respuesta: `{ id, texto, textoEnriquecido, createdAt }`

- **Validación:**
  - DTO level: Validación de datos en entrada
  - Gestión de errores: Captura de excepciones en Service (BD y simulación IA)
  - HTTP status apropiados: 400 (validación), 404 (no encontrado), 503 (disponibilidad)

- **Estado actual vs. Documentado:**
  - ✅ **Implementado:** Separación de capas (Controller → Service → Model)
  - ✅ **Implementado:** Validación con DTOs
  - ✅ **Implementado:** Manejo de errores robusto
  - ❌ **NO implementado:** Autenticación, autorización, JWT, SSO
  - ❌ **NO implementado:** Rate limiting, CORS dinámico
  - ❌ **NO implementado:** Health checks, structured logging
  - ❌ **NO implementado:** Tests automatizados

- **Escalabilidad:** 
  - **Hoy:** La API corre en 1 servidor. Si recibe 1000 solicitudes simultáneas, se saturará.
  - **Qué falta:** Load balancer (distribuye solicitudes entre múltiples instancias del backend), índices en MongoDB (acelera búsquedas), y health checks (para detectar servidores caídos).
  - **Si se integra IA real:** Usa una cola (Bull/Redis) para no bloquear la API mientras procesa IA.



## Parte 4 – Criterio técnico (respuestas breves)

### ¿Cuál sería el mejor modelo de despliegue para esta solución?

El mejor modelo de despliegue es mediante contenedores Docker para el backend, frontend y base de datos, garantizando consistencia entre entornos.

El frontend se construye como archivos estáticos y se sirve mediante un servidor web como Nginx.
El backend se despliega como un servicio stateless.
La base de datos puede ejecutarse en contenedor o como servicio administrado.

Este enfoque permite facilitar la escalabilidad, automatizar despliegues y reducir problemas de configuración entre desarrollo y producción.

### ¿Cómo esta solución es escalable en volúmenes transaccionales, concurrencia y datos?

**Problemas actuales:** API monolítica en 1 servidor. `GET /solicitudes` retorna TODO sin paginación (problema con volúmenes grandes). `POST` es bloqueante por el enriquecimiento IA.

**Para escalar:** Múltiples instancias detrás de load balancer, agregar índices en MongoDB, implementar paginación, usar queue (Bull/Redis) para procesar IA en background.

### ¿Qué mejorarías en producción?

- **Seguridad:** Autenticación JWT en endpoints críticos, asi como manejar control de acceso basado en roles (RBAC)
- **Manejo de errores:** Utilizar exception filters de NestJS para centralizar el manejo de errores en un unico archivo lo cual es benifecioso para un tema de control y escalabilidad.
- **Base de datos:** Índices en campos de búsqueda, paginación para listar resultados, backups automáticos.
- **Configuración:** Variables de entorno para BD, puerto, CORS, secrets (NODE_ENV, API_PORT, CORS_ORIGIN, JWT_SECRET).
- **Documentación API:** Swagger/OpenAPI para documentar endpoints automáticamente, facilitar testing y cliente side generation.
- **Escalabilidad:** Se soporta mediante múltiples instancias del backend detrás de un load balancer, permitiendo manejar mayor concurrencia y alta disponibilidad; El procesamiento de IA se desacopla mediante una cola (por ejemplo Redis), ejecutándose en background para evitar bloquear las solicitudes y mejorar el rendimiento.

### ¿Dónde pondrías límites de responsabilidad entre servicios?

- **Frontend:** Solo UI, envío de solicitudes, visualización de resultados.
- **Backend (Controller):** Validar entrada, autorizar, delegar al service.
- **Backend (Service):** Orquesta persistencia, IA mock, reglas de negocio.
- **AiMockService:** Recibe texto, devuelve enriquecido. Sin acceso a BD ni autenticación.
- **MongoDB:** Solo almacenamiento. Sin lógica de negocio.

