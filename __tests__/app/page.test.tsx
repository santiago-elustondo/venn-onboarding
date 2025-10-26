import { render, screen } from "@testing-library/react"
import HomePage from "@/app/page"

describe("HomePage", () => {
  it("should render welcome heading", () => {
    render(<HomePage />)
    expect(screen.getByRole("heading", { name: /welcome/i })).toBeInTheDocument()
  })

  it("should render get started button", () => {
    render(<HomePage />)
    expect(screen.getByTestId("get-started-button")).toBeInTheDocument()
  })

  it("should have link to onboarding page", () => {
    render(<HomePage />)
    const button = screen.getByTestId("get-started-button")
    expect(button).toHaveAttribute("href", "/onboarding")
  })
})
