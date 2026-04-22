import { redirect } from "next/navigation";
import { checkOnboardingStatus } from "@/lib/actions/onboarding.actions";
import { getTenantProfile } from "@/lib/actions/tenant.actions";
import OnboardingWizardClient from "@/components/dashboard/onboarding/OnboardingWizardClient";

export const metadata = {
  title: "Kurulum Sihirbazı | OtoServis",
  description: "Firmanızı birkaç adımda hazırlayın.",
};

export default async function OnboardingPage() {
  const status = await checkOnboardingStatus();

  // Eğer onboarding zaten tamamlanmışsa dashboard'a yönlendir
  if (status.completed) {
    redirect("/dashboard");
  }

  const profileRes = await getTenantProfile();
  const tenant = profileRes.tenant;

  return (
    <OnboardingWizardClient
      initialStep={status.currentStep || 0}
      tenantName={tenant?.name || ""}
      tenantEmail={tenant?.email || ""}
      tenantPhone={tenant?.phone || ""}
    />
  );
}
