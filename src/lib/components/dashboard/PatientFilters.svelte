<script lang="ts">
  import { Input } from "$lib/components/ui/input";
  import * as Select from "$lib/components/ui/select";
  import type {
    AppointmentType,
    MedicalService,
    Venue,
  } from "$lib/types/appointments";

  let {
    userName = "",
    userDoc = "",
    venues = [],
    services = [],
    activities = [],
    venueId = $bindable(""),
    serviceId = $bindable(""),
    activityId = $bindable(""),
    errors = {},
    submitted = false,
    onValidate = () => {},
  }: {
    userName?: string;
    userDoc?: string;
    venues?: Venue[];
    services?: MedicalService[];
    activities?: AppointmentType[];
    venueId: string;
    serviceId: string;
    activityId: string;
    errors?: Record<string, string>;
    submitted?: boolean;
    onValidate?: () => void;
  } = $props();

  const filteredActivities = $derived(
    serviceId
      ? activities.filter(
          (a) => !a.serviceId || String(a.serviceId) === serviceId,
        )
      : activities,
  );
</script>

<div
  class="relative flex h-full flex-col justify-center rounded-[3px] border border-slate-300 bg-white p-5 pt-6 shadow-sm"
>
  <span
    class="absolute -top-3 left-3 bg-white px-2 text-[15px] font-medium text-slate-800"
    >Datos paciente</span
  >

  <div class="mt-1 space-y-4">
    <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
      <label
        for="patientName"
        class="w-37.5 text-left text-[13px] font-medium text-slate-700"
        >Nombre completo</label
      >
      <Input
        id="patientName"
        value={userName}
        readonly
        class="h-9 flex-1 rounded-[3px] border-slate-300 bg-slate-100 text-[13px] shadow-none focus-visible:ring-0"
      />
    </div>

    <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
      <label
        for="patientDoc"
        class="w-37.5 text-left text-[13px] font-medium text-slate-700"
        >Identificación</label
      >
      <Input
        id="patientDoc"
        value={userDoc}
        readonly
        class="h-9 flex-1 rounded-[3px] border-slate-300 bg-slate-100 text-[13px] shadow-none focus-visible:ring-0"
      />
    </div>

    <div>
      <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
        <label
          for="selectVenue"
          class="w-37.5 text-left text-[13px] font-medium text-slate-700"
          >Sede *</label
        >
        <Select.Root
          type="single"
          bind:value={venueId}
          onValueChange={() => {
            if (submitted) onValidate();
          }}
        >
          <Select.Trigger
            id="selectVenue"
            class="h-9 flex-1 rounded-[3px] {errors.venue && submitted
              ? 'border-red-500 ring-1 ring-red-500/20'
              : 'border-slate-300'} text-[13px] shadow-none focus-visible:ring-0"
          >
            {venues.find((v) => String(v.id) === venueId)?.name ||
              "Seleccionar"}
          </Select.Trigger>
          <Select.Content>
            {#each venues as item}
              <Select.Item value={String(item.id)} label={item.name}
                >{item.name}</Select.Item
              >
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
      {#if errors.venue && submitted}<small
          class="text-xs text-red-500 sm:ml-40.5 mt-1 block"
          >{errors.venue}</small
        >{/if}
    </div>

    <div>
      <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
        <label
          for="selectService"
          class="w-37.5 text-left text-[13px] font-medium text-slate-700"
          >Servicio *</label
        >
        <Select.Root
          type="single"
          bind:value={serviceId}
          onValueChange={() => {
            activityId = "";
            if (submitted) onValidate();
          }}
        >
          <Select.Trigger
            id="selectService"
            class="h-9 flex-1 rounded-[3px] {errors.service && submitted
              ? 'border-red-500 ring-1 ring-red-500/20'
              : 'border-slate-300'} text-[13px] shadow-none focus-visible:ring-0"
          >
            {services.find((s) => String(s.id) === serviceId)?.name ||
              "Seleccionar"}
          </Select.Trigger>
          <Select.Content>
            {#each services as item}
              <Select.Item value={String(item.id)} label={item.name}
                >{item.name}</Select.Item
              >
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
      {#if errors.service && submitted}<small
          class="text-xs text-red-500 sm:ml-40.5 mt-1 block"
          >{errors.service}</small
        >{/if}
    </div>

    <div>
      <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
        <label
          for="selectActivity"
          class="w-37.5 text-left text-[13px] font-medium text-slate-700"
          >Tipo de cita *</label
        >
        <Select.Root
          type="single"
          bind:value={activityId}
          disabled={!serviceId}
          onValueChange={() => {
            if (submitted) onValidate();
          }}
        >
          <Select.Trigger
            id="selectActivity"
            class="h-9 flex-1 rounded-[3px] {errors.activity && submitted
              ? 'border-red-500 ring-1 ring-red-500/20'
              : 'border-slate-300'} text-[13px] shadow-none focus-visible:ring-0"
          >
            {filteredActivities.find((a) => String(a.id) === activityId)
              ?.name || "Seleccionar"}
          </Select.Trigger>
          <Select.Content>
            {#each filteredActivities as item}
              <Select.Item value={String(item.id)} label={item.name}
                >{item.name}</Select.Item
              >
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
      {#if errors.activity && submitted}<small
          class="text-xs text-red-500 sm:ml-40.5 mt-1 block"
          >{errors.activity}</small
        >{/if}
    </div>
  </div>
</div>
