import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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

const PROVIDERS = [
  "Metro General Hospital",
  "St. Mary Medical Center",
  "Urban Health Clinic",
  "Pacific Coast Medical",
  "Eastside Specialty Center",
  "Valley Regional Hospital",
  "Downtown Urgent Care",
  "Lakeside Physicians Group",
];

const PROCEDURES = [
  { code: "99213", name: "Office Visit - Established Patient", cpt: "99213", icd: "Z00.00" },
  { code: "99214", name: "Office Visit - Complex", cpt: "99214", icd: "E11.9" },
  { code: "99283", name: "Emergency Visit - Moderate", cpt: "99283", icd: "R50.9" },
  { code: "99284", name: "Emergency Visit - High", cpt: "99284", icd: "J18.9" },
  { code: "36415", name: "Venipuncture", cpt: "36415", icd: "Z01.89" },
  { code: "71046", name: "Chest X-Ray 2 Views", cpt: "71046", icd: "R05.9" },
  { code: "70553", name: "Brain MRI with Contrast", cpt: "70553", icd: "G43.909" },
  { code: "93000", name: "Electrocardiogram", cpt: "93000", icd: "I10" },
  { code: "80053", name: "Comprehensive Metabolic Panel", cpt: "80053", icd: "E11.9" },
  { code: "85025", name: "Complete Blood Count", cpt: "85025", icd: "D64.9" },
  { code: "43239", name: "Upper GI Endoscopy", cpt: "43239", icd: "K21.0" },
  { code: "45378", name: "Colonoscopy Diagnostic", cpt: "45378", icd: "Z12.11" },
  { code: "27447", name: "Total Knee Replacement", cpt: "27447", icd: "M17.11" },
  { code: "27130", name: "Total Hip Replacement", cpt: "27130", icd: "M16.11" },
  { code: "66984", name: "Cataract Surgery", cpt: "66984", icd: "H25.11" },
];

const FIRST_NAMES = [
  "James", "Maria", "Robert", "Jennifer", "Michael",
  "Linda", "William", "Patricia", "David", "Elizabeth",
  "Richard", "Barbara", "Joseph", "Susan", "Thomas",
  "Sarah", "Charles", "Karen", "Daniel", "Nancy",
  "Matthew", "Lisa", "Anthony", "Betty", "Mark",
  "Sandra", "Steven", "Dorothy", "Paul", "Ashley",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones",
  "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris",
  "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAmount(): number {
  return Math.round((Math.random() * 15000 + 50) * 100) / 100;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomInsuranceId(): string {
  const prefix = randomItem(["BCBS", "AETNA", "UHC", "CIGNA", "HUMANA", "Kaiser"]);
  const num = Math.floor(Math.random() * 900000000 + 100000000);
  return `${prefix}-${num}`;
}

function generateClaimNumber(index: number): string {
  return `CLM-${String(2024000 + index).padStart(7, "0")}`;
}

async function main() {
  console.log("Seeding database...");

  // Clean up
  await prisma.claim.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  const hashedPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.create({
    data: {
      email: "admin@rcm-demo.com",
      name: "Dr. Sarah Chen",
      password: hashedPassword,
      role: "admin",
    },
  });

  console.log("Created admin user: admin@rcm-demo.com / admin123");

  // Create patients
  const patients = [];
  for (let i = 0; i < 50; i++) {
    const patient = await prisma.patient.create({
      data: {
        firstName: randomItem(FIRST_NAMES),
        lastName: randomItem(LAST_NAMES),
        dateOfBirth: randomDate(new Date("1940-01-01"), new Date("2000-12-31")),
        gender: randomItem(["Male", "Female"]),
        insuranceId: randomInsuranceId(),
        phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        email: `patient${i + 1}@email.com`,
        address: `${Math.floor(Math.random() * 9999) + 100} ${randomItem(["Oak", "Maple", "Cedar", "Elm", "Pine"])} ${randomItem(["St", "Ave", "Blvd", "Dr"])}`,
      },
    });
    patients.push(patient);
  }

  console.log(`Created ${patients.length} patients`);

  // Create claims
  const statuses = ["approved", "denied", "pending", "appealed"];
  const statusWeights = [0.45, 0.25, 0.20, 0.10]; // 45% approved, 25% denied, 20% pending, 10% appealed

  const claims = [];
  for (let i = 0; i < 200; i++) {
    const rand = Math.random();
    let status = "pending";
    let cumulative = 0;
    for (let j = 0; j < statuses.length; j++) {
      cumulative += statusWeights[j];
      if (rand < cumulative) {
        status = statuses[j];
        break;
      }
    }

    const procedure = randomItem(PROCEDURES);
    const denial = status === "denied" ? randomItem(DENIAL_REASONS) : null;
    const submittedDate = randomDate(new Date("2024-01-01"), new Date("2024-12-31"));

    const claim = await prisma.claim.create({
      data: {
        claimNumber: generateClaimNumber(i),
        patientId: randomItem(patients).id,
        provider: randomItem(PROVIDERS),
        procedureCode: procedure.code,
        procedureName: procedure.name,
        cptCode: procedure.cpt,
        icdCode: procedure.icd,
        amount: randomAmount(),
        status: status!,
        denialReason: denial?.reason ?? null,
        denialCategory: denial?.category ?? null,
        appealAction: status === "appealed" ? "Submitted additional documentation for review" : null,
        submittedDate,
        resolvedDate: status !== "pending" ? randomDate(submittedDate, new Date("2024-12-31")) : null,
      },
    });
    claims.push(claim);
  }

  console.log(`Created ${claims.length} claims`);
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
