import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { BrowserRouter } from 'react-router-dom';
import ProjectCard from '@/features/Projects/components/ProjectCard/ProjectCard';
import { Project, QueryStatusObject } from '@/features/Projects/types/projects';

const mockProject: Project = {
  id: 1,
  data: {
    title: 'Cancer Research Project',
    pks: ['qid1', 'qid2', 'qid3'],
  },
  time_created: new Date('2024-01-15'),
  time_updated: new Date('2024-01-20'),
  deleted: false,
  bookmark_count: 5,
  note_count: 3,
  save_type: 'project',
};

const mockQueries: QueryStatusObject[] = [
  {
    status: 'success',
    data: {
      qid: 'qid1',
      aras: ['ara1', 'ara2'],
      title: 'Query 1',
      bookmark_ids: ['bookmark1', 'bookmark2'],
      note_count: 2,
      time_created: new Date('2024-01-15'),
      time_updated: new Date('2024-01-18'),
      deleted: false,
    },
  },
  {
    status: 'running',
    data: {
      qid: 'qid2',
      aras: ['ara3'],
      title: 'Query 2',
      bookmark_ids: ['bookmark3'],
      note_count: 1,
      time_created: new Date('2024-01-16'),
      time_updated: new Date('2024-01-19'),
      deleted: false,
    },
  },
  {
    status: 'error',
    data: {
      qid: 'qid3',
      aras: [],
      title: 'Query 3',
      bookmark_ids: [],
      note_count: 0,
      time_created: new Date('2024-01-17'),
      time_updated: new Date('2024-01-20'),
      deleted: false,
    },
  },
];

const meta = {
  title: 'Projects/ProjectCard',
  component: ProjectCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    searchTerm: { control: 'text' },
  },
  args: {
    queries: mockQueries,
    project: mockProject,
    searchTerm: '',
    setSelectedProjects: fn(),
    selectedProjects: [],
  },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
} satisfies Meta<typeof ProjectCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    queries: mockQueries,
    project: mockProject,
    searchTerm: '',
    selectedProjects: [],
  },
};

export const WithSearchTerm: Story = {
  args: {
    queries: mockQueries,
    project: mockProject,
    searchTerm: 'cancer',
    selectedProjects: [],
  },
};

export const Selected: Story = {
  args: {
    queries: mockQueries,
    project: mockProject,
    searchTerm: '',
    selectedProjects: [mockProject],
  },
};

export const EmptyProject: Story = {
  args: {
    queries: [],
    project: {
      ...mockProject,
      data: {
        ...mockProject.data,
        title: 'Empty Project',
        pks: [],
      },
      bookmark_count: 0,
      note_count: 0,
    },
    searchTerm: '',
    selectedProjects: [],
  },
};

export const LongTitle: Story = {
  args: {
    queries: mockQueries,
    project: {
      ...mockProject,
      data: {
        ...mockProject.data,
        title: 'Very Long Project Title That Might Overflow and Need to be Handled Properly',
      },
    },
    searchTerm: '',
    selectedProjects: [],
  },
};

export const HighBookmarkCount: Story = {
  args: {
    queries: mockQueries,
    project: {
      ...mockProject,
      bookmark_count: 150,
      note_count: 25,
    },
    searchTerm: '',
    selectedProjects: [],
  },
}; 