import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { fn } from 'storybook/test';
import OnboardingWizard from '../components/OnboardingWizard';
import { AuthProvider } from '../contexts/AuthContext';

/**
 * The OnboardingWizard uses `useAuth()` internally, so every story must be
 * wrapped in an AuthProvider. Because the AuthProvider reads from
 * sessionStorage on mount, we seed the storage in a decorator so the
 * component can resolve a user object.
 */
const withAuth = (role: string) => {
  return function AuthDecorator(Story: React.ComponentType) {
    // Seed a fake JWT so AuthProvider recognises a session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('jwt_token', 'storybook-token');
      // AuthProvider always sets ADMIN by default when a token exists.
      // The component reads user.role from context.
    }
    return (
      <AuthProvider>
        <div className="p-6 bg-gray-50 min-h-[600px] flex items-start justify-center">
          <Story />
        </div>
      </AuthProvider>
    );
  };
};

const meta = {
  title: 'Components/OnboardingWizard',
  component: OnboardingWizard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
  argTypes: {
    companyName: {
      control: 'text',
      description: 'Name of the company displayed in the wizard',
    },
  },
} satisfies Meta<typeof OnboardingWizard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    companyName: 'ShumelaHire',
    onComplete: fn(),
  },
  decorators: [withAuth('ADMIN')],
};

export const CustomCompanyName: Story = {
  args: {
    companyName: 'Arthmatic DevWorks',
    onComplete: fn(),
  },
  decorators: [withAuth('ADMIN')],
};

export const WithCompleteCallback: Story = {
  args: {
    companyName: 'ShumelaHire',
    onComplete: fn(),
  },
  decorators: [withAuth('HR_MANAGER')],
};
