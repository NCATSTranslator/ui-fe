export const AccountAndSettings = () => {
  return (
    <>
      <p className="caption">Last updated on Feb 5, 2026</p>
      <p>
        Some Translator features are only available when you are logged in. These include:
      </p>
      <ul>
        <li>
          Entering{" "}
          <a href="/submitting-queries">
            custom query search terms
          </a>
        </li>
        <li>
          Organizing past queries into{" "}
          <a href="/projects-article">
            Projects
          </a>
        </li>
        <li>
          Adding{" "}
          <a href="/bookmarks-and-notes">
            bookmarks and notes
          </a>{" "}
          to query results
        </li>
      </ul>

      <h2 className="h6">Logging In and Managing Display Preferences</h2>
      <p>
        To{" "}
        <a href="https://auth.ncats.nih.gov/_api/v2/auth/login?redirect_uri=https%3A%2F%2Fui.transltr.io%2Foauth2%2Fredir%2Funa&client=transltr&tenant=transltr&protocol=oidc">
          log in
        </a>{" "}
        to Translator, click the <strong>Account Settings</strong> tab at the bottom of the sidebar. After
        selecting <strong>Log In</strong>, you will be prompted to choose an account to sign in with. After
        signing in, you will be automatically redirected back to the page you were on.
      </p>
      <p>
        While logged in, you can also <strong>edit your display preferences</strong> from the Account Settings
        tab. Changes that you make here are automatically applied each time you access your{" "}
        <a href="/projects-article">
          projects
        </a>{" "}
        or{" "}
        <a href="/query-history-article">
          queries
        </a>{" "}
        while logged in to your account.
      </p>

      <h2 className="h6">Logging Out</h2>
      <p>
        To log out of Translator, click the <strong>Account Settings</strong> tab at the bottom of the sidebar
        again and select <strong>Log Out</strong>. You will be signed out and any features requiring an account
        will be unavailable until you{" "}
        <a href="https://auth.ncats.nih.gov/_api/v2/auth/login?redirect_uri=https%3A%2F%2Fui.transltr.io%2Foauth2%2Fredir%2Funa&client=transltr&tenant=transltr&protocol=oidc">
          log in
        </a>{" "}
        again.
      </p>

      <h2 className="h6">Accessing Projects and Query History</h2>
      <p>
        After logging in, you can quickly access your{" "}
        <a href="/projects-article">
          Projects
        </a>{" "}
        and{" "}
        <a href="/query-history-article">
          Query History
        </a>{" "}
        from their respective tabs on the sidebar. You will also be able to view how many bookmarks or notes you
        have added to your query results.
      </p>
    </>
  );
};

