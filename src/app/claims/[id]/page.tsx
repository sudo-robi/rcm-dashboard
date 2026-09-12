"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  User,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Loader2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Claim {
  id: string;
  claimNumber: string;
  patient: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    insuranceId: string;
    phone?: string;
    email?: string;
  };
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
}

interface DenialAnalysis {
  denialReason: string;
  denialCategory: string;
  analysis: {
    appealActions: string[];
    tips: string[];
    likelihood: string;
  };
  source: string;
}

const STATUS_COLORS: Record<string, BadgeVariant> = {
  approved: "approved",
  denied: "denied",
  pending: "pending",
  appealed: "appealed",
};

export default function ClaimDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DenialAnalysis | null>(null);

  useEffect(() => {
    fetch(`/api/claims/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setClaim(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleAnalyzeDenial = async () => {
    if (!claim?.denialReason) return;
    setAnalyzing(true);

    try {
      const res = await fetch("/api/analyze-denial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimId: claim.id,
          denialReason: claim.denialReason,
          denialCategory: claim.denialCategory,
        }),
      });
      const data = await res.json();
      setAnalysis(data);

      // Refresh claim data
      const claimRes = await fetch(`/api/claims/${params.id}`);
      const claimData = await claimRes.json();
      setClaim(claimData);
    } catch {
      // Handle error silently
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">Claim not found</p>
        <Button variant="outline" onClick={() => router.push("/claims")}>
          Back to Claims
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/claims")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{claim.claimNumber}</h1>
          <p className="text-muted-foreground mt-1">Claim Details</p>
        </div>
        <Badge variant={STATUS_COLORS[claim.status]} className="ml-auto text-sm">
          {claim.status.toUpperCase()}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Patient Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">
                {claim.patient.firstName} {claim.patient.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date of Birth</p>
              <p className="font-medium">{formatDate(claim.patient.dateOfBirth)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gender</p>
              <p className="font-medium">{claim.patient.gender}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Insurance ID</p>
              <p className="font-mono text-sm">{claim.patient.insuranceId}</p>
            </div>
          </CardContent>
        </Card>

        {/* Claim Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Claim Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Provider</p>
              <p className="font-medium">{claim.provider}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Procedure</p>
              <p className="font-medium">{claim.procedureName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">CPT Code</p>
                <p className="font-mono text-sm">{claim.cptCode}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ICD Code</p>
                <p className="font-mono text-sm">{claim.icdCode}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-xl font-bold text-primary">
                {formatCurrency(claim.amount)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="text-sm">{formatDate(claim.submittedDate)}</p>
              </div>
              {claim.resolvedDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <p className="text-sm">{formatDate(claim.resolvedDate)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Denial & Appeal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {claim.status === "denied" ? (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              ) : claim.status === "approved" ? (
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
              {claim.status === "denied" ? "Denial Information" : "Status Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {claim.denialReason && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Denial Reason</p>
                  <p className="font-medium text-red-600">{claim.denialReason}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <Badge variant="outline">{claim.denialCategory}</Badge>
                </div>
              </>
            )}
            {claim.appealAction && (
              <div>
                <p className="text-sm text-muted-foreground">Appeal Action</p>
                <p className="text-sm">{claim.appealAction}</p>
              </div>
            )}
            {claim.status === "denied" && !analysis && (
              <Button
                onClick={handleAnalyzeDenial}
                disabled={analyzing}
                className="w-full"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Denial Analysis
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis Results */}
      {analysis && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI-Powered Denial Analysis
              <Badge variant="secondary" className="ml-2 text-xs">
                {analysis.source === "llm" ? "GPT-4o-mini" : "Rule-Based"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">Recommended Appeal Actions</h4>
              <ol className="space-y-2">
                {analysis.analysis.appealActions.map((action, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                      {i + 1}
                    </span>
                    <span>{action}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Prevention Tips</h4>
              <ul className="space-y-2">
                {analysis.analysis.tips.map((tip, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Estimated Appeal Success</p>
                <p className="font-semibold">{analysis.analysis.likelihood}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
