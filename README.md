# UpSkill HK — AI-Powered Career Skill Diagnosis

An AI-powered career skill diagnosis tool for Hong Kong professionals. Get your personalised Skill Gap Map and three career roadmaps in under 2 minutes.

## Features

- **2 input methods**: Upload CV (PDF/DOCX) or answer quick questions
- **Skill Gap Map**: See which skills are 🟢 STRONG, 🟡 FADING, or 🔴 MISSING
- **3 career paths**: Stay & Dominate, Level Up, or Pivot
- **Week-by-week plans**: Detailed learning milestones with HK-specific content

## Tech Stack

- Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion
- OpenAI GPT-4o for AI analysis
- pdf-parse, mammoth for CV extraction
- recharts for visualisations

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment** (required for AI features)
   ```bash
   cp .env.local.example .env.local
   ```
   Add one of these to `.env.local` (get keys from the links):
   - **Poe**: `POE_API_KEY=...` — [poe.com/api/keys](https://poe.com/api/keys) (supports web search)
   - **OpenRouter**: `OPENROUTER_API_KEY=sk-or-v1-...` — [openrouter.ai/keys](https://openrouter.ai/keys)
   - **OpenAI**: `OPENAI_API_KEY=sk-...` — [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

3. **Run development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

4. **Test API key** (optional): `node scripts/test-api.mjs`

## Project Structure

```
app/
  page.tsx          # Landing
  onboarding/       # Step wizard
  diagnosis/        # Skill Gap Map results
  roadmap/          # 3 career paths
  api/
    parse-cv/       # CV parsing
    diagnose/       # Skill gap analysis
    roadmap/        # Career roadmap generation
components/
  ui/               # Button, Card, Badge, etc.
  onboarding/       # StepIndicator, RoleInput, CVUpload, etc.
  diagnosis/        # SkillGapMap, SkillCard, etc.
  roadmap/          # PathSelector, WeeklyPlan, etc.
lib/
  types.ts          # TypeScript interfaces
  openai.ts         # OpenAI client
  prompts.ts        # AI prompt templates
  mockData.ts       # Demo data
```

## Pushing to GitHub (for collaborators)

1. Create a new repo on GitHub (e.g. `UpSkillHK`).
2. Add the remote and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/UpSkillHK.git
   git branch -M main
   git push -u origin main
   ```
3. Friends can clone and contribute:
   ```bash
   git clone https://github.com/YOUR_USERNAME/UpSkillHK.git
   cd UpSkillHK
   npm install
   cp .env.local.example .env.local
   # Add their own API key to .env.local
   npm run dev
   ```

**Note:** `.env.local` is gitignored — each developer adds their own API key locally. Never commit real API keys.

## Deployment

Deploy to Vercel:

```bash
vercel
```

Add your API key (`POE_API_KEY`, `OPENROUTER_API_KEY`, or `OPENAI_API_KEY`) to your Vercel project environment variables.
