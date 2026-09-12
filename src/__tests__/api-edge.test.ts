import "../../jest.setup";
import "@testing-library/jest-dom";

/**
 * Additional API Tests — edge cases and search filtering
 */

const mockPrisma = {
  claim: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
};

jest.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      headers: new Headers(init?.headers),
    }),
  },
}));

describe("Claims API — Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles search parameter", async () => {
    mockPrisma.claim.findMany.mockResolvedValue([]);
    mockPrisma.claim.count.mockResolvedValue(0);

    const { GET } = await import("@/app/api/claims/route");
    const request = new Request("http://localhost:3000/api/claims?search=CLM-001");
    await GET(request);

    expect(mockPrisma.claim.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.any(Array),
        }),
      })
    );
  });

  it("handles empty results", async () => {
    mockPrisma.claim.findMany.mockResolvedValue([]);
    mockPrisma.claim.count.mockResolvedValue(0);

    const { GET } = await import("@/app/api/claims/route");
    const request = new Request("http://localhost:3000/api/claims");
    const response = await GET(request);
    const data = await response.json();

    expect(data.claims).toHaveLength(0);
    expect(data.total).toBe(0);
    expect(data.totalPages).toBe(0);
  });

  it("defaults to page 1 and limit 10", async () => {
    mockPrisma.claim.findMany.mockResolvedValue([]);
    mockPrisma.claim.count.mockResolvedValue(0);

    const { GET } = await import("@/app/api/claims/route");
    const request = new Request("http://localhost:3000/api/claims");
    await GET(request);

    expect(mockPrisma.claim.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 10,
      })
    );
  });

  it("calculates correct pagination for page 3", async () => {
    mockPrisma.claim.findMany.mockResolvedValue([]);
    mockPrisma.claim.count.mockResolvedValue(50);

    const { GET } = await import("@/app/api/claims/route");
    const request = new Request("http://localhost:3000/api/claims?page=3&limit=10");
    const response = await GET(request);
    const data = await response.json();

    expect(mockPrisma.claim.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 10,
      })
    );
    expect(data.totalPages).toBe(5);
  });
});

describe("Dashboard API — Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles zero claims", async () => {
    mockPrisma.claim.count.mockResolvedValue(0);
    mockPrisma.claim.aggregate
      .mockResolvedValue({ _sum: { amount: 0 } })
      .mockResolvedValue({ _sum: { amount: 0 } });
    mockPrisma.claim.groupBy
      .mockResolvedValue([])
      .mockResolvedValue([]);
    mockPrisma.claim.findMany.mockResolvedValue([]);

    const { GET } = await import("@/app/api/dashboard/route");
    const response = await GET();
    const data = await response.json();

    expect(data.stats.totalClaims).toBe(0);
    expect(data.stats.approvalRate).toBe(0);
    expect(data.stats.denialRate).toBe(0);
  });

  it("includes recent claims in response", async () => {
    mockPrisma.claim.count.mockResolvedValue(100);
    mockPrisma.claim.aggregate
      .mockResolvedValue({ _sum: { amount: 50000 } })
      .mockResolvedValue({ _sum: { amount: 25000 } });
    mockPrisma.claim.groupBy
      .mockResolvedValue([])
      .mockResolvedValue([]);
    mockPrisma.claim.findMany.mockResolvedValue([
      { id: "1", claimNumber: "CLM-001" },
    ]);

    const { GET } = await import("@/app/api/dashboard/route");
    const response = await GET();
    const data = await response.json();

    expect(data.recentClaims).toHaveLength(1);
  });
});

describe("Denial Analysis — Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles missing claimId gracefully", async () => {
    process.env.OPENAI_API_KEY = "";
    mockPrisma.claim.update.mockResolvedValue({});

    const { POST } = await import("@/app/api/analyze-denial/route");
    const request = new Request("http://localhost:3000/api/analyze-denial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        denialReason: "Test reason",
        denialCategory: "Coding",
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(data.analysis).toBeDefined();
  });

  it("defaults to Authorization category for unknown", async () => {
    process.env.OPENAI_API_KEY = "";
    mockPrisma.claim.update.mockResolvedValue({});

    const { POST } = await import("@/app/api/analyze-denial/route");
    const request = new Request("http://localhost:3000/api/analyze-denial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        denialReason: "Unknown reason",
        denialCategory: "NonExistent",
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    // Should fall back to Authorization category
    expect(data.analysis.appealActions.length).toBeGreaterThan(0);
  });
});
