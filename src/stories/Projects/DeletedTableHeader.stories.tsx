import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import DeletedTableHeader from '@/features/Projects/components/TableHeader/DeletedTableHeader/DeletedTableHeader';
import { Project, UserQueryObject, ProjectListState } from '@/features/Projects/types/projects';

const mockProjects: Project[] = [
  {
    id: 1,
    data: {
      pks: ['qid1', 'qid2', 'qid3'],
      title: 'Deleted Cancer Research Project',
    },
    time_created: new Date('2024-01-15'),
    time_updated: new Date('2024-01-20'),
    deleted: true,
    bookmark_count: 5,
    note_count: 3,
    save_type: 'project',
  },
  {
    id: 2,
    data: {
      pks: ['qid4', 'qid5'],
      title: 'Deleted Diabetes Study',
    },
    time_created: new Date('2024-01-10'),
    time_updated: new Date('2024-01-18'),
    deleted: true,
    bookmark_count: 3,
    note_count: 1,
    save_type: 'project',
  },
];

const mockQueries: UserQueryObject[] = [
  {
    data: {
      aras: [],
      bookmark_ids: ['bm1', 'bm2'],
      deleted: true,
      note_count: 2,
      qid: 'qid1',
      query: {
        type: 'gene',
        curie: 'HGNC:1100',
      },
      time_created: new Date('2024-01-12'),
      time_updated: new Date('2024-01-16'),
      title: 'Deleted Gene Query 1',
    },
    sid: 'sid1',
    status: 'complete',
  },
  {
    data: {
      aras: [],
      bookmark_ids: ['bm3'],
      deleted: true,
      note_count: 1,
      qid: 'qid2',
      query: {
        type: 'drug',
        curie: 'CHEMBL:123',
      },
      time_created: new Date('2024-01-08'),
      time_updated: new Date('2024-01-14'),
      title: 'Deleted Drug Query 1',
    },
    sid: 'sid2',
    status: 'complete',
  },
];

// Helper function to create projectListState for different scenarios
const createProjectListState = (
  selectedProjects: Project[] = [],
  selectedQueries: UserQueryObject[] = [],
  sortField: ProjectListState['sortField'] = 'name',
  sortDirection: ProjectListState['sortDirection'] = 'asc'
): ProjectListState => ({
  selectedProjects,
  selectedQueries,
  setSelectedProjects: fn(),
  setSelectedQueries: fn(),
  sortField,
  sortDirection,
  handleSort: fn(),
  searchTerm: '',
});

const meta = {
  title: 'Projects/DeletedTableHeader',
  component: DeletedTableHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    activeProjects: {
      control: { type: 'object' },
    },
    activeQueries: {
      control: { type: 'object' },
    },
    projectListState: {
      control: { type: 'object' },
    },
  },
  args: {
    activeProjects: mockProjects,
    activeQueries: mockQueries,
    projectListState: createProjectListState(),
  },
} satisfies Meta<typeof DeletedTableHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    activeProjects: mockProjects,
    activeQueries: mockQueries,
    projectListState: createProjectListState(),
  },
};

export const ProjectsSelected: Story = {
  args: {
    activeProjects: mockProjects,
    activeQueries: mockQueries,
    projectListState: createProjectListState(mockProjects),
  },
};

export const QueriesSelected: Story = {
  args: {
    activeProjects: mockProjects,
    activeQueries: mockQueries,
    projectListState: createProjectListState([], mockQueries),
  },
};

export const AllSelected: Story = {
  args: {
    activeProjects: mockProjects,
    activeQueries: mockQueries,
    projectListState: createProjectListState(mockProjects, mockQueries),
  },
};

export const SomeSelected: Story = {
  args: {
    activeProjects: mockProjects,
    activeQueries: mockQueries,
    projectListState: createProjectListState([mockProjects[0]], [mockQueries[0]]),
  },
};

export const SortedByName: Story = {
  args: {
    activeProjects: mockProjects,
    activeQueries: mockQueries,
    projectListState: createProjectListState([], [], 'name', 'desc'),
  },
};

export const SortedByLastSeen: Story = {
  args: {
    activeProjects: mockProjects,
    activeQueries: mockQueries,
    projectListState: createProjectListState([], [], 'lastSeen', 'desc'),
  },
};

export const SortedByDateAdded: Story = {
  args: {
    activeProjects: mockProjects,
    activeQueries: mockQueries,
    projectListState: createProjectListState([], [], 'dateAdded', 'asc'),
  },
};

export const EmptyList: Story = {
  args: {
    activeProjects: [],
    activeQueries: [],
    projectListState: createProjectListState(),
  },
};
