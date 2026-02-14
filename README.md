# Prueba Técnica - Desarrollador/a Full Stack (Imix)

Servicio que **recibe solicitudes**, las guarda en MongoDB, **simula enriquecimiento con IA** y devuelve el resultado vía API. Frontend en Angular para enviar la solicitud, ver estado y respuesta.

**Stack:** Angular + NestJS + MongoDB (Docker).

**Documentación:** Este README incluye la descripción arquitectónica, decisiones técnicas (Parte 1 y restricciones técnicas) y las respuestas de criterio técnico (Parte 4).

---

## Cómo ejecutar

### Requisitos

- Node.js 18+
- Docker y Docker Compose
- Angular CLI: `npm i -g @angular/cli`
- Nest CLI: `npm i -g @nestjs/cli`

### 1. MongoDB

```bash
docker-compose up -d
```

### 2. Backend

```bash
cd backend
npm install
```

Crea un archivo `.env` basándote en `.env.example`. Ejemplo:

```env
MONGODB_URI=mongodb://localhost:27017/imix-ai
```

Luego ejecuta:

```bash
npm run start:dev
```

API: `http://localhost:3000`

### 3. Frontend

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

La solución está organizada en capas con responsabilidades claras: orden, seguridad y mantenibilidad.

| Capa | Responsabilidad |
|------|-----------------|
| **Presentación (Angular)** | Interacción con el usuario: enviar solicitudes y mostrar resultados. No contiene lógica de negocio ni información sensible. |
| **API (NestJS – Controllers)** | Entrada al sistema: recibe peticiones, valida datos y controla el acceso. No expone datos sensibles; solo deja pasar información ya validada. |
| **Servicios (lógica de negocio)** | Orquesta el flujo: persistencia, llamada al servicio de IA y reglas de negocio. Decide qué información se devuelve al cliente. |
| **Persistencia (MongoDB)** | Solo almacenamiento y recuperación. Sin lógica de negocio ni seguridad; se accede únicamente desde la capa de servicios. |

---

### 2. Recuperación de datos del usuario

La información del usuario se obtiene inicialmente durante el proceso de autenticación, donde se valida su identidad y se recuperan los datos principales.

En el token JWT se incluyen únicamente los identificadores mínimos necesarios (por ejemplo, id y rol), evitando almacenar información sensible o voluminosa.

Al inicio de cada solicitud, el backend utiliza esta información para cargar los datos del usuario desde un sistema de cache (por ejemplo, Redis) o, en su defecto, desde la base de datos.
Esta información se almacena en el contexto de la petición y se reutiliza durante todo el ciclo del request, evitando múltiples consultas repetidas.

De esta forma, los datos del usuario se consultan una sola vez por solicitud y pueden ser reutilizados en las diferentes etapas del procesamiento, mejorando el rendimiento y manteniendo la seguridad.

Este enfoque permite equilibrar eficiencia, escalabilidad y protección de la información.

---

### 3. Responsabilidad de seguridad (quién valida al usuario)
La responsabilidad de la seguridad se maneja en una capa previa a la lógica de negocio, mediante middlewares y guards en el backend.

Estos componentes se encargan de validar el token, verificar permisos y autorizar la solicitud antes de que llegue a los controladores y servicios.

De esta forma, la capa de servicios no tiene conocimiento del usuario ni de los mecanismos de autenticación, y se enfoca únicamente en el procesamiento de la información.

---

### 4. Interfaz web y móvil con distinto look & feel

En el caso de requerir dos aplicaciones (web y móvil) con funcionalidades similares pero con estilos y experiencia de usuario diferentes, se propone un backend único para ambas plataformas.

Este backend expone una API REST con contratos de datos estables (API Contract), permitiendo que todos los clientes consuman la información de la misma forma.
Esto es especialmente adecuado para aplicaciones cuya estructura de datos no cambia con frecuencia.

Para evitar que los cambios en la API afecten a todas las aplicaciones, se implementa un sistema de versionado (por ejemplo, /api/v1, /api/v2).
De esta manera, es posible realizar modificaciones para una plataforma sin afectar a las demás.

En escenarios donde la aplicación evoluciona constantemente o donde las necesidades de web y móvil son muy diferentes, se puede implementar un patrón Backend for Frontend (BFF).
Esto permite adaptar las respuestas a cada cliente, distribuir la carga y evitar un único punto de entrada central difícil de mantener en el tiempo.

Este enfoque permite garantizar una experiencia consistente entre plataformas, manteniendo la simplicidad, escalabilidad y facilidad de mantenimiento.

---

### 5. Manejo de sesión

El manejo de sesión se basa en autenticación mediante JSON Web Tokens (JWT), siguiendo un enfoque stateless, donde el servidor no mantiene estado de sesión en memoria.

Una vez autenticado, el usuario recibe un token firmado que contiene la información necesaria para su identificación. Este token se envía en cada solicitud al backend a través del header Authorization.

La validación del token se realiza mediante guards en NestJS antes de acceder a la lógica de negocio.

Para garantizar la seguridad, los tokens tienen un tiempo de expiración limitado.
Adicionalmente, se implementa un mecanismo de refresh token que permite renovar la sesión sin requerir que el usuario inicie sesión nuevamente.

Los refresh tokens pueden almacenarse de forma segura (por ejemplo, en cookies HttpOnly o en base de datos) y se utilizan únicamente para generar nuevos tokens de acceso.

---

### 6. Protección de información sensible sin consultar la BD en cada request

La información sensible del usuario se mantiene únicamente en el backend y nunca se expone directamente al frontend.

El cliente solo envía un token JWT con los identificadores básicos.
Con este token, el backend recupera los datos necesarios desde un sistema de cache (por ejemplo, Redis) o desde la base de datos si no están en cache.

Esta información se almacena en el contexto de la solicitud y se utiliza durante todo el procesamiento, evitando consultas repetidas a la base de datos.

Además, las respuestas de la API son filtradas para devolver únicamente los datos necesarios para la interfaz, garantizando que la información confidencial no sea expuesta.

---

### 7. Integración con Single Sign-On (SSO)

Se implementa un proveedor de identidad centralizado como Keycloak, encargado de gestionar la autenticación de usuarios, credenciales y sesiones.

Las aplicaciones web y móvil redirigen al usuario a Keycloak para iniciar sesión.
Una vez autenticado, Keycloak valida las credenciales y emite un token JWT firmado con la información del usuario y sus roles.

Este token es utilizado para acceder al backend, donde es validado mediante guards, sin necesidad de manejar contraseñas o procesos de login propios.

De esta forma, se centraliza la seguridad, se evita duplicar credenciales y se garantiza una experiencia de autenticación unificada entre aplicaciones.

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

- **Seguridad:** Autenticación JWT en endpoints críticos, validar y sanitizar inputs, CORS restringido por entorno.
- **Base de datos:** Índices en campos de búsqueda, paginación para listar resultados, backups automáticos.
- **Escalabilidad:** Múltiples instancias del backend con load balancer, procesar IA en background con queue, cache en frontend.
- **Testing:** Tests unitarios en service, tests de integración en API, cobertura mínima en lógica crítica.

### ¿Dónde pondrías límites de responsabilidad entre servicios?

- **Frontend:** Solo UI, envío de solicitudes, visualización de resultados.
- **Backend (Controller):** Validar entrada, autorizar, delegar al service.
- **Backend (Service):** Orquesta persistencia, IA mock, reglas de negocio.
- **AiMockService:** Recibe texto, devuelve enriquecido. Sin acceso a BD ni autenticación.
- **MongoDB:** Solo almacenamiento. Sin lógica de negocio.

