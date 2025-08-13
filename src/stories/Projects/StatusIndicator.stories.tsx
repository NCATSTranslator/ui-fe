import type { Meta, StoryObj } from '@storybook/react-vite';
import StatusIndicator from '@/features/Projects/components/StatusIndicator/StatusIndicator';
import { QueryStatus } from '@/features/Projects/types/projects';

const meta = {
  title: 'Projects/StatusIndicator',
  component: StatusIndicator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: { type: 'select' },
      options: ['success', 'running', 'error'],
    },
  },
} satisfies Meta<typeof StatusIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    status: 'complete',
  },
};

export const Running: Story = {
  args: {
    status: 'running',
  },
};

export const Error: Story = {
  args: {
    status: 'error',
  },
};

export const AllStatuses: Story = {
  args: {
    status: 'complete',
  },
  render: (args) => (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
      <div>
        <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>Complete</div>
        <StatusIndicator status={args.status} />
      </div>
      <div>
        <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>Running</div>
        <StatusIndicator status="running" />
      </div>
      <div>
        <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>Error</div>
        <StatusIndicator status="error" />
      </div>
    </div>
  ),
}; 