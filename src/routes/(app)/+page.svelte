<script lang="ts">
  import AppointmentsTable from "$lib/components/dashboard/AppointmentsTable.svelte";
  import AssignModal from "$lib/components/dashboard/AssignModal.svelte";
  import AvailabilityTable from "$lib/components/dashboard/AvailabilityTable.svelte";
  import CalendarWidget from "$lib/components/dashboard/CalendarWidget.svelte";
  import CancelModal from "$lib/components/dashboard/CancelModal.svelte";
  import PatientFilters from "$lib/components/dashboard/PatientFilters.svelte";
  import { Button } from "$lib/components/ui/button";
  import * as Tabs from "$lib/components/ui/tabs";
  import type {
    Appointment,
    AppointmentType,
    AvailabilitySlot,
  } from "$lib/types/appointments";
  import type { DateValue } from "@internationalized/date";
  import { getLocalTimeZone, today } from "@internationalized/date";
  import { error } from "@sveltejs/kit";
  import { toast } from "svelte-sonner";
  import IconCalendar from "~icons/lucide/calendar";
  import IconCalendarDays from "~icons/lucide/calendar-days";
  import IconCalendarPlus from "~icons/lucide/calendar-plus";
  import IconCalendarSearch from "~icons/lucide/calendar-search";

  let { data } = $props();

  $inspect(data);

  let currentProcess = $state<"asignar-nueva-cita" | "mis-citas">("mis-citas");
  let currentTab = $state<"futuras" | "disponibilidad">("futuras");
  let venueId = $state("");
  let serviceId = $state("");
  let activityId = $state("");
  let selectedDate = $state<DateValue | undefined>(today(getLocalTimeZone()));
  let isSearching = $state(false);
  let formErrors = $state<{
    venue?: string;
    service?: string;
    activity?: string;
  }>({});
  let formSubmitted = $state(false);

  let futureAppointments = $state<Appointment[]>([]);
  let totalRecordsFuture = $state(0);
  let totalPagesFuture = $state(1);
  let pageFuture = $state(1);
  let pageSizeFuture = $state("5");
  let isLoadingFuture = $state(false);

  let pastAppointments = $state<Appointment[]>([]);
  let totalRecordsPast = $state(0);
  let totalPagesPast = $state(1);
  let pagePast = $state(1);
  let pageSizePast = $state("5");
  let isLoadingPast = $state(false);

  $effect(() => {
    futureAppointments = data.futureAppointments?.items || [];
    totalRecordsFuture = data.futureAppointments?.totalRecords || 0;
    totalPagesFuture = data.futureAppointments?.totalPages || 1;

    pastAppointments = data.pastAppointments?.items || [];
    totalRecordsPast = data.pastAppointments?.totalRecords || 0;
    totalPagesPast = data.pastAppointments?.totalPages || 1;
  });

  let availabilitySlots = $state<AvailabilitySlot[]>([]);
  let totalRecordsAvailability = $state(0);
  let totalPagesAvailability = $state(1);
  let pageSizeAvailability = $state("5");
  let pageAvailability = $state(1);

  let showAssignModal = $state(false);
  let slotToAssign = $state<AvailabilitySlot | null>(null);

  let showCancelModal = $state(false);
  let appointmentToCancel = $state<Appointment | null>(null);

  let availableDates = $state<string[]>([]);
  let activities = $state<AppointmentType[]>([]);

  $effect(() => {
    fetchAvailableDates(venueId, serviceId);
  });

  $effect(() => {
    if (serviceId) {
      fetchActivities(serviceId);
    }
  });

  $effect(() => {
    if (currentProcess === "asignar-nueva-cita" && selectedDate) {
      searchAvailability(1, pageSizeAvailability);
    }
  });

  function validateSearchForm(): boolean {
    const errors: typeof formErrors = {};
    if (!venueId) errors.venue = "Este campo es requerido";
    if (!serviceId) errors.service = "Este campo es requerido";
    formErrors = errors;
    return Object.keys(errors).length === 0;
  }

  async function fetchAppointments(
    type: "futuras" | "anteriores",
    page: number,
    size: string,
  ) {
    if (type === "futuras") isLoadingFuture = true;
    else isLoadingPast = true;

    try {
      const res = await fetch(
        `/api/appointments/patient?type=${type}&page=${page}&pageSize=${size}`,
      );
      const json = await res.json();
      if (type === "futuras") {
        futureAppointments = json.items || [];
        totalRecordsFuture = json.totalRecords || 0;
        totalPagesFuture = json.totalPages || 1;
        pageFuture = json.page || 1;
      } else {
        pastAppointments = json.items || [];
        totalRecordsPast = json.totalRecords || 0;
        totalPagesPast = json.totalPages || 1;
        pagePast = json.page || 1;
      }
    } catch {
      toast.error(`Error al cargar citas`);
    } finally {
      if (type === "futuras") isLoadingFuture = false;
      else isLoadingPast = false;
    }
  }

  async function fetchActivities(serviceId: string) {
    try {
      const res = await fetch(
        `/api/lookups/appointment-types?idServicio=${serviceId}`,
      );
      const json = await res.json();

      activities = (json || []).map((a: any) => ({
        id: a.IdActividad,
        serviceId: a.IdServicio,
        name: a.NombreActividad,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : JSON.stringify(err);
      error(500, message);
    }
  }

  async function searchAvailability(
    pageNumber: number = 1,
    size: string = pageSizeAvailability,
  ) {
    formSubmitted = true;
    if (!validateSearchForm() || !selectedDate) {
      toast.warning("Faltan datos por llenar");
      return;
    }

    isSearching = true;
    try {
      const res = await fetch("/api/appointments/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fechaC: selectedDate.toString(),
          idServicio: serviceId,
          idActividad: activityId,
          idSede: venueId,
          page: pageNumber,
          pageSize: Number(size),
        }),
      });
      const json = await res.json();

      availabilitySlots = json.items || [];
      totalRecordsAvailability = json.totalRecords || 0;
      totalPagesAvailability = json.totalPages || 1;
      pageAvailability = json.page || 1;
      pageSizeAvailability = size;

      currentTab = "disponibilidad";
    } catch (err) {
      const message = err instanceof Error ? err.message : JSON.stringify(err);
      toast.error(message);
    } finally {
      isSearching = false;
    }
  }

  async function confirmAssign() {
    if (!slotToAssign) return;

    try {
      const res = await fetch("/api/appointments/patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fechaServicio: slotToAssign.appointmentDate,
          horaServicio: slotToAssign.appointmentTime,
          idProfesional: slotToAssign.professionalId,
          idActividadCita: activityId,
          claveCita: slotToAssign.appointmentKey,
          idSede: venueId,
          activityName:
            activities?.find((a) => String(a.id) === activityId)?.name ||
            "Consulta",
          professionalName: slotToAssign.professionalName,
          venueName: slotToAssign.venueName,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Cita programada exitosamente");
        await fetchAppointments("futuras", 1, pageSizeFuture);
        showAssignModal = false;
        currentTab = "futuras";
      } else {
        toast.error(result.message || "Error al asignar cita");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : JSON.stringify(err);
      toast.error(message);
    }
  }

  async function confirmCancel() {
    if (!appointmentToCancel) return;

    try {
      const res = await fetch(
        `/api/appointments/${appointmentToCancel.appointmentKey}/cancel`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activityName: appointmentToCancel.activityName,
            professionalName: appointmentToCancel.professionalName,
            appointmentDate: appointmentToCancel.appointmentDate,
            appointmentTime: appointmentToCancel.appointmentTime,
            venueName: appointmentToCancel.venueName,
          }),
        },
      );
      const result = await res.json();
      if (result.success) {
        toast.success("Cita cancelada correctamente");
        await fetchAppointments("futuras", pageFuture, pageSizeFuture);
        showCancelModal = false;
      } else {
        toast.error("Error al cancelar cita");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : JSON.stringify(err);
      toast.error(message);
    }
  }

  async function fetchAvailableDates(vId: string, sId: string) {
    try {
      const res = await fetch(
        `/api/appointments/available-dates?venueId=${vId}&serviceId=${sId}`,
      );
      availableDates = await res.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : JSON.stringify(err);
      error(500, message);
    }
  }

  function handleSlotAssign(slot: AvailabilitySlot) {
    if (!activityId || activityId.trim() === "") {
      formSubmitted = true;
      formErrors = {
        ...formErrors,
        activity: "Debes seleccionar el tipo de cita para asignar",
      };
      toast.warning(
        "Por favor selecciona el Tipo de Cita en el panel superior para continuar.",
      );
      return;
    }

    slotToAssign = slot;
    showAssignModal = true;
  }
</script>

<div class="p-4 sm:p-8">
  <section class="grid grid-cols-1 gap-4 lg:grid-cols-8 lg:items-stretch">
    <div class="flex flex-col lg:col-span-4">
      <PatientFilters
        userName={data.user?.fullName}
        userDoc={data.user?.patientIdentification}
        venues={data.venues}
        services={data.services}
        {activities}
        bind:venueId
        bind:serviceId
        bind:activityId
        errors={formErrors}
        submitted={formSubmitted}
        onValidate={validateSearchForm}
      />
    </div>
    <div class="flex flex-col lg:col-span-4">
      <CalendarWidget
        bind:selectedDate
        festivos={data.holidays}
        {availableDates}
      />
    </div>
  </section>

  <section class="mt-6 grid gap-4 grid-cols-8 items-stretch">
    <div class="col-span-4 flex justify-end">
      <Button
        variant={currentProcess === "asignar-nueva-cita"
          ? "default"
          : "outline"}
        size="lg"
        disabled={isSearching || !(venueId.trim() && serviceId.trim())}
        class="w-full max-w-xs rounded-sm px-6 text-[14px] font-medium shadow-none"
        onclick={() => {
          currentProcess = "asignar-nueva-cita";
          searchAvailability(1, pageSizeAvailability);
        }}
      >
        <IconCalendarPlus class="mr-2 size-5" />
        {isSearching ? "Buscando..." : "Asignar nueva cita"}
      </Button>
    </div>
    <div class="col-span-4 flex justify-start">
      <Button
        variant={currentProcess === "mis-citas" ? "default" : "outline"}
        size="lg"
        class="w-full max-w-xs rounded-sm px-6 text-[14px] font-medium shadow-none"
        onclick={() => {
          currentProcess = "mis-citas";
          currentTab = "futuras";
        }}
      >
        <IconCalendarSearch class="mr-2 size-5" /> Mis citas
      </Button>
    </div>
  </section>

  <section class="mt-8">
    <Tabs.Root bind:value={currentTab} class="w-full">
      <Tabs.List variant="line">
        {#if currentTab !== "disponibilidad"}
          <Tabs.Trigger value="futuras" class="after:bg-primary">
            <IconCalendarDays /> Citas futuras
          </Tabs.Trigger>
          <Tabs.Trigger value="anteriores" class="after:bg-primary">
            <IconCalendarSearch /> Citas anteriores
          </Tabs.Trigger>
        {:else}
          <Tabs.Trigger value="disponibilidad" class="after:bg-primary">
            <IconCalendar /> Disponibilidad
          </Tabs.Trigger>
        {/if}
      </Tabs.List>

      <div
        class="mt-0 min-h-62.5 rounded-b-[3px] border border-t-0 border-slate-300 bg-white shadow-sm"
      >
        <Tabs.Content value="futuras" class="mt-0">
          <AppointmentsTable
            appointments={futureAppointments}
            isFuture={true}
            totalRecords={totalRecordsFuture}
            totalPages={totalPagesFuture}
            bind:page={pageFuture}
            bind:pageSize={pageSizeFuture}
            isLoading={isLoadingFuture}
            onPageChange={(p, s) => fetchAppointments("futuras", p, s)}
            onCancelClick={(item) => {
              appointmentToCancel = item;
              showCancelModal = true;
            }}
          />
        </Tabs.Content>
        <Tabs.Content value="anteriores" class="mt-0">
          <AppointmentsTable
            appointments={pastAppointments}
            isFuture={false}
            totalRecords={totalRecordsPast}
            totalPages={totalPagesPast}
            bind:page={pagePast}
            bind:pageSize={pageSizePast}
            isLoading={isLoadingPast}
            onPageChange={(p, s) => fetchAppointments("anteriores", p, s)}
          />
        </Tabs.Content>
        <Tabs.Content value="disponibilidad" class="mt-0">
          <AvailabilityTable
            slots={availabilitySlots}
            totalRecords={totalRecordsAvailability}
            totalPages={totalPagesAvailability}
            bind:pageSize={pageSizeAvailability}
            bind:page={pageAvailability}
            isLoading={isSearching}
            onPageChange={(p, s) => searchAvailability(p, s)}
            onAssignClick={handleSlotAssign}
          />
        </Tabs.Content>
      </div>
    </Tabs.Root>
  </section>
</div>

<AssignModal
  bind:open={showAssignModal}
  slot={slotToAssign}
  patientName={data.user?.fullName ?? ""}
  activityName={activities?.find((a) => String(a.id) === activityId)?.name ??
    "Consulta"}
  onConfirm={confirmAssign}
/>

<CancelModal
  bind:open={showCancelModal}
  appointment={appointmentToCancel}
  patientName={data.user?.fullName ?? ""}
  patientDoc={data.user?.patientIdentification ?? ""}
  onConfirm={confirmCancel}
/>
