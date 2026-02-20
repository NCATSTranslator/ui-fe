import { Link } from 'react-router-dom';

export const QueryHistoryArticle = () => {
  return (
    <>
      <p className="caption">Last updated on Feb 5, 2026</p>

      <p>
        All of your past{" "}
        <a href="/submitting-queries">
          queries
        </a>{" "}
        are listed in your Query History. This feature requires an{" "}
        <a href="/account-and-settings">account</a> to use and is only available when{" "}
        <a href="https://auth.ncats.nih.gov/_api/v2/auth/login?redirect_uri=https%3A%2F%2Fui.transltr.io%2Foauth2%2Fredir%2Funa&client=transltr&tenant=transltr&protocol=oidc">
          logged in
        </a>
        .
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
        sidebar or on the{" "}
        <a href="/query-history">Query History page</a>, you can{" "}
        <strong>click on the</strong> ⋮ <strong>icon</strong> on a query entry, select “Add to Project” from the
        dropdown menu, and select a project from the sidebar to add the selected query to.
      </p>

      <p>
        Please note that <strong>removing a query from a project</strong> will not delete the query!
      </p>

      <h2 className="h6">Viewing Queries</h2>

      <p>
        You can access your past queries from both the sidebar Query History tab and from the{" "}
        <a href="/query-history">Query History page</a>. You can access the Query History
        page from the sidebar by clicking “View All.”
      </p>

      <p>
        Each query entry lists the query <strong>subject</strong>, count of <strong>bookmarks and notes</strong>,
        query <strong>type</strong> (only visible on the{" "}
        <a href="/query-history">Query History page</a>), and the{" "}
        <strong>last changed date</strong>. The last changed date is updated when you{" "}
        <Link to="/loading-and-syncing#syncing">sync results</Link>
        , add{" "}
        <Link to="/bookmarks-and-notes#bookmarks">bookmarks</Link>
        , or add{" "}
        <Link to="/bookmarks-and-notes#notes">notes</Link>{" "}
        to a query.
      </p>

      <p>
        You can also <strong>search</strong> for queries using the search bar at the top of the sidebar Query
        History tab or <a href="/query-history">Query History page</a>.
      </p>

      <h2 className="h6">Submitting a New Query</h2>

      <p>
        Click “<strong>Add New Query</strong>” at the top of the{" "}
        <a href="/query-history">Query History page</a> to submit a new query. A new query
        entry will be added to your query history; clicking on the entry will bring you to the results for that
        query.
      </p>

      <p>
        You can learn more about submitting queries{" "}
        <a href="/submitting-queries">
          here
        </a>
        .
      </p>

      <h2 className="h6">Manage Queries</h2>

      <p>
        You can <strong>delete queries</strong> from both the sidebar Query History tab or from the{" "}
        <a href="/query-history">Query History page</a> by{" "}
        <strong>clicking on the</strong> ⋮ <strong>icon</strong> on a query entry and selecting “Delete.” This
        will permanently delete the query and remove it from any projects it has been added to.
      </p>
    </>
  );
};

