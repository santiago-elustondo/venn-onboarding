/**
 * Validation UX Behavior Tests
 * 
 * These tests capture the desired blur/idle-driven validation behavior.
 * They test that validation errors ONLY appear after blur or idle timeout,
 * never while the user is actively typing.
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

describe("Validation UX Behavior", () => {
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

  describe("While typing (active state)", () => {
    it("should NOT show validation errors while user is typing invalid characters", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<OnboardingPage />);
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      
      // Type invalid input character by character
      await user.type(firstNameInput, "d");
      
      // Should NOT show any validation error yet
      expect(screen.queryByText(/required|invalid|letters only/i)).not.toBeInTheDocument();
      
      // Continue typing invalid input
      await user.type(firstNameInput, "3");
      
      // Still should NOT show validation error
      expect(screen.queryByText(/required|invalid|letters only/i)).not.toBeInTheDocument();
      
      // Complete invalid input
      await user.type(firstNameInput, "4");
      
      // Still should NOT show validation error while typing
      expect(screen.queryByText(/required|invalid|letters only/i)).not.toBeInTheDocument();
    });
    
    it("should NOT show 'invalid name' while typing valid characters", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<OnboardingPage />);
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      
      // Type valid input character by character
      await user.type(firstNameInput, "J");
      
      // Should NOT show any validation error
      expect(screen.queryByTestId("firstName-error")).not.toBeInTheDocument();
      
      // Continue typing valid input
      await user.type(firstNameInput, "oh");
      
      // Still should NOT show validation error
      expect(screen.queryByTestId("firstName-error")).not.toBeInTheDocument();
      
      // Complete valid input
      await user.type(firstNameInput, "n");
      
      // Still should NOT show validation error while typing
      expect(screen.queryByTestId("firstName-error")).not.toBeInTheDocument();
    });

    it("should NOT show validation errors for partially complete valid names", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<OnboardingPage />);
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      
      // Type partial valid name that would normally be "too short"
      await user.type(firstNameInput, "Jo");
      
      // Should NOT show validation error while typing
      expect(screen.queryByTestId("firstName-error")).not.toBeInTheDocument();
    });
  });

  describe("After blur (validation triggered)", () => {
    it("should show validation error ONLY after blur for invalid input", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<OnboardingPage />);
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      
      // Type invalid input
      await user.type(firstNameInput, "d34");
      
      // Should NOT show validation error yet
      expect(screen.queryByTestId("firstName-error")).not.toBeInTheDocument();
      
      // Trigger blur by tabbing out
      await user.tab();
      
      // NOW should show validation error
      await waitFor(() => {
        expect(screen.getByText(/letters only/i)).toBeInTheDocument();
      });
    });
    
    it("should NOT show validation error after blur for valid input", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<OnboardingPage />);
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      
      // Type valid input
      await user.type(firstNameInput, "John");
      
      // Should NOT show validation error yet
      expect(screen.queryByTestId("firstName-error")).not.toBeInTheDocument();
      
      // Trigger blur by tabbing out
      await user.tab();
      
      // Should still NOT show validation error for valid input
      await waitFor(() => {
        expect(screen.queryByTestId("firstName-error")).not.toBeInTheDocument();
      });
    });

    it("should show specific validation messages for different error types", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<OnboardingPage />);
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      
      // Test empty field
      await user.click(firstNameInput);
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });
      
      // Clear and test invalid characters  
      await user.clear(firstNameInput);
      await user.type(firstNameInput, "test123");
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/letters only/i)).toBeInTheDocument();
      });
    });
  });

  describe("After idle timeout (validation triggered)", () => {
    it("should show validation error ONLY after idle timeout for invalid input", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<OnboardingPage />);
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      
      // Type invalid input
      await user.type(firstNameInput, "d34");
      
      // Should NOT show validation error yet
      expect(screen.queryByTestId("firstName-error")).not.toBeInTheDocument();
      
      // Wait for idle timeout (500ms)
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      // NOW should show validation error
      await waitFor(() => {
        expect(screen.getByText(/letters only/i)).toBeInTheDocument();
      });
    });
    
    it("should NOT show validation error after idle timeout for valid input", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<OnboardingPage />);
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      
      // Type valid input
      await user.type(firstNameInput, "John");
      
      // Should NOT show validation error yet
      expect(screen.queryByTestId("firstName-error")).not.toBeInTheDocument();
      
      // Wait for idle timeout (500ms)
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      // Should still NOT show validation error for valid input
      await waitFor(() => {
        expect(screen.queryByTestId("firstName-error")).not.toBeInTheDocument();
      });
    });
  });

  describe("State transitions", () => {
    it("should transition from no-error -> error -> no-error as user corrects input", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<OnboardingPage />);
      
      const firstNameInput = screen.getByLabelText(/first name/i);
      
      // 1. Type invalid input and blur
      await user.type(firstNameInput, "d34");
      await user.tab();
      
      // Should show error
      await waitFor(() => {
        expect(screen.getByText(/letters only/i)).toBeInTheDocument();
      });
      
      // 2. Fix the input by clearing and typing valid name
      await user.clear(firstNameInput);
      
      // While typing correction, should NOT show error immediately
      expect(screen.queryByTestId("firstName-error")).not.toBeInTheDocument();
      
      await user.type(firstNameInput, "John");
      
      // Still should NOT show error while typing
      expect(screen.queryByTestId("firstName-error")).not.toBeInTheDocument();
      
      // 3. Blur to validate the corrected input
      await user.tab();
      
      // Should NOT show error for valid input
      await waitFor(() => {
        expect(screen.queryByTestId("firstName-error")).not.toBeInTheDocument();
      });
    });
  });

  describe("Phone field validation behavior", () => {
    it("should follow same pattern for phone validation", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      render(<OnboardingPage />);
      
      const phoneInput = screen.getByLabelText(/phone number/i);
      
      // Initially should be empty with no error
      expect(phoneInput).toHaveValue("");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      
      // Enter invalid phone number to trigger validation
      await user.type(phoneInput, "123");
      await user.tab();
      
      // Wait for blur to trigger error state
      await waitFor(() => {
        expect(phoneInput).toHaveAttribute("aria-invalid", "true");
      });
      
      // Should show validation error for incomplete phone number
      await waitFor(() => {
        expect(screen.getByText(/invalid/i)).toBeInTheDocument();
      });
      
      // The error should be displayed in a role="alert" element
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});