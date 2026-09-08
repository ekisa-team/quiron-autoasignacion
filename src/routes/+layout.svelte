<script lang="ts">
  import favicon from "$lib/assets/favicon.svg";
  import { Toaster } from "$lib/components/ui/sonner";
  import type { LayoutProps } from "./$types";
  import "./layout.css";

  let { children, data }: LayoutProps = $props();
</script>

<svelte:head>
  <title>{data.tenant?.name || "Quirón Autoasignación"}</title>
  <link rel="icon" href={data.tenant?.logoUrl || favicon} />
  {#if data.tenantCss}
    {@html `<style id="tenant-theme">${data.tenantCss}</style>`}
  {/if}
</svelte:head>

<Toaster position="top-center" richColors />
{@render children()}
