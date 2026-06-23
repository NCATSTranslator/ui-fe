# Frontend for NCATS Translator UI

## Project Status

This project is currently in development. Users can submit queries to the services that power the NCATS Biomedical Data Translator using one of the following templates:

- What drugs may impact _____ (_disease_)
- What chemicals upregulate _____ (_gene_)
- What chemicals downregulate _____ (_gene_)
- What gene is upregulated by _____ (_chemical_)
- What gene is downregulated by _____ (_chemical_)

Or search for connections between two concepts using a Pathfinder Query.

Results can be filtered and sorted according to several different criteria, such as filtering by FDA Approval or sorting by evidence count. Each result consists of a graph and a list of paths, which are a discrete series of connected nodes and edges leading from the result item (e.g. a drug) to the object of the query (e.g. a disease). Selecting a node in the graph view highlights in the path view all paths that pass through any selected node(s), while deemphasizing the rest.

Logged-in users can organize work with **Projects**, drag queries from the sidebar into projects, and manage query history from a dedicated page. A collapsible **Sidebar** provides contextual panels for filters, project management, query status, result downloads, settings, help, and feedback. Result detail pages support nested views for individual nodes, paths, and relationship evidence.

## Technologies Used

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **State Management**: Redux Toolkit with React Redux (user session and UI state); TanStack React Query for server state
- **Routing**: React Router DOM v7 with nested routes, loaders, and breadcrumbs
- **Styling**: Sass modules
- **Graph Visualization**: translator-graph-view (React Flow + ELK layout engine)
- **Drag and Drop**: @dnd-kit
- **Rich Text Editing**: Lexical
- **Testing**: Vitest with React Testing Library; Playwright for end-to-end tests
- **Component Development**: Storybook
- **UI Components**: Custom Core component library with React Toastify, React Tooltip, React Range, and React Select
- **Data Handling**: TanStack React Query, React CSV for exports

## Project Architecture

The project follows a feature-based architecture. Each feature under `src/features/` owns its components, hooks, types, and utilities. Page-level route components live in `src/pageRoutes/`.

### Core Features (`src/features/`)

#### **Core** — Shared UI, Hooks, and Utilities

Foundation layer used across the app. Includes reusable components (Accordion, Alert, Autocomplete, Button, Checkbox, Modal, Select, Tabs, TextEditor, TextInput, Toggle, Tooltip, and others), shared hooks (analytics, window size, scroll-to-hash, feedback form), and utility modules (class helpers, date/string formatters, sorting, URL helpers).

#### **Query** — Query Interface

Query submission and input: CombinedQueryInterface (preset and Pathfinder tabs), AutocompleteInput, ExampleQueryList, QueryBar, QueryPathfinder, and query type selection components.

#### **QueryList** — Query List Display

Reusable query list component used in history and sidebar contexts.

#### **ResultGraphView** — Graph Visualization

Interactive graph powered by translator-graph-view, with layout controls and hover tooltips.

#### **ResultItem** — Individual Result Display

Result cards, path and graph views, bookmarks, notes, predicates, and result detail layouts.

#### **ResultList** — Results Management

Results table, pagination, sticky toolbar, sharing, summary modals, and loading states.

#### **ResultFiltering** — Filtering and Facets

Facet groups, entity search, filter tags, and the main results filter interface.

#### **ResultDownload** — Result Export

Sidebar panel for downloading result data as CSV.

#### **Evidence** — Evidence Display

Evidence views with tabbed tables for publications, clinical trials, and knowledge sources, plus pagination and path-context sections.

#### **NodeInformationView** — Node Detail Pages

Detail view for individual nodes within a result, including clinical trial annotations.

#### **History** — Query History

QueryHistoryList for browsing past queries.

#### **Projects** — Project Management

Create and manage projects, organize queries with drag-and-drop, edit query metadata, and handle project-level modals and error states.

#### **Sidebar** — App Navigation and Context Panels

Collapsible sidebar with link navigation and contextual panels: Queries, Projects, Filters, Query Status, Result Download, Settings, Help, and Feedback.

#### **DragAndDrop** — Drag-and-Drop Primitives

Reusable DraggableCard and DroppableArea components built on @dnd-kit, used for dragging queries into projects.

#### **Navigation** — Routing and Breadcrumbs

Breadcrumb labels, path redirects, view transitions, and route loader utilities.

#### **Page** — Page Layout

Header, Footer, Page and HelpPage wrappers, HelpSidebar, and SendFeedbackForm.

#### **UserAuth** — Authentication and Preferences

Login warnings, user session state (Redux slice), and user preference API utilities.

### Supporting Directories

- **`src/pageRoutes/`**: Page-level components organized by route (Home, Results, Projects, History, New Query, help articles, and others)
- **`src/redux/`**: Redux store configuration, listener middleware, and selectors
- **`src/assets/`**: Static assets including icons, images, and global styles
- **`src/test/`**: Vitest setup and shared test utilities
- **`e2e/`**: Playwright end-to-end tests
- **`src/stories/`**: Storybook stories for Core components

## Installation and Setup Instructions

#### Node v17.x, React v19

Clone down this repository. You will need `node` and `npm` installed globally on your machine.

Installation:

- Run `npm install` inside the root directory of this repo.
- Copy the ELK layout web worker into the public directory:
  ```
  cp node_modules/elkjs/lib/elk-worker.min.js public/elk-worker.min.js
  ```

In order to submit queries you'll need a copy of the UI's backend running locally as well. You can find it [here](https://github.com/NCATSTranslator/ui-be). Clone it, then run `npm install` inside its root directory. You can then run `npm run prod` or `npm run dev` depending on your preferred environment.

The last step will be running the following command in the root directory of the ui-fe repo: `npm run build && cp -R /Path/To/Your/ui-fe/build /Path/To/Your/ui-be`. This will build the frontend, then copy it to the backend repo's root. You should then be able to view the application at `localhost:8386`.

The full feature set will not be accessible without a full docker setup in order to serve the database, which is required to facilitate user login and arbitrary query submission.

For local frontend-only development, run `npm start` to launch the Vite dev server.

## Development Scripts

- `npm start` — Start development server with Vite
- `npm run build` — Type-check and build for production
- `npm run serve` — Preview production build
- `npm run analyze` — Analyze bundle size
- `npm test` — Run unit tests with Vitest
- `npm run test:watch` — Run Vitest in watch mode
- `npm run test:coverage` — Run Vitest with coverage
- `npm run test:e2e` — Run Playwright end-to-end tests
- `npm run test:e2e:ui` — Run Playwright tests with UI
- `npm run storybook` — Start Storybook component dev server
- `npm run build-storybook` — Build Storybook for deployment
- `npm run check-import-casing` — Verify import path casing consistency

## Project Screen Shot(s)

![Home Page](/src/assets/images/screenshot1.png?raw=true "Home Page")

![Example Results](/src/assets/images/screenshot2.png?raw=true "Example Results")
