# Quirón - Autoasignación de Citas Médicas (Fullstack)

Módulo unificado de **Autoasignación de Citas Médicas y Portal de Pacientes**, desarrollado con **SvelteKit (Svelte 5 con Runes)**, **Tailwind CSS v4** y conexión directa multi-tenant a **Microsoft SQL Server**.

Este proyecto consolida y reemplaza la arquitectura anterior desacoplada (.NET 8 API + Angular 19) en una única base de código fullstack de alto rendimiento.

---

## Tecnologías Principales

- **Framework:** [SvelteKit 2](https://kit.svelte.dev/) con [Svelte 5 (Runes)](https://svelte.dev/docs/svelte/v5-migration-guide)
- **Lenguaje:** [TypeScript 6](https://www.typescriptlang.org/) (Tipado estricto, 0% `any`)
- **Estilos & UI:** [Tailwind CSS v4](https://tailwindcss.com/), [Shadcn Svelte](https://shadcn-svelte.com/) y [Bits UI](https://bits-ui.com/)
- **Iconografía:** [Unplugin Icons](https://github.com/unplugin/unplugin-icons) ([Lucide](https://lucide.dev/))
- **Base de Datos:** [Microsoft SQL Server](https://www.microsoft.com/sql-server) con pool de conexiones multi-tenant en memoria (`mssql`)
- **Criptografía:** [Argon2id](https://www.npmjs.com/package/argon2) (100% compatible con hashes de .NET)
- **Autenticación & Sesión:** JWT firmados (`jsonwebtoken`) en cookies seguras `HttpOnly`
- **Mensajería:** [Nodemailer](https://nodemailer.com/) con resolución dinámica de credenciales SMTP por cliente
- **Seguridad:** [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) (Captcha inteligente)
- **Notificaciones:** [Svelte Sonner]

---

## Arquitectura Multi-Tenant

El sistema gestiona múltiples clínicas/entidades (`IdCliente`) desde un único despliegue:

```text
Petición Entrante (?c= / Cookie / Header)
                    ↓
   hooks.server.ts (Resolución de Tenant)
                    ↓
      db.ts (Pool Manager en Memoria)
    ┌───────────────┴───────────────┐
    ↓                               ↓
BD Maestra (ekisapp)      BD Clínica (Cliente 2, 67, etc.)
(dbo.Clientes)            (dbo.Pacientes, Cit_Agenda, SPs)
```

1. **Resolución de Tenant (`clientId`):**
   - Jerarquía: `Query Param (?c=)` $\rightarrow$ `Token de Sesión` $\rightarrow$ `Cookie (client_id)` $\rightarrow$ `Default (67)`.
2. **Conexión Dinámica a BD:**
   - La base de datos maestra (`ekisapp`) resuelve la cadena de conexión de cada clínica desde la columna `dbo.Clientes.BaseDatos`.
   - Se mantiene un pool de conexiones en memoria (`Map<number, ConnectionPool>`) para reutilizar conexiones activas y optimizar recursos.

---

## Estructura del Proyecto

```text
quiron-autoasignacion/
├── src/
│   ├── app.d.ts                      # Tipado global de sesión y locals
│   ├── app.html                      # Template base con script de Turnstile
│   ├── hooks.server.ts               # Middlewares: Route Guards y resolución de Tenant
│   ├── lib/
│   │   ├── components/
│   │   │   ├── dashboard/            # Componentes atómicos del módulo de citas
│   │   │   │   ├── AppointmentsTable.svelte
│   │   │   │   ├── AssignModal.svelte
│   │   │   │   ├── AvailabilityTable.svelte
│   │   │   │   ├── CalendarWidget.svelte
│   │   │   │   ├── CancelModal.svelte
│   │   │   │   ├── ChangePasswordModal.svelte
│   │   │   │   └── PatientFilters.svelte
│   │   │   ├── ui/                   # Componentes base Shadcn / Bits UI
│   │   │   └── Turnstile.svelte      # Componente reactivo de Captcha
│   │   ├── server/                   # Lógica de servidor y seguridad
│   │   │   ├── db.ts                 # Connection Pool Manager de SQL Server
│   │   │   ├── email.ts              # Servicio SMTP dinámico y plantillas HTML
│   │   │   ├── jwt.ts                # Emisión y validación de tokens de sesión
│   │   │   ├── password.ts           # Hasher y verificador Argon2id
│   │   │   └── turnstile.ts          # Validador de Captcha en backend
│   │   ├── types/                    # Modelos y contratos TypeScript en inglés
│   │   │   ├── appointments.ts
│   │   │   └── auth.ts
│   │   └── utils.ts                  # Formateadores de fecha, hora y helpers
│   └── routes/
│       ├── (app)/                    # Rutas protegidas (Dashboard de citas)
│       │   ├── +layout.server.ts
│       │   ├── +layout.svelte
│       │   ├── +page.server.ts
│       │   └── +page.svelte
│       ├── (auth)/                   # Rutas públicas de autenticación
│       │   ├── forgot-password/
│       │   ├── login/
│       │   ├── reset-password/
│       │   ├── signup/
│       │   └── verify-email/
│       └── api/                      # Endpoints REST internos
│           ├── appointments/
│           ├── auth/
│           └── lookups/
├── static/                           # Assets estáticos (logos, favicons)
├── package.json
└── vite.config.ts
```

---

## Matriz de Stored Procedures

| Procedimiento | Parámetros | Propósito |
| :--- | :--- | :--- |
| `dbo.Proc_Autoasignacion_ConsultarSedes` | `@IdCliente` | Consulta sedes médicas activas |
| `dbo.Proc_Aut_ConsultarCitasPaciente` | `@CodigoPaciente, @IdCliente` | Consulta histórico y citas futuras |
| `dbo.Proc_Aut_GrabarCitas` | `@FechaServicio, @HoraServicio, @CodigoPaciente, @IdProfesional, @IdCliente, @IdActividadCita, @ClaveCita, @IdSede, @Edad, @UME` | Reserva y graba la cita en agenda |
| `dbo.Proc_Aut_CancelarCita` | `@ClaveCita` | Cancela cita y libera cupo |
| `dbo.Proc_Aut_AgendaCitas` | `@FechaC, @IdSede, @IdCliente, @IdProfesional = 0, @IdServicio = 0, @IdActividad = 0` | Búsqueda flexible por Servicio o Profesional |
| `dbo.Proc_Aut_ConsultarServicios` | `@IdCliente` | Consulta servicios disponibles |
| `dbo.Proc_Aut_ConsultarActividadesPorServicio` | `@IdCliente, @IdServicio = 0` | Consulta tipos de cita según servicio |
| `dbo.Proc_Aut_ConsultarPacienteLogin` | `@Identificacion, @CodigoTipoDocumento, @IdCliente` | Autenticación y obtención de usuario |
| `dbo.Proc_Aut_CambiarClaveSesion` | `@PatientId, @ClientId, @NewPasswordHash` | Actualización de clave en sesión |

---

## Configuración y Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Conexión a la Base de Datos Maestra (ekisapp)
DATABASE_MASTER_URL="Server=ekisa.database.windows.net,1433;Database=ekisapp;User Id=EkisaAzureSQL;Password=TU_PASSWORD;Encrypt=true;TrustServerCertificate=false;"

# Seguridad JWT
JWT_SECRET_KEY="SsqUSZ7KIf3KEg8IcE4IvEpq1ALWgKQBXa2025"

# URL Pública de la Aplicación
PUBLIC_BASE_URL="http://localhost:5173"

# Cloudflare Turnstile (Opcional en desarrollo local)
# Sitekey de prueba: 1x00000000000000000000AA
TURNSTILE_SECRET_KEY="1x0000000000000000000000000000000AA"
```

---

## Instalación y Ejecución

```bash
# 1. Instalar dependencias con Bun (o npm)
bun install

# 2. Sincronizar tipos de SvelteKit
bun run prepare

# 3. Iniciar servidor de desarrollo
bun run dev

# 4. Compilar para producción (Node.js Adapter)
bun run build
bun run preview
```
