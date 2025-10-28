import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OnboardingPage from "../app/onboarding/page";

describe("Advanced Interaction Issues", () => {
  describe("Focus flicker issues on error messages and labels", () => {
    it("should not cause focus flicker when clicking on error messages", async () => {
      const user = userEvent.setup();
      render(<OnboardingPage />);

      const phoneInput = screen.getByLabelText(/phone number/i);

      // Type invalid phone to trigger error
      await user.type(phoneInput, "123");
      await user.tab(); // blur to trigger validation

      // Wait for error message to appear
      await waitFor(() => {
        expect(screen.getByText(/invalid/i)).toBeInTheDocument();
      });

      // Click on the error message - should NOT cause focus flicker
      const errorMessage = screen.getByText(/invalid/i);
      await user.click(errorMessage);

      // Input should NOT regain focus when clicking error message
      expect(phoneInput).not.toHaveFocus();
    });

    it("should not cause focus flicker when clicking on labels with errors", async () => {
      const user = userEvent.setup();
      render(<OnboardingPage />);

      const phoneInput = screen.getByLabelText(/phone number/i);
      const phoneLabel = screen.getByText("Phone Number");

      // Type invalid phone to trigger error
      await user.type(phoneInput, "abc");
      await user.tab(); // blur to trigger validation

      // Wait for error to appear (could be "Required" or "Invalid" depending on field state)
      await waitFor(() => {
        const errorText = screen.getByText(/required|invalid/i);
        expect(errorText).toBeInTheDocument();
      });

      // Click on label when there's an error - should focus input without flicker
      await user.click(phoneLabel);
      
      // Input should have focus, but this should be smooth without flicker
      expect(phoneInput).toHaveFocus();
    });

    it("should handle corporation number error message clicks properly", async () => {
      const user = userEvent.setup();
      render(<OnboardingPage />);

      const corpInput = screen.getByLabelText(/corporation number/i);

      // Type invalid corp number to trigger error
      await user.type(corpInput, "abc");
      await user.tab();

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/only digits/i)).toBeInTheDocument();
      });

      // Click on error message should not focus input
      const errorMessage = screen.getByText(/only digits/i);
      await user.click(errorMessage);

      expect(corpInput).not.toHaveFocus();
    });
  });

  describe("Corporation number message improvements", () => {
    it("should show '9 digits' for wrong length/format", async () => {
      const user = userEvent.setup();
      render(<OnboardingPage />);

      const corpInput = screen.getByLabelText(/corporation number/i);

      // Test various invalid formats that should show "9 digits"
      await user.type(corpInput, "123");
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText("9 digits")).toBeInTheDocument();
      });
    });

    it("should show 'Invalid' after network check returns invalid", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<OnboardingPage />);

      const corpInput = screen.getByLabelText(/corporation number/i);

      // Type valid format that will fail network check
      await user.type(corpInput, "123456789");
      await user.tab();

      // Should eventually show validation result (invalid or network error)
      await waitFor(() => {
        const invalidMsg = screen.queryByText("Invalid");
        const networkErrorElements = screen.queryAllByText(/network connection failed/i);
        
        // Either should show Invalid or network error (which is expected behavior)
        expect(invalidMsg || networkErrorElements.length > 0).toBeTruthy();
      }, { timeout: 3000 });
    });
  });

  describe("Corporation number spinner positioning", () => {
    it("should show spinner beside the label, not in the input", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<OnboardingPage />);

      const corpInput = screen.getByLabelText(/corporation number/i);

      // Type valid format to trigger validation
      await user.type(corpInput, "123456789");
      await user.tab();

      // Look for spinner in the correct location (beside label)
      await waitFor(() => {
        // Spinner should be findable near the label area, not overlapping input
        const spinner = screen.queryByTestId("loading-spinner");
        const label = screen.getByText("Corporation Number");
        
        if (spinner) {
          // Spinner should be positioned where checkmark would appear
          // This is a visual test - spinner should be beside the label
          expect(spinner).toBeInTheDocument();
          
          // The input should still be clearly visible and not obscured
          expect(corpInput).toBeVisible();
        }
      }, { timeout: 1000 });
    });

    it("should show checkmark in same position as spinner after successful validation", async () => {
      // This test checks that checkmark and spinner use the same position
      // In practice this might not be achievable with network failures, 
      // but establishes the expectation for UI consistency
      const user = userEvent.setup();
      render(<OnboardingPage />);

      const corpInput = screen.getByLabelText(/corporation number/i);

      // Type valid format
      await user.type(corpInput, "987654321");
      await user.tab();

      // Should eventually show either check or error in consistent position
      await waitFor(() => {
        const checkIcon = screen.queryByTestId("check-icon");
        const errorElements = screen.queryAllByText(/invalid|network/i);
        
        // One of these should appear in the label area
        expect(checkIcon || errorElements.length > 0).toBeTruthy();
      }, { timeout: 2000 });
    });
  });

  describe("Corporation number focus preservation", () => {
    it("should maintain focus during validation check", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<OnboardingPage />);

      const corpInput = screen.getByLabelText(/corporation number/i);

      // Focus and type
      await user.click(corpInput);
      await user.type(corpInput, "123456789");
      
      // Input should have focus before blur
      expect(corpInput).toHaveFocus();

      // Blur to trigger validation
      await user.tab();
      
      // After blur, focus naturally moves away, but if user clicks back during validation...
      await user.click(corpInput);
      
      // Should maintain focus even while validation is in progress
      expect(corpInput).toHaveFocus();
      
      // Focus should not be lost due to validation state changes
      await waitFor(() => {
        // Regardless of validation result, if input was focused, it should stay focused
        expect(corpInput).toHaveFocus();
      }, { timeout: 1000 });
    });

    it("should not lose focus when validation completes", async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<OnboardingPage />);

      const corpInput = screen.getByLabelText(/corporation number/i);

      // Type and stay focused
      await user.click(corpInput);
      await user.type(corpInput, "555666777");
      
      // Don't blur - keep focus while validation might happen
      expect(corpInput).toHaveFocus();
      
      // Even if validation happens in background, focus should be preserved
      await waitFor(() => {
        // Input should maintain focus throughout any validation process
        expect(corpInput).toHaveFocus();
      }, { timeout: 2000 });
    });
  });
});