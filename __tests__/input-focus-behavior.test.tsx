/**
 * Input Focus Behavior Tests
 * 
 * These tests verify that:
 * 1. Active inputs stay blue even after validation errors appear
 * 2. Error messages are positioned beside labels (where checkmarks would be)
 * 3. Only blue focus highlights exist (no red error highlights on input borders)
 */

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import OnboardingPage from "@/app/onboarding/page";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("Input Focus Behavior", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    (useRouter as any).mockReturnValue({
      push: mockPush,
    });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe("Active input focus state", () => {
    it("should maintain blue focus state even when validation error appears after debounce", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<OnboardingPage />);
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      
      // Type invalid input and keep focus
      await user.type(firstNameInput, "d34");
      
      // Input should be focused and blue (not red)
      expect(firstNameInput).toHaveFocus();
      expect(firstNameInput).toHaveClass("focus:border-blue-500");
      
      // Wait for debounce validation to trigger
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      // Error message should appear
      await waitFor(() => {
        expect(screen.getByText(/letters only/i)).toBeInTheDocument();
      });
      
      // Input should STILL be focused and STILL be blue (not red)
      expect(firstNameInput).toHaveFocus();
      expect(firstNameInput).not.toHaveClass("border-red-500");
      expect(firstNameInput).not.toHaveClass("ring-red-500");
      
      // The computed style should show blue border when focused
      const computedStyle = window.getComputedStyle(firstNameInput);
      // This test will help us verify the actual rendered state
    });

    it("should show error message beside label instead of below input", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<OnboardingPage />);
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      
      // Type invalid input
      await user.type(firstNameInput, "d34");
      
      // Blur to trigger validation
      await user.tab();
      
      // Error should appear beside the label in the flex container
      await waitFor(() => {
        // Error message should be in the flex container beside the label
        const errorMessage = screen.getByRole("alert");
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent("Letters only");
      });
      
      // There should NOT be an error message below the input
      const inputContainer = firstNameInput.closest('div');
      const errorBelowInput = inputContainer?.querySelector('p[role="alert"]');
      expect(errorBelowInput).not.toBeInTheDocument();
    });
  });

  describe("Phone input focus behavior", () => {
    it("should maintain blue focus state for phone input even with validation errors", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<OnboardingPage />);
      
      const phoneInput = screen.getByLabelText(/phone number/i);
      
      // Type invalid phone, blur to trigger validation, then focus again
      await user.type(phoneInput, "123");
      await user.tab(); // blur to trigger validation
      
      // Error should appear
      await waitFor(() => {
        expect(screen.queryByText(/invalid/i)).toBeInTheDocument();
      });
      
      // Focus again - should be blue and error should clear (by design)
      await user.click(phoneInput);
      expect(phoneInput).toHaveFocus();
      expect(phoneInput).not.toHaveClass("border-red-500");
      expect(phoneInput).not.toHaveClass("ring-red-500");
      
      // Error should be cleared when focused (this is the intended UX)
      expect(screen.queryByText(/invalid format/i)).not.toBeInTheDocument();
    });

    it("should show phone error message beside label", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<OnboardingPage />);
      
      const phoneInput = screen.getByLabelText(/phone number/i);
      
      // Type invalid phone and blur
      await user.type(phoneInput, "123");
      await user.tab();
      
      // Error should be beside label in the flex container
      await waitFor(() => {
        const errorMessage = screen.getByRole("alert");
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent(/invalid|required/i);
      });
    });
  });

  describe("No error highlighting on input borders", () => {
    it("should never show red borders on inputs, only blue focus", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<OnboardingPage />);
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      
      // Type invalid input and blur
      await user.type(firstNameInput, "d34");
      await user.tab();
      
      // Wait for validation
      await waitFor(() => {
        expect(screen.getByText(/letters only/i)).toBeInTheDocument();
      });
      
      // Input should NOT have red styling
      expect(firstNameInput).not.toHaveClass("border-red-500");
      expect(firstNameInput).not.toHaveClass("ring-red-500");
      expect(firstNameInput).not.toHaveClass("ring-red-500/20");
      
      // Focus again - should be blue
      await user.click(firstNameInput);
      expect(firstNameInput).toHaveFocus();
      expect(firstNameInput).toHaveClass("focus:border-blue-500");
    });
  });
});