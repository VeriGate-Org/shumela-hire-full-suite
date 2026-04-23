'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { apiFetch } from '@/lib/api-fetch';
import { useRouter } from 'next/navigation';
import {
  UserCircleIcon,
  PhoneIcon,
  HomeIcon,
  BanknotesIcon,
  ExclamationCircleIcon,
  AcademicCapIcon,
  WrenchScrewdriverIcon,
  BriefcaseIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { employeeService, EmployeeSkill, EmployeeEducation } from '@/services/employeeService';
import { customFieldService, CustomField } from '@/services/customFieldService';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'personal' | 'banking' | 'emergency' | 'skills' | 'education' | 'employment' | 'custom'>('personal');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Skills state
  const [skills, setSkills] = useState<EmployeeSkill[]>([]);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState<number | null>(null);
  const [skillForm, setSkillForm] = useState({
    skillName: '',
    proficiencyLevel: 'INTERMEDIATE' as EmployeeSkill['proficiencyLevel'],
    yearsExperience: '',
    certified: false,
  });

  // Education state
  const [education, setEducation] = useState<EmployeeEducation[]>([]);
  const [showEducationForm, setShowEducationForm] = useState(false);
  const [editingEducationId, setEditingEducationId] = useState<number | null>(null);
  const [educationForm, setEducationForm] = useState({
    institution: '',
    qualification: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    grade: '',
  });

  // Custom fields state
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [savingCustom, setSavingCustom] = useState(false);

  // Employment history state
  const [employmentHistory, setEmploymentHistory] = useState<{
    hireDate: string;
    jobTitle: string;
    department: string;
  } | null>(null);

  const [personalForm, setPersonalForm] = useState({
    preferredName: '',
    personalEmail: '',
    phone: '',
    mobilePhone: '',
    maritalStatus: '',
    physicalAddress: '',
    postalAddress: '',
    city: '',
    province: '',
    postalCode: '',
    country: '',
  });

  const [bankingForm, setBankingForm] = useState({
    bankName: '',
    bankBranchCode: '',
    bankAccountNumber: '',
  });

  const [emergencyForm, setEmergencyForm] = useState({
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
  });

  const { user } = useAuth();
  const rawId = user?.employeeId || user?.id;
  const employeeId = rawId || '';

  useEffect(() => {
    if (!employeeId) return;
    Promise.all([
      apiFetch(`/api/employee/profile?employeeId=${employeeId}`).then(r => r.ok ? r.json() : null),
      apiFetch(`/api/employee/banking?employeeId=${employeeId}`).then(r => r.ok ? r.json() : null),
      apiFetch(`/api/employee/emergency-contact?employeeId=${employeeId}`).then(r => r.ok ? r.json() : null),
      employeeService.getSkills(employeeId),
      employeeService.getEducation(employeeId),
      customFieldService.getFieldsByEntityType('EMPLOYEE'),
      customFieldService.getValues('EMPLOYEE', employeeId),
    ]).then(([profile, banking, emergency, skillsData, educationData, cfDefs, cfValues]) => {
      if (profile) {
        setPersonalForm({
          preferredName: profile.preferredName || '',
          personalEmail: profile.personalEmail || '',
          phone: profile.phone || '',
          mobilePhone: profile.mobilePhone || '',
          maritalStatus: profile.maritalStatus || '',
          physicalAddress: profile.physicalAddress || '',
          postalAddress: profile.postalAddress || '',
          city: profile.city || '',
          province: profile.province || '',
          postalCode: profile.postalCode || '',
          country: profile.country || '',
        });
        setEmploymentHistory({
          hireDate: profile.hireDate || '',
          jobTitle: profile.jobTitle || '',
          department: profile.department || '',
        });
      }
      if (banking) {
        setBankingForm({
          bankName: banking.bankName || '',
          bankBranchCode: banking.bankBranchCode || '',
          bankAccountNumber: '',
        });
      }
      if (emergency) {
        setEmergencyForm({
          emergencyContactName: emergency.emergencyContactName || '',
          emergencyContactPhone: emergency.emergencyContactPhone || '',
          emergencyContactRelationship: emergency.emergencyContactRelationship || '',
        });
      }
      setSkills(skillsData || []);
      setEducation(educationData || []);
      if (cfDefs && cfDefs.length > 0) {
        setCustomFields(cfDefs);
        const vals: Record<string, string> = {};
        cfDefs.forEach((cf: CustomField) => {
          vals[cf.fieldName] = (cfValues && cfValues[cf.fieldName]) || cf.defaultValue || '';
        });
        setCustomFieldValues(vals);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [employeeId]);

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await apiFetch(`/api/employee/profile?employeeId=${employeeId}`, {
        method: 'PUT',
        body: JSON.stringify(personalForm),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      setMessage({ type: 'success', text: 'Personal details updated successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update.' });
    }
    setSaving(false);
  };

  const handleSaveBanking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await apiFetch(`/api/employee/banking?employeeId=${employeeId}`, {
        method: 'PUT',
        body: JSON.stringify(bankingForm),
      });
      if (!response.ok) throw new Error('Failed to update banking details');
      setMessage({ type: 'success', text: 'Banking details updated successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update.' });
    }
    setSaving(false);
  };

  const handleSaveEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await apiFetch(`/api/employee/emergency-contact?employeeId=${employeeId}`, {
        method: 'PUT',
        body: JSON.stringify(emergencyForm),
      });
      if (!response.ok) throw new Error('Failed to update emergency contact');
      setMessage({ type: 'success', text: 'Emergency contact updated successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update.' });
    }
    setSaving(false);
  };

  const handleSaveCustomFields = async () => {
    setSavingCustom(true);
    try {
      const payload = customFields.map(cf => ({
        customFieldId: cf.id,
        fieldValue: customFieldValues[cf.fieldName] || '',
      }));
      await customFieldService.setValues('EMPLOYEE', employeeId, payload);
      setMessage({ type: 'success', text: 'Custom fields updated successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save custom fields.' });
    }
    setSavingCustom(false);
  };

  // Skills handlers
  const resetSkillForm = () => {
    setSkillForm({ skillName: '', proficiencyLevel: 'INTERMEDIATE', yearsExperience: '', certified: false });
    setEditingSkillId(null);
    setShowSkillForm(false);
  };

  const handleSaveSkill = async () => {
    setSaving(true);
    try {
      const payload = {
        skillName: skillForm.skillName,
        proficiencyLevel: skillForm.proficiencyLevel,
        yearsExperience: skillForm.yearsExperience ? Number(skillForm.yearsExperience) : null,
        certified: skillForm.certified,
      };
      if (editingSkillId) {
        const updated = await employeeService.updateSkill(editingSkillId, employeeId, payload);
        setSkills(prev => prev.map(s => s.id === editingSkillId ? updated : s));
        setMessage({ type: 'success', text: 'Skill updated successfully.' });
      } else {
        const created = await employeeService.addSkill(employeeId, payload);
        setSkills(prev => [...prev, created]);
        setMessage({ type: 'success', text: 'Skill added successfully.' });
      }
      resetSkillForm();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save skill.' });
    }
    setSaving(false);
  };

  const handleDeleteSkill = async (id: number) => {
    try {
      await employeeService.deleteSkill(id);
      setSkills(prev => prev.filter(s => s.id !== id));
      setMessage({ type: 'success', text: 'Skill removed.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete skill.' });
    }
  };

  const handleEditSkill = (skill: EmployeeSkill) => {
    setSkillForm({
      skillName: skill.skillName,
      proficiencyLevel: skill.proficiencyLevel,
      yearsExperience: skill.yearsExperience != null ? String(skill.yearsExperience) : '',
      certified: skill.certified,
    });
    setEditingSkillId(skill.id || null);
    setShowSkillForm(true);
  };

  // Education handlers
  const resetEducationForm = () => {
    setEducationForm({ institution: '', qualification: '', fieldOfStudy: '', startDate: '', endDate: '', grade: '' });
    setEditingEducationId(null);
    setShowEducationForm(false);
  };

  const handleSaveEducation = async () => {
    setSaving(true);
    try {
      const payload = {
        institution: educationForm.institution,
        qualification: educationForm.qualification,
        fieldOfStudy: educationForm.fieldOfStudy || null,
        startDate: educationForm.startDate || null,
        endDate: educationForm.endDate || null,
        grade: educationForm.grade || null,
      };
      if (editingEducationId) {
        const updated = await employeeService.updateEducation(editingEducationId, employeeId, payload);
        setEducation(prev => prev.map(e => e.id === editingEducationId ? updated : e));
        setMessage({ type: 'success', text: 'Education updated successfully.' });
      } else {
        const created = await employeeService.addEducation(employeeId, payload);
        setEducation(prev => [...prev, created]);
        setMessage({ type: 'success', text: 'Education added successfully.' });
      }
      resetEducationForm();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save education.' });
    }
    setSaving(false);
  };

  const handleDeleteEducation = async (id: number) => {
    try {
      await employeeService.deleteEducation(id);
      setEducation(prev => prev.filter(e => e.id !== id));
      setMessage({ type: 'success', text: 'Education removed.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete education.' });
    }
  };

  const handleEditEducation = (edu: EmployeeEducation) => {
    setEducationForm({
      institution: edu.institution,
      qualification: edu.qualification,
      fieldOfStudy: edu.fieldOfStudy || '',
      startDate: edu.startDate || '',
      endDate: edu.endDate || '',
      grade: edu.grade || '',
    });
    setEditingEducationId(edu.id || null);
    setShowEducationForm(true);
  };

  const proficiencyBadgeColor = (level: string) => {
    switch (level) {
      case 'BEGINNER': return 'bg-gray-100 text-gray-700';
      case 'INTERMEDIATE': return 'bg-blue-100 text-blue-700';
      case 'ADVANCED': return 'bg-purple-100 text-purple-700';
      case 'EXPERT': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  const sections = [
    { key: 'personal' as const, label: 'Personal Details', icon: UserCircleIcon },
    { key: 'banking' as const, label: 'Banking Details', icon: BanknotesIcon },
    { key: 'emergency' as const, label: 'Emergency Contact', icon: PhoneIcon },
    { key: 'skills' as const, label: 'Skills', icon: WrenchScrewdriverIcon },
    { key: 'education' as const, label: 'Education', icon: AcademicCapIcon },
    { key: 'employment' as const, label: 'Employment History', icon: BriefcaseIcon },
    { key: 'custom' as const, label: 'Custom Fields', icon: AdjustmentsHorizontalIcon },
  ];

  if (loading) {
    return (
      <FeatureGate feature="EMPLOYEE_SELF_SERVICE">
        <PageWrapper title="Edit Profile" subtitle="Loading...">
          <div className="text-center py-12 text-muted-foreground">Loading profile...</div>
        </PageWrapper>
      </FeatureGate>
    );
  }

  return (
    <FeatureGate feature="EMPLOYEE_SELF_SERVICE">
      <PageWrapper
        title="Edit Profile"
        subtitle="Update your personal information"
      >
        <div className="space-y-6">
          {/* Message */}
          {message && (
            <div className={`px-4 py-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          {/* Section Tabs */}
          <div className="flex gap-2 border-b pb-2 overflow-x-auto">
            {sections.map(s => (
              <button key={s.key} onClick={() => { setActiveSection(s.key); setMessage(null); }}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-t-lg font-medium whitespace-nowrap ${
                  activeSection === s.key ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:bg-muted'
                }`}>
                <s.icon className="w-4 h-4" /> {s.label}
              </button>
            ))}
          </div>

          {/* Personal Details */}
          {activeSection === 'personal' && (
            <form onSubmit={handleSavePersonal} className="enterprise-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Preferred Name</label>
                  <input type="text" value={personalForm.preferredName}
                    onChange={e => setPersonalForm({ ...personalForm, preferredName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Personal Email</label>
                  <input type="email" value={personalForm.personalEmail}
                    onChange={e => setPersonalForm({ ...personalForm, personalEmail: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Phone</label>
                  <input type="tel" value={personalForm.phone}
                    onChange={e => setPersonalForm({ ...personalForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Mobile Phone</label>
                  <input type="tel" value={personalForm.mobilePhone}
                    onChange={e => setPersonalForm({ ...personalForm, mobilePhone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Marital Status</label>
                  <select value={personalForm.maritalStatus}
                    onChange={e => setPersonalForm({ ...personalForm, maritalStatus: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="">Select</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Civil Union">Civil Union</option>
                  </select>
                </div>
              </div>
              <h4 className="text-xs font-semibold text-muted-foreground pt-2">Address</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Physical Address</label>
                  <textarea rows={2} value={personalForm.physicalAddress}
                    onChange={e => setPersonalForm({ ...personalForm, physicalAddress: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Postal Address</label>
                  <textarea rows={2} value={personalForm.postalAddress}
                    onChange={e => setPersonalForm({ ...personalForm, postalAddress: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">City</label>
                  <input type="text" value={personalForm.city}
                    onChange={e => setPersonalForm({ ...personalForm, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Province</label>
                  <input type="text" value={personalForm.province}
                    onChange={e => setPersonalForm({ ...personalForm, province: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Postal Code</label>
                  <input type="text" value={personalForm.postalCode}
                    onChange={e => setPersonalForm({ ...personalForm, postalCode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Country</label>
                  <input type="text" value={personalForm.country}
                    onChange={e => setPersonalForm({ ...personalForm, country: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => router.push('/employee/portal')}
                  className="px-4 py-2 text-sm text-muted-foreground border rounded-lg hover:bg-muted">Cancel</button>
                <button type="submit" disabled={saving}
                  className="btn-cta disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Banking Details */}
          {activeSection === 'banking' && (
            <form onSubmit={handleSaveBanking} className="enterprise-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Banking Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Bank Name</label>
                  <input type="text" value={bankingForm.bankName}
                    onChange={e => setBankingForm({ ...bankingForm, bankName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Branch Code</label>
                  <input type="text" value={bankingForm.bankBranchCode}
                    onChange={e => setBankingForm({ ...bankingForm, bankBranchCode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Account Number</label>
                  <input type="text" value={bankingForm.bankAccountNumber}
                    onChange={e => setBankingForm({ ...bankingForm, bankAccountNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Enter new account number" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => router.push('/employee/portal')}
                  className="px-4 py-2 text-sm text-muted-foreground border rounded-lg hover:bg-muted">Cancel</button>
                <button type="submit" disabled={saving}
                  className="btn-cta disabled:opacity-50">
                  {saving ? 'Saving...' : 'Update Banking Details'}
                </button>
              </div>
            </form>
          )}

          {/* Emergency Contact */}
          {activeSection === 'emergency' && (
            <form onSubmit={handleSaveEmergency} className="enterprise-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Emergency Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Contact Name</label>
                  <input type="text" value={emergencyForm.emergencyContactName}
                    onChange={e => setEmergencyForm({ ...emergencyForm, emergencyContactName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Contact Phone</label>
                  <input type="tel" value={emergencyForm.emergencyContactPhone}
                    onChange={e => setEmergencyForm({ ...emergencyForm, emergencyContactPhone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Relationship</label>
                  <select value={emergencyForm.emergencyContactRelationship}
                    onChange={e => setEmergencyForm({ ...emergencyForm, emergencyContactRelationship: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="">Select</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Child">Child</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => router.push('/employee/portal')}
                  className="px-4 py-2 text-sm text-muted-foreground border rounded-lg hover:bg-muted">Cancel</button>
                <button type="submit" disabled={saving}
                  className="btn-cta disabled:opacity-50">
                  {saving ? 'Saving...' : 'Update Emergency Contact'}
                </button>
              </div>
            </form>
          )}

          {/* Skills */}
          {activeSection === 'skills' && (
            <div className="enterprise-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Skills</h3>
                <button type="button" onClick={() => { resetSkillForm(); setShowSkillForm(true); }}
                  className="btn-cta flex items-center gap-1 text-xs">
                  <PlusIcon className="w-4 h-4" /> Add Skill
                </button>
              </div>

              {/* Skills inline form */}
              {showSkillForm && (
                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <h4 className="text-xs font-semibold text-muted-foreground">
                    {editingSkillId ? 'Edit Skill' : 'Add New Skill'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Skill Name</label>
                      <input type="text" value={skillForm.skillName}
                        onChange={e => setSkillForm({ ...skillForm, skillName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Project Management" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Proficiency Level</label>
                      <select value={skillForm.proficiencyLevel}
                        onChange={e => setSkillForm({ ...skillForm, proficiencyLevel: e.target.value as EmployeeSkill['proficiencyLevel'] })}
                        className="w-full px-3 py-2 border rounded-lg text-sm">
                        <option value="BEGINNER">Beginner</option>
                        <option value="INTERMEDIATE">Intermediate</option>
                        <option value="ADVANCED">Advanced</option>
                        <option value="EXPERT">Expert</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Years of Experience</label>
                      <input type="number" min="0" step="1" value={skillForm.yearsExperience}
                        onChange={e => setSkillForm({ ...skillForm, yearsExperience: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. 5" />
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                        <input type="checkbox" checked={skillForm.certified}
                          onChange={e => setSkillForm({ ...skillForm, certified: e.target.checked })}
                          className="rounded border-gray-300" />
                        Certified
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={resetSkillForm}
                      className="px-4 py-2 text-sm text-muted-foreground border rounded-lg hover:bg-muted">Cancel</button>
                    <button type="button" onClick={handleSaveSkill} disabled={saving || !skillForm.skillName}
                      className="btn-cta disabled:opacity-50 text-sm">
                      {saving ? 'Saving...' : editingSkillId ? 'Update Skill' : 'Add Skill'}
                    </button>
                  </div>
                </div>
              )}

              {/* Skills table */}
              {skills.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 text-xs font-medium text-muted-foreground">Skill Name</th>
                        <th className="pb-2 text-xs font-medium text-muted-foreground">Proficiency</th>
                        <th className="pb-2 text-xs font-medium text-muted-foreground">Years Exp.</th>
                        <th className="pb-2 text-xs font-medium text-muted-foreground">Certified</th>
                        <th className="pb-2 text-xs font-medium text-muted-foreground text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skills.map(skill => (
                        <tr key={skill.id} className="border-b last:border-0">
                          <td className="py-2 text-sm text-foreground">{skill.skillName}</td>
                          <td className="py-2">
                            <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${proficiencyBadgeColor(skill.proficiencyLevel)}`}>
                              {skill.proficiencyLevel}
                            </span>
                          </td>
                          <td className="py-2 text-sm text-muted-foreground">{skill.yearsExperience ?? '—'}</td>
                          <td className="py-2">
                            {skill.certified
                              ? <CheckIcon className="w-4 h-4 text-green-600" />
                              : <XMarkIcon className="w-4 h-4 text-gray-400" />}
                          </td>
                          <td className="py-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button type="button" onClick={() => handleEditSkill(skill)}
                                className="text-xs text-blue-600 hover:underline">Edit</button>
                              <button type="button" onClick={() => skill.id && handleDeleteSkill(skill.id)}
                                className="text-muted-foreground hover:text-red-600">
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : !showSkillForm ? (
                <p className="text-sm text-muted-foreground text-center py-6">No skills added yet. Click &quot;Add Skill&quot; to get started.</p>
              ) : null}
            </div>
          )}

          {/* Education */}
          {activeSection === 'education' && (
            <div className="enterprise-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Education</h3>
                <button type="button" onClick={() => { resetEducationForm(); setShowEducationForm(true); }}
                  className="btn-cta flex items-center gap-1 text-xs">
                  <PlusIcon className="w-4 h-4" /> Add Education
                </button>
              </div>

              {/* Education inline form */}
              {showEducationForm && (
                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <h4 className="text-xs font-semibold text-muted-foreground">
                    {editingEducationId ? 'Edit Education' : 'Add New Education'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Institution</label>
                      <input type="text" value={educationForm.institution}
                        onChange={e => setEducationForm({ ...educationForm, institution: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. University of Cape Town" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Qualification</label>
                      <input type="text" value={educationForm.qualification}
                        onChange={e => setEducationForm({ ...educationForm, qualification: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Bachelor of Science" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Field of Study</label>
                      <input type="text" value={educationForm.fieldOfStudy}
                        onChange={e => setEducationForm({ ...educationForm, fieldOfStudy: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Computer Science" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Grade</label>
                      <input type="text" value={educationForm.grade}
                        onChange={e => setEducationForm({ ...educationForm, grade: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Cum Laude" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Start Date</label>
                      <input type="date" value={educationForm.startDate}
                        onChange={e => setEducationForm({ ...educationForm, startDate: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">End Date</label>
                      <input type="date" value={educationForm.endDate}
                        onChange={e => setEducationForm({ ...educationForm, endDate: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={resetEducationForm}
                      className="px-4 py-2 text-sm text-muted-foreground border rounded-lg hover:bg-muted">Cancel</button>
                    <button type="button" onClick={handleSaveEducation} disabled={saving || !educationForm.institution || !educationForm.qualification}
                      className="btn-cta disabled:opacity-50 text-sm">
                      {saving ? 'Saving...' : editingEducationId ? 'Update Education' : 'Add Education'}
                    </button>
                  </div>
                </div>
              )}

              {/* Education table */}
              {education.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 text-xs font-medium text-muted-foreground">Institution</th>
                        <th className="pb-2 text-xs font-medium text-muted-foreground">Qualification</th>
                        <th className="pb-2 text-xs font-medium text-muted-foreground">Field of Study</th>
                        <th className="pb-2 text-xs font-medium text-muted-foreground">Period</th>
                        <th className="pb-2 text-xs font-medium text-muted-foreground">Grade</th>
                        <th className="pb-2 text-xs font-medium text-muted-foreground text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {education.map(edu => (
                        <tr key={edu.id} className="border-b last:border-0">
                          <td className="py-2 text-sm text-foreground">{edu.institution}</td>
                          <td className="py-2 text-sm text-foreground">{edu.qualification}</td>
                          <td className="py-2 text-sm text-muted-foreground">{edu.fieldOfStudy || '—'}</td>
                          <td className="py-2 text-sm text-muted-foreground">
                            {formatDate(edu.startDate)} — {formatDate(edu.endDate)}
                          </td>
                          <td className="py-2 text-sm text-muted-foreground">{edu.grade || '—'}</td>
                          <td className="py-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button type="button" onClick={() => handleEditEducation(edu)}
                                className="text-xs text-blue-600 hover:underline">Edit</button>
                              <button type="button" onClick={() => edu.id && handleDeleteEducation(edu.id)}
                                className="text-muted-foreground hover:text-red-600">
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : !showEducationForm ? (
                <p className="text-sm text-muted-foreground text-center py-6">No education records added yet. Click &quot;Add Education&quot; to get started.</p>
              ) : null}
            </div>
          )}

          {/* Employment History */}
          {activeSection === 'employment' && (
            <div className="enterprise-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Employment History</h3>
              {employmentHistory ? (
                <div className="relative border-l-2 border-blue-200 ml-3 pl-6 space-y-6">
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white" />
                    <div className="border rounded-lg p-4 space-y-1">
                      <p className="text-sm font-semibold text-foreground">{employmentHistory.jobTitle || 'Current Position'}</p>
                      <p className="text-xs text-muted-foreground">{employmentHistory.department || 'Department not set'}</p>
                      <p className="text-xs text-muted-foreground">
                        Started: {employmentHistory.hireDate
                          ? new Date(employmentHistory.hireDate).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })
                          : '—'}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">Current</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No employment history available.</p>
              )}
            </div>
          )}

          {/* Custom Fields */}
          {activeSection === 'custom' && (
            <div className="enterprise-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Custom Fields</h3>
              <p className="text-xs text-muted-foreground">Organisation-specific fields configured by your HR team.</p>
              {customFields.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {customFields.map(cf => (
                      <div key={cf.id}>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          {cf.fieldLabel}{cf.isRequired && <span className="text-red-500 ml-0.5">*</span>}
                        </label>
                        {cf.fieldType === 'SELECT' && cf.options ? (
                          <select
                            value={customFieldValues[cf.fieldName] || ''}
                            onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.fieldName]: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          >
                            <option value="">Select...</option>
                            {cf.options.split('\n').filter(Boolean).map(opt => (
                              <option key={opt} value={opt.trim()}>{opt.trim()}</option>
                            ))}
                          </select>
                        ) : cf.fieldType === 'BOOLEAN' || cf.fieldType === 'CHECKBOX' ? (
                          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer mt-1">
                            <input
                              type="checkbox"
                              checked={customFieldValues[cf.fieldName] === 'true'}
                              onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.fieldName]: e.target.checked ? 'true' : 'false' }))}
                              className="rounded border-gray-300"
                            />
                            {customFieldValues[cf.fieldName] === 'true' ? 'Yes' : 'No'}
                          </label>
                        ) : cf.fieldType === 'DATE' ? (
                          <input
                            type="date"
                            value={customFieldValues[cf.fieldName] || ''}
                            onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.fieldName]: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          />
                        ) : cf.fieldType === 'NUMBER' ? (
                          <input
                            type="number"
                            value={customFieldValues[cf.fieldName] || ''}
                            onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.fieldName]: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          />
                        ) : cf.fieldType === 'TEXTAREA' ? (
                          <textarea
                            rows={2}
                            value={customFieldValues[cf.fieldName] || ''}
                            onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.fieldName]: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          />
                        ) : (
                          <input
                            type="text"
                            value={customFieldValues[cf.fieldName] || ''}
                            onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.fieldName]: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => router.push('/employee/portal')}
                      className="px-4 py-2 text-sm text-muted-foreground border rounded-lg hover:bg-muted">Cancel</button>
                    <button type="button" onClick={handleSaveCustomFields} disabled={savingCustom}
                      className="btn-cta disabled:opacity-50">
                      {savingCustom ? 'Saving...' : 'Save Custom Fields'}
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No custom fields configured for employees.</p>
              )}
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
