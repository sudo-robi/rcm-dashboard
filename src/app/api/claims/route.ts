import { NextResponse } from "next/server";

interface MockClaim {
  id: string;
  claimNumber: string;
  patient: { firstName: string; lastName: string };
  provider: string;
  procedureName: string;
  cptCode: string;
  amount: number;
  status: string;
  submittedDate: string;
  denialReason?: string;
}

const MOCK_CLAIMS: MockClaim[] = [
  { id: "1", claimNumber: "CLM-2024001", patient: { firstName: "James", lastName: "Smith" }, provider: "Metro General Hospital", procedureName: "Office Visit - Complex", cptCode: "99214", amount: 245.0, status: "approved", submittedDate: "2024-12-28" },
  { id: "2", claimNumber: "CLM-2024002", patient: { firstName: "Maria", lastName: "Garcia" }, provider: "St. Mary Medical Center", procedureName: "Chest X-Ray 2 Views", cptCode: "71046", amount: 189.5, status: "denied", submittedDate: "2024-12-27", denialReason: "Prior authorization not obtained" },
  { id: "3", claimNumber: "CLM-2024003", patient: { firstName: "Robert", lastName: "Johnson" }, provider: "Urban Health Clinic", procedureName: "Comprehensive Metabolic Panel", cptCode: "80053", amount: 78.25, status: "pending", submittedDate: "2024-12-26" },
  { id: "4", claimNumber: "CLM-2024004", patient: { firstName: "Jennifer", lastName: "Williams" }, provider: "Pacific Coast Medical", procedureName: "Brain MRI with Contrast", cptCode: "70553", amount: 2850.0, status: "appealed", submittedDate: "2024-12-25" },
  { id: "5", claimNumber: "CLM-2024005", patient: { firstName: "Michael", lastName: "Brown" }, provider: "Eastside Specialty Center", procedureName: "Electrocardiogram", cptCode: "93000", amount: 125.0, status: "approved", submittedDate: "2024-12-24" },
  { id: "6", claimNumber: "CLM-2024006", patient: { firstName: "Linda", lastName: "Davis" }, provider: "Valley Regional Hospital", procedureName: "Complete Blood Count", cptCode: "85025", amount: 65.0, status: "approved", submittedDate: "2024-12-23" },
  { id: "7", claimNumber: "CLM-2024007", patient: { firstName: "William", lastName: "Rodriguez" }, provider: "Downtown Urgent Care", procedureName: "Emergency Visit - Moderate", cptCode: "99283", amount: 450.0, status: "denied", submittedDate: "2024-12-22", denialReason: "Service not covered under patient plan" },
  { id: "8", claimNumber: "CLM-2024008", patient: { firstName: "Patricia", lastName: "Martinez" }, provider: "Lakeside Physicians Group", procedureName: "Venipuncture", cptCode: "36415", amount: 35.0, status: "approved", submittedDate: "2024-12-21" },
  { id: "9", claimNumber: "CLM-2024009", patient: { firstName: "David", lastName: "Hernandez" }, provider: "Metro General Hospital", procedureName: "Upper GI Endoscopy", cptCode: "43239", amount: 1850.0, status: "pending", submittedDate: "2024-12-20" },
  { id: "10", claimNumber: "CLM-2024010", patient: { firstName: "Elizabeth", lastName: "Lopez" }, provider: "St. Mary Medical Center", procedureName: "Colonoscopy Diagnostic", cptCode: "45378", amount: 2200.0, status: "denied", submittedDate: "2024-12-19", denialReason: "Insufficient documentation" },
  { id: "11", claimNumber: "CLM-2024011", patient: { firstName: "Richard", lastName: "Gonzalez" }, provider: "Pacific Coast Medical", procedureName: "Total Knee Replacement", cptCode: "27447", amount: 35000.0, status: "approved", submittedDate: "2024-12-18" },
  { id: "12", claimNumber: "CLM-2024012", patient: { firstName: "Susan", lastName: "Wilson" }, provider: "Urban Health Clinic", procedureName: "Office Visit - Established Patient", cptCode: "99213", amount: 150.0, status: "pending", submittedDate: "2024-12-17" },
  { id: "13", claimNumber: "CLM-2024013", patient: { firstName: "Joseph", lastName: "Anderson" }, provider: "Eastside Specialty Center", procedureName: "Cataract Surgery", cptCode: "66984", amount: 4500.0, status: "appealed", submittedDate: "2024-12-16" },
  { id: "14", claimNumber: "CLM-2024014", patient: { firstName: "Barbara", lastName: "Thomas" }, provider: "Valley Regional Hospital", procedureName: "Total Hip Replacement", cptCode: "27130", amount: 32000.0, status: "approved", submittedDate: "2024-12-15" },
  { id: "15", claimNumber: "CLM-2024015", patient: { firstName: "Thomas", lastName: "Taylor" }, provider: "Downtown Urgent Care", procedureName: "Emergency Visit - High", cptCode: "99284", amount: 850.0, status: "denied", submittedDate: "2024-12-14", denialReason: "Filing deadline exceeded" },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  try {
    const { prisma } = await import("@/lib/prisma");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};
    if (statusFilter && statusFilter !== "all") {
      where.status = statusFilter;
    }
    if (search) {
      where.OR = [
        { claimNumber: { contains: search, mode: "insensitive" } },
        { patient: { firstName: { contains: search, mode: "insensitive" } } },
        { patient: { lastName: { contains: search, mode: "insensitive" } } },
        { provider: { contains: search, mode: "insensitive" } },
      ];
    }

    const [claims, total] = await Promise.all([
      prisma.claim.findMany({
        where,
        include: { patient: true },
        orderBy: { submittedDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.claim.count({ where }),
    ]);

    return NextResponse.json({
      claims,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    let filtered = MOCK_CLAIMS;
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.claimNumber.toLowerCase().includes(q) ||
          c.patient.firstName.toLowerCase().includes(q) ||
          c.patient.lastName.toLowerCase().includes(q) ||
          c.provider.toLowerCase().includes(q)
      );
    }
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);
    return NextResponse.json({
      claims: paged,
      total: filtered.length,
      page,
      totalPages: Math.ceil(filtered.length / limit),
    });
  }
}
