import { Link } from 'react-router-dom';

export const ProjectsArticle = () => {
  return (
    <>
      <p className="caption">Last updated on Feb 5, 2026</p>

      <p>
        Projects allow you to group and organize your queries. This feature requires an{" "}
        <a href="/account-and-settings">account</a> to use and is only available when{" "}
        <a href="https://auth.ncats.nih.gov/_api/v2/auth/login?redirect_uri=https%3A%2F%2Fui.transltr.io%2Foauth2%2Fredir%2Funa&client=transltr&tenant=transltr&protocol=oidc">
          logged in
        </a>
        .
      </p>

      <h2 className="h6">Creating Projects</h2>

      <p>
        Click “<strong>Create New Project</strong>“ on the sidebar Projects tab or from the{" "}
        <a href="/projects">Projects page</a> to add a new project to your list. A new
        project entry will be added to your project list with the project name field active for immediate
        renaming.
      </p>

      <h2 className="h6">Adding Queries to Projects</h2>

      <p>There are multiple ways to populate projects.</p>

      <p>
        While <strong>submitting a new query</strong>, you can click “Add to Project” above the search field and
        select a project in the sidebar Projects tab to add the new query to.
      </p>

      <p>
        While <strong>viewing a project</strong> with the sidebar Query History tab open, you can{" "}
        <strong>drag and drop queries into a project</strong>. You can also click the “Add New Query” button
        above the project’s query list to submit a new query and add it directly into the project.
      </p>

      <p>
        While <strong>viewing query results</strong>, you can click the “Add to Project” button at the top of the
        page and select a project in the sidebar Projects tab to add the current query to.
      </p>

      <p>
        While <strong>viewing your </strong>
        <a href="/query-history">Query History page</a> with the sidebar Projects tab open,
        you can <strong>drag and drop queries into a project</strong>. While viewing your Query History in the
        sidebar or on the <a href="/query-history">Query History page</a>, you can{" "}
        <strong>click on the</strong> ⋮ <strong>icon</strong> on a query entry, select “Add to Project” from the
        dropdown menu, and select a project from the sidebar to add the selected query to.
      </p>

      <p>
        Please note that <strong>removing a query from a project</strong> will not delete the query!
      </p>

      <h2 className="h6">Viewing Projects</h2>

      <p>
        You can access your projects from both the sidebar Projects tab and from the{" "}
        <a href="/projects">Projects page</a>. You can access the Projects page from the
        sidebar by clicking “View All.”
      </p>

      <p>
        Each project entry lists the project <strong>name</strong>, count of <strong>bookmarks and notes</strong>
        , number of <strong>queries</strong> included in the project, and the <strong>last changed date</strong>{" "}
        (only visible on the <a href="/projects">Projects page</a>). The last changed date
        is updated when you add a query to the project,{" "}
        <Link to="/loading-and-syncing#syncing">
          sync results
        </Link>
        , add{" "}
        <Link to="/bookmarks-and-notes#bookmarks">
          bookmarks
        </Link>
        , or add{" "}
        <Link to="/bookmarks-and-notes#notes">
          notes
        </Link>{" "}
        to a query in a project, or when you rename a project.
      </p>

      <p>
        You can also <strong>search</strong> for projects using the search bar at the top of the sidebar Projects
        tab or <a href="/projects">Projects page</a>.
      </p>

      <h2 className="h6">Manage Projects</h2>

      <p>
        You can <strong>rename or delete projects</strong> from both the sidebar Projects tab or from the{" "}
        <a href="/projects">Projects page</a> by <strong>clicking on the</strong> ⋮{" "}
        <strong>icon</strong> on a project entry. Selecting “Rename” will change the project name into a text
        field, and clicking anywhere outside of the field will save your changes. Selecting “Delete” will
        permanently delete the project, but queries you’ve added to the project will not be removed from your{" "}
        <a href="query-history-article">Query History</a>.
      </p>
    </>
  );
};

