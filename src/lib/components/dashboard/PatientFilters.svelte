<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import * as Command from "$lib/components/ui/command";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import * as Popover from "$lib/components/ui/popover";
  import * as Select from "$lib/components/ui/select";
  import type {
    AppointmentType,
    MedicalService,
    Venue,
  } from "$lib/types/appointments";
  import { cn } from "$lib/utils";
  import { tick } from "svelte";
  import CheckIcon from "~icons/lucide/check";
  import ChevronsUpDownIcon from "~icons/lucide/chevrons-up-down";

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

  let servicesOpen = $state(false);
  let triggerRef = $state<HTMLButtonElement | null>(null);

  function closeAndFocusTrigger() {
    servicesOpen = false;
    tick().then(() => {
      triggerRef?.focus();
    });
  }
</script>

<div
  class="relative flex h-full flex-col justify-center rounded-[3px] border border-slate-300 bg-white p-5 pt-6 shadow-sm"
>
  <span
    class="absolute -top-3 left-3 bg-white px-2 text-[15px] font-medium text-slate-800"
  >
    Datos paciente
  </span>

  <div class="mt-1 space-y-4">
    <div class="grid grid-cols-[150px_1fr] gap-2">
      <!-- class="block w-37.5 text-right text-[13px] font-medium text-slate-700" -->
      <Label for="patientName" class="text-[13px] font-medium text-slate-700">
        Nombre completo
      </Label>
      <Input
        id="patientName"
        value={userName}
        readonly
        class="h-9 flex-1 rounded-[3px] border-slate-300 bg-slate-100 text-[13px] shadow-none focus-visible:ring-0"
      />
    </div>

    <div class="grid grid-cols-[150px_1fr] gap-2">
      <Label for="patientDoc" class="text-[13px] font-medium text-slate-700">
        Identificación
      </Label>
      <Input
        id="patientDoc"
        value={userDoc}
        readonly
        class="h-9 flex-1 rounded-[3px] border-slate-300 bg-slate-100 text-[13px] shadow-none focus-visible:ring-0"
      />
    </div>

    <div>
      <div class="grid grid-cols-[150px_1fr] gap-2">
        <Label for="selectVenue" class="text-[13px] font-medium text-slate-700">
          Sede <span class="text-red-500">*</span>
        </Label>
        <Select.Root
          type="single"
          bind:value={venueId}
          onValueChange={() => {
            if (submitted) onValidate();
          }}
        >
          <Select.Trigger
            id="selectVenue"
            class="w-full h-9 flex-1 rounded-[3px] {errors.venue && submitted
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
      <div class="grid grid-cols-[150px_1fr] gap-2">
        <Label
          for="selectService"
          class="text-[13px] font-medium text-slate-700"
        >
          Servicio <span class="text-red-500">*</span>
        </Label>
        <Popover.Root bind:open={servicesOpen}>
          <Popover.Trigger bind:ref={triggerRef}>
            {#snippet child({ props })}
              {@const service = services.find(
                (s) => String(s.id) === serviceId,
              )}
              <Button
                variant="outline"
                class="w-full h-9 flex items-center justify-between rounded-[3px] text-[13px]"
                {...props}
                role="combobox"
              >
                <span
                  class={cn(
                    "font-normal",
                    service ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {service?.name || "Seleccionar"}
                </span>
                <ChevronsUpDownIcon class="ms-2 size-4 shrink-0 opacity-50" />
              </Button>
            {/snippet}
          </Popover.Trigger>
          <Popover.Content
            class="w-(--bits-popover-anchor-width) min-w-(--bits-popover-anchor-width) p-0"
            align="start"
          >
            <Command.Root>
              <Command.Input placeholder="Buscar servicios..." />
              <Command.List>
                <Command.Empty>No se encontraron servicios</Command.Empty>
                <Command.Group>
                  {#each services as service (service.id)}
                    <Command.Item
                      value={String(service.name)}
                      onSelect={() => {
                        serviceId = String(service.id);
                        closeAndFocusTrigger();
                      }}
                    >
                      <CheckIcon
                        class={cn(
                          "me-2 size-4",
                          serviceId !== String(service.id) && "opacity-0",
                        )}
                      />
                      {service.name}
                    </Command.Item>
                  {/each}
                </Command.Group>
              </Command.List>
            </Command.Root>
          </Popover.Content>
        </Popover.Root>
      </div>
      {#if errors.service && submitted}<small
          class="text-xs text-red-500 sm:ml-40.5 mt-1 block"
          >{errors.service}</small
        >{/if}
    </div>

    <div>
      <div class="grid grid-cols-[150px_1fr] gap-2">
        <Label
          for="selectActivity"
          class="text-[13px] font-medium text-slate-700"
        >
          Tipo de cita
        </Label>
        <Select.Root
          type="single"
          bind:value={activityId}
          disabled={!serviceId || activities.length === 0}
          onValueChange={() => {
            if (submitted) onValidate();
          }}
        >
          <Select.Trigger
            id="selectActivity"
            class="w-full h-9 flex-1 rounded-[3px] {errors.activity && submitted
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
