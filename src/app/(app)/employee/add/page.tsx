'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { useToast } from '@/components/Toast';
import {
  UserCircleIcon,
  BriefcaseIcon,
  BanknotesIcon,
  DocumentIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  XMarkIcon,
  CheckIcon,
  ArrowUpTrayIcon,
  InformationCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface PersonalForm {
  firstName: string;
  lastName: string;
  preferredName: string;
  dateOfBirth: string;
  gender: string;
  idNumber: string;
  nationality: string;
  email: string;
  phone: string;
  alternativePhone: string;
  physicalAddress: string;
  city: string;
  province: string;
  postalCode: string;
  emergencyContactName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  emergencyAlternativePhone: string;
}

interface EmploymentForm {
  employeeNumber: string;
  department: string;
  jobTitle: string;
  jobGrade: string;
  reportsTo: string;
  workLocation: string;
  employmentType: string;
  startDate: string;
  probationPeriod: string;
  contractEndDate: string;
  costCentre: string;
}

interface CompensationForm {
  annualSalary: string;
  payFrequency: string;
  bankName: string;
  accountNumber: string;
  branchCode: string;
  medicalAid: boolean;
  medicalAidProvider: string;
  pensionFund: boolean;
  pensionContribution: string;
  uif: boolean;
  taxNumber: string;
}

interface UploadedFile {
  name: string;
  size: string;
}

interface DocumentsForm {
  idDocument: UploadedFile[];
  proofOfAddress: UploadedFile[];
  qualifications: UploadedFile[];
  taxCertificate: UploadedFile[];
  medicalCertificate: UploadedFile[];
}

type StepKey = 1 | 2 | 3 | 4 | 5;

const STEPS: { key: StepKey; label: string; icon: typeof UserCircleIcon }[] = [
  { key: 1, label: 'Personal Details', icon: UserCircleIcon },
  { key: 2, label: 'Employment Info', icon: BriefcaseIcon },
  { key: 3, label: 'Compensation', icon: BanknotesIcon },
  { key: 4, label: 'Documents', icon: DocumentIcon },
  { key: 5, label: 'Review', icon: ClipboardDocumentCheckIcon },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AddEmployeePage() {
  const router = useRouter();
  const { toast } = useToast();

  // Step state
  const [currentStep, setCurrentStep] = useState<StepKey>(1);
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showErrorBanner, setShowErrorBanner] = useState(false);

  // --- Form state ---
  const [personalForm, setPersonalForm] = useState<PersonalForm>({
    firstName: '',
    lastName: '',
    preferredName: '',
    dateOfBirth: '',
    gender: '',
    idNumber: '',
    nationality: 'South African',
    email: '',
    phone: '',
    alternativePhone: '',
    physicalAddress: '',
    city: '',
    province: '',
    postalCode: '',
    emergencyContactName: '',
    emergencyRelationship: '',
    emergencyPhone: '',
    emergencyAlternativePhone: '',
  });

  const [employmentForm, setEmploymentForm] = useState<EmploymentForm>({
    employeeNumber: 'UTH-2026-011',
    department: '',
    jobTitle: '',
    jobGrade: '',
    reportsTo: '',
    workLocation: '',
    employmentType: '',
    startDate: '',
    probationPeriod: '',
    contractEndDate: '',
    costCentre: '',
  });

  const [compensationForm, setCompensationForm] = useState<CompensationForm>({
    annualSalary: '',
    payFrequency: 'Monthly',
    bankName: '',
    accountNumber: '',
    branchCode: '',
    medicalAid: false,
    medicalAidProvider: '',
    pensionFund: false,
    pensionContribution: '',
    uif: true,
    taxNumber: '',
  });

  const [documentsForm, setDocumentsForm] = useState<DocumentsForm>({
    idDocument: [],
    proofOfAddress: [],
    qualifications: [],
    taxCertificate: [],
    medicalCertificate: [],
  });

  // --- Navigation ---
  const goToStep = useCallback((step: StepKey) => {
    setCurrentStep(step);
    setShowErrorBanner(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // --- File handling ---
  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof DocumentsForm,
  ) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: UploadedFile[] = Array.from(files).map((f) => ({
      name: f.name,
      size: formatFileSize(f.size),
    }));
    setDocumentsForm((prev) => ({
      ...prev,
      [field]: [...prev[field], ...newFiles],
    }));
    e.target.value = '';
  };

  const removeFile = (field: keyof DocumentsForm, index: number) => {
    setDocumentsForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  // --- Save handlers ---
  const handleSaveDraft = () => {
    toast('Draft saved successfully', 'info');
  };

  const handleSubmit = () => {
    if (!confirmed) {
      toast('Please confirm that all information is accurate', 'error');
      return;
    }
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      toast('Employee added successfully', 'success');
      router.push('/employee/portal');
    }, 1500);
  };

  const handleCancel = () => {
    router.back();
  };

  // --- Updaters ---
  const updatePersonal = (field: keyof PersonalForm, value: string) =>
    setPersonalForm((prev) => ({ ...prev, [field]: value }));
  const updateEmployment = (field: keyof EmploymentForm, value: string) =>
    setEmploymentForm((prev) => ({ ...prev, [field]: value }));
  const updateCompensation = (field: keyof CompensationForm, value: string | boolean) =>
    setCompensationForm((prev) => ({ ...prev, [field]: value }));

  // --- Reusable sub-components ---
  const FormLabel = ({
    children,
    required,
    tooltip,
  }: {
    children: React.ReactNode;
    required?: boolean;
    tooltip?: string;
  }) => (
    <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">
      {children}
      {required && <span className="text-error ml-0.5">*</span>}
      {tooltip && (
        <span className="relative inline-flex items-center justify-center w-4 h-4 rounded-full bg-surface-navy text-accent-navy cursor-help ml-1 group">
          <InformationCircleIcon className="w-3 h-3" />
          <span className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-foreground text-background text-xs font-normal normal-case tracking-normal px-2 py-1 rounded whitespace-nowrap z-50">
            {tooltip}
          </span>
        </span>
      )}
    </label>
  );

  const FormInput = ({
    type = 'text',
    placeholder,
    value,
    onChange,
    disabled,
    maxLength,
    className: extraClass,
  }: {
    type?: string;
    placeholder?: string;
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
    maxLength?: number;
    className?: string;
  }) => (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      maxLength={maxLength}
      className={`w-full px-3 py-2.5 border border-border rounded-control text-sm text-foreground bg-card placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-muted disabled:text-muted-foreground ${extraClass ?? ''}`}
    />
  );

  const FormSelect = ({
    value,
    onChange,
    children,
    disabled,
  }: {
    value: string;
    onChange: (v: string) => void;
    children: React.ReactNode;
    disabled?: boolean;
  }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-3 py-2.5 border border-border rounded-control text-sm text-foreground bg-card appearance-none bg-no-repeat bg-[right_0.75rem_center] pr-10 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-muted disabled:text-muted-foreground"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
      }}
    >
      {children}
    </select>
  );

  const FormHint = ({ children }: { children: React.ReactNode }) => (
    <span className="text-xs text-muted-foreground">{children}</span>
  );

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-[0.9375rem] font-bold text-foreground mb-4 pb-2 border-b border-border">
      {children}
    </h3>
  );

  const InputPrefix = ({ children }: { children: React.ReactNode }) => (
    <span className="flex items-center px-3 bg-muted border border-border border-r-0 rounded-l-control text-sm text-muted-foreground font-semibold">
      {children}
    </span>
  );

  // --- Upload Zone ---
  const UploadZone = ({
    label,
    required,
    field,
    accept = '.pdf,.jpg,.jpeg,.png',
    multiple,
    hint = 'PDF, JPG, or PNG up to 10MB',
  }: {
    label: string;
    required?: boolean;
    field: keyof DocumentsForm;
    accept?: string;
    multiple?: boolean;
    hint?: string;
  }) => (
    <div className="flex flex-col gap-1.5">
      <FormLabel required={required}>{label}</FormLabel>
      <label className="group border-2 border-dashed border-border rounded-control p-6 text-center cursor-pointer transition-all hover:border-primary hover:bg-surface-navy/30">
        <ArrowUpTrayIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-primary">Drag &amp; drop</span> or click to upload
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">{hint}</p>
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFileSelect(e, field)}
        />
      </label>
      {documentsForm[field].length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {documentsForm[field].map((file, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-navy border border-accent-navy/30 rounded-button text-sm text-accent-navy"
            >
              <DocumentIcon className="w-3.5 h-3.5" />
              {file.name} ({file.size})
              <button
                type="button"
                onClick={() => removeFile(field, idx)}
                className="w-4.5 h-4.5 rounded-full bg-accent-navy/20 hover:bg-accent-navy hover:text-white flex items-center justify-center transition-all"
              >
                <XMarkIcon className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );

  // --- Review Item ---
  const ReviewItem = ({ label, value }: { label: string; value: string }) => (
    <div>
      <span className="block text-[0.7rem] uppercase tracking-wide text-muted-foreground font-bold">
        {label}
      </span>
      <span className="text-sm text-foreground font-medium">{value || '--'}</span>
    </div>
  );

  // --- Toggle Switch ---
  const ToggleRow = ({
    label,
    description,
    checked,
    onChange,
    children,
  }: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    children?: React.ReactNode;
  }) => (
    <div>
      <div className="flex items-center justify-between py-3 border-b border-muted/30">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">{label}</span>
          <span className="text-xs text-muted-foreground">{description}</span>
        </div>
        <label className="relative w-11 h-6 flex-shrink-0 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only peer"
          />
          <span className="block w-full h-full bg-border rounded-full peer-checked:bg-accent-teal transition-colors" />
          <span className="absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
        </label>
      </div>
      {checked && children && (
        <div className="mt-3 pl-4 border-l-2 border-surface-teal">{children}</div>
      )}
    </div>
  );

  // --- Step Navigation ---
  const StepNav = ({
    prevStep,
    nextStep,
    nextLabel,
    isSubmit,
  }: {
    prevStep?: StepKey;
    nextStep?: StepKey;
    nextLabel?: string;
    isSubmit?: boolean;
  }) => (
    <div className="flex justify-between items-center mt-6 pt-6 border-t border-border">
      <div>
        {prevStep && (
          <button
            type="button"
            onClick={() => goToStep(prevStep)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button border-2 border-border text-muted-foreground font-semibold text-sm uppercase tracking-wide hover:border-primary hover:text-primary transition-all"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Previous
          </button>
        )}
      </div>
      <div>
        {nextStep && (
          <button
            type="button"
            onClick={() => goToStep(nextStep)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button bg-cta border-2 border-cta text-cta-foreground font-semibold text-sm uppercase tracking-wide hover:bg-cta-hover hover:border-cta-hover transition-all"
          >
            {nextLabel ?? 'Next'}
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        )}
        {isSubmit && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-button bg-cta border-2 border-cta text-cta-foreground font-semibold text-[0.9375rem] uppercase tracking-wide hover:bg-cta-hover hover:border-cta-hover transition-all disabled:opacity-50"
          >
            <CheckIcon className="w-4 h-4" />
            {saving ? 'Submitting...' : 'Submit Employee'}
          </button>
        )}
      </div>
    </div>
  );

  // =========================================================================
  // Card wrapper used for each step
  // =========================================================================
  const StepCard = ({
    icon: Icon,
    iconColor,
    title,
    subtitle,
    children,
  }: {
    icon: typeof UserCircleIcon;
    iconColor: 'navy' | 'teal' | 'gold' | 'pink';
    title: string;
    subtitle: string;
    children: React.ReactNode;
  }) => {
    const iconBgMap: Record<string, string> = {
      navy: 'bg-icon-bg-navy text-accent-navy',
      teal: 'bg-icon-bg-teal text-accent-teal',
      gold: 'bg-icon-bg-gold text-accent-gold',
      pink: 'bg-icon-bg-pink text-accent-pink',
    };
    return (
      <div className="enterprise-card">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <div
            className={`w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 ${iconBgMap[iconColor]}`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            <p className="text-[0.8125rem] text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="p-6">{children}</div>
      </div>
    );
  };

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <FeatureGate feature="EMPLOYEE_MANAGEMENT">
      <PageWrapper
        title="Add New Employee"
        subtitle="Complete all required fields to add a new employee to the system"
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button border-2 border-border text-muted-foreground font-semibold text-sm uppercase tracking-wide hover:border-primary hover:text-primary transition-all"
            >
              <XMarkIcon className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button bg-surface-navy border-2 border-accent-navy/30 text-accent-navy font-semibold text-sm uppercase tracking-wide hover:bg-accent-navy/20 transition-all"
            >
              <DocumentIcon className="w-4 h-4" />
              <span>Save as Draft</span>
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button bg-cta border-2 border-cta text-cta-foreground font-semibold text-sm uppercase tracking-wide hover:bg-cta-hover hover:border-cta-hover transition-all disabled:opacity-50"
            >
              <CheckIcon className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Employee'}</span>
            </button>
          </div>
        }
      >
        <div className="max-w-[960px] mx-auto space-y-8">
          {/* Error Banner */}
          {showErrorBanner && (
            <div className="flex items-center gap-3 px-5 py-3.5 bg-error-bg border border-error/30 rounded-control">
              <ExclamationCircleIcon className="w-5 h-5 text-error flex-shrink-0" />
              <span className="text-sm text-error font-semibold flex-1">
                Please correct the errors below before submitting
              </span>
              <button
                type="button"
                onClick={() => setShowErrorBanner(false)}
                className="text-error hover:bg-error/10 p-1 rounded transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ==================== STEPPER ==================== */}
          <div className="flex items-center justify-center flex-wrap gap-0">
            {STEPS.map((step, idx) => (
              <div key={step.key} className="flex items-center">
                <button
                  type="button"
                  onClick={() => goToStep(step.key)}
                  className="flex items-center gap-2 py-2 cursor-pointer"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all flex-shrink-0 ${
                      currentStep === step.key
                        ? 'bg-primary border-primary text-white'
                        : currentStep > step.key
                          ? 'bg-accent-teal border-accent-teal text-white'
                          : 'bg-card border-border text-muted-foreground'
                    }`}
                  >
                    {currentStep > step.key ? (
                      <CheckIcon className="w-4 h-4" />
                    ) : (
                      step.key
                    )}
                  </div>
                  <span
                    className={`text-[0.8125rem] font-semibold whitespace-nowrap transition-colors ${
                      currentStep === step.key
                        ? 'text-primary'
                        : currentStep > step.key
                          ? 'text-accent-teal'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-1 flex-shrink-0 transition-colors ${
                      currentStep > step.key
                        ? 'bg-accent-teal'
                        : currentStep === step.key
                          ? 'bg-cta'
                          : 'bg-border'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* ==================== STEP 1: PERSONAL DETAILS ==================== */}
          {currentStep === 1 && (
            <StepCard
              icon={UserCircleIcon}
              iconColor="navy"
              title="Personal Details"
              subtitle="Basic information, contact details, and emergency contact"
            >
              {/* Basic Information */}
              <div>
                <SectionTitle>Basic Information</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 gap-x-6">
                  <div className="flex flex-col gap-1.5">
                    <FormLabel required>First Name</FormLabel>
                    <FormInput
                      placeholder="e.g. Sipho"
                      value={personalForm.firstName}
                      onChange={(v) => updatePersonal('firstName', v)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel required>Last Name</FormLabel>
                    <FormInput
                      placeholder="e.g. Ndlovu"
                      value={personalForm.lastName}
                      onChange={(v) => updatePersonal('lastName', v)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel>Preferred Name</FormLabel>
                    <FormInput
                      placeholder="e.g. Sipho"
                      value={personalForm.preferredName}
                      onChange={(v) => updatePersonal('preferredName', v)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel required>Date of Birth</FormLabel>
                    <FormInput
                      type="date"
                      value={personalForm.dateOfBirth}
                      onChange={(v) => updatePersonal('dateOfBirth', v)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel required>Gender</FormLabel>
                    <FormSelect
                      value={personalForm.gender}
                      onChange={(v) => updatePersonal('gender', v)}
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </FormSelect>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel required>ID Number</FormLabel>
                    <FormInput
                      placeholder="e.g. 9001015800089"
                      value={personalForm.idNumber}
                      onChange={(v) => updatePersonal('idNumber', v)}
                      maxLength={13}
                    />
                    <FormHint>SA ID: 13 digits</FormHint>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel required>Nationality</FormLabel>
                    <FormSelect
                      value={personalForm.nationality}
                      onChange={(v) => updatePersonal('nationality', v)}
                    >
                      <option value="South African">South African</option>
                      <option value="Mozambican">Mozambican</option>
                      <option value="Zimbabwean">Zimbabwean</option>
                      <option value="Basotho">Basotho</option>
                      <option value="Swazi">Swazi</option>
                      <option value="Other">Other</option>
                    </FormSelect>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="mt-7">
                <SectionTitle>Contact Information</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 gap-x-6">
                  <div className="flex flex-col gap-1.5">
                    <FormLabel required>Email Address</FormLabel>
                    <FormInput
                      type="email"
                      placeholder="e.g. sipho.ndlovu@uthukela.gov.za"
                      value={personalForm.email}
                      onChange={(v) => updatePersonal('email', v)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel required>Phone Number</FormLabel>
                    <div className="flex">
                      <InputPrefix>+27</InputPrefix>
                      <FormInput
                        type="tel"
                        placeholder="82 123 4567"
                        value={personalForm.phone}
                        onChange={(v) => updatePersonal('phone', v)}
                        className="!rounded-l-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel>Alternative Phone</FormLabel>
                    <div className="flex">
                      <InputPrefix>+27</InputPrefix>
                      <FormInput
                        type="tel"
                        placeholder="36 631 0000"
                        value={personalForm.alternativePhone}
                        onChange={(v) => updatePersonal('alternativePhone', v)}
                        className="!rounded-l-none"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex flex-col gap-1.5">
                    <FormLabel required>Physical Address</FormLabel>
                    <textarea
                      placeholder="e.g. 14 Murchison Street"
                      value={personalForm.physicalAddress}
                      onChange={(e) => updatePersonal('physicalAddress', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2.5 border border-border rounded-control text-sm text-foreground bg-card placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-vertical min-h-[80px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel required>City</FormLabel>
                    <FormInput
                      placeholder="e.g. Ladysmith"
                      value={personalForm.city}
                      onChange={(v) => updatePersonal('city', v)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel required>Province</FormLabel>
                    <FormSelect
                      value={personalForm.province}
                      onChange={(v) => updatePersonal('province', v)}
                    >
                      <option value="">Select province</option>
                      <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                      <option value="Gauteng">Gauteng</option>
                      <option value="Western Cape">Western Cape</option>
                      <option value="Eastern Cape">Eastern Cape</option>
                      <option value="Free State">Free State</option>
                      <option value="Limpopo">Limpopo</option>
                      <option value="Mpumalanga">Mpumalanga</option>
                      <option value="North West">North West</option>
                      <option value="Northern Cape">Northern Cape</option>
                    </FormSelect>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel required>Postal Code</FormLabel>
                    <FormInput
                      placeholder="e.g. 3370"
                      value={personalForm.postalCode}
                      onChange={(v) => updatePersonal('postalCode', v)}
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="mt-7">
                <SectionTitle>Emergency Contact</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 gap-x-6">
                  <div className="flex flex-col gap-1.5">
                    <FormLabel required>Contact Name</FormLabel>
                    <FormInput
                      placeholder="e.g. Thandi Ndlovu"
                      value={personalForm.emergencyContactName}
                      onChange={(v) => updatePersonal('emergencyContactName', v)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel required>Relationship</FormLabel>
                    <FormSelect
                      value={personalForm.emergencyRelationship}
                      onChange={(v) => updatePersonal('emergencyRelationship', v)}
                    >
                      <option value="">Select relationship</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Other">Other</option>
                    </FormSelect>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel required>Contact Phone</FormLabel>
                    <div className="flex">
                      <InputPrefix>+27</InputPrefix>
                      <FormInput
                        type="tel"
                        placeholder="82 987 6543"
                        value={personalForm.emergencyPhone}
                        onChange={(v) => updatePersonal('emergencyPhone', v)}
                        className="!rounded-l-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel>Alternative Contact Phone</FormLabel>
                    <div className="flex">
                      <InputPrefix>+27</InputPrefix>
                      <FormInput
                        type="tel"
                        placeholder="36 631 0001"
                        value={personalForm.emergencyAlternativePhone}
                        onChange={(v) => updatePersonal('emergencyAlternativePhone', v)}
                        className="!rounded-l-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <StepNav nextStep={2} nextLabel="Next: Employment Info" />
            </StepCard>
          )}

          {/* ==================== STEP 2: EMPLOYMENT INFO ==================== */}
          {currentStep === 2 && (
            <StepCard
              icon={BriefcaseIcon}
              iconColor="teal"
              title="Employment Information"
              subtitle="Position details and employment terms"
            >
              {/* Position Details */}
              <div>
                <SectionTitle>Position Details</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 gap-x-6">
                  <div className="flex flex-col gap-1.5">
                    <FormLabel required tooltip="Auto-generated. Can be overridden if needed.">
                      Employee Number
                    </FormLabel>
                    <FormInput
                      value={employmentForm.employeeNumber}
                      onChange={(v) => updateEmployment('employeeNumber', v)}
                      disabled
                    />
                    <FormHint>Auto-generated employee number</FormHint>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel required>Department</FormLabel>
                    <FormSelect
                      value={employmentForm.department}
                      onChange={(v) => updateEmployment('department', v)}
                    >
                      <option value="">Select department</option>
                      <option value="Operations">Operations</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Finance">Finance</option>
                      <option value="ICT">ICT</option>
                      <option value="Community Services">Community Services</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Supply Chain">Supply Chain</option>
                      <option value="Water Quality">Water Quality</option>
                    </FormSelect>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel required>Job Title</FormLabel>
                    <FormInput
                      placeholder="e.g. Water Quality Technician"
                      value={employmentForm.jobTitle}
                      onChange={(v) => updateEmployment('jobTitle', v)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel required>Job Grade</FormLabel>
                    <FormSelect
                      value={employmentForm.jobGrade}
                      onChange={(v) => updateEmployment('jobGrade', v)}
                    >
                      <option value="">Select job grade</option>
                      <optgroup label="Junior">
                        <option value="A1">A1</option>
                        <option value="A2">A2</option>
                        <option value="A3">A3</option>
                        <option value="A4">A4</option>
                        <option value="A5">A5</option>
                      </optgroup>
                      <optgroup label="Mid-Level">
                        <option value="B1">B1</option>
                        <option value="B2">B2</option>
                        <option value="B3">B3</option>
                        <option value="B4">B4</option>
                        <option value="B5">B5</option>
                      </optgroup>
                      <optgroup label="Senior">
                        <option value="C1">C1</option>
                        <option value="C2">C2</option>
                        <option value="C3">C3</option>
                        <option value="C4">C4</option>
                        <option value="C5">C5</option>
                      </optgroup>
                      <optgroup label="Executive">
                        <option value="D1">D1</option>
                        <option value="D2">D2</option>
                        <option value="D3">D3</option>
                      </optgroup>
                    </FormSelect>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel required>Reports To</FormLabel>
                    <FormSelect
                      value={employmentForm.reportsTo}
                      onChange={(v) => updateEmployment('reportsTo', v)}
                    >
                      <option value="">Search or select manager</option>
                      <option value="Nompilo Dlamini - HR Director">Nompilo Dlamini - HR Director</option>
                      <option value="Thabo Mkhize - Operations Manager">Thabo Mkhize - Operations Manager</option>
                      <option value="Zanele Khumalo - Finance Manager">Zanele Khumalo - Finance Manager</option>
                      <option value="Bheki Sithole - Engineering Lead">Bheki Sithole - Engineering Lead</option>
                      <option value="Lindiwe Zulu - ICT Manager">Lindiwe Zulu - ICT Manager</option>
                      <option value="Mandla Nkosi - Maintenance Supervisor">Mandla Nkosi - Maintenance Supervisor</option>
                    </FormSelect>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel required>Work Location</FormLabel>
                    <FormSelect
                      value={employmentForm.workLocation}
                      onChange={(v) => updateEmployment('workLocation', v)}
                    >
                      <option value="">Select location</option>
                      <option value="Ladysmith Head Office">Ladysmith Head Office</option>
                      <option value="Estcourt Depot">Estcourt Depot</option>
                      <option value="Bergville Office">Bergville Office</option>
                    </FormSelect>
                  </div>
                </div>
              </div>

              {/* Employment Terms */}
              <div className="mt-7">
                <SectionTitle>Employment Terms</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 gap-x-6">
                  <div className="flex flex-col gap-1.5">
                    <FormLabel required>Employment Type</FormLabel>
                    <FormSelect
                      value={employmentForm.employmentType}
                      onChange={(v) => updateEmployment('employmentType', v)}
                    >
                      <option value="">Select type</option>
                      <option value="Full-time Permanent">Full-time Permanent</option>
                      <option value="Fixed-term Contract">Fixed-term Contract</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Intern">Intern</option>
                    </FormSelect>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel required>Start Date</FormLabel>
                    <FormInput
                      type="date"
                      value={employmentForm.startDate}
                      onChange={(v) => updateEmployment('startDate', v)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel>Probation Period</FormLabel>
                    <FormSelect
                      value={employmentForm.probationPeriod}
                      onChange={(v) => updateEmployment('probationPeriod', v)}
                    >
                      <option value="">Select period</option>
                      <option value="3 months">3 months</option>
                      <option value="6 months">6 months</option>
                      <option value="None">None</option>
                    </FormSelect>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel>Contract End Date</FormLabel>
                    <FormInput
                      type="date"
                      value={employmentForm.contractEndDate}
                      onChange={(v) => updateEmployment('contractEndDate', v)}
                      disabled={employmentForm.employmentType !== 'Fixed-term Contract'}
                    />
                    <FormHint>Only applicable for fixed-term contracts</FormHint>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel required>Cost Centre</FormLabel>
                    <FormInput
                      placeholder="e.g. CC-OPS-001"
                      value={employmentForm.costCentre}
                      onChange={(v) => updateEmployment('costCentre', v)}
                    />
                    <FormHint>Format: CC-XXX-XXX</FormHint>
                  </div>
                </div>
              </div>

              <StepNav prevStep={1} nextStep={3} nextLabel="Next: Compensation" />
            </StepCard>
          )}

          {/* ==================== STEP 3: COMPENSATION ==================== */}
          {currentStep === 3 && (
            <StepCard
              icon={BanknotesIcon}
              iconColor="gold"
              title="Compensation & Benefits"
              subtitle="Salary information and benefits enrolment"
            >
              {/* Salary Information */}
              <div>
                <SectionTitle>Salary Information</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 gap-x-6">
                  <div className="flex flex-col gap-1.5">
                    <FormLabel required>Annual Salary</FormLabel>
                    <div className="flex">
                      <InputPrefix>R</InputPrefix>
                      <FormInput
                        placeholder="e.g. 450,000"
                        value={compensationForm.annualSalary}
                        onChange={(v) => updateCompensation('annualSalary', v)}
                        className="!rounded-l-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel required>Pay Frequency</FormLabel>
                    <FormSelect
                      value={compensationForm.payFrequency}
                      onChange={(v) => updateCompensation('payFrequency', v)}
                    >
                      <option value="">Select frequency</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Bi-weekly">Bi-weekly</option>
                    </FormSelect>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel required>Bank Name</FormLabel>
                    <FormSelect
                      value={compensationForm.bankName}
                      onChange={(v) => updateCompensation('bankName', v)}
                    >
                      <option value="">Select bank</option>
                      <option value="ABSA">ABSA</option>
                      <option value="FNB">FNB</option>
                      <option value="Nedbank">Nedbank</option>
                      <option value="Standard Bank">Standard Bank</option>
                      <option value="Capitec">Capitec</option>
                    </FormSelect>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel required>Account Number</FormLabel>
                    <FormInput
                      type="password"
                      placeholder="Enter account number"
                      value={compensationForm.accountNumber}
                      onChange={(v) => updateCompensation('accountNumber', v)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FormLabel required>Branch Code</FormLabel>
                    <FormInput
                      placeholder="e.g. 632005"
                      value={compensationForm.branchCode}
                      onChange={(v) => updateCompensation('branchCode', v)}
                    />
                  </div>
                </div>
              </div>

              {/* Benefits & Deductions */}
              <div className="mt-7">
                <SectionTitle>Benefits &amp; Deductions</SectionTitle>
                <div className="space-y-0">
                  <ToggleRow
                    label="Medical Aid"
                    description="Enrol employee in a medical aid scheme"
                    checked={compensationForm.medicalAid}
                    onChange={(v) => updateCompensation('medicalAid', v)}
                  >
                    <div className="flex flex-col gap-1.5 max-w-xs mt-2">
                      <FormLabel>Medical Aid Provider</FormLabel>
                      <FormSelect
                        value={compensationForm.medicalAidProvider}
                        onChange={(v) => updateCompensation('medicalAidProvider', v)}
                      >
                        <option value="">Select provider</option>
                        <option value="Discovery">Discovery</option>
                        <option value="Bonitas">Bonitas</option>
                        <option value="GEMS">GEMS</option>
                      </FormSelect>
                    </div>
                  </ToggleRow>

                  <ToggleRow
                    label="Pension Fund"
                    description="Enrol employee in the pension fund"
                    checked={compensationForm.pensionFund}
                    onChange={(v) => updateCompensation('pensionFund', v)}
                  >
                    <div className="flex flex-col gap-1.5 max-w-xs mt-2">
                      <FormLabel>Contribution %</FormLabel>
                      <div className="flex">
                        <FormInput
                          type="number"
                          placeholder="e.g. 7.5"
                          value={compensationForm.pensionContribution}
                          onChange={(v) => updateCompensation('pensionContribution', v)}
                          className="!rounded-r-none"
                        />
                        <span className="flex items-center px-3 bg-muted border border-border border-l-0 rounded-r-control text-sm text-muted-foreground font-semibold">
                          %
                        </span>
                      </div>
                    </div>
                  </ToggleRow>

                  <ToggleRow
                    label="UIF"
                    description="Unemployment Insurance Fund deduction"
                    checked={compensationForm.uif}
                    onChange={(v) => updateCompensation('uif', v)}
                  />
                </div>

                <div className="mt-4 max-w-xs">
                  <div className="flex flex-col gap-1.5">
                    <FormLabel>Tax Number</FormLabel>
                    <FormInput
                      placeholder="e.g. 1234567890"
                      value={compensationForm.taxNumber}
                      onChange={(v) => updateCompensation('taxNumber', v)}
                    />
                  </div>
                </div>
              </div>

              <StepNav prevStep={2} nextStep={4} nextLabel="Next: Documents" />
            </StepCard>
          )}

          {/* ==================== STEP 4: DOCUMENTS ==================== */}
          {currentStep === 4 && (
            <StepCard
              icon={DocumentIcon}
              iconColor="pink"
              title="Documents Upload"
              subtitle="Upload required employee documents"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 gap-x-6">
                <UploadZone label="ID Document" required field="idDocument" />
                <UploadZone label="Proof of Address" required field="proofOfAddress" />
                <UploadZone
                  label="Qualifications"
                  field="qualifications"
                  multiple
                  hint="PDF, JPG, or PNG up to 10MB. Multiple files allowed."
                />
                <UploadZone
                  label="Tax Certificate"
                  field="taxCertificate"
                  accept=".pdf"
                  hint="PDF up to 10MB"
                />
                <UploadZone label="Medical Certificate" field="medicalCertificate" />
              </div>

              <StepNav prevStep={3} nextStep={5} nextLabel="Next: Review" />
            </StepCard>
          )}

          {/* ==================== STEP 5: REVIEW ==================== */}
          {currentStep === 5 && (
            <StepCard
              icon={ClipboardDocumentCheckIcon}
              iconColor="navy"
              title="Review & Submit"
              subtitle="Please review all information before submitting"
            >
              {/* Personal Details Review */}
              <div className="mb-6">
                <div className="flex items-center justify-between pb-2 border-b border-border mb-3">
                  <h3 className="text-[0.9375rem] font-bold text-foreground">Personal Details</h3>
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-border rounded-button bg-card text-xs font-semibold text-primary hover:bg-surface-navy hover:border-primary transition-all"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 gap-x-6">
                  <ReviewItem label="First Name" value={personalForm.firstName} />
                  <ReviewItem label="Last Name" value={personalForm.lastName} />
                  <ReviewItem label="Date of Birth" value={personalForm.dateOfBirth} />
                  <ReviewItem label="Gender" value={personalForm.gender} />
                  <ReviewItem label="ID Number" value={personalForm.idNumber} />
                  <ReviewItem label="Nationality" value={personalForm.nationality} />
                  <ReviewItem label="Email" value={personalForm.email} />
                  <ReviewItem label="Phone" value={personalForm.phone ? `+27 ${personalForm.phone}` : ''} />
                  <ReviewItem label="City" value={personalForm.city} />
                  <ReviewItem label="Province" value={personalForm.province} />
                </div>
              </div>

              {/* Employment Info Review */}
              <div className="mb-6">
                <div className="flex items-center justify-between pb-2 border-b border-border mb-3">
                  <h3 className="text-[0.9375rem] font-bold text-foreground">Employment Information</h3>
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-border rounded-button bg-card text-xs font-semibold text-primary hover:bg-surface-navy hover:border-primary transition-all"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 gap-x-6">
                  <ReviewItem label="Employee Number" value={employmentForm.employeeNumber} />
                  <ReviewItem label="Department" value={employmentForm.department} />
                  <ReviewItem label="Job Title" value={employmentForm.jobTitle} />
                  <ReviewItem label="Job Grade" value={employmentForm.jobGrade} />
                  <ReviewItem label="Reports To" value={employmentForm.reportsTo} />
                  <ReviewItem label="Work Location" value={employmentForm.workLocation} />
                  <ReviewItem label="Employment Type" value={employmentForm.employmentType} />
                  <ReviewItem label="Start Date" value={employmentForm.startDate} />
                  <ReviewItem label="Cost Centre" value={employmentForm.costCentre} />
                </div>
              </div>

              {/* Compensation Review */}
              <div className="mb-6">
                <div className="flex items-center justify-between pb-2 border-b border-border mb-3">
                  <h3 className="text-[0.9375rem] font-bold text-foreground">Compensation &amp; Benefits</h3>
                  <button
                    type="button"
                    onClick={() => goToStep(3)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-border rounded-button bg-card text-xs font-semibold text-primary hover:bg-surface-navy hover:border-primary transition-all"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 gap-x-6">
                  <ReviewItem label="Annual Salary" value={compensationForm.annualSalary ? `R ${compensationForm.annualSalary}` : ''} />
                  <ReviewItem label="Pay Frequency" value={compensationForm.payFrequency} />
                  <ReviewItem label="Bank" value={compensationForm.bankName} />
                  <ReviewItem
                    label="Account Number"
                    value={compensationForm.accountNumber ? `**** **** ${compensationForm.accountNumber.slice(-4)}` : ''}
                  />
                  <ReviewItem label="Medical Aid" value={compensationForm.medicalAid ? compensationForm.medicalAidProvider || 'Yes' : 'No'} />
                  <ReviewItem label="UIF" value={compensationForm.uif ? 'Yes' : 'No'} />
                </div>
              </div>

              {/* Documents Review */}
              <div className="mb-6">
                <div className="flex items-center justify-between pb-2 border-b border-border mb-3">
                  <h3 className="text-[0.9375rem] font-bold text-foreground">Documents</h3>
                  <button
                    type="button"
                    onClick={() => goToStep(4)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-border rounded-button bg-card text-xs font-semibold text-primary hover:bg-surface-navy hover:border-primary transition-all"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 gap-x-6">
                  <ReviewItem
                    label="ID Document"
                    value={documentsForm.idDocument.length > 0
                      ? documentsForm.idDocument.map((f) => `${f.name} (${f.size})`).join(', ')
                      : 'Not uploaded'}
                  />
                  <ReviewItem
                    label="Proof of Address"
                    value={documentsForm.proofOfAddress.length > 0
                      ? documentsForm.proofOfAddress.map((f) => `${f.name} (${f.size})`).join(', ')
                      : 'Not uploaded'}
                  />
                  <ReviewItem
                    label="Qualifications"
                    value={documentsForm.qualifications.length > 0
                      ? documentsForm.qualifications.map((f) => `${f.name} (${f.size})`).join(', ')
                      : 'Not uploaded'}
                  />
                  <ReviewItem
                    label="Tax Certificate"
                    value={documentsForm.taxCertificate.length > 0
                      ? documentsForm.taxCertificate.map((f) => `${f.name} (${f.size})`).join(', ')
                      : 'Not uploaded'}
                  />
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <div className="flex items-start gap-3 px-5 py-4 bg-surface-navy border border-accent-navy/30 rounded-control mt-6">
                <input
                  type="checkbox"
                  id="confirmCheck"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="w-5 h-5 accent-primary flex-shrink-0 mt-0.5 cursor-pointer"
                />
                <label htmlFor="confirmCheck" className="text-sm text-foreground cursor-pointer font-medium">
                  I confirm that all information provided is accurate and complete. I understand that
                  providing false information may result in disciplinary action.
                </label>
              </div>

              <StepNav prevStep={4} isSubmit />
            </StepCard>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
