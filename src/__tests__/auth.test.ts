import "../../jest.setup";
import "@testing-library/jest-dom";

/**
 * Auth Route Tests
 */

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
};

jest.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock("next-auth", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    handlers: { GET: "mocked-get", POST: "mocked-post" },
    auth: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  })),
}));

jest.mock("next-auth/providers/credentials", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    id: "credentials",
    name: "credentials",
    type: "credentials",
    authorize: jest.fn(),
  })),
}));

describe("NextAuth Configuration", () => {
  it("auth route module loads without errors", async () => {
    // Dynamic import to test module resolution
    const route = await import("@/app/api/auth/[...nextauth]/route");
    expect(route).toBeDefined();
  });
});
