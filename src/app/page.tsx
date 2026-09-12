"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import {
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DashboardData {
  stats: {
    totalClaims: number;
    approvedClaims: number;
    deniedClaims: number;
    pendingClaims: number;
    appealedClaims: number;
    totalAmount: number;
    approvedAmount: number;
    approvalRate: number;
    denialRate: number;
  };
  denialByCategory: { category: string; count: number }[];
  statusDistribution: { status: string; count: number }[];
  recentClaims: {
    id: string;
    claimNumber: string;
    patient: { firstName: string; lastName: string };
    provider: string;
    procedureName: string;
    amount: number;
    status: string;
    submittedDate: string;
  }[];
}

const PIE_COLORS = ["#10b981", "#ef4444", "#f59e0b", "#3b82f6"];

const STATUS_COLORS: Record<string, BadgeVariant> = {
  approved: "approved",
  denied: "denied",
  pending: "pending",
  appealed: "appealed",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
      </div>
    );
  }

  const { stats, denialByCategory, statusDistribution, recentClaims } = data;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Revenue Cycle Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Healthcare claims overview and denial analysis
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClaims}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalAmount)} total value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stats.approvalRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.approvedClaims} of {stats.totalClaims} claims
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Denial Rate</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.denialRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.deniedClaims} denied claims
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats.pendingClaims}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.appealedClaims} under appeal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Status Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Claims by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution.map((s) => ({
                    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
                    value: s.count,
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Denial Reasons Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Denial Reasons</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={denialByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Claims</CardTitle>
        </CardHeader>
        <CardContent>
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
                </tr>
              </thead>
              <tbody>
                {recentClaims.map((claim) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Footer */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenue Collected</p>
                <p className="text-lg font-bold">{formatCurrency(stats.approvedAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Revenue</p>
                <p className="text-lg font-bold">
                  {formatCurrency(stats.totalAmount - stats.approvedAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Appeal Success Est.</p>
                <p className="text-lg font-bold">65%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
