# Quirón - Autoasignación de Citas Médicas (Multi-Tenant & BFF)

Módulo unificado de **Autoasignación de Citas Médicas y Portal de Pacientes**, desarrollado con **SvelteKit (Svelte 5 con Runes)**, **Tailwind CSS v4**, caché en memoria con **Valkey** y una capa de datos desacoplada a través de **apir** y base de datos maestra.

Este proyecto implementa una arquitectura **Multi-Tenant dinámica** donde un único contenedor web es capaz de atender a múltiples clínicas y hospitales a través de subdominios (`*.autoasignacion.ekisa.com.co`), inyectando en tiempo de ejecución sus colores corporativos, logotipos y túneles privados de datos.

---

## Tecnologías Principales

- **Frontend & BFF:** [SvelteKit 2](https://kit.svelte.dev/) con [Svelte 5 (Runes)](https://svelte.dev/docs/svelte/v5-migration-guide)
- **Capa de Caché Distribuido:** [Valkey](https://valkey.io/) (Almacenamiento en memoria compatible con Redis)
- **Capa de Datos On-Premise:** **apir** (Microservicio en Go para interacción RESTful con SQL Server)
- **Base de Datos Maestra:** Microsoft SQL Server (`ekisapp`) para resolución de tenants
- **Proxy Inverso & TLS:** [Caddy Server](https://caddyserver.com/) con certificados SSL automáticos On-Demand
- **Estilos & UI:** [Tailwind CSS v4](https://tailwindcss.com/), [Shadcn Svelte](https://shadcn-svelte.com/) y [Bits UI](https://bits-ui.com/)
- **Iconografía:** [Unplugin Icons](https://github.com/unplugin/unplugin-icons) ([Lucide](https://lucide.dev/))
- **Seguridad:** [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) y [Argon2id](https://www.npmjs.com/package/argon2)
- **Despliegue:** GitHub Actions y GitHub Container Registry (GHCR)

---

## Arquitectura y Flujo de Resolución de Tenants

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

---

## Entorno de Desarrollo Local

### 1. Variables de Entorno (`.env`)

Crear un archivo `.env` en la raíz del proyecto:

```env
DATABASE_URL="sqlserver://usuario:clave@servidor:1433?database=QUIRON2INSTITUCIONES&encrypt=true"
DATABASE_MASTER_URL="sqlserver://usuario:clave@servidor:1433?database=QUIRON2INSTITUCIONES&encrypt=true"
VALKEY_URL="valkey://localhost:6379"
API_TUNNEL_URL="http://localhost:8080/api/v1"
PUBLIC_BASE_URL="http://localhost:5173"
JWT_SECRET_KEY="tu_clave_secreta_jwt"
PUBLIC_TURNSTILE_SITE_KEY="tu_site_key_turnstile"
TURNSTILE_SECRET_KEY="tu_secret_key_turnstile"
```

### 2. Levantar Servicios Locales

#### Paso A: Levantar el contenedor de Valkey**

```bash
docker compose up -d
```

#### Paso B: Levantar la API de datos**

```bash
bun run apir
```

#### Paso C: Levantar la aplicación web**

```bash
bun run dev
```

### 3. Probar Tenants en Desarrollo

- **Cliente Desarrollo (67):** `http://localhost:5173/login?tenant=desarrollo`
- **Cliente Escanografía (41/2):** `http://localhost:5173/login?tenant=escanografia`
- **Cliente inexistente (404):** `http://localhost:5173/login?tenant=desconocido`
