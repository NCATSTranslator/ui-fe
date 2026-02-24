export const BookmarksAndNotes = () => {
  return (
    <>
      <p className="caption">Last updated on Feb 5, 2026</p>

      <p>
        Bookmarks and notes help you keep track of the results you find most valuable for further study. These
        features require an <a href="?tab=t.h00sz275s5md">account</a> to use and are only available when{" "}
        <a href="https://auth.ncats.nih.gov/_api/v2/auth/login?redirect_uri=https%3A%2F%2Fui.transltr.io%2Foauth2%2Fredir%2Funa&client=transltr&tenant=transltr&protocol=oidc">
          logged in
        </a>
        . Your bookmarks and notes are private, and are not made public when you{" "}
        <a href="?tab=t.rqnn6olwo7ei">share links</a> to results or queries.
      </p>

      <span className="hash-anchor" id="bookmarks"></span>

      <h2 className="h6" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <svg width="28" height="28" viewBox="0 -3 28 28" fill="#606368" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.1444 14.3288C11.6589 13.9716 12.3411 13.9716 12.8556 14.3288L16.5 16.8597V6.39421C16.5 6.36386 16.488 6.32591 16.4523 6.29119C16.4151 6.25507 16.356 6.22754 16.2857 6.22754H7.71429C7.64403 6.22754 7.58487 6.25507 7.54772 6.29119C7.51201 6.32591 7.5 6.36386 7.5 6.39421V16.8597L11.1444 14.3288ZM6.7852 19.1823C6.45364 19.4125 6 19.1752 6 18.7716V6.39421C6 5.95218 6.18061 5.52825 6.5021 5.21569C6.82359 4.90313 7.25963 4.72754 7.71429 4.72754H16.2857C16.7404 4.72754 17.1764 4.90313 17.4979 5.21569C17.8194 5.52825 18 5.95218 18 6.39421V18.7716C18 19.1752 17.5464 19.4125 17.2148 19.1823L12 15.5609L6.7852 19.1823Z" 
        stroke="#606368" strokeWidth=".75" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
        Bookmarking Results</h2>

      <p>
        <strong>Select the bookmark icon</strong> that appears on each result row to save the result to your
        bookmarks. To remove a bookmark, simply click the icon again.
      </p>

      <p>
        You can <strong>filter for bookmarked results</strong> from the{" "}
        <a href="/sorting-and-filtering">sidebar Filters tab</a>.
      </p>

      <span className="hash-anchor" id="notes"></span>

      <h2 className="h6" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <svg width="28" height="28" viewBox="0 -3 28 28" fill="#606368" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.9058 8.61281C20.286 8.98854 20.5 9.50083 20.5 10.0354V17C20.5 18.1046 19.6046 19 18.5 19H5.5C4.39543 19 3.5 18.1046 3.5 17L3.5 7C3.5 5.89543 4.39543 5 5.5 5L15.4285 5C15.9548 5 16.4599 5.20748 16.8343 5.57744L19.9058 8.61281ZM18.375 9.2L16.25 7.1V8.7C16.25 8.97614 16.4739 9.2 16.75 9.2H18.375ZM4.91667 16.6C4.91667 17.1523 5.36438 17.6 5.91667 17.6H18.0833C18.6356 17.6 19.0833 17.1523 19.0833 16.6V10.6H16.8333C15.7288 10.6 14.8333 9.70457 14.8333 8.6L14.8333 6.4L5.91667 6.4C5.36438 6.4 4.91667 6.84772 4.91667 7.4L4.91667 16.6Z" stroke="#606368" strokeWidth=".5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M7 15.4167C7 15.7388 7.29848 16 7.66667 16H15.8333C16.2015 16 16.5 15.7388 16.5 15.4167C16.5 15.0945 16.2015 14.8333 15.8333 14.8333H7.66667C7.29848 14.8333 7 15.0945 7 15.4167Z" stroke="#606368" strokeWidth=".5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M7 12.5C7 12.8222 7.29848 13.0833 7.66667 13.0833H15.8333C16.2015 13.0833 16.5 12.8222 16.5 12.5C16.5 12.1778 16.2015 11.9167 15.8333 11.9167H7.66667C7.29848 11.9167 7 12.1778 7 12.5Z" stroke="#606368" strokeWidth=".5" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M7 9.58333C7 9.9055 7.29848 10.1667 7.66667 10.1667H12.5C12.8682 10.1667 13.1667 9.9055 13.1667 9.58333C13.1667 9.26117 12.8682 9 12.5 9H7.66667C7.29848 9 7 9.26117 7 9.58333Z" stroke="#606368" strokeWidth=".5" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
        Adding Notes</h2>

      <p>
        <strong>Select the note icon</strong> that appears on each result row to add a note to the result. Results
        with notes attached to them are <strong>automatically added to your bookmarks</strong>.
      </p>

      <p>
        Your notes are <strong>automatically saved</strong> as you type, but you can also manually save by clicking
        the &quot;Save Note&quot; button. To remove a note, click the note icon again and select the &quot;Clear
        Note&quot; button.
      </p>

      <p>
        You can <strong>filter for results with notes</strong> from the{" "}
        <a href="/sorting-and-filtering">sidebar Filters tab</a>.
      </p>
    </>
  );
};

