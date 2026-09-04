<script lang="ts">
  import Turnstile from "$lib/components/Turnstile.svelte";
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import * as Field from "$lib/components/ui/field";
  import * as InputGroup from "$lib/components/ui/input-group";
  import * as Select from "$lib/components/ui/select";
  import type { DocumentTypeOption } from "$lib/types/appointments";
  import { toast } from "svelte-sonner";
  import IconIdCard from "~icons/lucide/id-card";
  import IconMail from "~icons/lucide/mail";
  import IconUser from "~icons/lucide/user";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let documentType = $state("");
  let documentNumber = $state("");
  let email = $state("");
  let captchaToken = $state("");
  let isLoading = $state(false);
  let errors = $state<{
    documentType?: string;
    documentNumber?: string;
    email?: string;
  }>({});
  let submitted = $state(false);

  const documentTypes = $derived(data.documentTypes || []);
  const selectedDocLabel = $derived(
    documentTypes.find((d: DocumentTypeOption) => d.value === documentType)
      ?.label,
  );

  function validateForm(): boolean {
    const newErrors: typeof errors = {};
    if (!documentType) newErrors.documentType = "Este campo es requerido";
    if (!documentNumber.trim())
      newErrors.documentNumber = "Este campo es requerido";
    if (!email.trim()) {
      newErrors.email = "Este campo es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "No tiene formato de email válido";
    }
    errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    submitted = true;
    if (!validateForm()) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    isLoading = true;
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType,
          identification: documentNumber,
          email,
          captchaToken,
          clientId: data.clientId,
        }),
      });
      const result = await res.json();
      toast.success(result.message);
      window.location.href = `/forgot-password-confirmation?c=${data.clientId}`;
    } catch (err) {
      toast.error("Error de conexión con el servidor");
    } finally {
      isLoading = false;
    }
  }
</script>

<Card.Root class="w-full max-w-md border-0 bg-white p-8 shadow-2xl rounded-lg">
  <Card.Header class="mb-5 p-0">
    <div
      class="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
    >
      <IconMail class="size-8" />
    </div>
    <div>
      <h1 class="text-[28px] font-bold text-primary">Recuperar clave</h1>
      <p class="text-[13px] text-slate-500 mt-1 leading-snug">
        Ingresa tu documento y correo registrado para verificar tu identidad
      </p>
    </div>
  </Card.Header>

  <Card.Content class="p-0">
    <form
      novalidate
      autocomplete="off"
      onsubmit={handleSubmit}
      class="space-y-4"
    >
      <Field.Set>
        <Field.Group class="gap-3">
          <Field.Field>
            <InputGroup.Root
              class="border-slate-300 rounded-[3px] overflow-hidden bg-white {errors.documentType &&
              submitted
                ? 'border-red-500'
                : ''}"
            >
              <InputGroup.Addon
                class="border-r border-slate-300 bg-slate-50 w-9 p-0 flex items-center justify-center h-full m-0 shrink-0"
              >
                <IconIdCard class="size-4 text-slate-400" />
              </InputGroup.Addon>
              <Select.Root type="single" bind:value={documentType}>
                <Select.Trigger
                  class="w-full h-full border-0 px-3 text-[14px] font-normal shadow-none focus:ring-0"
                >
                  <span
                    class={selectedDocLabel
                      ? "text-slate-700"
                      : "text-slate-500"}
                  >
                    {selectedDocLabel || "Tipo de documento"}
                  </span>
                </Select.Trigger>
                <Select.Content>
                  {#each documentTypes as item (item.value)}
                    <Select.Item value={item.value} label={item.label}
                      >{item.label}</Select.Item
                    >
                  {/each}
                </Select.Content>
              </Select.Root>
            </InputGroup.Root>
            {#if errors.documentType && submitted}
              <small class="text-xs text-red-500 mt-1 block"
                >{errors.documentType}</small
              >
            {/if}
          </Field.Field>

          <Field.Field>
            <InputGroup.Root
              class="border-slate-300 rounded-[3px] overflow-hidden bg-white {errors.documentNumber &&
              submitted
                ? 'border-red-500'
                : ''}"
            >
              <InputGroup.Addon
                class="border-r border-slate-300 bg-slate-50 w-9 p-0 flex items-center justify-center h-full m-0 shrink-0"
              >
                <IconUser class="size-4 text-slate-400" />
              </InputGroup.Addon>
              <InputGroup.Input
                id="docNumber"
                type="text"
                autocomplete="off"
                placeholder="Número de documento"
                bind:value={documentNumber}
                class="h-full border-0 text-[14px] placeholder:text-slate-500 focus-visible:ring-0 shadow-none px-3"
              />
            </InputGroup.Root>
            {#if errors.documentNumber && submitted}
              <small class="text-xs text-red-500 mt-1 block"
                >{errors.documentNumber}</small
              >
            {/if}
          </Field.Field>

          <Field.Field>
            <InputGroup.Root
              class="border-slate-300 rounded-[3px] overflow-hidden bg-white {errors.email &&
              submitted
                ? 'border-red-500'
                : ''}"
            >
              <InputGroup.Addon
                class="border-r border-slate-300 bg-slate-50 w-9 p-0 flex items-center justify-center h-full m-0 shrink-0"
              >
                <IconMail class="size-4 text-slate-400" />
              </InputGroup.Addon>
              <InputGroup.Input
                id="email"
                type="email"
                autocomplete="off"
                placeholder="correo@ejemplo.com"
                bind:value={email}
                class="h-full border-0 text-[14px] placeholder:text-slate-500 focus-visible:ring-0 shadow-none px-3"
              />
            </InputGroup.Root>
            {#if errors.email && submitted}
              <small class="text-xs text-red-500 mt-1 block"
                >{errors.email}</small
              >
            {/if}
          </Field.Field>
        </Field.Group>
      </Field.Set>

      <Turnstile oncallback={(token) => (captchaToken = token)} />

      <div class="pt-2 space-y-2">
        <Button
          type="submit"
          disabled={isLoading}
          class="h-9 w-full text-[14px] font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-[3px] shadow-none"
        >
          {isLoading
            ? "Validando y enviando..."
            : "Enviar enlace de recuperación"}
        </Button>
        <Button
          type="button"
          href="/login?c={data.clientId}"
          class="h-9 w-full text-[14px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[3px] shadow-none"
        >
          Regresar
        </Button>
      </div>
    </form>
  </Card.Content>
</Card.Root>
