import "../../jest.setup";

/**
 * API Route Tests
 */

const mockPrisma = {
  claim: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  patient: {
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  $disconnect: jest.fn(),
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

describe("Claims API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/claims", () => {
    it("returns paginated claims", async () => {
      const mockClaims = [
        {
          id: "1",
          claimNumber: "CLM-0000001",
          patient: { firstName: "John", lastName: "Doe" },
          status: "approved",
          amount: 500,
        },
      ];

      mockPrisma.claim.findMany.mockResolvedValue(mockClaims);
      mockPrisma.claim.count.mockResolvedValue(1);

      const { GET } = await import("@/app/api/claims/route");
      const request = new Request("http://localhost:3000/api/claims?page=1&limit=10");
      const response = await GET(request);
      const data = await response.json();

      expect(data.claims).toHaveLength(1);
      expect(data.total).toBe(1);
      expect(data.totalPages).toBe(1);
      expect(mockPrisma.claim.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        })
      );
    });

    it("filters by status", async () => {
      mockPrisma.claim.findMany.mockResolvedValue([]);
      mockPrisma.claim.count.mockResolvedValue(0);

      const { GET } = await import("@/app/api/claims/route");
      const request = new Request("http://localhost:3000/api/claims?status=denied");
      await GET(request);

      expect(mockPrisma.claim.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "denied" },
        })
      );
    });
  });

  describe("GET /api/claims/[id]", () => {
    it("returns a single claim", async () => {
      const mockClaim = {
        id: "1",
        claimNumber: "CLM-0000001",
        patient: { firstName: "John", lastName: "Doe" },
      };

      mockPrisma.claim.findUnique.mockResolvedValue(mockClaim);

      const { GET } = await import("@/app/api/claims/[id]/route");
      const request = new Request("http://localhost:3000/api/claims/1");
      const response = await GET(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(data.claimNumber).toBe("CLM-0000001");
    });

    it("returns 404 for missing claim", async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(null);

      const { GET } = await import("@/app/api/claims/[id]/route");
      const request = new Request("http://localhost:3000/api/claims/999");
      const response = await GET(request, { params: Promise.resolve({ id: "999" }) });

      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /api/claims/[id]", () => {
    it("updates a claim", async () => {
      const updatedClaim = {
        id: "1",
        status: "appealed",
        appealAction: "Submitted documentation",
      };

      mockPrisma.claim.update.mockResolvedValue(updatedClaim);

      const { PATCH } = await import("@/app/api/claims/[id]/route");
      const request = new Request("http://localhost:3000/api/claims/1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "appealed" }),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: "1" }) });
      const data = await response.json();

      expect(data.status).toBe("appealed");
    });
  });
});

describe("Dashboard API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns dashboard stats", async () => {
    mockPrisma.claim.count
      .mockResolvedValueOnce(200)
      .mockResolvedValueOnce(90)
      .mockResolvedValueOnce(50)
      .mockResolvedValueOnce(40)
      .mockResolvedValueOnce(20);

    mockPrisma.claim.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 500000 } })
      .mockResolvedValueOnce({ _sum: { amount: 225000 } });

    mockPrisma.claim.groupBy
      .mockResolvedValueOnce([
        { denialCategory: "Authorization", _count: 15 },
        { denialCategory: "Coding", _count: 10 },
      ])
      .mockResolvedValueOnce([
        { status: "approved", _count: 90 },
        { status: "denied", _count: 50 },
      ]);

    mockPrisma.claim.findMany.mockResolvedValue([]);

    const { GET } = await import("@/app/api/dashboard/route");
    const response = await GET();
    const data = await response.json();

    expect(data.stats.totalClaims).toBe(200);
    expect(data.stats.approvalRate).toBe(45);
    expect(data.stats.denialRate).toBe(25);
    expect(data.denialByCategory).toHaveLength(2);
  });
});

describe("Denial Analysis API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns rule-based analysis when no OpenAI key", async () => {
    process.env.OPENAI_API_KEY = "";
    mockPrisma.claim.update.mockResolvedValue({});

    const { POST } = await import("@/app/api/analyze-denial/route");
    const request = new Request("http://localhost:3000/api/analyze-denial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        claimId: "1",
        denialReason: "Prior authorization not obtained",
        denialCategory: "Authorization",
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(data.source).toBe("rule-based");
    expect(data.analysis.appealActions).toBeDefined();
    expect(data.analysis.appealActions.length).toBeGreaterThan(0);
    expect(data.analysis.tips).toBeDefined();
    expect(data.analysis.likelihood).toBeDefined();
  });

  it("returns analysis for each denial category", async () => {
    process.env.OPENAI_API_KEY = "";
    mockPrisma.claim.update.mockResolvedValue({});

    const categories = [
      "Authorization", "Coverage", "Coding", "Billing",
      "Documentation", "Medical Necessity", "Eligibility",
      "Timely Filing", "Insurance",
    ];

    for (const category of categories) {
      const { POST } = await import("@/app/api/analyze-denial/route");
      const request = new Request("http://localhost:3000/api/analyze-denial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimId: "1",
          denialReason: `Test denial for ${category}`,
          denialCategory: category,
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(data.analysis.appealActions.length).toBeGreaterThanOrEqual(3);
      expect(data.analysis.tips.length).toBeGreaterThanOrEqual(2);
    }
  });
});
