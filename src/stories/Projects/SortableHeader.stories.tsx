import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import SortableHeader from '@/features/Projects/components/SortableHeader/SortableHeader';
import { SortField, SortDirection } from '@/features/Projects/types/projects';

const meta = {
  title: 'Projects/SortableHeader',
  component: SortableHeader,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    field: {
      control: { type: 'select' },
      options: ['name', 'lastSeen', 'dateAdded', 'bookmarks', 'notes', 'status'],
    },
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
    onSort: fn(),
  },
} satisfies Meta<typeof SortableHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    field: 'name',
    children: 'Name',
    sortField: 'name',
    sortDirection: 'asc',
  },
};

export const NotSorted: Story = {
  args: {
    field: 'name',
    children: 'Name',
    sortField: 'lastSeen',
    sortDirection: 'desc',
  },
};

export const Ascending: Story = {
  args: {
    field: 'name',
    children: 'Name',
    sortField: 'name',
    sortDirection: 'asc',
  },
};

export const Descending: Story = {
  args: {
    field: 'name',
    children: 'Name',
    sortField: 'name',
    sortDirection: 'desc',
  },
};

export const LastSeen: Story = {
  args: {
    field: 'lastSeen',
    children: 'Last Seen',
    sortField: 'lastSeen',
    sortDirection: 'desc',
  },
};

export const DateAdded: Story = {
  args: {
    field: 'dateAdded',
    children: 'Date Added',
    sortField: 'dateAdded',
    sortDirection: 'asc',
  },
};

export const Bookmarks: Story = {
  args: {
    field: 'bookmarks',
    children: 'Bookmarks',
    sortField: 'bookmarks',
    sortDirection: 'desc',
  },
};

export const Notes: Story = {
  args: {
    field: 'notes',
    children: 'Notes',
    sortField: 'notes',
    sortDirection: 'asc',
  },
};

export const Status: Story = {
  args: {
    field: 'status',
    children: 'Status',
    sortField: 'status',
    sortDirection: 'desc',
  },
};

export const AllHeaders: Story = {
  args: {
    field: 'name',
    children: 'Name',
    sortField: 'name',
    sortDirection: 'asc',
  },
  render: (args) => (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      <SortableHeader
        field="name"
        sortField="name"
        sortDirection="asc"
        onSort={fn()}
      >
        Name
      </SortableHeader>
      <SortableHeader
        field="lastSeen"
        sortField="name"
        sortDirection="asc"
        onSort={fn()}
      >
        Last Seen
      </SortableHeader>
      <SortableHeader
        field="dateAdded"
        sortField="name"
        sortDirection="asc"
        onSort={fn()}
      >
        Date Added
      </SortableHeader>
      <SortableHeader
        field="bookmarks"
        sortField="name"
        sortDirection="asc"
        onSort={fn()}
      >
        Bookmarks
      </SortableHeader>
      <SortableHeader
        field="notes"
        sortField="name"
        sortDirection="asc"
        onSort={fn()}
      >
        Notes
      </SortableHeader>
      <SortableHeader
        field="status"
        sortField="name"
        sortDirection="asc"
        onSort={fn()}
      >
        Status
      </SortableHeader>
    </div>
  ),
}; 