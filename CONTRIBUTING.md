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

### 4. Consultas a Base de Datos

- Toda interacción con la base de datos de los clientes debe realizarse mediante **Stored Procedures** tipados a través del helper `executeProcedure()`.
- No escribir consultas SQL inline directamente en componentes o endpoints.

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
