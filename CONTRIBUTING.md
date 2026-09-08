# Guía de Contribución y Estándares de Desarrollo

## 1. Arquitectura de Acceso a Datos

- **Base de Datos Maestra:** SvelteKit solo interactúa directamente con la base de datos maestra a través de `src/lib/server/master-db.ts` para resolver la tabla `dbo.Clientes`.
- **Datos Médicos y de Agenda:** SvelteKit no ejecuta consultas directas para pacientes o citas. Todo acceso a datos clínicos debe realizarse consumiendo los endpoints de HCLAPI a través de `src/lib/server/api.ts`.

## 2. Convenciones de Estilos y Theming

Para mantener la compatibilidad con el sistema multi-tenant:

- **Prohibido el uso de colores hexadecimales fijos** en los componentes visuales (evitar clases como `bg-[#3c8ea5]` o `text-[#0e7490]`).
- Utilizar exclusivamente los tokens semánticos de Tailwind configurados en el tema: `bg-primary`, `text-primary`, `border-primary`, `ring-primary` y `text-primary-foreground`.
- Cualquier regla de estilo personalizada para una clínica debe registrarse en la columna `AutoassignmentConfig` dentro del bloque `theme.variables`.

## 3. Alta de un Nuevo Cliente (Tenant)

Para habilitar una nueva organización en la plataforma no se requiere modificar el código fuente:

1. Crear la carpeta correspondiente con las consultas SQL en `hclapi/<identificador>/`.
2. Registrar la fila en la tabla `dbo.Clientes` definiendo su `TenantIdentifier` (subdominio en minúsculas) y su JSON en `AutoassignmentConfig`.
3. Invalidad la caché de Valkey si ya existía una clave previa para dicho identificador.

## 4. Flujo de Git y Despliegues

- Las ramas de desarrollo deben seguir la convención `feat/<nombre>`, `fix/<nombre>` o `refactor/<nombre>`.
- Todos los commits deben redactarse en inglés siguiendo el estándar de Conventional Commits.
- La publicación de nuevas imágenes Docker y paquetes HCL se efectúa de manera automática al empujar una etiqueta de versión que comience con `v` (ej. `git tag v1.0.0` y `git push origin v1.0.0`).
