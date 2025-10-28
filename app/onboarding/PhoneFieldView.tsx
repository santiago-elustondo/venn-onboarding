import React from "react";
import { Check } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { type UsePhoneFieldReturn } from "@/modules/fields/usePhoneField";

interface PhoneFieldViewProps {
  phone: UsePhoneFieldReturn;
  className?: string;
}

export function PhoneFieldView({ phone, className }: PhoneFieldViewProps) {
  const showError = !!phone.error;
  const showValid = phone.isValid && phone.value && !showError;
  
  return (
    <div className={`grid gap-1.5 ${className || ""}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor="phone" className="flex items-center gap-2">
          Phone Number
          {showValid && (
            <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
          )}
        </Label>
        {showError && (
          <span 
            role="alert" 
            className="text-sm text-destructive pointer-events-none"
          >
            {phone.error}
          </span>
        )}
      </div>
      <PhoneInput
        id="phone"
        value={phone.value}
        onChange={phone.onChange}
        onBlur={phone.onBlur}
        onFocus={phone.onFocus}
        placeholder="+1 (555) 000-0000"
        aria-invalid={showError}
      />
    </div>
  );
}
