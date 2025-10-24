import { FC, FormEvent, RefObject } from "react";
import { Link } from "react-router-dom";
import Highlighter from "react-highlight-words";
import styles from "@/features/Sidebar/components/SidebarCard/SidebarCard.module.scss";
import TextInput from "@/features/Core/components/TextInput/TextInput";

interface SidebarCardTitleProps {
  isRenaming?: boolean;
  onTitleChange?: (value: string) => void;
  onFormSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  textInputRef?: RefObject<HTMLInputElement | null>;
  linkTarget?: string;
  linkTo?: string;
  searchTerm?: string;
  title: string;
}

const SidebarCardTitle: FC<SidebarCardTitleProps> = ({
  isRenaming,
  onTitleChange,
  onFormSubmit,
  textInputRef,
  title,
  searchTerm,
  linkTo,
  linkTarget,
}) => {
  const titleContent = (
    isRenaming && onTitleChange && onFormSubmit ? (
      <form onSubmit={onFormSubmit}>
        <TextInput value={title} handleChange={onTitleChange} iconRightClickToReset ref={textInputRef} className={styles.titleInput}/>
      </form>
    ) : (
      <Highlighter
        highlightClassName="highlight"
        searchWords={searchTerm ? [searchTerm] : []}
        autoEscape={true}
        textToHighlight={title}
      />
    )
  );

  if (linkTo && !isRenaming) {
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
