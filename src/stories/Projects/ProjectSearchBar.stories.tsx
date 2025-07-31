import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import ProjectSearchBar from '@/features/Projects/components/ProjectSearchBar/ProjectSearchBar';

const meta = {
  title: 'Projects/ProjectSearchBar',
  component: ProjectSearchBar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    handleSearch: { action: 'search' },
    searchPlaceholder: { control: 'text' },
    searchTerm: { control: 'text' },
  },
  args: {
    handleSearch: fn(),
    searchPlaceholder: 'Search by Query Name',
    searchTerm: '',
    styles: {
      searchSection: 'search-section',
      searchInput: 'search-input',
    },
  },
} satisfies Meta<typeof ProjectSearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    searchPlaceholder: 'Search by Query Name',
    searchTerm: '',
  },
};

export const WithSearchTerm: Story = {
  args: {
    searchPlaceholder: 'Search by Query Name',
    searchTerm: 'cancer research',
  },
};

export const CustomPlaceholder: Story = {
  args: {
    searchPlaceholder: 'Search projects...',
    searchTerm: '',
  },
};

export const LongSearchTerm: Story = {
  args: {
    searchPlaceholder: 'Search by Query Name',
    searchTerm: 'very long search term that might overflow',
  },
}; 