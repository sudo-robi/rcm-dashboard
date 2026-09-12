import "@testing-library/jest-dom";
import "../../jest.setup";

import { cn, formatCurrency, formatDate } from "@/lib/utils";

describe("cn utility", () => {
  it("merges class names", () => {
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });

  it("handles conditional classes", () => {
    const result = cn("base", false && "hidden", "extra");
    expect(result).toContain("base");
    expect(result).toContain("extra");
    expect(result).not.toContain("hidden");
  });

  it("handles undefined and null", () => {
    const result = cn("base", undefined, null);
    expect(result).toBe("base");
  });
});

describe("formatCurrency", () => {
  it("formats USD amounts", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats large amounts", () => {
    expect(formatCurrency(100000)).toBe("$100,000.00");
  });

  it("formats negative amounts", () => {
    expect(formatCurrency(-500)).toBe("-$500.00");
  });
});

describe("formatDate", () => {
  it("formats Date objects", () => {
    const date = new Date("2024-06-15");
    const result = formatDate(date);
    expect(result).toBe("Jun 15, 2024");
  });

  it("formats date strings", () => {
    const result = formatDate("2024-01-01");
    expect(result).toBe("Jan 1, 2024");
  });

  it("formats ISO datetime strings", () => {
    const result = formatDate("2024-12-31T00:00:00.000Z");
    expect(result).toContain("2024");
  });
});
