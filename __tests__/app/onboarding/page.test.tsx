import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import OnboardingPage from "@/app/onboarding/page"
import { useRouter } from "next/navigation"
import jest from "jest" // Import jest to fix the undeclared variable error

// Mock the custom hook
jest.mock("@/hooks/use-onboarding-form")

describe("OnboardingPage", () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  it("should render all form fields", () => {
    const mockUseOnboardingForm = require("@/hooks/use-onboarding-form").useOnboardingForm
    mockUseOnboardingForm.mockReturnValue({
      formData: {
        firstName: "",
        lastName: "",
        phone: "",
        corporationNumber: "",
      },
      errors: {},
      touched: {},
      isValidating: false,
      isSubmitting: false,
      handleChange: jest.fn(),
      handleBlur: jest.fn(),
      handleSubmit: jest.fn(),
    })

    render(<OnboardingPage />)

    expect(screen.getByTestId("first-name-input")).toBeInTheDocument()
    expect(screen.getByTestId("last-name-input")).toBeInTheDocument()
    expect(screen.getByTestId("phone-input")).toBeInTheDocument()
    expect(screen.getByTestId("corporation-number-input")).toBeInTheDocument()
    expect(screen.getByTestId("submit-button")).toBeInTheDocument()
  })

  it("should call handleChange when input values change", async () => {
    const mockHandleChange = jest.fn()
    const mockUseOnboardingForm = require("@/hooks/use-onboarding-form").useOnboardingForm
    mockUseOnboardingForm.mockReturnValue({
      formData: {
        firstName: "",
        lastName: "",
        phone: "",
        corporationNumber: "",
      },
      errors: {},
      touched: {},
      isValidating: false,
      isSubmitting: false,
      handleChange: mockHandleChange,
      handleBlur: jest.fn(),
      handleSubmit: jest.fn(),
    })

    render(<OnboardingPage />)

    const firstNameInput = screen.getByTestId("first-name-input")
    await userEvent.type(firstNameInput, "John")

    expect(mockHandleChange).toHaveBeenCalled()
  })

  it("should navigate to welcome page on successful submission", async () => {
    const mockHandleSubmit = jest.fn().mockResolvedValue(true)
    const mockUseOnboardingForm = require("@/hooks/use-onboarding-form").useOnboardingForm
    mockUseOnboardingForm.mockReturnValue({
      formData: {
        firstName: "John",
        lastName: "Doe",
        phone: "13062776103",
        corporationNumber: "123456789",
      },
      errors: {},
      touched: {},
      isValidating: false,
      isSubmitting: false,
      handleChange: jest.fn(),
      handleBlur: jest.fn(),
      handleSubmit: mockHandleSubmit,
    })

    render(<OnboardingPage />)

    const submitButton = screen.getByTestId("submit-button")
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockHandleSubmit).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith("/welcome")
    })
  })

  it("should display submit button as disabled when submitting", () => {
    const mockUseOnboardingForm = require("@/hooks/use-onboarding-form").useOnboardingForm
    mockUseOnboardingForm.mockReturnValue({
      formData: {
        firstName: "",
        lastName: "",
        phone: "",
        corporationNumber: "",
      },
      errors: {},
      touched: {},
      isValidating: false,
      isSubmitting: true,
      handleChange: jest.fn(),
      handleBlur: jest.fn(),
      handleSubmit: jest.fn(),
    })

    render(<OnboardingPage />)

    const submitButton = screen.getByTestId("submit-button")
    expect(submitButton).toBeDisabled()
  })
})
