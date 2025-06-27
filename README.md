# Frontend for NCATS Translator UI 

## Project Status

This project is currently in development. Users can submit queries to the services that power the NCATS Biomedical Data Translator using one of the following templates:
- What drugs may treat _____ (_disease_)
- What chemicals upregulate _____ (_gene_)
- What chemicals downregulate _____ (_gene_)
- What gene is upregulated by _____ (_chemical_)
- What gene is downregulated by _____ (_chemical_)

Or search for connections between two concepts using a Pathfinder Query.

Results can be filtered and sorted according to several different criteria, such as filtering by FDA Approval or sorting by evidence count. Each result consists of a graph and a list of paths, which are a discrete series of connected nodes and edges leading from the result item (e.g. a drug) to the object of the query (e.g. a disease). Selecting a node in the graph view highlights in the path view all paths that pass through any selected node(s), while deemphasizing the rest. 

## Feature Roadmap

- [ ] Project-based Workflow
- [ ] Power Bar
- [ ] Additional Query Types
- [ ] Additional Facets
- [ ] Graph View Improvements
- [x] Typescript Conversion
- [x] Knowledge Type (Inferred vs Asserted) Edges Display Overhaul
- [x] Facet Exclusion
- [x] Evidence Modal Redesign
- [x] Bookmark & Add Notes To Results
- [x] User Workspace
- [x] User Preferences
- [x] User Login (SSO)
- [x] Migration to Vite from CRA
- [x] Results CSV Export
- [x] Query Submission Redesign
- [x] Graph View
- [x] Path View
- [x] Search Term Autocomplete
- [x] Search History
- [x] Sharable Link Generation
- [x] FAQs Page
- [x] Feedback Form -> GH Issue

## Technologies Used

- **Frontend Framework**: React 18.2 with TypeScript
- **Build Tool**: Vite
- **State Management**: Redux Toolkit with React Redux
- **Routing**: React Router DOM
- **Styling**: Sass modules
- **Graph Visualization**: Cytoscape.js with multiple layout extensions
- **Rich Text Editing**: Lexical
- **Testing**: Cypress for E2E testing, React Testing Library
- **UI Components**: Custom component library with React Toastify, React Tooltip, React Range
- **Data Handling**: React Query, React CSV for exports

## Project Architecture

The project follows a feature-based architecture organized into the following main areas:

### Core Features (`src/features/`)

#### **Common** - Shared UI Components
- **Accordion**: Toggle visibility of child content with animation
- **Alert**: Contextual alerts with auto-dismiss and fading effects
- **AnimateHeight/AutoHeight**: Dynamic height adjustment with animations
- **Autocomplete**: Dynamic search suggestions with pagination
- **Button**: Reusable button components with various styles
- **Checkbox/Radio**: Form input components
- **LoadingBar/LoadingIcon/LoadingWrapper**: Loading state components
- **Modal**: Modal system with various specialized modals (Disclaimer, SendFeedback, NavConfirmation)
- **Range**: Adjustable sliders for numerical input
- **Select**: Dropdown selection component
- **TextCrossfade**: Cycling text with crossfade effects
- **TextEditor**: Rich text editor powered by Lexical
- **TextInput**: Text input component
- **Toggle**: Toggle switch component
- **Tooltip**: Customized tooltip component

#### **Query** - Query Interface Components
- **AutocompleteInput**: Enhanced autocomplete for query terms
- **CombinedQueryInterface**: Main query interface component
- **ExampleQueryList**: Predefined example queries
- **Query**: Core query submission logic
- **QueryBar**: Search bar with autocomplete
- **QueryInputView**: Query input display
- **QueryPathfinder**: Query path visualization
- **QueryResultsHeader**: Results header information
- **QueryResultsView**: Results display view
- **QuerySelect**: Query type selection
- **QueryTypeIcon**: Icons for different query types

#### **ResultItem** - Individual Result Display
- **BookmarkConfirmationModal**: Bookmark confirmation dialog
- **BookmarkToasts**: Toast notifications for bookmark actions
- **GraphLayoutButtons**: Graph layout control buttons
- **GraphView**: Cytoscape graph visualization
- **LastViewedTag**: Tag for recently viewed items
- **NotesModal**: Notes editing modal
- **PathObject**: Individual path node/edge display
- **PathView**: Path list visualization
- **Predicate**: Predicate information display
- **ResultItem**: Main result item container
- **ResultItemInteractables**: Interactive elements for results
- **ResultItemName**: Result name display
- **SupportPath**: Support path visualization
- **SupportPathGroup**: Grouped support paths

#### **ResultList** - Results Management
- **ResultFocusModal**: Focus modal for results
- **ResultList**: Main results list component
- **ResultListHeader**: Results list header
- **ResultListLoadingBar**: Loading progress bar
- **ResultListLoadingButton**: Loading state button
- **ResultListBottomPagination**: Pagination controls
- **ResultListTableHead**: Table header component
- **ResultsSummaryButton**: Results summary button
- **ResultsSummaryModal**: Results summary modal
- **ShareModal**: Results sharing modal
- **StickyToolbar**: Sticky toolbar with actions

#### **ResultFiltering** - Filtering and Facets
- **EntitySearch**: Entity search functionality
- **FacetGroup**: Grouped facet filters
- **FacetHeading**: Facet section headers
- **FacetTag**: Individual facet tags
- **ResultsFilter**: Main filtering interface
- **SelectedFilterTag**: Selected filter display

#### **Evidence** - Evidence Display
- **EvidenceModal**: Evidence information modal
- **EvidenceTables**: Evidence data tables

#### **History** - Query History
- **QueryHistoryList**: Historical query management

#### **Page** - Page Layout Components
- **FAQSidebar**: FAQ navigation sidebar
- **Footer**: Site footer
- **Header**: Site header
- **Page**: Page template wrapper
- **SendFeedbackForm**: Feedback submission form

#### **User-Auth** - User Authentication
- **LoginWarning**: Login requirement warnings
- **UserPreferences**: User preference management

#### **WorkspaceV1** - User Workspace
- **UserSave**: Individual saved result
- **UserSaves**: User's saved results management

### Supporting Directories

- **`src/pageRoutes/`**: Page-level components organized by route
- **`src/redux/`**: Redux store configuration and middleware
- **`src/assets/`**: Static assets including icons, images, and styles
- **`src/testing/`**: Test files and testing utilities

## Installation and Setup Instructions

#### Node v17.x, React v18.2

Clone down this repository. You will need `node` and `npm` installed globally on your machine.  

Installation:
- Run `npm install` inside the root directory of this repo. 

In order to submit queries you'll need a copy of the UI's backend running locally as well. You can find it [here](https://github.com/NCATSTranslator/ui-be). Clone it, then run `npm install` inside its root directory. You can then run `npm run prod` or `npm run dev` depending on your preferred environment.

The last step will be running the following command in the root directory of the ui-fe repo: `npm run build && cp -R  /Path/To/Your/ui-fe/build /Path/To/Your/ui-be`. This will build the frontend, then copy it to the backend repo's root. You should then be able to view the application at `localhost:8386`.

The full feature set will not be accessible without a full docker setup in order to serve the database, which is required to facilitate user login and arbitrary query submission.

## Development Scripts

- `npm start` - Start development server with Vite
- `npm run build` - Build for production
- `npm run serve` - Preview production build
- `npm run analyze` - Analyze bundle size

## Project Screen Shot(s)

![Home Page](/src/assets/images/screenshot1.png?raw=true "Home Page")

![Example Results](/src/assets/images/screenshot2.png?raw=true "Example Results")
