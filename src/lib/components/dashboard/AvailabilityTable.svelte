<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import * as Select from "$lib/components/ui/select";
  import * as Table from "$lib/components/ui/table";
  import type { AvailabilitySlot } from "$lib/types/appointments";
  import { formatDate, formatTime } from "$lib/utils";
  import IconChevronLeft from "~icons/lucide/chevron-left";
  import IconChevronRight from "~icons/lucide/chevron-right";

  let {
    slots = [],
    pageSize = $bindable("5"),
    page = $bindable(1),
    onAssignClick = () => {},
  }: {
    slots: AvailabilitySlot[];
    pageSize: string;
    page: number;
    onAssignClick: (slot: AvailabilitySlot) => void;
  } = $props();

  const paginated = $derived(
    slots.slice((page - 1) * Number(pageSize), page * Number(pageSize)),
  );
  const totalPages = $derived(Math.ceil(slots.length / Number(pageSize)) || 1);
</script>

<Table.Root>
  <Table.TableHeader class="bg-primary">
    <Table.TableRow>
      <Table.TableHead class="text-[13px] font-semibold text-primary-foreground"
        >Fecha</Table.TableHead
      >
      <Table.TableHead class="text-[13px] font-semibold text-primary-foreground"
        >Hora</Table.TableHead
      >
      <Table.TableHead class="text-[13px] font-semibold text-primary-foreground"
        >Sede</Table.TableHead
      >
      <Table.TableHead class="text-[13px] font-semibold text-primary-foreground"
        >Profesional/equipo</Table.TableHead
      >
      <Table.TableHead class="text-[13px] font-semibold text-primary-foreground"
        >Dirección</Table.TableHead
      >
      <Table.TableHead
        class="text-right text-[13px] font-semibold text-primary-foreground"
        >Acción</Table.TableHead
      >
    </Table.TableRow>
  </Table.TableHeader>
  <Table.TableBody>
    {#each paginated as slot, index (`${slot.appointmentKey}-${index}`)}
      <Table.TableRow class="hover:bg-slate-50">
        <Table.TableCell class="text-[13px] font-medium"
          >{formatDate(slot.appointmentDate)}</Table.TableCell
        >
        <Table.TableCell class="text-[13px] font-medium text-primary"
          >{formatTime(slot.appointmentTime)}</Table.TableCell
        >
        <Table.TableCell class="text-[13px] text-slate-600"
          >{slot.venueName}</Table.TableCell
        >
        <Table.TableCell class="text-[13px] text-slate-600"
          >{slot.professionalName}</Table.TableCell
        >
        <Table.TableCell class="text-[13px] text-slate-600"
          >{slot.venueAddress || ""}</Table.TableCell
        >
        <Table.TableCell class="text-right">
          <Button
            onclick={() => onAssignClick(slot)}
            size="sm"
            class="h-7 bg-primary hover:bg-primary/90 text-primary-foreground text-xs rounded-[3px] shadow-none"
          >
            Asignar
          </Button>
        </Table.TableCell>
      </Table.TableRow>
    {:else}
      <Table.TableRow>
        <Table.TableCell
          colspan={6}
          class="h-24 text-center text-slate-500 text-[13px]"
        >
          No hay agenda disponible para los filtros seleccionados.
        </Table.TableCell>
      </Table.TableRow>
    {/each}
  </Table.TableBody>
</Table.Root>

{#if slots.length > 0}
  <div
    class="mt-4 flex flex-col items-center justify-between gap-3 border-t border-slate-200 p-3 text-[13px] text-slate-600 sm:flex-row"
  >
    <div class="flex items-center gap-2">
      <span>Filas por página:</span>
      <Select.Root
        type="single"
        bind:value={pageSize}
        onValueChange={() => (page = 1)}
      >
        <Select.Trigger class="h-8 w-16 text-xs">{pageSize}</Select.Trigger>
        <Select.Content>
          <Select.Item value="5" label="5">5</Select.Item>
          <Select.Item value="10" label="10">10</Select.Item>
          <Select.Item value="25" label="25">25</Select.Item>
          <Select.Item value="50" label="50">50</Select.Item>
        </Select.Content>
      </Select.Root>
      <span
        >Mostrando {(page - 1) * Number(pageSize) + 1} a {Math.min(
          page * Number(pageSize),
          slots.length,
        )} de {slots.length} registros</span
      >
    </div>
    <div class="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        class="h-8 w-8"
        disabled={page <= 1}
        onclick={() => page--}
      >
        <IconChevronLeft class="size-4" />
      </Button>
      <span class="px-2 font-medium">Página {page} de {totalPages}</span>
      <Button
        variant="outline"
        size="icon"
        class="h-8 w-8"
        disabled={page >= totalPages}
        onclick={() => page++}
      >
        <IconChevronRight class="size-4" />
      </Button>
    </div>
  </div>
{/if}
