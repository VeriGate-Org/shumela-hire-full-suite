'use client';

import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { apiFetch } from '@/lib/api-fetch';
import { ROLE_DISPLAY_NAMES, UserRole } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';

const INVITABLE_ROLES: UserRole[] = [
  'ADMIN', 'EXECUTIVE', 'HR_MANAGER', 'HIRING_MANAGER',
  'RECRUITER', 'INTERVIEWER', 'EMPLOYEE',
];

interface InviteUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InviteUserModal({ open, onClose, onSuccess }: InviteUserModalProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRole>('EMPLOYEE');
  const [department, setDepartment] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  if (!open) return null;

  const resetForm = () => {
    setEmail('');
    setFirstName('');
    setLastName('');
    setRole('EMPLOYEE');
    setDepartment('');
    setJobTitle('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiFetch('/api/admin/users/invite', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role,
          department: department.trim() || undefined,
          jobTitle: jobTitle.trim() || undefined,
        }),
      });

      if (res.ok) {
        toast('Invitation sent to ' + email.trim().toLowerCase(), 'success');
        resetForm();
        onSuccess();
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to send invitation.');
      }
    } catch {
      setError('Failed to send invitation. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const inputClasses = 'w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';
  const labelClasses = 'block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-sm shadow-xl max-w-lg w-full">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Invite User</h2>
              <p className="text-sm text-gray-500 mt-1">
                Send an email invitation with a temporary password
              </p>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="invite-email" className={labelClasses}>Email</label>
              <input
                id="invite-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClasses}
                placeholder="user@company.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="invite-first-name" className={labelClasses}>First Name</label>
                <input
                  id="invite-first-name"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClasses}
                  placeholder="First name"
                />
              </div>
              <div>
                <label htmlFor="invite-last-name" className={labelClasses}>Last Name</label>
                <input
                  id="invite-last-name"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClasses}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="invite-role" className={labelClasses}>Role</label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className={inputClasses}
              >
                {INVITABLE_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_DISPLAY_NAMES[r]}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="invite-department" className={labelClasses}>
                  Department <span className="normal-case tracking-normal text-gray-400">(optional)</span>
                </label>
                <input
                  id="invite-department"
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className={inputClasses}
                  placeholder="e.g. Engineering"
                />
              </div>
              <div>
                <label htmlFor="invite-job-title" className={labelClasses}>
                  Job Title <span className="normal-case tracking-normal text-gray-400">(optional)</span>
                </label>
                <input
                  id="invite-job-title"
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className={inputClasses}
                  placeholder="e.g. Software Engineer"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border-2 border-gold-500 text-sm font-medium rounded-full bg-transparent text-violet-900 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
