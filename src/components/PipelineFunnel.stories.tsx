import type { Meta, StoryObj } from '@storybook/react';
import PipelineFunnel from './PipelineFunnel';

const meta: Meta<typeof PipelineFunnel> = {
  title: 'Components/PipelineFunnel',
  component: PipelineFunnel,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A visual funnel chart showing the progression of candidates through the recruitment pipeline.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    funnelData: {
      control: { type: 'object' },
      description: 'Object with stage names as keys and candidate counts as values',
    },
    stages: {
      control: { type: 'object' },
      description: 'Array of pipeline stage definitions',
    },
    onStageClick: {
      action: 'stage-clicked',
      description: 'Callback when a stage is clicked',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock stages data
const mockStages: any[] = [];

// Mock funnel data
const defaultFunnelData = {
  applied: 1250,
  screening: 420,
  phone_interview: 180,
  technical_assessment: 95,
  final_interview: 45,
  hired: 18,
};

const smallFunnelData = {
  applied: 100,
  screening: 60,
  phone_interview: 25,
  hired: 8,
};

export const Default: Story = {
  args: {
    funnelData: defaultFunnelData,
    stages: mockStages,
  },
};

export const CompactFunnel: Story = {
  args: {
    funnelData: smallFunnelData,
    stages: mockStages.filter(stage => 
      ['applied', 'screening', 'phone_interview', 'hired'].includes(stage.name)
    ),
  },
};

export const HighConversionFunnel: Story = {
  args: {
    funnelData: {
      applied: 500,
      screening: 350,
      phone_interview: 280,
      technical_assessment: 210,
      final_interview: 165,
      hired: 130,
    },
    stages: mockStages,
  },
};

export const EarlyStageDropoff: Story = {
  args: {
    funnelData: {
      applied: 1000,
      screening: 150,
      phone_interview: 45,
      technical_assessment: 20,
      final_interview: 12,
      hired: 8,
    },
    stages: mockStages,
  },
};

export const MinimalStages: Story = {
  args: {
    funnelData: {
      applied: 200,
      hired: 15,
    },
    stages: [
      {
        name: 'applied',
        displayName: 'Applied',
        order: 1,
        isActive: true,
        isTerminal: false,
        successful: false,
        rejected: false,
        withdrawn: false,
        cssClass: 'bg-gold-100 text-gold-800',
        statusIcon: '📝',
        progressPercentage: 100,
      },
      {
        name: 'hired',
        displayName: 'Hired',
        order: 6,
        isActive: true,
        isTerminal: true,
        successful: true,
        rejected: false,
        withdrawn: false,
        cssClass: 'bg-green-100 text-green-800',
        statusIcon: '🎉',
        progressPercentage: 7.5,
      },
    ],
  },
};
