# Frontend for NCATS Translator UI 

## Project Status

This project is currently in development. Users can submit queries to the services that power the NCATS Biomedical Data Translator using one of the following templates:
- What drugs may treat _____ (_disease_)
- What chemicals upregulate _____ (_gene_)
- What chemicals downregulate _____ (_gene_)
- What gene is upregulated by _____ (_chemical_)
- What gene is downregulated by _____ (_chemical_)

Results can be filtered and sorted according to several different critera, such as filtering by FDA Approval or sorting by evidence count. Each result consists of a graph and a list of paths, which are a discrete series of connected nodes and edges leading from the result item (e.g. a drug) to the object of the query (e.g. a disease). Selecting a node in the graph view highlights in the path view all paths that pass through any selected node(s), while deemphasizing the rest. 

## Feature Roadmap

- [ ] Additional Query Types
- [ ] Additional Facets
- [ ] Typescript Conversion
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


## Technologies used

Redux/React Redux, React Router, Sass modules, Cytoscape, React Query, Cypress.

## Installation and Setup Instructions

#### Node v18.10.0, React v18.2

Clone down this repository. You will need `node` and `npm` installed globally on your machine.  

Installation:
- Run `npm install` inside the root directory of this repo. 

In order to submit queries you'll need a copy of the UI's backend running locally as well. You can find it [here](https://github.com/NCATSTranslator/ui-be). Clone it, then run `npm install` inside its root directory. You can then run `npm run prod` or `npm run dev` depending on your preferred environment.

The last step will be running the following command in the root directory of the ui-fe repo: `npm run build && cp -R  /Path/To/Your/ui-fe/build /Path/To/Your/ui-be`. This will build the frontend, then copy it to the backend repo's root. You should then be able to view the application at `localhost:8386`.

The full feature set will not be accessible without a full docker setup in order to serve the database, which is required to facilitate user login and arbitrary query submission.

## Project Screen Shot(s)

![Home Page](/src/Assets/Images/screenshot1.png?raw=true "Home Page")

![Example Results](/src/Assets/Images/screenshot3.png?raw=true "Example Results")

## Component Breakdown
- **Accordion**: toggles visibility of child content with animation, containing optional navigational links.
- **Alert**: displays contextual alerts with optional automatic dismissal and fading effects, along with customizable positioning, icons, and button text.
- **AnimateHeight**: a wrapper element that adjusts its height with an animation based on a provided height prop.
- **Autocomplete**: a dynamic search suggestion element that displays a list of items with pagination controls, showing more or fewer items as requested, and integrates loading states and error handling.
- **AutoHeight**: a wrapper element that uses a ResizeObserver to dynamically adjust its height to the content's size, encapsulated by the AnimateHeight component for animated height transitions.
- **BookmarkToasts**: provides markup for the various toasts that are shown to the user when they interact with a bookmark-able element.
- **EntitySearch**: provides a search bar, then calls a provided onFilter function once the user presses the Enter key.
- **ExampleQueryList**: displays a provided list of buttons to activate example queries.
- **FAQSidebar**: a sidebar displaying a hierarchical list of provided articles with both internal and external links.
- **Footer**: contains the site footer.
- **FormFields**: provides a collection of stylized form elements such as checkboxes and radio buttons.
- **GraphLayoutButtons**:  lists intractable buttons based on the graph layouts defined in /Utilities/graphFunctions.
- **GraphView**: initializes, displays, and controls a cytoscape graph element based on a provided result.
- **Header**: contains the site header.
- **LoadingBar**: a loading bar component with optional crossfaded text and icon props.
- **LoginComponent**: provides a decorative login page along with a link to SSO login based on variables provided from the config endpoint. 
- **Modals**: contains the various modal window components used on the site, each derived from a main Modal component.
- **OutsideClickHandler**: a wrapper component that executes a callback when a click is detected outside of its child component's bounds.
- **Page**: serves as a template wrapper for different page types.
- **PathObject**: contains the markup and logic to control individual path objects (nodes, edges, etc.) within the PathView component.
- **PathView**: displays a list of paths with their respective PathObjects and facilitates interactions with those objects and their evidence/provenance.
- **Query**: contains logic and markup for query submission, as well as display of information regarding the user’s currently submitted query if provided.
- **QueryBar**: contains the Autocomplete search bar component that facilitates query submission.
- **QueryHistoryList**: manages a historical list of queries with functionality for search, export, and deletion.
- **Range**: provides two adjustable sliders for numerical input within a defined range, displaying the selected value and allowing for a callback function to respond to changes.
- **ResultsFilter**: displays a filtering UI component for a set of results, categorizing tags and managing states for user-defined filter criteria.
- **ResultsItem**: displays the paths, graph and evidence for a given result, along with the various interactions associated with this element and its children.
- **ResultsList**: displays and provides user interactions for a set of results.
- **ResultsListHeader**: displays relevant information at the top of the ResultsList component such as result count, active filters/tags and loading state.
- **ResultsListLoadingButton**: displays an intractable element containing the current status of results polling and a button the user can fetch new results with should some be available. 
- **SmallScreenOverlay**: renders a styled overlay component with instructions for users to switch to a widescreen view for optimal use of the Translator app.
- **Tabs**: contains components for custom tabular UI elements.
- **StickyToolbar**: displays a sticky toolbar that toggles between expanded and collapsed states and includes a loading button, results sharing functionality, and tooltips.
- **TextCrossfade**: cycles through a set of phrases with a crossfade effect at a specified interval.
- **TextEditor**: a user-intractable text editor powered by Lexical that integrates a rich text editor with various plugins for editing features and auto-saving functionality.
- **Tooltip**: a wrapped 'react-tooltip' component with customized appearance and behavior settings.
- **UserPreferences**: manages and persists user preferences through a form interface with conditional rendering based on user state.
- **UserSave**: displays a number of bookmarked results associated with a particular query.
- **UserSaves**: displays and provides user interactions for a given user’s bookmarked results, grouped by query.
