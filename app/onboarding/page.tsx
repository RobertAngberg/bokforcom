import { Suspense } from "react";
import OnboardingWizard from "./components/OnboardingWizard";
import LoadingSpinner from "../_components/LoadingSpinner";
import MainLayout from "../_components/MainLayout";

export default function OnboardingPage() {
  return (
    <MainLayout>
      <Suspense fallback={<LoadingSpinner />}>
        <OnboardingWizard />
      </Suspense>
    </MainLayout>
  );
}
