import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProjectHeader from '@/features/Projects/components/ProjectHeader/ProjectHeader';

const meta = {
  title: 'Projects/ProjectHeader',
  component: ProjectHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    searchTerm: { control: 'text' },
    searchPlaceholder: { control: 'text' },
    showBackButton: { control: 'boolean' },
    backButtonText: { control: 'text' },
    showCreateButton: { control: 'boolean' },
    variant: {
      control: { type: 'select' },
      options: ['detail', 'list'],
    },
    className: { control: 'text' },
  },
  args: {
    setSearchTerm: fn(),
  },
  decorators: [
    (Story) => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });
      return (
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Story />
          </BrowserRouter>
        </QueryClientProvider>
      );
    },
  ],
} satisfies Meta<typeof ProjectHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'My Projects',
    searchTerm: '',
    searchPlaceholder: 'Search by Query Name',
    isEditing: false,
    setEditingState: fn(),
  },
};

export const WithSubtitle: Story = {
  args: {
    title: 'Projects',
    subtitle: 'Manage your research projects and queries',
    searchTerm: '',
    searchPlaceholder: 'Search by Query Name',
    isEditing: false,
    setEditingState: fn(),
  },
};

export const WithBackButton: Story = {
  args: {
    title: 'Example Project Name',
    subtitle: '2 Queries',
    searchTerm: '',
    searchPlaceholder: 'Search by Query Name',
    showBackButton: true,
    backButtonText: 'All Projects',
    variant: 'detail',
    isEditing: false,
    setEditingState: fn(),
  },
};

export const WithCreateButton: Story = {
  args: {
    title: 'Projects',
    searchTerm: '',
    searchPlaceholder: 'Search by Project orQuery Name',
    showCreateButton: true,
    variant: 'list',
    isEditing: false,
    setEditingState: fn(),
  },
};

export const DetailVariant: Story = {
  args: {
    title: 'Example Project Name',
    subtitle: '2 Queries',
    searchTerm: '',
    searchPlaceholder: 'Search by Query Name',
    variant: 'detail',
    isEditing: false,
    setEditingState: fn(),
  },
};

export const ListVariant: Story = {
  args: {
    title: 'My Projects',
    searchTerm: '',
    searchPlaceholder: 'Search by Project or Query Name',
    variant: 'list',
    isEditing: false,
    setEditingState: fn(),
  },
}; 