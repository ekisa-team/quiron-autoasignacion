<script lang="ts">
  import { Calendar } from "$lib/components/ui/calendar";
  import type { DateValue } from "@internationalized/date";
  import { getLocalTimeZone, today } from "@internationalized/date";
  import IconCalendar from "~icons/lucide/calendar";

  let {
    selectedDate = $bindable(),
    festivos = [],
  }: {
    selectedDate: DateValue | undefined;
    festivos?: string[];
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
  class="flex h-full w-full flex-col sm:flex-row overflow-hidden rounded-[3px] border border-slate-300 bg-white shadow-sm"
>
  <div
    class="flex flex-col items-center justify-center bg-[#3c8ea5] p-5 text-white sm:w-60 shrink-0"
  >
    <IconCalendar class="mb-2 size-9" />
    <span class="text-[12px] opacity-90">Fecha seleccionada</span>
    <span
      class="mt-1 text-center text-[18px] font-bold capitalize leading-tight"
    >
      {formattedDate}
    </span>
  </div>
  <div class="flex flex-1 items-center justify-center p-3">
    <Calendar
      type="single"
      locale="es-CO"
      bind:value={selectedDate}
      minValue={today(getLocalTimeZone())}
      isDateUnavailable={checkUnavailable}
      class="border-0 p-0 shadow-none **:data-unavailable:bg-red-50 **:data-unavailable:font-semibold **:data-unavailable:text-red-500 **:data-unavailable:line-through"
    />
  </div>
</div>
