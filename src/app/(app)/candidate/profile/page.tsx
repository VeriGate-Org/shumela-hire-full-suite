'use client';

import { useState, useEffect, useCallback } from 'react';
import PageWrapper from '@/components/PageWrapper';
import IdentityBand from '@/components/record/IdentityBand';
import { getEnumLabel } from '@/utils/enumLabels';
import { useAuth } from '@/contexts/AuthContext';
import { getApplicantId, getApplicant, getDocuments as fetchDocuments, getApplications as fetchApplications, updateMyDemographics, requestOwnErasure } from '@/services/candidateService';
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
  StarIcon
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
  // Employment-equity answers. Given by this person, and editable only here — staff may read them
  // and may not rewrite them, so this is the one screen on which they can be corrected or a
  // consent withdrawn.
  gender?: string;
  race?: string;
  disabilityStatus?: string;
  citizenshipStatus?: string;
  demographicsConsent?: boolean;
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

/**
 * A stored list of strings.
 *
 * <p>The record holds these as a JSON array. Older records may hold a comma-separated string, so
 * that is tried second rather than first — trying it first is what produced skill names with
 * brackets and quotes in them.
 */
function parseList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    // Not JSON — fall through to the legacy comma format.
  }
  return value.split(',').map((entry) => entry.trim()).filter(Boolean);
}

/** A stored list of objects — experience and education are both kept this way. */
function parseObjectList(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value as Record<string, unknown>[];
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
  } catch {
    return [];
  }
}

/** One employment-equity answer, with "not answered" as a real and selectable state. */
function EquityField({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value?: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-muted-foreground">{label}</label>
      <select
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full max-w-sm p-2 border border-border rounded-control bg-card text-foreground"
      >
        <option value="">Not answered</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function CandidateProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'experience' | 'education' | 'skills' | 'documents' | 'applications'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  // The applicant exactly as fetched. A save sends the whole record back, because the update
  // endpoint assigns every field from the request — see updateMyDemographics.
  const [loadedApplicant, setLoadedApplicant] = useState<Record<string, unknown> | null>(null);
  const [savingEquity, setSavingEquity] = useState(false);
  const [equityMessage, setEquityMessage] = useState<string | null>(null);

  /**
   * Save one employment-equity answer.
   *
   * <p>Saves on change rather than behind a Save button: each control is one answer, and a person
   * withdrawing consent should not have to find a second control to make it take effect.
   */
  const saveEquity = async (change: Record<string, string | boolean>) => {
    if (!profile?.id || !loadedApplicant) return;
    setSavingEquity(true);
    setEquityMessage(null);
    try {
      await updateMyDemographics(profile.id, loadedApplicant, change);
      setProfile((prev) => (prev ? { ...prev, ...change } : prev));
      setLoadedApplicant((prev) => (prev ? { ...prev, ...change } : prev));
      setEquityMessage('Saved.');
    } catch {
      // Say that nothing was saved rather than leaving the control showing the new value as
      // though it had been.
      setEquityMessage('That could not be saved, so nothing was changed. Try again.');
      setProfile((prev) => (prev ? { ...prev } : prev));
    } finally {
      setSavingEquity(false);
    }
  };

  /**
   * Ask for this information to be erased.
   *
   * <p>Confirmed first, because it is a request against one's own record that somebody then has to
   * carry out across systems — not something to trigger by mis-clicking beside a checkbox.
   */
  const requestErasure = async () => {
    if (!window.confirm(
      'Ask for your employment-equity information to be erased?\n\n'
      + 'This raises a request under POPIA section 24, answered within 30 days. '
      + 'It is not the same as withdrawing consent, which stops the information being used '
      + 'but keeps it on file.',
    )) return;

    setSavingEquity(true);
    setEquityMessage(null);
    try {
      await requestOwnErasure('Erasure of employment-equity information, requested from my profile.');
      setEquityMessage('Request raised. You will hear back within 30 days.');
    } catch {
      setEquityMessage('The request could not be raised, so nothing was submitted. Try again.');
    } finally {
      setSavingEquity(false);
    }
  };

  const loadCandidateData = useCallback(async () => {
    if (!user?.email) { setLoading(false); return; }
    setLoading(true);
    try {
      const applicantId = await getApplicantId(user.email);
      if (!applicantId) { setLoading(false); return; }

      const [applicantData, docs, apps] = await Promise.all([
        getApplicant(applicantId),
        fetchDocuments(applicantId),
        fetchApplications(applicantId),
      ]);

      if (applicantData) {
        setLoadedApplicant(applicantData);
        setProfile({
          id: applicantData.id,
          firstName: applicantData.name || applicantData.firstName || '',
          lastName: applicantData.surname || applicantData.lastName || '',
          email: applicantData.email || user.email,
          phone: applicantData.phone || applicantData.phoneNumber || '',
          location: applicantData.address || applicantData.location || '',
          profileImage: null,
          headline: applicantData.headline || '',
          summary: applicantData.summary || '',
          dateOfBirth: applicantData.dateOfBirth || '',
          nationality: applicantData.nationality || '',
          gender: applicantData.gender,
          race: applicantData.race,
          disabilityStatus: applicantData.disabilityStatus,
          citizenshipStatus: applicantData.citizenshipStatus,
          demographicsConsent: applicantData.demographicsConsent,
        });

        // Skills are stored as a JSON array — the staff form writes JSON.stringify(skills). This
        // split that string on commas, so ["Programme delivery","Jira"] rendered as two entries
        // reading ["Programme delivery" and "Jira"], brackets and quotes included.
        setSkills(
          parseList(applicantData.skills).map((name: string, idx: number) => ({
            id: `skill-${idx}`,
            name,
            level: 'intermediate' as const,
            years: 0,
            category: 'technical' as const,
          })),
        );

        // Neither of these was ever populated: the tabs rendered an empty list on every profile
        // while the data sat on the record. The setters were named _setExperiences and
        // _setEducation so the unused-variable lint would not mention it.
        setExperiences(
          parseObjectList(applicantData.experience).map((entry, idx) => ({
            id: `experience-${idx}`,
            company: String(entry.company ?? ''),
            position: String(entry.position ?? ''),
            startDate: String(entry.startDate ?? ''),
            endDate: entry.endDate ? String(entry.endDate) : null,
            isCurrent: !entry.endDate,
            description: String(entry.description ?? ''),
            location: '',
            achievements: [],
          })),
        );

        setEducation(
          parseObjectList(applicantData.education).map((entry, idx) => ({
            id: `education-${idx}`,
            institution: String(entry.institution ?? ''),
            degree: String(entry.degree ?? ''),
            field: String(entry.fieldOfStudy ?? ''),
            startYear: '',
            endYear: entry.graduationYear ? String(entry.graduationYear) : null,
            isCurrent: false,
            gpa: null,
            description: '',
            honors: [],
          })),
        );
      }

      setDocuments(docs.map((d: any) => ({
        id: d.id,
        name: d.fileName || d.name || 'Document',
        type: (d.documentType || d.type || 'other').toLowerCase() as Document['type'],
        url: d.downloadUrl || d.url || '',
        uploadedAt: d.uploadedAt || d.createdAt || new Date().toISOString(),
        size: d.fileSize || d.size || 0,
      })));

      setApplications(apps.map((a: any) => ({
        id: a.id,
        jobTitle: a.jobTitle || '',
        company: 'ShumelaHire',
        appliedDate: a.submittedAt || a.createdAt || new Date().toISOString(),
        status: (a.status || 'applied').toLowerCase().replace(/ /g, '_') as Application['status'],
        currentStage: a.statusDisplayName || a.status || '',
        notes: a.notes || '',
      })));
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCandidateData();
  }, [user, loadCandidateData]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'hired': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'offer_extended': return <StarIcon className="w-5 h-5 text-yellow-500" />;
      case 'interview_scheduled': return <CalendarIcon className="w-5 h-5 text-violet-500" />;
      case 'interview_completed': return <EyeIcon className="w-5 h-5 text-purple-500" />;
      case 'reviewing': return <ClockIcon className="w-5 h-5 text-orange-500" />;
      case 'rejected': return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default: return <ClockIcon className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hired': return 'bg-green-100 text-green-800';
      case 'offer_extended': return 'bg-yellow-100 text-yellow-800';
      case 'interview_scheduled': return 'bg-gold-100 text-gold-800';
      case 'interview_completed': return 'bg-purple-100 text-purple-800';
      case 'reviewing': return 'bg-orange-100 text-orange-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'withdrawn': return 'bg-muted text-foreground';
      default: return 'bg-muted text-foreground';
    }
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'expert': return 'bg-green-100 text-green-800 border-green-300';
      case 'advanced': return 'bg-gold-100 text-gold-800 border-violet-300';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'beginner': return 'bg-muted text-foreground border-border';
      default: return 'bg-muted text-foreground border-border';
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
        className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-full shadow-sm ${
          isEditing
            ? 'border-border text-foreground bg-card hover:bg-muted'
            : 'bg-transparent border-2 border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider'
        }`}
      >
        <PencilIcon className="w-4 h-4 mr-2" />
        {isEditing ? 'Cancel Edit' : 'Edit Profile'}
      </button>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper>
        <IdentityBand
          eyebrow="Personal"
          title="My Profile"
          subtitle="Loading your profile..."
          actions={actions}
        />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-500"></div>
        </div>
      </PageWrapper>
    );
  }

  if (!profile) {
    return (
      <PageWrapper>
        <IdentityBand
          eyebrow="Personal"
          title="My Profile"
          subtitle="Manage your professional profile"
          actions={actions}
        />
        <div className="bg-card rounded-control shadow p-12 text-center">
          <UserIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No profile data</h3>
          <p className="text-sm text-muted-foreground">Your profile information will appear here once connected to the system.</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <IdentityBand
        eyebrow="Personal"
        title="My Profile"
        subtitle="Manage your professional profile and application materials"
        actions={actions}
      />
      <div className="space-y-6">
        {/* Profile Header Card */}
        <div className="bg-card rounded-control shadow p-6">
          <div className="flex items-start space-x-6">
            <div className="relative">
              <div className="w-24 h-24 bg-violet-600 rounded-full flex items-center justify-center">
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
                <button className="absolute -bottom-2 -right-2 p-2 bg-gold-500 text-violet-950 rounded-full shadow-sm hover:bg-gold-600">
                  <CameraIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {profile?.firstName} {profile?.lastName}
                  </h1>
                  <p className="text-lg text-gold-600 font-medium mt-1">
                    {profile?.headline}
                  </p>
                  
                  <div className="flex items-center space-x-4 mt-3 text-sm text-muted-foreground">
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
                
                {/*
                  A green "Authorized to Work" pill stood here. It read a field that is not stored
                  and was set to 'authorized' for every candidate at load, so the badge was shown to
                  everyone regardless — a claim about a person's right to work in the country, made
                  up by the page. Nothing replaces it, because nothing is known.
                */}
              </div>
              
              <p className="text-foreground mt-4 leading-relaxed">
                {profile?.summary}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-card rounded-control shadow">
          <div className="border-b border-border">
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
                      ? 'border-gold-500 text-gold-700'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
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
                    <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground">Date of Birth</label>
                        <p className="text-foreground">{new Date(profile?.dateOfBirth || '').toLocaleDateString()}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-foreground">Nationality</label>
                        <p className="text-foreground">{profile?.nationality}</p>
                      </div>
                      
                    </div>
                  </div>
                  
                  {/*
                    "Job Preferences" stood here — salary expectation, availability, remote-work
                    preference, willingness to relocate and preferred job types. All five were
                    constants assigned when the profile loaded and then rendered as this person's
                    answers, so every candidate saw the same preferences presented as their own.
                    Removed rather than left showing an invented answer. Collecting any of them is a
                    product decision with a form and a column behind it.
                  */}

                  {/*
                    Employment equity — the only place these can be changed.

                    Staff may read these and may not rewrite them: they are given under consent and
                    feed statutory reporting, so someone else altering another person's
                    self-declaration is a different act from correcting a typo. That left this
                    screen as the only one on which a correction — or a withdrawal of consent — can
                    happen, and until now it did not offer either.
                  */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Employment equity</h3>
                    <p className="text-sm text-muted-foreground">
                      Voluntary, and it does not affect any application. Used only for
                      employment-equity reporting.
                    </p>

                    <div className="space-y-3">
                      <EquityField
                        label="Gender"
                        value={profile?.gender}
                        options={['Female', 'Male', 'Prefer not to say']}
                        onChange={(value) => void saveEquity({ gender: value })}
                        disabled={savingEquity}
                      />
                      <EquityField
                        label="Population group"
                        value={profile?.race}
                        options={['African', 'Coloured', 'Indian', 'White', 'Prefer not to say']}
                        onChange={(value) => void saveEquity({ race: value })}
                        disabled={savingEquity}
                      />
                      <EquityField
                        label="Disability"
                        value={profile?.disabilityStatus}
                        options={['Yes', 'No', 'Prefer not to say']}
                        onChange={(value) => void saveEquity({ disabilityStatus: value })}
                        disabled={savingEquity}
                      />
                      <EquityField
                        label="Citizenship"
                        value={profile?.citizenshipStatus}
                        options={['South African', 'Permanent resident', 'Work permit']}
                        onChange={(value) => void saveEquity({ citizenshipStatus: value })}
                        disabled={savingEquity}
                      />
                    </div>

                    <div className="rounded-control border border-border bg-muted px-4 py-3">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profile?.demographicsConsent ?? false}
                          disabled={savingEquity}
                          onChange={(e) => void saveEquity({ demographicsConsent: e.target.checked })}
                          className="mt-0.5 h-4 w-4"
                        />
                        <span className="text-sm text-foreground">
                          Use these answers for employment-equity reporting.
                          {/*
                            Withdrawing consent stops the answers being used. It does not erase
                            them. Those are different acts and the control must not let one look
                            like the other — the same wording the staff form uses.
                          */}
                          <span className="mt-1 block text-xs text-muted-foreground">
                            Clearing this stops them being used in reporting. It does not delete
                            what is stored — erasing the record is a separate request.
                          </span>
                        </span>
                      </label>
                    </div>

                    {/*
                      Withdrawing consent and asking for erasure are different acts, so they are
                      different controls. Clearing the box above stops the answers being used;
                      this asks for them to be removed, which is a request somebody has to action.
                    */}
                    <div className="pt-1">
                      <button
                        type="button"
                        disabled={savingEquity}
                        onClick={() => void requestErasure()}
                        className="text-sm font-semibold text-error hover:underline disabled:opacity-50"
                      >
                        Request erasure of this information
                      </button>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Raises a request under POPIA section 24. It is answered within 30 days.
                      </p>
                    </div>

                    {equityMessage && (
                      <p className="text-sm text-muted-foreground">{equityMessage}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Experience Tab */}
            {activeTab === 'experience' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Work Experience</h3>
                  {isEditing && (
                    <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-full text-gold-600 hover:bg-gold-50">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Experience
                    </button>
                  )}
                </div>
                
                <div className="space-y-6">
                  {experiences.map((exp, _index) => (
                    <div key={exp.id} className="border border-border rounded-control p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-muted rounded-control flex items-center justify-center">
                              <BriefcaseIcon className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-foreground">{exp.position}</h4>
                              <p className="text-gold-600 font-medium">{exp.company}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
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
                          
                          <p className="text-foreground mt-4">{exp.description}</p>
                          
                          {exp.achievements.length > 0 && (
                            <div className="mt-4">
                              <h5 className="text-sm font-medium text-foreground mb-2">Key Achievements:</h5>
                              <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
                                {exp.achievements.map((achievement, idx) => (
                                  <li key={idx}>{achievement}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        
                        {isEditing && (
                          <div className="flex space-x-2">
                            <button className="p-2 text-muted-foreground hover:text-gold-600 rounded-full">
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-muted-foreground hover:text-red-600 rounded-full">
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
                  <h3 className="text-lg font-semibold text-foreground">Education</h3>
                  {isEditing && (
                    <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-full text-gold-600 hover:bg-gold-50">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Education
                    </button>
                  )}
                </div>
                
                <div className="space-y-6">
                  {education.map((edu, _index) => (
                    <div key={edu.id} className="border border-border rounded-control p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-muted rounded-control flex items-center justify-center">
                              <AcademicCapIcon className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-foreground">{edu.degree} in {edu.field}</h4>
                              <p className="text-gold-600 font-medium">{edu.institution}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
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
                          
                          <p className="text-foreground mt-4">{edu.description}</p>
                          
                          {edu.honors.length > 0 && (
                            <div className="mt-4">
                              <h5 className="text-sm font-medium text-foreground mb-2">Honors & Awards:</h5>
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
                            <button className="p-2 text-muted-foreground hover:text-gold-600 rounded-full">
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-muted-foreground hover:text-red-600 rounded-full">
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
                  <h3 className="text-lg font-semibold text-foreground">Skills & Expertise</h3>
                  {isEditing && (
                    <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-full text-gold-600 hover:bg-gold-50">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Skill
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {['technical', 'soft', 'language', 'certification'].map((category) => (
                    <div key={category} className="space-y-4">
                      <h4 className="font-medium text-foreground capitalize border-b border-border pb-2">
                        {category === 'technical' ? 'Technical Skills' :
                         category === 'soft' ? 'Soft Skills' :
                         category === 'language' ? 'Languages' : 'Certifications'}
                      </h4>
                      
                      <div className="space-y-3">
                        {skills.filter(skill => skill.category === category).map((skill) => (
                          <div key={skill.id} className="relative">
                            <div className={`inline-flex items-center px-3 py-2 rounded-control border text-sm font-medium ${getSkillLevelColor(skill.level)}`}>
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
                  <h3 className="text-lg font-semibold text-foreground">Documents & Portfolio</h3>
                  {isEditing && (
                    <button className="inline-flex items-center px-4 py-2 bg-transparent border-2 border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider rounded-full text-sm font-medium">
                      <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                      Upload Document
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="border border-border rounded-control p-4 hover:border-border transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-gold-100 rounded-control flex items-center justify-center">
                            <DocumentTextIcon className="w-5 h-5 text-gold-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">{getEnumLabel('documentType', doc.type)}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatFileSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-1">
                          <button className="p-1 text-muted-foreground hover:text-gold-600 rounded-full">
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          {isEditing && (
                            <button className="p-1 text-muted-foreground hover:text-red-600 rounded-full">
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
                  <h3 className="text-lg font-semibold text-foreground">My Job Applications</h3>
                  <div className="text-sm text-muted-foreground">
                    {applications.length} applications
                  </div>
                </div>
                
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="border border-border rounded-control p-6 hover:border-border transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-muted rounded-control flex items-center justify-center">
                              <BriefcaseIcon className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-foreground">{app.jobTitle}</h4>
                              <p className="text-gold-600 font-medium">{app.company}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Applied on {new Date(app.appliedDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex items-center space-x-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                              {getStatusIcon(app.status)}
                              <span className="ml-1">{getEnumLabel('applicationStatus', app.status)}</span>
                            </span>
                            <span className="text-sm text-muted-foreground">Current Stage: {app.currentStage}</span>
                            {app.interviewDate && (
                              <span className="text-sm text-gold-600">
                                Interview: {new Date(app.interviewDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          
                          {app.notes && (
                            <p className="text-sm text-foreground mt-3 bg-muted rounded p-3">
                              {app.notes}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <button className="p-2 text-muted-foreground hover:text-gold-600 rounded-full">
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <button className="p-2 text-muted-foreground hover:text-muted-foreground rounded-full">
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
