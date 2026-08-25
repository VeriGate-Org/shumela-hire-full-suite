'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import IdentityBand from '@/components/record/IdentityBand';
import DecisionBar, { PrimaryAction, SecondaryAction } from '@/components/record/DecisionBar';
import {
  ApplicantSnapshot,
  changeCount,
  hasChanged,
  previousValue,
  summarise,
  summaryLine,
} from '@/components/applicants/changes';
import { apiFetch } from '@/lib/api-fetch';
import { useToast } from '@/components/Toast';
import AiAssistPanel from '@/components/ai/AiAssistPanel';
import AiDuplicateDetectionPanel from '@/components/ai/AiDuplicateDetectionPanel';
import ConfirmDialog from '@/components/ConfirmDialog';
import { getEnumLabel } from '@/utils/enumLabels';

interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: number;
}

interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface ApplicantData {
  id?: number;
  name: string;
  surname: string;
  email: string;
  phone: string;
  idPassportNumber: string;
  address: string;
  education: Education[];
  experience: Experience[];
  skills: string[];
  gender?: string;
  race?: string;
  disabilityStatus?: string;
  citizenshipStatus?: string;
  demographicsConsent?: boolean;
}

interface Document {
  id: number;
  type: 'CV' | 'SUPPORT';
  filename: string;
  fileSize: number;
  uploadedAt: string;
  fileSizeFormatted: string;
}

interface ApplicantProfileProps {
  /**
   * The API returns a string id. This declared `number`, which typed a lie — it is only ever
   * interpolated into a URL, so nothing broke, and nothing would have warned if it had.
   */
  applicantId?: string | number;
  onSave?: (applicant: ApplicantData) => void;
}

export default function ApplicantProfile({ applicantId, onSave }: ApplicantProfileProps) {
  const { user: _user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<ApplicantData>({
    name: '',
    surname: '',
    email: '',
    phone: '',
    idPassportNumber: '',
    address: '',
    education: [],
    experience: [],
    skills: []
  });
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // A masked value contains an asterisk; a real ID or passport never does. Mirrors the guard the
  // service applies, so the two cannot disagree about what "masked" means.
  const [replacingId, setReplacingId] = useState(false);

  // The record as it was loaded. Everything the save bar says is a comparison against this, so it
  // is set once on load and never written again until a save succeeds.
  const [original, setOriginal] = useState<ApplicantSnapshot | null>(null);

  // Everything the save bar and the per-field hints say comes from this one comparison.
  const changes = useMemo(() => summarise(original, formData), [original, formData]);
  const pendingCount = changeCount(changes, replacingId);

  /**
   * A marker beside a section heading whose list changed.
   *
   * <p>A scalar field can show its previous value under the input. A list cannot, so the heading
   * carries what changed instead — "one skill added", "one qualification removed".
   */
  const SectionChanged = ({ field }: { field: string }) => {
    if (!hasChanged(changes, field)) return null;
    const labels = changes.filter((c) => c.field === field).map((c) => c.label).join(' · ');
    return (
      <span className="text-xs font-semibold text-accent-gold">{labels}</span>
    );
  };

  const ChangedFrom = ({ field }: { field: string }) => {
    const before = previousValue(changes, field);
    if (before === undefined) return null;
    return (
      <p className="mt-1 text-xs text-accent-gold font-semibold">Changed from {before}</p>
    );
  };

  /**
   * Put the form back the way it was loaded.
   *
   * <p>Documents are deliberately untouched: they upload immediately, so they were never part of
   * what "discard" is about to throw away, and silently reverting them is not possible anyway.
   */
  const handleDiscard = () => {
    if (!original) return;
    if (pendingCount > 0 && !window.confirm(`Discard ${pendingCount} unsaved ${pendingCount === 1 ? 'change' : 'changes'}? Uploaded documents are not affected.`)) {
      return;
    }
    setFormData((prev) => ({ ...prev, ...JSON.parse(JSON.stringify(original)) }));
    setReplacingId(false);
    setErrors({});
  };
  const originalIdRef = useRef('');
  const isMaskedId = formData.idPassportNumber.includes('*');
  const [showSuccess, setShowSuccess] = useState(false);
  const [deleteDocId, setDeleteDocId] = useState<number | null>(null);
  
  const loadApplicant = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/applicants/${applicantId}`);
      if (response.ok) {
        const data = await response.json();
        const parseJsonField = (value: string | null | undefined, fallback: unknown[] = []) => {
          if (!value) return fallback;
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : fallback;
          } catch {
            return fallback;
          }
        };
        originalIdRef.current = data.idPassportNumber ?? '';
        const loaded = {
          ...data,
          education: parseJsonField(data.education),
          experience: parseJsonField(data.experience),
          skills: parseJsonField(data.skills),
        };
        setFormData(loaded);
        // Structured-cloned so later edits to formData cannot reach back and mutate the baseline,
        // which would make every comparison against it read "no changes".
        setOriginal(JSON.parse(JSON.stringify(loaded)));
      }
    } catch (error) {
      console.error('Error loading applicant:', error);
    } finally {
      setLoading(false);
    }
  }, [applicantId]);

  const loadDocuments = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/applicants/${applicantId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  }, [applicantId]);

  useEffect(() => {
    if (applicantId) {
      loadApplicant();
      loadDocuments();
    }
  }, [applicantId, loadApplicant, loadDocuments]);
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Messages say what is wrong with what was typed. "Email is invalid" tells someone their
    // input is rejected without telling them why, which leaves them to guess.
    if (!formData.name.trim()) newErrors.name = 'A first name is needed to identify this person.';
    if (!formData.surname.trim()) newErrors.surname = 'A surname is needed to identify this person.';
    if (!formData.email.trim()) {
      newErrors.email = 'An email address is needed — it is how this candidate is contacted.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'This needs an address like name@example.co.za — check the @ and the domain after it.';
    }
    // The service ignores a masked value, so a save that leaves it in place is silently a no-op on
    // this field. Saying so beats letting someone believe they changed it.
    if (replacingId && !formData.idPassportNumber.trim()) {
      newErrors.idPassportNumber = 'Enter the full number, or choose to keep the existing one.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        education: JSON.stringify(formData.education),
        experience: JSON.stringify(formData.experience),
        skills: JSON.stringify(formData.skills)
      };
      
      const url = applicantId ? `/api/applicants/${applicantId}` : '/api/applicants';
      const method = applicantId ? 'PUT' : 'POST';
      
      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(submitData),
      });
      
      if (response.ok) {
        const result = await response.json();
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        // What was unsaved is now saved, so the bar has nothing left to report. Taken from the
        // submitted state rather than the response, because the response masks the identity number
        // and re-baselining on it would show a phantom change on the next edit.
        setOriginal(JSON.parse(JSON.stringify(formData)));
        setReplacingId(false);
        
        if (onSave) {
          onSave(result);
        }
      } else {
        const errorData = await response.json();
        setErrors({ general: errorData.message || 'Failed to save applicant' });
      }
    } catch (error) {
      console.error('Error saving applicant:', error);
      setErrors({ general: 'An error occurred while saving' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileUpload = async (file: File, type: 'CV' | 'SUPPORT') => {
    if (!applicantId) {
      toast('Please save the applicant profile first before uploading documents', 'info');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast('File size must be less than 10MB', 'info');
      return;
    }
    
    if (!file.type.includes('pdf') && !file.type.includes('word') && !file.type.includes('document')) {
      toast('Only PDF and Word documents are allowed', 'info');
      return;
    }
    
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      const response = await apiFetch(`/api/applicants/${applicantId}/documents`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        await loadDocuments(); // Refresh documents list
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        const text = await response.text();
        let message = 'Failed to upload document';
        try {
          const errorData = JSON.parse(text);
          message = errorData.message || message;
        } catch {
          // Response is not JSON (e.g. HTML error page)
        }
        toast(message, 'error');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast('An error occurred while uploading', 'error');
    } finally {
      setUploading(false);
    }
  };
  
  const handleDeleteDocument = async (documentId: number) => {
    setDeleteDocId(documentId);
  };

  const confirmDeleteDocument = async () => {
    if (deleteDocId === null) return;
    setDeleteDocId(null);
    try {
      const response = await apiFetch(`/api/applicants/${applicantId}/documents/${deleteDocId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadDocuments();
      } else {
        toast('Failed to delete document', 'error');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast('An error occurred while deleting', 'error');
    }
  };
  
  const removeEducation = (index: number) => {
    setFormData(prev => ({ ...prev, education: prev.education.filter((_, i) => i !== index) }));
  };

  const removeExperience = (index: number) => {
    setFormData(prev => ({ ...prev, experience: prev.experience.filter((_, i) => i !== index) }));
  };

  /**
   * Change one field of one entry, without mutating the entry.
   *
   * <p>The education inputs previously did {@code const copy = [...list]; copy[i].field = value},
   * which copies the array but not the objects inside it — so the "copy" and the original share
   * every entry, and the assignment writes through to both. That is invisible while nothing else
   * holds a reference, and stops the unsaved-changes comparison working the moment something does.
   */
  const editEntry = <T,>(list: T[], index: number, patch: Partial<T>): T[] =>
    list.map((entry, i) => (i === index ? { ...entry, ...patch } : entry));

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { institution: '', degree: '', fieldOfStudy: '', graduationYear: new Date().getFullYear() }]
    }));
  };
  
  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, { company: '', position: '', startDate: '', endDate: '', description: '' }]
    }));
  };
  
  const addSkill = () => {
    const skill = prompt('Enter a skill:');
    if (skill?.trim()) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()]
      }));
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <IdentityBand
        eyebrow={applicantId ? 'Editing applicant' : 'New applicant'}
        title={
          [formData.name, formData.surname].filter(Boolean).join(' ') ||
          (applicantId ? 'Applicant' : 'New applicant')
        }
        subtitle={
          applicantId
            ? 'Changes are not saved until you say so. Documents are the exception — they save on upload.'
            : 'Nothing is saved until you say so.'
        }
      />

      {/*
        The save bar states what is about to happen and stays with you down a long form. A single
        Save at the bottom answers "how do I finish"; it does not answer "what am I about to do" —
        which is the question that matters when editing a record somebody else created.
      */}
      {pendingCount > 0 && (
        <div className="sticky top-2 z-10">
          <DecisionBar
            ask={`${pendingCount} unsaved ${pendingCount === 1 ? 'change' : 'changes'}`}
            why={summaryLine(changes, replacingId)}
            tone="owed"
          >
            <PrimaryAction type="submit" form="applicant-form" disabled={loading}>
              Save changes
            </PrimaryAction>
            <SecondaryAction type="button" onClick={handleDiscard} disabled={loading}>
              Discard
            </SecondaryAction>
          </DecisionBar>
        </div>
      )}
      
      {showSuccess && (
        <div className="mb-4 p-4 bg-surface-teal border border-accent-teal text-accent-teal rounded">
          Profile saved successfully!
        </div>
      )}
      
      {errors.general && (
        <div className="mb-4 p-4 bg-error/10 border border-error text-error rounded">
          {errors.general}
        </div>
      )}
      
      <form id="applicant-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full p-2 border rounded-control ${errors.name ? 'border-error' : 'border-border'}`}
            />
            <ChangedFrom field="name" />
            {errors.name && <p className="text-error text-sm mt-1">{errors.name}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Surname *
            </label>
            <input
              type="text"
              value={formData.surname}
              onChange={(e) => setFormData(prev => ({ ...prev, surname: e.target.value }))}
              className={`w-full p-2 border rounded-control ${errors.surname ? 'border-error' : 'border-border'}`}
            />
            <ChangedFrom field="surname" />
            {errors.surname && <p className="text-error text-sm mt-1">{errors.surname}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className={`w-full p-2 border rounded-control ${errors.email ? 'border-error' : 'border-border'}`}
            />
            <ChangedFrom field="email" />
            {errors.email && <p className="text-error text-sm mt-1">{errors.email}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full p-2 border border-border rounded-control"
            />
            <ChangedFrom field="phone" />
          </div>
          
          <div>
            <label htmlFor="id-passport" className="block text-sm font-medium text-foreground mb-1">
              ID/Passport Number
            </label>
            {/*
              The server masks this field on every read, so what loaded here is "*****3456", not the
              number. Binding an editable input to that and posting it back is how the real value
              got overwritten. The service now refuses a masked value, but a field that silently
              discards what you type is its own bug — so replacing it is a deliberate act instead.
            */}
            {isMaskedId && !replacingId ? (
              <div className="rounded-control border border-dashed border-border bg-muted/40 p-3">
                <p className="font-mono text-sm tabular-nums text-foreground">
                  {formData.idPassportNumber}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Masked by the server — the full number is never sent to this screen, so it cannot
                  be edited in place.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setReplacingId(true);
                    setFormData(prev => ({ ...prev, idPassportNumber: '' }));
                  }}
                  className="mt-2 text-xs font-extrabold uppercase tracking-[0.06em] text-primary hover:underline"
                >
                  Replace ID number
                </button>
              </div>
            ) : (
              <>
                <input
                  id="id-passport"
                  type="text"
                  value={formData.idPassportNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, idPassportNumber: e.target.value }))}
                  placeholder={replacingId ? 'Enter the full number' : undefined}
                  className="w-full p-2 border border-border rounded-control"
                />
                {errors.idPassportNumber && (
                  <p role="alert" className="mt-1 text-xs font-semibold text-error">
                    {errors.idPassportNumber}
                  </p>
                )}
                {replacingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setReplacingId(false);
                      setErrors(prev => {
                        const next = { ...prev };
                        delete next.idPassportNumber;
                        return next;
                      });
                      setFormData(prev => ({ ...prev, idPassportNumber: originalIdRef.current }));
                    }}
                    className="mt-1.5 text-xs font-semibold text-muted-foreground hover:underline"
                  >
                    Keep the existing number
                  </button>
                )}
              </>
            )}
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-1">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full p-2 border border-border rounded-control"
              rows={3}
            />
            <ChangedFrom field="address" />
          </div>
        </div>
        
        {/* AI Duplicate Detection */}
        <AiAssistPanel title="Duplicate Detection" feature="AI_DUPLICATE_DETECTION" description="Check for existing candidates with matching name, email, or ID number">
          <AiDuplicateDetectionPanel
            fullName={`${formData.name} ${formData.surname}`.trim()}
            email={formData.email}
            phone={formData.phone || undefined}
            idNumber={formData.idPassportNumber || undefined}
            autoCheck={false}
          />
        </AiAssistPanel>

        {/* Education Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-baseline gap-3 flex-wrap"><h3 className="text-lg font-medium">Education</h3><SectionChanged field="education" /></div>
            <button
              type="button"
              onClick={addEducation}
              className="px-3 py-1 bg-gold-500 text-cta-foreground rounded-control text-sm hover:bg-gold-600"
            >
              Add Education
            </button>
          </div>
          
          {formData.education.map((edu, index) => (
            <div key={index} className="mb-3 p-3 border border-border rounded-control">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => removeEducation(index)}
                  className="text-xs font-semibold text-error hover:underline"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                <input
                  type="text"
                  aria-label="Institution"
                  placeholder="Institution"
                  value={edu.institution}
                  onChange={(e) => setFormData(prev => ({
                    ...prev, education: editEntry(prev.education, index, { institution: e.target.value }),
                  }))}
                  className="w-full p-2 border border-border rounded-control bg-card text-foreground"
                />
                <input
                  type="text"
                  aria-label="Qualification"
                  placeholder="Qualification"
                  value={edu.degree}
                  onChange={(e) => setFormData(prev => ({
                    ...prev, education: editEntry(prev.education, index, { degree: e.target.value }),
                  }))}
                  className="w-full p-2 border border-border rounded-control bg-card text-foreground"
                />
                <input
                  type="text"
                  aria-label="Field of study"
                  placeholder="Field of study"
                  value={edu.fieldOfStudy}
                  onChange={(e) => setFormData(prev => ({
                    ...prev, education: editEntry(prev.education, index, { fieldOfStudy: e.target.value }),
                  }))}
                  className="w-full p-2 border border-border rounded-control bg-card text-foreground"
                />
                <input
                  type="number"
                  aria-label="Year completed"
                  placeholder="Year completed"
                  value={Number.isFinite(edu.graduationYear) ? edu.graduationYear : ''}
                  onChange={(e) => {
                    // parseInt('') is NaN, which JSON.stringify writes as null. Clearing the box
                    // therefore saved a null year while the box looked merely empty.
                    const parsed = parseInt(e.target.value, 10);
                    setFormData(prev => ({
                      ...prev,
                      education: editEntry(prev.education, index, {
                        graduationYear: Number.isFinite(parsed) ? parsed : (undefined as unknown as number),
                      }),
                    }));
                  }}
                  className="w-full p-2 border border-border rounded-control bg-card text-foreground"
                />
              </div>
            </div>
          ))}
          {formData.education.length === 0 && (
            <p className="text-sm text-muted-foreground">No qualifications recorded.</p>
          )}
        </div>

        {/*
          Work experience.

          This section did not exist. The field was parsed on load, held in state and written back
          on every save — but never rendered, and its add handler was named _addExperience so the
          unused-variable lint would stay quiet about it. A recruiter could not see or correct a
          candidate's work history, and nothing said so.
        */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-baseline gap-3 flex-wrap"><h3 className="text-lg font-medium text-foreground">Work experience</h3><SectionChanged field="experience" /></div>
            <button
              type="button"
              onClick={addExperience}
              className="px-3 py-1 bg-gold-500 text-cta-foreground rounded-control text-sm hover:bg-gold-600"
            >
              Add a role
            </button>
          </div>

          {formData.experience.map((role, index) => (
            <div key={index} className="mb-3 p-3 border border-border rounded-control">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => removeExperience(index)}
                  className="text-xs font-semibold text-error hover:underline"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                <input
                  type="text"
                  aria-label="Employer"
                  placeholder="Employer"
                  value={role.company}
                  onChange={(e) => setFormData(prev => ({
                    ...prev, experience: editEntry(prev.experience, index, { company: e.target.value }),
                  }))}
                  className="w-full p-2 border border-border rounded-control bg-card text-foreground"
                />
                <input
                  type="text"
                  aria-label="Position"
                  placeholder="Position"
                  value={role.position}
                  onChange={(e) => setFormData(prev => ({
                    ...prev, experience: editEntry(prev.experience, index, { position: e.target.value }),
                  }))}
                  className="w-full p-2 border border-border rounded-control bg-card text-foreground"
                />
                <input
                  type="text"
                  aria-label="From"
                  placeholder="From (e.g. Mar 2019)"
                  value={role.startDate}
                  onChange={(e) => setFormData(prev => ({
                    ...prev, experience: editEntry(prev.experience, index, { startDate: e.target.value }),
                  }))}
                  className="w-full p-2 border border-border rounded-control bg-card text-foreground"
                />
                <input
                  type="text"
                  aria-label="To"
                  placeholder="To (or Present)"
                  value={role.endDate}
                  onChange={(e) => setFormData(prev => ({
                    ...prev, experience: editEntry(prev.experience, index, { endDate: e.target.value }),
                  }))}
                  className="w-full p-2 border border-border rounded-control bg-card text-foreground"
                />
                <textarea
                  aria-label="What the role involved"
                  placeholder="What the role involved"
                  rows={2}
                  value={role.description}
                  onChange={(e) => setFormData(prev => ({
                    ...prev, experience: editEntry(prev.experience, index, { description: e.target.value }),
                  }))}
                  className="w-full p-2 border border-border rounded-control bg-card text-foreground md:col-span-2"
                />
              </div>
            </div>
          ))}
          {formData.experience.length === 0 && (
            <p className="text-sm text-muted-foreground">No roles recorded.</p>
          )}
        </div>

        {/* Skills Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-baseline gap-3 flex-wrap"><h3 className="text-lg font-medium">Skills</h3><SectionChanged field="skills" /></div>
            <button
              type="button"
              onClick={addSkill}
              className="px-3 py-1 bg-gold-500 text-cta-foreground rounded-control text-sm hover:bg-gold-600"
            >
              Add Skill
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {formData.skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-muted rounded-full text-sm flex items-center gap-2"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => {
                    const newSkills = formData.skills.filter((_, i) => i !== index);
                    setFormData(prev => ({ ...prev, skills: newSkills }));
                  }}
                  className="text-error hover:text-error"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
        
        {/*
          Employment equity — shown, not edited.

          These four answers are given by the candidate under consent and feed employment-equity
          reporting. Letting a member of staff change them here means someone else altering another
          person's self-declaration, which is a different act from correcting a typo in a surname.

          The server already refuses a write from a viewer who was not shown them
          (ApplicantService gates on demographicsAccess.mayView). This is the narrower rule on top:
          staff may read them and may not rewrite them.
        */}
        <div className="border-t border-border pt-6">
          <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
            <h3 className="text-lg font-medium text-foreground">Employment equity</h3>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.12em]">
              Given by the candidate
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Collected under the Employment Equity Act and used for reporting only. Giving it is
            voluntary and does not affect any application.
          </p>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {[
              ['Gender', formData.gender],
              ['Population group', formData.race],
              ['Disability', formData.disabilityStatus],
              ['Citizenship', formData.citizenshipStatus],
            ].map(([label, value]) => (
              <div key={label as string}>
                <dt className="text-[0.5625rem] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
                  {label}
                </dt>
                <dd className="text-sm text-foreground mt-0.5">
                  {value || <span className="text-muted-foreground">Not declared</span>}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 rounded-control border border-border bg-muted px-4 py-3">
            <p className="text-sm font-bold text-foreground">
              {formData.demographicsConsent
                ? 'Consent given for this to be used in employment-equity reporting.'
                : 'Consent not given, so this is not used in reporting.'}
            </p>
            {/*
              This says what is true rather than what would be reassuring. There is no candidate
              self-service surface for these fields anywhere in the product — this form was the only
              one — so "the candidate maintains these on their profile" would be a comfortable lie.
            */}
            <p className="mt-1 text-xs text-muted-foreground">
              Staff cannot change these here. There is currently no screen on which a candidate can
              revise them either, so a correction needs a developer until one exists.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gold-500 text-cta-foreground rounded-control hover:bg-gold-600 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (applicantId ? 'Update Profile' : 'Create Profile')}
          </button>
        </div>
      </form>
      
      {/* Documents Section - Only show if editing existing applicant */}
      {applicantId && (
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-medium mb-1">Documents</h3>
          {/* Uploads write immediately, unlike every other field on this form. Mixing the two
              silently is how someone discards their changes and is surprised the file stayed. */}
          <p className="mb-4 text-xs text-muted-foreground">
            Files save as soon as they are uploaded — they are not part of the changes saved below.
          </p>
          
          {/* File Upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Upload CV
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'CV');
                }}
                disabled={uploading}
                className="w-full p-2 border border-border rounded-control"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Upload Supporting Document
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'SUPPORT');
                }}
                disabled={uploading}
                className="w-full p-2 border border-border rounded-control"
              />
            </div>
          </div>
          
          {/* Documents List */}
          {documents.length > 0 && (
            <div className="bg-muted rounded-control p-4">
              <h4 className="font-medium mb-3">Uploaded Documents</h4>
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-card rounded border">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        doc.type === 'CV' ? 'bg-gold-100 text-gold-800' : 'bg-muted text-foreground'
                      }`}>
                        {getEnumLabel('documentType', doc.type)}
                      </span>
                      <span className="font-medium">{doc.filename}</span>
                      <span className="text-sm text-muted-foreground">{doc.fileSizeFormatted}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="text-error hover:text-error font-medium text-sm"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteDocId !== null}
        title="Delete Document"
        message="Are you sure you want to delete this document?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDeleteDocument}
        onCancel={() => setDeleteDocId(null)}
      />
    </div>
  );
}