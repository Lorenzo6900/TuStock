import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserById } from "@/lib/db";
import { appUrl } from "@/lib/appUrl";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function Settings() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getUserById(session.user.id);
  if (!user?.slug) redirect("/onboarding");

  return (
    <main className="min-h-screen bg-paper p-4 sm:p-8">
      <div className="mx-auto max-w-md">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink mb-5 transition-colors"
        >
          ← Volver al catálogo
        </Link>
        <h1 className="font-serif text-2xl font-semibold text-ink mb-6">Ajustes del negocio</h1>
        <SettingsForm
          businessName={user.business_name ?? ""}
          slug={user.slug}
          origin={appUrl()}
        />
      </div>
    </main>
  );
}
