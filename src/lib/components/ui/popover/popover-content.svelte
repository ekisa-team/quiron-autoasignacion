<script lang="ts">
  import { cn, type WithoutChild } from "$lib/utils.js";
  import { Popover as PopoverPrimitive } from "bits-ui";
  let {
    ref = $bindable(null),
    class: className,
    sideOffset = 4,
    align = "center",
    ...restProps
  }: WithoutChild<PopoverPrimitive.ContentProps> = $props();
</script>

<PopoverPrimitive.Portal>
  <PopoverPrimitive.Content
    bind:ref
    {sideOffset}
    {align}
    data-slot="popover-content"
    class={cn(
      "bg-popover text-popover-foreground data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 z-50 rounded-md border p-0 shadow-md outline-none",
      className,
    )}
    {...restProps}
  />
</PopoverPrimitive.Portal>
