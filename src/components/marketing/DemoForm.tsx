'use client';

import { useState, FormEvent } from 'react';
import MarketingButton from './MarketingButton';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

interface DemoFormData {
  firstName: string;
  lastName: string;
  workEmail: string;
  organisation: string;
  jobTitle: string;
  organisationType: string;
  employeeCount: string;
  currentProcess: string;
  message: string;
}

const ORGANISATION_TYPES = [
  'Corporate',
  'Development Finance Institution',
  'Government Agency',
  'Other',
];

const EMPLOYEE_COUNTS = ['1-50', '51-200', '201-500', '501-1000', '1000+'];

const initialFormData: DemoFormData = {
  firstName: '',
  lastName: '',
  workEmail: '',
  organisation: '',
  jobTitle: '',
  organisationType: '',
  employeeCount: '',
  currentProcess: '',
  message: '',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClasses =
  'w-full border border-[#E2E8F0] rounded-[2px] px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#05527E]/20 focus:border-[#05527E] transition-colors';

export default function DemoForm() {
  const [formData, setFormData] = useState<DemoFormData>(initialFormData);
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function validate(): string | null {
    if (!formData.firstName.trim()) return 'First name is required.';
    if (!formData.lastName.trim()) return 'Last name is required.';
    if (!formData.workEmail.trim()) return 'Work email is required.';
    if (!EMAIL_REGEX.test(formData.workEmail)) return 'Please enter a valid email address.';
    if (!formData.organisation.trim()) return 'Organisation is required.';
    if (!formData.jobTitle.trim()) return 'Job title is required.';
    if (!formData.organisationType) return 'Please select an organisation type.';
    if (!formData.employeeCount) return 'Please select your employee count.';
    return null;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setStatus('error');
      setErrorMessage(validationError);
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/public/demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setErrorMessage(data.message || 'Something went wrong. Please try again.');
        return;
      }

      setStatus('success');
      setFormData(initialFormData);
    } catch {
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <div className="border border-[#E2E8F0] rounded-[2px] p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-[#05527E]/10 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-[#05527E]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-[#0F172A] mb-2">Demo Request Received</h3>
        <p className="text-sm text-[#64748B] leading-relaxed max-w-md mx-auto">
          Thank you for your interest in ShumelaHire. A member of our team will contact you within
          one business day to schedule your demonstration.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {status === 'error' && errorMessage && (
        <div className="mb-6 border border-red-200 bg-red-50 rounded-[2px] px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First Name */}
        <div>
          <label htmlFor="demo-firstName" className="text-sm font-medium text-[#0F172A] mb-1.5 block">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            id="demo-firstName"
            name="firstName"
            type="text"
            required
            value={formData.firstName}
            onChange={handleChange}
            placeholder="First name"
            className={inputClasses}
          />
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="demo-lastName" className="text-sm font-medium text-[#0F172A] mb-1.5 block">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            id="demo-lastName"
            name="lastName"
            type="text"
            required
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Last name"
            className={inputClasses}
          />
        </div>

        {/* Work Email */}
        <div>
          <label htmlFor="demo-workEmail" className="text-sm font-medium text-[#0F172A] mb-1.5 block">
            Work Email <span className="text-red-500">*</span>
          </label>
          <input
            id="demo-workEmail"
            name="workEmail"
            type="email"
            required
            value={formData.workEmail}
            onChange={handleChange}
            placeholder="you@organisation.co.za"
            className={inputClasses}
          />
        </div>

        {/* Organisation */}
        <div>
          <label htmlFor="demo-organisation" className="text-sm font-medium text-[#0F172A] mb-1.5 block">
            Organisation <span className="text-red-500">*</span>
          </label>
          <input
            id="demo-organisation"
            name="organisation"
            type="text"
            required
            value={formData.organisation}
            onChange={handleChange}
            placeholder="Your organisation"
            className={inputClasses}
          />
        </div>

        {/* Job Title */}
        <div>
          <label htmlFor="demo-jobTitle" className="text-sm font-medium text-[#0F172A] mb-1.5 block">
            Job Title <span className="text-red-500">*</span>
          </label>
          <input
            id="demo-jobTitle"
            name="jobTitle"
            type="text"
            required
            value={formData.jobTitle}
            onChange={handleChange}
            placeholder="Your job title"
            className={inputClasses}
          />
        </div>

        {/* Organisation Type */}
        <div>
          <label htmlFor="demo-organisationType" className="text-sm font-medium text-[#0F172A] mb-1.5 block">
            Organisation Type <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="demo-organisationType"
              name="organisationType"
              required
              value={formData.organisationType}
              onChange={handleChange}
              className={`${inputClasses} appearance-none pr-10`}
            >
              <option value="" disabled>
                Select type
              </option>
              {ORGANISATION_TYPES.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* Employee Count — full width */}
      <div className="mt-6">
        <label htmlFor="demo-employeeCount" className="text-sm font-medium text-[#0F172A] mb-1.5 block">
          Number of Employees <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            id="demo-employeeCount"
            name="employeeCount"
            required
            value={formData.employeeCount}
            onChange={handleChange}
            className={`${inputClasses} appearance-none pr-10`}
          >
            <option value="" disabled>
              Select range
            </option>
            {EMPLOYEE_COUNTS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>

      {/* Current Process — full width, optional */}
      <div className="mt-6">
        <label htmlFor="demo-currentProcess" className="text-sm font-medium text-[#0F172A] mb-1.5 block">
          Current Hiring Process
        </label>
        <textarea
          id="demo-currentProcess"
          name="currentProcess"
          rows={3}
          value={formData.currentProcess}
          onChange={handleChange}
          placeholder="Briefly describe your current hiring process"
          className={`${inputClasses} min-h-[120px] resize-y`}
        />
      </div>

      {/* Message — full width, optional */}
      <div className="mt-6">
        <label htmlFor="demo-message" className="text-sm font-medium text-[#0F172A] mb-1.5 block">
          Additional Notes
        </label>
        <textarea
          id="demo-message"
          name="message"
          rows={3}
          value={formData.message}
          onChange={handleChange}
          placeholder="Anything else you would like us to know"
          className={`${inputClasses} min-h-[120px] resize-y`}
        />
      </div>

      {/* Submit */}
      <div className="mt-8">
        <MarketingButton
          variant="primary"
          size="md"
          type="submit"
          disabled={status === 'submitting'}
          className="w-full md:w-auto"
        >
          {status === 'submitting' ? 'Submitting...' : 'Request a Demo'}
        </MarketingButton>
      </div>
    </form>
  );
}
