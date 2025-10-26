"use client"

import type React from "react"

/**
 * Onboarding form page - Second page with form validation
 */

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormInput } from "@/components/form-input"
import { useOnboardingForm } from "@/hooks/use-onboarding-form"
import { Loader2 } from "lucide-react"

export default function OnboardingPage() {
  const router = useRouter()
  const { formData, errors, touched, isValidating, isSubmitting, handleChange, handleBlur, handleSubmit } =
    useOnboardingForm()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await handleSubmit()
    if (success) {
      router.push("/welcome")
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Profile Details</CardTitle>
          <CardDescription>Please fill in your information to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6" noValidate>
            <FormInput
              id="firstName"
              label="First Name"
              value={formData.firstName}
              error={errors.firstName?.message}
              touched={touched.firstName}
              maxLength={50}
              placeholder="Enter your first name"
              onChange={(value) => handleChange("firstName", value)}
              onBlur={() => handleBlur("firstName")}
              disabled={isSubmitting}
              data-testid="first-name-input"
            />

            <FormInput
              id="lastName"
              label="Last Name"
              value={formData.lastName}
              error={errors.lastName?.message}
              touched={touched.lastName}
              maxLength={50}
              placeholder="Enter your last name"
              onChange={(value) => handleChange("lastName", value)}
              onBlur={() => handleBlur("lastName")}
              disabled={isSubmitting}
              data-testid="last-name-input"
            />

            <FormInput
              id="phone"
              label="Phone Number"
              type="tel"
              value={formData.phone}
              error={errors.phone?.message}
              touched={touched.phone}
              placeholder="13062776103"
              onChange={(value) => handleChange("phone", value)}
              onBlur={() => handleBlur("phone")}
              disabled={isSubmitting}
              data-testid="phone-input"
            />

            <FormInput
              id="corporationNumber"
              label="Corporation Number"
              value={formData.corporationNumber}
              error={errors.corporationNumber?.message}
              touched={touched.corporationNumber}
              maxLength={9}
              placeholder="123456789"
              onChange={(value) => handleChange("corporationNumber", value)}
              onBlur={() => handleBlur("corporationNumber")}
              disabled={isSubmitting || isValidating}
              data-testid="corporation-number-input"
            />

            {errors.submit && (
              <div className="rounded-md bg-destructive/10 p-3" role="alert">
                <p className="text-sm text-destructive">{errors.submit.message}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || isValidating}
              data-testid="submit-button"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
