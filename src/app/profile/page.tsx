'use client';

import React, { useState } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { useAuth, ROLE_DISPLAY_NAMES, UserRole } from '@/contexts/AuthContext';
import {
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  KeyIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

interface ProfileFormData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  jobTitle: string;
  department: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const [profileData, setProfileData] = useState<ProfileFormData>({
    fullName: user?.name || 'John Doe',
    email: user?.email || 'john.doe@company.com',
    phone: '+27 82 345 6789',
    location: 'Cape Town, South Africa',
    jobTitle: 'HR Manager',
    department: 'Human Resources',
  });

  const [editData, setEditData] = useState<ProfileFormData>(profileData);

  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const handleEditToggle = () => {
    if (isEditing) {
      setEditData(profileData);
    } else {
      setEditData(profileData);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    setProfileData(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(profileData);
    setIsEditing(false);
  };

  const handleEditChange = (field: keyof ProfileFormData, value: string) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const validatePassword = (): boolean => {
    const errors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordUpdate = () => {
    if (validatePassword()) {
      setPasswordSuccess(true);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
      setTimeout(() => setPasswordSuccess(false), 3000);
    }
  };

  const roleName = user?.role
    ? ROLE_DISPLAY_NAMES[user.role as UserRole] || user.role
    : 'User';

  return (
    <PageWrapper
      title="Profile"
      subtitle="View and manage your personal information"
      actions={
        <button
          onClick={handleEditToggle}
          className={isEditing ? 'btn-secondary' : 'btn-primary'}
        >
          {isEditing ? (
            <>
              <XMarkIcon className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
              Cancel
            </>
          ) : (
            <>
              <PencilIcon className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
              Edit Profile
            </>
          )}
        </button>
      }
    >
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="enterprise-card p-6">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 bg-cta rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {getInitials(profileData.fullName)}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold tracking-[-0.03em] text-foreground">
                {profileData.fullName}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">{roleName}</p>
              <p className="text-sm text-muted-foreground">{profileData.email}</p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="enterprise-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <UserCircleIcon className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-[0.05em] text-foreground">
              Personal Information
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ProfileField
              icon={<UserCircleIcon className="h-4 w-4 text-muted-foreground" />}
              label="Full Name"
              value={isEditing ? editData.fullName : profileData.fullName}
              isEditing={isEditing}
              onChange={(v) => handleEditChange('fullName', v)}
            />
            <ProfileField
              icon={<EnvelopeIcon className="h-4 w-4 text-muted-foreground" />}
              label="Email Address"
              value={isEditing ? editData.email : profileData.email}
              isEditing={isEditing}
              onChange={(v) => handleEditChange('email', v)}
              type="email"
            />
            <ProfileField
              icon={<PhoneIcon className="h-4 w-4 text-muted-foreground" />}
              label="Phone Number"
              value={isEditing ? editData.phone : profileData.phone}
              isEditing={isEditing}
              onChange={(v) => handleEditChange('phone', v)}
              type="tel"
            />
            <ProfileField
              icon={<MapPinIcon className="h-4 w-4 text-muted-foreground" />}
              label="Location"
              value={isEditing ? editData.location : profileData.location}
              isEditing={isEditing}
              onChange={(v) => handleEditChange('location', v)}
            />
            <ProfileField
              icon={<BriefcaseIcon className="h-4 w-4 text-muted-foreground" />}
              label="Job Title"
              value={isEditing ? editData.jobTitle : profileData.jobTitle}
              isEditing={isEditing}
              onChange={(v) => handleEditChange('jobTitle', v)}
            />
            <ProfileField
              icon={<BuildingOfficeIcon className="h-4 w-4 text-muted-foreground" />}
              label="Department"
              value={isEditing ? editData.department : profileData.department}
              isEditing={isEditing}
              onChange={(v) => handleEditChange('department', v)}
            />
          </div>

          {isEditing && (
            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-border">
              <button onClick={handleSave} className="btn-cta">
                <CheckIcon className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
                Save Changes
              </button>
              <button onClick={handleCancel} className="btn-secondary">
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Account Details */}
        <div className="enterprise-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <ShieldCheckIcon className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-[0.05em] text-foreground">
              Account Details
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <span className="form-label">Role</span>
              <p className="text-sm text-foreground">{roleName}</p>
            </div>
            <div>
              <span className="form-label">Member Since</span>
              <p className="text-sm text-foreground">15 January 2024</p>
            </div>
            <div>
              <span className="form-label">Last Login</span>
              <p className="text-sm text-foreground">17 February 2026, 09:32</p>
            </div>
            <div>
              <span className="form-label">Account Status</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.05em] rounded-full bg-green-50 text-green-700 border border-green-200">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="enterprise-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <KeyIcon className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-[0.05em] text-foreground">
              Change Password
            </h3>
          </div>

          {passwordSuccess && (
            <div className="mb-4 p-3 rounded-control bg-green-50 border border-green-200 text-green-700 text-sm">
              Password updated successfully.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className={`form-input w-full outline-none ${passwordErrors.currentPassword ? 'border-red-400' : ''}`}
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData((p) => ({ ...p, currentPassword: e.target.value }))
                }
                placeholder="Enter current password"
              />
              {passwordErrors.currentPassword && (
                <p className="text-xs text-red-500 mt-1">{passwordErrors.currentPassword}</p>
              )}
            </div>
            <div>
              <label className="form-label">New Password</label>
              <input
                type="password"
                className={`form-input w-full outline-none ${passwordErrors.newPassword ? 'border-red-400' : ''}`}
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData((p) => ({ ...p, newPassword: e.target.value }))
                }
                placeholder="Minimum 8 characters"
              />
              {passwordErrors.newPassword && (
                <p className="text-xs text-red-500 mt-1">{passwordErrors.newPassword}</p>
              )}
            </div>
            <div>
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className={`form-input w-full outline-none ${passwordErrors.confirmPassword ? 'border-red-400' : ''}`}
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))
                }
                placeholder="Re-enter new password"
              />
              {passwordErrors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">{passwordErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="mt-5">
            <button onClick={handlePasswordUpdate} className="btn-primary">
              Update Password
            </button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

/* Reusable field component for the personal info section */
function ProfileField({
  icon,
  label,
  value,
  isEditing,
  onChange,
  type = 'text',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <span className="form-label flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      {isEditing ? (
        <input
          type={type}
          className="form-input w-full outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <p className="text-sm text-foreground">{value}</p>
      )}
    </div>
  );
}
