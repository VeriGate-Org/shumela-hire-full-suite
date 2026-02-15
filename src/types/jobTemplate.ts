export interface JobAdTemplate {
  id: string;
  name: string;
  description?: string;
  title: string;
  intro: string; // Rich text HTML
  responsibilities: string; // Rich text HTML
  requirements: string; // Rich text HTML
  benefits: string; // Rich text HTML
  location: string;
  employmentType: string;
  salaryRangeMin?: number;
  salaryRangeMax?: number;
  closingDate?: Date;
  contactEmail: string;
  isArchived: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number; // Track how many times template has been used
}

export interface JobAdDraft {
  id: string;
  templateId: string;
  requisitionId?: string;
  title: string;
  intro: string;
  responsibilities: string;
  requirements: string;
  benefits: string;
  location: string;
  employmentType: string;
  salaryRangeMin?: number;
  salaryRangeMax?: number;
  closingDate?: Date;
  contactEmail: string;
  status: 'draft' | 'published' | 'archived';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplatePlaceholder {
  key: string;
  label: string;
  description: string;
  example: string;
}

export interface RequisitionData {
  id: string;
  jobTitle: string;
  department: string;
  location: string;
  employmentType: string;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  createdBy: string;
}

export interface GenerateAdRequest {
  templateId: string;
  requisitionId?: string;
  customData?: Record<string, string>; // For custom placeholder values
}

export interface TemplateFilters {
  search?: string;
  employmentType?: string;
  location?: string;
  showArchived?: boolean;
  createdBy?: string;
}

export interface TemplateStats {
  totalTemplates: number;
  activeTemplates: number;
  archivedTemplates: number;
  mostUsedTemplate?: JobAdTemplate;
  recentlyCreated: JobAdTemplate[];
}

// Available placeholders for templates
export const TEMPLATE_PLACEHOLDERS: TemplatePlaceholder[] = [
  {
    key: '{{jobTitle}}',
    label: 'Job Title',
    description: 'The title of the position',
    example: 'Senior Software Engineer'
  },
  {
    key: '{{department}}',
    label: 'Department',
    description: 'The department or team',
    example: 'Engineering'
  },
  {
    key: '{{location}}',
    label: 'Location',
    description: 'Work location',
    example: 'San Francisco, CA'
  },
  {
    key: '{{employmentType}}',
    label: 'Employment Type',
    description: 'Type of employment',
    example: 'Full-time'
  },
  {
    key: '{{salaryRange}}',
    label: 'Salary Range',
    description: 'Salary range for the position',
    example: 'R80,000 - R120,000'
  },
  {
    key: '{{companyName}}',
    label: 'Company Name',
    description: 'Name of the company',
    example: 'TechCorp Inc.'
  },
  {
    key: '{{contactEmail}}',
    label: 'Contact Email',
    description: 'Contact email for applications',
    example: 'careers@company.com'
  },
  {
    key: '{{applicationDeadline}}',
    label: 'Application Deadline',
    description: 'Last date to apply',
    example: 'March 31, 2024'
  }
];

// Default template content for new templates
export const DEFAULT_TEMPLATE_CONTENT = {
  title: '{{jobTitle}} - {{department}}',
  intro: `<p>Join our dynamic team at <strong>{{companyName}}</strong> as a <strong>{{jobTitle}}</strong> in our {{department}} department. We're looking for a talented professional to help us drive innovation and excellence.</p>`,
  responsibilities: `<h3>Key Responsibilities:</h3>
<ul>
<li>Lead and contribute to projects that make a real impact</li>
<li>Collaborate with cross-functional teams</li>
<li>Mentor junior team members</li>
<li>Drive best practices and continuous improvement</li>
</ul>`,
  requirements: `<h3>Requirements:</h3>
<ul>
<li>Bachelor's degree in relevant field or equivalent experience</li>
<li>3+ years of experience in related role</li>
<li>Strong communication and problem-solving skills</li>
<li>Experience with modern tools and technologies</li>
</ul>`,
  benefits: `<h3>What We Offer:</h3>
<ul>
<li>Competitive salary: {{salaryRange}}</li>
<li>Comprehensive health, dental, and vision insurance</li>
<li>401(k) with company matching</li>
<li>Flexible work arrangements</li>
<li>Professional development opportunities</li>
<li>Collaborative and inclusive work environment</li>
</ul>`,
  location: '{{location}}',
  employmentType: '{{employmentType}}',
  contactEmail: '{{contactEmail}}'
};