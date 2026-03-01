import type { UserProfile, SkillGapMap } from './types';
import { SKILLS_TO_ASSESS } from './constants';

export const CV_PARSING_PROMPT = `You are an expert career analyst specialising in the Hong Kong job market.

Given the following raw text extracted from a CV/resume, extract a structured profile. Pay special attention to:
- Hong Kong-specific roles, firms, and certifications
- Bilingual capabilities (English/Cantonese/Mandarin)
- Regional regulatory knowledge (SFC, HKMA, HKICPA, etc.)
- Seniority signals (years at firm, progression, title changes)

First, determine if this document is actually a CV/resume. Set "isValidCV": false if it is NOT (e.g. receipt, contract, invoice, form letter, random document). A valid CV has work experience, job titles, skills, or education. Set "rejectionReason" when isValidCV is false (e.g. "This appears to be a receipt, not a CV").

Return ONLY a valid JSON object. Structure:
{
  "isValidCV": true or false,
  "rejectionReason": "string or null - required when isValidCV is false",
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

export const CV_PARSING_FROM_PDF_PROMPT = `You are an expert career analyst specialising in the Hong Kong job market.

Analyze the attached PDF document. It may be a text-based PDF or a scanned/image-based CV. Use your vision capabilities to read and extract all content.

Pay special attention to:
- Hong Kong-specific roles, firms, and certifications
- Bilingual capabilities (English/Cantonese/Mandarin)
- Regional regulatory knowledge (SFC, HKMA, HKICPA, etc.)
- Seniority signals (years at firm, progression, title changes)

First, determine if this document is actually a CV/resume. Set "isValidCV": false if it is NOT (e.g. receipt, contract, invoice, form letter, random document). A valid CV has work experience, job titles, skills, or education. Set "rejectionReason" when isValidCV is false.

Return ONLY a valid JSON object. Structure:
{
  "isValidCV": true or false,
  "rejectionReason": "string or null - required when isValidCV is false",
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

Be thorough. Infer skills from job descriptions even if not explicitly listed. Return ONLY the JSON object, no markdown or explanation.`;

export const SKILL_DIAGNOSIS_PROMPT = `You are an HK job-market analyst. Compare the user's CV to professionals in their field over the past 5 years (2020-2025). Be HONEST. Do NOT inflate. Return ONLY valid JSON — no markdown, no explanation.

DATA SOURCES: Base marketDemand, skills assessment, and reasoning ONLY on real job market data from:
- LinkedIn (HK job postings, profiles, skills)
- JobsDB (HK)
- Indeed (HK)
- Glassdoor (HK)
Do not invent or guess. Use what these platforms show for the user's role and industry.

PROFILE:
{userProfile}

BENCHMARK: Compare against CVs and skills of people in their role/industry over 2020-2025 (from the above sources):
- EMERGING (recently relevant): Skills that gained importance in the last 2-3 years — HKEX ESG, data/AI, GBA, digitalisation. High demand now.
- STALWART (consistent 5yr): Skills that have been standard for 5+ years — core technical, soft skills, tools. Most peers have these.
- LEGACY (fading): Skills that were common in the past but declining — manual processes, outdated tools, roles being automated.

For EACH skill, ask: What do professionals in this field typically have? Does this user have it? What do they LACK? What is slowly FADING on their CV vs the market?

userLevel STRICT (compare to peers — be honest):
- userLevel 0-15: NOT on CV or no clear evidence. Most peers have it? Mark "missing". userLevel 0-15.
- userLevel 20-40: Vague or weak evidence (one mention, "basic"). Peer CVs show more depth. Be cautious.
- userLevel 50-70: Solid — multiple roles, years, clear outcomes. Only when CV clearly matches typical peer level.
- userLevel 75-100: Standout — certifications, deep experience, central to role. Rare.
When in doubt, err LOWER. Compare to real peer CVs, not ideals.

demandTrend (based on 2020-2025):
- "rising" = more important now than 5 years ago
- "stable" = consistently important
- "declining" = less important now than before

Status:
- "missing" = market wants it (marketDemand>=40) but NOT on CV → userLevel 0-15
- "fading" = on CV but market/peers moving away (marketDemand<40 OR demandTrend=="declining")
- "strong" = on CV with solid evidence AND market wants it (marketDemand>=40, not declining)
- priority: "critical" if missing+marketDemand>=60, "important" if missing/fading, "nice_to_have" if strong

SKILLS: Assess EXACTLY these skills in this order. Do NOT add or remove any. For each, provide userLevel, marketDemand, demandTrend, status, priority, reasoning. In reasoning, cite: LinkedIn/JobsDB/Indeed/Glassdoor, CV evidence.

SKILLS TO ASSESS (in order):
{skillsList}

Do NOT compute overallReadiness — we compute it server-side.

JSON STRUCTURE:
{ "userId":"gen-...", "generatedAt":"ISO", "industry":"", "role":"",
  "skills": [EXACTLY {skillCount} items in the SAME ORDER as above: { "skillName":"", "category":"technical|soft|tool|certification|domain", "userLevel":0-100, "marketDemand":0-100, "demandTrend":"rising|stable|declining", "status":"missing|fading|strong", "priority":"critical|important|nice_to_have", "reasoning":"1 sentence", "timeToAcquire":"optional for missing" }],
  "strongCount":n, "fadingCount":n, "missingCount":n,
  "topPriorities":["top 3 skill names to learn now"],
  "industryInsights":["3-4 short bullets on HK industry changes from LinkedIn/JobsDB/Indeed/Glassdoor"],
  "peerComparison":"1 honest sentence — where do they stand vs peers?",
  "futureForecast":["3-4 short titles"],
  "futureForecastDetail":[3-4 items: { "title":"", "explanation":"2 sentences with evidence", "dataUsed":"LinkedIn/JobsDB/Indeed/Glassdoor", "links":["url"] }]
}

CRITICAL: Output ONLY the JSON object. No markdown, no \`\`\`json, no text before or after. Valid JSON only.`;

export const ROADMAP_GENERATION_PROMPT = `You are a career coach for Hong Kong professionals. Generate THREE concise career roadmaps. Be brief.

SKILL GAP MAP:
{skillGapMap}

PREFERENCES: {weeklyHours}h/week, formats: {formats}, goal: {goal}, targetRole: {targetRole}

Generate 3 paths (pathType: stay_dominate | level_up | pivot):

PATH A "Stay & Dominate" (3-6mo): Close critical gaps. pathType: "stay_dominate"
PATH B "Level Up" (6-12mo): Next seniority. pathType: "level_up"
PATH C "Pivot" (12-18mo): Adjacent field. pathType: "pivot"

For EACH path: title, subtitle, timeline, weeklyCommitment, targetOutcome, milestones (3-4), weeklyPlan (6-8 weeks, 2-3 tasks/week). Each task: title, format, duration, description, skillTargeted, difficulty, resources: [{ type, title, url }].

RESOURCES (required for each task): Provide 2-4 resources with REAL clickable URLs. Mix types:
- video: YouTube links (e.g. https://www.youtube.com/watch?v=... or https://www.youtube.com/results?search_query=...)
- article: docs, blog posts, official guides (e.g. MDN, official docs)
- course: Coursera, edX, HKU SPACE, Udemy links
- tool: interactive tools or practice sites
Each resource MUST have: type ("video"|"article"|"course"|"tool"), title (descriptive name), url (full https link). Prefer real URLs over search URLs when you know them. For niche topics, use YouTube search URLs like https://www.youtube.com/results?search_query=Code+Review+Best+Practices or Google search URLs. Do NOT provide resources without URLs — always include a url field.

suitableJobs: Generate 5–7 honest, realistic career paths or job titles the user could move into, based on:
- Their CV (current role, industry, years of experience)
- Their skills vs Hong Kong market demand (strong skills = near-term options; missing skills = longer-term or stretch roles)
- Be honest: include roles they can reach soon (strong fit), roles they could grow into (with skill gaps closed), and 1–2 stretch/aspirational roles if relevant
- Use clear, simple job titles (e.g. "Senior Accountant", "Financial Analyst", "Compliance Manager") — HK/GBA market terms
- No jargon. Easy to read.

Return ONLY valid JSON: { "roadmaps": [3 items], "suitableJobs": ["string"] }. No markdown.`;

export function buildCVParsingPrompt(cvText: string): string {
  return CV_PARSING_PROMPT.replace('{cvText}', cvText);
}

export function buildSkillDiagnosisPrompt(profile: UserProfile): string {
  const industry = profile.industry || 'Other';
  const baseSkills = SKILLS_TO_ASSESS[industry] || SKILLS_TO_ASSESS.Other;
  const fromProfile = [
    ...(profile.hardSkills || []),
    ...(profile.softSkills || []),
    ...(profile.tools || []),
    ...(profile.certifications || []),
  ].filter((s) => s && !baseSkills.some((b) => b.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(b.toLowerCase())));
  const extra = fromProfile.slice(0, 4);
  const skillsList = [...baseSkills, ...extra];
  const normalized = {
    ...profile,
    hardSkills: [...(profile.hardSkills || [])].sort(),
    softSkills: [...(profile.softSkills || [])].sort(),
    tools: [...(profile.tools || [])].sort(),
    certifications: [...(profile.certifications || [])].sort(),
    education: [...(profile.education || [])].sort(),
  };
  return SKILL_DIAGNOSIS_PROMPT.replace('{userProfile}', JSON.stringify(normalized, null, 2))
    .replace('{skillsList}', skillsList.map((s) => `- ${s}`).join('\n'))
    .replace(/{skillCount}/g, String(skillsList.length));
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
