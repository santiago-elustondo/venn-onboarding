import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OnboardingPage from "@/app/onboarding/page";

// Controllable mock for the corp fetcher
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
    __deferred: def,
    corpFetcher: jest.fn(async () => {
      if (!def.deferred) def.deferred = createDeferred();
      return def.deferred.promise;
    }),
  };
});

const { __deferred } = jest.requireMock("@/modules/io/corpFetcher");

describe("Corporation Number - Desired Focus Continuity (expected to fail on current UX)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __deferred.deferred = undefined;
  });

  it("keeps input focus and stays enabled during in-flight validation", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    const corpInput = screen.getByLabelText(/corporation number/i);

    // Focus and type a plausible number
    await user.click(corpInput);
    await user.type(corpInput, "123456789");
    expect(corpInput).toHaveFocus();

    // Blur to trigger validation, then immediately focus again
    await user.tab();
    await user.click(corpInput);

    // Desired behavior: input remains enabled and focused while checking
    await waitFor(() => {
      expect(corpInput).toHaveFocus();
      expect(corpInput).not.toBeDisabled();
    });
  });

  it("does not lose focus on label click while checking", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    const corpInput = screen.getByLabelText(/corporation number/i);
    const corpLabel = screen.getByText(/corporation number/i);

    await user.click(corpInput);
    await user.type(corpInput, "987654321");
    expect(corpInput).toHaveFocus();

    // Trigger validation
    await user.tab();
    await user.click(corpInput);

    // Desired: clicking label during checking should keep input focused and enabled
    await user.click(corpLabel);
    expect(corpInput).toHaveFocus();
    expect(corpInput).not.toBeDisabled();
  });
});

