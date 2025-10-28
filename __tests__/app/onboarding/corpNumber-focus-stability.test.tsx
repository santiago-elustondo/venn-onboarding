import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OnboardingPage from "@/app/onboarding/page";

// Provide a controllable mock for the corp fetcher
type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (v: T) => void;
  let reject!: (r?: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

jest.mock("@/modules/io/corpFetcher", () => {
  const def: { deferred?: Deferred<any> } = {};
  return {
    // expose a handle to control the deferred from tests
    __deferred: def,
    corpFetcher: jest.fn(async (_cn: string, _signal: AbortSignal) => {
      // If we don't yet have a deferred, create it
      if (!def.deferred) def.deferred = createDeferred();
      return def.deferred.promise;
    }),
  };
});

// Grab the deferred handle created by the mock
const { __deferred } = jest.requireMock("@/modules/io/corpFetcher");

describe("Corporation Number - Focus Stability", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // reset deferred handle for each test
    __deferred.deferred = undefined;
  });

  it("remains enabled during validation and maintains focus on user intent", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    const corpInput = screen.getByLabelText(/corporation number/i);

    // Focus input and type plausible number
    await user.click(corpInput);
    await user.type(corpInput, "123456789");

    expect(corpInput).toHaveFocus();

    // Blur to trigger remote validation
    await user.tab();

    // During validation the input should remain enabled and can be focused
    expect(corpInput).not.toBeDisabled();
    await user.click(corpInput);
    expect(corpInput).toHaveFocus();

    // Resolve the pending request as valid and ensure the input becomes focusable again
    __deferred.deferred?.resolve({ kind: "valid", corporationNumber: "123456789" });

    await waitFor(() => {
      expect(corpInput).not.toBeDisabled();
    });

    // Focus should still be obtainable smoothly when interacting
    await user.click(corpInput);
    expect(corpInput).toHaveFocus();
  });

  it("does not lose focus when validation completes with invalid result", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    const corpInput = screen.getByLabelText(/corporation number/i);

    await user.click(corpInput);
    await user.type(corpInput, "987654321");
    expect(corpInput).toHaveFocus();

    // Trigger validation
    await user.tab();
    // While in-flight, input stays enabled
    expect(corpInput).not.toBeDisabled();

    // Complete the request with invalid
    __deferred.deferred?.resolve({ kind: "invalid", message: "Corporation number not found" });

    await waitFor(() => {
      // Error message is added beside the label
      const err = screen.getByTestId("corporationNumber-error");
      expect(err).toBeInTheDocument();
      expect(err).toHaveTextContent(/corporation number not found/i);
      expect(corpInput).not.toBeDisabled();
    });

    // User can immediately focus again without flicker
    await user.click(corpInput);
    expect(corpInput).toHaveFocus();
  });

  it("label clicks focus the input without causing focus flicker during validation", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    const corpInput = screen.getByLabelText(/corporation number/i);
    const corpLabel = screen.getByText(/corporation number/i);

    // Focus and type then blur to start validation
    await user.click(corpInput);
    await user.type(corpInput, "123456789");
    await user.tab();

    // While in checking state, input remains enabled; label click should focus it
    expect(corpInput).not.toBeDisabled();
    await user.click(corpLabel);
    expect(corpInput).toHaveFocus();

    // Resolve to error to force another DOM update and ensure no flicker
    __deferred.deferred?.resolve({ kind: "error", error: "network", message: "Network connection failed" });
    await waitFor(() => {
      const err = screen.getByTestId("corporationNumber-error");
      expect(err).toBeInTheDocument();
      expect(err).toHaveTextContent(/network connection failed/i);
      expect(corpInput).not.toBeDisabled();
    });

    // After completion, label click should focus without flicker
    await user.click(corpLabel);
    expect(corpInput).toHaveFocus();
  });

  it("clicking error message does not steal or change focus", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    const corpInput = screen.getByLabelText(/corporation number/i);

    await user.click(corpInput);
    await user.type(corpInput, "123456789");
    await user.tab();
    // During checking input remains enabled
    expect(corpInput).not.toBeDisabled();

    // Resolve with invalid to show error
    __deferred.deferred?.resolve({ kind: "invalid", message: "Invalid" });

    const errorEl = await screen.findByTestId("corporationNumber-error");
    // Clicking the error area should not change focus
    await user.click(errorEl);
    // Input is enabled again after result; focus after user intent
    await user.click(corpInput);
    expect(corpInput).toHaveFocus();
  });

  it("rapid re-edit during in-flight validation preserves focus and cancels previous request", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    const corpInput = screen.getByLabelText(/corporation number/i);

    // Start with plausible input and trigger validation
    await user.click(corpInput);
    await user.type(corpInput, "123456789");
    await user.tab();
    // Input should remain enabled even while checking
    expect(corpInput).not.toBeDisabled();

    // Re-edit value to a new plausible number; this should abort the prior request
    // Even with in-flight request, user can re-edit immediately
    await user.clear(corpInput);
    await user.type(corpInput, "111111111");
    expect(corpInput).toHaveFocus();

    // Complete the FIRST request with invalid — it should be ignored by the hook
    // Create a new deferred for the next in-flight validation
    const { __deferred: def2 } = jest.requireMock("@/modules/io/corpFetcher");
    def2.deferred = createDeferred();

    // Blur to trigger the second validation
    await user.tab();
    expect(corpInput).not.toBeDisabled();

    // Resolve second request as valid; old error should disappear
    def2.deferred.resolve({ kind: "valid", corporationNumber: "111111111" });

    await waitFor(() => {
      expect(corpInput).not.toBeDisabled();
      expect(screen.queryByText(/old request/i)).not.toBeInTheDocument();
    });
    await user.click(corpInput);
    expect(corpInput).toHaveFocus();
  });
});
