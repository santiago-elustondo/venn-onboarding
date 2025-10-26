import { render, screen } from "@testing-library/react"
import WelcomePage from "@/app/welcome/page"

describe("WelcomePage", () => {
  it("should render welcome heading", () => {
    render(<WelcomePage />)
    expect(screen.getByRole("heading", { name: /welcome/i })).toBeInTheDocument()
  })

  it("should render success icon", () => {
    render(<WelcomePage />)
    expect(screen.getByTestId("success-icon")).toBeInTheDocument()
  })

  it("should render back to home button", () => {
    render(<WelcomePage />)
    expect(screen.getByTestId("back-home-button")).toBeInTheDocument()
  })

  it("should have link to home page", () => {
    render(<WelcomePage />)
    const button = screen.getByTestId("back-home-button")
    expect(button).toHaveAttribute("href", "/")
  })
})
