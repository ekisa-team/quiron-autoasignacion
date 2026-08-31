<script lang="ts">
  import favicon from "$lib/assets/favicon.svg";
  import { Toaster } from "$lib/components/ui/sonner";
  import type { Snippet } from "svelte";
  import "./layout.css";

  type Props = {
    children: Snippet;
  };
  let { children }: Props = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<Toaster position="top-center" richColors />
{@render children()}
