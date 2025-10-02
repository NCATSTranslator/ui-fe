import { FC } from "react";
import { Link } from "react-router-dom";
import Highlighter from "react-highlight-words";
import styles from "@/features/Sidebar/components/SidebarCard/SidebarCard.module.scss";

interface SidebarCardTitleProps {
  linkTarget?: string;
  linkTo?: string;
  searchTerm?: string;
  title: string;
}

const SidebarCardTitle: FC<SidebarCardTitleProps> = ({
  title,
  searchTerm,
  linkTo,
  linkTarget,
}) => {
  const titleContent = (
    <Highlighter
      highlightClassName="highlight"
      searchWords={searchTerm ? [searchTerm] : []}
      autoEscape={true}
      textToHighlight={title}
    />
  );

  if (linkTo) {
    return (
      <Link 
        className={styles.title} 
        to={linkTo}
        target={linkTarget}
      >
        {titleContent}
      </Link>
    );
  }

  return (
    <div className={styles.title}>
      {titleContent}
    </div>
  );
};

export default SidebarCardTitle;
