import { render, screen, fireEvent } from "@testing-library/react"
import { FormInput } from "@/components/form-input"
import jest from "jest" // Importing jest to declare it

describe("FormInput", () => {
  const defaultProps = {
    id: "test-input",
    label: "Test Label",
    value: "",
    onChange: jest.fn(),
    onBlur: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should render input with label", () => {
    render(<FormInput {...defaultProps} />)
    expect(screen.getByLabelText("Test Label")).toBeInTheDocument()
  })

  it("should call onChange when input value changes", () => {
    render(<FormInput {...defaultProps} />)
    const input = screen.getByLabelText("Test Label")
    fireEvent.change(input, { target: { value: "test value" } })
    expect(defaultProps.onChange).toHaveBeenCalledWith("test value")
  })

  it("should call onBlur when input loses focus", () => {
    render(<FormInput {...defaultProps} />)
    const input = screen.getByLabelText("Test Label")
    fireEvent.blur(input)
    expect(defaultProps.onBlur).toHaveBeenCalled()
  })

  it("should display error message when touched and error exists", () => {
    render(<FormInput {...defaultProps} error="This field is required" touched={true} />)
    expect(screen.getByText("This field is required")).toBeInTheDocument()
  })

  it("should not display error message when not touched", () => {
    render(<FormInput {...defaultProps} error="This field is required" touched={false} />)
    expect(screen.queryByText("This field is required")).not.toBeInTheDocument()
  })

  it("should respect maxLength prop", () => {
    render(<FormInput {...defaultProps} maxLength={10} />)
    const input = screen.getByLabelText("Test Label") as HTMLInputElement
    expect(input.maxLength).toBe(10)
  })

  it("should be disabled when disabled prop is true", () => {
    render(<FormInput {...defaultProps} disabled={true} />)
    const input = screen.getByLabelText("Test Label")
    expect(input).toBeDisabled()
  })
})
