import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any }
  ? Omit<T, "children">
  : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {
  ref?: U | null;
};

export function formatDate(val: string | Date | undefined): string {
  if (!val) return "";
  if (typeof val === "string") {
    const datePart = val.split("T")[0];
    if (datePart.includes("-")) {
      const [y, m, d] = datePart.split("-").map(Number);
      if (y && m && d) return `${d}/${m}/${y}`;
    }
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`;
}

export function formatTime(val: string | Date | undefined): string {
  if (!val) return "";
  if (typeof val === "string" && !val.includes("T") && val.includes(":")) {
    const [h, m] = val.split(":").map(Number);
    const period = h >= 12 ? "p. m." : "a. m.";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  const hours = d.getUTCHours();
  const minutes = d.getUTCMinutes();
  const period = hours >= 12 ? "p. m." : "a. m.";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
}

export function getStatusClass(status: string) {
  switch (status) {
    case "ATENDIDA":
      return "text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-xs";
    case "ASIGNADA":
      return "text-[#0e7490] font-semibold bg-cyan-50 px-2 py-0.5 rounded text-xs";
    case "CANCELADA":
      return "text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded text-xs";
    default:
      return "text-slate-600";
  }
}
