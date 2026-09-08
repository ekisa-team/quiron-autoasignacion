import { env } from "$env/dynamic/public";
import { mode } from "mode-watcher";
import type { Attachment } from "svelte/attachments";

interface TurnstileParams {
  onToken: (token: string) => void;
  resetTrigger?: () => number;
}

export function createTurnstile(
  params: TurnstileParams,
): Attachment<HTMLDivElement> {
  return (node) => {
    let widgetId: ReturnType<typeof window.turnstile.render>;

    const init = () => {
      if (!window.turnstile) {
        return;
      }

      widgetId = window.turnstile.render(node, {
        sitekey: env.PUBLIC_TURNSTILE_SITE_KEY ?? "",
        theme: mode.current === "dark" ? "dark" : "light",
        size: "normal",
        language: "es",
        callback: params.onToken,
      });
    };

    if (window.turnstile) {
      init();
    } else {
      window.addEventListener("load", init);
    }

    if (params.resetTrigger) {
      $effect(() => {
        const trigger = params.resetTrigger?.();
        if (widgetId && trigger && trigger > 0) {
          window.turnstile?.reset(widgetId);
        }
      });
    }

    return () => {
      if (widgetId) {
        window.turnstile?.remove(widgetId);
      }
      window.removeEventListener("load", init);
    };
  };
}
