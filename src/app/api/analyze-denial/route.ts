import { NextResponse } from "next/server";

// Denial analysis logic - works without OpenAI key by using rule-based suggestions
const DENIAL_ANALYSIS_MAP: Record<string, { appealActions: string[]; tips: string[]; likelihood: string }> = {
  Authorization: {
    appealActions: [
      "Submit retroactive prior authorization request with clinical justification",
      "Provide documentation of medical emergency that prevented prior auth",
      "Request peer-to-peer review with medical director",
      "Check if urgent/emergency exception applies under plan rules",
    ],
    tips: [
      "Always verify prior auth requirements before service delivery",
      "Set up automated checks in registration workflow",
      "Train staff on plan-specific authorization rules",
    ],
    likelihood: "High (70-85%)",
  },
  Coverage: {
    appealActions: [
      "Review patient's Summary of Benefits and Coverage (SBC)",
      "Submit medical necessity letter from treating physician",
      "Check for out-of-network exceptions or gap exceptions",
      "Appeal based on network adequacy if in-network options unavailable",
    ],
    tips: [
      "Verify eligibility and benefits before each visit",
      "Check for formulary changes quarterly",
      "Maintain updated payer contract matrices",
    ],
    likelihood: "Medium (40-60%)",
  },
  Coding: {
    appealActions: [
      "Review and correct CPT/ICD code pairing",
      "Add supporting modifier codes where appropriate",
      "Submit corrected claim with documentation",
      "Request coding review by certified coder",
    ],
    tips: [
      "Implement pre-submission code auditing",
      "Use real-time eligibility and code verification",
      "Maintain updated code sets (CPT, ICD-10, HCPCS)",
    ],
    likelihood: "High (75-90%)",
  },
  Billing: {
    appealActions: [
      "Submit documentation proving unique service instances",
      "Provide detailed encounter notes distinguishing services",
      "Request claim reprocessing with supporting documentation",
      "Check for bundling/unbundling rule exceptions",
    ],
    tips: [
      "Implement duplicate claim detection in billing software",
      "Use claim scrubbing before submission",
      "Monitor ERA/EOB for duplicate payment patterns",
    ],
    likelihood: "High (80-90%)",
  },
  Documentation: {
    appealActions: [
      "Submit additional clinical documentation (op notes, test results)",
      "Provide attestation from treating physician",
      "Request medical record review by appeals team",
      "Include relevant peer-reviewed literature supporting treatment",
    ],
    tips: [
      "Use documentation templates for common diagnoses",
      "Implement real-time clinical documentation improvement (CDI)",
      "Conduct regular documentation audits",
    ],
    likelihood: "Medium (50-70%)",
  },
  "Medical Necessity": {
    appealActions: [
      "Obtain detailed letter of medical necessity from specialist",
      "Cite clinical guidelines supporting treatment approach",
      "Request peer-to-peer review with payer's medical director",
      "Submit evidence of failed conservative treatments",
    ],
    tips: [
      "Document failed prior treatments and their outcomes",
      "Reference evidence-based clinical guidelines",
      "Ensure diagnosis supports the level of service billed",
    ],
    likelihood: "Medium (40-55%)",
  },
  Eligibility: {
    appealActions: [
      "Verify patient's active coverage at time of service",
      "Submit proof of continuous coverage (COBRA, retroactive enrollment)",
      "Check for coordination of benefits with secondary payer",
      "Request reprocessing if eligibility was active",
    ],
    tips: [
      "Run real-time eligibility checks at check-in",
          "Re-verify eligibility for multi-visit treatment plans",
      "Set up automated eligibility monitoring",
    ],
    likelihood: "Low (20-40%)",
  },
  "Timely Filing": {
    appealActions: [
      "Submit proof of initial timely submission (confirmation logs)",
      "Check for payer processing delays or system errors",
      "Request exception due to extenuating circumstances",
      "Verify contract-specific filing deadlines",
    ],
    tips: [
      "Implement automated claim tracking and follow-up",
      "Set calendar reminders for payer-specific deadlines",
      "Monitor clearinghouse submission confirmations daily",
    ],
    likelihood: "Low (15-30%)",
  },
  Insurance: {
    appealActions: [
      "Verify primary/secondary insurance coordination",
      "Submit Explanation of Benefits (EOB) from primary payer",
      "Request reprocessing with correct COB logic",
      "Contact payer to clarify coordination rules",
    ],
    tips: [
      "Collect all insurance information at registration",
      "Verify COB rules for each payer combination",
      "Submit claims in correct payer order",
    ],
    likelihood: "Medium (45-65%)",
  },
};

export async function POST(request: Request) {
  const body = await request.json();
  const { claimId, denialReason, denialCategory } = body;

  // Update the claim with appeal action
  let analysis;

  const categoryKey = denialCategory || "Authorization";
  analysis = DENIAL_ANALYSIS_MAP[categoryKey] || DENIAL_ANALYSIS_MAP["Authorization"];

  // If OpenAI key is available, enhance with LLM
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith("sk-")) {
    try {
      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = `You are a healthcare revenue cycle management expert. 
A medical claim was denied for: "${denialReason}" (Category: ${denialCategory}).

Provide:
1. Top 3 appeal actions (specific, actionable steps)
2. 2 prevention tips for future claims
3. Estimated appeal success likelihood (Low/Medium/High with percentage range)

Format as JSON with keys: appealActions (string[]), tips (string[]), likelihood (string)`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const llmResponse = completion.choices[0].message.content;
      if (llmResponse) {
        analysis = JSON.parse(llmResponse);
      }
    } catch {
      console.log("OpenAI unavailable, using rule-based analysis");
    }
  }

  // Update claim with appeal action
  if (claimId) {
    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.claim.update({
        where: { id: claimId },
        data: {
          status: "appealed",
          appealAction: analysis.appealActions[0],
        },
      });
    } catch {
      // Database unavailable, skip update
    }
  }

  return NextResponse.json({
    denialReason,
    denialCategory,
    analysis,
    source: process.env.OPENAI_API_KEY?.startsWith("sk-") ? "llm" : "rule-based",
  });
}
