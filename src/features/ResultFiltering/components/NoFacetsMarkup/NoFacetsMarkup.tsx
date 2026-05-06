import { FC } from "react";
import { useSelector } from "react-redux";
import { currentUser } from "@/features/UserAuth/slices/userSlice";
import { FilterFamily } from "@/features/ResultFiltering/types/filters";
import BookmarkIcon from "@/assets/icons/navigation/Bookmark/Bookmark.svg?react";
import NotesIcon from "@/assets/icons/buttons/Notes/Notes.svg?react";
import styles from '@/features/ResultFiltering/components/FacetGroup/FacetGroup.module.scss';
import { getFormattedLoginURL } from "@/features/UserAuth/utils/userApi";
import { useLocation } from "react-router-dom";

type NoFacetsMarkupProps = {
  chemicalCategorySearchTerm: string;
  filterFamily: FilterFamily;
}

const NoFacetsMarkup: FC<NoFacetsMarkupProps> = ({ chemicalCategorySearchTerm, filterFamily }) => {
  const user = useSelector(currentUser);
  const location = useLocation();
  const isLoggedIn = user !== null;

  if(filterFamily === "sv") {
    return (
      <div className={styles.noResultsContainer}>
        {
          !isLoggedIn
            ? (
              <p className={styles.noResults}><a href={getFormattedLoginURL(location)} className={styles.noResultsLink}>Log In</a> to add Bookmarks and Notes.</p>
            )
            : (
              <>
                <p className={styles.noResultsTitle}>No Bookmarks or Notes</p>
                <p className={styles.noResults}>Clicking these icons next to a result<br/> name will Bookmark it or add a Note.</p>
                <div className={styles.bookmarkNotesIcons}>
                  <BookmarkIcon />
                  <NotesIcon />
                </div>
              </>
            )
        }
      </div>
    )
  }

  return <p className={styles.noResults}>No {filterFamily} matches found for <span className={styles.searchTerm}>"{chemicalCategorySearchTerm}"</span></p>
}

export default NoFacetsMarkup;