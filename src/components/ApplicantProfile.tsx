'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-fetch';
import { useToast } from '@/components/Toast';
import AiAssistPanel from '@/components/ai/AiAssistPanel';
import AiDuplicateDetectionPanel from '@/components/ai/AiDuplicateDetectionPanel';
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
  applicantId?: number;
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
  const [showSuccess, setShowSuccess] = useState(false);
  
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
        setFormData({
          ...data,
          education: parseJsonField(data.education),
          experience: parseJsonField(data.experience),
          skills: parseJsonField(data.skills),
        });
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
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.surname.trim()) newErrors.surname = 'Surname is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
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
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      const response = await apiFetch(`/api/applicants/${applicantId}/documents/${documentId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await loadDocuments(); // Refresh documents list
      } else {
        toast('Failed to delete document', 'error');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast('An error occurred while deleting', 'error');
    }
  };
  
  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { institution: '', degree: '', fieldOfStudy: '', graduationYear: new Date().getFullYear() }]
    }));
  };
  
  const _addExperience = () => {
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
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-sm shadow-lg">
      <h1 className="text-2xl font-bold mb-6">
        {applicantId ? 'Edit Applicant Profile' : 'Create Applicant Profile'}
      </h1>
      
      {showSuccess && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          Profile saved successfully!
        </div>
      )}
      
      {errors.general && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {errors.general}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full p-2 border rounded-sm ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Surname *
            </label>
            <input
              type="text"
              value={formData.surname}
              onChange={(e) => setFormData(prev => ({ ...prev, surname: e.target.value }))}
              className={`w-full p-2 border rounded-sm ${errors.surname ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.surname && <p className="text-red-500 text-sm mt-1">{errors.surname}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className={`w-full p-2 border rounded-sm ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID/Passport Number
            </label>
            <input
              type="text"
              value={formData.idPassportNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, idPassportNumber: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-sm"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-sm"
              rows={3}
            />
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
            <h3 className="text-lg font-medium">Education</h3>
            <button
              type="button"
              onClick={addEducation}
              className="px-3 py-1 bg-gold-500 text-white rounded-sm text-sm hover:bg-gold-600"
            >
              Add Education
            </button>
          </div>
          
          {formData.education.map((edu, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 p-3 border rounded-sm">
              <input
                type="text"
                placeholder="Institution"
                value={edu.institution}
                onChange={(e) => {
                  const newEducation = [...formData.education];
                  newEducation[index].institution = e.target.value;
                  setFormData(prev => ({ ...prev, education: newEducation }));
                }}
                className="p-2 border border-gray-300 rounded-sm"
              />
              <input
                type="text"
                placeholder="Degree"
                value={edu.degree}
                onChange={(e) => {
                  const newEducation = [...formData.education];
                  newEducation[index].degree = e.target.value;
                  setFormData(prev => ({ ...prev, education: newEducation }));
                }}
                className="p-2 border border-gray-300 rounded-sm"
              />
              <input
                type="text"
                placeholder="Field of Study"
                value={edu.fieldOfStudy}
                onChange={(e) => {
                  const newEducation = [...formData.education];
                  newEducation[index].fieldOfStudy = e.target.value;
                  setFormData(prev => ({ ...prev, education: newEducation }));
                }}
                className="p-2 border border-gray-300 rounded-sm"
              />
              <input
                type="number"
                placeholder="Graduation Year"
                value={edu.graduationYear}
                onChange={(e) => {
                  const newEducation = [...formData.education];
                  newEducation[index].graduationYear = parseInt(e.target.value);
                  setFormData(prev => ({ ...prev, education: newEducation }));
                }}
                className="p-2 border border-gray-300 rounded-sm"
              />
            </div>
          ))}
        </div>
        
        {/* Skills Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">Skills</h3>
            <button
              type="button"
              onClick={addSkill}
              className="px-3 py-1 bg-green-500 text-white rounded-sm text-sm hover:bg-green-600"
            >
              Add Skill
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {formData.skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-200 rounded-full text-sm flex items-center gap-2"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => {
                    const newSkills = formData.skills.filter((_, i) => i !== index);
                    setFormData(prev => ({ ...prev, skills: newSkills }));
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
        
        {/* Employment Equity Information (Optional) */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-1">Employment Equity Information (Optional)</h3>
          <p className="text-sm text-gray-500 mb-4">
            This information is collected in compliance with the Employment Equity Act and is used for reporting purposes only.
            Providing this information is voluntary and will not affect your application.
          </p>

          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.demographicsConsent || false}
                onChange={(e) => setFormData(prev => ({ ...prev, demographicsConsent: e.target.checked }))}
                className="h-4 w-4 text-gold-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                I consent to the collection and processing of my demographic information in accordance with POPIA
              </span>
            </label>
          </div>

          {formData.demographicsConsent && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={formData.gender || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value || undefined }))}
                  className="w-full p-2 border border-gray-300 rounded-sm"
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Race</label>
                <select
                  value={formData.race || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, race: e.target.value || undefined }))}
                  className="w-full p-2 border border-gray-300 rounded-sm"
                >
                  <option value="">Select...</option>
                  <option value="African">African</option>
                  <option value="Coloured">Coloured</option>
                  <option value="Indian">Indian</option>
                  <option value="White">White</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Disability Status</label>
                <select
                  value={formData.disabilityStatus || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, disabilityStatus: e.target.value || undefined }))}
                  className="w-full p-2 border border-gray-300 rounded-sm"
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Citizenship Status</label>
                <select
                  value={formData.citizenshipStatus || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, citizenshipStatus: e.target.value || undefined }))}
                  className="w-full p-2 border border-gray-300 rounded-sm"
                >
                  <option value="">Select...</option>
                  <option value="South African">South African</option>
                  <option value="Work Permit">Work Permit</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gold-500 text-white rounded-sm hover:bg-gold-600 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (applicantId ? 'Update Profile' : 'Create Profile')}
          </button>
        </div>
      </form>
      
      {/* Documents Section - Only show if editing existing applicant */}
      {applicantId && (
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-medium mb-4">Documents</h3>
          
          {/* File Upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full p-2 border border-gray-300 rounded-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full p-2 border border-gray-300 rounded-sm"
              />
            </div>
          </div>
          
          {/* Documents List */}
          {documents.length > 0 && (
            <div className="bg-gray-50 rounded-sm p-4">
              <h4 className="font-medium mb-3">Uploaded Documents</h4>
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded border">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        doc.type === 'CV' ? 'bg-gold-100 text-gold-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {getEnumLabel('documentType', doc.type)}
                      </span>
                      <span className="font-medium">{doc.filename}</span>
                      <span className="text-sm text-gray-500">{doc.fileSizeFormatted}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="text-red-500 hover:text-red-700 font-medium text-sm"
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
    </div>
  );
}