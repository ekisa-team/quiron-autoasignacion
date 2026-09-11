<script lang="ts">
  import { goto } from "$app/navigation";
  import { createTurnstile } from "$lib/attachments/turnstile.svelte";
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import * as Field from "$lib/components/ui/field";
  import * as InputGroup from "$lib/components/ui/input-group";
  import * as Select from "$lib/components/ui/select";
  import { toast } from "svelte-sonner";
  import IconIdCard from "~icons/lucide/id-card";
  import IconKey from "~icons/lucide/key";
  import IconUser from "~icons/lucide/user";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let documentType = $state("");
  let documentNumber = $state("");
  let password = $state("");
  let isLoading = $state(false);
  let errors = $state<{
    documentType?: string;
    documentNumber?: string;
    password?: string;
  }>({});
  let submitted = $state(false);
  let turnstileToken = $state("");
  let resetCounter = $state(0);

  const turnstileAttachment = createTurnstile({
    onToken: (token) => {
      turnstileToken = token;
    },
    resetTrigger: () => resetCounter,
  });

  const documentTypes = $derived(data.documentTypes || []);
  const selectedDocLabel = $derived(
    documentTypes.find((d) => d.value === documentType)?.label,
  );

  function validateForm(): boolean {
    const newErrors: typeof errors = {};
    if (!documentType) newErrors.documentType = "Este campo es requerido";
    if (!documentNumber.trim())
      newErrors.documentNumber = "Este campo es requerido";
    if (!password) newErrors.password = "Este campo es requerido";
    errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    submitted = true;
    if (!validateForm()) {
      toast.error("Por favor completa los campos requeridos");
      return;
    }

    if (!turnstileToken) {
      toast.error("Por favor completa la verificación de seguridad");
      return;
    }

    isLoading = true;
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identification: documentNumber,
          password,
          documentType,
          turnstileToken,
          clientId: data.clientId,
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success("Inicio de sesión exitoso");
        goto("/");
      } else if (result.notRegistered) {
        toast.warning(result.message);
        setTimeout(() => {
          goto(
            `/signup?doc=${encodeURIComponent(documentNumber)}&docType=${encodeURIComponent(documentType)}&fromLogin=true`,
          );
        }, 1500);
      } else {
        toast.error(result.message || "Credenciales incorrectas");
        turnstileToken = "";
        resetCounter++;
      }
    } catch (error) {
      toast.error("Error de conexión con el servidor");
      turnstileToken = "";
      resetCounter++;
    } finally {
      isLoading = false;
    }
  }
</script>

<Card.Root class="w-full max-w-md border-0 bg-white p-8 shadow-2xl rounded-lg">
  <Card.Header class="mb-5 p-0">
    <div class="flex items-center gap-4">
      <img
        src={data.tenant?.logoUrl || "/icons/LogoQuiron.png"}
        alt={data.tenant?.name || "Logo Quirón"}
        class="h-24 w-auto max-h-26 max-w-32 object-contain drop-shadow-sm shrink-0"
      />
      <div>
        <h1 class="text-[28px] font-bold text-slate-800">Bienvenido</h1>
        <p class="text-[13px] text-slate-500 mt-1 leading-snug">
          Ingresa tus credenciales para acceder al sistema
        </p>
      </div>
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
                class="border-r border-slate-300 bg-slate-50 w-9 p-0 flex items-center justify-center h-full m-0"
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
                class="border-r border-slate-300 bg-slate-50 w-9 p-0 flex items-center justify-center h-full m-0"
              >
                <IconUser class="size-4 text-slate-400" />
              </InputGroup.Addon>
              <InputGroup.Input
                id="identifier"
                type="text"
                autocomplete="off"
                placeholder="Documento"
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
              class="border-slate-300 rounded-[3px] overflow-hidden bg-white {errors.password &&
              submitted
                ? 'border-red-500'
                : ''}"
            >
              <InputGroup.Addon
                class="border-r border-slate-300 bg-slate-50 w-9 p-0 flex items-center justify-center h-full m-0"
              >
                <IconKey class="size-4 text-slate-400" />
              </InputGroup.Addon>
              <InputGroup.Input
                id="password"
                type="password"
                autocomplete="new-password"
                placeholder="Clave"
                bind:value={password}
                class="h-full border-0 text-[14px] placeholder:text-slate-500 focus-visible:ring-0 shadow-none px-3"
              />
            </InputGroup.Root>
            {#if errors.password && submitted}
              <small class="text-xs text-red-500 mt-1 block"
                >{errors.password}</small
              >
            {/if}
          </Field.Field>
        </Field.Group>
      </Field.Set>

      <div class="flex items-center justify-between text-[13px] pt-1">
        <a
          href="/signup"
          class="text-slate-600 hover:text-primary hover:underline"
        >
          ¿Primer ingreso? <strong class="text-primary">Crear clave</strong>
        </a>
        <a href="/forgot-password" class="text-primary hover:underline">
          ¿Olvidaste tu clave?
        </a>
      </div>

      <div {@attach turnstileAttachment} class="flex justify-center"></div>

      <Button
        type="submit"
        disabled={isLoading}
        class="h-10 w-full text-[14px] font-medium shadow-none mt-2"
      >
        {isLoading ? "Ingresando..." : "Ingresar"}
      </Button>
    </form>
  </Card.Content>
</Card.Root>
