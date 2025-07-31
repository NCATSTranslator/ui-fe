import type { Meta, StoryObj } from '@storybook/react-vite';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectListInner } from '@/features/Projects/components/ProjectListInner/ProjectListInner';
import { Project, QueryStatusObject } from '@/features/Projects/types/projects';

// Mock data
const mockProjects: Project[] = [
  {
    id: 1,
    title: 'Cancer Research Project',
    qids: ['qid1', 'qid2', 'qid3'],
    time_created: new Date('2024-01-15'),
    time_updated: new Date('2024-01-20'),
    deleted: false,
    bookmark_count: 5,
    note_count: 3,
  },
  {
    id: 2,
    title: 'Diabetes Study',
    qids: ['qid4', 'qid5'],
    time_created: new Date('2024-01-10'),
    time_updated: new Date('2024-01-18'),
    deleted: false,
    bookmark_count: 3,
    note_count: 1,
  },
  {
    id: 3,
    title: 'Heart Disease Analysis',
    qids: ['qid6'],
    time_created: new Date('2024-01-05'),
    time_updated: new Date('2024-01-15'),
    deleted: false,
    bookmark_count: 2,
    note_count: 0,
  },
];

const mockQueries: QueryStatusObject[] = [
  {
    status: 'success',
    data: {
      qid: 'qid1',
      aras: ['ara1', 'ara2', 'ara3'],
      title: 'Cancer Research Query 1',
      bookmark_ids: ['bookmark1', 'bookmark2', 'bookmark3'],
      note_count: 5,
      time_created: new Date('2024-01-15'),
      time_updated: new Date('2024-01-20'),
      deleted: false,
    },
  },
  {
    status: 'running',
    data: {
      qid: 'qid2',
      aras: ['ara4'],
      title: 'Cancer Research Query 2',
      bookmark_ids: ['bookmark4'],
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
      title: 'Cancer Research Query 3',
      bookmark_ids: [],
      note_count: 0,
      time_created: new Date('2024-01-17'),
      time_updated: new Date('2024-01-18'),
      deleted: false,
    },
  },
  {
    status: 'success',
    data: {
      qid: 'qid4',
      aras: ['ara5'],
      title: 'Diabetes Query 1',
      bookmark_ids: ['bookmark5'],
      note_count: 2,
      time_created: new Date('2024-01-12'),
      time_updated: new Date('2024-01-17'),
      deleted: false,
    },
  },
  {
    status: 'success',
    data: {
      qid: 'qid5',
      aras: ['ara6'],
      title: 'Diabetes Query 2',
      bookmark_ids: ['bookmark6'],
      note_count: 1,
      time_created: new Date('2024-01-13'),
      time_updated: new Date('2024-01-16'),
      deleted: false,
    },
  },
  {
    status: 'success',
    data: {
      qid: 'qid6',
      aras: ['ara7'],
      title: 'Heart Disease Query',
      bookmark_ids: ['bookmark7'],
      note_count: 0,
      time_created: new Date('2024-01-08'),
      time_updated: new Date('2024-01-14'),
      deleted: false,
    },
  },
];

const meta = {
  title: 'Projects/ProjectListInner',
  component: ProjectListInner,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      // Mock the hooks
      queryClient.setQueryData(['userProjects'], mockProjects);
      queryClient.setQueryData(['userQueryStatus'], mockQueries);

      return (
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Story />
          </BrowserRouter>
        </QueryClientProvider>
      );
    },
  ],
} satisfies Meta<typeof ProjectListInner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};