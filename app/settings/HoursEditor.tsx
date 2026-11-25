"use client";

import { DAY_NAMES, MAX_SHIFTS, WEEK_ORDER, type Shift, type WeeklyHours } from "@/lib/hours";

export const DEFAULT_HOURS: WeeklyHours = {
  "0": [],
  "1": [["09:00", "18:00"]],
  "2": [["09:00", "18:00"]],
  "3": [["09:00", "18:00"]],
  "4": [["09:00", "18:00"]],
  "5": [["09:00", "18:00"]],
  "6": [["09:00", "13:00"]],
};

const timeClass =
  "w-[6.5rem] rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink tabular-nums focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent";

export default function HoursEditor({
  hours,
  onChange,
}: {
  hours: WeeklyHours;
  onChange: (hours: WeeklyHours) => void;
}) {
  function setDay(day: number, shifts: Shift[]) {
    onChange({ ...hours, [day]: shifts });
  }

  function copyToAll(day: number) {
    const shifts = hours[day] ?? [];
    const next: WeeklyHours = {};
    for (let d = 0; d < 7; d++) next[d] = shifts.map((s) => [...s] as Shift);
    onChange(next);
  }

  return (
    <div className="flex flex-col divide-y divide-line">
      {WEEK_ORDER.map((day) => {
        const shifts = hours[day] ?? [];
        const open = shifts.length > 0;
        return (
          <div key={day} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2.5 text-sm font-medium text-ink">
                <input
                  type="checkbox"
                  checked={open}
                  onChange={(e) => setDay(day, e.target.checked ? [["09:00", "18:00"]] : [])}
                  className="h-4 w-4 accent-[var(--color-ink)]"
                />
                {DAY_NAMES[day]}
              </label>
              {!open && <span className="text-xs text-ink-soft">Cerrado</span>}
              {open && day === 1 && (
                <button
                  type="button"
                  onClick={() => copyToAll(day)}
                  className="text-xs font-medium text-accent underline underline-offset-2"
                >
                  Copiar a todos los días
                </button>
              )}
            </div>

            {open && (
              <div className="mt-2 flex flex-col gap-2 pl-6.5">
                {shifts.map(([from, to], i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <input
                      type="time"
                      aria-label={`${DAY_NAMES[day]}, turno ${i + 1}, abre`}
                      value={from}
                      onChange={(e) =>
                        setDay(day, shifts.map((s, j) => (j === i ? [e.target.value, s[1]] : s)))
                      }
                      className={timeClass}
                    />
                    <span className="text-xs text-ink-soft">a</span>
                    <input
                      type="time"
                      aria-label={`${DAY_NAMES[day]}, turno ${i + 1}, cierra`}
                      value={to}
                      onChange={(e) =>
                        setDay(day, shifts.map((s, j) => (j === i ? [s[0], e.target.value] : s)))
                      }
                      className={timeClass}
                    />
                    {shifts.length > 1 && (
                      <button
                        type="button"
                        aria-label={`Quitar turno ${i + 1} del ${DAY_NAMES[day].toLowerCase()}`}
                        onClick={() => setDay(day, shifts.filter((_, j) => j !== i))}
                        className="h-8 w-8 rounded-full text-lg leading-none text-ink-soft hover:bg-paper-soft hover:text-ink"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {shifts.length < MAX_SHIFTS && (
                  <button
                    type="button"
                    onClick={() => setDay(day, [...shifts, ["20:00", "00:00"]])}
                    className="self-start text-xs font-medium text-ink-soft underline underline-offset-2 hover:text-ink"
                  >
                    + Agregar otro turno
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
      <p className="pt-3 text-xs text-ink-soft">
        Si cerrás después de medianoche, poné la hora igual (ej. 20:00 a 02:00).
      </p>
    </div>
  );
}
