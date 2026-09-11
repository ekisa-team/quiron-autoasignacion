<script lang="ts">
  import { page } from "$app/state";
  import { Badge } from "$lib/components/ui/badge";
  import { Button } from "$lib/components/ui/button";
  import { Separator } from "$lib/components/ui/separator";
  import {
    EKISA_SUPPORT_EMAIL,
    EKISA_SUPPORT_PHONE_1,
    EKISA_SUPPORT_PHONE_2,
  } from "$lib/constants";
  import IconArrowLeft from "~icons/lucide/arrow-left";
  import IconMail from "~icons/lucide/mail";
  import IconPhone from "~icons/lucide/phone";
</script>

<div class="w-full h-full grid place-items-center p-4">
  <div class="max-w-md gap-6 p-6 text-center">
    <Badge variant="outline">Error {page.status}</Badge>

    <div class="space-y-2">
      <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl">
        {page.status === 404 ? "Página no encontrada" : "Ocurrió un error"}
      </h1>
      <p class="text-muted-foreground text-sm">
        {JSON.stringify(page.error)}
      </p>
    </div>

    <div class="flex flex-wrap items-center justify-center gap-2">
      <Button href="/" variant="default">
        <IconArrowLeft />
        Volver al inicio
      </Button>
    </div>

    <div class="flex w-full items-center gap-3 text-xs text-muted-foreground">
      <Separator class="flex-1" />
      <span class="uppercase tracking-widest text-[10px]">Contacto</span>
      <Separator class="flex-1" />
    </div>

    <div class="flex flex-wrap justify-center gap-x-4 gap-y-1">
      <Button
        href={`mailto:${EKISA_SUPPORT_EMAIL}`}
        variant="link"
        size="sm"
        class="text-muted-foreground"
      >
        <IconMail class="size-3.5" />
        {EKISA_SUPPORT_EMAIL}
      </Button>
      <Button
        href={`tel:${EKISA_SUPPORT_PHONE_1}`}
        variant="link"
        size="sm"
        class="text-muted-foreground"
      >
        <IconPhone class="size-3.5" />
        {EKISA_SUPPORT_PHONE_1}
      </Button>
      <Button
        href={`tel:${EKISA_SUPPORT_PHONE_2}`}
        variant="link"
        size="sm"
        class="text-muted-foreground"
      >
        <IconPhone class="size-3.5" />
        {EKISA_SUPPORT_PHONE_2}
      </Button>
    </div>
  </div>
</div>
