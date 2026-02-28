import type { UserProfile, SkillGapMap, SkillAssessment, CareerRoadmap } from './types';

export const MOCK_PROFILE: UserProfile = {
  name: 'Sarah Chan',
  currentRole: 'Senior Accountant',
  industry: 'Finance',
  subSector: 'Accounting & Audit',
  seniorityLevel: 'senior',
  yearsExperience: 7,
  location: 'Hong Kong',
  hardSkills: ['Financial Reporting', 'HKFRS', 'Tax Compliance', 'Audit', 'Budgeting', 'Cost Analysis'],
  softSkills: ['Attention to Detail', 'Client Communication', 'Team Coordination'],
  tools: ['Excel', 'SAP', 'QuickBooks', 'PowerPoint'],
  certifications: ['HKICPA', 'CPA'],
  languages: ['English (Fluent)', 'Cantonese (Native)', 'Mandarin (Conversational)'],
  education: ['BBA Accounting, CUHK'],
  primaryGoal: 'unsure',
  weeklyHoursAvailable: 5,
  preferredFormats: ['audio', 'video'],
};

const MOCK_SKILLS: SkillAssessment[] = [
  { skillName: 'Financial Reporting', category: 'technical', userLevel: 85, marketDemand: 90, demandTrend: 'stable', status: 'strong', priority: 'nice_to_have', reasoning: 'Core competency with strong market demand.' },
  { skillName: 'HKFRS', category: 'technical', userLevel: 80, marketDemand: 85, demandTrend: 'stable', status: 'strong', priority: 'nice_to_have', reasoning: 'Essential for HK accounting roles.' },
  { skillName: 'Excel', category: 'tool', userLevel: 75, marketDemand: 70, demandTrend: 'stable', status: 'strong', priority: 'nice_to_have', reasoning: 'Solid foundation, still valued.' },
  { skillName: 'Tax Compliance', category: 'technical', userLevel: 70, marketDemand: 75, demandTrend: 'rising', status: 'strong', priority: 'nice_to_have', reasoning: 'HK tax landscape evolving.' },
  { skillName: 'PowerPoint', category: 'tool', userLevel: 60, marketDemand: 45, demandTrend: 'declining', status: 'fading', priority: 'nice_to_have', reasoning: 'Basic presentations less in demand.', timeToAcquire: 'N/A' },
  { skillName: 'QuickBooks', category: 'tool', userLevel: 55, marketDemand: 40, demandTrend: 'declining', status: 'fading', priority: 'nice_to_have', reasoning: 'SME tools being replaced by cloud solutions.', timeToAcquire: 'N/A' },
  { skillName: 'Python', category: 'technical', userLevel: 15, marketDemand: 75, demandTrend: 'rising', status: 'missing', priority: 'critical', reasoning: 'Automation and data analysis increasingly required.', timeToAcquire: '2-3 months' },
  { skillName: 'ESG Reporting', category: 'domain', userLevel: 20, marketDemand: 80, demandTrend: 'rising', status: 'missing', priority: 'critical', reasoning: 'HKEX listing rules now mandate ESG disclosure.', timeToAcquire: '1-2 months' },
  { skillName: 'Data Analytics', category: 'technical', userLevel: 25, marketDemand: 85, demandTrend: 'rising', status: 'missing', priority: 'critical', reasoning: 'Finance teams need data-driven insights.', timeToAcquire: '2-3 months' },
  { skillName: 'AI/ML for Finance', category: 'technical', userLevel: 5, marketDemand: 70, demandTrend: 'rising', status: 'missing', priority: 'important', reasoning: 'Emerging skill for future finance roles.', timeToAcquire: '3-4 months' },
  { skillName: 'Power BI / Tableau', category: 'tool', userLevel: 20, marketDemand: 65, demandTrend: 'rising', status: 'missing', priority: 'important', reasoning: 'Visualisation skills in high demand.', timeToAcquire: '1-2 months' },
  { skillName: 'Strategic Leadership', category: 'soft', userLevel: 45, marketDemand: 80, demandTrend: 'stable', status: 'missing', priority: 'important', reasoning: 'Needed for senior progression.', timeToAcquire: '6-12 months' },
];

export const MOCK_SKILL_GAP_MAP: SkillGapMap = {
  userId: 'mock-sarah-001',
  generatedAt: new Date().toISOString(),
  industry: 'Finance',
  role: 'Senior Accountant',
  overallReadiness: 58,
  skills: MOCK_SKILLS,
  strongCount: 4,
  fadingCount: 2,
  missingCount: 6,
  topPriorities: ['Python', 'ESG Reporting', 'Data Analytics'],
  industryInsights: [
    'HKEX has mandated ESG reporting for listed companies — accountants with ESG expertise are in high demand.',
    'AI and automation are transforming audit and compliance — manual processes are being phased out.',
    'Greater Bay Area integration is creating demand for bilingual professionals with mainland exposure.',
    'Data analytics and Python skills are becoming table stakes for senior finance roles.',
    'Regulatory focus on fintech and digital assets requires new compliance knowledge.',
  ],
  peerComparison: "Based on your profile, you're likely ahead of ~55% of Hong Kong accountants in terms of future-readiness.",
};

export const MOCK_ROADMAPS: CareerRoadmap[] = [
  {
    pathType: 'stay_dominate',
    title: 'Stay & Dominate',
    subtitle: 'Close critical gaps. Become indispensable.',
    timeline: '3-6 months',
    weeklyCommitment: '4-5 hours/week',
    targetOutcome: 'Master ESG reporting and data analytics to secure your current role',
    milestones: [
      { week: 2, title: 'ESG Foundations', description: 'Complete HKEX ESG reporting overview', skillsTargeted: ['ESG Reporting'], assessmentType: 'quiz' },
      { week: 6, title: 'Data Basics', description: 'Excel to Power BI transition', skillsTargeted: ['Data Analytics'], assessmentType: 'project' },
      { week: 12, title: 'Python for Finance', description: 'Automate reporting workflows', skillsTargeted: ['Python'], assessmentType: 'project' },
      { week: 18, title: 'Integration Project', description: 'End-to-end ESG + data project', skillsTargeted: ['ESG Reporting', 'Data Analytics'], assessmentType: 'project' },
    ],
    weeklyPlan: [
      {
        weekNumber: 1,
        theme: 'ESG & HKEX Rules',
        estimatedHours: 5,
        assessmentIncluded: false,
        tasks: [
          { title: 'HKEX ESG Listing Rules Overview', format: 'video', duration: '45 min', description: 'Understand mandatory disclosure requirements', skillTargeted: 'ESG Reporting', difficulty: 'beginner' },
          { title: 'ESG Reporting Frameworks (GRI, SASB)', format: 'reading', duration: '30 min', description: 'Global standards used in HK', skillTargeted: 'ESG Reporting', difficulty: 'beginner' },
          { title: 'Case Study: HK Listed Company ESG Report', format: 'reading', duration: '45 min', description: 'Analyse a real HKEX report', skillTargeted: 'ESG Reporting', difficulty: 'intermediate' },
        ],
      },
      {
        weekNumber: 2,
        theme: 'Data Foundations',
        estimatedHours: 5,
        assessmentIncluded: true,
        tasks: [
          { title: 'Power BI Getting Started', format: 'video', duration: '60 min', description: 'Install and connect to Excel data', skillTargeted: 'Data Analytics', difficulty: 'beginner' },
          { title: 'Build Your First Dashboard', format: 'interactive', duration: '90 min', description: 'Create a financial KPI dashboard', skillTargeted: 'Data Analytics', difficulty: 'beginner' },
          { title: 'ESG Quiz', format: 'quiz', duration: '15 min', description: 'Test your ESG knowledge', skillTargeted: 'ESG Reporting', difficulty: 'beginner' },
        ],
      },
      {
        weekNumber: 3,
        theme: 'Python Basics',
        estimatedHours: 5,
        assessmentIncluded: false,
        tasks: [
          { title: 'Python for Absolute Beginners', format: 'video', duration: '45 min', description: 'Variables, loops, functions', skillTargeted: 'Python', difficulty: 'beginner' },
          { title: 'Pandas for Financial Data', format: 'video', duration: '60 min', description: 'Read Excel, filter, aggregate', skillTargeted: 'Python', difficulty: 'beginner' },
          { title: 'Practice: Parse a Trial Balance', format: 'practice', duration: '60 min', description: 'Load and summarise TB with pandas', skillTargeted: 'Python', difficulty: 'intermediate' },
        ],
      },
      {
        weekNumber: 4,
        theme: 'Integration',
        estimatedHours: 5,
        assessmentIncluded: true,
        tasks: [
          { title: 'Combine ESG + Data in Power BI', format: 'interactive', duration: '90 min', description: 'Build ESG metrics dashboard', skillTargeted: 'Data Analytics', difficulty: 'intermediate' },
          { title: 'Python Data Pipeline', format: 'practice', duration: '90 min', description: 'Automate data extraction', skillTargeted: 'Python', difficulty: 'intermediate' },
          { title: 'Week 4 Reflection', format: 'reflection', duration: '20 min', description: 'Document learnings and next steps', skillTargeted: 'Data Analytics', difficulty: 'beginner' },
        ],
      },
    ],
  },
  {
    pathType: 'level_up',
    title: 'Level Up',
    subtitle: 'Prepare for your next career milestone.',
    timeline: '6-12 months',
    weeklyCommitment: '4-5 hours/week',
    targetOutcome: 'Become a Finance Manager or Senior Finance Business Partner',
    milestones: [
      { week: 4, title: 'Strategic Mindset', description: 'Business partnering fundamentals', skillsTargeted: ['Strategic Leadership'], assessmentType: 'reflection' },
      { week: 12, title: 'Data-Driven Decisions', description: 'Full analytics stack', skillsTargeted: ['Data Analytics', 'Python'], assessmentType: 'project' },
      { week: 24, title: 'ESG & Compliance', description: 'Lead ESG initiatives', skillsTargeted: ['ESG Reporting'], assessmentType: 'project' },
      { week: 36, title: 'Leadership Capstone', description: 'Present to exec team', skillsTargeted: ['Strategic Leadership'], assessmentType: 'project' },
    ],
    weeklyPlan: [
      {
        weekNumber: 1,
        theme: 'Business Partnering',
        estimatedHours: 5,
        assessmentIncluded: false,
        tasks: [
          { title: 'Finance Business Partner Role', format: 'video', duration: '45 min', description: 'What senior finance looks like', skillTargeted: 'Strategic Leadership', difficulty: 'beginner' },
          { title: 'Stakeholder Communication', format: 'reading', duration: '30 min', description: 'Influence without authority', skillTargeted: 'Strategic Leadership', difficulty: 'beginner' },
          { title: 'HK Market: Finance Manager Salaries', format: 'reading', duration: '20 min', description: 'Benchmark expectations', skillTargeted: 'Strategic Leadership', difficulty: 'beginner' },
        ],
      },
      {
        weekNumber: 2,
        theme: 'Data for Decisions',
        estimatedHours: 5,
        assessmentIncluded: false,
        tasks: [
          { title: 'Power BI Advanced', format: 'video', duration: '60 min', description: 'DAX and data modelling', skillTargeted: 'Data Analytics', difficulty: 'intermediate' },
          { title: 'Build Variance Analysis Dashboard', format: 'interactive', duration: '90 min', description: 'Budget vs actual visualisation', skillTargeted: 'Data Analytics', difficulty: 'intermediate' },
        ],
      },
      {
        weekNumber: 3,
        theme: 'Python for Finance',
        estimatedHours: 5,
        assessmentIncluded: false,
        tasks: [
          { title: 'Python Financial Analysis', format: 'video', duration: '60 min', description: 'Ratio analysis automation', skillTargeted: 'Python', difficulty: 'intermediate' },
          { title: 'Automate Monthly Report', format: 'practice', duration: '90 min', description: 'Script to generate standard report', skillTargeted: 'Python', difficulty: 'intermediate' },
        ],
      },
      {
        weekNumber: 4,
        theme: 'Reflection & Planning',
        estimatedHours: 5,
        assessmentIncluded: true,
        tasks: [
          { title: '30-Day Reflection', format: 'reflection', duration: '30 min', description: 'Progress and gaps', skillTargeted: 'Strategic Leadership', difficulty: 'beginner' },
          { title: 'Create 90-Day Plan', format: 'practice', duration: '45 min', description: 'Map skills to promotion criteria', skillTargeted: 'Strategic Leadership', difficulty: 'intermediate' },
        ],
      },
    ],
  },
  {
    pathType: 'pivot',
    title: 'Pivot',
    subtitle: 'Transition into Fintech / Data.',
    timeline: '12-18 months',
    weeklyCommitment: '4-5 hours/week',
    targetOutcome: 'Move into Fintech analytics or ESG advisory',
    milestones: [
      { week: 8, title: 'Fintech Landscape', description: 'HK fintech ecosystem', skillsTargeted: ['Fintech Knowledge'], assessmentType: 'quiz' },
      { week: 20, title: 'Data & Python', description: 'Core technical skills', skillsTargeted: ['Python', 'Data Analytics'], assessmentType: 'project' },
      { week: 36, title: 'ESG Advisory', description: 'Consulting-style project', skillsTargeted: ['ESG Reporting'], assessmentType: 'project' },
      { week: 52, title: 'Portfolio Project', description: 'End-to-end case study', skillsTargeted: ['Python', 'Data Analytics', 'ESG Reporting'], assessmentType: 'project' },
    ],
    weeklyPlan: [
      {
        weekNumber: 1,
        theme: 'Fintech 101',
        estimatedHours: 5,
        assessmentIncluded: false,
        tasks: [
          { title: 'HK Fintech Ecosystem', format: 'video', duration: '45 min', description: 'HKMA, SFC, virtual banks', skillTargeted: 'domain', difficulty: 'beginner' },
          { title: 'Stablecoin & Digital Assets', format: 'reading', duration: '40 min', description: 'HK regulatory framework', skillTargeted: 'domain', difficulty: 'beginner' },
          { title: 'Career Paths: Accountant to Fintech', format: 'reading', duration: '25 min', description: 'Transition stories', skillTargeted: 'domain', difficulty: 'beginner' },
        ],
      },
      {
        weekNumber: 2,
        theme: 'Python Foundations',
        estimatedHours: 5,
        assessmentIncluded: false,
        tasks: [
          { title: 'Python Crash Course', format: 'video', duration: '90 min', description: 'Core syntax and data structures', skillTargeted: 'Python', difficulty: 'beginner' },
          { title: 'Jupyter for Analysis', format: 'interactive', duration: '45 min', description: 'Notebook workflow', skillTargeted: 'Python', difficulty: 'beginner' },
        ],
      },
      {
        weekNumber: 3,
        theme: 'Data Analytics',
        estimatedHours: 5,
        assessmentIncluded: false,
        tasks: [
          { title: 'SQL for Analysts', format: 'video', duration: '60 min', description: 'Queries for financial data', skillTargeted: 'Data Analytics', difficulty: 'beginner' },
          { title: 'Power BI + Python', format: 'video', duration: '45 min', description: 'Integrate Python scripts', skillTargeted: 'Data Analytics', difficulty: 'intermediate' },
        ],
      },
      {
        weekNumber: 4,
        theme: 'ESG Bridge',
        estimatedHours: 5,
        assessmentIncluded: true,
        tasks: [
          { title: 'ESG in Fintech', format: 'reading', duration: '40 min', description: 'Green finance, sustainable fintech', skillTargeted: 'ESG Reporting', difficulty: 'beginner' },
          { title: 'Fintech Quiz', format: 'quiz', duration: '15 min', description: 'Test HK fintech knowledge', skillTargeted: 'domain', difficulty: 'beginner' },
        ],
      },
    ],
  },
];
