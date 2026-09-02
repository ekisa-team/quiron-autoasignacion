# Quirón - Autoasignación de Citas Médicas (Fullstack + HCLAPI)

Módulo unificado de **Autoasignación de Citas Médicas y Portal de Pacientes**, desarrollado con **SvelteKit (Svelte 5 con Runes)**, **Tailwind CSS v4** y una capa de datos desacoplada de alto rendimiento a través de **HCLAPI**.

Este proyecto consolida y reemplaza la arquitectura anterior (.NET 8 API + Angular 19) en una arquitectura moderna basada en el patrón BFF (Backend For Frontend).

---

## Tecnologías Principales

- **Frontend & BFF:** [SvelteKit 2](https://kit.svelte.dev/) con [Svelte 5 (Runes)](https://svelte.dev/docs/svelte/v5-migration-guide)
- **Capa de Datos:** **HCLAPI** (Microservicio en Go para interacción RESTful con SQL Server)
- **Lenguaje:** [TypeScript 6](https://www.typescriptlang.org/) (Tipado estricto, 0% `any`)
- **Estilos & UI:** [Tailwind CSS v4](https://tailwindcss.com/), [Shadcn Svelte](https://shadcn-svelte.com/) y [Bits UI](https://bits-ui.com/)
- **Iconografía:** [Unplugin Icons](https://github.com/unplugin/unplugin-icons) ([Lucide](https://lucide.dev/))
- **Base de Datos:** [Microsoft SQL Server](https://www.microsoft.com/sql-server)
- **Criptografía:** [Argon2id](https://www.npmjs.com/package/argon2) (100% compatible con hashes de .NET)
- **Autenticación & Sesión:** JWT firmados (`jsonwebtoken`) en cookies seguras `HttpOnly`
- **Mensajería:** [Nodemailer](https://nodemailer.com/) con resolución dinámica de credenciales SMTP por cliente
- **Seguridad:** [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) (Captcha inteligente)

---

## Arquitectura y Multi-Tenant

El sistema gestiona múltiples clínicas/entidades (`IdCliente`) dividiendo responsabilidades en dos capas:

```text
Navegador (Usuario)
        ↓
[ SVELTEKIT - Capa BFF ]  ← (Maneja SSR, Turnstile, JWT, UI)
        ↓ HTTP / JSON
[   HCLAPI - Capa API  ]  ← (Maneja SQL Server, Connection Pools, Reglas de Negocio)
        ↓
  Base de Datos (SQL Server)
```

1. **Resolución de Tenant (`clientId`):** SvelteKit resuelve el cliente a través de Query Params (`?c=`), Token de sesión o Cookies, y transmite este parámetro a HCLAPI en cada petición.
2. **Desacoplamiento de BD:** SvelteKit **NO** se conecta directamente a la base de datos. Todo el flujo de datos (consultas, Stored Procedures y actualizaciones) está expuesto por la capa HCLAPI mediante endpoints REST rápidos y seguros.

---

## Estructura del Proyecto

```text
quiron-autoasignacion/
├── hclapi/                           #  Capa de Datos (Servicio HCLAPI)
│   └── escanografia/                 
│       ├── connections.hcl           # Configuración del pool SQL Server
│       ├── server.hcl                # Configuración del servidor Go (Puerto 8080)
│       └── routes/                   # Endpoints SQL definidos en HCL
├── src/
│   ├── app.d.ts                      
│   ├── hooks.server.ts               # Middlewares y resolución de Tenant
│   ├── lib/
│   │   ├── components/               # UI y Dashboard
│   │   ├── server/                   # Lógica BFF
│   │   │   ├── api.ts                # [NUEVO] Cliente HTTP para consumir HCLAPI
│   │   │   ├── email.ts              # Servicio SMTP dinámico
│   │   │   ├── jwt.ts                
│   │   │   ├── password.ts           # Argon2id Hasher
│   │   │   └── turnstile.ts          
│   │   └── types/                    # Interfaces TS (Mapeo de Raw*Api)
│   └── routes/
│       ├── (app)/                    # App protegida
│       ├── (auth)/                   # Vistas de autenticación
│       └── api/                      # Endpoints internos de SvelteKit
├── package.json
└── vite.config.ts
```

---

## Configuración y Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# URL de la base de datos que consumirá HCLAPI
DATABASE_URL="sqlserver://usuario:clave@servidor:1433?database=QUIRON2INSTITUCIONES&encrypt=true"

# URL Interna de HCLAPI (Para que SvelteKit se comunique)
API_TUNNEL_URL="http://localhost:8080/api/v1"

# URL Pública de SvelteKit
PUBLIC_BASE_URL="http://localhost:5173"

# Seguridad y Sesión
JWT_SECRET_KEY="tu_super_secreto_jwt"

# Cloudflare Turnstile (Captcha)
PUBLIC_TURNSTILE_SITE_KEY="1x00000000000000000000AA"
TURNSTILE_SECRET_KEY="1x0000000000000000000000000000000AA"
```

---

## Instalación y Ejecución Local

Para levantar el entorno de desarrollo, se deben ejecutar los dos servicios en terminales separadas:

```bash
# 1. Instalar dependencias
bun install

# 2. Levantar la capa de Base de Datos (HCLAPI) - Terminal 1
bun run hclapi

# 3. Levantar el Frontend (SvelteKit) - Terminal 2
bun run dev
```

La documentación Swagger autogenerada de la base de datos estará en `http://localhost:8080/docs`.
