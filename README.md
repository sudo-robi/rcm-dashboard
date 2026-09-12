# RCM Dashboard — Healthcare Revenue Cycle Management

A full-stack healthcare Revenue Cycle Management (RCM) demo dashboard built with **Next.js 15**, **TypeScript**, **Prisma ORM**, **PostgreSQL**, and **Tailwind CSS**.

## Features

### Dashboard
- Real-time claims statistics (total, approved, denied, pending, appealed)
- Approval and denial rate calculations
- Revenue collected vs pending revenue
- Interactive pie chart for claims by status
- Bar chart showing denial reasons by category
- Recent claims table with status badges

### Claims Management
- Paginated claims table with search and filtering
- Filter by status: All, Approved, Denied, Pending, Appealed
- Search by claim number, patient name, or provider
- Detailed claim view with patient info, claim info, and denial details

### AI-Powered Denial Analysis
- One-click denial analysis for rejected claims
- Rule-based analysis engine (works without API key)
- OpenAI GPT-4o-mini integration for enhanced analysis (optional)
- Recommended appeal actions with step-by-step guidance
- Prevention tips for future claims
- Estimated appeal success likelihood

### Authentication
- NextAuth.js with credentials provider
- Session management with JWT
- Protected routes

### Database
- PostgreSQL with Prisma ORM
- Seeded with 200 realistic claims and 50 patients
- Medical codes (CPT, ICD-10), providers, and denial categories

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui components |
| Charts | Recharts |
| Backend | Next.js API Routes |
| Database | PostgreSQL, Prisma ORM 6 |
| Auth | NextAuth.js v5 (beta) |
| LLM | OpenAI API (optional, falls back to rule-based) |
| Testing | Jest, React Testing Library |
| CI/CD | GitHub Actions |

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL running locally

### Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/rcm-dashboard.git
cd rcm-dashboard

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Push database schema
npx prisma db push

# Seed with mock data
npx tsx prisma/seed.ts

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Credentials
- **Email:** admin@rcm-demo.com
- **Password:** admin123

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Dashboard statistics and chart data |
| GET | `/api/claims` | Paginated claims with filters |
| GET | `/api/claims/[id]` | Single claim details |
| PATCH | `/api/claims/[id]` | Update claim status |
| POST | `/api/analyze-denial` | AI-powered denial analysis |
| POST | `/api/auth/callback/credentials` | Authentication |

## Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/rcm_dashboard"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-..." # Optional: enables GPT-4o-mini analysis
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Type check
npx tsc --noEmit
```

## CI/CD

GitHub Actions workflow runs on every push and PR:
1. **Lint** — ESLint code quality checks
2. **Type Check** — TypeScript compilation verification
3. **Tests** — Jest unit and integration tests
4. **Build** — Production build verification

## Project Structure

```
rcm-dashboard/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Mock data seeder
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   ├── claims/            # Claims pages
│   │   ├── login/             # Login page
│   │   └── page.tsx           # Dashboard
│   ├── components/            # Reusable UI components
│   ├── lib/                   # Utilities and config
│   └── __tests__/             # Test suites
├── .github/workflows/ci.yml   # CI/CD pipeline
└── package.json
```

## License

MIT
