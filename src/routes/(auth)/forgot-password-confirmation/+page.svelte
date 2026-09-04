<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import IconBadgeCheck from "~icons/lucide/badge-check";
  import IconLogOut from "~icons/lucide/log-out";
  import IconRotateCcw from "~icons/lucide/rotate-ccw";
</script>

<Card.Root class="w-md border-0 bg-white p-8 shadow-2xl text-center rounded-lg">
  <div
    class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
  >
    <IconBadgeCheck class="size-8" />
  </div>
  <h2 class="mb-2 text-[20px] font-semibold text-slate-800">
    Revisa tu correo
  </h2>
  <p class="mb-6 text-[14px] text-slate-500 leading-snug">
    Si el correo está registrado, recibirás un enlace para restablecer tu
    contraseña. Por favor revisa tu bandeja de entrada y correo no deseado.
  </p>
  <div class="flex flex-col gap-3 sm:flex-row sm:justify-center">
    <Button
      href="/login"
      class="h-9 px-4 text-[14px] font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-[3px] shadow-none"
    >
      <IconLogOut class="mr-2 size-4" /> Iniciar sesión
    </Button>
    <Button
      href="/forgot-password"
      class="h-9 px-3 text-[14px] font-medium bg-slate-100 hover:bg-slate-200 hover:text-slate-700 text-slate-500 rounded-[3px] shadow-none"
    >
      <IconRotateCcw class="mr-1 size-4" /> Volver a intentar
    </Button>
  </div>
</Card.Root>
