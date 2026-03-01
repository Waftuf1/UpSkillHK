export interface UserProfile {
  // From manual input or CV parsing
  name?: string;
  currentRole: string;
  industry: string;
  subSector?: string;
  seniorityLevel: 'junior' | 'mid' | 'senior' | 'lead' | 'executive';
  yearsExperience: number;
  location: string; // default "Hong Kong"

  // Skills extracted
  hardSkills: string[];
  softSkills: string[];
  tools: string[];
  certifications: string[];
  languages: string[];
  education: string[];

  // Career goals (user selects)
  primaryGoal: 'stay_dominate' | 'level_up' | 'pivot' | 'unsure';
  targetRole?: string;
  weeklyHoursAvailable: number; // hours per week for learning
  preferredFormats: ('video' | 'audio' | 'reading' | 'interactive')[];
}

export interface SkillAssessment {
  skillName: string;
  category: 'technical' | 'soft' | 'tool' | 'certification' | 'domain';
  userLevel: number;        // 0-100, estimated from CV/input
  marketDemand: number;     // 0-100, current HK market demand
  demandTrend: 'rising' | 'stable' | 'declining';
  status: 'strong' | 'fading' | 'missing';
  priority: 'critical' | 'important' | 'nice_to_have';
  reasoning: string;        // AI explanation of why this status
  timeToAcquire?: string;   // e.g. "2-3 weeks", "2 months"
}

export interface FutureForecastItem {
  title: string;
  explanation?: string;   // why this skill is increasing in importance
  dataUsed?: string;      // description of data used to form the forecast
  links?: string[];       // URLs to sources (job boards, reports, regulatory pages)
}

export interface ReadinessRubric {
  skillCoverage: number;     // 0-30: % of skills that are strong
  criticalGaps: number;      // 0-25: penalty for missing critical skills
  proficiencyDepth: number;  // 0-20: how deep your strong skills are vs demand
  trendAlignment: number;    // 0-15: are your strong skills rising in demand
  fadingRisk: number;        // 0-10: penalty for fading/obsolete skills
}

export interface SkillGapMap {
  userId: string;
  generatedAt: string;
  industry: string;
  role: string;
  overallReadiness: number;  // 0-100 score
  rubric: ReadinessRubric;   // transparent breakdown of how score was computed
  skills: SkillAssessment[];
  strongCount: number;
  fadingCount: number;
  missingCount: number;
  topPriorities: string[];   // top 3 skills to learn NOW
  industryInsights: string[]; // 3-5 bullet points about industry trends
  peerComparison: string;    // "You're ahead of ~65% of HK accountants"
  futureForecast?: string[]; // short list for display
  futureForecastDetail?: FutureForecastItem[]; // in-depth: explanation, data used, links
}

export interface CareerRoadmap {
  pathType: 'stay_dominate' | 'level_up' | 'pivot';
  title: string;
  subtitle: string;
  timeline: string;          // "3-6 months"
  weeklyCommitment: string;  // "4-5 hours/week"
  targetOutcome: string;
  milestones: Milestone[];
  weeklyPlan: WeekPlan[];
}

export interface Milestone {
  week: number;
  title: string;
  description: string;
  skillsTargeted: string[];
  assessmentType: 'quiz' | 'project' | 'reflection';
}

export interface WeekPlan {
  weekNumber: number;
  theme: string;
  tasks: LearningTask[];
  estimatedHours: number;
  assessmentIncluded: boolean;
}

export interface LearningResource {
  type: 'video' | 'article' | 'course' | 'tool';
  title: string;
  description?: string;
  url?: string;
}

export interface LearningTask {
  title: string;
  format: 'video' | 'audio' | 'reading' | 'interactive' | 'practice' | 'quiz' | 'reflection';
  duration: string;         // "8 min", "30 min"
  description: string;
  skillTargeted: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  learningGuide?: string;
  resources?: LearningResource[];
}
