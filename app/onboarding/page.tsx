import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserById } from "@/lib/db";
import Logo from "@/components/Logo";
import OnboardingForm from "./OnboardingForm";

export default async function Onboarding() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getUserById(session.user.id);
  if (user?.slug) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-paper flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-sm">
        <div className="text-center mb-7">
          <h1 className="font-serif text-2xl font-semibold text-ink">
            Un último paso
          </h1>
          <p className="text-sm text-ink-soft mt-1">
            ¿Cómo se llama tu negocio?
          </p>
        </div>
        <div className="bg-white border border-line rounded-2xl p-6 shadow-sm shadow-black/[0.02]">
          <OnboardingForm />
        </div>
      </div>
    </main>
  );
}
