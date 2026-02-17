export const SharingResults = () => {
  return (
    <>
      <p className="caption">Last updated on Feb 5, 2026</p>
      <p>
        We've made it easy to share your Translator results with others without requiring them to{" "}
        <a href="/account-and-settings">log in</a> and recreate your query themselves. You can either share a link to
        an entire result set or generate a link for an individual result.
      </p>
      <p>When you share results, any bookmarks or notes you have added remain private.</p>
      <h2 className="h6" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <svg width="28" height="28" viewBox="0 -3 28 28" fill="#606368" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.475 14.55C4.83195 14.55 3.5 13.218 3.5 11.575C3.5 9.93195 4.83195 8.6 6.475 8.6C7.55719 8.6 8.50442 9.17782 9.025 10.0418L14.6732 7.325C14.593 7.05567 14.55 6.77036 14.55 6.475C14.55 4.83195 15.882 3.5 17.525 3.5C19.168 3.5 20.5 4.83195 20.5 6.475C20.5 8.11805 19.168 9.45 17.525 9.45C16.7144 9.45 15.9795 9.1258 15.4429 8.6L9.45 11.575C9.45 11.8704 9.40696 12.1557 9.3268 12.425L15.4429 15.4C15.9795 14.8742 16.7144 14.55 17.525 14.55C19.168 14.55 20.5 15.882 20.5 17.525C20.5 19.168 19.168 20.5 17.525 20.5C15.882 20.5 14.55 19.168 14.55 17.525C14.55 17.2296 14.593 16.9443 14.6732 16.675L8.55707 13.7C8.02049 14.2258 7.2856 14.55 6.475 14.55Z" 
        stroke="#606368" strokeWidth=".75" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
        Share a Result Set</h2>
      <p>
        To share all results from a query, click the <strong>"Share Result Set"</strong> button at the top of the
        query. This will <strong>generate a shareable link</strong> to the full set of results.
      </p>
      <p>
        You can also generate a link to a result set by <strong>clicking on the</strong> ⋮ <strong>icon</strong> on a
        query in your <a href="/projects">Projects</a> or{" "}
        <a href="/query-history">Query History</a> and selecting <strong>"Share Link"</strong>.
      </p>
      <h2 className="h6" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <svg width="28" height="28" viewBox="0 -3 28 28" fill="#606368" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.475 14.55C4.83195 14.55 3.5 13.218 3.5 11.575C3.5 9.93195 4.83195 8.6 6.475 8.6C7.55719 8.6 8.50442 9.17782 9.025 10.0418L14.6732 7.325C14.593 7.05567 14.55 6.77036 14.55 6.475C14.55 4.83195 15.882 3.5 17.525 3.5C19.168 3.5 20.5 4.83195 20.5 6.475C20.5 8.11805 19.168 9.45 17.525 9.45C16.7144 9.45 15.9795 9.1258 15.4429 8.6L9.45 11.575C9.45 11.8704 9.40696 12.1557 9.3268 12.425L15.4429 15.4C15.9795 14.8742 16.7144 14.55 17.525 14.55C19.168 14.55 20.5 15.882 20.5 17.525C20.5 19.168 19.168 20.5 17.525 20.5C15.882 20.5 14.55 19.168 14.55 17.525C14.55 17.2296 14.593 16.9443 14.6732 16.675L8.55707 13.7C8.02049 14.2258 7.2856 14.55 6.475 14.55Z" 
        stroke="#606368" strokeWidth=".75" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
        Share a Single Result</h2>
      <p>
        To share a specific result, click the <strong>share icon</strong> on the result row to generate a link that{" "}
        <strong>jumps directly to that result</strong> in the result set.
      </p>
    </>
  );
};
