import type { Meta, StoryObj } from '@storybook/react-vite';
import CardName from '@/features/Projects/components/CardName/CardName';

const meta = {
  title: 'Projects/CardName',
  component: CardName,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['project', 'smartQuery', 'pathfinderQuery'],
    },
    name: { control: 'text' },
    searchTerm: { control: 'text' },
    itemCount: { control: 'number' },
    className: { control: 'text' },
  },
} satisfies Meta<typeof CardName>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Project: Story = {
  args: {
    type: 'project',
    name: 'Cancer Research Project',
    searchTerm: '',
    itemCount: 5,
  },
};

export const SmartQuery: Story = {
  args: {
    type: 'smartQuery',
    name: 'Cancer Research Query',
    searchTerm: '',
    itemCount: 0,
  },
};

export const PathfinderQuery: Story = {
  args: {
    type: 'pathfinderQuery',
    name: 'Pathfinder Query',
    searchTerm: '',
    itemCount: 0,
  },
};

export const WithSearchTerm: Story = {
  args: {
    type: 'project',
    name: 'Cancer Research Project',
    searchTerm: 'cancer',
    itemCount: 5,
  },
};

export const LongTitle: Story = {
  args: {
    type: 'project',
    name: 'Very Long Project Title That Might Overflow and Need to be Handled Properly in the UI',
    searchTerm: '',
    itemCount: 5,
  },
};

export const SingleQuery: Story = {
  args: {
    type: 'project',
    name: 'Single Query Project',
    searchTerm: '',
    itemCount: 1,
  },
};

export const NoQueries: Story = {
  args: {
    type: 'project',
    name: 'Empty Project',
    searchTerm: '',
    itemCount: 0,
  },
};

export const HighQueryCount: Story = {
  args: {
    type: 'project',
    name: 'Large Project',
    searchTerm: '',
    itemCount: 150,
  },
};

export const AllTypes: Story = {
  args: {
    type: 'project',
    name: 'Cancer Research Project',
    searchTerm: '',
    itemCount: 5,
  },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>Project:</div>
        <CardName
          type={args.type}
          name={args.name}
          searchTerm={args.searchTerm}
          itemCount={args.itemCount}
        />
      </div>
      <div>
        <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>Smart Query:</div>
        <CardName
          type="smartQuery"
          name="Cancer Research Query"
          searchTerm=""
          itemCount={0}
        />
      </div>
      <div>
        <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>Pathfinder Query:</div>
        <CardName
          type="pathfinderQuery"
          name="Pathfinder Query"
          searchTerm=""
          itemCount={0}
        />
      </div>
    </div>
  ),
}; 