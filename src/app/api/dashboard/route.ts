import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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
}
