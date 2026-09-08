<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import IconLogIn from "~icons/lucide/log-in";
  import IconUserPlus from "~icons/lucide/user-plus";
</script>

<Card.Root class="w-md border-0 bg-white p-8 shadow-2xl text-center rounded-lg">
  <div
    class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
  >
    <IconUserPlus class="size-8" />
  </div>
  <h2 class="mb-2 text-[20px] font-semibold text-slate-800">
    ¡Registro exitoso!
  </h2>
  <p class="mb-6 text-[14px] text-slate-500 leading-snug">
    Hemos enviado un correo de verificación a tu dirección de email. Revisa tu
    bandeja de entrada (y la carpeta de spam) para confirmar tu cuenta antes de
    iniciar sesión.
  </p>
  <Button
    href="/login"
    class="h-9 px-6 text-[14px] font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-[3px] shadow-none w-fit mx-auto"
  >
    <IconLogIn class="mr-2 size-4" /> Iniciar sesión
  </Button>
</Card.Root>
