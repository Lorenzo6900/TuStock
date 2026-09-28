import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserById } from "@/lib/db";
import AppHeader from "@/components/AppHeader";
import BackLink from "@/components/BackLink";
import AddProductForm from "./AddProductForm";

export const dynamic = "force-dynamic";

export default async function AddProduct() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getUserById(session.user.id);
  if (!user?.slug) redirect("/onboarding");

  return (
    <main className="min-h-screen bg-paper">
      <AppHeader slug={user.slug} />
      <div className="mx-auto max-w-md p-4 sm:py-8">
        <BackLink href="/dashboard">Volver al catálogo</BackLink>
        <h1 className="mt-3 mb-6 font-serif text-3xl font-semibold tracking-tight text-ink">
          Agregar producto
        </h1>
        <AddProductForm categories={user.categories ?? []} />
      </div>
    </main>
  );
}
