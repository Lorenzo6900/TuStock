"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { formatPrice } from "@/lib/format";
import { buildOrderMessage, whatsappLink } from "@/lib/whatsapp";

export type CartProduct = { id: string; name: string; price: number | null };
type CartLine = CartProduct & { quantity: number };

type CartContextValue = {
  lines: CartLine[];
  quantityOf: (id: string) => number;
  setQuantity: (product: CartProduct, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const MAX_QUANTITY = 99;

// El carrito vive en sessionStorage: sobrevive a recargar o ir a WhatsApp y volver,
// pero no queda colgado para la próxima vez que el cliente escanee el QR. Si el
// storage está bloqueado (navegación privada), queda solo en memoria.
const EMPTY: CartLine[] = [];
const memory = new Map<string, string>();
const listeners = new Set<() => void>();
let snapshot: { key: string; raw: string; lines: CartLine[] } | null = null;

function storageKey(slug: string) {
  return `qrstock-cart:${slug}`;
}

function readRaw(key: string): string {
  try {
    const saved = sessionStorage.getItem(key);
    if (saved !== null) return saved;
  } catch {}
  return memory.get(key) ?? "[]";
}

function readLines(key: string): CartLine[] {
  const raw = readRaw(key);
  if (snapshot?.key === key && snapshot.raw === raw) return snapshot.lines;
  let lines: CartLine[] = EMPTY;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) lines = parsed;
  } catch {}
  snapshot = { key, raw, lines };
  return lines;
}

function writeLines(key: string, lines: CartLine[]) {
  const raw = JSON.stringify(lines);
  memory.set(key, raw);
  try {
    sessionStorage.setItem(key, raw);
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function CartProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const key = storageKey(slug);
  const lines = useSyncExternalStore(
    subscribe,
    () => readLines(key),
    () => EMPTY
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      quantityOf: (id) => lines.find((l) => l.id === id)?.quantity ?? 0,
      setQuantity: (product, quantity) => {
        const prev = readLines(key);
        const q = Math.max(0, Math.min(MAX_QUANTITY, quantity));
        const exists = prev.some((l) => l.id === product.id);
        const next =
          q === 0
            ? prev.filter((l) => l.id !== product.id)
            : exists
              ? prev.map((l) => (l.id === product.id ? { ...l, quantity: q } : l))
              : [...prev, { ...product, quantity: q }];
        writeLines(key, next);
      },
      clear: () => writeLines(key, EMPTY),
    }),
    [lines, key]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart fuera de CartProvider");
  return ctx;
}

function Stepper({
  quantity,
  onChange,
  name,
  color,
}: {
  quantity: number;
  onChange: (q: number) => void;
  name: string;
  color: string;
}) {
  const btn =
    "h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-lg font-bold leading-none transition-transform active:scale-90 disabled:opacity-40";
  return (
    <div className="flex items-center gap-1 rounded-full bg-white ring-1 ring-black/10 p-0.5">
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        aria-label={`Quitar uno de ${name}`}
        className={btn}
        style={{ color }}
      >
        −
      </button>
      <span className="min-w-6 text-center text-sm font-bold tabular-nums text-ink" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        disabled={quantity >= MAX_QUANTITY}
        aria-label={`Sumar uno de ${name}`}
        className={btn}
        style={{ color }}
      >
        +
      </button>
    </div>
  );
}

export function AddToCartButton({ product, color }: { product: CartProduct; color: string }) {
  const { quantityOf, setQuantity } = useCart();
  const quantity = quantityOf(product.id);

  if (quantity === 0) {
    return (
      <button
        type="button"
        onClick={() => setQuantity(product, 1)}
        className="mt-3 h-9 w-full rounded-full text-xs font-semibold text-white shadow-sm transition-transform active:scale-95"
        style={{ backgroundColor: color }}
      >
        + Agregar
      </button>
    );
  }
  return (
    <div className="mt-3 flex justify-center">
      <Stepper
        quantity={quantity}
        onChange={(q) => setQuantity(product, q)}
        name={product.name}
        color={color}
      />
    </div>
  );
}

export function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2Zm5.8 14.03c-.25.69-1.44 1.32-2 1.37-.51.05-1 .24-3.37-.7-2.84-1.12-4.65-4.03-4.79-4.22-.14-.19-1.14-1.52-1.14-2.9 0-1.38.72-2.06.98-2.34.25-.28.55-.35.74-.35l.53.01c.17.01.4-.06.62.48.23.55.78 1.9.85 2.04.07.14.11.3.02.49-.09.19-.14.3-.28.46-.14.16-.29.36-.42.48-.14.14-.28.29-.12.57.16.28.72 1.19 1.55 1.93 1.07.95 1.97 1.25 2.25 1.39.28.14.44.12.6-.07.16-.19.69-.81.88-1.09.18-.28.37-.23.62-.14.25.09 1.6.76 1.88.9.28.14.46.21.53.32.07.12.07.67-.18 1.36Z" />
    </svg>
  );
}

export function CartBar({
  whatsapp,
  businessName,
  color = "var(--color-ink)",
}: {
  whatsapp: string;
  businessName: string;
  color?: string;
}) {
  const { lines, setQuantity, clear } = useCart();
  const [sheetOpen, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");

  const count = lines.reduce((sum, l) => sum + l.quantity, 0);
  const total = lines.reduce((sum, l) => sum + (l.price ?? 0) * l.quantity, 0);
  const somePriced = lines.some((l) => l.price !== null);
  const open = sheetOpen && count > 0;

  // Si se vacía el pedido desde la hoja, se cierra (y no se reabre sola al agregar).
  function changeQuantity(line: CartLine, q: number) {
    if (q <= 0 && count - line.quantity === 0) setOpen(false);
    setQuantity(line, q);
  }
  function clearAll() {
    setOpen(false);
    clear();
  }

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  if (count === 0) return null;

  const href = whatsappLink(
    whatsapp,
    buildOrderMessage(lines, (n) => formatPrice(n), customerName, note)
  );

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="pointer-events-auto mx-auto flex w-full max-w-md items-center gap-3 rounded-full px-5 py-3.5 text-white shadow-xl shadow-black/20 transition-transform active:scale-[0.98]"
          style={{ backgroundColor: color }}
        >
          <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white/15 px-2 text-sm font-bold tabular-nums">
            {count}
          </span>
          <span className="flex-1 text-left text-sm font-semibold">Ver pedido</span>
          {somePriced && (
            <span className="text-sm font-bold tabular-nums">{formatPrice(total)}</span>
          )}
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-[2px] sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[90dvh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 id="cart-title" className="font-serif text-2xl font-bold text-ink">
                Tu pedido
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="h-10 w-10 -mr-2 rounded-full text-2xl leading-none text-ink-soft hover:bg-paper-soft"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5">
              <ul className="divide-y divide-line">
                {lines.map((line) => (
                  <li key={line.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink leading-snug">{line.name}</p>
                      {line.price !== null && (
                        <p className="text-xs text-ink-soft tabular-nums">
                          {formatPrice(line.price * line.quantity)}
                        </p>
                      )}
                    </div>
                    <Stepper
                      quantity={line.quantity}
                      onChange={(q) => changeQuantity(line, q)}
                      name={line.name}
                      color="var(--color-ink)"
                    />
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-col gap-3 pb-4">
                <label className="text-sm font-medium text-ink">
                  Tu nombre <span className="font-normal text-ink-soft">(opcional)</span>
                  <input
                    type="text"
                    autoComplete="name"
                    maxLength={80}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  />
                </label>
                <label className="text-sm font-medium text-ink">
                  Nota <span className="font-normal text-ink-soft">(opcional)</span>
                  <textarea
                    rows={2}
                    maxLength={300}
                    placeholder="Ej: para retirar a las 20 hs"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="mt-1 w-full resize-none rounded-lg border border-line px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  />
                </label>
              </div>
            </div>

            <div className="border-t border-line px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              {somePriced && (
                <div className="mb-3 flex items-baseline justify-between">
                  <span className="text-sm text-ink-soft">Total</span>
                  <span className="text-xl font-bold tabular-nums text-ink">{formatPrice(total)}</span>
                </div>
              )}
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1fa855] py-3.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#178a45]"
              >
                <WhatsappIcon className="h-5 w-5" />
                Enviar pedido por WhatsApp
              </a>
              <p className="mt-2 text-center text-xs text-ink-soft">
                Se abre WhatsApp con el pedido listo para mandarle a {businessName}.
              </p>
              <button
                type="button"
                onClick={clearAll}
                className="mt-2 w-full py-2 text-xs font-medium text-ink-soft underline underline-offset-2 hover:text-ink"
              >
                Vaciar pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
