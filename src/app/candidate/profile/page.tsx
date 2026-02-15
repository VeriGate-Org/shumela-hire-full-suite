'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { 
  UserIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  LinkIcon,
  PencilIcon,
  CameraIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  PlusIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  StarIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

interface CandidateProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  profileImage: string | null;
  headline: string;
  summary: string;
  dateOfBirth: string;
  nationality: string;
  workAuthorization: 'authorized' | 'requires_sponsorship' | 'not_authorized';
  salaryExpectation: {
    min: number;
    max: number;
    currency: string;
  };
  availability: 'immediate' | 'two_weeks' | 'one_month' | 'more_than_month';
  noticePeriod: string;
  preferredJobTypes: string[];
  willingToRelocate: boolean;
  remoteWork: 'only' | 'hybrid' | 'no_preference' | 'not_preferred';
}

interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string;
  location: string;
  achievements: string[];
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string | null;
  isCurrent: boolean;
  gpa: string | null;
  description: string;
  honors: string[];
}

interface Skill {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years: number;
  category: 'technical' | 'soft' | 'language' | 'certification';
}

interface Document {
  id: string;
  name: string;
  type: 'resume' | 'cover_letter' | 'portfolio' | 'certification' | 'other';
  url: string;
  uploadedAt: string;
  size: number;
}

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  appliedDate: string;
  status: 'applied' | 'reviewing' | 'interview_scheduled' | 'interview_completed' | 'offer_extended' | 'hired' | 'rejected' | 'withdrawn';
  currentStage: string;
  interviewDate?: string;
  notes: string;
}

export default function CandidateProfilePage() {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'experience' | 'education' | 'skills' | 'documents' | 'applications'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCandidateData();
  }, []);

  const loadCandidateData = async () => {
    setLoading(true);
    
    // Mock data - replace with actual API calls
    const mockProfile: CandidateProfile = {
      id: 'candidate_001',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      profileImage: null,
      headline: 'Senior Software Engineer | Full-Stack Developer | React & Node.js Expert',
      summary: 'Passionate software engineer with 7+ years of experience building scalable web applications. Expertise in React, Node.js, and cloud technologies. Led teams of 5+ developers and delivered products used by millions of users.',
      dateOfBirth: '1990-05-15',
      nationality: 'United States',
      workAuthorization: 'authorized',
      salaryExpectation: {
        min: 120000,
        max: 160000,
        currency: 'ZAR'
      },
      availability: 'two_weeks',
      noticePeriod: '2 weeks',
      preferredJobTypes: ['Full-time', 'Contract'],
      willingToRelocate: true,
      remoteWork: 'hybrid'
    };

    const mockExperiences: Experience[] = [
      {
        id: 'exp_001',
        company: 'TechCorp Inc.',
        position: 'Senior Software Engineer',
        startDate: '2020-03-01',
        endDate: null,
        isCurrent: true,
        description: 'Lead full-stack development of customer-facing web applications serving 2M+ users.',
        location: 'San Francisco, CA',
        achievements: [
          'Reduced page load times by 40% through performance optimization',
          'Led migration from monolith to microservices architecture',
          'Mentored 3 junior developers and conducted technical interviews'
        ]
      },
      {
        id: 'exp_002',
        company: 'StartupXYZ',
        position: 'Software Engineer',
        startDate: '2018-01-01',
        endDate: '2020-02-28',
        isCurrent: false,
        description: 'Developed and maintained React-based SaaS platform for project management.',
        location: 'Remote',
        achievements: [
          'Built real-time collaboration features using WebSockets',
          'Implemented automated testing pipeline reducing bugs by 60%',
          'Contributed to product roadmap and technical architecture decisions'
        ]
      }
    ];

    const mockEducation: Education[] = [
      {
        id: 'edu_001',
        institution: 'Stanford University',
        degree: 'Master of Science',
        field: 'Computer Science',
        startYear: '2015',
        endYear: '2017',
        isCurrent: false,
        gpa: '3.8',
        description: 'Focused on distributed systems and machine learning',
        honors: ['Dean\'s List', 'Graduate Fellowship Recipient']
      },
      {
        id: 'edu_002',
        institution: 'UC Berkeley',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startYear: '2011',
        endYear: '2015',
        isCurrent: false,
        gpa: '3.7',
        description: 'Concentration in software engineering and algorithms',
        honors: ['Magna Cum Laude', 'Phi Beta Kappa']
      }
    ];

    const mockSkills: Skill[] = [
      { id: 'skill_001', name: 'React', level: 'expert', years: 6, category: 'technical' },
      { id: 'skill_002', name: 'Node.js', level: 'expert', years: 5, category: 'technical' },
      { id: 'skill_003', name: 'TypeScript', level: 'advanced', years: 4, category: 'technical' },
      { id: 'skill_004', name: 'AWS', level: 'advanced', years: 3, category: 'technical' },
      { id: 'skill_005', name: 'Python', level: 'intermediate', years: 3, category: 'technical' },
      { id: 'skill_006', name: 'Leadership', level: 'advanced', years: 4, category: 'soft' },
      { id: 'skill_007', name: 'Spanish', level: 'intermediate', years: 10, category: 'language' },
      { id: 'skill_008', name: 'AWS Solutions Architect', level: 'expert', years: 2, category: 'certification' }
    ];

    const mockDocuments: Document[] = [
      {
        id: 'doc_001',
        name: 'Sarah_Johnson_Resume_2025.pdf',
        type: 'resume',
        url: '/documents/sarah_resume.pdf',
        uploadedAt: '2025-01-15T10:30:00Z',
        size: 245760
      },
      {
        id: 'doc_002',
        name: 'Portfolio_Projects.pdf',
        type: 'portfolio',
        url: '/documents/sarah_portfolio.pdf',
        uploadedAt: '2025-01-10T14:20:00Z',
        size: 1024000
      },
      {
        id: 'doc_003',
        name: 'AWS_Certification.pdf',
        type: 'certification',
        url: '/documents/aws_cert.pdf',
        uploadedAt: '2024-12-01T09:15:00Z',
        size: 512000
      }
    ];

    const mockApplications: Application[] = [
      {
        id: 'app_001',
        jobTitle: 'Senior Full Stack Engineer',
        company: 'Google',
        appliedDate: '2025-01-20T09:00:00Z',
        status: 'interview_scheduled',
        currentStage: 'Technical Interview',
        interviewDate: '2025-01-25T14:00:00Z',
        notes: 'Initial phone screening completed. Technical interview scheduled.'
      },
      {
        id: 'app_002',
        jobTitle: 'Staff Software Engineer',
        company: 'Meta',
        appliedDate: '2025-01-18T11:30:00Z',
        status: 'reviewing',
        currentStage: 'Application Review',
        notes: 'Application submitted and under review by hiring team.'
      },
      {
        id: 'app_003',
        jobTitle: 'Principal Engineer',
        company: 'Netflix',
        appliedDate: '2025-01-15T16:45:00Z',
        status: 'offer_extended',
        currentStage: 'Offer Negotiation',
        notes: 'Offer received. Negotiating terms and start date.'
      }
    ];

    // Simulate loading delay
    setTimeout(() => {
      setProfile(mockProfile);
      setExperiences(mockExperiences);
      setEducation(mockEducation);
      setSkills(mockSkills);
      setDocuments(mockDocuments);
      setApplications(mockApplications);
      setLoading(false);
    }, 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'hired': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'offer_extended': return <StarIcon className="w-5 h-5 text-yellow-500" />;
      case 'interview_scheduled': return <CalendarIcon className="w-5 h-5 text-violet-500" />;
      case 'interview_completed': return <EyeIcon className="w-5 h-5 text-purple-500" />;
      case 'reviewing': return <ClockIcon className="w-5 h-5 text-orange-500" />;
      case 'rejected': return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default: return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hired': return 'bg-green-100 text-green-800';
      case 'offer_extended': return 'bg-yellow-100 text-yellow-800';
      case 'interview_scheduled': return 'bg-violet-100 text-violet-800';
      case 'interview_completed': return 'bg-purple-100 text-purple-800';
      case 'reviewing': return 'bg-orange-100 text-orange-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'withdrawn': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'expert': return 'bg-green-100 text-green-800 border-green-300';
      case 'advanced': return 'bg-violet-100 text-violet-800 border-violet-300';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'beginner': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const actions = (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setIsEditing(!isEditing)}
        className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm ${
          isEditing 
            ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50' 
            : 'border-transparent text-white bg-violet-600 hover:bg-violet-700'
        }`}
      >
        <PencilIcon className="w-4 h-4 mr-2" />
        {isEditing ? 'Cancel Edit' : 'Edit Profile'}
      </button>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper title="My Profile" subtitle="Loading your profile..." actions={actions}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-500"></div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="My Profile"
      subtitle="Manage your professional profile and application materials"
      actions={actions}
    >
      <div className="space-y-6">
        {/* Profile Header Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start space-x-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-violet-700 rounded-full flex items-center justify-center">
                {profile?.profileImage ? (
                  <img 
                    src={profile.profileImage} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-12 h-12 text-white" />
                )}
              </div>
              {isEditing && (
                <button className="absolute -bottom-2 -right-2 p-2 bg-violet-600 text-white rounded-full shadow-sm hover:bg-violet-700">
                  <CameraIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile?.firstName} {profile?.lastName}
                  </h1>
                  <p className="text-lg text-violet-600 font-medium mt-1">
                    {profile?.headline}
                  </p>
                  
                  <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPinIcon className="w-4 h-4 mr-1" />
                      {profile?.location}
                    </div>
                    <div className="flex items-center">
                      <EnvelopeIcon className="w-4 h-4 mr-1" />
                      {profile?.email}
                    </div>
                    <div className="flex items-center">
                      <PhoneIcon className="w-4 h-4 mr-1" />
                      {profile?.phone}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    profile?.workAuthorization === 'authorized' 
                      ? 'bg-green-100 text-green-800'
                      : profile?.workAuthorization === 'requires_sponsorship'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {profile?.workAuthorization === 'authorized' ? 'Authorized to Work' : 
                     profile?.workAuthorization === 'requires_sponsorship' ? 'Requires Sponsorship' : 'Not Authorized'}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-700 mt-4 leading-relaxed">
                {profile?.summary}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'profile', name: 'Profile Details', icon: UserIcon },
                { id: 'experience', name: 'Experience', icon: BriefcaseIcon },
                { id: 'education', name: 'Education', icon: AcademicCapIcon },
                { id: 'skills', name: 'Skills', icon: StarIcon },
                { id: 'documents', name: 'Documents', icon: DocumentTextIcon },
                { id: 'applications', name: 'My Applications', icon: ClockIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-violet-500 text-violet-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Details Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                        <p className="text-gray-900">{new Date(profile?.dateOfBirth || '').toLocaleDateString()}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Nationality</label>
                        <p className="text-gray-900">{profile?.nationality}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Work Authorization</label>
                        <p className="text-gray-900">
                          {profile?.workAuthorization === 'authorized' ? 'Authorized to work' : 
                           profile?.workAuthorization === 'requires_sponsorship' ? 'Requires sponsorship' : 'Not authorized'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Job Preferences</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Salary Expectation</label>
                        <p className="text-gray-900">
                          ${profile?.salaryExpectation.min.toLocaleString()} - ${profile?.salaryExpectation.max.toLocaleString()} {profile?.salaryExpectation.currency}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Availability</label>
                        <p className="text-gray-900">
                          {profile?.availability === 'immediate' ? 'Immediate' :
                           profile?.availability === 'two_weeks' ? 'Two weeks notice' :
                           profile?.availability === 'one_month' ? 'One month notice' : 'More than one month'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Remote Work Preference</label>
                        <p className="text-gray-900">
                          {profile?.remoteWork === 'only' ? 'Remote only' :
                           profile?.remoteWork === 'hybrid' ? 'Hybrid preferred' :
                           profile?.remoteWork === 'no_preference' ? 'No preference' : 'Office preferred'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Willing to Relocate</label>
                        <p className="text-gray-900">{profile?.willingToRelocate ? 'Yes' : 'No'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Preferred Job Types</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {profile?.preferredJobTypes.map((type, index) => (
                            <span key={index} className="px-2 py-1 bg-violet-100 text-violet-800 text-sm rounded-full">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Experience Tab */}
            {activeTab === 'experience' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Work Experience</h3>
                  {isEditing && (
                    <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-violet-600 hover:bg-violet-50">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Experience
                    </button>
                  )}
                </div>
                
                <div className="space-y-6">
                  {experiences.map((exp, index) => (
                    <div key={exp.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <BriefcaseIcon className="w-6 h-6 text-gray-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900">{exp.position}</h4>
                              <p className="text-violet-600 font-medium">{exp.company}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                <span>
                                  {new Date(exp.startDate).toLocaleDateString()} - {
                                    exp.isCurrent ? 'Present' : new Date(exp.endDate!).toLocaleDateString()
                                  }
                                </span>
                                <span>•</span>
                                <span className="flex items-center">
                                  <MapPinIcon className="w-4 h-4 mr-1" />
                                  {exp.location}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-gray-700 mt-4">{exp.description}</p>
                          
                          {exp.achievements.length > 0 && (
                            <div className="mt-4">
                              <h5 className="text-sm font-medium text-gray-900 mb-2">Key Achievements:</h5>
                              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                {exp.achievements.map((achievement, idx) => (
                                  <li key={idx}>{achievement}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        
                        {isEditing && (
                          <div className="flex space-x-2">
                            <button className="p-2 text-gray-400 hover:text-violet-600">
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-red-600">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education Tab */}
            {activeTab === 'education' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Education</h3>
                  {isEditing && (
                    <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-violet-600 hover:bg-violet-50">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Education
                    </button>
                  )}
                </div>
                
                <div className="space-y-6">
                  {education.map((edu, index) => (
                    <div key={edu.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <AcademicCapIcon className="w-6 h-6 text-gray-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900">{edu.degree} in {edu.field}</h4>
                              <p className="text-violet-600 font-medium">{edu.institution}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                <span>
                                  {edu.startYear} - {edu.isCurrent ? 'Present' : edu.endYear}
                                </span>
                                {edu.gpa && (
                                  <>
                                    <span>•</span>
                                    <span>GPA: {edu.gpa}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-gray-700 mt-4">{edu.description}</p>
                          
                          {edu.honors.length > 0 && (
                            <div className="mt-4">
                              <h5 className="text-sm font-medium text-gray-900 mb-2">Honors & Awards:</h5>
                              <div className="flex flex-wrap gap-2">
                                {edu.honors.map((honor, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                                    {honor}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {isEditing && (
                          <div className="flex space-x-2">
                            <button className="p-2 text-gray-400 hover:text-violet-600">
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-red-600">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Skills & Expertise</h3>
                  {isEditing && (
                    <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-violet-600 hover:bg-violet-50">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Skill
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {['technical', 'soft', 'language', 'certification'].map((category) => (
                    <div key={category} className="space-y-4">
                      <h4 className="font-medium text-gray-900 capitalize border-b border-gray-200 pb-2">
                        {category === 'technical' ? 'Technical Skills' :
                         category === 'soft' ? 'Soft Skills' :
                         category === 'language' ? 'Languages' : 'Certifications'}
                      </h4>
                      
                      <div className="space-y-3">
                        {skills.filter(skill => skill.category === category).map((skill) => (
                          <div key={skill.id} className="relative">
                            <div className={`inline-flex items-center px-3 py-2 rounded-lg border text-sm font-medium ${getSkillLevelColor(skill.level)}`}>
                              <span>{skill.name}</span>
                              <span className="ml-2 text-xs opacity-75">
                                {skill.level} ({skill.years}y)
                              </span>
                            </div>
                            {isEditing && (
                              <button className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                                <XCircleIcon className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Documents & Portfolio</h3>
                  {isEditing && (
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700">
                      <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                      Upload Document
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                            <DocumentTextIcon className="w-5 h-5 text-violet-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{doc.type.replace('_', ' ')}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatFileSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-1">
                          <button className="p-1 text-gray-400 hover:text-violet-600">
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          {isEditing && (
                            <button className="p-1 text-gray-400 hover:text-red-600">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Applications Tab */}
            {activeTab === 'applications' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">My Job Applications</h3>
                  <div className="text-sm text-gray-600">
                    {applications.length} applications
                  </div>
                </div>
                
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <BriefcaseIcon className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">{app.jobTitle}</h4>
                              <p className="text-violet-600 font-medium">{app.company}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                Applied on {new Date(app.appliedDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex items-center space-x-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                              {getStatusIcon(app.status)}
                              <span className="ml-1 capitalize">{app.status.replace('_', ' ')}</span>
                            </span>
                            <span className="text-sm text-gray-600">Current Stage: {app.currentStage}</span>
                            {app.interviewDate && (
                              <span className="text-sm text-violet-600">
                                Interview: {new Date(app.interviewDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          
                          {app.notes && (
                            <p className="text-sm text-gray-700 mt-3 bg-gray-50 rounded p-3">
                              {app.notes}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <button className="p-2 text-gray-400 hover:text-violet-600">
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600">
                            <LinkIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
