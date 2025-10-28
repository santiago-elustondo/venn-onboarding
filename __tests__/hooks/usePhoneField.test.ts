import { renderHook, act } from "@testing-library/react";
import { usePhoneField } from "../../hooks/usePhoneField";

describe("usePhoneField - North America (US/CA)", () => {
  it("initializes with empty values", () => {
    const { result } = renderHook(() => usePhoneField());
    
    expect(result.current.value).toBe('');
    expect(result.current.isValid).toBe(false);
    expect(result.current.isTouched).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.e164).toBe(null);
  });

  it("handles valid US phone number", () => {
    const { result } = renderHook(() => usePhoneField());
    
    act(() => {
      result.current.onChange('+14165550123');
    });

    expect(result.current.value).toBe('+14165550123');
    expect(result.current.isValid).toBe(true);
    expect(result.current.e164).toBe('+14165550123');
    expect(result.current.error).toBe(null);
  });

  it("handles valid CA phone number", () => {
    const { result } = renderHook(() => usePhoneField());
    
    act(() => {
      result.current.onChange('+14166628602'); // Toronto number
    });

    expect(result.current.value).toBe('+14166628602');
    expect(result.current.isValid).toBe(true);
    expect(result.current.e164).toBe('+14166628602');
    expect(result.current.error).toBe(null);
  });

  it("shows error for invalid phone when blurred", () => {
    const { result } = renderHook(() => usePhoneField());
    
    act(() => {
      result.current.onChange('123');
      result.current.onBlur();  // This triggers validation error
    });

    expect(result.current.isValid).toBe(false);
    expect(result.current.isTouched).toBe(true);
    expect(result.current.error).toBe('Invalid');
  });

  it("clears error on focus", () => {
    const { result } = renderHook(() => usePhoneField());
    
    act(() => {
      result.current.onChange('123');
      result.current.onBlur();  // This triggers validation error
    });

    expect(result.current.error).toBe('Invalid');
    
    act(() => {
      result.current.onFocus();  // This should clear the error
    });

    expect(result.current.error).toBe(null);
  });

  it("resets correctly", () => {
    const { result } = renderHook(() => usePhoneField());
    
    act(() => {
      result.current.onChange('+14165550123');
      result.current.onBlur();
    });

    expect(result.current.value).toBe('+14165550123');
    expect(result.current.isTouched).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.value).toBe('');
    expect(result.current.isTouched).toBe(false);
    expect(result.current.error).toBe(null);
  });
});