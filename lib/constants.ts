export const INDUSTRIES = [
  'Finance',
  'Legal',
  'Accounting',
  'Technology',
  'Marketing',
  'Logistics',
  'Healthcare',
  'Education',
  'Real Estate',
  'Retail',
  'F&B',
  'Government',
  'Other',
] as const;

export const SUB_SECTORS: Record<string, string[]> = {
  Finance: ['Investment Banking', 'Asset Management', 'Private Banking', 'Fintech', 'Insurance', 'Wealth Management', 'Other'],
  Legal: ['Corporate Law', 'Litigation', 'IP', 'Real Estate Law', 'Compliance', 'Other'],
  Accounting: ['Audit', 'Tax', 'Management Accounting', 'Financial Reporting', 'Other'],
  Technology: ['Software Development', 'Data Science', 'Cybersecurity', 'Cloud', 'Product', 'Other'],
  Marketing: ['Digital Marketing', 'Brand', 'Content', 'Performance', 'Other'],
  Logistics: ['Supply Chain', 'Procurement', 'Operations', 'Other'],
  Healthcare: ['Clinical', 'Pharma', 'Healthcare Admin', 'Other'],
  Education: ['K-12', 'Higher Ed', 'EdTech', 'Other'],
  'Real Estate': ['Development', 'Agency', 'Property Management', 'Other'],
  Retail: ['E-commerce', 'Store Operations', 'Merchandising', 'Other'],
  'F&B': ['Restaurant', 'Catering', 'Food Production', 'Other'],
  Government: ['Policy', 'Public Service', 'Regulatory', 'Other'],
  Other: ['Other'],
};

export const SENIORITY_OPTIONS = [
  { value: 'junior' as const, label: 'Junior (0-2 yr)', years: '0-2' },
  { value: 'mid' as const, label: 'Mid (2-5 yr)', years: '2-5' },
  { value: 'senior' as const, label: 'Senior (5-10 yr)', years: '5-10' },
  { value: 'lead' as const, label: 'Lead (10-15 yr)', years: '10-15' },
  { value: 'executive' as const, label: 'Executive (15+ yr)', years: '15+' },
];

export const GOAL_OPTIONS = [
  { value: 'stay_dominate' as const, label: 'Secure my current role', description: 'Close gaps, become indispensable' },
  { value: 'level_up' as const, label: 'Get promoted', description: 'Prepare for next level' },
  { value: 'pivot' as const, label: 'Change careers', description: 'Transition to new field' },
  { value: 'unsure' as const, label: 'Not sure yet', description: 'Show me all options' },
];

export const LEARNING_FORMATS = [
  { value: 'video' as const, label: 'Video' },
  { value: 'audio' as const, label: 'Audio/Podcasts' },
  { value: 'reading' as const, label: 'Reading/Articles' },
  { value: 'interactive' as const, label: 'Interactive/Hands-on' },
];

export const LANGUAGES = ['English', 'Cantonese', 'Mandarin', 'Other'] as const;

export const PROFICIENCY_LEVELS = ['Native', 'Fluent', 'Conversational', 'Basic'] as const;

// Skill suggestions by industry (sample - can be expanded)
export const SKILL_SUGGESTIONS: Record<string, string[]> = {
  Finance: ['Financial Modeling', 'Valuation', 'HKFRS', 'SFC Compliance', 'Excel', 'Bloomberg', 'Python', 'Risk Management'],
  Legal: ['Contract Drafting', 'Legal Research', 'HK Law', 'Compliance', 'Due Diligence', 'Negotiation'],
  Accounting: ['HKFRS', 'Tax Compliance', 'Audit', 'Financial Reporting', 'Excel', 'SAP', 'HKICPA'],
  Technology: ['JavaScript', 'Python', 'React', 'Cloud (AWS/Azure)', 'SQL', 'DevOps', 'Agile'],
  Marketing: ['Digital Marketing', 'SEO', 'Analytics', 'Content Strategy', 'Social Media', 'Brand Management'],
  default: ['Communication', 'Leadership', 'Problem Solving', 'Project Management', 'Excel', 'Data Analysis'],
};
