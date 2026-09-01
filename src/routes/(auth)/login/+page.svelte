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
  import IconKey from "~icons/lucide/key";
  import IconUser from "~icons/lucide/user";

  let {
    data,
  }: { data: { documentTypes?: DocumentTypeOption[]; clientId?: number } } =
    $props();

  let documentType = $state("");
  let documentNumber = $state("");
  let password = $state("");
  let captchaToken = $state("");
  let isLoading = $state(false);

  let errors = $state<{
    documentType?: string;
    documentNumber?: string;
    password?: string;
  }>({});
  let submitted = $state(false);

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

    isLoading = true;
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identification: documentNumber,
          password,
          documentType,
          captchaToken,
          clientId: data.clientId,
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success("Inicio de sesión exitoso");
        window.location.href = "/";
      } else if (result.notRegistered) {
        toast.warning(result.message);
        setTimeout(() => {
          window.location.href = `/signup?c=${data.clientId || 67}&doc=${encodeURIComponent(documentNumber)}&docType=${encodeURIComponent(documentType)}&fromLogin=true`;
        }, 1500);
      } else {
        toast.error(result.message || "Credenciales incorrectas");
      }
    } catch (error) {
      toast.error("Error de conexión con el servidor");
    } finally {
      isLoading = false;
    }
  }
</script>

<Card.Root class="w-full max-w-md border-0 bg-white p-8 shadow-2xl rounded-lg">
  <Card.Header class="mb-5 p-0">
    <div class="flex items-center gap-4">
      <img
        src="/icons/svg/LogoQuiron.svg"
        alt="Logo Quirón"
        class="h-22 w-22 object-contain drop-shadow-sm"
      />
      <div>
        <h1 class="text-[28px] font-bold text-[#062e3a]">Bienvenido</h1>
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
                autocomplete="off"
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
          href="/signup?c={data.clientId || 67}"
          class="text-slate-600 hover:text-[#0e7490] hover:underline"
        >
          ¿Primer ingreso? <strong class="text-[#3c8ea5]">Crear clave</strong>
        </a>
        <a
          href="/forgot-password?c={data.clientId || 67}"
          class="text-[#3c8ea5] hover:text-[#0e7490] hover:underline"
        >
          ¿Olvidaste tu clave?
        </a>
      </div>

      <Turnstile oncallback={(token) => (captchaToken = token)} />

      <Button
        type="submit"
        disabled={isLoading}
        class="h-10 w-full text-[14px] font-medium bg-[#3c8ea5] hover:bg-[#0e7490] text-white rounded-[3px] shadow-none mt-2"
      >
        {isLoading ? "Ingresando..." : "Ingresar"}
      </Button>
    </form>
  </Card.Content>
</Card.Root>
