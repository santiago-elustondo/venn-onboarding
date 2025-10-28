/**
 * Form view component using the new state machine-based form hook
 * 
 * Pure presentational component that consumes the hook contract
 * and renders the form with proper accessibility features.
 */

import type React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormInput } from "@/components/form-input";
import { PhoneFieldView } from "./PhoneFieldView";
import { Loader2, AlertCircle } from "lucide-react";
import type { UseOnboardingFormReturn } from "@/modules/forms/useOnboardingForm";

interface FormViewProps {
  form: UseOnboardingFormReturn;
  onSubmitSuccess: () => void;
}

export function FormView({ form, onSubmitSuccess }: FormViewProps) {
  const fieldErrors = form.getFieldErrors();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await form.submit();
    if (success) {
      onSubmitSuccess();
    }
  };
  
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Profile Details</CardTitle>
        <CardDescription>Please fill in your information to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          
          <FormInput
            id="firstName"
            label="First Name"
            value={form.firstName.value}
            error={fieldErrors.firstName || undefined}
            touched={form.firstName.isTouched}
            isValid={form.firstName.isValid}
            maxLength={50}
            placeholder="Enter your first name"
            onChange={form.firstName.onChange}
            onBlur={form.firstName.onBlur}
            onFocus={form.firstName.onFocus}
            disabled={form.isSubmitting}
            data-testid="first-name-input"
          />

          <FormInput
            id="lastName"
            label="Last Name"
            value={form.lastName.value}
            error={fieldErrors.lastName || undefined}
            touched={form.lastName.isTouched}
            isValid={form.lastName.isValid}
            maxLength={50}
            placeholder="Enter your last name"
            onChange={form.lastName.onChange}
            onBlur={form.lastName.onBlur}
            onFocus={form.lastName.onFocus}
            disabled={form.isSubmitting}
            data-testid="last-name-input"
          />

          <PhoneFieldView
            phone={form.phone}
          />

          <div className="space-y-2">
            <FormInput
              id="corporationNumber"
              label="Corporation Number"
              value={form.corporationNumber.value}
              error={fieldErrors.corporationNumber || undefined}
              touched={form.corporationNumber.isTouched}
              isValid={form.corporationNumber.isValid}
              isLoading={form.corporationNumber.isLoading}
              maxLength={9}
              placeholder="123456789"
              onChange={form.corporationNumber.onChange}
              onBlur={form.corporationNumber.onBlur}
              onFocus={form.corporationNumber.onFocus}
              disabled={form.isSubmitting}
              data-testid="corporation-number-input"
            />
            
            {/* Live region for corporation number validation status */}
            <div 
              className="sr-only" 
              role="status" 
              aria-live="polite" 
              aria-atomic="true"
            >
              {form.corporationNumber.isLoading && "Validating corporation number..."}
              {form.corporationNumber.state.tag === "valid" && "Corporation number is valid"}
              {form.corporationNumber.state.tag === "invalid" && `Corporation number is invalid: ${form.corporationNumber.state.remoteMessage}`}
              {form.corporationNumber.state.tag === "error" && `Validation error: ${form.corporationNumber.state.remoteMessage}`}
            </div>
            
            {/* Note: Only show the spinner beside the label via FormInput */}
          </div>

          {/* Form-level error display */}
          {form.formError && (
            <div className="rounded-md bg-destructive/10 p-3 flex items-start gap-2" role="alert">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">{form.formError}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={!form.canSubmit}
            data-testid="submit-button"
          >
            {form.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </Button>
          
          {/* Additional accessibility info */}
          <div className="sr-only" role="status" aria-live="polite">
            {form.canSubmit ? "Form is ready to submit" : "Please complete all fields before submitting"}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
