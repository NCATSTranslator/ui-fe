import { Link } from 'react-router-dom';

export const LoadingAndSyncing = () => {
  return (
    <>
      <p className="caption">Last updated on Feb 5, 2026</p>

      <p>
        Translator uses three independent{" "}
        <Link to="/about-translator#reasoning-agents">agents</Link> to reason about possible answers to each query.
        These agents use different methods to return data, which leads to results being loaded incrementally.
      </p>

      <p>
        While you are waiting for queries to load, you can{" "}
        <a href="/new-query">submit another query</a> or review your past queries in your{" "}
        <a href="/projects">Projects</a> and{" "}
        <a href="/query-history">Query History</a>. Leaving the loading page will not cancel your query, and
        results will continue to load in the background.
      </p>

      <span className="hash-anchor" id="loading"></span>

      <h2 className="h6">Loading</h2>

      <p>
        Because Translator’s{" "}
        <Link to="/about-translator#reasoning-agents">reasoning agents</Link> analyze data at varying speeds,{" "}
        <strong>some Translator results are returned faster than others</strong>. To reduce your time spent waiting for
        all results to be returned, we <strong>display these results first</strong> as we fetch the slower responses. As
        additional data is retrieved, you’ll be prompted to <strong>sync your query results to get the most complete
        information</strong>.
      </p>

      <span className="hash-anchor" id="syncing"></span>

      <h2 className="h6" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <g clip-path="url(#clip0_2686_2200)">
    <path d="M11.6014 21.1542C7.21875 20.7045 3.80001 17.0015 3.80001 12.5C3.80001 12.2587 3.80984 12.0196 3.82911 11.7832C3.2121 11.6196 2.6311 11.3674 2.10052 11.0413C2.03426 11.518 2.00001 12.005 2.00001 12.5C2.00001 17.9959 6.22253 22.5057 11.6004 22.962C12.0957 23.004 12.5 22.5971 12.5 22.1C12.5 21.6029 12.0959 21.2049 11.6014 21.1542Z" fill="url(#paint0_linear_2686_2200)"/>
    <path d="M4.08162 10.296C4.87369 7.26224 7.26224 4.87369 10.296 4.08161C10.1189 3.48208 9.83253 2.92946 9.45988 2.44684C6.10561 3.45983 3.45983 6.10562 2.44685 9.45989C2.92947 9.83254 3.48209 10.1189 4.08162 10.296Z" fill="#CC2E46"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M10.5 5.5C10.5 8.26142 8.26142 10.5 5.5 10.5C5.00732 10.5 4.53128 10.4287 4.08162 10.296C4.87369 7.26224 7.26224 4.87369 10.296 4.08161C10.4287 4.53127 10.5 5.00731 10.5 5.5ZM0.5 5.5C0.5 7.11183 1.26268 8.54553 2.44685 9.45989C3.45983 6.10562 6.10561 3.45983 9.45988 2.44684C8.54552 1.26268 7.11183 0.5 5.5 0.5C2.73858 0.5 0.5 2.73858 0.5 5.5Z" fill="#CC2E46"/>
    <path d="M12.5 3.79999C17.3049 3.79999 21.2 7.69512 21.2 12.5C21.2 16.993 18.0364 20.6905 13.6963 21.1516C13.2028 21.204 12.8 21.6016 12.8 22.0978C12.8 22.5957 13.2058 23.0032 13.7019 22.9596C19.0401 22.4898 23 17.9863 23 12.5C23 6.701 18.299 1.99999 12.5 1.99999C12.005 1.99999 11.518 2.03425 11.0412 2.10051C11.3674 2.63109 11.6196 3.21209 11.7832 3.8291C12.0196 3.80982 12.2587 3.79999 12.5 3.79999Z" fill="url(#paint1_linear_2686_2200)"/>
  </g>
  <defs>
    <linearGradient id="paint0_linear_2686_2200" x1="11" y1="-1" x2="11" y2="22.965" gradientUnits="userSpaceOnUse">
      <stop stop-color="#662E6B" stop-opacity="0"/>
      <stop offset="1" stop-color="#662E6B"/>
    </linearGradient>
    <linearGradient id="paint1_linear_2686_2200" x1="11" y1="-1" x2="11" y2="22.965" gradientUnits="userSpaceOnUse">
      <stop stop-color="#662E6B" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#662E6B" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="clip0_2686_2200">
      <rect width="24" height="24" fill="white"/>
    </clipPath>
  </defs>
</svg>Syncing</h2>

      <p>
      Syncing results once your query is fully loaded ensures that you have the most comprehensive data in your
      results. When there are new results available to sync after the initial load, a <strong>notification</strong> will
        appear on the status indicator in the sidebar Loading Status tab. Clicking the{" "}
        <strong>“Sync New Results”</strong> button in this tab will refresh the page and load new data.
      </p>

      <p>
        <em>
          Please note that syncing may reorder your results and update the paths and evidence in results you may have
          already seen.
        </em>
      </p>

      <p>
        You may be prompted to <strong>sync results multiple times</strong> until the query is 100% loaded. Once all
        reasoning agents have returned their results, you’ll need to <strong>sync one final time</strong>.
      </p>

      <p>
        If you prefer not to risk reordering results or missing out on new paths and evidence, you can also{" "}
        <strong>wait to sync until all of the results are returned</strong>. While you’re waiting, you’re welcome to
        submit another query or explore your bookmarked results and notes in your{" "}
        <a href="/projects">Projects</a> and{" "}
        <a href="/query-history">Query History</a>.
      </p>
    </>
  );
};

