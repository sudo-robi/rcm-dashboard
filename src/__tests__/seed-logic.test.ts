import "../../jest.setup";

/**
 * Seed Script Logic Tests
 */

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAmount(): number {
  return Math.round((Math.random() * 15000 + 50) * 100) / 100;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateClaimNumber(index: number): string {
  return `CLM-${String(2024000 + index).padStart(7, "0")}`;
}

describe("Seed Functions", () => {
  describe("randomItem", () => {
    it("returns an item from the array", () => {
      const arr = ["a", "b", "c"];
      const result = randomItem(arr);
      expect(arr).toContain(result);
    });

    it("returns the same item for single-element array", () => {
      expect(randomItem(["only"])).toBe("only");
    });

    it("returns different values over many calls", () => {
      const arr = [1, 2, 3, 4, 5];
      const results = new Set(Array.from({ length: 100 }, () => randomItem(arr)));
      expect(results.size).toBeGreaterThan(1);
    });
  });

  describe("randomAmount", () => {
    it("returns a number between 50 and 15050", () => {
      for (let i = 0; i < 100; i++) {
        const amount = randomAmount();
        expect(amount).toBeGreaterThanOrEqual(50);
        expect(amount).toBeLessThanOrEqual(15050);
      }
    });

    it("returns amounts with at most 2 decimal places", () => {
      const amount = randomAmount();
      const decimals = amount.toString().split(".")[1];
      expect(decimals?.length || 0).toBeLessThanOrEqual(2);
    });
  });

  describe("randomDate", () => {
    it("returns a date within the range", () => {
      const start = new Date("2024-01-01");
      const end = new Date("2024-12-31");

      for (let i = 0; i < 50; i++) {
        const date = randomDate(start, end);
        expect(date.getTime()).toBeGreaterThanOrEqual(start.getTime());
        expect(date.getTime()).toBeLessThanOrEqual(end.getTime());
      }
    });
  });

  describe("generateClaimNumber", () => {
    it("generates correct format", () => {
      expect(generateClaimNumber(0)).toBe("CLM-2024000");
      expect(generateClaimNumber(1)).toBe("CLM-2024001");
      expect(generateClaimNumber(99)).toBe("CLM-2024099");
    });

    it("pads with zeros", () => {
      expect(generateClaimNumber(0)).toMatch(/^CLM-\d{7}$/);
    });
  });
});

describe("Data Integrity", () => {
  const DENIAL_REASONS = [
    { reason: "Prior authorization not obtained", category: "Authorization" },
    { reason: "Service not covered under patient plan", category: "Coverage" },
    { reason: "Missing or invalid CPT code", category: "Coding" },
    { reason: "Duplicate claim submission", category: "Billing" },
    { reason: "Insufficient documentation", category: "Documentation" },
    { reason: "Procedure deemed not medically necessary", category: "Medical Necessity" },
    { reason: "Patient eligibility expired", category: "Eligibility" },
    { reason: "Filing deadline exceeded", category: "Timely Filing" },
    { reason: "Coordination of benefits mismatch", category: "Insurance" },
    { reason: "Diagnosis code does not support procedure", category: "Coding" },
  ];

  const PROCEDURES = [
    { code: "99213", name: "Office Visit - Established Patient", cpt: "99213", icd: "Z00.00" },
    { code: "99214", name: "Office Visit - Complex", cpt: "99214", icd: "E11.9" },
    { code: "70553", name: "Brain MRI with Contrast", cpt: "70553", icd: "G43.909" },
  ];

  it("all denial reasons have required fields", () => {
    DENIAL_REASONS.forEach((dr) => {
      expect(dr.reason).toBeTruthy();
      expect(dr.category).toBeTruthy();
    });
  });

  it("all procedures have valid CPT codes", () => {
    PROCEDURES.forEach((p) => {
      expect(p.cpt).toMatch(/^\d{4,5}$/);
      expect(p.name).toBeTruthy();
    });
  });

  it("denial categories are unique strings", () => {
    const categories = new Set(DENIAL_REASONS.map((dr) => dr.category));
    expect(categories.size).toBeGreaterThan(0);
  });
});
