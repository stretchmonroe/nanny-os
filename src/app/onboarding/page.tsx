import { Suspense } from "react";
import { HouseholdFlow } from "@/components/onboarding/HouseholdFlow";

export default function OnboardingPage() {
  return (
    <Suspense>
      <HouseholdFlow />
    </Suspense>
  );
}
