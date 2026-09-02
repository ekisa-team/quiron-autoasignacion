<script lang="ts">
  import { env } from "$env/dynamic/public";
  let {
    sitekey = env.PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA",
    oncallback,
  }: {
    sitekey?: string;
    oncallback: (token: string) => void;
  } = $props();

  let container: HTMLDivElement | null = $state(null);
  let widgetId: string | null = null;

  $effect(() => {
    if (!container || typeof window === "undefined") return;

    function renderWidget() {
      const turnstile = (window as any).turnstile;
      if (turnstile && container) {
        if (widgetId) {
          turnstile.remove(widgetId);
        }
        widgetId = turnstile.render(container, {
          sitekey,
          callback: (token: string) => {
            oncallback(token);
          },
        });
      }
    }

    if ((window as any).turnstile) {
      renderWidget();
    } else {
      const interval = setInterval(() => {
        if ((window as any).turnstile) {
          clearInterval(interval);
          renderWidget();
        }
      }, 50);
      return () => clearInterval(interval);
    }

    return () => {
      if (widgetId && (window as any).turnstile) {
        (window as any).turnstile.remove(widgetId);
      }
    };
  });
</script>

<div bind:this={container} class="flex justify-center py-2 min-h-16.25"></div>
