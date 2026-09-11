<script lang="ts">
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { Button } from "$lib/components/ui/button";
  import * as InputGroup from "$lib/components/ui/input-group";
  import { toast } from "svelte-sonner";
  import IconEye from "~icons/lucide/eye";
  import IconEyeOff from "~icons/lucide/eye-off";
  import IconKey from "~icons/lucide/key";
  import IconKeyRound from "~icons/lucide/key-round";

  let { open = $bindable(false) }: { open: boolean } = $props();

  let currentPassword = $state("");
  let newPassword = $state("");
  let confirmPassword = $state("");
  let showNewPassword = $state(false);
  let showConfirmPassword = $state(false);
  let showCurrentPassword = $state(false);
  let isLoading = $state(false);

  const isNewShort = $derived(newPassword.length > 0 && newPassword.length < 6);
  const mismatch = $derived(
    confirmPassword.length > 0 && newPassword !== confirmPassword,
  );
  const isFormValid = $derived(
    currentPassword.length > 0 &&
      newPassword.length >= 6 &&
      newPassword === confirmPassword,
  );

  function resetForm() {
    currentPassword = "";
    newPassword = "";
    confirmPassword = "";
    showCurrentPassword = false;
    showNewPassword = false;
    showConfirmPassword = false;
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!isFormValid) {
      toast.error("Por favor completa los campos correctamente");
      return;
    }

    isLoading = true;
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(result.message);
        open = false;
        resetForm();
      } else {
        toast.error(result.message || "Error al cambiar la contraseña");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      isLoading = false;
    }
  }
</script>

<AlertDialog.Root bind:open>
  <AlertDialog.Content
    class="max-w-110 rounded-lg bg-white p-6 shadow-2xl border-0"
  >
    <AlertDialog.Header class="flex flex-col items-center text-center">
      <div
        class="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
      >
        <IconKey class="size-7" />
      </div>
      <AlertDialog.Title class="text-[20px] font-bold text-slate-800"
        >Cambiar contraseña</AlertDialog.Title
      >
      <AlertDialog.Description class="text-[13px] text-slate-500">
        Ingresa tu contraseña actual y la nueva contraseña que deseas asignar.
      </AlertDialog.Description>
    </AlertDialog.Header>

    <form
      novalidate
      autocomplete="off"
      onsubmit={handleSubmit}
      class="space-y-3 mt-4"
    >
      <div>
        <label
          for="curPass"
          class="text-[12px] font-medium text-slate-700 block mb-1"
          >Contraseña actual *</label
        >
        <InputGroup.Root
          class="border-slate-300 rounded-[3px] overflow-hidden bg-white"
        >
          <InputGroup.Addon
            class="border-r border-slate-300 bg-slate-50 w-9 p-0 flex items-center justify-center h-full m-0 shrink-0"
          >
            <IconKeyRound class="size-4 text-slate-400" />
          </InputGroup.Addon>
          <InputGroup.Input
            id="curPass"
            type={showCurrentPassword ? "text" : "password"}
            autocomplete="current-password"
            bind:value={currentPassword}
            placeholder="Contraseña actual"
          />
          <InputGroup.Addon align="inline-end">
            <InputGroup.Button
              size="icon-xs"
              onclick={() => (showCurrentPassword = !showCurrentPassword)}
              title={showCurrentPassword
                ? "Ocultar contraseña"
                : "Ver contraseña"}
            >
              {#if showCurrentPassword}
                <IconEyeOff class="size-4" />
              {:else}
                <IconEye class="size-4" />
              {/if}
              <span class="sr-only">
                {showCurrentPassword ? "Ocultar" : "Ver"} contraseña actual
              </span>
            </InputGroup.Button>
          </InputGroup.Addon>
        </InputGroup.Root>
      </div>

      <div>
        <label
          for="newPass"
          class="text-[12px] font-medium text-slate-700 block mb-1"
          >Nueva contraseña *</label
        >
        <InputGroup.Root
          class="border-slate-300 rounded-[3px] overflow-hidden bg-white {isNewShort
            ? 'border-red-500 ring-1 ring-red-500/20'
            : ''}"
        >
          <InputGroup.Addon
            class="border-r border-slate-300 bg-slate-50 w-9 p-0 flex items-center justify-center h-full m-0 shrink-0"
          >
            <IconKeyRound class="size-4 text-slate-400" />
          </InputGroup.Addon>
          <InputGroup.Input
            id="newPass"
            type={showNewPassword ? "text" : "password"}
            autocomplete="new-password"
            bind:value={newPassword}
            placeholder="Mínimo 6 caracteres"
          />
          <InputGroup.Addon align="inline-end">
            <InputGroup.Button
              size="icon-xs"
              onclick={() => (showNewPassword = !showNewPassword)}
              title={showNewPassword ? "Ocultar contraseña" : "Ver contraseña"}
            >
              {#if showNewPassword}
                <IconEyeOff class="size-4" />
              {:else}
                <IconEye class="size-4" />
              {/if}
              <span class="sr-only">
                {showNewPassword ? "Ocultar" : "Ver"} nueva contraseña
              </span>
            </InputGroup.Button>
          </InputGroup.Addon>
        </InputGroup.Root>
        {#if isNewShort}<small class="text-xs text-red-500 mt-1 block"
            >Mínimo 6 caracteres</small
          >{/if}
      </div>

      <div>
        <label
          for="repPass"
          class="text-[12px] font-medium text-slate-700 block mb-1"
          >Repetir nueva contraseña *</label
        >
        <InputGroup.Root
          class="border-slate-300 rounded-[3px] overflow-hidden bg-white {mismatch
            ? 'border-red-500 ring-1 ring-red-500/20'
            : ''}"
        >
          <InputGroup.Addon
            class="border-r border-slate-300 bg-slate-50 w-9 p-0 flex items-center justify-center h-full m-0 shrink-0"
          >
            <IconKeyRound class="size-4 text-slate-400" />
          </InputGroup.Addon>
          <InputGroup.Input
            id="repPass"
            type={showConfirmPassword ? "text" : "password"}
            autocomplete="new-password"
            bind:value={confirmPassword}
            placeholder="Repite la nueva contraseña"
          />
          <InputGroup.Addon align="inline-end">
            <InputGroup.Button
              size="icon-xs"
              onclick={() => (showConfirmPassword = !showConfirmPassword)}
              title={showConfirmPassword
                ? "Ocultar contraseña"
                : "Ver contraseña"}
            >
              {#if showConfirmPassword}
                <IconEyeOff class="size-4" />
              {:else}
                <IconEye class="size-4" />
              {/if}
              <span class="sr-only">
                {showConfirmPassword ? "Ocultar" : "Ver"} confirmación
              </span>
            </InputGroup.Button>
          </InputGroup.Addon>
        </InputGroup.Root>
        {#if mismatch}<small class="text-xs text-red-500 mt-1 block"
            >Las contraseñas no coinciden</small
          >{/if}
      </div>

      <AlertDialog.Footer class="mt-6 flex flex-row justify-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={isLoading || !isFormValid}
          class="h-9 flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-[3px] text-[13px] shadow-none"
        >
          {isLoading ? "Actualizando..." : "Actualizar contraseña"}
        </Button>
        <Button
          type="button"
          onclick={() => {
            open = false;
            resetForm();
          }}
          variant="secondary"
          class="h-9 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[3px] text-[13px] shadow-none"
        >
          Cancelar
        </Button>
      </AlertDialog.Footer>
    </form>
  </AlertDialog.Content>
</AlertDialog.Root>
