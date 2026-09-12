import { NextResponse } from "next/server";

const MOCK_DATA = {
  stats: {
    totalClaims: 200,
    approvedClaims: 90,
    deniedClaims: 50,
    pendingClaims: 40,
    appealedClaims: 20,
    totalAmount: 487650.0,
    approvedAmount: 219442.5,
    approvalRate: 45,
    denialRate: 25,
  },
  denialByCategory: [
    { category: "Authorization", count: 15 },
    { category: "Coding", count: 12 },
    { category: "Documentation", count: 8 },
    { category: "Coverage", count: 6 },
    { category: "Medical Necessity", count: 5 },
    { category: "Billing", count: 4 },
  ],
  statusDistribution: [
    { status: "approved", count: 90 },
    { status: "denied", count: 50 },
    { status: "pending", count: 40 },
    { status: "appealed", count: 20 },
  ],
  recentClaims: [
    {
      id: "1",
      claimNumber: "CLM-2024199",
      patient: { firstName: "James", lastName: "Smith" },
      provider: "Metro General Hospital",
      procedureName: "Office Visit - Complex",
      amount: 245.0,
      status: "approved",
      submittedDate: "2024-12-28",
    },
    {
      id: "2",
      claimNumber: "CLM-2024198",
      patient: { firstName: "Maria", lastName: "Garcia" },
      provider: "St. Mary Medical Center",
      procedureName: "Chest X-Ray 2 Views",
      amount: 189.5,
      status: "denied",
      submittedDate: "2024-12-27",
    },
    {
      id: "3",
      claimNumber: "CLM-2024197",
      patient: { firstName: "Robert", lastName: "Johnson" },
      provider: "Urban Health Clinic",
      procedureName: "Comprehensive Metabolic Panel",
      amount: 78.25,
      status: "pending",
      submittedDate: "2024-12-26",
    },
    {
      id: "4",
      claimNumber: "CLM-2024196",
      patient: { firstName: "Jennifer", lastName: "Williams" },
      provider: "Pacific Coast Medical",
      procedureName: "Brain MRI with Contrast",
      amount: 2850.0,
      status: "appealed",
      submittedDate: "2024-12-25",
    },
    {
      id: "5",
      claimNumber: "CLM-2024195",
      patient: { firstName: "Michael", lastName: "Brown" },
      provider: "Eastside Specialty Center",
      procedureName: "Electrocardiogram",
      amount: 125.0,
      status: "approved",
      submittedDate: "2024-12-24",
    },
  ],
};

export async function GET() {
  try {
    const { prisma } = await import("@/lib/prisma");

    const [
      totalClaims,
      approvedClaims,
      deniedClaims,
      pendingClaims,
      appealedClaims,
      totalAmount,
      approvedAmount,
      denialByCategory,
      monthlyTrend,
      recentClaims,
    ] = await Promise.all([
      prisma.claim.count(),
      prisma.claim.count({ where: { status: "approved" } }),
      prisma.claim.count({ where: { status: "denied" } }),
      prisma.claim.count({ where: { status: "pending" } }),
      prisma.claim.count({ where: { status: "appealed" } }),
      prisma.claim.aggregate({ _sum: { amount: true } }),
      prisma.claim.aggregate({ _sum: { amount: true }, where: { status: "approved" } }),
      prisma.claim.groupBy({
        by: ["denialCategory"],
        where: { status: "denied", denialCategory: { not: null } },
        _count: true,
        orderBy: { _count: { denialCategory: "desc" } },
      }),
      prisma.claim.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.claim.findMany({
        take: 5,
        orderBy: { submittedDate: "desc" },
        include: { patient: true },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalClaims,
        approvedClaims,
        deniedClaims,
        pendingClaims,
        appealedClaims,
        totalAmount: totalAmount._sum.amount || 0,
        approvedAmount: approvedAmount._sum.amount || 0,
        approvalRate: totalClaims > 0 ? Math.round((approvedClaims / totalClaims) * 100) : 0,
        denialRate: totalClaims > 0 ? Math.round((deniedClaims / totalClaims) * 100) : 0,
      },
      denialByCategory: denialByCategory.map((d) => ({
        category: d.denialCategory || "Unknown",
        count: d._count,
      })),
      statusDistribution: monthlyTrend.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      recentClaims,
    });
  } catch {
    return NextResponse.json(MOCK_DATA);
  }
}
