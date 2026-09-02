# Guía de Contribución - Quirón Autoasignación

Gracias por contribuir a este proyecto. Para mantener la calidad, seguridad y consistencia del código, sigue las siguientes directrices.

---

## Estándares de Código

### 1. Svelte 5 (Uso Estricto de Runes)

- Está **estrictamente prohibida** la sintaxis legacy de Svelte 4 (`export let`, `let:prop`, `$:`).
- Usa exclusivamente los Runes de Svelte 5:
  - Estado reactivo: `$state()` y `$state.raw()`
  - Valores calculados: `$derived()` y `$derived.by()`
  - Efectos y sincronizaciones: `$effect()`
  - Propiedades del componente: `$props()` y `$bindable()`
- Eventos nativos en minúsculas (`onclick`, `onsubmit`, `onchange`).

### 2. TypeScript Estricto (Política 0% `any`)

- No se permite el uso del tipo `any`.
- Todos los modelos y respuestas de base de datos deben tiparse en `src/lib/types/`.
- Usa interfaces descriptivas para Stored Procedures y respuestas de API.

### 3. Idioma y Nomenclatura

- **Código fuente:** Todo el código (variables, funciones, componentes, tipos, endpoints) debe nombrarse en **Inglés**.
  - Ejemplo: `futureAppointments`, `handleAssignAppointment`, `AvailabilitySlot`.
- **Textos de UI y mensajes de error:** En **Español (es-CO)** orientado al paciente.

### 4. Modificaciones en la Base de Datos (HCLAPI vs SvelteKit)

**Regla Estricta:** 🛑 SvelteKit NUNCA debe conectarse directamente a la base de datos ni importar el paquete `mssql`.

Si necesita modificar una consulta SQL o consumir un nuevo Stored Procedure:

1. Navegue a `hclapi/escanografia/routes/` y edite o cree un archivo `.hcl`.
2. Defina la lógica en HCL (schema, pipeline, sql, respond).
3. Pruebe el nuevo endpoint accediendo a `http://localhost:8080/docs`.
4. En SvelteKit, abra `src/lib/server/api.ts` y utilice `apiGet` o `apiPost` para consumir ese endpoint.
5. Defina las interfaces en `src/lib/types/` utilizando el prefijo `Raw` para mapear los JSON retornados por el driver de Go (ej. `RawAppointmentApi`).

---

## Flujo de Trabajo con Git

### Convención de Ramas

- `feature/nombre-de-la-funcionalidad`
- `fix/descripcion-del-bug`
- `refactor/modulo-a-optimizar`

### Convención de Commits (Conventional Commits)

Los mensajes de commit deben seguir el estándar:

```text
<tipo>(<alcance>): <descripción concisa en imperativo>
```

Ejemplos:

- `feat(auth): implement argon2id password hashing`
- `fix(calendar): correct timezone offset for utc dates`
- `refactor(dashboard): modularize appointments table component`
- `build: update sveltekit and tailwind dependencies`
