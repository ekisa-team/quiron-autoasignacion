<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import * as Select from "$lib/components/ui/select";
  import * as Table from "$lib/components/ui/table";
  import type { Appointment } from "$lib/types/appointments";
  import { formatDate, formatTime, getStatusClass } from "$lib/utils";
  import IconChevronLeft from "~icons/lucide/chevron-left";
  import IconChevronRight from "~icons/lucide/chevron-right";

  let {
    appointments = [],
    isFuture = false,
    totalRecords = 0,
    totalPages = 1,
    page = $bindable(1),
    pageSize = $bindable("5"),
    isLoading = false,
    onPageChange = () => {},
    onCancelClick = () => {},
  }: {
    appointments: Appointment[];
    isFuture?: boolean;
    totalRecords: number;
    totalPages: number;
    page: number;
    pageSize: string;
    isLoading?: boolean;
    onPageChange: (page: number, size: string) => void;
    onCancelClick?: (appointment: Appointment) => void;
  } = $props();
</script>

<Table.Root>
  <Table.TableHeader class="bg-[#528ca2]">
    <Table.TableRow>
      <Table.TableHead class="text-[13px] font-semibold text-white"
        >Cita</Table.TableHead
      >
      <Table.TableHead class="text-[13px] font-semibold text-white"
        >Profesional/equipo</Table.TableHead
      >
      <Table.TableHead class="text-[13px] font-semibold text-white"
        >Fecha</Table.TableHead
      >
      <Table.TableHead class="text-[13px] font-semibold text-white"
        >Hora</Table.TableHead
      >
      <Table.TableHead class="text-[13px] font-semibold text-white"
        >Sede</Table.TableHead
      >
      <Table.TableHead class="text-[13px] font-semibold text-white"
        >Estado</Table.TableHead
      >
      {#if isFuture}<Table.TableHead
          class="text-right text-[13px] font-semibold text-white"
          >Acciones</Table.TableHead
        >{/if}
    </Table.TableRow>
  </Table.TableHeader>
  <Table.TableBody>
    {#if isLoading}
      <Table.TableRow>
        <Table.TableCell
          colspan={isFuture ? 7 : 6}
          class="h-24 text-center text-slate-500 text-[13px]"
        >
          Cargando citas...
        </Table.TableCell>
      </Table.TableRow>
    {:else}
      {#each appointments as item, index (`${item.appointmentKey}-${index}`)}
        <Table.TableRow class="hover:bg-slate-50">
          <Table.TableCell class="text-[13px] font-medium"
            >{item.activityName}</Table.TableCell
          >
          <Table.TableCell class="text-[13px] text-slate-600"
            >{item.professionalName}</Table.TableCell
          >
          <Table.TableCell class="text-[13px] text-slate-600"
            >{formatDate(item.appointmentDate)}</Table.TableCell
          >
          <Table.TableCell class="text-[13px] font-medium text-slate-700"
            >{formatTime(item.appointmentTime)}</Table.TableCell
          >
          <Table.TableCell class="text-[13px] text-slate-600"
            >{item.venueName}</Table.TableCell
          >
          <Table.TableCell>
            <span class={getStatusClass(item.status)}>{item.status}</span>
          </Table.TableCell>
          {#if isFuture}
            <Table.TableCell class="text-right">
              {#if item.status === "ASIGNADA"}
                <Button
                  onclick={() => onCancelClick(item)}
                  variant="outline"
                  size="sm"
                  class="h-7 border-red-200 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 rounded-[3px]"
                >
                  Cancelar
                </Button>
              {/if}
            </Table.TableCell>
          {/if}
        </Table.TableRow>
      {:else}
        <Table.TableRow>
          <Table.TableCell
            colspan={isFuture ? 7 : 6}
            class="h-24 text-center text-slate-500 text-[13px]"
          >
            {isFuture
              ? "No tienes citas futuras programadas."
              : "No se encontraron citas anteriores."}
          </Table.TableCell>
        </Table.TableRow>
      {/each}
    {/if}
  </Table.TableBody>
</Table.Root>

{#if totalRecords > 0}
  <div
    class="mt-4 flex flex-col items-center justify-between gap-3 border-t border-slate-200 p-3 text-[13px] text-slate-600 sm:flex-row"
  >
    <div class="flex items-center gap-2">
      <span>Filas por página:</span>
      <Select.Root
        type="single"
        bind:value={pageSize}
        onValueChange={(val) => onPageChange(1, val)}
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
          totalRecords,
        )} de {totalRecords} registros</span
      >
    </div>
    <div class="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        class="h-8 w-8"
        disabled={page <= 1 || isLoading}
        onclick={() => onPageChange(page - 1, pageSize)}
      >
        <IconChevronLeft class="size-4" />
      </Button>
      <span class="px-2 font-medium">Página {page} de {totalPages}</span>
      <Button
        variant="outline"
        size="icon"
        class="h-8 w-8"
        disabled={page >= totalPages || isLoading}
        onclick={() => onPageChange(page + 1, pageSize)}
      >
        <IconChevronRight class="size-4" />
      </Button>
    </div>
  </div>
{/if}
