"use client";

import { useSyncExternalStore } from "react";
import {
  DAY_NAMES,
  WEEK_ORDER,
  formatShifts,
  openStatus,
  type WeeklyHours,
} from "@/lib/hours";

// El menú está cacheado, así que "abierto/cerrado" se calcula en el navegador del
// cliente (con la zona horaria del negocio) y se actualiza cada minuto.
function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 60_000);
  return () => clearInterval(id);
}

export default function OpenStatus({
  hours,
  timezone,
  accent,
}: {
  hours: WeeklyHours;
  timezone: string;
  accent: string;
}) {
  const status = useSyncExternalStore(
    subscribe,
    () => JSON.stringify(openStatus(hours, timezone)),
    () => null
  );
  const parsed = status ? (JSON.parse(status) as ReturnType<typeof openStatus>) : null;
  const today = useSyncExternalStore(
    subscribe,
    () =>
      new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" }).format(new Date()),
    () => null
  );
  const todayIndex = today ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(today) : -1;

  return (
    <details className="group">
      <summary className="mx-auto inline-flex cursor-pointer list-none items-center gap-2 rounded-full bg-white/80 backdrop-blur px-3.5 py-1.5 text-xs font-semibold text-ink shadow-sm ring-1 ring-black/5 [&::-webkit-details-marker]:hidden">
        <span
          className={`h-2 w-2 rounded-full ${
            parsed === null ? "bg-ink-soft/40" : parsed.open ? "bg-green-500" : "bg-ink-soft/60"
          }`}
          aria-hidden
        />
        {parsed?.label ?? "Horarios"}
        <svg
          viewBox="0 0 20 20"
          className="h-3.5 w-3.5 text-ink-soft transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M5.5 7.5 10 12l4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <ul className="mx-auto mt-3 w-full max-w-xs rounded-2xl bg-white p-3 text-left text-sm shadow-md shadow-black/[0.04] ring-1 ring-black/5">
        {WEEK_ORDER.map((day) => {
          const isToday = day === todayIndex;
          return (
            <li
              key={day}
              className={`flex justify-between gap-4 rounded-lg px-2.5 py-1.5 ${isToday ? "font-semibold" : ""}`}
              style={isToday ? { color: accent, backgroundColor: `${accent}12` } : undefined}
            >
              <span>{DAY_NAMES[day]}</span>
              <span className={`text-right tabular-nums ${isToday ? "" : "text-ink-soft"}`}>
                {formatShifts(hours[day])}
              </span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
