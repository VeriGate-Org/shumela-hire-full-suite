import type { Meta, StoryObj } from '@storybook/react';
import AiDisclaimer from '../components/ai/AiDisclaimer';

const meta = {
  title: 'Components/AiDisclaimer',
  component: AiDisclaimer,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    level: {
      control: 'select',
      options: ['advisory', 'high-risk'],
      description: 'The risk level of the AI-generated content',
    },
    compact: {
      control: 'boolean',
      description: 'Whether to render in compact mode',
    },
    provider: {
      control: 'text',
      description: 'Name of the AI provider',
    },
    model: {
      control: 'text',
      description: 'Name of the AI model',
    },
  },
} satisfies Meta<typeof AiDisclaimer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Advisory: Story = {
  args: {
    level: 'advisory',
  },
};

export const HighRisk: Story = {
  args: {
    level: 'high-risk',
  },
};

export const AdvisoryWithProvider: Story = {
  args: {
    level: 'advisory',
    provider: 'OpenAI',
    model: 'GPT-4o',
  },
};

export const HighRiskWithProvider: Story = {
  args: {
    level: 'high-risk',
    provider: 'Anthropic',
    model: 'Claude Opus 4',
  },
};

export const CompactAdvisory: Story = {
  args: {
    level: 'advisory',
    compact: true,
  },
};

export const CompactHighRiskWithProvider: Story = {
  args: {
    level: 'high-risk',
    compact: true,
    provider: 'OpenAI',
    model: 'GPT-4o',
  },
};
