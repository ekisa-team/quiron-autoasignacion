<script lang="ts">
  import { goto } from "$app/navigation";
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import * as Field from "$lib/components/ui/field";
  import * as InputGroup from "$lib/components/ui/input-group";
  import { toast } from "svelte-sonner";
  import IconEye from "~icons/lucide/eye";
  import IconEyeOff from "~icons/lucide/eye-off";
  import IconKey from "~icons/lucide/key";
  import IconKeyRound from "~icons/lucide/key-round";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let password = $state("");
  let confirmPassword = $state("");
  let showPassword = $state(false);
  let showConfirmPassword = $state(false);
  let isLoading = $state(false);
  let submitted = $state(false);

  const isPasswordTooShort = $derived(
    password.length > 0 && password.length < 6,
  );
  const passwordsMismatch = $derived(
    confirmPassword.length > 0 && password !== confirmPassword,
  );
  const isFormValid = $derived(
    password.length >= 6 && password === confirmPassword,
  );

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    submitted = true;
    if (!password || password.length < 6) {
      toast.error("La contraseña debe tener mínimo 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (!data.token) {
      toast.error("El enlace no contiene un token válido");
      return;
    }

    isLoading = true;
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: data.token,
          newPassword: password,
          clientId: Number(data.clientId),
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success(
          "Contraseña restablecida con éxito. Ya puedes iniciar sesión.",
        );
        setTimeout(() => {
          goto(`/login`);
        }, 1200);
      } else {
        toast.error(result.message || "Token inválido o expirado");
      }
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
      <IconKey class="size-8" />
    </div>
    <div>
      <h1 class="text-[28px] font-bold text-slate-800">Nueva contraseña</h1>
      <p class="text-[13px] text-slate-500 mt-1 leading-snug">
        {#if data.identification}
          Asigna una nueva clave para el documento: <strong
            >{data.identification}</strong
          >
        {:else}
          Ingresa tu nueva contraseña para acceder a la plataforma
        {/if}
      </p>
    </div>
  </Card.Header>

  <Card.Content class="p-0">
    {#if !data.token}
      <div
        class="p-3 mb-4 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[13px]"
      >
        No se detectó un token en el enlace. Asegúrate de abrir la página desde
        el correo recibido.
      </div>
    {/if}

    <form
      novalidate
      autocomplete="off"
      onsubmit={handleSubmit}
      class="space-y-4"
    >
      <Field.Group class="gap-3">
        <div>
          <InputGroup.Root
            class="border-slate-300 rounded-[3px] overflow-hidden bg-white {isPasswordTooShort ||
            (submitted && !password)
              ? 'border-red-500 ring-1 ring-red-500/20'
              : ''}"
          >
            <InputGroup.Addon
              class="border-r border-slate-300 bg-slate-50 w-9 p-0 flex items-center justify-center h-full m-0 shrink-0"
            >
              <IconKeyRound class="size-4 text-slate-400" />
            </InputGroup.Addon>
            <InputGroup.Input
              id="password"
              type={showPassword ? "text" : "password"}
              autocomplete="new-password"
              bind:value={password}
              placeholder="Nueva contraseña (Mínimo 6 caracteres)"
            />
            <InputGroup.Addon align="inline-end">
              <InputGroup.Button
                size="icon-xs"
                onclick={() => (showPassword = !showPassword)}
              >
                {#if showPassword}
                  <IconEyeOff />
                {:else}
                  <IconEye />
                {/if}
                <span class="sr-only">Toggle contraseña</span>
              </InputGroup.Button>
            </InputGroup.Addon>
          </InputGroup.Root>
          {#if isPasswordTooShort}
            <small class="text-xs text-red-500 mt-1 block"
              >Mínimo 6 caracteres</small
            >
          {:else if submitted && !password}
            <small class="text-xs text-red-500 mt-1 block"
              >Este campo es requerido</small
            >
          {/if}
        </div>

        <div>
          <InputGroup.Root
            class="border-slate-300 rounded-[3px] overflow-hidden bg-white {passwordsMismatch ||
            (submitted && !confirmPassword)
              ? 'border-red-500 ring-1 ring-red-500/20'
              : ''}"
          >
            <InputGroup.Addon
              class="border-r border-slate-300 bg-slate-50 w-9 p-0 flex items-center justify-center h-full m-0 shrink-0"
            >
              <IconKeyRound class="size-4 text-slate-400" />
            </InputGroup.Addon>
            <InputGroup.Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autocomplete="new-password"
              bind:value={confirmPassword}
              placeholder="Repetir nueva contraseña"
            />
            <InputGroup.Addon align="inline-end">
              <InputGroup.Button
                size="icon-xs"
                onclick={() => (showConfirmPassword = !showConfirmPassword)}
              >
                {#if showConfirmPassword}
                  <IconEyeOff />
                {:else}
                  <IconEye />
                {/if}
                <span class="sr-only">Toggle confirmar contraseña</span>
              </InputGroup.Button>
            </InputGroup.Addon>
          </InputGroup.Root>
          {#if passwordsMismatch}
            <small class="text-xs text-red-500 mt-1 block"
              >Las contraseñas no coinciden</small
            >
          {:else if submitted && !confirmPassword}
            <small class="text-xs text-red-500 mt-1 block"
              >Este campo es requerido</small
            >
          {/if}
        </div>
      </Field.Group>

      <div class="pt-2">
        <Button
          type="submit"
          disabled={isLoading || !data.token || !isFormValid}
          class="h-10 w-full text-[14px] font-medium shadow-none disabled:opacity-50"
        >
          {isLoading ? "Guardando..." : "Guardar nueva contraseña"}
        </Button>
      </div>
    </form>
  </Card.Content>
</Card.Root>
