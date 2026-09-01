<script lang="ts">
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { Button } from "$lib/components/ui/button";
  import type { Appointment } from "$lib/types/appointments";
  import { formatDate, formatTime } from "$lib/utils";
  import IconCalendarX from "~icons/lucide/calendar-x";

  let {
    open = $bindable(false),
    appointment = null,
    patientName = "",
    patientDoc = "",
    onConfirm = () => {},
  }: {
    open: boolean;
    appointment: Appointment | null;
    patientName?: string;
    patientDoc?: string;
    onConfirm: () => void;
  } = $props();
</script>

<AlertDialog.Root bind:open>
  <AlertDialog.Content
    class="max-w-110 rounded-lg bg-white p-6 shadow-2xl border-0"
  >
    <AlertDialog.Header class="flex flex-col items-center text-center">
      <div
        class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-sm"
      >
        <IconCalendarX class="size-7" />
      </div>
      <AlertDialog.Title class="text-[20px] font-bold text-slate-800"
        >Cancelar cita</AlertDialog.Title
      >
      <AlertDialog.Description
        class="mt-2 text-[13px] text-slate-600 leading-relaxed text-balance"
      >
        Paciente: <strong>{patientName}</strong> (Doc: {patientDoc})<br /><br />
        ¿Está seguro de que desea cancelar la cita programada para el día
        <strong>{formatDate(appointment?.appointmentDate)}</strong>
        a las
        <strong>{formatTime(appointment?.appointmentTime)}</strong>?<br /><br />
        <span class="text-xs text-red-500 font-medium"
          >Esta acción no se puede deshacer.</span
        >
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer class="mt-6 flex flex-row justify-center gap-3">
      <Button
        onclick={onConfirm}
        class="h-9 w-28 bg-red-600 hover:bg-red-700 text-white rounded-[3px] text-[13px] shadow-none"
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
