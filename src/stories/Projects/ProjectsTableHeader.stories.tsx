import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import ProjectsTableHeader from '@/features/Projects/components/TableHeader/ProjectsTableHeader/ProjectsTableHeader';
import { Project, SortField, SortDirection } from '@/features/Projects/types/projects';

const mockProjects: Project[] = [
  {
    id: 1,
    data: {
      pks: ['qid1', 'qid2', 'qid3'],
      title: 'Cancer Research Project',
    },
    time_created: new Date('2024-01-15'),
    time_updated: new Date('2024-01-20'),
    deleted: false,
    bookmark_count: 5,
    note_count: 3,
    save_type: 'project',
  },
  {
    id: 2,
    data: {
      pks: ['qid4', 'qid5'],
      title: 'Diabetes Study',
    },
    time_created: new Date('2024-01-10'),
    time_updated: new Date('2024-01-18'),
    deleted: false,
    bookmark_count: 3,
    note_count: 1,
    save_type: 'project',
  },
  {
    id: 3,
    data: {
      pks: ['qid6'],
      title: 'Heart Disease Analysis',
    },
    time_created: new Date('2024-01-05'),
    time_updated: new Date('2024-01-15'),
    deleted: false,
    bookmark_count: 2,
    note_count: 0,
    save_type: 'project',
  },
];

const meta = {
  title: 'Projects/ProjectsTableHeader',
  component: ProjectsTableHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    sortField: {
      control: { type: 'select' },
      options: ['name', 'lastSeen', 'dateAdded', 'bookmarks', 'notes', 'status'],
    },
    sortDirection: {
      control: { type: 'select' },
      options: ['asc', 'desc'],
    },
  },
  args: {
    selectedProjects: [],
    activeProjects: mockProjects,
    sortField: 'name',
    sortDirection: 'asc',
    setSelectedProjects: fn(),
    onSort: fn(),
  },
} satisfies Meta<typeof ProjectsTableHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    selectedProjects: [],
    activeProjects: mockProjects,
    sortField: 'name',
    sortDirection: 'asc',
  },
};

export const AllSelected: Story = {
  args: {
    selectedProjects: mockProjects,
    activeProjects: mockProjects,
    sortField: 'name',
    sortDirection: 'asc',
  },
};

export const SomeSelected: Story = {
  args: {
    selectedProjects: [mockProjects[0], mockProjects[1]],
    activeProjects: mockProjects,
    sortField: 'name',
    sortDirection: 'asc',
  },
};

export const SortedByName: Story = {
  args: {
    selectedProjects: [],
    activeProjects: mockProjects,
    sortField: 'name',
    sortDirection: 'desc',
  },
};

export const SortedByLastSeen: Story = {
  args: {
    selectedProjects: [],
    activeProjects: mockProjects,
    sortField: 'lastSeen',
    sortDirection: 'desc',
  },
};

export const SortedByDateAdded: Story = {
  args: {
    selectedProjects: [],
    activeProjects: mockProjects,
    sortField: 'dateAdded',
    sortDirection: 'asc',
  },
};

export const SortedByBookmarks: Story = {
  args: {
    selectedProjects: [],
    activeProjects: mockProjects,
    sortField: 'bookmarks',
    sortDirection: 'desc',
  },
};

export const SortedByNotes: Story = {
  args: {
    selectedProjects: [],
    activeProjects: mockProjects,
    sortField: 'notes',
    sortDirection: 'asc',
  },
};

export const SortedByStatus: Story = {
  args: {
    selectedProjects: [],
    activeProjects: mockProjects,
    sortField: 'status',
    sortDirection: 'desc',
  },
};

export const EmptyList: Story = {
  args: {
    selectedProjects: [],
    activeProjects: [],
    sortField: 'name',
    sortDirection: 'asc',
  },
}; 