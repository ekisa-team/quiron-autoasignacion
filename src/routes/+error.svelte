<script lang="ts">
  import { page } from "$app/state";
  import { Button } from "$lib/components/ui/button";
  import IconArrowLeft from "~icons/lucide/arrow-left";
  import IconMail from "~icons/lucide/mail";
  import IconPhone from "~icons/lucide/phone";
  import IconRotateCw from "~icons/lucide/rotate-cw";

  const tenant = $derived(page.data?.tenant);

  const isClientError = $derived(page.status === 404 || page.status < 500);

  const title = $derived.by(() => {
    if (page.status === 404) return "Página no encontrada";
    if (page.status === 500) return "Error interno del servidor";
    if (page.status === 403) return "Acceso restringido";
    if (page.status === 401) return "Sesión expirada";
    return "Ocurrió un error inesperado";
  });

  const description = $derived.by(() => {
    if (page.status === 404) {
      return "Lo sentimos, la página que está buscando no se pudo encontrar o el enlace no es válido. Es posible que la dirección web esté incorrecta o haya cambiado de ubicación.";
    }
    if (page.status === 500) {
      return "Se presentó una dificultad técnica en el servidor. Por favor intenta recargar la página o comunícate con soporte si el inconveniente persiste.";
    }
    return "No pudimos completar tu solicitud en este momento. Por favor verifica tu conexión o intenta más tarde.";
  });

  const hasContactInfo = $derived(
    Boolean(
      (tenant?.contact?.emails && tenant.contact.emails.length > 0) ||
        (tenant?.contact?.phones && tenant.contact.phones.length > 0),
    ),
  );
</script>

<svelte:head>
  <title>Error {page.status} - {tenant?.name || "Quirón Autoasignación"}</title>
</svelte:head>

<main
  class="flex min-h-screen w-full items-center justify-center bg-slate-50/50 p-4 sm:p-6 md:p-12 dark:bg-background"
>
  <!-- Contenedor ampliado a max-w-6xl -->
  <div
    class="flex w-full max-w-6xl flex-col items-center gap-10 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl sm:p-12 md:flex-row md:gap-16 md:p-16 dark:border-border dark:bg-card"
  >
    <!-- Columna izquierda: Código de error vistoso -->
    <div class="flex w-full items-center justify-center md:w-5/12 shrink-0">
      <div
        class="relative flex aspect-square w-full max-w-80 md:max-w-88 flex-col items-center justify-center overflow-hidden rounded-3xl border border-primary/20 bg-primary/5 p-8 shadow-inner"
      >
        <div
          class="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-primary/20 blur-3xl"
        ></div>
        <div
          class="pointer-events-none absolute -bottom-10 -left-10 size-48 rounded-full bg-primary/15 blur-3xl"
        ></div>

        <span
          class="text-xs font-bold uppercase tracking-widest text-primary/80"
        >
          Código de estado
        </span>

        <span
          class="my-2 select-none text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary/60 drop-shadow-sm sm:text-9xl"
        >
          {page.status}
        </span>

        <span
          class="rounded-full bg-white/90 px-3.5 py-1 text-xs font-semibold text-slate-700 shadow-xs dark:bg-background/80 dark:text-foreground"
        >
          {page.status === 404
            ? "Not Found"
            : page.status === 500
              ? "Internal Server Error"
              : "HTTP Error"}
        </span>
      </div>
    </div>

    <!-- Columna derecha: Contenido con botón y contacto equilibrados -->
    <div class="flex w-full flex-col justify-center text-center md:text-left">
      <h1
        class="mb-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-foreground"
      >
        {title}
      </h1>

      <p
        class="text-sm leading-relaxed text-slate-600 sm:text-base dark:text-muted-foreground"
      >
        {description}
      </p>

      <!-- Botón de acción centrado horizontalmente -->
      <div class="mt-6 flex w-full justify-center">
        {#if isClientError}
          <Button
            href="/"
            class="h-10 rounded-xl px-7 text-sm font-semibold shadow-xs"
          >
            <IconArrowLeft class="mr-2 size-4" />
            Volver al inicio
          </Button>
        {:else if page.status === 500}
          <Button
            onclick={() => window.location.reload()}
            variant="outline"
            class="h-10 rounded-xl px-7 text-sm font-semibold shadow-xs border-slate-300 hover:bg-slate-100 dark:border-border"
          >
            <IconRotateCw class="mr-2 size-4" />
            Reintentar carga
          </Button>
        {/if}
      </div>

      <!-- Cuadro de Contacto usando el componente Button de Shadcn -->
      {#if hasContactInfo}
        <div
          class="mt-8 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-6 text-center dark:border-border dark:bg-muted/30"
        >
          <h2
            class="text-sm font-bold text-slate-900 sm:text-base dark:text-foreground"
          >
            ¿Crees que esto es un error y requieres soporte?
          </h2>
          <p
            class="mt-1 text-xs text-slate-500 sm:text-sm dark:text-muted-foreground"
          >
            Comunícate con los canales de atención de <strong
              class="text-slate-700 dark:text-foreground"
              >{tenant?.name || "la institución"}</strong
            >:
          </p>

          <!-- Botones de contacto usando <Button href="..."> -->
          <div class="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            {#each tenant?.contact?.emails ?? [] as email}
              <Button
                href={`mailto:${email}`}
                variant="outline"
                size="sm"
                class="h-8 rounded-lg border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 shadow-2xs hover:border-primary hover:text-primary hover:bg-slate-50 dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-muted"
              >
                <IconMail class="mr-1.5 size-3.5 text-primary shrink-0" />
                <span>{email}</span>
              </Button>
            {/each}

            {#each tenant?.contact?.phones ?? [] as phone}
              <Button
                href={`tel:${phone}`}
                variant="outline"
                size="sm"
                class="h-8 rounded-lg border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 shadow-2xs hover:border-primary hover:text-primary hover:bg-slate-50 dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-muted"
              >
                <IconPhone class="mr-1.5 size-3.5 text-primary shrink-0" />
                <span>{phone}</span>
              </Button>
            {/each}
          </div>
        </div>
      {/if}

      <p class="mt-4 text-center text-xs font-medium text-slate-400">
        Pedimos disculpas por los inconvenientes presentados.
      </p>
    </div>
  </div>
</main>
