import type { WeeklyHours } from "@/lib/hours";
import { DEFAULT_TIMEZONE } from "@/lib/hours";
import OpenStatus from "./OpenStatus";
import { WhatsappIcon } from "./Cart";

function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className={className}>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 1 1 14 0C19 14.8 12 21 12 21Z" strokeLinejoin="round" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

const chip =
  "inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/80 backdrop-blur px-3.5 py-1.5 text-xs font-semibold text-ink shadow-sm ring-1 ring-black/5 transition-transform hover:-translate-y-0.5";

export default function BusinessInfo({
  address,
  instagram,
  whatsapp,
  hours,
  timezone,
  accent,
}: {
  address: string | null;
  instagram: string | null;
  whatsapp: string | null;
  hours: WeeklyHours | null;
  timezone: string | null;
  accent: string;
}) {
  if (!address && !instagram && !whatsapp && !hours) return null;

  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      {hours && <OpenStatus hours={hours} timezone={timezone ?? DEFAULT_TIMEZONE} accent={accent} />}
      {(address || instagram || whatsapp) && (
        <div className="flex flex-wrap justify-center gap-2">
          {address && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={chip}
            >
              <PinIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{address}</span>
            </a>
          )}
          {instagram && (
            <a
              href={`https://instagram.com/${instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className={chip}
            >
              <InstagramIcon className="h-3.5 w-3.5 shrink-0" />@{instagram}
            </a>
          )}
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className={chip}
            >
              <WhatsappIcon className="h-3.5 w-3.5 shrink-0 text-[#1fa855]" />
              WhatsApp
            </a>
          )}
        </div>
      )}
    </div>
  );
}
