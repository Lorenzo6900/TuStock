import { revalidatePath } from "next/cache";
import { getUserSlug } from "@/lib/db";

// El menú público (/menu/<slug>) se guarda en caché; hay que invalidarlo cada vez
// que cambia algo que se muestra ahí para que el cliente vea el dato nuevo al toque.
export function revalidateMenu(...slugs: (string | null | undefined)[]) {
  for (const slug of slugs) {
    if (slug) revalidatePath(`/menu/${slug}`);
  }
}

export async function revalidateMenuForUser(userId: string) {
  revalidateMenu(await getUserSlug(userId));
}
