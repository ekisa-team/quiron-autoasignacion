<script lang="ts">
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { Button } from "$lib/components/ui/button";
  import type { AvailabilitySlot } from "$lib/types/appointments";
  import { formatDate, formatTime } from "$lib/utils";
  import IconCalendarCheck from "~icons/lucide/calendar-check";

  let {
    open = $bindable(false),
    slot = null,
    patientName = "",
    activityName = "",
    onConfirm = () => {},
  }: {
    open: boolean;
    slot: AvailabilitySlot | null;
    patientName?: string;
    activityName?: string;
    onConfirm: () => void;
  } = $props();
</script>

<AlertDialog.Root bind:open>
  <AlertDialog.Content
    class="max-w-120 rounded-lg bg-white p-6 shadow-2xl border-0"
  >
    <AlertDialog.Header class="flex flex-col items-center text-center">
      <div
        class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#3c8ea5] text-white shadow-sm"
      >
        <IconCalendarCheck class="size-7" />
      </div>
      <AlertDialog.Title class="text-[20px] font-bold text-slate-800"
        >Confirmar cita</AlertDialog.Title
      >
      <AlertDialog.Description
        class="mt-2 text-[13px] text-slate-600 leading-relaxed text-balance"
      >
        Estimado paciente <strong>{patientName}</strong>, su cita para
        <strong>{activityName}</strong>
        le queda asignada para el día
        <strong>{formatDate(slot?.appointmentDate)}</strong>
        a las
        <strong>{formatTime(slot?.appointmentTime)}</strong>
        en la sede
        <strong>{slot?.venueName}</strong>, con el profesional
        <strong>{slot?.professionalName}</strong>.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer class="mt-6 flex flex-row justify-center gap-3">
      <Button
        onclick={onConfirm}
        class="h-9 w-28 bg-[#3c8ea5] hover:bg-[#0e7490] text-white rounded-[3px] text-[13px] shadow-none"
      >
        Aceptar
      </Button>
      <Button
        onclick={() => (open = false)}
        variant="secondary"
        class="h-9 w-28 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[3px] text-[13px] shadow-none"
      >
        Cancelar
      </Button>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
