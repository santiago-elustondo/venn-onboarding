import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import OnboardingPage from "@/app/onboarding/page";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("Onboarding E2E Tests", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
  });

  it("should render the form", () => {
    render(<OnboardingPage />);
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
  });
});
