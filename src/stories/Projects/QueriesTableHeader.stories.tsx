import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import QueriesTableHeader from '@/features/Projects/components/TableHeader/QueriesTableHeader/QueriesTableHeader';
import { UserQueryObject } from '@/features/Projects/types/projects';

const mockQueries: UserQueryObject[] = [
  {
    status: 'complete',
    sid: 'sid1',
    data: {
      qid: 'qid1',
      aras: ['ara1', 'ara2', 'ara3'],
      title: 'Cancer Research Query',
      bookmark_ids: ['bookmark1', 'bookmark2', 'bookmark3'],
      note_count: 5,
      time_created: new Date('2024-01-15'),
      time_updated: new Date('2024-01-20'),
      deleted: false,
      query: {
        type: 'query',
        curie: 'curie1',
        direction: 'direction1',
      },
    },
  },
  {
    status: 'running',
    sid: 'sid2',
    data: {
      qid: 'qid2',
      aras: ['ara4'],
      title: 'Running Query',
      bookmark_ids: ['bookmark4'],
      note_count: 1,
      time_created: new Date('2024-01-16'),
      time_updated: new Date('2024-01-19'),
      deleted: false,
      query: {
        type: 'query',
        curie: 'curie2',
        direction: 'direction2',
      },
    },
  },
  {
    status: 'error',
    sid: 'sid3',
    data: {
      qid: 'qid3',
      aras: [],
      title: 'Failed Query',
      bookmark_ids: [],
      note_count: 0,
      time_created: new Date('2024-01-17'),
      time_updated: new Date('2024-01-18'),
      deleted: false,
      query: {
        type: 'query',
        curie: 'curie3',
        direction: 'direction3',
      },
    },
  },
];

const meta = {
  title: 'Projects/QueriesTableHeader',
  component: QueriesTableHeader,
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
    selectedQueries: [],
    activeQueries: mockQueries,
    sortField: 'name',
    sortDirection: 'asc',
    setSelectedQueries: fn(),
    onSort: fn(),
  },
} satisfies Meta<typeof QueriesTableHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    selectedQueries: [],
    activeQueries: mockQueries,
    sortField: 'name',
    sortDirection: 'asc',
  },
};

export const AllSelected: Story = {
  args: {
    selectedQueries: mockQueries,
    activeQueries: mockQueries,
    sortField: 'name',
    sortDirection: 'asc',
  },
};

export const SomeSelected: Story = {
  args: {
    selectedQueries: [mockQueries[0], mockQueries[1]],
    activeQueries: mockQueries,
    sortField: 'name',
    sortDirection: 'asc',
  },
};

export const SortedByName: Story = {
  args: {
    selectedQueries: [],
    activeQueries: mockQueries,
    sortField: 'name',
    sortDirection: 'desc',
  },
};

export const SortedByLastSeen: Story = {
  args: {
    selectedQueries: [],
    activeQueries: mockQueries,
    sortField: 'lastSeen',
    sortDirection: 'desc',
  },
};

export const SortedByDateAdded: Story = {
  args: {
    selectedQueries: [],
    activeQueries: mockQueries,
    sortField: 'dateAdded',
    sortDirection: 'asc',
  },
};

export const SortedByBookmarks: Story = {
  args: {
    selectedQueries: [],
    activeQueries: mockQueries,
    sortField: 'bookmarks',
    sortDirection: 'desc',
  },
};

export const SortedByNotes: Story = {
  args: {
    selectedQueries: [],
    activeQueries: mockQueries,
    sortField: 'notes',
    sortDirection: 'asc',
  },
};

export const SortedByStatus: Story = {
  args: {
    selectedQueries: [],
    activeQueries: mockQueries,
    sortField: 'status',
    sortDirection: 'desc',
  },
};

export const EmptyList: Story = {
  args: {
    selectedQueries: [],
    activeQueries: [],
    sortField: 'name',
    sortDirection: 'asc',
  },
}; 