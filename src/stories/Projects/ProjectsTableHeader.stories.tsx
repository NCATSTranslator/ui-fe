import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import ProjectsTableHeader from '@/features/Projects/components/TableHeader/ProjectsTableHeader/ProjectsTableHeader';
import { Project, ProjectListState } from '@/features/Projects/types/projects';

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

// Helper function to create projectListState for different scenarios
const createProjectListState = (
  selectedProjects: Project[] = [],
  sortField: ProjectListState['sortField'] = 'name',
  sortDirection: ProjectListState['sortDirection'] = 'asc'
): ProjectListState => ({
  selectedProjects,
  selectedQueries: [],
  setSelectedProjects: fn(),
  setSelectedQueries: fn(),
  sortField,
  sortDirection,
  handleSort: fn(),
  searchTerm: '',
});

const meta = {
  title: 'Projects/ProjectsTableHeader',
  component: ProjectsTableHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    activeProjects: {
      control: { type: 'object' },
    },
    projectListState: {
      control: { type: 'object' },
    },
  },
  args: {
    activeProjects: mockProjects,
    projectListState: createProjectListState(),
  },
} satisfies Meta<typeof ProjectsTableHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    activeProjects: mockProjects,
    projectListState: createProjectListState(),
  },
};

export const AllSelected: Story = {
  args: {
    activeProjects: mockProjects,
    projectListState: createProjectListState(mockProjects),
  },
};

export const SomeSelected: Story = {
  args: {
    activeProjects: mockProjects,
    projectListState: createProjectListState([mockProjects[0], mockProjects[1]]),
  },
};

export const SortedByName: Story = {
  args: {
    activeProjects: mockProjects,
    projectListState: createProjectListState([], 'name', 'desc'),
  },
};

export const SortedByLastSeen: Story = {
  args: {
    activeProjects: mockProjects,
    projectListState: createProjectListState([], 'lastSeen', 'desc'),
  },
};

export const SortedByDateAdded: Story = {
  args: {
    activeProjects: mockProjects,
    projectListState: createProjectListState([], 'dateAdded', 'asc'),
  },
};

export const SortedByBookmarks: Story = {
  args: {
    activeProjects: mockProjects,
    projectListState: createProjectListState([], 'bookmarks', 'desc'),
  },
};

export const SortedByNotes: Story = {
  args: {
    activeProjects: mockProjects,
    projectListState: createProjectListState([], 'notes', 'asc'),
  },
};

export const SortedByStatus: Story = {
  args: {
    activeProjects: mockProjects,
    projectListState: createProjectListState([], 'status', 'desc'),
  },
};

export const EmptyList: Story = {
  args: {
    activeProjects: [],
    projectListState: createProjectListState(),
  },
}; 