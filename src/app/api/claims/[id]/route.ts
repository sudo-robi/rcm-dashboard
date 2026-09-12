import { NextResponse } from "next/server";

const MOCK_CLAIMS: Record<string, {
  id: string;
  claimNumber: string;
  patient: { firstName: string; lastName: string; dateOfBirth: string; gender: string; insuranceId: string; phone: string; email: string; address: string };
  provider: string;
  procedureCode: string;
  procedureName: string;
  cptCode: string;
  icdCode: string;
  amount: number;
  status: string;
  denialReason?: string;
  denialCategory?: string;
  appealAction?: string;
  submittedDate: string;
  resolvedDate?: string;
}> = {
  "1": {
    id: "1", claimNumber: "CLM-2024001",
    patient: { firstName: "James", lastName: "Smith", dateOfBirth: "1985-03-15", gender: "Male", insuranceId: "BCBS-123456789", phone: "(555) 123-4567", email: "james.smith@email.com", address: "123 Oak St" },
    provider: "Metro General Hospital", procedureCode: "99214", procedureName: "Office Visit - Complex", cptCode: "99214", icdCode: "E11.9", amount: 245.0, status: "approved", submittedDate: "2024-12-28", resolvedDate: "2024-12-30",
  },
  "2": {
    id: "2", claimNumber: "CLM-2024002",
    patient: { firstName: "Maria", lastName: "Garcia", dateOfBirth: "1990-07-22", gender: "Female", insuranceId: "AETNA-987654321", phone: "(555) 234-5678", email: "maria.garcia@email.com", address: "456 Maple Ave" },
    provider: "St. Mary Medical Center", procedureCode: "71046", procedureName: "Chest X-Ray 2 Views", cptCode: "71046", icdCode: "R05.9", amount: 189.5, status: "denied", denialReason: "Prior authorization not obtained", denialCategory: "Authorization", submittedDate: "2024-12-27", resolvedDate: "2024-12-29",
  },
  "3": {
    id: "3", claimNumber: "CLM-2024003",
    patient: { firstName: "Robert", lastName: "Johnson", dateOfBirth: "1978-11-03", gender: "Male", insuranceId: "UHC-456789123", phone: "(555) 345-6789", email: "robert.j@email.com", address: "789 Cedar Blvd" },
    provider: "Urban Health Clinic", procedureCode: "80053", procedureName: "Comprehensive Metabolic Panel", cptCode: "80053", icdCode: "E11.9", amount: 78.25, status: "pending", submittedDate: "2024-12-26",
  },
  "4": {
    id: "4", claimNumber: "CLM-2024004",
    patient: { firstName: "Jennifer", lastName: "Williams", dateOfBirth: "1995-01-18", gender: "Female", insuranceId: "CIGNA-321654987", phone: "(555) 456-7890", email: "jen.w@email.com", address: "321 Elm Dr" },
    provider: "Pacific Coast Medical", procedureCode: "70553", procedureName: "Brain MRI with Contrast", cptCode: "70553", icdCode: "G43.909", amount: 2850.0, status: "appealed", denialReason: "Procedure deemed not medically necessary", denialCategory: "Medical Necessity", appealAction: "Submitted additional documentation for review", submittedDate: "2024-12-25", resolvedDate: "2024-12-28",
  },
  "5": {
    id: "5", claimNumber: "CLM-2024005",
    patient: { firstName: "Michael", lastName: "Brown", dateOfBirth: "1982-09-07", gender: "Male", insuranceId: "HUMANA-654321789", phone: "(555) 567-8901", email: "m.brown@email.com", address: "654 Pine Ln" },
    provider: "Eastside Specialty Center", procedureCode: "93000", procedureName: "Electrocardiogram", cptCode: "93000", icdCode: "I10", amount: 125.0, status: "approved", submittedDate: "2024-12-24", resolvedDate: "2024-12-26",
  },
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { prisma } = await import("@/lib/prisma");
    const claim = await prisma.claim.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    return NextResponse.json(claim);
  } catch {
    const claim = MOCK_CLAIMS[id];
    if (!claim) {
      return NextResponse.json(MOCK_CLAIMS["1"]);
    }
    return NextResponse.json(claim);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  try {
    const { prisma } = await import("@/lib/prisma");
    const claim = await prisma.claim.update({
      where: { id },
      data: body,
      include: { patient: true },
    });
    return NextResponse.json(claim);
  } catch {
    return NextResponse.json({ ...MOCK_CLAIMS[id], ...body });
  }
}
