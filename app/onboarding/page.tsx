"use client"

/**
 * Onboarding form page - Second page with form validation
 * 
 * Now using the new state machine-based form architecture
 */

import { useRouter } from "next/navigation";
import { useOnboardingForm } from "@/modules/forms/useOnboardingForm";
import { corpFetcher } from "@/modules/io/corpFetcher";
import { postProfileDetails } from "@/modules/io/postProfileDetails";
import { FormView } from "./FormView";

export default function OnboardingPage() {
  const router = useRouter();
  
  // Initialize the new state machine-based form
  const form = useOnboardingForm({
    corpFetcher,
    postProfileDetails,
    idleMs: 500,
    cacheTtlMs: 5 * 60 * 1000, // 5 minutes cache
  });
  
  const handleSubmitSuccess = () => {
    router.push("/welcome");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <FormView 
        form={form} 
        onSubmitSuccess={handleSubmitSuccess}
      />
    </main>
  );
}
