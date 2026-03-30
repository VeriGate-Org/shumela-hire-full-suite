'use client';

import { useState, FormEvent } from 'react';
import MarketingButton from './MarketingButton';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

interface ContactFormData {
  name: string;
  email: string;
  organisation: string;
  phone: string;
  subject: string;
  message: string;
}

const SUBJECT_OPTIONS = [
  'General Enquiry',
  'Sales',
  'Support',
  'Partnership',
];

const initialFormData: ContactFormData = {
  name: '',
  email: '',
  organisation: '',
  phone: '',
  subject: '',
  message: '',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClasses =
  'w-full border border-[#E2E8F0] rounded-[2px] px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#05527E]/20 focus:border-[#05527E] transition-colors';

export default function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function validate(): string | null {
    if (!formData.name.trim()) return 'Name is required.';
    if (!formData.email.trim()) return 'Email is required.';
    if (!EMAIL_REGEX.test(formData.email)) return 'Please enter a valid email address.';
    if (!formData.organisation.trim()) return 'Organisation is required.';
    if (!formData.subject) return 'Please select a subject.';
    if (!formData.message.trim()) return 'Message is required.';
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
      const res = await fetch(`${apiUrl}/api/public/contact`, {
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
        <h3 className="text-lg font-bold text-[#0F172A] mb-2">Enquiry Sent</h3>
        <p className="text-sm text-[#64748B] leading-relaxed max-w-md mx-auto">
          Thank you for your enquiry. We will be in touch within one business day.
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
        {/* Name */}
        <div>
          <label htmlFor="contact-name" className="text-sm font-medium text-[#0F172A] mb-1.5 block">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Your full name"
            className={inputClasses}
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="contact-email" className="text-sm font-medium text-[#0F172A] mb-1.5 block">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="you@organisation.co.za"
            className={inputClasses}
          />
        </div>

        {/* Organisation */}
        <div>
          <label htmlFor="contact-organisation" className="text-sm font-medium text-[#0F172A] mb-1.5 block">
            Organisation <span className="text-red-500">*</span>
          </label>
          <input
            id="contact-organisation"
            name="organisation"
            type="text"
            required
            value={formData.organisation}
            onChange={handleChange}
            placeholder="Your organisation"
            className={inputClasses}
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="contact-phone" className="text-sm font-medium text-[#0F172A] mb-1.5 block">
            Phone
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+27 (0) 00 000 0000"
            className={inputClasses}
          />
        </div>
      </div>

      {/* Subject */}
      <div className="mt-6">
        <label htmlFor="contact-subject" className="text-sm font-medium text-[#0F172A] mb-1.5 block">
          Subject <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            id="contact-subject"
            name="subject"
            required
            value={formData.subject}
            onChange={handleChange}
            className={`${inputClasses} appearance-none pr-10`}
          >
            <option value="" disabled>
              Select a subject
            </option>
            {SUBJECT_OPTIONS.map((opt) => (
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

      {/* Message */}
      <div className="mt-6">
        <label htmlFor="contact-message" className="text-sm font-medium text-[#0F172A] mb-1.5 block">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          value={formData.message}
          onChange={handleChange}
          placeholder="How can we help?"
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
          {status === 'submitting' ? 'Sending...' : 'Send Enquiry'}
        </MarketingButton>
      </div>
    </form>
  );
}
