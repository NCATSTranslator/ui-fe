# Frontend for NCATS Translator UI 

## Project Status

This project is currently in development. Users can submit queries to the services that power the NCATS Biomedical Data Translator using one of the following templates:
- What drugs may treat _____ (_disease_)
- What chemicals upregulate _____ (_gene_)
- What chemicals downregulate _____ (_gene_)
- What gene is upregulated by _____ (_chemical_)
- What gene is downregulated by _____ (_chemical_)

Results can be filtered and sorted according to several different critera, such as filtering by FDA Approval or sorting by evidence count. Each result consists of a list of paths, which are a discrete series of connected nodes and edges leading from the result item (e.g. a drug) to the object of the query (e.g. a disease). 

## Feature Roadmap

- [ ] Graph View
- [ ] Additional Filtering Facets
- [ ] Migration to Vite from CRA
- [ ] Results CSV Export
- [x] Path View
- [x] Search Term Autocomplete
- [x] Search History
- [x] Sharable Link Generation
- [x] FAQs Page
- [x] Feedback Form -> GH Issue


## Technologies used

Redux/React Redux, React Router, Sass modules, Cytoscape, React Query, Cypress.

## Installation and Setup Instructions

#### Node v17, React v18.2

Clone down this repository. You will need `node` and `npm` installed globally on your machine.  

Installation:
- Run `npm install` inside the root directory of this repo. 

In order to submit queries you'll need a copy of the UI's backend running locally as well. You can find it [here](https://github.com/NCATSTranslator/ui-be). Clone it, then run `npm install` inside its root directory. You can then run `npm run prod` or `npm run dev` depending on your preferred environment.

The last step will be running the following command in the root directory of the ui-fe repo: `npm run build && cp -R  /Path/To/Your/ui-fe/build /Path/To/Your/ui-be`. This will build the frontend, then copy it to the backend repo's root. You should then be able to view the application at `localhost:8386`.

## Project Screen Shot(s)

![Home Page](/src/Assets/Images/screenshot1.png?raw=true "Home Page")

![Example Results](/src/Assets/Images/screenshot2.png?raw=true "Example Results")
