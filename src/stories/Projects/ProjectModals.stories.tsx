import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EditQueryModal from '@/features/Projects/components/EditQueryModal/EditQueryModal';
import ProjectDeleteWarningModal from '@/features/Projects/components/ProjectDeleteWarningModal/ProjectDeleteWarningModal';
import ProjectModals from '@/features/Projects/components/ProjectModals/ProjectModals';
import { Project, UserQueryObject, QueryEditingItem, ProjectRaw } from '@/features/Projects/types/projects.d';

// Mock data
const mockProjects: ProjectRaw[] = [
  {
    id: 1,
    data: {
      pks: ['qid1', 'qid2'],
      title: 'Cancer Research Project',
    },
    time_created: new Date('2024-01-15'),
    time_updated: new Date('2024-01-20'),
    deleted: false,
    save_type: 'project',
    ars_pkey: null,
    label: null,
    notes: null,
    object_ref: null,
    user_id: null,
  },
  {
    id: 2,
    data: {
      pks: ['qid3'],
      title: 'Diabetes Study',
    },
    time_created: new Date('2024-01-10'),
    time_updated: new Date('2024-01-18'),
    deleted: false,
    save_type: 'project',
    ars_pkey: null,
    label: null,
    notes: null,
    object_ref: null,
    user_id: null,
  },
  {
    id: 3,
    data: {
      pks: [],
      title: 'Empty Project',
    },
    time_created: new Date('2024-01-05'),
    time_updated: new Date('2024-01-15'),
    deleted: false,
    save_type: 'project',
    ars_pkey: null,
    label: null,
    notes: null,
    object_ref: null,
    user_id: null,
  },
];

const mockProjectsWithCounts: Project[] = mockProjects.map(p => ({
  ...p,
  bookmark_count: Math.floor(Math.random() * 5),
  note_count: Math.floor(Math.random() * 3),
}));

const mockQueries: UserQueryObject[] = [
  {
    status: 'complete',
    sid: 'sid1',
    data: {
      qid: 'qid1',
      aras: ['ara1', 'ara2'],
      title: 'BRCA1 Gene Query',
      bookmark_ids: ['bookmark1', 'bookmark2'],
      note_count: 2,
      time_created: new Date('2024-01-15'),
      time_updated: new Date('2024-01-18'),
      deleted: false,
      query: {
        type: 'gene',
        curie: 'HGNC:1100',
        direction: 'both',
        subject: { id: 'HGNC:1100', category: 'biolink:Gene' },
      },
    },
  },
  {
    status: 'running',
    sid: 'sid2',
    data: {
      qid: 'qid2',
      aras: ['ara3'],
      title: 'Aspirin Drug Interaction',
      bookmark_ids: ['bookmark3'],
      note_count: 1,
      time_created: new Date('2024-01-16'),
      time_updated: new Date('2024-01-19'),
      deleted: false,
      query: {
        type: 'drug',
        curie: 'CHEMBL:25',
        direction: 'treats',
        subject: { id: 'CHEMBL:25', category: 'biolink:Drug' },
      },
    },
  },
  {
    status: 'error',
    sid: 'sid3',
    data: {
      qid: 'qid3',
      aras: [],
      title: 'TP53 Mutation Analysis',
      bookmark_ids: [],
      note_count: 0,
      time_created: new Date('2024-01-17'),
      time_updated: new Date('2024-01-20'),
      deleted: false,
      query: {
        type: 'gene',
        curie: 'HGNC:11998',
        direction: 'both',
        subject: { id: 'HGNC:11998', category: 'biolink:Gene' },
      },
    },
  },
];

const mockQueryEditingItem: QueryEditingItem = {
  pk: 'qid1',
  name: 'BRCA1 Gene Query',
  type: 'query',
  status: 'editing',
};

const mockDeletePrompts = {
  deleteProjects: { setHideDeletePrompt: fn() },
  deleteQueries: { setHideDeletePrompt: fn() },
  permanentDeleteProject: { setHideDeletePrompt: fn() },
  permanentDeleteQuery: { setHideDeletePrompt: fn() },
  permanentDeleteSelected: { setHideDeletePrompt: fn() },
  emptyTrash: { setHideDeletePrompt: fn() },
};

const mockDeletionHandlers = {
  handleDeleteSelectedProjects: fn(),
  handleDeleteSelectedQueries: fn(),
  handlePermanentDeleteProject: fn(),
  handlePermanentDeleteQuery: fn(),
  handlePermanentDeleteSelected: fn(),
  handleEmptyTrash: fn(),
  handleCancelClosePermanentDeleteProject: fn(),
  handleCancelClosePermanentDeleteQuery: fn(),
  handleCancelClosePermanentDeleteSelected: fn(),
  handleCancelCloseEmptyTrash: fn(),
};

const meta = {
  title: 'Projects/Modals',
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        component: 'A collection of modal components used throughout the Projects feature, including edit query modal, delete confirmation modals, and various warning modals.',
      },
    },
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
      
      return (
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <div style={{ 
              padding: '40px',
              minHeight: '550px',
              backgroundColor: 'rgba(0, 0, 0, 0.5)', // Modal backdrop simulation
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Story />
            </div>
          </BrowserRouter>
        </QueryClientProvider>
      );
    },
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// EditQueryModal Stories
export const EditQueryModalOpen: Story = {
  name: 'Edit Query Modal - Open',
  render: () => (
    <EditQueryModal
      currentEditingQueryItem={mockQueryEditingItem}
      handleClose={fn()}
      isOpen={true}
      loading={false}
      mode="edit"
      projects={mockProjects}
      queries={mockQueries}
    />
  ),
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: 'Modal for editing a query and managing its project associations. This is the largest modal in the Projects feature.',
      },
    },
  },
};

export const EditQueryModalLoading: Story = {
  name: 'Edit Query Modal - Loading',
  render: () => (
    <EditQueryModal
      currentEditingQueryItem={mockQueryEditingItem}
      handleClose={fn()}
      isOpen={true}
      loading={true}
      mode="edit"
      projects={mockProjects}
      queries={mockQueries}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Edit query modal in loading state while projects are being fetched.',
      },
    },
  },
};

export const AddToProjectModal: Story = {
  name: 'Add to Project Modal',
  render: () => (
    <EditQueryModal
      currentEditingQueryItem={mockQueryEditingItem}
      handleClose={fn()}
      isOpen={true}
      loading={false}
      mode="add"
      projects={mockProjects}
      queries={mockQueries}
      setSelectedProject={fn()}
    />
  ),
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: 'Modal for adding a query to an existing project or creating a new project.',
      },
    },
  },
};

// ProjectDeleteWarningModal Stories
export const ProjectDeleteWarning: Story = {
  name: 'Project Delete Warning Modal',
  render: () => (
    <ProjectDeleteWarningModal
      isOpen={true}
      onClose={fn()}
      onConfirm={fn()}
      onCancel={fn()}
      heading="Delete project?"
      content="This project can be recovered from your Trash."
      cancelButtonText="Cancel"
      confirmButtonText="Delete Project"
      setStorageKeyFn={fn()}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Warning modal for confirming project deletion.',
      },
    },
  },
};

// ProjectListModals Stories
export const ProjectListModalsDeleteProjects: Story = {
  name: 'Project List Modals - Delete Projects',
  render: () => (
    <ProjectModals
      modals={{ deleteProjects: true, deleteQueries: false, permanentDeleteProject: false, permanentDeleteQuery: false, permanentDeleteSelected: false, emptyTrash: false }}
      selectedProjects={mockProjectsWithCounts.slice(0, 2)}
      selectedQueries={[]}
      onCloseModal={fn()}
      setSelectedProjects={fn()}
      setSelectedQueries={fn()}
      deletionHandlers={mockDeletionHandlers}
      deletePrompts={mockDeletePrompts}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Modal for confirming deletion of selected projects.',
      },
    },
  },
};

export const ProjectListModalsDeleteQueries: Story = {
  name: 'Project List Modals - Delete Queries',
  render: () => (
    <ProjectModals
      modals={{ deleteProjects: false, deleteQueries: true, permanentDeleteProject: false, permanentDeleteQuery: false, permanentDeleteSelected: false, emptyTrash: false }}
      selectedProjects={[]}
      selectedQueries={mockQueries.slice(0, 2)}
      onCloseModal={fn()}
      setSelectedProjects={fn()}
      setSelectedQueries={fn()}
      deletionHandlers={mockDeletionHandlers}
      deletePrompts={mockDeletePrompts}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Modal for confirming deletion of selected queries.',
      },
    },
  },
};

export const ProjectListModalsPermanentDeleteProject: Story = {
  name: 'Project List Modals - Permanent Delete Project',
  render: () => (
    <ProjectModals
      modals={{ deleteProjects: false, deleteQueries: false, permanentDeleteProject: true, permanentDeleteQuery: false, permanentDeleteSelected: false, emptyTrash: false }}
      selectedProjects={mockProjectsWithCounts.slice(0, 1)}
      selectedQueries={[]}
      onCloseModal={fn()}
      setSelectedProjects={fn()}
      setSelectedQueries={fn()}
      deletionHandlers={mockDeletionHandlers}
      deletePrompts={mockDeletePrompts}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Modal for confirming permanent deletion of a project (cannot be undone).',
      },
    },
  },
};

export const ProjectListModalsPermanentDeleteQuery: Story = {
  name: 'Project List Modals - Permanent Delete Query',
  render: () => (
    <ProjectModals
      modals={{ deleteProjects: false, deleteQueries: false, permanentDeleteProject: false, permanentDeleteQuery: true, permanentDeleteSelected: false, emptyTrash: false }}
      selectedProjects={[]}
      selectedQueries={mockQueries.slice(0, 1)}
      onCloseModal={fn()}
      setSelectedProjects={fn()}
      setSelectedQueries={fn()}
      deletionHandlers={mockDeletionHandlers}
      deletePrompts={mockDeletePrompts}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Modal for confirming permanent deletion of a query (cannot be undone).',
      },
    },
  },
};

export const ProjectListModalsPermanentDeleteSelected: Story = {
  name: 'Project List Modals - Permanent Delete Selected',
  render: () => (
    <ProjectModals
      modals={{ deleteProjects: false, deleteQueries: false, permanentDeleteProject: false, permanentDeleteQuery: false, permanentDeleteSelected: true, emptyTrash: false }}
      selectedProjects={mockProjectsWithCounts.slice(0, 1)}
      selectedQueries={mockQueries.slice(0, 1)}
      onCloseModal={fn()}
      setSelectedProjects={fn()}
      setSelectedQueries={fn()}
      deletionHandlers={mockDeletionHandlers}
      deletePrompts={mockDeletePrompts}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Modal for confirming permanent deletion of selected items (cannot be undone).',
      },
    },
  },
};

export const ProjectListModalsEmptyTrash: Story = {
  name: 'Project List Modals - Empty Trash',
  render: () => (
    <ProjectModals
      modals={{ deleteProjects: false, deleteQueries: false, permanentDeleteProject: false, permanentDeleteQuery: false, permanentDeleteSelected: false, emptyTrash: true }}
      selectedProjects={[]}
      selectedQueries={[]}
      onCloseModal={fn()}
      setSelectedProjects={fn()}
      setSelectedQueries={fn()}
      deletionHandlers={mockDeletionHandlers}
      deletePrompts={mockDeletePrompts}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Modal for confirming emptying the trash (permanently deletes all deleted items).',
      },
    },
  },
};
