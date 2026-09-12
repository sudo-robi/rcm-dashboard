"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Claim {
  id: string;
  claimNumber: string;
  patient: { firstName: string; lastName: string };
  provider: string;
  procedureName: string;
  amount: number;
  status: string;
  submittedDate: string;
  denialReason?: string;
}

const STATUS_COLORS: Record<string, BadgeVariant> = {
  approved: "approved",
  denied: "denied",
  pending: "pending",
  appealed: "appealed",
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "approved", label: "Approved" },
  { value: "denied", label: "Denied" },
  { value: "pending", label: "Pending" },
  { value: "appealed", label: "Appealed" },
];

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const fetchClaims = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "10",
      ...(status !== "all" && { status }),
      ...(search && { search }),
    });

    fetch(`/api/claims?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setClaims(data.claims);
        setTotalPages(data.totalPages);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, status, search]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial loading state is acceptable
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "10",
      ...(status !== "all" && { status }),
      ...(search && { search }),
    });

    fetch(`/api/claims?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setClaims(data.claims);
          setTotalPages(data.totalPages);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, status, search]);

  const handleSearch = () => {
    setPage(1);
    fetchClaims();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Claims Management</h1>
        <p className="text-muted-foreground mt-1">
          View, filter, and manage patient claims
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by claim #, patient name, or provider..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={status === opt.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setStatus(opt.value);
                    setPage(1);
                  }}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Claims</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : claims.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No claims found matching your criteria
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Claim #</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Patient</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Provider</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Procedure</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Amount</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Submitted</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim) => (
                    <tr key={claim.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 font-mono text-xs">{claim.claimNumber}</td>
                      <td className="py-3 px-4">
                        {claim.patient.firstName} {claim.patient.lastName}
                      </td>
                      <td className="py-3 px-4">{claim.provider}</td>
                      <td className="py-3 px-4">{claim.procedureName}</td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatCurrency(claim.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={STATUS_COLORS[claim.status]}>
                          {claim.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatDate(claim.submittedDate)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link href={`/claims/${claim.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
