import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { BrowserRouter } from 'react-router-dom';
import QueryCard from '@/features/Projects/components/QueryCard/QueryCard';
import { UserQueryObject } from '@/features/Projects/types/projects';

const mockQuerySuccess: UserQueryObject = {
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
};

const mockQueryRunning: UserQueryObject = {
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
};

const mockQueryError: UserQueryObject = {
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
};

const meta = {
  title: 'Projects/QueryCard',
  component: QueryCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    searchTerm: { control: 'text' },
  },
  args: {
    query: mockQuerySuccess,
    searchTerm: '',
    setSelectedQueries: fn(),
    selectedQueries: [],
  },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
} satisfies Meta<typeof QueryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    query: mockQuerySuccess,
    searchTerm: '',
    selectedQueries: [],
  },
};

export const Running: Story = {
  args: {
    query: mockQueryRunning,
    searchTerm: '',
    selectedQueries: [],
  },
};

export const Error: Story = {
  args: {
    query: mockQueryError,
    searchTerm: '',
    selectedQueries: [],
  },
};

export const WithSearchTerm: Story = {
  args: {
    query: mockQuerySuccess,
    searchTerm: 'cancer',
    selectedQueries: [],
  },
};

export const Selected: Story = {
  args: {
    query: mockQuerySuccess,
    searchTerm: '',
    selectedQueries: [mockQuerySuccess],
  },
};

export const LongTitle: Story = {
  args: {
    query: {
      ...mockQuerySuccess,
      data: {
        ...mockQuerySuccess.data,
        title: 'Very Long Query Title That Might Overflow and Need to be Handled Properly in the UI',
      },
    },
    searchTerm: '',
    selectedQueries: [],
  },
};

export const HighBookmarkCount: Story = {
  args: {
    query: {
      ...mockQuerySuccess,
      data: {
        ...mockQuerySuccess.data,
        bookmark_ids: Array.from({ length: 150 }, (_, i) => `bookmark${i}`),
        note_count: 25,
      },
    },
    searchTerm: '',
    selectedQueries: [],
  },
};

export const NoBookmarks: Story = {
  args: {
    query: {
      ...mockQuerySuccess,
      data: {
        ...mockQuerySuccess.data,
        bookmark_ids: [],
        note_count: 0,
      },
    },
    searchTerm: '',
    selectedQueries: [],
  },
}; 