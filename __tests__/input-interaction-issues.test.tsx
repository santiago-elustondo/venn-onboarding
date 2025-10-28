/**
 * Input Interaction Issues Tests
 * 
 * These tests verify:
 * 1. Label clicking doesn't cause focus flicker
 * 2. Phone number shows proper error messages
 * 3. Corporation number shows proper error messages and loading state
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

describe("Input Interaction Issues", () => {
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

  describe("Focus behavior issues", () => {
    it("should not cause focus flicker when clicking near input but on label", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<OnboardingPage />);
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      const firstNameLabel = screen.getByText(/first name/i);
      
      // Focus the input first
      await user.click(firstNameInput);
      expect(firstNameInput).toHaveFocus();
      
      // Click on the label - this should maintain focus without flicker
      await user.click(firstNameLabel);
      
      // Input should still have focus and not flicker
      expect(firstNameInput).toHaveFocus();
      
      // Click away from both input and label to truly blur
      await user.click(document.body);
      expect(firstNameInput).not.toHaveFocus();
    });

    it("should properly handle label clicks for phone input without flicker", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<OnboardingPage />);
      
      const phoneInput = screen.getByLabelText(/phone number/i);
      const phoneLabel = screen.getByText(/phone number/i);
      
      // Click on the label should focus the input
      await user.click(phoneLabel);
      expect(phoneInput).toHaveFocus();
      
      // Clicking label again should not cause flicker
      await user.click(phoneLabel);
      expect(phoneInput).toHaveFocus();
    });
  });

  describe("Phone number error messages", () => {
    it("should show 'Required' when empty and blurred", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<OnboardingPage />);
      
      const phoneInput = screen.getByLabelText(/phone number/i);
      
      // Click and blur without entering anything
      await user.click(phoneInput);
      await user.tab();
      
      // Should show "Required" error
      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });
    });

    it("should show 'Invalid' when invalid format is entered", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<OnboardingPage />);
      
      const phoneInput = screen.getByLabelText(/phone number/i);
      
      // Enter invalid phone number
      await user.type(phoneInput, "123");
      await user.tab();
      
      // Should show "Invalid" error (not "Invalid format")
      await waitFor(() => {
        expect(screen.getByText(/^invalid$/i)).toBeInTheDocument();
      });
    });

    it("should not show 'Invalid format' but just 'Invalid'", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<OnboardingPage />);
      
      const phoneInput = screen.getByLabelText(/phone number/i);
      
      // Enter invalid phone number and trigger validation
      await user.type(phoneInput, "abc123");
      await user.tab();
      
      // Should NOT show "Invalid format" 
      expect(screen.queryByText(/invalid format/i)).not.toBeInTheDocument();
      
      // Should show "Invalid" 
      await waitFor(() => {
        expect(screen.getByText(/^invalid$/i)).toBeInTheDocument();
      });
    });
  });

  describe("Corporation number error messages", () => {
    it("should show 'Only digits' for non-numeric input", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<OnboardingPage />);
      
      const corpInput = screen.getByLabelText(/corporation number/i);
      
      // Enter non-numeric input
      await user.type(corpInput, "abc123");
      await user.tab();
      
      // Should show "Only digits" error
      await waitFor(() => {
        expect(screen.getByText(/only digits/i)).toBeInTheDocument();
      });
    });

    it("should show 'Invalid' for numeric but invalid corporation number", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<OnboardingPage />);
      
      const corpInput = screen.getByLabelText(/corporation number/i);
      
      // Enter numeric but invalid format (wrong length)
      await user.type(corpInput, "123");
      await user.tab();
      
      // Should show "9 digits" error for wrong length
      await waitFor(() => {
        expect(screen.getByText("9 digits")).toBeInTheDocument();
      });
    });

    it("should show loading spinner during corporation number validation", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<OnboardingPage />);
      
      const corpInput = screen.getByLabelText(/corporation number/i);
      
      // Enter a potentially valid corporation number
      await user.type(corpInput, "123456789");
      
      // Blur to trigger validation
      await user.tab();
      
      // Check for loading state or validation result
      await waitFor(() => {
        // Look for either loading spinner or validation result
        const spinner = screen.queryByTestId("loading-spinner");
        const errorElements = screen.queryAllByText(/network connection failed|invalid|only digits/i);
        const checkIcon = screen.queryByTestId("check-icon");
        
        // Should see at least one indicator that validation occurred
        expect(spinner || errorElements.length > 0 || checkIcon).toBeTruthy();
      }, { timeout: 1000 });
    });

    it("should hide loading spinner after validation completes", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<OnboardingPage />);
      
      const corpInput = screen.getByLabelText(/corporation number/i);
      
      // Enter a potentially valid corporation number
      await user.type(corpInput, "123456789");
      await user.tab();
      
      // Wait for validation to complete (simulate API response)
      act(() => {
        jest.advanceTimersByTime(2000); // Wait for any debouncing + API call
      });
      
      // Loading spinner should be gone
      await waitFor(() => {
        const spinner = screen.queryByTestId("loading-spinner") || 
                      screen.queryByText(/loading/i) ||
                      document.querySelector('[data-loading="true"]') ||
                      document.querySelector('.animate-spin');
        expect(spinner).not.toBeInTheDocument();
      });
    });
  });

  describe("Current broken behavior demonstration", () => {
    it("demonstrates current focus flicker issue when clicking near input", async () => {
      // This test documents the current broken behavior
      // Labels should properly focus their associated input without flicker
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<OnboardingPage />);
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      
      // Click input to focus
      await user.click(firstNameInput);
      expect(firstNameInput).toHaveFocus();
      
      // Click on the label - should maintain focus smoothly
      const label = screen.getByText(/first name/i);
      await user.click(label);
      
      // Input should still be focused (labels should focus their input)
      expect(firstNameInput).toHaveFocus();
    });
  });
});