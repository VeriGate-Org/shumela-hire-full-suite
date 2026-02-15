import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import EmptyState from '../components/EmptyState';
import {
  BriefcaseIcon,
  InboxIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

const meta = {
  title: 'Components/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoJobs: Story = {
  args: {
    icon: BriefcaseIcon,
    title: 'No job postings yet',
    description: 'Create your first job posting to start attracting candidates.',
    action: {
      label: 'Create Job Posting',
      href: '/job-postings/new',
    },
  },
};

export const EmptyInbox: Story = {
  args: {
    icon: InboxIcon,
    title: 'No applications',
    description: 'Applications from candidates will appear here once they apply to your open positions.',
  },
};

export const NoSearchResults: Story = {
  args: {
    icon: MagnifyingGlassIcon,
    title: 'No results found',
    description: 'Try adjusting your search filters or broadening your query to find what you are looking for.',
    action: {
      label: 'Clear Filters',
      onClick: fn(),
    },
  },
};

export const NoDocuments: Story = {
  args: {
    icon: DocumentTextIcon,
    title: 'No documents uploaded',
    description: 'Upload resumes, cover letters, or other documents to keep your records organised.',
    action: {
      label: 'Upload Document',
      onClick: fn(),
    },
  },
};

export const WithLinkAction: Story = {
  args: {
    icon: BriefcaseIcon,
    title: 'No requisitions open',
    description: 'Open a new requisition to kick off the hiring process for your team.',
    action: {
      label: 'Open Requisition',
      href: '/requisitions/new',
    },
  },
};
