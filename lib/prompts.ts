import type { UserProfile, SkillGapMap } from './types';

export const CV_PARSING_PROMPT = `You are an expert career analyst specialising in the Hong Kong job market.

Given the following raw text extracted from a CV/resume, extract a structured profile. Pay special attention to:
- Hong Kong-specific roles, firms, and certifications
- Bilingual capabilities (English/Cantonese/Mandarin)
- Regional regulatory knowledge (SFC, HKMA, HKICPA, etc.)
- Seniority signals (years at firm, progression, title changes)

Return ONLY a valid JSON object with no other text before or after. Use this exact structure:
{
  "name": "string or null",
  "currentRole": "most recent job title",
  "industry": "one of: Finance, Legal, Accounting, Technology, Marketing, Logistics, Healthcare, Education, Real Estate, Retail, F&B, Government, Other",
  "subSector": "more specific sector",
  "seniorityLevel": "junior | mid | senior | lead | executive",
  "yearsExperience": number,
  "hardSkills": ["list of technical/hard skills found"],
  "softSkills": ["list of soft skills inferred from responsibilities"],
  "tools": ["specific software, platforms, tools mentioned"],
  "certifications": ["professional certifications"],
  "languages": ["languages with proficiency level"],
  "education": ["degrees and institutions"]
}

Be thorough. Infer skills from job descriptions even if not explicitly listed.
For example, if someone managed a team of 10, infer "team management" and "leadership". If they prepared financial statements, infer "financial reporting", "HKFRS", "Excel".

RAW CV TEXT:
{cvText}`;

export const SKILL_DIAGNOSIS_PROMPT = `You are an HK job-market analyst. Be CONCISE. Return ONLY valid JSON — no markdown, no explanation.

PROFILE:
{userProfile}

RULES:
- Use real HK market data (JobsDB, HKMA, SFC, HKEX, salary surveys) for marketDemand.
- Past 5 years (2020-2025) informs demandTrend. Past 6 months (Aug 2025-Feb 2026) informs futureForecast.
- Status rules (check the CV strictly):
  "missing" = market wants it (marketDemand>=40) but NOT on CV → userLevel 0-15
  "fading" = IS on CV but market declining (marketDemand<40 OR demandTrend=="declining")
  "strong" = IS on CV AND market wants it (marketDemand>=40, not declining)
- priority: "critical" if missing+marketDemand>=60, "important" if missing/fading, "nice_to_have" if strong
- Do NOT compute overallReadiness — we compute it server-side from the skills data.

JSON STRUCTURE:
{ "userId":"gen-...", "generatedAt":"ISO", "industry":"", "role":"",
  "skills": [10-15 items: { "skillName":"", "category":"technical|soft|tool|certification|domain", "userLevel":0-100, "marketDemand":0-100, "demandTrend":"rising|stable|declining", "status":"missing|fading|strong", "priority":"critical|important|nice_to_have", "reasoning":"1 sentence", "timeToAcquire":"optional" }],
  "strongCount":n, "fadingCount":n, "missingCount":n,
  "topPriorities":["top 3 skill names"],
  "industryInsights":["3-4 short bullets on HK industry changes"],
  "peerComparison":"1 sentence",
  "futureForecast":["3-4 short titles"],
  "futureForecastDetail":[3-4 items: { "title":"", "explanation":"2 sentences with real evidence", "dataUsed":"specific source name", "links":["real_url"] }]
}`;

export const ROADMAP_GENERATION_PROMPT = `You are an expert career coach and learning path designer for Hong Kong professionals.

Given this Skill Gap Map and the user's preferences, generate THREE detailed career roadmaps.

SKILL GAP MAP:
{skillGapMap}

USER PREFERENCES:
- Weekly hours available: {weeklyHours}
- Preferred learning formats: {formats}
- Primary goal: {goal}
- Target role (if any): {targetRole}

Generate three paths:

PATH A - "Stay & Dominate" (3-6 months)
Close critical gaps. Become indispensable in current role.
Focus on: red/missing skills first, then yellow/fading skills.
Weekly commitment: {weeklyHours} hours.

PATH B - "Level Up" (6-12 months)
Prepare for next seniority level or adjacent senior role.
Focus on: strategic skills + leadership + missing technical skills.
Weekly commitment: {weeklyHours} hours.

PATH C - "Pivot" (12-18 months)
Transition to highest-growth adjacent field in HK.
Focus on: bridge skills + entirely new domain skills.
Weekly commitment: {weeklyHours} hours.

For each path, generate:
1. 4-6 milestones spread across the timeline
2. Detailed week-by-week plan for the FIRST 4 WEEKS (to show the user what the experience looks like)
3. Each week should have 4-6 specific learning tasks with:
   - Concrete titles (not vague)
   - Format (video/audio/reading/interactive/practice)
   - Duration
   - Which skill it targets
   - Difficulty level

Make tasks SPECIFIC to Hong Kong context where possible. Reference real frameworks, regulations, tools used in HK. For example:
- "Understanding HKMA's Stablecoin Regulatory Framework" not "Learn about crypto"
- "Python for HKEX Market Data Analysis" not "Learn Python basics"
- "ESG Reporting under HKEX Listing Rules" not "Learn about ESG"

Return as JSON: an array of 3 CareerRoadmap objects. Each must have: pathType, title, subtitle, timeline, weeklyCommitment, targetOutcome, milestones, weeklyPlan.`;

export function buildCVParsingPrompt(cvText: string): string {
  return CV_PARSING_PROMPT.replace('{cvText}', cvText);
}

export function buildSkillDiagnosisPrompt(profile: UserProfile): string {
  return SKILL_DIAGNOSIS_PROMPT.replace(
    '{userProfile}',
    JSON.stringify(profile, null, 2)
  );
}

export function buildRoadmapPrompt(
  skillGapMap: SkillGapMap,
  weeklyHours: number,
  formats: string[],
  goal: string,
  targetRole?: string
): string {
  return ROADMAP_GENERATION_PROMPT.replace('{skillGapMap}', JSON.stringify(skillGapMap, null, 2))
    .replace('{weeklyHours}', String(weeklyHours))
    .replace('{formats}', formats.join(', '))
    .replace('{goal}', goal)
    .replace('{targetRole}', targetRole || 'Not specified');
}
