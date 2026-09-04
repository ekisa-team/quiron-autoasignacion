<script lang="ts">
  import favicon from "$lib/assets/favicon.svg";
  import { Toaster } from "$lib/components/ui/sonner";
  import type { Snippet } from "svelte";
  import "./layout.css";

  type Props = {
    children: Snippet;
    data: any;
  };

  let { children, data }: Props = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  {#if data.tenantCss}
    {@html `<style id="tenant-theme">${data.tenantCss}</style>`}
  {/if}
</svelte:head>

<Toaster position="top-center" richColors />
{@render children()}
