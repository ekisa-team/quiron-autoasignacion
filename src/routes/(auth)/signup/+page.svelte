<script lang="ts">
  import { goto } from "$app/navigation";
  import { createTurnstile } from "$lib/attachments/turnstile.svelte";
  import { Button } from "$lib/components/ui/button";
  import { Calendar } from "$lib/components/ui/calendar";
  import * as Card from "$lib/components/ui/card";
  import * as InputGroup from "$lib/components/ui/input-group";
  import * as Popover from "$lib/components/ui/popover";
  import * as Select from "$lib/components/ui/select";
  import type { DocumentTypeOption } from "$lib/types/appointments";
  import {
    CalendarDate,
    type DateValue,
    getLocalTimeZone,
    today,
  } from "@internationalized/date";
  import { toast } from "svelte-sonner";
  import IconArrowLeft from "~icons/lucide/arrow-left";
  import IconCalendar from "~icons/lucide/calendar";
  import IconContact from "~icons/lucide/contact";
  import IconIdCard from "~icons/lucide/id-card";
  import IconInfo from "~icons/lucide/info";
  import IconKeyRound from "~icons/lucide/key-round";
  import IconMail from "~icons/lucide/mail";
  import IconMapPin from "~icons/lucide/map-pin";
  import IconPhone from "~icons/lucide/phone";
  import IconShieldCheck from "~icons/lucide/shield-check";
  import IconSmartphone from "~icons/lucide/smartphone";
  import IconUser from "~icons/lucide/user";
  import IconUserPlus from "~icons/lucide/user-plus";
  import IconUsers from "~icons/lucide/users";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let documentType = $state("");
  let documentNumber = $state("");
  let firstName = $state("");
  let secondName = $state("");
  let firstLastName = $state("");
  let secondLastName = $state("");
  let isDatePickerOpen = $state(false);
  let birthDateInput = $state("");
  let birthDateValue = $state<DateValue | undefined>(undefined);
  let calendarPlaceholder = $state<DateValue>(new CalendarDate(2000, 1, 1));
  let turnstileToken = $state("");
  let resetCounter = $state(0);

  const turnstileAttachment = createTurnstile({
    onToken: (token) => {
      turnstileToken = token;
    },
    resetTrigger: () => resetCounter,
  });

  function isValidDate(d: number, m: number, y: number): boolean {
    if (isNaN(d) || isNaN(m) || isNaN(y)) return false;
    if (
      m < 1 ||
      m > 12 ||
      d < 1 ||
      d > 31 ||
      y < 1920 ||
      y > new Date().getFullYear()
    ) {
      return false;
    }
    const dateObj = new Date(y, m - 1, d);
    return (
      dateObj.getFullYear() === y &&
      dateObj.getMonth() === m - 1 &&
      dateObj.getDate() === d
    );
  }

  const isBirthDateComplete = $derived(
    birthDateInput.length === 10 && birthDateInput.includes("/"),
  );
  const isBirthDateInvalid = $derived.by(() => {
    if (!isBirthDateComplete) return false;
    const [d, m, y] = birthDateInput.split("/").map(Number);
    return !isValidDate(d, m, y);
  });

  const birthDateIso = $derived.by(() => {
    if (birthDateValue) {
      return `${birthDateValue.year}-${String(birthDateValue.month).padStart(2, "0")}-${String(birthDateValue.day).padStart(2, "0")}`;
    }
    if (isBirthDateComplete && !isBirthDateInvalid) {
      const [d, m, y] = birthDateInput.split("/").map(Number);
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    return "";
  });

  let gender = $state("M");
  let address = $state("");
  let phone = $state("");
  let mobile = $state("");
  let email = $state("");
  let password = $state("");
  let confirmPassword = $state("");
  let isLoading = $state(false);
  let errors = $state<Record<string, string>>({});
  let submitted = $state(false);

  const isPasswordTooShort = $derived(
    password.length > 0 && password.length < 6,
  );
  const passwordsMismatch = $derived(
    confirmPassword.length > 0 && password !== confirmPassword,
  );
  const isEmailInvalid = $derived(
    email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  );

  const documentTypes = $derived(data.documentTypes || []);
  const selectedDocLabel = $derived(
    documentTypes.find((d: DocumentTypeOption) => d.value === documentType)
      ?.label,
  );

  $effect(() => {
    if (data.initialDocType && !documentType)
      documentType = data.initialDocType;
    if (data.initialDoc && !documentNumber) documentNumber = data.initialDoc;
  });

  function handleDateInput(e: Event) {
    const target = e.target as HTMLInputElement;
    let val = target.value.replace(/\D/g, "").slice(0, 8);
    if (val.length >= 5) {
      birthDateInput = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`;
    } else if (val.length >= 3) {
      birthDateInput = `${val.slice(0, 2)}/${val.slice(2)}`;
    } else {
      birthDateInput = val;
    }

    if (val.length >= 6) {
      const m = Number(val.slice(2, 4));
      const y = Number(val.slice(4));
      if (m >= 1 && m <= 12 && y >= 1920 && y <= new Date().getFullYear()) {
        try {
          calendarPlaceholder = new CalendarDate(y, m, 1);
        } catch {}
      }
    }

    if (val.length === 8) {
      const d = Number(val.slice(0, 2));
      const m = Number(val.slice(2, 4));
      const y = Number(val.slice(4));
      if (isValidDate(d, m, y)) {
        try {
          birthDateValue = new CalendarDate(y, m, d);
          calendarPlaceholder = new CalendarDate(y, m, d);
        } catch {
          birthDateValue = undefined;
        }
      } else {
        birthDateValue = undefined;
        if (m >= 1 && m <= 12 && y >= 1920 && y <= new Date().getFullYear()) {
          try {
            calendarPlaceholder = new CalendarDate(y, m, 1);
          } catch {}
        }
      }
    } else {
      birthDateValue = undefined;
    }
  }

  function handleCalendarSelect(val: DateValue | undefined) {
    if (!val) return;
    birthDateValue = val;
    calendarPlaceholder = val;
    birthDateInput = `${String(val.day).padStart(2, "0")}/${String(val.month).padStart(2, "0")}/${val.year}`;
    isDatePickerOpen = false;
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};
    if (!documentType) newErrors.documentType = "Requerido";
    if (!documentNumber.trim()) newErrors.documentNumber = "Requerido";
    if (!firstName.trim()) newErrors.firstName = "Requerido";
    if (!firstLastName.trim()) newErrors.firstLastName = "Requerido";
    if (!birthDateIso || isBirthDateInvalid) {
      newErrors.birthDate = isBirthDateInvalid
        ? "Fecha no válida (DD/MM/AAAA)"
        : "Requerido";
    }
    if (!email.trim() || isEmailInvalid) newErrors.email = "Email no válido";
    if (!mobile.trim()) newErrors.mobile = "Requerido";
    if (!password || password.length < 6)
      newErrors.password = "Mínimo 6 caracteres";
    if (confirmPassword !== password)
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    submitted = true;
    if (!validateForm()) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    isLoading = true;
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType,
          identification: documentNumber,
          nombre1: firstName.toUpperCase(),
          nombre2: secondName.toUpperCase(),
          apellido1: firstLastName.toUpperCase(),
          apellido2: secondLastName.toUpperCase(),
          fechaNacimiento: birthDateIso,
          sexo: gender,
          direccion: address,
          telefono: phone,
          celular: mobile,
          email,
          password,
          turnstileToken,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(
          "Registro exitoso. Se ha enviado un correo de verificación.",
        );
        goto("/register-confirmation");
      } else {
        toast.error(result.message || "Error al registrar el paciente");
        turnstileToken = "";
        resetCounter++;
      }
    } catch (error) {
      toast.error("Error de conexión con el servidor");
      turnstileToken = "";
      resetCounter++;
    } finally {
      isLoading = false;
    }
  }
</script>

<Card.Root
  class="w-full max-w-4xl border-0 bg-white p-6 sm:p-10 shadow-2xl rounded-lg"
>
  <Card.Header class="mb-5 p-0">
    <div class="flex items-center gap-4">
      <div
        class="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm shrink-0"
      >
        <IconUserPlus class="size-7" />
      </div>
      <div>
        <h1 class="text-[26px] font-bold text-slate-800">
          Registro de Paciente
        </h1>
        <p class="text-[13px] text-slate-500 mt-0.5 leading-snug">
          Ingresa tus datos personales para crear tu cuenta en {data.tenant
            ?.name || "la plataforma"}
        </p>
      </div>
    </div>
  </Card.Header>

  <Card.Content class="p-0">
    {#if data.fromLogin}
      <div
        class="mb-6 flex items-start gap-3 rounded bg-slate-50 border border-slate-200 p-3.5 text-[13px] text-slate-800 leading-relaxed"
      >
        <IconInfo class="size-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p class="font-semibold text-slate-900">
            No encontramos una cuenta con el documento ingresado.
          </p>
          <p class="mt-0.5 text-slate-600">
            Completa el formulario para registrarte. Si cometiste una
            equivocación al escribir tu documento, <a
              href="/login?c={data.clientId}"
              class="font-semibold text-primary hover:underline"
              >haz clic aquí para volver al inicio de sesión</a
            >.
          </p>
        </div>
      </div>
    {/if}

    <form
      novalidate
      autocomplete="off"
      onsubmit={handleSubmit}
      class="space-y-6"
    >
      <div>
        <div
          class="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4 text-slate-800"
        >
          <IconIdCard class="size-4 text-primary" />
          <h2 class="text-[14px] font-bold tracking-tight">
            1. Identificación y Datos Personales
          </h2>
        </div>

        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                for="docType"
                class="text-[12px] font-medium text-slate-700 block mb-1"
                >Tipo de documento *</label
              >
              <InputGroup.Root
                class="border-slate-300 rounded-[3px] overflow-hidden bg-white {errors.documentType &&
                submitted
                  ? 'border-red-500'
                  : ''}"
              >
                <InputGroup.Addon
                  class="border-r border-slate-300 bg-slate-50 w-9 p-0 flex items-center justify-center h-full m-0 shrink-0"
                >
                  <IconIdCard class="size-4 text-slate-400" />
                </InputGroup.Addon>
                <Select.Root type="single" bind:value={documentType}>
                  <Select.Trigger
                    id="docType"
                    class="w-full h-full border-0 px-3 text-[13px] font-normal shadow-none focus:ring-0"
                  >
                    <span
                      class={selectedDocLabel
                        ? "text-slate-700"
                        : "text-slate-400"}
                    >
                      {selectedDocLabel || "Seleccionar tipo"}
                    </span>
                  </Select.Trigger>
                  <Select.Content>
                    {#each documentTypes as item}
                      <Select.Item value={item.value} label={item.label}
                        >{item.label}</Select.Item
                      >
                    {/each}
                  </Select.Content>
                </Select.Root>
              </InputGroup.Root>
              {#if errors.documentType && submitted}<small
                  class="text-xs text-red-500 mt-1 block"
                  >{errors.documentType}</small
                >{/if}
            </div>

            <div>
              <label
                for="docNumber"
                class="text-[12px] font-medium text-slate-700 block mb-1"
                >Número de documento *</label
              >
              <InputGroup.Root
                class="border-slate-300 rounded-[3px] overflow-hidden bg-white {errors.documentNumber &&
                submitted
                  ? 'border-red-500'
                  : ''}"
              >
                <InputGroup.Addon
                  class="border-r border-slate-300 bg-slate-50 w-9 p-0 flex items-center justify-center h-full m-0 shrink-0"
                >
                  <IconUser class="size-4 text-slate-400" />
                </InputGroup.Addon>
                <InputGroup.Input
                  id="docNumber"
                  autocomplete="off"
                  bind:value={documentNumber}
                  placeholder="Número de documento"
                  class="h-full border-0 text-[13px] placeholder:text-slate-400 focus-visible:ring-0 shadow-none px-3"
                />
              </InputGroup.Root>
              {#if errors.documentNumber && submitted}<small
                  class="text-xs text-red-500 mt-1 block"
                  >{errors.documentNumber}</small
                >{/if}
            </div>

            <div>
              <label
                for="birthDate"
                class="text-[12px] font-medium text-slate-700 block mb-1"
                >Fecha de Nacimiento *</label
              >
              <InputGroup.Root
                class="border-slate-300 rounded-[3px] overflow-hidden bg-white h-9 {isBirthDateInvalid ||
                (errors.birthDate && submitted)
                  ? 'border-red-500 ring-1 ring-red-500/20'
                  : ''}"
              >
                <Popover.Root bind:open={isDatePickerOpen}>
                  <Popover.Trigger
                    class="border-r border-slate-300 bg-slate-50 hover:bg-primary text-slate-500 hover:text-primary-foreground w-9 p-0 flex items-center justify-center h-full m-0 shrink-0 cursor-pointer transition-colors"
                    title="Seleccionar fecha"
                  >
                    <IconCalendar class="size-4" />
                  </Popover.Trigger>
                  <Popover.Content
                    class="w-auto p-3 bg-white border border-slate-200 shadow-2xl rounded-lg z-50"
                    align="start"
                  >
                    <Calendar
                      type="single"
                      captionLayout="dropdown"
                      locale="es-CO"
                      bind:value={birthDateValue}
                      bind:placeholder={calendarPlaceholder}
                      minValue={new CalendarDate(1940, 1, 1)}
                      maxValue={today(getLocalTimeZone())}
                      onValueChange={handleCalendarSelect}
                      class="p-0 border-0 shadow-none"
                    />
                  </Popover.Content>
                </Popover.Root>
                <InputGroup.Input
                  id="birthDate"
                  type="text"
                  placeholder="DD/MM/AAAA"
                  autocomplete="off"
                  autocorrect="off"
                  spellcheck="false"
                  value={birthDateInput}
                  oninput={handleDateInput}
                  class="h-full border-0 text-[13px] placeholder:text-slate-400 focus-visible:ring-0 shadow-none px-3"
                />
              </InputGroup.Root>
              {#if isBirthDateInvalid}
                <small class="text-xs text-red-500 mt-1 block"
                  >Fecha no válida (DD/MM/AAAA)</small
                >
              {:else if errors.birthDate && submitted}
                <small class="text-xs text-red-500 mt-1 block"
                  >{errors.birthDate}</small
                >
              {/if}
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                for="firstName"
                class="text-[12px] font-medium text-slate-700 block mb-1"
                >Primer Nombre *</label
              >
              <InputGroup.Root
                class="border-slate-300 rounded-[3px] overflow-hidden bg-white {errors.firstName &&
                submitted
                  ? 'border-red-500'
                  : ''}"
              >
                <InputGroup.Addon
                  class="border-r border-slate-300 bg-slate-50 w-9 p-0 flex items-center justify-center h-full m-0 shrink-0"
                >
                  <IconUser class="size-4 text-slate-400" />
                </InputGroup.Addon>
                <InputGroup.Input
                  id="firstName"
                  autocomplete="off"
                  bind:value={firstName}
                  placeholder="Primer nombre"
                  class="h-full border-0 text-[13px] placeholder:text-slate-400 focus-visible:ring-0 shadow-none px-3"
                />
              </InputGroup.Root>
              {#if errors.firstName && submitted}<small
                  class="text-xs text-red-500 mt-1 block"
                  >{errors.firstName}</small
                >{/if}
            </div>

            <div>
              <label
                for="secondName"
                class="text-[12px] font-medium text-slate-700 block mb-1"
                >Segundo Nombre</label
              >
              <InputGroup.Root
                class="border-slate-300 rounded-[3px] overflow-hidden bg-white"
              >
                <InputGroup.Addon
                  class="border-r border-slate-300 bg-slate-50 w-9 p-0 flex items-center justify-center h-full m-0 shrink-0"
                >
                  <IconUser class="size-4 text-slate-400" />
                </InputGroup.Addon>
                <InputGroup.Input
                  id="secondName"
                  autocomplete="off"
                  bind:value={secondName}
                  placeholder="Segundo nombre (opcional)"
                  class="h-full border-0 text-[13px] placeholder:text-slate-400 focus-visible:ring-0 shadow-none px-3"
                />
              </InputGroup.Root>
            </div>

            <div>
              <label
                for="firstLastName"
                class="text-[12px] font-medium text-slate-700 block mb-1"
                >Primer Apellido *</label
              >
              <InputGroup.Root
                class="border-slate-300 rounded-[3px] overflow-hidden bg-white {errors.firstLastName &&
                submitted
                  ? 'border-red-500'
                  : ''}"
              >
                <InputGroup.Addon
                  class="border-r border-slate-300 bg-slate-50 w-9 p-0 flex items-center justify-center h-full m-0 shrink-0"
                >
                  <IconUser class="size-4 text-slate-400" />
                </InputGroup.Addon>
                <InputGroup.Input
                  id="firstLastName"
                  autocomplete="off"
                  bind:value={firstLastName}
                  placeholder="Primer apellido"
                  class="h-full border-0 text-[13px] placeholder:text-slate-400 focus-visible:ring-0 shadow-none px-3"
                />
              </InputGroup.Root>
              {#if errors.firstLastName && submitted}<small
                  class="text-xs text-red-500 mt-1 block"
                  >{errors.firstLastName}</small
                >{/if}
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                for="secondLastName"
                class="text-[12px] font-medium text-slate-700 block mb-1"
                >Segundo Apellido</label
              >
              <InputGroup.Root
                class="border-slate-300 rounded-[3px] overflow-hidden bg-white"
              >
                <InputGroup.Addon
                  class="border-r border-slate-300 bg-slate-50 w-9 p-0 flex items-center justify-center h-full m-0 shrink-0"
                >
                  <IconUser class="size-4 text-slate-400" />
                </InputGroup.Addon>
                <InputGroup.Input
                  id="secondLastName"
                  autocomplete="off"
                  bind:value={secondLastName}
                  placeholder="Segundo apellido (opcional)"
                  class="h-full border-0 text-[13px] placeholder:text-slate-400 focus-visible:ring-0 shadow-none px-3"
                />
              </InputGroup.Root>
            </div>

            <div>
              <label
                for="genderSelect"
                class="text-[12px] font-medium text-slate-700 block mb-1"
                >Sexo *</label
              >
              <InputGroup.Root
                class="border-slate-300 rounded-[3px] overflow-hidden bg-white"
              >
                <InputGroup.Addon
                  class="border-r border-slate-300 bg-slate-50 w-9 p-0 flex items-center justify-center h-full m-0 shrink-0"
                >
                  <IconUsers class="size-4 text-slate-400" />
                </InputGroup.Addon>
                <Select.Root type="single" bind:value={gender}>
                  <Select.Trigger
                    id="genderSelect"
                    class="w-full h-full border-0 px-3 text-[13px] font-normal shadow-none focus:ring-0"
                  >
                    {gender === "M" ? "Masculino" : "Femenino"}
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="M" label="Masculino"
                      >Masculino</Select.Item
                    >
                    <Select.Item value="F" label="Femenino"
                      >Femenino</Select.Item
                    >
                  </Select.Content>
                </Select.Root>
              </InputGroup.Root>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div
          class="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4 text-slate-800"
        >
          <IconContact class="size-4 text-primary" />
          <h2 class="text-[14px] font-bold tracking-tight">
            2. Información de Contacto
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              for="mobile"
              class="text-[12px] font-medium text-slate-700 block mb-1"
              >Celular *</label
            >
            <InputGroup.Root
              class="border-slate-300 rounded-[3px] overflow-hidden bg-white {errors.mobile &&
              submitted
                ? 'border-red-500'
                : ''}"
            >
              <InputGroup.Addon
                class="border-r border-slate-300 bg-slate-50 w-9 p-0 flex items-center justify-center h-full m-0 shrink-0"
              >
                <IconSmartphone class="size-4 text-slate-400" />
              </InputGroup.Addon>
              <InputGroup.Input
                id="mobile"
                autocomplete="off"
                bind:value={mobile}
                placeholder="Número de celular"
                class="h-full border-0 text-[13px] placeholder:text-slate-400 focus-visible:ring-0 shadow-none px-3"
              />
            </InputGroup.Root>
            {#if errors.mobile && submitted}<small
                class="text-xs text-red-500 mt-1 block">{errors.mobile}</small
              >{/if}
          </div>

          <div>
            <label
              for="phone"
              class="text-[12px] font-medium text-slate-700 block mb-1"
              >Teléfono fijo</label
            >
            <InputGroup.Root
              class="border-slate-300 rounded-[3px] overflow-hidden bg-white"
            >
              <InputGroup.Addon
                class="border-r border-slate-300 bg-slate-50 w-9 p-0 flex items-center justify-center h-full m-0 shrink-0"
              >
                <IconPhone class="size-4 text-slate-400" />
              </InputGroup.Addon>
              <InputGroup.Input
                id="phone"
                autocomplete="off"
                bind:value={phone}
                placeholder="Teléfono fijo (opcional)"
                class="h-full border-0 text-[13px] placeholder:text-slate-400 focus-visible:ring-0 shadow-none px-3"
              />
            </InputGroup.Root>
          </div>

          <div>
            <label
              for="email"
              class="text-[12px] font-medium text-slate-700 block mb-1"
              >Correo Electrónico *</label
            >
            <InputGroup.Root
              class="border-slate-300 rounded-[3px] overflow-hidden bg-white {isEmailInvalid ||
              (errors.email && submitted)
                ? 'border-red-500 ring-1 ring-red-500/20'
                : ''}"
            >
              <InputGroup.Addon
                class="border-r border-slate-300 bg-slate-50 w-9 p-0 flex items-center justify-center h-full m-0 shrink-0"
              >
                <IconMail class="size-4 text-slate-400" />
              </InputGroup.Addon>
              <InputGroup.Input
                id="email"
                type="email"
                autocomplete="off"
                bind:value={email}
                placeholder="correo@ejemplo.com"
                class="h-full border-0 text-[13px] placeholder:text-slate-400 focus-visible:ring-0 shadow-none px-3"
              />
            </InputGroup.Root>
            {#if isEmailInvalid}
              <small class="text-xs text-red-500 mt-1 block"
                >Formato de correo no válido</small
              >
            {:else if errors.email && submitted}
              <small class="text-xs text-red-500 mt-1 block"
                >{errors.email}</small
              >
            {/if}
          </div>

          <div>
            <label
              for="address"
              class="text-[12px] font-medium text-slate-700 block mb-1"
              >Dirección de residencia</label
            >
            <InputGroup.Root
              class="border-slate-300 rounded-[3px] overflow-hidden bg-white"
            >
              <InputGroup.Addon
                class="border-r border-slate-300 bg-slate-50 w-9 p-0 flex items-center justify-center h-full m-0 shrink-0"
              >
                <IconMapPin class="size-4 text-slate-400" />
              </InputGroup.Addon>
              <InputGroup.Input
                id="address"
                autocomplete="off"
                bind:value={address}
                placeholder="Dirección completa"
                class="h-full border-0 text-[13px] placeholder:text-slate-400 focus-visible:ring-0 shadow-none px-3"
              />
            </InputGroup.Root>
          </div>
        </div>
      </div>

      <div>
        <div
          class="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4 text-slate-800"
        >
          <IconShieldCheck class="size-4 text-primary" />
          <h2 class="text-[14px] font-bold tracking-tight">
            3. Seguridad de la Cuenta
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              for="password"
              class="text-[12px] font-medium text-slate-700 block mb-1"
              >Asignar Contraseña *</label
            >
            <InputGroup.Root
              class="border-slate-300 rounded-[3px] overflow-hidden bg-white {isPasswordTooShort ||
              (errors.password && submitted)
                ? 'border-red-500 ring-1 ring-red-500/20'
                : ''}"
            >
              <InputGroup.Addon
                class="border-r border-slate-300 bg-slate-50 w-9 p-0 flex items-center justify-center h-full m-0 shrink-0"
              >
                <IconKeyRound class="size-4 text-slate-400" />
              </InputGroup.Addon>
              <InputGroup.Input
                id="password"
                type="password"
                autocomplete="new-password"
                bind:value={password}
                placeholder="Mínimo 6 caracteres"
                class="h-full border-0 text-[13px] placeholder:text-slate-400 focus-visible:ring-0 shadow-none px-3"
              />
            </InputGroup.Root>
            {#if isPasswordTooShort}
              <small class="text-xs text-red-500 mt-1 block"
                >Mínimo 6 caracteres</small
              >
            {:else if errors.password && submitted}
              <small class="text-xs text-red-500 mt-1 block"
                >{errors.password}</small
              >
            {/if}
          </div>

          <div>
            <label
              for="confirmPassword"
              class="text-[12px] font-medium text-slate-700 block mb-1"
              >Repetir Contraseña *</label
            >
            <InputGroup.Root
              class="border-slate-300 rounded-[3px] overflow-hidden bg-white {passwordsMismatch ||
              (errors.confirmPassword && submitted)
                ? 'border-red-500 ring-1 ring-red-500/20'
                : ''}"
            >
              <InputGroup.Addon
                class="border-r border-slate-300 bg-slate-50 w-9 p-0 flex items-center justify-center h-full m-0 shrink-0"
              >
                <IconKeyRound class="size-4 text-slate-400" />
              </InputGroup.Addon>
              <InputGroup.Input
                id="confirmPassword"
                type="password"
                autocomplete="new-password"
                bind:value={confirmPassword}
                placeholder="Repite la contraseña"
                class="h-full border-0 text-[13px] placeholder:text-slate-400 focus-visible:ring-0 shadow-none px-3"
              />
            </InputGroup.Root>
            {#if passwordsMismatch}
              <small class="text-xs text-red-500 mt-1 block"
                >Las contraseñas no coinciden</small
              >
            {:else if errors.confirmPassword && submitted}
              <small class="text-xs text-red-500 mt-1 block"
                >{errors.confirmPassword}</small
              >
            {/if}
          </div>
        </div>
      </div>

      <div {@attach turnstileAttachment}></div>

      <div class="pt-2 flex flex-col sm:flex-row justify-center gap-4 w-full">
        <Button
          type="submit"
          disabled={isLoading}
          class="h-10 w-full sm:w-auto sm:min-w-52.5 px-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-[3px] text-[14px] font-medium shadow-none"
        >
          <IconUserPlus class="mr-2 size-4.5" />
          {isLoading ? "Procesando registro..." : "Registrarse"}
        </Button>
        <Button
          type="button"
          href="/login?c={data.clientId || 67}"
          variant="secondary"
          class="h-10 w-full sm:w-auto sm:min-w-45 px-8 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[3px] text-[14px] font-medium shadow-none"
        >
          <IconArrowLeft class="mr-2 size-4.5" />
          Regresar
        </Button>
      </div>
    </form>
  </Card.Content>
</Card.Root>
