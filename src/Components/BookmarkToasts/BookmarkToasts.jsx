import { Link } from 'react-router-dom';

export const BookmarkAddedMarkup = () => (
  <div>
    <h5 className='heading'>Bookmark Added</h5>
    <p>Click <Link to="/workspace" target='_blank' rel='noreferrer'>here</Link> to view this bookmark in your workspace.</p>
  </div>
);
export const BookmarkRemovedMarkup = () => (
  <div>
    <h5 className='heading'>Bookmark Removed</h5>
  </div>
);
export const BookmarkErrorMarkup = () => (
  <div>
    <h5 className='heading'>Error Adding Bookmark</h5>
    <p>We were unable to save this bookmark to your account.</p>
  </div>
);