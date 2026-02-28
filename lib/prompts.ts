import type { UserProfile, SkillGapMap } from './types';

export const CV_PARSING_PROMPT = `You are an expert career analyst specialising in the Hong Kong job market.

Given the following raw text extracted from a CV/resume, extract a structured profile. Pay special attention to:
- Hong Kong-specific roles, firms, and certifications
- Bilingual capabilities (English/Cantonese/Mandarin)
- Regional regulatory knowledge (SFC, HKMA, HKICPA, etc.)
- Seniority signals (years at firm, progression, title changes)

Return a JSON object matching this exact structure:
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

export const SKILL_DIAGNOSIS_PROMPT = `You are an expert career intelligence analyst specialising in the Hong Kong job market in 2025-2026.

Given this professional profile, generate a comprehensive Skill Gap Map.

CRITICAL: Compare this person ONLY to other Hong Kong professionals in the SAME role and SAME industry. Do NOT compare across different fields. For example, if they are a Senior Accountant in Finance/Accounting, compare only to other accountants and finance professionals in HK — not to lawyers, tech workers, or other industries. The skill list and market demand must be specific to their role and industry.

PROFESSIONAL PROFILE:
{userProfile}

YOUR TASK:
1. List EVERY relevant skill for someone in THIS specific role and THIS specific industry in Hong Kong (no generic or cross-industry skills)
2. For each skill, assess:
   - userLevel (0-100): How proficient is this person based on their CV/input?
   - marketDemand (0-100): How much does the current HK market demand this skill?
   - demandTrend: Is demand "rising", "stable", or "declining"?
   - status:
     * "strong" = userLevel >= 60 AND marketDemand >= 50 AND trend != "declining"
     * "fading" = userLevel >= 40 BUT (marketDemand < 50 OR trend == "declining")
     * "missing" = userLevel < 40 AND marketDemand >= 50
   - priority: "critical" if missing + high demand, "important" if fading, "nice_to_have" otherwise
   - reasoning: One sentence explaining the assessment
   - timeToAcquire: Estimated time to reach competency if missing/fading

3. Generate industryInsights: 3-5 sentences about what's changing in their specific industry in Hong Kong RIGHT NOW (regulatory changes, AI disruption, new frameworks, hiring trends)

4. Calculate overallReadiness: weighted average considering market demand

5. Generate peerComparison: A realistic estimate like "Based on your profile, you're likely ahead of ~X% of Hong Kong [role] professionals in [industry] in terms of future-readiness" — peers must be in the SAME role and industry

IMPORTANT HONG KONG CONTEXT:
- Consider HKMA, SFC, HKEX, HKICPA, Law Society of HK regulatory requirements
- Consider the Greater Bay Area integration trends
- Consider the HK government's push for fintech, Web3, smart city initiatives
- Consider AI disruption specific to HK industries
- Consider bilingual (English/Chinese) requirements
- Consider competition from mainland China professionals

Include at least 12-20 skills in your assessment. Cover technical skills, soft skills, tools, certifications, and domain knowledge.

Return as JSON matching the SkillGapMap type exactly. Include: userId (generate a short UUID), generatedAt (ISO date), industry, role, overallReadiness, skills (array), strongCount, fadingCount, missingCount, topPriorities (array of 3 strings), industryInsights (array of strings), peerComparison.`;

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
