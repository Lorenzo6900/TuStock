import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserById } from "@/lib/db";
import { appUrl } from "@/lib/appUrl";
import AppHeader from "@/components/AppHeader";
import BackLink from "@/components/BackLink";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function Settings() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getUserById(session.user.id);
  if (!user?.slug) redirect("/onboarding");

  return (
    <main className="min-h-screen bg-paper">
      <AppHeader slug={user.slug} current="settings" />
      <div className="mx-auto max-w-md p-4 sm:py-8">
        <BackLink href="/dashboard">Volver al catálogo</BackLink>
        <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-ink">
          Ajustes del negocio
        </h1>
        <p className="mt-1 mb-6 text-sm text-ink-soft">
          Así aparece tu negocio en el menú que ven tus clientes.
        </p>
        <SettingsForm
          businessName={user.business_name ?? ""}
          slug={user.slug}
          origin={appUrl()}
        />
      </div>
    </main>
  );
}
