// Horarios del negocio: por día de la semana (0 = domingo, como Date#getDay),
// hasta 2 turnos por día. Un turno cuyo cierre es <= la apertura pasa la
// medianoche (ej. 20:00 a 02:00, o 20:00 a 00:00 = hasta el final del día).

export type Shift = [string, string]; // ["HH:MM", "HH:MM"]
export type WeeklyHours = Record<string, Shift[]>; // claves "0".."6"

export const MAX_SHIFTS = 2;
export const DEFAULT_TIMEZONE = "America/Argentina/Buenos_Aires";

// Orden en que se muestran: la semana arranca el lunes.
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
export const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// Valida lo que manda el formulario. Devuelve null si está vacío (sin horarios),
// o un string con el error.
export function parseHours(value: unknown): { hours: WeeklyHours | null } | { error: string } {
  if (value === null || value === undefined) return { hours: null };
  if (typeof value !== "object" || Array.isArray(value)) return { error: "Horarios inválidos." };

  const hours: WeeklyHours = {};
  let any = false;
  for (let day = 0; day < 7; day++) {
    const shifts = (value as Record<string, unknown>)[String(day)] ?? [];
    if (!Array.isArray(shifts) || shifts.length > MAX_SHIFTS) return { error: "Horarios inválidos." };
    hours[day] = [];
    for (const shift of shifts) {
      if (
        !Array.isArray(shift) ||
        shift.length !== 2 ||
        !shift.every((t) => typeof t === "string" && TIME.test(t))
      ) {
        return { error: `Revisá los horarios del ${DAY_NAMES[day].toLowerCase()}.` };
      }
      if (shift[0] === shift[1]) {
        return { error: `El ${DAY_NAMES[day].toLowerCase()} tiene un turno que abre y cierra a la misma hora.` };
      }
      hours[day].push([shift[0], shift[1]]);
      any = true;
    }
  }
  return { hours: any ? hours : null };
}

export function isValidTimezone(tz: unknown): tz is string {
  if (typeof tz !== "string" || !tz || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// "20:00" → "20", "20:30" → "20:30", "00:00" como cierre → "24".
function formatTime(time: string, isClose = false): string {
  if (isClose && time === "00:00") return "24";
  return time.endsWith(":00") ? String(Number(time.slice(0, 2))) : time.replace(/^0/, "");
}

export function formatShifts(shifts: Shift[] | undefined): string {
  if (!shifts?.length) return "Cerrado";
  return (
    shifts.map(([open, close]) => `${formatTime(open)} a ${formatTime(close, true)}`).join(" y ") +
    " hs"
  );
}

// Día de la semana y minuto del día en la zona horaria del negocio.
function nowIn(timezone: string, now: Date): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

function interval([open, close]: Shift): [number, number] {
  const start = toMinutes(open);
  let end = toMinutes(close);
  if (end <= start) end += 24 * 60;
  return [start, end];
}

export type OpenStatus =
  | { open: true; label: string }
  | { open: false; label: string };

export function openStatus(hours: WeeklyHours, timezone: string, now = new Date()): OpenStatus {
  const { day, minutes } = nowIn(timezone, now);
  const shiftsOf = (d: number) => hours[String((d + 7) % 7)] ?? [];

  // Turnos de hoy, y los de ayer que pasan la medianoche.
  for (const shift of shiftsOf(day)) {
    const [start, end] = interval(shift);
    if (minutes >= start && minutes < end) {
      return { open: true, label: `Abierto · cierra ${formatTime(shift[1], true)} hs` };
    }
  }
  for (const shift of shiftsOf(day - 1)) {
    const [, end] = interval(shift);
    if (end > 24 * 60 && minutes < end - 24 * 60) {
      return { open: true, label: `Abierto · cierra ${formatTime(shift[1], true)} hs` };
    }
  }

  // Próxima apertura (hasta el mismo día de la semana que viene, por si solo abre hoy
  // y ya cerró).
  for (let offset = 0; offset <= 7; offset++) {
    const candidates = shiftsOf(day + offset)
      .map((s) => s[0])
      .filter((open) => offset > 0 || toMinutes(open) > minutes)
      .sort();
    if (candidates.length) {
      const when =
        offset === 0
          ? "hoy"
          : offset === 1
            ? "mañana"
            : `el ${DAY_NAMES[(day + offset) % 7].toLowerCase()}`;
      return { open: false, label: `Cerrado · abre ${when} ${formatTime(candidates[0])} hs` };
    }
  }
  return { open: false, label: "Cerrado" };
}
