'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { 
  BriefcaseIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  HeartIcon,
  BookmarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  ArrowRightIcon,
  EyeIcon,
  ShareIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
  StarIcon as StarIconSolid
} from '@heroicons/react/24/solid';

interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  department: string;
  location: string;
  jobType: 'full_time' | 'part_time' | 'contract' | 'internship' | 'remote' | 'hybrid';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  postedDate: string;
  applicationDeadline?: string;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  responsibilities: string[];
  requirements: string[];
  qualifications: string[];
  benefits: string[];
  skills: string[];
  tags: string[];
  companySize: string;
  industry: string;
  rating?: number;
  reviewCount?: number;
  applicantCount?: number;
  isRemote: boolean;
  isUrgent?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  isEasyApply?: boolean;
  savedByUser?: boolean;
  matchScore?: number;
  contactPerson?: {
    name: string;
    title: string;
    email: string;
  };
}

export default function BrowseJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('all');
  const [experienceLevelFilter, setExperienceLevelFilter] = useState('all');
  const [salaryMinFilter, setSalaryMinFilter] = useState('');
  const [remoteOnlyFilter, setRemoteOnlyFilter] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'salary' | 'company'>('relevance');
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, locationFilter, jobTypeFilter, experienceLevelFilter, salaryMinFilter, remoteOnlyFilter, sortBy]);

  const loadJobs = async () => {
    setLoading(true);
    
    // Mock job data
    const mockJobs: Job[] = [
      {
        id: 'job_001',
        title: 'Senior Software Engineer',
        company: 'Google',
        department: 'Engineering',
        location: 'Mountain View, CA',
        jobType: 'full_time',
        experienceLevel: 'senior',
        postedDate: '2025-01-22T10:00:00Z',
        applicationDeadline: '2025-02-15T23:59:59Z',
        salaryRange: { min: 180000, max: 250000, currency: 'ZAR' },
        description: 'Join our world-class engineering team to build products that impact billions of users. Work on cutting-edge technology and solve complex technical challenges at scale.',
        responsibilities: [
          'Design and implement scalable distributed systems',
          'Lead technical architecture decisions',
          'Mentor junior engineers and drive best practices',
          'Collaborate with product teams to deliver features'
        ],
        requirements: [
          'BS/MS in Computer Science or equivalent',
          '5+ years of software development experience',
          'Expertise in Python, Java, or C++',
          'Experience with distributed systems and databases'
        ],
        qualifications: [
          'Strong problem-solving and analytical skills',
          'Experience with cloud platforms (GCP, AWS)',
          'Leadership experience preferred',
          'Open source contributions a plus'
        ],
        benefits: [
          'Competitive salary and equity',
          'Comprehensive health insurance',
          '20% time for personal projects',
          'Free meals and snacks',
          'Gym membership and wellness programs'
        ],
        skills: ['Python', 'Java', 'Distributed Systems', 'Cloud Computing', 'Leadership'],
        tags: ['Tech', 'Senior Level', 'Growth', 'Innovation'],
        companySize: '50,000+ employees',
        industry: 'Technology',
        rating: 4.5,
        reviewCount: 12000,
        applicantCount: 234,
        isRemote: false,
        isNew: true,
        isFeatured: true,
        isEasyApply: true,
        matchScore: 95,
        contactPerson: {
          name: 'Sarah Chen',
          title: 'Senior Technical Recruiter',
          email: 'sarah.chen@google.com'
        }
      },
      {
        id: 'job_002',
        title: 'Product Manager',
        company: 'Meta',
        department: 'Product',
        location: 'Menlo Park, CA',
        jobType: 'full_time',
        experienceLevel: 'senior',
        postedDate: '2025-01-21T14:30:00Z',
        applicationDeadline: '2025-02-20T23:59:59Z',
        salaryRange: { min: 160000, max: 220000, currency: 'ZAR' },
        description: 'Lead product strategy for our social platform serving billions of users worldwide. Drive innovation and user experience across web and mobile platforms.',
        responsibilities: [
          'Define product roadmap and strategy',
          'Work with engineering teams to deliver features',
          'Analyze user data and market trends',
          'Collaborate with design and research teams'
        ],
        requirements: [
          'MBA or equivalent experience',
          '5+ years in product management',
          'Experience with social platforms or consumer products',
          'Strong analytical and communication skills'
        ],
        qualifications: [
          'Technical background preferred',
          'Experience with A/B testing and analytics',
          'Leadership and cross-functional collaboration',
          'Passion for user experience'
        ],
        benefits: [
          'Competitive compensation package',
          'Stock options',
          'Unlimited PTO',
          'Health and wellness benefits',
          'Remote work flexibility'
        ],
        skills: ['Product Strategy', 'Analytics', 'Leadership', 'A/B Testing', 'User Research'],
        tags: ['Product', 'Strategy', 'Social Media', 'Growth'],
        companySize: '10,000+ employees',
        industry: 'Social Media',
        rating: 4.2,
        reviewCount: 8500,
        applicantCount: 167,
        isRemote: true,
        isFeatured: true,
        isEasyApply: false,
        matchScore: 88,
        contactPerson: {
          name: 'Mike Rodriguez',
          title: 'Product Recruitment Lead',
          email: 'mike.rodriguez@meta.com'
        }
      },
      {
        id: 'job_003',
        title: 'DevOps Engineer',
        company: 'Netflix',
        department: 'Infrastructure',
        location: 'Los Gatos, CA',
        jobType: 'full_time',
        experienceLevel: 'mid',
        postedDate: '2025-01-20T09:15:00Z',
        salaryRange: { min: 140000, max: 180000, currency: 'ZAR' },
        description: 'Build and maintain the infrastructure that powers our global streaming platform. Work with cutting-edge cloud technologies and automation tools.',
        responsibilities: [
          'Manage cloud infrastructure and deployments',
          'Implement CI/CD pipelines and automation',
          'Monitor system performance and reliability',
          'Collaborate with development teams'
        ],
        requirements: [
          'BS in Computer Science or related field',
          '3+ years of DevOps/Infrastructure experience',
          'Experience with AWS, Docker, Kubernetes',
          'Proficiency in Python or Go'
        ],
        qualifications: [
          'Experience with monitoring and logging tools',
          'Knowledge of security best practices',
          'Experience with Infrastructure as Code',
          'Strong troubleshooting skills'
        ],
        benefits: [
          'Competitive salary and bonuses',
          'Stock options',
          'Flexible PTO',
          'Professional development budget',
          'Free Netflix subscription'
        ],
        skills: ['AWS', 'Docker', 'Kubernetes', 'Python', 'CI/CD'],
        tags: ['DevOps', 'Cloud', 'Infrastructure', 'Automation'],
        companySize: '5,000-10,000 employees',
        industry: 'Streaming Media',
        rating: 4.4,
        reviewCount: 3200,
        applicantCount: 89,
        isRemote: true,
        isEasyApply: true,
        matchScore: 82,
        contactPerson: {
          name: 'Lisa Park',
          title: 'Infrastructure Recruiter',
          email: 'lisa.park@netflix.com'
        }
      },
      {
        id: 'job_004',
        title: 'UX Designer',
        company: 'Airbnb',
        department: 'Design',
        location: 'San Francisco, CA',
        jobType: 'full_time',
        experienceLevel: 'mid',
        postedDate: '2025-01-19T16:45:00Z',
        salaryRange: { min: 120000, max: 160000, currency: 'ZAR' },
        description: 'Create exceptional user experiences for millions of travelers and hosts worldwide. Join our design team to shape the future of travel and hospitality.',
        responsibilities: [
          'Design user interfaces for web and mobile',
          'Conduct user research and testing',
          'Create wireframes, prototypes, and design systems',
          'Collaborate with product and engineering teams'
        ],
        requirements: [
          'Bachelor\'s degree in Design or related field',
          '3+ years of UX/UI design experience',
          'Proficiency in Figma, Sketch, or similar tools',
          'Strong portfolio demonstrating design thinking'
        ],
        qualifications: [
          'Experience with user research methodologies',
          'Knowledge of accessibility best practices',
          'Experience with design systems',
          'Strong communication skills'
        ],
        benefits: [
          'Competitive salary',
          'Annual travel stipend',
          'Health and wellness benefits',
          'Professional development opportunities',
          'Flexible work arrangements'
        ],
        skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Accessibility'],
        tags: ['Design', 'UX', 'Travel', 'Mobile'],
        companySize: '1,000-5,000 employees',
        industry: 'Travel & Hospitality',
        rating: 4.3,
        reviewCount: 2800,
        applicantCount: 156,
        isRemote: false,
        isEasyApply: false,
        matchScore: 79,
        contactPerson: {
          name: 'Jennifer Wu',
          title: 'Design Recruiter',
          email: 'jennifer.wu@airbnb.com'
        }
      },
      {
        id: 'job_005',
        title: 'Data Scientist',
        company: 'Tesla',
        department: 'AI & Robotics',
        location: 'Palo Alto, CA',
        jobType: 'full_time',
        experienceLevel: 'senior',
        postedDate: '2025-01-18T11:20:00Z',
        applicationDeadline: '2025-02-10T23:59:59Z',
        salaryRange: { min: 170000, max: 230000, currency: 'ZAR' },
        description: 'Drive the future of autonomous vehicles through advanced machine learning and data science. Work on cutting-edge AI technologies that will revolutionize transportation.',
        responsibilities: [
          'Develop machine learning models for autonomous driving',
          'Analyze large datasets from vehicle sensors',
          'Implement computer vision algorithms',
          'Collaborate with robotics and AI teams'
        ],
        requirements: [
          'PhD in Computer Science, AI, or related field',
          '5+ years in data science or machine learning',
          'Experience with Python, TensorFlow, PyTorch',
          'Strong background in computer vision and deep learning'
        ],
        qualifications: [
          'Experience with autonomous systems',
          'Publications in top-tier conferences',
          'Experience with large-scale data processing',
          'Strong mathematical and statistical background'
        ],
        benefits: [
          'Stock options',
          'Comprehensive health benefits',
          'Free Tesla charging',
          'Professional development budget',
          'Cutting-edge research opportunities'
        ],
        skills: ['Python', 'Machine Learning', 'Computer Vision', 'Deep Learning', 'AI'],
        tags: ['AI', 'Machine Learning', 'Autonomous Vehicles', 'Research'],
        companySize: '10,000+ employees',
        industry: 'Automotive/Technology',
        rating: 4.1,
        reviewCount: 5600,
        applicantCount: 78,
        isRemote: false,
        isUrgent: true,
        isFeatured: true,
        isEasyApply: true,
        matchScore: 92,
        contactPerson: {
          name: 'Dr. Amanda Zhang',
          title: 'AI Talent Acquisition Lead',
          email: 'amanda.zhang@tesla.com'
        }
      },
      {
        id: 'job_006',
        title: 'Frontend Developer',
        company: 'Stripe',
        department: 'Engineering',
        location: 'Remote',
        jobType: 'remote',
        experienceLevel: 'mid',
        postedDate: '2025-01-17T13:30:00Z',
        salaryRange: { min: 130000, max: 170000, currency: 'ZAR' },
        description: 'Build beautiful and intuitive user interfaces for our payment platform used by millions of businesses worldwide. Work remotely with a world-class engineering team.',
        responsibilities: [
          'Develop responsive web applications',
          'Build reusable UI components',
          'Optimize application performance',
          'Collaborate with design and backend teams'
        ],
        requirements: [
          'BS in Computer Science or related field',
          '3+ years of frontend development experience',
          'Expertise in React, TypeScript, and CSS',
          'Experience with modern build tools and workflows'
        ],
        qualifications: [
          'Experience with payment systems preferred',
          'Knowledge of accessibility standards',
          'Experience with testing frameworks',
          'Strong attention to detail'
        ],
        benefits: [
          'Competitive remote salary',
          'Equity package',
          'Health and dental insurance',
          'Home office stipend',
          'Unlimited PTO'
        ],
        skills: ['React', 'TypeScript', 'CSS', 'JavaScript', 'Testing'],
        tags: ['Frontend', 'Remote', 'React', 'Payments'],
        companySize: '1,000-5,000 employees',
        industry: 'Fintech',
        rating: 4.6,
        reviewCount: 1200,
        applicantCount: 203,
        isRemote: true,
        isEasyApply: true,
        matchScore: 85,
        contactPerson: {
          name: 'Tom Wilson',
          title: 'Engineering Recruiter',
          email: 'tom.wilson@stripe.com'
        }
      },
      {
        id: 'job_007',
        title: 'Marketing Manager',
        company: 'Spotify',
        department: 'Marketing',
        location: 'New York, NY',
        jobType: 'full_time',
        experienceLevel: 'mid',
        postedDate: '2025-01-16T10:00:00Z',
        salaryRange: { min: 90000, max: 120000, currency: 'ZAR' },
        description: 'Lead marketing campaigns for our music streaming platform. Drive user acquisition and engagement through creative marketing strategies and data-driven insights.',
        responsibilities: [
          'Develop and execute marketing campaigns',
          'Analyze campaign performance and ROI',
          'Manage social media and content strategy',
          'Coordinate with creative and product teams'
        ],
        requirements: [
          'Bachelor\'s degree in Marketing or related field',
          '4+ years of digital marketing experience',
          'Experience with marketing analytics tools',
          'Strong project management skills'
        ],
        qualifications: [
          'Experience in entertainment or music industry',
          'Knowledge of social media advertising',
          'Creative thinking and problem solving',
          'Excellent communication skills'
        ],
        benefits: [
          'Competitive salary',
          'Spotify Premium subscription',
          'Health benefits',
          'Professional development budget',
          'Flexible work schedule'
        ],
        skills: ['Digital Marketing', 'Analytics', 'Social Media', 'Campaign Management', 'Creative Strategy'],
        tags: ['Marketing', 'Music', 'Creative', 'Analytics'],
        companySize: '5,000-10,000 employees',
        industry: 'Music Streaming',
        rating: 4.2,
        reviewCount: 2100,
        applicantCount: 127,
        isRemote: false,
        isEasyApply: false,
        matchScore: 73,
        contactPerson: {
          name: 'Maria Gonzalez',
          title: 'Marketing Recruiter',
          email: 'maria.gonzalez@spotify.com'
        }
      },
      {
        id: 'job_008',
        title: 'Junior Software Developer',
        company: 'Slack',
        department: 'Engineering',
        location: 'San Francisco, CA',
        jobType: 'full_time',
        experienceLevel: 'entry',
        postedDate: '2025-01-15T14:15:00Z',
        salaryRange: { min: 110000, max: 140000, currency: 'ZAR' },
        description: 'Start your career with us and help build the collaboration tools that connect teams around the world. Perfect opportunity for new graduates or junior developers.',
        responsibilities: [
          'Write clean, maintainable code',
          'Participate in code reviews',
          'Learn from senior team members',
          'Contribute to feature development'
        ],
        requirements: [
          'BS in Computer Science or bootcamp graduate',
          '1-2 years of programming experience',
          'Knowledge of modern web technologies',
          'Strong willingness to learn'
        ],
        qualifications: [
          'Experience with JavaScript or Python',
          'Understanding of software development lifecycle',
          'Good problem-solving skills',
          'Team player attitude'
        ],
        benefits: [
          'Competitive entry-level salary',
          'Comprehensive mentorship program',
          'Health and wellness benefits',
          'Learning and development budget',
          'Stock options'
        ],
        skills: ['JavaScript', 'Python', 'Web Development', 'Git', 'Agile'],
        tags: ['Entry Level', 'Mentorship', 'Growth', 'Collaboration'],
        companySize: '1,000-5,000 employees',
        industry: 'Collaboration Software',
        rating: 4.4,
        reviewCount: 1800,
        applicantCount: 312,
        isRemote: false,
        isNew: true,
        isEasyApply: true,
        matchScore: 68
      }
    ];

    // Simulate loading delay
    setTimeout(() => {
      setJobs(mockJobs);
      setLoading(false);
    }, 1000);
  };

  const filterJobs = () => {
    let filtered = jobs.filter(job => {
      const matchesSearch = searchTerm === '' || 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
        job.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesLocation = locationFilter === '' || 
        job.location.toLowerCase().includes(locationFilter.toLowerCase()) ||
        (job.isRemote && locationFilter.toLowerCase().includes('remote'));
      
      const matchesJobType = jobTypeFilter === 'all' || job.jobType === jobTypeFilter;
      const matchesExperience = experienceLevelFilter === 'all' || job.experienceLevel === experienceLevelFilter;
      const matchesSalary = salaryMinFilter === '' || 
        (job.salaryRange && job.salaryRange.min >= parseInt(salaryMinFilter));
      const matchesRemote = !remoteOnlyFilter || job.isRemote;
      
      return matchesSearch && matchesLocation && matchesJobType && matchesExperience && matchesSalary && matchesRemote;
    });

    // Sort filtered jobs
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return (b.matchScore || 0) - (a.matchScore || 0);
        case 'date':
          return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
        case 'salary':
          return (b.salaryRange?.max || 0) - (a.salaryRange?.max || 0);
        case 'company':
          return a.company.localeCompare(b.company);
        default:
          return 0;
      }
    });

    setFilteredJobs(filtered);
  };

  const toggleSaveJob = (jobId: string) => {
    setSavedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const getDaysAgo = (date: string) => {
    const today = new Date();
    const postedDate = new Date(date);
    const diffTime = today.getTime() - postedDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  const getJobTypeColor = (jobType: string) => {
    switch (jobType) {
      case 'full_time': return 'bg-violet-100 text-violet-800';
      case 'part_time': return 'bg-green-100 text-green-800';
      case 'contract': return 'bg-purple-100 text-purple-800';
      case 'internship': return 'bg-orange-100 text-orange-800';
      case 'remote': return 'bg-teal-100 text-teal-800';
      case 'hybrid': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getExperienceLevelColor = (level: string) => {
    switch (level) {
      case 'entry': return 'bg-green-100 text-green-800';
      case 'mid': return 'bg-violet-100 text-violet-800';
      case 'senior': return 'bg-purple-100 text-purple-800';
      case 'executive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const actions = (
    <div className="flex items-center gap-3">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search jobs, companies, skills..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400 w-80"
        />
      </div>
      
      <input
        type="text"
        placeholder="Location"
        value={locationFilter}
        onChange={(e) => setLocationFilter(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400 w-40"
      />
      
      <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
        <FunnelIcon className="w-4 h-4 mr-2" />
        Filters
      </button>
      
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as any)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
      >
        <option value="relevance">Most Relevant</option>
        <option value="date">Most Recent</option>
        <option value="salary">Highest Salary</option>
        <option value="company">Company A-Z</option>
      </select>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper title="Browse Jobs" subtitle="Loading available positions..." actions={actions}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-500"></div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Browse Jobs"
      subtitle={`${filteredJobs.length} jobs found matching your criteria`}
      actions={actions}
    >
      <div className="space-y-6">
        {/* Filter Bar */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={jobTypeFilter}
              onChange={(e) => setJobTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
            >
              <option value="all">All Types</option>
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </select>

            <select
              value={experienceLevelFilter}
              onChange={(e) => setExperienceLevelFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
            >
              <option value="all">All Levels</option>
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior Level</option>
              <option value="executive">Executive</option>
            </select>

            <input
              type="number"
              placeholder="Min Salary"
              value={salaryMinFilter}
              onChange={(e) => setSalaryMinFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400 w-32"
            />

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={remoteOnlyFilter}
                onChange={(e) => setRemoteOnlyFilter(e.target.checked)}
                className="rounded border-gray-300 text-violet-600 focus:ring-violet-500/60"
              />
              <span className="ml-2 text-sm text-gray-700">Remote Only</span>
            </label>

            <div className="flex items-center ml-auto">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-violet-100 text-violet-600' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 000 2h1a1 1 0 000-2H3zM3 8a1 1 0 000 2h1a1 1 0 000-2H3zM3 12a1 1 0 100 2h1a1 1 0 100-2H3zM7 4a1 1 0 000 2h9a1 1 0 100-2H7zM7 8a1 1 0 000 2h9a1 1 0 100-2H7zM7 12a1 1 0 000 2h9a1 1 0 100-2H7z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ml-2 ${viewMode === 'grid' ? 'bg-violet-100 text-violet-600' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Jobs List/Grid */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow border hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BuildingOfficeIcon className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 truncate">{job.title}</h3>
                            <p className="text-base text-violet-600 font-medium">{job.company}</p>
                            <div className="flex items-center space-x-2 mt-1 text-sm text-gray-600">
                              <MapPinIcon className="w-4 h-4" />
                              <span>{job.location}</span>
                              <span>•</span>
                              <span>{getDaysAgo(job.postedDate)}</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => toggleSaveJob(job.id)}
                            className="p-2 hover:bg-gray-100 rounded-full"
                          >
                            {savedJobs.includes(job.id) ? (
                              <BookmarkIconSolid className="w-5 h-5 text-violet-600" />
                            ) : (
                              <BookmarkIcon className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getJobTypeColor(job.jobType)}`}>
                            {job.jobType.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getExperienceLevelColor(job.experienceLevel)}`}>
                            {job.experienceLevel.toUpperCase()}
                          </span>
                          {job.isNew && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              NEW
                            </span>
                          )}
                          {job.isUrgent && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              URGENT
                            </span>
                          )}
                          {job.isFeatured && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <StarIcon className="w-3 h-3 mr-1" />
                              FEATURED
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-700 line-clamp-2">{job.description}</p>
                  
                  {job.salaryRange && (
                    <div className="flex items-center text-sm text-gray-600">
                      <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                      R{job.salaryRange.min.toLocaleString()} - R{job.salaryRange.max.toLocaleString()} {job.salaryRange.currency}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-1">
                    {job.skills.slice(0, 4).map((skill, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 4 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                        +{job.skills.length - 4} more
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-3">
                    <div className="flex items-center space-x-4">
                      {job.rating && (
                        <div className="flex items-center text-sm text-gray-600">
                          <StarIconSolid className="w-4 h-4 text-yellow-400 mr-1" />
                          {job.rating} ({job.reviewCount?.toLocaleString()})
                        </div>
                      )}
                      
                      {job.matchScore && (
                        <div className="flex items-center text-sm text-green-600">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          {job.matchScore}% match
                        </div>
                      )}
                      
                      {job.applicantCount && (
                        <div className="flex items-center text-sm text-gray-500">
                          <UserGroupIcon className="w-4 h-4 mr-1" />
                          {job.applicantCount} applicants
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <EyeIcon className="w-4 h-4 mr-2" />
                        View Details
                      </button>
                      
                      <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700">
                        {job.isEasyApply ? (
                          <>
                            <CheckCircleIcon className="w-4 h-4 mr-2" />
                            Easy Apply
                          </>
                        ) : (
                          <>
                            <ArrowRightIcon className="w-4 h-4 mr-2" />
                            Apply
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <BriefcaseIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">
              Try adjusting your search criteria or filters to find more opportunities.
            </p>
          </div>
        )}

        {/* Job Details Modal */}
        {selectedJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-violet-700 rounded-lg flex items-center justify-center">
                      <BuildingOfficeIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h2>
                      <p className="text-lg text-violet-600 font-medium mt-1">{selectedJob.company}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center">
                          <MapPinIcon className="w-4 h-4 mr-1" />
                          {selectedJob.location}
                        </span>
                        <span className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {getDaysAgo(selectedJob.postedDate)}
                        </span>
                        {selectedJob.applicationDeadline && (
                          <span className="flex items-center text-red-600">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            Deadline: {new Date(selectedJob.applicationDeadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h3>
                      <p className="text-sm text-gray-700">{selectedJob.description}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Responsibilities</h3>
                      <ul className="space-y-2">
                        {selectedJob.responsibilities.map((resp, index) => (
                          <li key={index} className="flex items-start text-sm text-gray-700">
                            <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            {resp}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
                      <ul className="space-y-2">
                        {selectedJob.requirements.map((req, index) => (
                          <li key={index} className="flex items-start text-sm text-gray-700">
                            <CheckCircleIcon className="w-4 h-4 text-violet-500 mr-2 mt-0.5 flex-shrink-0" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Preferred Qualifications</h3>
                      <ul className="space-y-2">
                        {selectedJob.qualifications.map((qual, index) => (
                          <li key={index} className="flex items-start text-sm text-gray-700">
                            <CheckCircleIcon className="w-4 h-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                            {qual}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Details</h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium">Department:</span>
                          <span>{selectedJob.department}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Job Type:</span>
                          <span className="capitalize">{selectedJob.jobType.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Experience Level:</span>
                          <span className="capitalize">{selectedJob.experienceLevel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Company Size:</span>
                          <span>{selectedJob.companySize}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Industry:</span>
                          <span>{selectedJob.industry}</span>
                        </div>
                        {selectedJob.salaryRange && (
                          <div className="flex justify-between">
                            <span className="font-medium">Salary Range:</span>
                            <span>R{selectedJob.salaryRange.min.toLocaleString()} - R{selectedJob.salaryRange.max.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills & Technologies</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.skills.map((skill, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-violet-100 text-violet-800">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefits & Perks</h3>
                      <ul className="space-y-2">
                        {selectedJob.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-start text-sm text-gray-700">
                            <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {selectedJob.rating && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Company Rating</h3>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <StarIconSolid
                                key={i}
                                className={`w-5 h-5 ${
                                  i < Math.floor(selectedJob.rating!)
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-lg font-medium">{selectedJob.rating}</span>
                          <span className="text-sm text-gray-500">({selectedJob.reviewCount?.toLocaleString()} reviews)</span>
                        </div>
                      </div>
                    )}

                    {selectedJob.contactPerson && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Person</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="font-medium">{selectedJob.contactPerson.name}</p>
                          <p className="text-sm text-gray-600">{selectedJob.contactPerson.title}</p>
                          <p className="text-sm text-gray-600">{selectedJob.contactPerson.email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-6 border-t">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => toggleSaveJob(selectedJob.id)}
                      className={`flex items-center px-4 py-2 border rounded-lg ${
                        savedJobs.includes(selectedJob.id)
                          ? 'bg-violet-50 border-violet-300 text-violet-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {savedJobs.includes(selectedJob.id) ? (
                        <BookmarkIconSolid className="w-4 h-4 mr-2" />
                      ) : (
                        <BookmarkIcon className="w-4 h-4 mr-2" />
                      )}
                      {savedJobs.includes(selectedJob.id) ? 'Saved' : 'Save Job'}
                    </button>
                    
                    <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                      <ShareIcon className="w-4 h-4 mr-2" />
                      Share
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setSelectedJob(null)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Close
                    </button>
                    
                    <button className="flex items-center px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700">
                      {selectedJob.isEasyApply ? (
                        <>
                          <CheckCircleIcon className="w-4 h-4 mr-2" />
                          Easy Apply
                        </>
                      ) : (
                        <>
                          <ArrowRightIcon className="w-4 h-4 mr-2" />
                          Apply Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
