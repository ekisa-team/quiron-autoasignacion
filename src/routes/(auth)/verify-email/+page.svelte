<script lang="ts">
  import { page } from "$app/state";
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import IconBadgeCheck from "~icons/lucide/badge-check";
  import IconLogIn from "~icons/lucide/log-in";
  import IconXCircle from "~icons/lucide/x-circle";

  const token = $derived(page.url.searchParams.get("t"));
  const isValid = $derived(!!token);
</script>

<Card.Root class="w-md border-0 bg-white p-8 shadow-2xl text-center rounded-lg">
  {#if isValid}
    <div
      class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
    >
      <IconBadgeCheck class="size-8" />
    </div>
    <h2 class="mb-2 text-[20px] font-semibold text-slate-800">
      ¡Correo verificado!
    </h2>
    <p class="mb-6 text-[14px] text-slate-500 leading-snug">
      Tu cuenta ha sido verificada exitosamente. Ahora puedes iniciar sesión y
      comenzar a usar la plataforma.
    </p>
    <Button
      href="/login"
      class="h-9 px-6 text-[14px] font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-[3px] shadow-none w-full sm:w-auto"
    >
      <IconLogIn class="mr-2 size-4" /> Iniciar sesión
    </Button>
  {:else}
    <div
      class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-sm"
    >
      <IconXCircle class="size-8" />
    </div>
    <h2 class="mb-2 text-[20px] font-semibold text-slate-800">
      Enlace inválido o expirado
    </h2>
    <p class="mb-6 text-[14px] text-slate-500 leading-snug">
      El enlace de verificación ya no es válido. Por favor solicita un nuevo
      correo de verificación o vuelve a registrarte.
    </p>
    <Button
      href="/signup"
      class="h-9 px-6 text-[14px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[3px] shadow-none w-full sm:w-auto"
    >
      Solicitar nuevo enlace
    </Button>
  {/if}
</Card.Root>
