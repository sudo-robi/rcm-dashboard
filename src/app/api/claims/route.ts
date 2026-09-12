import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};
  if (status && status !== "all") {
    where.status = status;
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
}
