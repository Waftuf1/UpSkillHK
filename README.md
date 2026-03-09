# UpSkill HK

AI-powered career skill diagnosis for Hong Kong. Upload your CV or answer a few questions, get a skill gap analysis, and receive three personalised career roadmaps — Stay & Dominate, Level Up, or Pivot.

## What it does

- **CV parsing** — Upload a PDF or DOCX resume; we extract skills, experience, and education
- **Skill gap map** — See which skills are strong, fading, or missing vs. HK market demand
- **3 career paths** — Stay & Dominate, Level Up, or Pivot with week-by-week learning plans
- **Auth** — Sign up / log in with Firebase

## Tech stack

- **Framework:** Next.js 14, React 18
- **AI:** AWS Bedrock (Amazon Nova)
- **Auth & DB:** Firebase
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Animations:** Framer Motion

## How to run

### Prerequisites

- Node.js 18+
- Firebase project
- AWS Bedrock API key ([create one](https://console.aws.amazon.com/bedrock/) → API keys)

### Setup

```bash
# Clone and install
git clone https://github.com/Waftuf1/UpSkillHK.git
cd UpSkillHK
npm install

# Copy env template and fill in your keys
cp .env.example .env.local
```

### Environment variables

Create `.env.local` with:

```env
# AWS Bedrock (required for AI features)
AWS_BEARER_TOKEN_BEDROCK=your-bedrock-api-key
# Optional: AWS_BEDROCK_REGION=us-east-1
# Optional: AWS_BEDROCK_MODEL=amazon.nova-pro-v1:0

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for production

```bash
npm run build
npm start
```

## Deploy

Deploys to [Vercel](https://vercel.com). Add the same env vars in your Vercel project settings.

## License

MIT
