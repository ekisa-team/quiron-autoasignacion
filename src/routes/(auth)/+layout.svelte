<script lang="ts">
  import { page } from "$app/state";
  import type { Snippet } from "svelte";
  import { cubicOut } from "svelte/easing";
  import { fly } from "svelte/transition";

  let { children }: { children: Snippet } = $props();
</script>

<div
  class="relative flex min-h-screen w-full items-center justify-center bg-[#020617] p-4"
>
  <div
    class="absolute inset-0 z-0 pointer-events-none"
    style="background-image: radial-gradient(circle 400px at 50% 100px, rgba(6,182,212,0.4), transparent);"
  ></div>

  <div class="relative z-10 w-full max-w-4xl">
    {#key page.url.pathname}
      <div
        class="flex flex-col items-center justify-center w-full"
        in:fly={{ y: 20, duration: 600, easing: cubicOut, opacity: 0 }}
      >
        {@render children()}
      </div>
    {/key}
  </div>
</div>
