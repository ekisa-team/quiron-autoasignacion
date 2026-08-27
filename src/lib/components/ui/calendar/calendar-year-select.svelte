<script lang="ts">
  import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import { Calendar as CalendarPrimitive } from "bits-ui";

  let {
    ref = $bindable(null),
    class: className,
    value,
    ...restProps
  }: WithoutChildrenOrChild<CalendarPrimitive.YearSelectProps> = $props();

  let isOpen = $state(false);
  let selectRef: HTMLSelectElement | null = $state(null);

  function handleSelectYear(yearValue: number) {
    if (selectRef) {
      selectRef.value = String(yearValue);
      selectRef.dispatchEvent(new Event("change", { bubbles: true }));
    }
    isOpen = false;
  }

  function scrollToActive(node: HTMLElement, isActive: boolean) {
    if (isActive) {
      setTimeout(() => {
        node.scrollIntoView({ block: "center" });
      }, 0);
    }
  }
</script>

<svelte:window
  onclick={(e) => {
    const target = e.target as HTMLElement;
    if (!target.closest(".custom-year-select-container")) {
      isOpen = false;
    }
  }}
/>

<span
  class={cn("relative inline-flex custom-year-select-container", className)}
>
  <CalendarPrimitive.YearSelect bind:ref class="hidden" {...restProps}>
    {#snippet child({ props, yearItems, selectedYearItem })}
      <select bind:this={selectRef} {...props} {value} class="hidden">
        {#each yearItems as yearItem (yearItem.value)}
          <option
            value={yearItem.value}
            selected={yearItem.value === (value ?? selectedYearItem.value)}
          >
            {yearItem.label}
          </option>
        {/each}
      </select>

      <button
        type="button"
        onclick={() => (isOpen = !isOpen)}
        class="flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium shadow-xs hover:bg-slate-50 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#3c8ea5]"
      >
        <span
          >{yearItems.find((item) => item.value === value)?.label ||
            selectedYearItem.label}</span
        >
        <ChevronDownIcon
          class="size-3.5 text-slate-400 transition-transform {isOpen
            ? 'rotate-180'
            : ''}"
        />
      </button>

      {#if isOpen}
        <div
          class="absolute top-full left-0 mt-1 z-50 w-24 max-h-40 overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg animate-in fade-in zoom-in-95 duration-100"
        >
          {#each yearItems as item (item.value)}
            {@const isSelected =
              item.value === (value ?? selectedYearItem.value)}
            <button
              type="button"
              use:scrollToActive={isSelected}
              onclick={() => handleSelectYear(item.value)}
              class="flex w-full items-center justify-between rounded px-2 py-1 text-xs text-left cursor-pointer transition-colors {isSelected
                ? 'bg-[#3c8ea5] text-white font-semibold'
                : 'text-slate-700 hover:bg-slate-100'}"
            >
              <span>{item.label}</span>
            </button>
          {/each}
        </div>
      {/if}
    {/snippet}
  </CalendarPrimitive.YearSelect>
</span>
