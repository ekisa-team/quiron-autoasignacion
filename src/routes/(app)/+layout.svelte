<script lang="ts">
  import { goto } from "$app/navigation";
  import ChangePasswordModal from "$lib/components/dashboard/ChangePasswordModal.svelte";
  import type { Snippet } from "svelte";
  import IconChevronDown from "~icons/lucide/chevron-down";
  import IconKey from "~icons/lucide/key";
  import IconLayers from "~icons/lucide/layers";
  import IconLogOut from "~icons/lucide/log-out";
  import IconUserCircle from "~icons/lucide/user-circle";

  let { children, data }: { children: Snippet; data: any } = $props();
  let showPasswordModal = $state(false);
  let isMenuOpen = $state(false);

  async function handleLogout() {
    const currentClient = data?.clientId || 67;
    await fetch("/api/auth/logout", { method: "POST" });
    goto(`/login?c=${currentClient}`);
  }
</script>

<svelte:window
  onclick={(e) => {
    const target = e.target as HTMLElement;
    if (!target.closest("#user-menu-container")) {
      isMenuOpen = false;
    }
  }}
/>

<div class="min-h-screen bg-slate-50">
  <header
    class="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-sm"
  >
    <div class="flex h-18 items-center justify-between px-4 sm:px-8">
      <div class="flex items-center gap-3.5">
        {#if data?.tenant?.logoUrl}
          <img
            src={data.tenant.logoUrl}
            alt={data.tenant.name || "Logo"}
            class="h-12 w-auto max-h-14 max-w-48 object-contain drop-shadow-sm"
          />
        {:else}
          <div
            class="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md"
          >
            <IconLayers class="size-6" />
          </div>
        {/if}
        <span class="text-xl font-semibold text-slate-700">
          {data?.tenant?.name || "Autoasignación"}
        </span>
      </div>

      <div class="relative" id="user-menu-container">
        <button
          onclick={() => (isMenuOpen = !isMenuOpen)}
          class="flex items-center gap-2 rounded px-3 py-1.5 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
        >
          <IconUserCircle class="size-6 text-primary" />
          <span class="max-w-50 truncate text-[14px] font-medium">
            {data?.user?.fullName || "Paciente"}
          </span>
          <IconChevronDown
            class="size-3.5 text-slate-400 transition-transform {isMenuOpen
              ? 'rotate-180'
              : ''}"
          />
        </button>

        {#if isMenuOpen}
          <div
            class="absolute right-0 top-full mt-2 w-56 rounded-md bg-white p-1.5 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-100"
          >
            <div class="px-3 py-2 border-b border-slate-100 mb-1">
              <p
                class="text-[11px] font-medium text-slate-400 uppercase tracking-wider"
              >
                Sesión activa
              </p>
              <p class="text-[13px] font-semibold text-slate-800 truncate">
                {data?.user?.fullName}
              </p>
            </div>
            <button
              onclick={() => {
                isMenuOpen = false;
                showPasswordModal = true;
              }}
              class="flex w-full items-center gap-2 rounded px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-100 transition-colors text-left cursor-pointer"
            >
              <IconKey class="size-4 text-primary" />
              <span>Cambiar contraseña</span>
            </button>
            <button
              onclick={handleLogout}
              class="flex w-full items-center gap-2 rounded px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
            >
              <IconLogOut class="size-4 text-red-500" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        {/if}
      </div>
    </div>
  </header>

  <main>
    {@render children()}
  </main>
</div>

<ChangePasswordModal bind:open={showPasswordModal} />
