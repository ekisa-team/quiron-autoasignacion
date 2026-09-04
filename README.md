# Quirón - Autoasignación de Citas Médicas (Multi-Tenant & BFF)

Módulo unificado de **Autoasignación de Citas Médicas y Portal de Pacientes**, desarrollado con **SvelteKit (Svelte 5 con Runes)**, **Tailwind CSS v4**, caché en memoria con **Valkey** y una capa de datos desacoplada a través de **HCLAPI** y base de datos maestra.

Este proyecto implementa una arquitectura **Multi-Tenant dinámica** donde un único contenedor web es capaz de atender a múltiples clínicas y hospitales a través de subdominios (`*.autoasignacion.ekisa.com.co`), inyectando en tiempo de ejecución sus colores corporativos, logotipos y túneles privados de datos.

---

## Tecnologías Principales

- **Frontend & BFF:** [SvelteKit 2](https://kit.svelte.dev/) con [Svelte 5 (Runes)](https://svelte.dev/docs/svelte/v5-migration-guide)
- **Capa de Caché Distribuido:** [Valkey](https://valkey.io/) (Almacenamiento en memoria ultrarrápido compatible con Redis)
- **Capa de Datos On-Premise:** **HCLAPI** (Microservicio en Go para interacción RESTful con SQL Server)
- **Base de Datos Maestra:** Microsoft SQL Server (`ekisapp`) para resolución de tenants
- **Proxy Inverso & TLS:** [Caddy Server](https://caddyserver.com/) con certificados SSL automáticos On-Demand
- **Estilos & UI:** [Tailwind CSS v4](https://tailwindcss.com/), [Shadcn Svelte](https://shadcn-svelte.com/) y [Bits UI](https://bits-ui.com/)
- **Iconografía:** [Unplugin Icons](https://github.com/unplugin/unplugin-icons) ([Lucide](https://lucide.dev/))
- **Seguridad:** [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) (Captcha inteligente) y [Argon2id](https://www.npmjs.com/package/argon2)
- **Despliegue Continuo:** GitHub Actions, GitHub Container Registry (GHCR) y [Watchtower](https://containrrr.dev/watchtower/)

---

## Arquitectura y Flujo de Resolución de Tenants

La aplicación utiliza un único despliegue centralizado que identifica al cliente a partir del encabezado `Host` de cada solicitud HTTP entrante:

```mermaid
flowchart TD
    A["Navegador<br/>https://escanografia.autoasignacion.ekisa.com.co"]
    B["Caddy<br/>Proxy inverso"]
    C["SvelteKit<br/>src/hooks.server.ts"]
    D["Obtener identificador del tenant<br/>TenantIdentifier"]
    E["Valkey<br/>GET tenant:config:{TenantIdentifier}"]
    F{"¿Configuración<br/>en caché?"}
    G["Leer configuración<br/>desde Valkey"]
    H["Consultar BD / API<br/>por TenantIdentifier"]
    I["Guardar configuración en Valkey<br/>SETEX tenant:config:{TenantIdentifier} 3600"]
    J{"¿Tenant<br/>existe?"}
    K["404<br/>Tenant no encontrado"]
    L["Asignar configuración a<br/>event.locals.tenant"]
    M["Vistas y páginas<br/>renderizan con la configuración del tenant"]

    A -->|"Host"| B
    B --> C
    C --> D
    D --> E

    E --> F
    F -->|"Sí"| G
    F -->|"No"| H

    H --> I
    G --> J
    I --> J

    J -->|"No"| K
    J -->|"Sí"| L
    L --> M
```

1. **Subdominio Wildcard:** Caddy recibe cualquier petición dirigida a `*.autoasignacion.ekisa.com.co`, gestiona el certificado SSL correspondiente y reenvía el tráfico al contenedor de SvelteKit.
2. **Caché en Valkey:** El middleware `hooks.server.ts` extrae el subdominio y consulta en Valkey (`tenant:config:{id}`). Si no existe, realiza la consulta a la tabla `dbo.Clientes` en la base de datos maestra (`ekisapp`) y almacena el resultado por 3600 segundos.
3. **Theming en Tiempo Real:** El layout inyecta las variables CSS personalizadas del cliente directamente en el `<head>`, evitando parpadeos visuales (FOUC).
4. **Túneles de Datos Dedicados:** Mediante `AsyncLocalStorage`, las peticiones a la API médica se enrutan automáticamente hacia la URL del túnel del cliente (`hclapiUrl`).

---

## Estructura del Proyecto

```text
quiron-autoasignacion/
├── .github/
│   └── workflows/                    # Automatizaciones de CI y Release
│       ├── ci.yaml                   # Verificación de código y tipos en PRs
│       └── release.yaml              # Empaquetado a GHCR y empaquetado de HCL en tags
├── deploy/                           # Archivos para el servidor de producción (Hetzner)
│   ├── Caddyfile                     # Configuración de Caddy con On-Demand TLS
│   └── docker-compose.yaml           # Orquestación: Caddy, App, Valkey y Watchtower
├── docker/
│   └── app.Dockerfile                # Multi-stage Dockerfile de SvelteKit con Bun
├── hclapi/                           # Configuraciones de endpoints SQL por clínica
│   └── escanografia/                 # Reglas de negocio para Escanografía
├── src/
│   ├── hooks.server.ts               # Middleware: secuencia de Tenant y Auth
│   ├── lib/
│   │   ├── server/                   
│   │   │   ├── api.ts                # Cliente HTTP para túneles HCLAPI
│   │   │   ├── master-db.ts          # Conexión dedicada a base de datos maestra
│   │   │   ├── tenant.ts             # Servicio de resolución de tenants con caché
│   │   │   ├── tenant-context.ts     # Almacén de contexto asíncrono para túneles
│   │   │   └── valkey.ts             # Cliente singleton de Valkey protegido para HMR
│   │   ├── types/                    
│   │   │   └── tenant.ts             # Contratos de datos de configuración de tenants
│   │   └── utils/
│   │       └── theme.ts              # Generador de variables CSS dinámicas
│   └── routes/
│       ├── (app)/                    # Rutas privadas protegidas por layout
│       └── (auth)/                   # Rutas públicas protegidas por layout
├── docker-compose.local.yaml         # Entorno local para levantar Valkey
├── package.json
└── vite.config.ts
```

---

## Entorno de Desarrollo Local

### 1. Requisitos Previos

- [Bun](https://bun.sh/) instalado.
- Docker y Docker Compose activos.
- Binario de `hclapi` en el sistema.

### 2. Configurar Variables de Entorno (`.env`)

Crear un archivo `.env` en la raíz del proyecto:

```env
DATABASE_URL="sqlserver://usuario:clave@servidor:1433?database=QUIRON2INSTITUCIONES&encrypt=true"
DATABASE_MASTER_URL="sqlserver://usuario:clave@servidor:1433?database=QUIRON2INSTITUCIONES&encrypt=true"
VALKEY_URL="valkey://localhost:6379"
API_TUNNEL_URL="http://localhost:8080/api/v1"
PUBLIC_BASE_URL="http://localhost:5173"
JWT_SECRET_KEY="tu_clave_secreta_jwt"
PUBLIC_TURNSTILE_SITE_KEY="0x4AAAAAAEk0UG_G5yh5I_bN"
TURNSTILE_SECRET_KEY="0x4AAAAAAEk0UH2cy-3ee_lNFJdVJ8XxLpo"
```

### 3. Levantar Servicios Locales

#### Paso A: Levantar el contenedor de Valkey**

```bash
docker compose -f docker-compose.local.yaml up -d
```

#### Paso B: Levantar la API de datos (Terminal 1)**

```bash
bun run hclapi
```

#### Paso C: Levantar la aplicación web (Terminal 2)

```bash
bun run dev
```

### 4. Probar Tenants en Desarrollo

Dado que `localhost` no cuenta con subdominios reales por defecto, se simula el cliente utilizando el parámetro `tenant`:

- **Cliente Desarrollo (67):** `http://localhost:5173/login?tenant=desarrollo`
- **Cliente Escanografía (41/2):** `http://localhost:5173/login?tenant=escanografia`
- **Cliente inexistente (Validación 404):** `http://localhost:5173/login?tenant=desconocido`
