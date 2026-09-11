<script lang="ts">
  import { Calendar, Day as CalendarDay } from "$lib/components/ui/calendar";
  import { cn } from "$lib/utils";
  import type { DateValue } from "@internationalized/date";
  import { getLocalTimeZone, today } from "@internationalized/date";
  import IconCalendar from "~icons/lucide/calendar";

  let {
    selectedDate = $bindable(),
    festivos = [],
    availableDates = [],
  }: {
    selectedDate: DateValue | undefined;
    festivos?: string[];
    availableDates?: string[];
  } = $props();

  const formattedDate = $derived(
    selectedDate
      ? selectedDate.toDate(getLocalTimeZone()).toLocaleDateString("es-CO", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "Seleccione una fecha",
  );

  function checkUnavailable(date: DateValue) {
    const isSunday = date.toDate(getLocalTimeZone()).getDay() === 0;
    return isSunday || festivos.includes(date.toString());
  }
</script>

<div
  class="h-full w-full grid grid-cols-1 sm:grid-cols-5 rounded-sm border border-slate-300 bg-white shadow-sm"
>
  <div
    class="col-span-2 flex flex-col items-center justify-center bg-primary p-5 text-primary-foreground"
  >
    <IconCalendar class="mb-2 size-12" />
    <span class="text-base opacity-90">Fecha seleccionada</span>
    <span class="mt-1 text-center text-base font-bold capitalize leading-tight">
      {formattedDate}
    </span>
  </div>

  <Calendar
    type="single"
    locale="es-CO"
    bind:value={selectedDate}
    minValue={today(getLocalTimeZone())}
    isDateUnavailable={checkUnavailable}
    class={cn(
      "col-span-3 mx-auto border-0 shadow-none **:data-unavailable:bg-red-50 **:data-unavailable:font-semibold **:data-unavailable:text-red-500 **:data-unavailable:line-through",
      "[--cell-size:--spacing(10)] md:[--cell-size:--spacing(11)]",
      "**:data-calendar-grid-row:gap-2",
    )}
  >
    {#snippet day({ day: cellDate, outsideMonth })}
      {@const dateStr = cellDate.toString()}
      {@const hasAvailability = availableDates.includes(dateStr)}
      <div class="relative flex size-full items-center justify-center">
        <CalendarDay
          class={cn(
            "data-selected:hover:text-white data-selected:hover:bg-primary/90",
            {
              "font-bold text-primary ring-1.5 text-base md:text-lg ring-primary bg-primary/10":
                hasAvailability && !outsideMonth,
            },
          )}
        />
        {#if hasAvailability && !outsideMonth}
          {@const isSelected =
            selectedDate &&
            cellDate.year === selectedDate.year &&
            cellDate.month === selectedDate.month &&
            cellDate.day === selectedDate.day}

          <span
            class={cn(
              "absolute bottom-1 size-1.25 rounded-full pointer-events-none",
              isSelected ? "bg-white" : "bg-primary",
            )}
          ></span>
        {/if}
      </div>
    {/snippet}
  </Calendar>
</div>
