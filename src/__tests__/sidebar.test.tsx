import "../../jest.setup";
import "@testing-library/jest-dom";

/**
 * Sidebar Component Tests
 */

import React from "react";
import { render, screen } from "@testing-library/react";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

// Mock next/link
jest.mock("next/link", () => {
  return React.forwardRef(function MockLink(
    { children, href, ...props }: any,
    ref: any
  ) {
    return (
      <a ref={ref} href={href} {...props}>
        {children}
      </a>
    );
  });
});

import { Sidebar } from "@/components/sidebar";

describe("Sidebar", () => {
  it("renders the app title", () => {
    render(<Sidebar />);
    expect(screen.getByText("RCM Dashboard")).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    render(<Sidebar />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Claims")).toBeInTheDocument();
  });

  it("renders user info", () => {
    render(<Sidebar />);
    expect(screen.getByText("Dr. Sarah Chen")).toBeInTheDocument();
    expect(screen.getByText("admin@rcm-demo.com")).toBeInTheDocument();
  });

  it("links to correct routes", () => {
    render(<Sidebar />);
    const dashboardLink = screen.getByText("Dashboard").closest("a");
    const claimsLink = screen.getByText("Claims").closest("a");
    expect(dashboardLink?.getAttribute("href")).toBe("/");
    expect(claimsLink?.getAttribute("href")).toBe("/claims");
  });
});
